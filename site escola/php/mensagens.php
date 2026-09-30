<?php
require_once __DIR__ . '/config.php';

function mensagens_list(): void {
    $u = require_login();
    $stmt = db()->prepare("
        SELECT m.*, 
            CASE WHEN m.de_tipo='aluno' THEN (SELECT nome FROM alunos WHERE id=m.de_id)
                 WHEN m.de_tipo='responsavel' THEN (SELECT nome FROM responsaveis WHERE id=m.de_id)
                 WHEN m.de_tipo='professor' THEN (SELECT nome FROM professores WHERE id=m.de_id)
                 ELSE (SELECT nome FROM usuarios WHERE id=m.de_id) END AS de_nome,
            CASE WHEN m.para_tipo='aluno' THEN (SELECT nome FROM alunos WHERE id=m.para_id)
                 WHEN m.para_tipo='responsavel' THEN (SELECT nome FROM responsaveis WHERE id=m.para_id)
                 WHEN m.para_tipo='professor' THEN (SELECT nome FROM professores WHERE id=m.para_id)
                 ELSE (SELECT nome FROM usuarios WHERE id=m.para_id) END AS para_nome
        FROM mensagens m
        WHERE (m.de_tipo = ? AND m.de_id = ?) OR (m.para_tipo = ? AND m.para_id = ?)
        ORDER BY m.id DESC
    ");
    $stmt->execute([$u['perfil'],$u['ref_id'] ?? $u['id'],$u['perfil'],$u['ref_id'] ?? $u['id']]);
    json_ok($stmt->fetchAll());
}

function mensagens_count_unread(): void {
    $u = require_login();
    $stmt = db()->prepare("SELECT COUNT(*) FROM mensagens WHERE para_tipo = ? AND para_id = ? AND lida = 0");
    $stmt->execute([$u['perfil'],$u['ref_id'] ?? $u['id']]);
    json_ok(['count' => (int)$stmt->fetchColumn()]);
}

function mensagens_send(): void {
    $u = require_login();
    $in = input();
    $required = ['para_tipo','para_id','assunto','conteudo'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    db()->prepare("INSERT INTO mensagens (de_tipo,de_id,para_tipo,para_id,assunto,conteudo,data) VALUES (?,?,?,?,?,?,?)")
        ->execute([$u['perfil'],$u['ref_id'] ?? $u['id'],$in['para_tipo'],(int)$in['para_id'],$in['assunto'],$in['conteudo'],date('Y-m-d')]);
    json_ok(null, 'Mensagem enviada');
}

function mensagens_mark_read(): void {
    $u = require_login();
    $in = input();
    db()->prepare("UPDATE mensagens SET lida = 1 WHERE id = ? AND para_tipo = ? AND para_id = ?")
        ->execute([(int)$in['id'],$u['perfil'],$u['ref_id'] ?? $u['id']]);
    json_ok(null, 'Marcada como lida');
}