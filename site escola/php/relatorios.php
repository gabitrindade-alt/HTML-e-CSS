<?php
require_once __DIR__ . '/config.php';

function relatorios_dashboard(): void {
    if (!perm('view_reports')) json_err('Sem permissão', 403);
    $alunos = (int)db()->query("SELECT COUNT(*) FROM alunos WHERE situacao='Ativo'")->fetchColumn();
    $profs  = (int)db()->query("SELECT COUNT(*) FROM professores WHERE ativo=1")->fetchColumn();
    $turmas = (int)db()->query("SELECT COUNT(*) FROM turmas WHERE ativo=1")->fetchColumn();
    $pags   = db()->query("SELECT
        SUM(CASE WHEN status='Pendente' THEN valor ELSE 0 END) AS pendente,
        SUM(CASE WHEN status='Pago' THEN valor ELSE 0 END) AS recebido,
        SUM(CASE WHEN status='Cancelado' THEN valor ELSE 0 END) AS cancelado,
        SUM(CASE WHEN status='Pendente' THEN 1 ELSE 0 END) AS qtd_pend,
        SUM(CASE WHEN status='Pago' THEN 1 ELSE 0 END) AS qtd_pago,
        SUM(CASE WHEN status='Cancelado' THEN 1 ELSE 0 END) AS qtd_canc
        FROM pagamentos")->fetch();
    json_ok([
        'alunos' => $alunos, 'professores' => $profs, 'turmas' => $turmas,
        'pagamentos' => $pags
    ]);
}

function relatorios_acompanhamento(): void {
    if (!perm('view_reports')) json_err('Sem permissão', 403);
    $rows = db()->query("
        SELECT a.id, a.nome, a.matricula, t.nome AS turma_nome,
            (SELECT AVG(valor) FROM notas WHERE aluno_id=a.id) AS media,
            (SELECT COUNT(*) FROM frequencia WHERE aluno_id=a.id AND presente=0) AS faltas,
            (SELECT COUNT(*) FROM frequencia WHERE aluno_id=a.id) AS total_aulas,
            (SELECT COUNT(*) FROM ocorrencias WHERE aluno_id=a.id AND tipo<>'Elogio') AS ocorrencias
        FROM alunos a
        LEFT JOIN turmas t ON t.id = a.turma_id
        WHERE a.situacao='Ativo'
        ORDER BY a.nome
    ")->fetchAll();

    foreach ($rows as &$r) {
        $media = $r['media'] !== null ? (float)$r['media'] : null;
        $pct = $r['total_aulas'] ? (($r['total_aulas'] - $r['faltas']) / $r['total_aulas']) * 100 : 100;
        if ($media !== null && $media < 5)      $r['situacao'] = ['status'=>'ALERTA','cor'=>'red'];
        elseif ($pct < 75)                      $r['situacao'] = ['status'=>'ALERTA','cor'=>'red'];
        elseif ($r['ocorrencias'] >= 3)         $r['situacao'] = ['status'=>'ALERTA','cor'=>'red'];
        elseif ($media !== null && $media < 6)  $r['situacao'] = ['status'=>'ATENÇÃO','cor'=>'yellow'];
        elseif ($pct < 85)                      $r['situacao'] = ['status'=>'ATENÇÃO','cor'=>'yellow'];
        elseif ($r['faltas'] > 5)               $r['situacao'] = ['status'=>'ATENÇÃO','cor'=>'yellow'];
        else                                    $r['situacao'] = ['status'=>'OK','cor'=>'green'];
    }
    json_ok($rows);
}
