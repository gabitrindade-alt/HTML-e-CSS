<?php
require_once __DIR__ . '/config.php';

function notas_list(): void {
    $u = require_login();
    $aluno_id = (int)($_GET['aluno_id'] ?? 0);

    if ($u['perfil'] === 'aluno')      $aluno_id = (int)$u['ref_id'];
    if ($u['perfil'] === 'responsavel') {
        $r = db()->prepare("SELECT aluno_id FROM responsaveis WHERE id = ?");
        $r->execute([$u['ref_id']]);
        $aluno_id = (int)$r->fetchColumn();
    }
    if (!$aluno_id) json_err('Aluno não identificado');

    $stmt = db()->prepare("SELECT * FROM notas WHERE aluno_id = ? ORDER BY disciplina, bimestre");
    $stmt->execute([$aluno_id]);
    json_ok($stmt->fetchAll());
}

function notas_save(): void {
    $u = require_login();
    if (!in_array($u['perfil'], ['professor','diretor','coordenador'])) json_err('Sem permissão', 403);
    $in = input();
    $required = ['aluno_id','disciplina','valor','bimestre'];
    foreach ($required as $k) if (!isset($in[$k]) || $in[$k] === '') json_err("Campo '{$k}' obrigatório");

    $valor = (float)$in['valor'];
    if ($valor < 0 || $valor > 10) json_err('Nota deve estar entre 0 e 10');

    $id = (int)($in['id'] ?? 0);
    $prof_id = $u['perfil'] === 'professor' ? (int)$u['ref_id'] : null;

    if ($id) {
        db()->prepare("UPDATE notas SET aluno_id=?, disciplina=?, valor=?, bimestre=?, observacao=? WHERE id=?")
            ->execute([$in['aluno_id'],$in['disciplina'],$valor,(int)$in['bimestre'],$in['observacao']??'',$id]);
    } else {
        db()->prepare("INSERT INTO notas (aluno_id,disciplina,valor,bimestre,observacao,data,professor_id) VALUES (?,?,?,?,?,?,?)")
            ->execute([$in['aluno_id'],$in['disciplina'],$valor,(int)$in['bimestre'],$in['observacao']??'',date('Y-m-d'),$prof_id]);
    }
    json_ok(null, 'Nota salva');
}

function notas_delete(): void {
    $u = require_login();
    if (!in_array($u['perfil'], ['professor','diretor','coordenador'])) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("DELETE FROM notas WHERE id = ?")->execute([(int)$in['id']]);
    json_ok(null, 'Nota excluída');
}

function notas_situacao(): void {
    $u = require_login();
    $aluno_id = (int)($_GET['aluno_id'] ?? 0);
    if (!$aluno_id) json_err('aluno_id obrigatório');
    if (!can_access_student($u, $aluno_id)) json_err('Sem permissão', 403);

    $notas = db()->prepare("SELECT valor FROM notas WHERE aluno_id = ?");
    $notas->execute([$aluno_id]);
    $notas = $notas->fetchAll();

    $freq = db()->prepare("SELECT presente FROM frequencia WHERE aluno_id = ?");
    $freq->execute([$aluno_id]);
    $freq = $freq->fetchAll();

    $oc = db()->prepare("SELECT COUNT(*) FROM ocorrencias WHERE aluno_id = ? AND tipo <> 'Elogio'");
    $oc->execute([$aluno_id]);
    $ocCount = (int)$oc->fetchColumn();

    $media = count($notas) ? array_sum(array_column($notas,'valor')) / count($notas) : null;
    $totalAulas = count($freq);
    $faltas = count(array_filter($freq, fn($f) => !$f['presente']));
    $pctFreq = $totalAulas ? (($totalAulas - $faltas) / $totalAulas) * 100 : 100;

    if ($media !== null && $media < 5)      $sit = ['status'=>'ALERTA','cor'=>'red','msg'=>"Média muito baixa ({$media})"];
    elseif ($pctFreq < 75)                  $sit = ['status'=>'ALERTA','cor'=>'red','msg'=>"Frequência crítica ({$pctFreq}%)"];
    elseif ($ocCount >= 3)                  $sit = ['status'=>'ALERTA','cor'=>'red','msg'=>"{$ocCount} ocorrências"];
    elseif ($media !== null && $media < 6)  $sit = ['status'=>'ATENÇÃO','cor'=>'yellow','msg'=>"Média abaixo de 6 ({$media})"];
    elseif ($pctFreq < 85)                  $sit = ['status'=>'ATENÇÃO','cor'=>'yellow','msg'=>"Frequência baixa ({$pctFreq}%)"];
    elseif ($faltas > 5)                    $sit = ['status'=>'ATENÇÃO','cor'=>'yellow','msg'=>"{$faltas} faltas"];
    else                                    $sit = ['status'=>'OK','cor'=>'green','msg'=>'Situação regular'];

    $sit['media'] = $media;
    $sit['faltas'] = $faltas;
    $sit['pct_frequencia'] = $pctFreq;
    json_ok($sit);
}
