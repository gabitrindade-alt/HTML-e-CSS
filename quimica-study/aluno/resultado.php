<?php
$titulo_pagina = "Resultado";
require_once '../includes/header.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['simulado_id'])) {
    redirecionar('simulados.php');
}

$usuario_id = $_SESSION['usuario_id'];
$simulado_id = (int)$_POST['simulado_id'];
$respostas_aluno = $_POST['respostas'] ?? [];

$stmt = $pdo->prepare("SELECT q.id FROM questoes q JOIN simulado_questoes sq ON q.id = sq.questao_id WHERE sq.simulado_id = :id");
$stmt->execute(['id' => $simulado_id]);
$questao_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

$gabarito = [];
$tipos = [];
$detalhes = [];
foreach ($questao_ids as $qid) {
    $stmt_q = $pdo->prepare("SELECT id, tipo, resposta_correta, explicacao, enunciado FROM questoes WHERE id = :id");
    $stmt_q->execute(['id' => $qid]);
    $row = $stmt_q->fetch();
    $gabarito[$qid] = $row['resposta_correta'];
    $tipos[$qid] = $row['tipo'];
    $detalhes[$qid] = $row;
}

$acertos = 0;
$total = count($gabarito);
$total_objetivas = count(array_filter($tipos, function ($tipo) { return $tipo !== 'dissertativa'; }));
foreach ($gabarito as $q_id => $correta) {
    if ($tipos[$q_id] !== 'dissertativa' && isset($respostas_aluno[$q_id]) && $respostas_aluno[$q_id] === $correta) {
        $acertos++;
    }
}

$erros = $total_objetivas - $acertos;
$porcentagem = $total_objetivas > 0 ? round(($acertos / $total_objetivas) * 100, 2) : 0;
$pontos_ganhos = $acertos * 10;

$stmt_hist = $pdo->prepare("INSERT INTO historico_simulados (usuario_id, simulado_id, acertos, erros, total_questoes, porcentagem, pontuacao) VALUES (:uid, :sid, :acertos, :erros, :total, :porc, :pontos)");
$stmt_hist->execute(['uid' => $usuario_id, 'sid' => $simulado_id, 'acertos' => $acertos, 'erros' => $erros, 'total' => $total, 'porc' => $porcentagem, 'pontos' => $pontos_ganhos]);

$stmt_pts = $pdo->prepare("UPDATE usuarios SET pontos = pontos + :pontos WHERE id = :id");
$stmt_pts->execute(['pontos' => $pontos_ganhos, 'id' => $usuario_id]);

$stmt_sim = $pdo->prepare("SELECT titulo FROM simulados WHERE id = :id");
$stmt_sim->execute(['id' => $simulado_id]);
$simulado_nome = $stmt_sim->fetchColumn();
?>

<div class="simulado-header" style="text-align: center; padding: 40px;">
    <h1 style="font-size: 2.5rem; margin-bottom: 16px;">🎯 Resultado Final</h1>
    <h2 style="color: #64748b; margin-bottom: 32px;"><?= escape($simulado_nome) ?></h2>
    
    <div style="display: flex; justify-content: center; gap: 40px; margin-bottom: 32px; flex-wrap: wrap;">
        <div>
            <div style="font-size: 3rem; font-weight: 800; color: #10b981;"><?= $acertos ?>/<?= $total_objetivas ?></div>
            <div style="color: #64748b;">Acertos</div>
        </div>
        <div>
            <div style="font-size: 3rem; font-weight: 800; color: #0ea5e9;"><?= $porcentagem ?>%</div>
            <div style="color: #64748b;">Aproveitamento</div>
        </div>
        <div>
            <div style="font-size: 3rem; font-weight: 800; color: #f59e0b;">+<?= $pontos_ganhos ?></div>
            <div style="color: #64748b;">Pontos XP</div>
        </div>
    </div>

    <p style="font-size: 1.2rem; color: #0f172a; font-weight: 600;">
        <?= $porcentagem >= 70 ? 'Muito bom! Continue assim! 🚀' : 'Continue estudando, você vai melhorar! 💪' ?>
    </p>
    
    <a href="simulados.php" class="btn btn-primary" style="margin-top: 24px;">Voltar aos Simulados</a>
</div>

<h3 style="margin: 32px 0 16px; color: #0f172a;">Revisão das Questões</h3>

<?php foreach ($detalhes as $q_id => $det): ?>
    <?php 
        $resposta_dada = $respostas_aluno[$q_id] ?? 'Não respondida';
        $esta_correto = $det['tipo'] !== 'dissertativa' && ($resposta_dada === $det['resposta_correta']);
    ?>
    <div class="questao-card">
        <p class="questao-enunciado"><?= escape($det['enunciado']) ?></p>
        <p>Sua resposta: <strong><?= escape($resposta_dada) ?></strong></p>
        
        <?php if ($det['tipo'] === 'dissertativa'): ?>
            <div class="alert">Resposta dissertativa: revise com o gabarito comentado abaixo.</div>
            <div class="feedback-correto"><strong>Gabarito comentado:</strong> <?= escape($det['explicacao']) ?></div>
        <?php elseif ($esta_correto): ?>
            <div class="feedback-correto">
                ✅ <strong>Correto!</strong> <?= escape($det['explicacao']) ?>
            </div>
        <?php else: ?>
            <div class="feedback-errado">
                ❌ <strong>Incorreto.</strong> A resposta certa era <strong><?= escape($det['resposta_correta']) ?></strong>.<br>
                💡 <?= escape($det['explicacao']) ?>
            </div>
        <?php endif; ?>
    </div>
<?php endforeach; ?>

<?php require_once '../includes/footer.php'; ?>