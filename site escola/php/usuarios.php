<?php
require_once __DIR__ . '/config.php';

function usuarios_list(): void {
    if (!perm('manage_users')) json_err('Sem permissão', 403);
    json_ok(db()->query("SELECT id, email, perfil, nome, ref_id, ativo, last_login, created_at FROM usuarios ORDER BY nome")->fetchAll());
}

function usuarios_get(): void {
    if (!perm('manage_users')) json_err('Sem permissão', 403);
    $id = (int)($_GET['id'] ?? 0);
    $stmt = db()->prepare("SELECT id, email, perfil, nome, ref_id, ativo FROM usuarios WHERE id = ?");
    $stmt->execute([$id]);
    json_ok($stmt->fetch() ?: null);
}

function usuarios_save(): void {
    if (!perm('manage_users')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['email','perfil','nome'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        $sql = "UPDATE usuarios SET email=?, perfil=?, nome=?, ativo=? WHERE id=?";
        $params = [$in['email'],$in['perfil'],$in['nome'],(int)($in['ativo']??1),$id];
        if (!empty($in['senha'])) {
            $sql = "UPDATE usuarios SET email=?, perfil=?, nome=?, senha=?, ativo=? WHERE id=?";
            $params = [$in['email'],$in['perfil'],$in['nome'],password_hash($in['senha'],PASSWORD_DEFAULT),(int)($in['ativo']??1),$id];
        }
        db()->prepare($sql)->execute($params);
    } else {
        $senha = $in['senha'] ?? '123';
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        db()->prepare("INSERT INTO usuarios (email,senha,perfil,nome,ref_id,ativo) VALUES (?,?,?,?,?,?)")
            ->execute([$in['email'],$hash,$in['perfil'],$in['nome'],(int)($in['ref_id']??0),(int)($in['ativo']??1)]);
    }
    json_ok(null, 'Usuário salvo');
}

function usuarios_delete(): void {
    if (!perm('manage_users')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("DELETE FROM usuarios WHERE id = ?")->execute([(int)$in['id']]);
    json_ok(null, 'Usuário excluído');
}