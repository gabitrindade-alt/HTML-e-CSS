<?php
require_once __DIR__ . '/config.php';

function eventos_list(): void {
    require_login();
    json_ok(db()->query("SELECT * FROM eventos ORDER BY data ASC")->fetchAll());
}

function eventos_get(): void {
    require_login();
    $stmt = db()->prepare("SELECT * FROM eventos WHERE id = ?");
    $stmt->execute([(int)($_GET['id'] ?? 0)]);
    json_ok($stmt->fetch() ?: null);
}

function eventos_save(): void {
    if (!perm('manage_events')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['titulo','tipo','data','hora','local'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        db()->prepare("UPDATE eventos SET titulo=?, tipo=?, data=?, hora=?, local=?, descricao=?, publico=?, status=? WHERE id=?")
            ->execute([$in['titulo'],$in['tipo'],$in['data'],$in['hora'],$in['local'],$in['descricao']??'',$in['publico']??'',$in['status']??'Confirmado',$id]);
    } else {
        db()->prepare("INSERT INTO eventos (titulo,tipo,data,hora,local,descricao,publico,status) VALUES (?,?,?,?,?,?,?,?)")
            ->execute([$in['titulo'],$in['tipo'],$in['data'],$in['hora'],$in['local'],$in['descricao']??'',$in['publico']??'',$in['status']??'Confirmado']);
    }
    json_ok(null, 'Evento salvo');
}

function eventos_delete(): void {
    if (!perm('manage_events')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("DELETE FROM eventos WHERE id = ?")->execute([(int)$in['id']]);
    json_ok(null, 'Evento excluído');
}