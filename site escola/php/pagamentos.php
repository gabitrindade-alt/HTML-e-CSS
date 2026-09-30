<?php
require_once __DIR__ . '/config.php';

function pagamentos_list(): void {
    $u = require_login();
    if ($u['perfil'] === 'responsavel') {
        $stmt = db()->prepare("SELECT p.*, a.nome AS aluno_nome FROM pagamentos p LEFT JOIN alunos a ON a.id=p.aluno_id WHERE p.responsavel_id = ? OR p.aluno_id = (SELECT aluno_id FROM responsaveis WHERE id=?)");
        $stmt->execute([$u['ref_id'], $u['ref_id']]);
        json_ok($stmt->fetchAll());
    }
    if ($u['perfil'] !== 'diretor') json_err('Sem permissão', 403);
    $rows = db()->query("
        SELECT p.*, a.nome AS aluno_nome, r.nome AS responsavel_nome
        FROM pagamentos p
        LEFT JOIN alunos a ON a.id = p.aluno_id
        LEFT JOIN responsaveis r ON r.id = p.responsavel_id
        ORDER BY p.data_vencimento DESC
    ")->fetchAll();
    json_ok($rows);
}

function pagamentos_save(): void {
    if (!perm('manage_payments')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['aluno_id','mes_referencia','valor','data_vencimento'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $resp = db()->prepare("SELECT id FROM responsaveis WHERE aluno_id = ? LIMIT 1");
    $resp->execute([(int)$in['aluno_id']]);
    $respId = $resp->fetchColumn() ?: null;

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        db()->prepare("UPDATE pagamentos SET aluno_id=?, responsavel_id=?, mes_referencia=?, valor=?, status=?, data_vencimento=? WHERE id=?")
            ->execute([(int)$in['aluno_id'],$respId,$in['mes_referencia'],(float)$in['valor'],$in['status']??'Pendente',$in['data_vencimento'],$id]);
    } else {
        db()->prepare("INSERT INTO pagamentos (aluno_id,responsavel_id,mes_referencia,valor,status,data_vencimento) VALUES (?,?,?,?,?,?)")
            ->execute([(int)$in['aluno_id'],$respId,$in['mes_referencia'],(float)$in['valor'],$in['status']??'Pendente',$in['data_vencimento']]);
    }
    json_ok(null, 'Pagamento salvo');
}

function pagamentos_marcar_pago(): void {
    if (!perm('manage_payments')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("UPDATE pagamentos SET status='Pago', data_pagamento=CURDATE() WHERE id = ?")
        ->execute([(int)$in['id']]);
    json_ok(null, 'Marcado como pago');
}

function pagamentos_cancelar(): void {
    if (!perm('manage_payments')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("UPDATE pagamentos SET status='Cancelado' WHERE id = ?")
        ->execute([(int)$in['id']]);
    json_ok(null, 'Cancelado');
}

function pagamentos_lembrete(): void {
    $u = require_login();
    if (!perm('manage_payments')) json_err('Sem permissão', 403);
    $in = input();
    $id = (int)$in['id'];
    $p = db()->prepare("SELECT p.*, a.nome AS aluno_nome, r.nome AS resp_nome, r.id AS resp_id FROM pagamentos p LEFT JOIN alunos a ON a.id=p.aluno_id LEFT JOIN responsaveis r ON r.id=p.responsavel_id WHERE p.id=?");
    $p->execute([$id]);
    $pag = $p->fetch();
    if (!$pag) json_err('Pagamento não encontrado');
    if (!$pag['resp_id']) json_err('Responsável não vinculado');

    db()->prepare("INSERT INTO mensagens (de_tipo,de_id,para_tipo,para_id,assunto,conteudo,data) VALUES (?,?,?,?,?,?,?)")
        ->execute([$u['perfil'],$u['ref_id']??$u['id'],'responsavel',(int)$pag['resp_id'],
            "Lembrete: Mensalidade {$pag['mes_referencia']}",
            "Prezado(a) {$pag['resp_nome']}, a mensalidade de {$pag['mes_referencia']} no valor de R$ {$pag['valor']} com vencimento em {$pag['data_vencimento']} está pendente.\n\nColégio L'Avenir",
            date('Y-m-d')]);
    json_ok(null, 'Lembrete enviado');
}
