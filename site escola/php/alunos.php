<?php
require_once __DIR__ . '/config.php';

function alunos_list(): void {
    $u = require_login();
    $sql = "
        SELECT a.*, t.nome AS turma_nome, c.nome AS curso_nome
        FROM alunos a
        LEFT JOIN turmas t ON t.id = a.turma_id
        LEFT JOIN cursos c ON c.id = a.curso_id
    ";
    if ($u['perfil'] === 'aluno') {
        $stmt = db()->prepare($sql . ' WHERE a.id = ? ORDER BY a.nome');
        $stmt->execute([(int)$u['ref_id']]);
        $rows = $stmt->fetchAll();
    } elseif ($u['perfil'] === 'responsavel') {
        $stmt = db()->prepare($sql . ' WHERE a.id IN (SELECT aluno_id FROM responsaveis WHERE id = ?) ORDER BY a.nome');
        $stmt->execute([(int)$u['ref_id']]);
        $rows = $stmt->fetchAll();
    } elseif (in_array($u['perfil'], ['diretor', 'coordenador', 'professor'], true)) {
        $rows = db()->query($sql . ' ORDER BY a.nome')->fetchAll();
    } else {
        json_err('Sem permissão', 403);
    }
    json_ok($rows);
}

function alunos_contas_pendentes(): void {
    $u = require_login();
    if ($u['perfil'] !== 'professor') json_err('Sem permissao', 403);
    $rows = db()->query("SELECT id, nome, email FROM usuarios WHERE perfil='aluno' AND ref_id=0 AND ativo=1 ORDER BY nome")->fetchAll();
    json_ok($rows);
}

function alunos_vincular_conta(): void {
    $u = require_login();
    if ($u['perfil'] !== 'professor') json_err('Sem permissao', 403);
    $in = input();
    $usuarioId = (int)($in['usuario_id'] ?? 0);
    $turmaId = (int)($in['turma_id'] ?? 0);
    if (!$usuarioId || !$turmaId) json_err('Selecione a conta e a turma.');

    $pdo = db();
    $turma = $pdo->prepare('SELECT t.curso_id FROM turmas t INNER JOIN turma_professor tp ON tp.turma_id=t.id WHERE t.id=? AND tp.professor_id=? AND t.ativo=1');
    $turma->execute([$turmaId, (int)$u['ref_id']]);
    $turmaData = $turma->fetch();
    if (!$turmaData) json_err('Essa turma nao esta vinculada ao seu perfil.', 403);

    try {
        $pdo->beginTransaction();
        $contaStmt = $pdo->prepare("SELECT id,nome,email FROM usuarios WHERE id=? AND perfil='aluno' AND ref_id=0 AND ativo=1 FOR UPDATE");
        $contaStmt->execute([$usuarioId]);
        $conta = $contaStmt->fetch();
        if (!$conta) { $pdo->rollBack(); json_err('A conta ja foi vinculada ou nao esta disponivel.', 409); }

        $alunoStmt = $pdo->prepare('SELECT id,turma_id FROM alunos WHERE email=? LIMIT 1 FOR UPDATE');
        $alunoStmt->execute([$conta['email']]);
        $aluno = $alunoStmt->fetch();
        if ($aluno && $aluno['turma_id'] && (int)$aluno['turma_id'] !== $turmaId) {
            $pdo->rollBack();
            json_err('Este e-mail ja esta cadastrado em outra turma. Peça a coordenacao para conferir o cadastro.', 409);
        }

        if ($aluno) {
            $alunoId = (int)$aluno['id'];
            $pdo->prepare("UPDATE alunos SET turma_id=?,curso_id=?,situacao='Ativo' WHERE id=?")
                ->execute([$turmaId,(int)$turmaData['curso_id'],$alunoId]);
        } else {
            $baseMatricula = 'WEB' . $usuarioId;
            $matricula = $baseMatricula;
            $sufixo = 1;
            $checkMatricula = $pdo->prepare('SELECT 1 FROM alunos WHERE matricula=?');
            while (true) {
                $checkMatricula->execute([$matricula]);
                if (!$checkMatricula->fetchColumn()) break;
                $matricula = substr($baseMatricula, 0, 15) . '-' . $sufixo++;
            }
            $pdo->prepare("INSERT INTO alunos (matricula,nome,email,turma_id,curso_id,situacao) VALUES (?,?,?,?,?,'Ativo')")
                ->execute([$matricula,$conta['nome'],$conta['email'],$turmaId,(int)$turmaData['curso_id']]);
            $alunoId = (int)$pdo->lastInsertId();
        }
        $pdo->prepare("UPDATE usuarios SET ref_id=? WHERE id=? AND perfil='aluno' AND ref_id=0")
            ->execute([$alunoId,$usuarioId]);
        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($e->getCode() === '23000') json_err('Nao foi possivel vincular: matricula ou e-mail ja cadastrado.', 409);
        throw $e;
    }
    json_ok(['aluno_id' => $alunoId], 'Aluno vinculado a turma. Peça ao aluno para entrar novamente na conta.');
}

