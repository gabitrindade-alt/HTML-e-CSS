<?php
$titulo_pagina = 'Realizando simulado';
$css_extra = 'quiz.css';
require_once '../includes/header.php';

$simulado_id = (int)($_GET['id'] ?? 0);
$stmt = $pdo->prepare("SELECT q.id, q.enunciado, q.alt_a, q.alt_b, q.alt_c, q.alt_d, q.tipo FROM questoes q JOIN simulado_questoes sq ON q.id = sq.questao_id WHERE sq.simulado_id = :id ORDER BY sq.id");
$stmt->execute(['id' => $simulado_id]);
$questoes = $stmt->fetchAll();

if (!$questoes) {
    echo '<div class="quiz-empty"><span>✳</span><h2>Este simulado ainda não tem questões.</h2><p>Volte à lista para escolher outro desafio.</p><a href="simulados.php" class="btn btn-primary">Ver simulados</a></div>';
    require_once '../includes/footer.php';
    exit;
}
?>

<section class="quiz-page">
    <div class="quiz-intro">
        <div><span class="quiz-kicker">SIMULADO · <?= count($questoes) ?> QUESTÕES</span><h1>Concentre-se no que você já aprendeu.</h1><p>Responda com calma. Você pode rever suas escolhas antes de finalizar.</p></div>
        <div class="quiz-intro-art" aria-hidden="true"><span>∑</span><i>✳</i></div>
    </div>
    <form method="POST" action="resultado.php" class="quiz-form" data-quiz-form data-question-count="<?= count($questoes) ?>">
        <input type="hidden" name="simulado_id" value="<?= $simulado_id ?>">
        <div class="quiz-progress-card"><div class="quiz-progress-copy"><span>Seu ritmo</span><strong id="quiz-progress-label">0 de <?= count($questoes) ?> respondidas</strong></div><div class="quiz-progress-track" role="progressbar" aria-label="Questões respondidas" aria-valuemin="0" aria-valuemax="<?= count($questoes) ?>" aria-valuenow="0"><span id="quiz-progress-fill"></span></div></div>
        <div class="quiz-question-list">
            <?php foreach ($questoes as $index => $q): ?>
                <fieldset class="quiz-question" data-question-card>
                    <legend class="sr-only">Questão <?= $index + 1 ?></legend>
                    <div class="quiz-question-top"><span class="question-badge"><?= str_pad((string)($index + 1), 2, '0', STR_PAD_LEFT) ?></span><span class="question-type"><?= $q['tipo'] === 'dissertativa' ? 'RESPOSTA ABERTA' : 'QUESTÃO OBJETIVA' ?></span><span class="question-state">Pendente</span></div>
                    <p class="quiz-question-text"><?= escape($q['enunciado']) ?></p>
                    <?php if ($q['tipo'] === 'multipla'): ?>
                        <div class="quiz-options">
                            <?php foreach (['A' => $q['alt_a'], 'B' => $q['alt_b'], 'C' => $q['alt_c'], 'D' => $q['alt_d']] as $letra => $alternativa): ?>
                                <label class="quiz-option"><input type="radio" name="respostas[<?= (int)$q['id'] ?>]" value="<?= $letra ?>" <?= $letra === 'A' ? 'required' : '' ?>><span class="option-letter"><?= $letra ?></span><span class="option-text"><?= escape($alternativa) ?></span><span class="option-check">✓</span></label>
                            <?php endforeach; ?>
                        </div>
                    <?php elseif ($q['tipo'] === 'vf'): ?>
                        <div class="quiz-options quiz-options-binary">
                            <label class="quiz-option"><input type="radio" name="respostas[<?= (int)$q['id'] ?>]" value="V" required><span class="option-letter">V</span><span class="option-text">Verdadeiro</span><span class="option-check">✓</span></label>
                            <label class="quiz-option"><input type="radio" name="respostas[<?= (int)$q['id'] ?>]" value="F"><span class="option-letter">F</span><span class="option-text">Falso</span><span class="option-check">✓</span></label>
                        </div>
                    <?php else: ?>
                        <textarea class="essay-answer" name="respostas[<?= (int)$q['id'] ?>]" rows="5" required placeholder="Organize suas ideias e escreva sua resposta…"></textarea>
                    <?php endif; ?>
                </fieldset>
            <?php endforeach; ?>
        </div>
        <div class="quiz-submit-row"><a href="simulados.php" class="btn btn-secondary">Voltar aos simulados</a><button type="submit" class="btn btn-primary btn-large">Finalizar simulado <span>↗</span></button></div>
    </form>
</section>

<?php require_once '../includes/footer.php'; ?>
