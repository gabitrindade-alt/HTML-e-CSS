<?php
require_once __DIR__ . '/config.php';

function comunicados_list(): void {
    require_login();
    json_ok(db()->query("SELECT * FROM comunicados ORDER BY data DESC")->fetchAll());
}

function comunicados_get(): void {
    require_login();
    $stmt = db()->prepare("SELECT * FROM comunicados WHERE id = ?");
    $stmt->execute([(int)($_GET['id'] ?? 0)]);
    json_ok($stmt->fetch() ?: null);
}

function comunicados_save(): void {
    if (!perm('manage_announcements')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['titulo','data'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        db()->prepare("UPDATE comunicados SET titulo=?, data=?, conteudo=?, destino=? WHERE id=?")
            ->execute([$in['titulo'],$in['data'],$in['conteudo']??'',$in['destino']??'Todos',$id]);
    } else {
        db()->prepare("INSERT INTO comunicados (titulo,data,conteudo,destino) VALUES (?,?,?,?)")
            ->execute([$in['titulo'],$in['data'],$in['conteudo']??'',$in['destino']??'Todos']);
    }
    json_ok(null, 'Comunicado salvo');
}

function comunicados_delete(): void {
    if (!perm('manage_announcements')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("DELETE FROM comunicados WHERE id = ?")->execute([(int)$in['id']]);
    json_ok(null, 'Comunicado excluído');
}