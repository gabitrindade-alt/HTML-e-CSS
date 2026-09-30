<?php
require_once __DIR__ . '/config.php';

function frequencia_list(): void {
    $u = require_login();
    $aluno_id = (int)($_GET['aluno_id'] ?? 0);
    if ($u['perfil'] === 'aluno') $aluno_id = (int)$u['ref_id'];
    if ($u['perfil'] === 'responsavel') {
        $r = db()->prepare("SELECT aluno_id FROM responsaveis WHERE id = ?");
        $r->execute([$u['ref_id']]);
        $aluno_id = (int)$r->fetchColumn();
    }
    if (!$aluno_id) json_err('Aluno não identificado');

    $stmt = db()->prepare("SELECT * FROM frequencia WHERE aluno_id = ? ORDER BY data DESC");
    $stmt->execute([$aluno_id]);
    json_ok($stmt->fetchAll());
}

function frequencia_por_turma(): void {
    $u = require_login();
    if (!in_array($u['perfil'], ['diretor', 'coordenador', 'professor'], true)) json_err('Sem permissão', 403);
    $turma_id = (int)($_GET['turma_id'] ?? 0);
    $data = $_GET['data'] ?? date('Y-m-d');
    if (!$turma_id) json_err('turma_id obrigatório');

    $alunos = db()->prepare("SELECT * FROM alunos WHERE turma_id = ? AND situacao = 'Ativo' ORDER BY nome");
    $alunos->execute([$turma_id]);
    $alunos = $alunos->fetchAll();

    $freq = db()->prepare("SELECT * FROM frequencia WHERE data = ? AND aluno_id IN (SELECT id FROM alunos WHERE turma_id = ?)");
    $freq->execute([$data, $turma_id]);
    $freqMap = [];
    foreach ($freq->fetchAll() as $f) $freqMap[$f['aluno_id']] = $f;

    $resultado = [];
    foreach ($alunos as $a) {
        $f = $freqMap[$a['id']] ?? null;
        $resultado[] = [
            'aluno_id' => $a['id'],
            'nome' => $a['nome'],
            'matricula' => $a['matricula'],
            'presente' => $f ? (bool)$f['presente'] : true,
            'justificativa' => $f['justificativa'] ?? '',
            'observacao' => $f['observacao'] ?? '',
        ];
    }
    json_ok($resultado);
}

function frequencia_save(): void {
    $u = require_login();
    if (!perm('edit_freq')) json_err('Sem permissão', 403);
    $in = input();
    $turma_id = (int)($in['turma_id'] ?? 0);
    $data = $in['data'] ?? date('Y-m-d');
    $registros = $in['registros'] ?? [];
    if (!$turma_id || !$registros) json_err('Dados inválidos');

    $prof_id = $u['perfil'] === 'professor' ? (int)$u['ref_id'] : null;
    $stmt = db()->prepare("
        INSERT INTO frequencia (aluno_id, data, presente, justificativa, observacao, professor_id)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE presente=VALUES(presente), justificativa=VALUES(justificativa), observacao=VALUES(observacao)
    ");
    foreach ($registros as $r) {
        $stmt->execute([
            (int)$r['aluno_id'], $data,
            $r['presente'] ? 1 : 0,
            $r['justificativa'] ?? '',
            $r['observacao'] ?? '',
            $prof_id
        ]);
    }
    json_ok(null, 'Frequência salva');
}
