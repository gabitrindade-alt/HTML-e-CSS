<?php
require_once __DIR__ . '/config.php';

function turmas_list(): void {
    require_login();
    $rows = db()->query("
        SELECT t.*, c.nome AS curso_nome,
               (SELECT COUNT(*) FROM alunos WHERE turma_id = t.id) AS total_alunos
        FROM turmas t LEFT JOIN cursos c ON c.id = t.curso_id
        ORDER BY t.nome
    ")->fetchAll();
    json_ok($rows);
}

function turmas_get(): void {
    require_login();
    $id = (int)($_GET['id'] ?? 0);
    $stmt = db()->prepare("SELECT * FROM turmas WHERE id = ?");
    $stmt->execute([$id]);
    $turma = $stmt->fetch();
    if ($turma) {
        $p = db()->prepare("SELECT professor_id FROM turma_professor WHERE turma_id = ?");
        $p->execute([$id]);
        $turma['professores_ids'] = array_column($p->fetchAll(), 'professor_id');
    }
    json_ok($turma ?: null);
}

function turmas_save(): void {
    if (!perm('manage_school')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['nome','curso_id'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        db()->prepare("UPDATE turmas SET nome=?, curso_id=?, periodo=?, ativo=? WHERE id=?")
            ->execute([$in['nome'],(int)$in['curso_id'],$in['periodo']??'Manhã',(int)($in['ativo']??1),$id]);
    } else {
        db()->prepare("INSERT INTO turmas (nome,curso_id,periodo,ativo) VALUES (?,?,?,?)")
            ->execute([$in['nome'],(int)$in['curso_id'],$in['periodo']??'Manhã',(int)($in['ativo']??1)]);
        $id = (int)db()->lastInsertId();
    }

    // Vínculo com professores
    db()->prepare("DELETE FROM turma_professor WHERE turma_id = ?")->execute([$id]);
    $profIds = $in['professores_ids'] ?? [];
    foreach ($profIds as $pid) {
        db()->prepare("INSERT INTO turma_professor (turma_id, professor_id) VALUES (?, ?)")->execute([$id, (int)$pid]);
    }
    json_ok(null, 'Turma salva');
}

function turmas_delete(): void {
    if (!perm('manage_school')) json_err('Sem permissão', 403);
    $in = input();
    $id = (int)($in['id'] ?? 0);
    db()->prepare("DELETE FROM turmas WHERE id = ?")->execute([$id]);
    json_ok(null, 'Turma excluída');
}