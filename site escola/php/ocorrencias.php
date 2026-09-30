<?php
require_once __DIR__ . '/config.php';

function ocorrencias_list(): void {
    $u = require_login();
    $sql = "
        SELECT o.*, a.nome AS aluno_nome, t.nome AS turma_nome
        FROM ocorrencias o
        LEFT JOIN alunos a ON a.id = o.aluno_id
        LEFT JOIN turmas t ON t.id = a.turma_id
    ";
    if ($u['perfil'] === 'aluno') {
        $stmt = db()->prepare($sql . ' WHERE o.aluno_id = ? ORDER BY o.data DESC');
        $stmt->execute([(int)$u['ref_id']]);
        $rows = $stmt->fetchAll();
    } elseif ($u['perfil'] === 'responsavel') {
        $stmt = db()->prepare($sql . ' WHERE o.aluno_id IN (SELECT aluno_id FROM responsaveis WHERE id = ?) ORDER BY o.data DESC');
        $stmt->execute([(int)$u['ref_id']]);
        $rows = $stmt->fetchAll();
    } elseif (in_array($u['perfil'], ['diretor', 'coordenador', 'professor'], true)) {
        $rows = db()->query($sql . ' ORDER BY o.data DESC')->fetchAll();
    } else {
        json_err('Sem permissão', 403);
    }
    json_ok($rows);
}

function ocorrencias_get(): void {
    $u = require_login();
    $stmt = db()->prepare("SELECT * FROM ocorrencias WHERE id = ?");
    $stmt->execute([(int)($_GET['id'] ?? 0)]);
    $row = $stmt->fetch();
    if ($row && !can_access_student($u, (int)$row['aluno_id'])) json_err('Sem permissão', 403);
    json_ok($row ?: null);
}

function ocorrencias_save(): void {
    if (!perm('manage_occurrences')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['aluno_id','tipo','descricao','data'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $u = require_login();
    $id = (int)($in['id'] ?? 0);
    if ($id) {
        db()->prepare("UPDATE ocorrencias SET aluno_id=?, tipo=?, descricao=?, observacoes=?, data=? WHERE id=?")
            ->execute([(int)$in['aluno_id'],$in['tipo'],$in['descricao'],$in['observacoes']??'',$in['data'],$id]);
    } else {
        db()->prepare("INSERT INTO ocorrencias (aluno_id,tipo,descricao,observacoes,data,registrado_por) VALUES (?,?,?,?,?,?)")
            ->execute([(int)$in['aluno_id'],$in['tipo'],$in['descricao'],$in['observacoes']??'',$in['data'],$u['nome']]);
    }
    json_ok(null, 'Ocorrência salva');
}

function ocorrencias_delete(): void {
    if (!perm('manage_occurrences')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("DELETE FROM ocorrencias WHERE id = ?")->execute([(int)$in['id']]);
    json_ok(null, 'Ocorrência excluída');
}
