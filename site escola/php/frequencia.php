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

function frequencia_resumo_turma(): void {
    $u = require_login();
    if (!in_array($u['perfil'], ['diretor', 'coordenador', 'professor'], true)) json_err('Sem permissao', 403);
    $turma_id = (int)($_GET['turma_id'] ?? 0);
    if (!$turma_id) json_err('turma_id obrigatorio');

    if ($u['perfil'] === 'professor') {
        $assigned = db()->prepare('SELECT COUNT(*) FROM turma_professor tp INNER JOIN turmas t ON t.id=tp.turma_id WHERE tp.professor_id=? AND tp.turma_id=? AND t.ativo=1');
        $assigned->execute([(int)$u['ref_id'], $turma_id]);
        if (!(int)$assigned->fetchColumn()) {
            $prof = db()->prepare("SELECT email,disciplina FROM professores WHERE id=? AND ativo=1");
            $prof->execute([(int)$u['ref_id']]);
            $profile = $prof->fetch();
            $general = $profile && ($profile['email'] === 'professor@lavenir.com' || $profile['disciplina'] === 'Geral');
            $activeClass = db()->prepare('SELECT COUNT(*) FROM turmas WHERE id=? AND ativo=1');
            $activeClass->execute([$turma_id]);
            if (!$general || !(int)$activeClass->fetchColumn()) json_err('Essa turma nao esta vinculada ao seu perfil.', 403);
        }
    }

    $stmt = db()->prepare("\n        SELECT a.id AS aluno_id, a.nome, a.matricula, COUNT(f.aluno_id) AS aulas_registradas,\n               COALESCE(SUM(CASE WHEN f.presente=1 THEN 1 ELSE 0 END),0) AS presencas,\n               COALESCE(SUM(CASE WHEN f.presente=0 THEN 1 ELSE 0 END),0) AS faltas,\n               CASE WHEN COUNT(f.aluno_id)=0 THEN NULL\n                    ELSE ROUND(100 * SUM(CASE WHEN f.presente=1 THEN 1 ELSE 0 END) / COUNT(f.aluno_id), 1) END AS percentual\n        FROM alunos a\n        LEFT JOIN frequencia f ON f.aluno_id=a.id\n        WHERE a.turma_id=? AND a.situacao='Ativo'\n        GROUP BY a.id, a.nome, a.matricula\n        ORDER BY a.nome\n    ");
    $stmt->execute([$turma_id]);
    json_ok($stmt->fetchAll());
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
