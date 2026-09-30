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

function alunos_get(): void {
    $u = require_login();
    $id = (int)($_GET['id'] ?? 0);
    if (!can_access_student($u, $id)) json_err('Sem permissão', 403);
    $stmt = db()->prepare("SELECT * FROM alunos WHERE id = ?");
    $stmt->execute([$id]);
    json_ok($stmt->fetch() ?: null);
}

function alunos_save(): void {
    if (!perm('manage_school')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['matricula','nome','email','turma_id','curso_id'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        $stmt = db()->prepare("UPDATE alunos SET matricula=?, nome=?, email=?, turma_id=?, curso_id=?, situacao=? WHERE id=?");
        $stmt->execute([$in['matricula'],$in['nome'],$in['email'],(int)$in['turma_id'],(int)$in['curso_id'],$in['situacao']??'Ativo',$id]);
        db()->prepare("UPDATE usuarios SET email=?, nome=? WHERE ref_id=? AND perfil='aluno'")
            ->execute([$in['email'],$in['nome'],$id]);
    } else {
        $senha = $in['senha'] ?? '123';
        $stmt = db()->prepare("INSERT INTO alunos (matricula,nome,email,turma_id,curso_id,situacao) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$in['matricula'],$in['nome'],$in['email'],(int)$in['turma_id'],(int)$in['curso_id'],$in['situacao']??'Ativo']);
        $newId = (int)db()->lastInsertId();
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        db()->prepare("INSERT INTO usuarios (email,senha,perfil,nome,ref_id) VALUES (?,?,?,?,?)")
            ->execute([$in['email'],$hash,'aluno',$in['nome'],$newId]);
    }
    json_ok(null, 'Aluno salvo');
}

function alunos_delete(): void {
    if (!perm('manage_school')) json_err('Sem permissão', 403);
    $in = input();
    $id = (int)($in['id'] ?? 0);
    db()->prepare("DELETE FROM alunos WHERE id = ?")->execute([$id]);
    db()->prepare("DELETE FROM usuarios WHERE ref_id = ? AND perfil = 'aluno'")->execute([$id]);
    json_ok(null, 'Aluno excluído');
}
