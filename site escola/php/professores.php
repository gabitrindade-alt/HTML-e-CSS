<?php
require_once __DIR__ . '/config.php';

function professores_list(): void {
    require_login();
    $rows = db()->query("SELECT * FROM professores ORDER BY nome")->fetchAll();
    json_ok($rows);
}

function professores_get(): void {
    require_login();
    $id = (int)($_GET['id'] ?? 0);
    $stmt = db()->prepare("SELECT * FROM professores WHERE id = ?");
    $stmt->execute([$id]);
    json_ok($stmt->fetch() ?: null);
}

function professores_save(): void {
    if (!perm('manage_school')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['nome','email','disciplina'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        db()->prepare("UPDATE professores SET nome=?, email=?, disciplina=?, ativo=? WHERE id=?")
            ->execute([$in['nome'],$in['email'],$in['disciplina'],(int)($in['ativo']??1),$id]);
        db()->prepare("UPDATE usuarios SET email=?, nome=? WHERE ref_id=? AND perfil='professor'")
            ->execute([$in['email'],$in['nome'],$id]);
    } else {
        db()->prepare("INSERT INTO professores (nome,email,disciplina,ativo) VALUES (?,?,?,?)")
            ->execute([$in['nome'],$in['email'],$in['disciplina'],(int)($in['ativo']??1)]);
        $newId = (int)db()->lastInsertId();
        $hash = password_hash('12345678', PASSWORD_DEFAULT);
        db()->prepare("INSERT INTO usuarios (email,senha,perfil,nome,ref_id) VALUES (?,?,?,?,?)")
            ->execute([$in['email'],$hash,'professor',$in['nome'],$newId]);
    }
    json_ok(null, 'Professor salvo');
}

function professores_delete(): void {
    if (!perm('manage_school')) json_err('Sem permissão', 403);
    $in = input();
    $id = (int)($in['id'] ?? 0);
    db()->prepare("DELETE FROM professores WHERE id = ?")->execute([$id]);
    db()->prepare("DELETE FROM usuarios WHERE ref_id = ? AND perfil = 'professor'")->execute([$id]);
    json_ok(null, 'Professor excluído');
}
