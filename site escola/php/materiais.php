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

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        $stmt = db()->prepare("UPDATE solicitacoes_materiais SET material=?, quantidade=?, justificativa=?, status='Pendente' WHERE id=? AND professor_id=?");
        $stmt->execute([$in['material'],(int)$in['quantidade'],$in['justificativa'],$id,(int)$u['ref_id']]);
        if (!$stmt->rowCount()) {
            $check = db()->prepare('SELECT 1 FROM solicitacoes_materiais WHERE id=? AND professor_id=?');
            $check->execute([$id,(int)$u['ref_id']]);
            if (!$check->fetchColumn()) json_err('Solicitacao nao encontrada', 404);
        }
        json_ok(null, 'Solicitacao atualizada e voltou para pendente');
    }
    db()->prepare("INSERT INTO solicitacoes_materiais (professor_id,material,quantidade,justificativa,data,status) VALUES (?,?,?,?,?,?)")
        ->execute([(int)$u['ref_id'],$in['material'],(int)$in['quantidade'],$in['justificativa'],date('Y-m-d'),'Pendente']);
    json_ok(null, 'Solicitação enviada');
}

function materiais_delete(): void {
    $u = require_login();
    if ($u['perfil'] !== 'professor') json_err('Sem permissao', 403);
    $in = input();
    $stmt = db()->prepare('DELETE FROM solicitacoes_materiais WHERE id=? AND professor_id=?');
    $stmt->execute([(int)$in['id'],(int)$u['ref_id']]);
    if (!$stmt->rowCount()) json_err('Solicitacao nao encontrada', 404);
    json_ok(null, 'Solicitacao excluida');
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

function materiais_pendente(): void {
    if (!perm('approve_materials')) json_err('Sem permissao', 403);
    $in = input();
    db()->prepare("UPDATE solicitacoes_materiais SET status='Pendente' WHERE id=?")->execute([(int)$in['id']]);
    json_ok(null, 'Solicitacao voltou para pendente');
}

function materiais_status(): void {
    $u = require_login();
    $in = input();
    $id = (int)($in['id'] ?? 0);
    $status = $in['status'] ?? '';
    if (!in_array($status, ['Pendente', 'Aprovado', 'Rejeitado'], true)) json_err('Status inválido');

    if (in_array($u['perfil'], ['diretor', 'coordenador'], true)) {
        $stmt = db()->prepare('UPDATE solicitacoes_materiais SET status=? WHERE id=?');
        $stmt->execute([$status, $id]);
    } elseif ($u['perfil'] === 'professor' && $status === 'Pendente') {
        $stmt = db()->prepare('UPDATE solicitacoes_materiais SET status=? WHERE id=? AND professor_id=?');
        $stmt->execute([$status, $id, (int)$u['ref_id']]);
    } else {
        json_err('Sem permissão para alterar este status', 403);
    }

    if (!$stmt->rowCount()) {
        $check = db()->prepare('SELECT 1 FROM solicitacoes_materiais WHERE id=?' . ($u['perfil'] === 'professor' ? ' AND professor_id=?' : ''));
        $check->execute($u['perfil'] === 'professor' ? [$id, (int)$u['ref_id']] : [$id]);
        if (!$check->fetchColumn()) json_err('Solicitação não encontrada', 404);
    }
    json_ok(null, 'Status da solicitação atualizado');
}