function alunos_get(): void {
    $u = require_login();
    $id = (int)($_GET['id'] ?? 0);
    if (!can_access_student($u, $id)) json_err('Sem permissão', 403);
    $stmt = db()->prepare("SELECT a.*, t.nome AS turma_nome, c.nome AS curso_nome FROM alunos a LEFT JOIN turmas t ON t.id=a.turma_id LEFT JOIN cursos c ON c.id=a.curso_id WHERE a.id = ?");
    $stmt->execute([$id]);
    json_ok($stmt->fetch() ?: null);
}

function alunos_save(): void {
    if (!perm('manage_school')) json_err('Sem permissao', 403);
    $in = input();
    $required = ['matricula','nome','email','turma_id','curso_id'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatorio");

    $id = (int)($in['id'] ?? 0);
    $email = strtolower(trim((string)$in['email']));
    $matricula = trim((string)$in['matricula']);
    $nome = trim((string)$in['nome']);
    $turmaId = (int)$in['turma_id'];
    $cursoId = (int)$in['curso_id'];
    $situacao = $in['situacao'] ?? 'Ativo';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Informe um e-mail valido.');

    $pdo = db();
    try {
        $pdo->beginTransaction();
        if ($id) {
            $studentCheck = $pdo->prepare('SELECT id FROM alunos WHERE id=? FOR UPDATE');
            $studentCheck->execute([$id]);
            if (!$studentCheck->fetchColumn()) { $pdo->rollBack(); json_err('Aluno nao encontrado.', 404); }
            $pdo->prepare('UPDATE alunos SET matricula=?,nome=?,email=?,turma_id=?,curso_id=?,situacao=? WHERE id=?')
                ->execute([$matricula,$nome,$email,$turmaId,$cursoId,$situacao,$id]);
            $alunoId = $id;
        } else {
            // Recover a student row left behind by an earlier failed account insert.
            $existingStudentStmt = $pdo->prepare('SELECT id FROM alunos WHERE email=? LIMIT 1 FOR UPDATE');
            $existingStudentStmt->execute([$email]);
            $existingStudentId = (int)($existingStudentStmt->fetchColumn() ?: 0);
            if ($existingStudentId) {
                $pdo->prepare('UPDATE alunos SET matricula=?,nome=?,turma_id=?,curso_id=?,situacao=? WHERE id=?')
                    ->execute([$matricula,$nome,$turmaId,$cursoId,$situacao,$existingStudentId]);
                $alunoId = $existingStudentId;
            } else {
                $pdo->prepare('INSERT INTO alunos (matricula,nome,email,turma_id,curso_id,situacao) VALUES (?,?,?,?,?,?)')
                    ->execute([$matricula,$nome,$email,$turmaId,$cursoId,$situacao]);
                $alunoId = (int)$pdo->lastInsertId();
            }
        }

        $userStmt = $pdo->prepare('SELECT id,perfil,ref_id FROM usuarios WHERE email=? LIMIT 1 FOR UPDATE');
        $userStmt->execute([$email]);
        $user = $userStmt->fetch();
        if ($user) {
            if ($user['perfil'] !== 'aluno' || ((int)$user['ref_id'] !== 0 && (int)$user['ref_id'] !== $alunoId)) {
                $pdo->rollBack();
                json_err('Este e-mail ja esta vinculado a outra conta escolar.', 409);
            }
            $pdo->prepare("UPDATE usuarios SET nome=?,ref_id=?,ativo=1 WHERE id=? AND perfil='aluno'")
                ->execute([$nome,$alunoId,(int)$user['id']]);
        } else {
            $senha = $in['senha'] ?? '123';
            $hash = password_hash($senha, PASSWORD_DEFAULT);
            $pdo->prepare("INSERT INTO usuarios (email,senha,perfil,nome,ref_id,ativo) VALUES (?,?,'aluno',?,?,1)")
                ->execute([$email,$hash,$nome,$alunoId]);
        }
        $pdo->commit();
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($e->getCode() === '23000') json_err('Matricula ou e-mail ja cadastrado em outro aluno.', 409);
        throw $e;
    }
    json_ok(['id' => $alunoId], 'Aluno salvo e conta vinculada');
}
function alunos_delete(): void {
    if (!perm('manage_school')) json_err('Sem permissão', 403);
    $in = input();
    $id = (int)($in['id'] ?? 0);
    db()->prepare("DELETE FROM alunos WHERE id = ?")->execute([$id]);
    db()->prepare("DELETE FROM usuarios WHERE ref_id = ? AND perfil = 'aluno'")->execute([$id]);
    json_ok(null, 'Aluno excluído');
}
