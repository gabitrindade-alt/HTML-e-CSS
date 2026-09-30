<?php
require_once __DIR__ . '/config.php';

function cursos_list(): void {
    require_login();
    json_ok(db()->query("SELECT * FROM cursos ORDER BY nome")->fetchAll());
}

function cursos_get(): void {
    require_login();
    $id = (int)($_GET['id'] ?? 0);
    $stmt = db()->prepare("SELECT * FROM cursos WHERE id = ?");
    $stmt->execute([$id]);
    json_ok($stmt->fetch() ?: null);
}

function cursos_save(): void {
    if (!perm('manage_school')) json_err('Sem permissão', 403);
    $in = input();
    if (empty($in['nome'])) json_err('Nome obrigatório');

    $id = (int)($in['id'] ?? 0);
    $disciplinas = is_array($in['disciplinas'] ?? null) ? $in['disciplinas'] : explode(',', $in['disciplinas'] ?? '');
    $disciplinas = array_map('trim', array_filter($disciplinas));
    $json = json_encode($disciplinas, JSON_UNESCAPED_UNICODE);

    if ($id) {
        db()->prepare("UPDATE cursos SET nome=?, disciplinas=?, ativo=? WHERE id=?")
            ->execute([$in['nome'],$json,(int)($in['ativo']??1),$id]);
    } else {
        db()->prepare("INSERT INTO cursos (nome,disciplinas,ativo) VALUES (?,?,?)")
            ->execute([$in['nome'],$json,(int)($in['ativo']??1)]);
    }
    json_ok(null, 'Curso salvo');
}

function cursos_delete(): void {
    if (!perm('manage_school')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("DELETE FROM cursos WHERE id = ?")->execute([(int)$in['id']]);
    json_ok(null, 'Curso excluído');
}