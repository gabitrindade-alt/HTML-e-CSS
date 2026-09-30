<?php
require_once __DIR__ . '/config.php';

function materiais_list(): void {
    $u = require_login();
    if ($u['perfil'] === 'professor') {
        $stmt = db()->prepare("SELECT s.*, p.nome AS professor_nome FROM solicitacoes_materiais s LEFT JOIN professores p ON p.id=s.professor_id WHERE s.professor_id = ? ORDER BY s.id DESC");
        $stmt->execute([$u['ref_id']]);
        json_ok($stmt->fetchAll());
    }
    if (!in_array($u['perfil'], ['diretor', 'coordenador'], true)) json_err('Sem permissão', 403);
    $rows = db()->query("
        SELECT s.*, p.nome AS professor_nome
        FROM solicitacoes_materiais s
        LEFT JOIN professores p ON p.id = s.professor_id
        ORDER BY FIELD(s.status,'Pendente','Aprovado','Rejeitado'), s.id DESC
    ")->fetchAll();
    json_ok($rows);
}

function materiais_save(): void {
    $u = require_login();
    if ($u['perfil'] !== 'professor') json_err('Apenas professores podem solicitar', 403);
    $in = input();
    $required = ['material','quantidade','justificativa'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    db()->prepare("INSERT INTO solicitacoes_materiais (professor_id,material,quantidade,justificativa,data,status) VALUES (?,?,?,?,?,?)")
        ->execute([(int)$u['ref_id'],$in['material'],(int)$in['quantidade'],$in['justificativa'],date('Y-m-d'),'Pendente']);
    json_ok(null, 'Solicitação enviada');
}

function materiais_aprovar(): void {
    if (!perm('approve_materials')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("UPDATE solicitacoes_materiais SET status='Aprovado' WHERE id=?")->execute([(int)$in['id']]);
    json_ok(null, 'Aprovado');
}

function materiais_rejeitar(): void {
    if (!perm('approve_materials')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("UPDATE solicitacoes_materiais SET status='Rejeitado' WHERE id=?")->execute([(int)$in['id']]);
    json_ok(null, 'Rejeitado');
}
