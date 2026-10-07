<?php
require_once '../includes/auth.php';
require_once '../includes/conexao.php';
require_once '../includes/funcoes.php';
requerLogin();
$usuario_id = (int)$_SESSION['usuario_id'];
$conteudo_id = (int)($_GET['conteudo'] ?? $_POST['conteudo_id'] ?? 0);
$quiz_finalizado = false;
$respostas_detalhes = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['acao'] ?? '') === 'conferir_resposta') {
    header('Content-Type: application/json; charset=utf-8');
    $question_id = filter_var($_POST['questao_id'] ?? null, FILTER_VALIDATE_INT);
    $answer = strtoupper(trim($_POST['resposta'] ?? ''));
    $content_filter = $conteudo_id > 0 ? ' AND conteudo_id = :conteudo_id' : '';
    if (!$question_id || !in_array($answer, ['A', 'B', 'C', 'D'], true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Resposta inválida.']);
        exit;
    }
    $stmt_check = $pdo->prepare("SELECT resposta_correta, explicacao, alt_a, alt_b, alt_c, alt_d FROM questoes WHERE id = :id AND tipo = 'multipla'" . $content_filter);
    $params = ['id' => $question_id];
    if ($conteudo_id > 0) $params['conteudo_id'] = $conteudo_id;
    $stmt_check->execute($params);
    $answer_data = $stmt_check->fetch();
    if (!$answer_data) {
        http_response_code(404);
        echo json_encode(['error' => 'Questão não encontrada.']);
        exit;
    }
    $correct = strtoupper($answer_data['resposta_correta']);
    $correct_text = ['A' => $answer_data['alt_a'], 'B' => $answer_data['alt_b'], 'C' => $answer_data['alt_c'], 'D' => $answer_data['alt_d']][$correct] ?? '';
    echo json_encode(['correct' => $answer === $correct, 'correct_answer' => $correct, 'correct_text' => $correct_text, 'explanation' => $answer_data['explicacao']], JSON_UNESCAPED_UNICODE);
    exit;
}

$titulo_pagina = 'Quiz rápido';
$css_extra = 'quiz.css';
require_once '../includes/header.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $respostas = is_array($_POST['respostas'] ?? null) ? $_POST['respostas'] : [];
    $acertos = 0;
    $total = 0;

    $stmt = $pdo->prepare("SELECT enunciado, alt_a, alt_b, alt_c, alt_d, resposta_correta, explicacao FROM questoes WHERE id = :id AND tipo = 'multipla' AND (:sem_conteudo = 1 OR conteudo_id = :conteudo_id)");
    foreach ($respostas as $qid => $resposta) {
        $qid = filter_var($qid, FILTER_VALIDATE_INT);
        if (!$qid || !in_array($resposta, ['A', 'B', 'C', 'D'], true)) {
            continue;
        }
        $stmt->execute(['id' => $qid, 'sem_conteudo' => $conteudo_id === 0 ? 1 : 0, 'conteudo_id' => $conteudo_id]);
        $questao = $stmt->fetch();
        if (!$questao) {
            continue;
        }
        $questao['resposta_aluno'] = $resposta;
        $questao['correta'] = $resposta === $questao['resposta_correta'];
        $respostas_detalhes[] = $questao;
        $total++;
        if ($questao['correta']) $acertos++;
    }

    $porcentagem = $total > 0 ? round(($acertos / $total) * 100, 1) : 0;
    $pontos = $acertos * 5;
    if ($pontos > 0) {
        $stmt_pts = $pdo->prepare('UPDATE usuarios SET pontos = pontos + :pontos WHERE id = :id');
        $stmt_pts->execute(['pontos' => $pontos, 'id' => $usuario_id]);
    }
    $quiz_finalizado = true;
} else {
    if ($conteudo_id > 0) {
        $stmt = $pdo->prepare("SELECT id, enunciado, alt_a, alt_b, alt_c, alt_d FROM questoes WHERE conteudo_id = :conteudo_id AND tipo = 'multipla' ORDER BY RAND() LIMIT 5");
        $stmt->execute(['conteudo_id' => $conteudo_id]);
    } else {
        $stmt = $pdo->query("SELECT id, enunciado, alt_a, alt_b, alt_c, alt_d FROM questoes WHERE tipo = 'multipla' ORDER BY RAND() LIMIT 5");
    }
    $questoes = $stmt->fetchAll();
}
?>

<section class="quiz-page">
    <div class="quiz-intro">
        <div><span class="quiz-kicker">PRÁTICA RÁPIDA · 5 QUESTÕES</span><h1>Hora de testar suas ideias.</h1><p>Escolha uma resposta em cada questão. No final, você vê o resultado e a explicação.</p></div>
        <div class="quiz-intro-art" aria-hidden="true"><span>Q</span><i>✳</i></div>
    </div>

    <?php if ($quiz_finalizado): ?>
        <div class="quiz-result <?= $porcentagem >= 70 ? 'result-good' : 'result-try' ?>">
            <div class="result-medal"><?= $porcentagem >= 70 ? '✦' : '↗' ?></div>
            <span class="quiz-kicker">RESULTADO DO SEU DESAFIO</span>
            <h2><?= $porcentagem >= 70 ? 'Mandou bem!' : 'Cada tentativa ensina.' ?></h2>
            <p>Você acertou <strong><?= $acertos ?> de <?= $total ?></strong> questões.</p>
            <div class="result-score"><?= $porcentagem ?>%</div>
            <span class="result-xp">+<?= $pontos ?> pontos de experiência</span>
            <a href="quiz.php<?= $conteudo_id > 0 ? '?conteudo=' . $conteudo_id : '' ?>" class="btn btn-primary">Tentar outro quiz <span>↗</span></a>
        </div>
        <h2 class="quiz-review-title">Revise suas respostas</h2>
        <div class="quiz-review-list">
            <?php foreach ($respostas_detalhes as $index => $questao): ?>
                <?php $alternativas = ['A' => $questao['alt_a'], 'B' => $questao['alt_b'], 'C' => $questao['alt_c'], 'D' => $questao['alt_d']]; ?>
                <article class="quiz-review-card <?= $questao['correta'] ? 'review-correct' : 'review-wrong' ?>">
                    <span class="review-index">QUESTÃO <?= str_pad((string)($index + 1), 2, '0', STR_PAD_LEFT) ?></span>
                    <h3><?= escape($questao['enunciado']) ?></h3>
                    <p>Sua resposta: <strong><?= escape($questao['resposta_aluno']) ?>) <?= escape($alternativas[$questao['resposta_aluno']]) ?></strong></p>
                    <?php if (!$questao['correta']): ?><p>Gabarito: <strong><?= escape($questao['resposta_correta']) ?>) <?= escape($alternativas[$questao['resposta_correta']] ?? '') ?></strong></p><?php endif; ?>
                    <div class="review-explanation"><?= escape($questao['explicacao']) ?></div>
                </article>
            <?php endforeach; ?>
        </div>
    <?php elseif (empty($questoes)): ?>
        <div class="quiz-empty"><span>✳</span><h2>Seu próximo desafio está quase pronto.</h2><p>O professor ainda não adicionou questões de múltipla escolha para este conteúdo.</p><a href="conteudos.php" class="btn btn-primary">Voltar aos conteúdos</a></div>
    <?php else: ?>
        <form method="POST" action="quiz.php<?= $conteudo_id > 0 ? '?conteudo=' . $conteudo_id : '' ?>" class="quiz-form" data-quiz-form data-live-check data-question-count="<?= count($questoes) ?>">
            <input type="hidden" name="conteudo_id" value="<?= $conteudo_id ?>">
            <div class="quiz-progress-card"><div class="quiz-progress-copy"><span>Seu ritmo</span><strong id="quiz-progress-label">0 de <?= count($questoes) ?> respondidas</strong></div><div class="quiz-progress-track" role="progressbar" aria-label="Questões respondidas" aria-valuemin="0" aria-valuemax="<?= count($questoes) ?>" aria-valuenow="0"><span id="quiz-progress-fill"></span></div></div>
            <div class="quiz-question-list">
                <?php foreach ($questoes as $index => $questao): ?>
                    <fieldset class="quiz-question" data-question-card>
                        <legend class="sr-only">Questão <?= $index + 1 ?></legend>
                        <div class="quiz-question-top"><span class="question-badge"><?= str_pad((string)($index + 1), 2, '0', STR_PAD_LEFT) ?></span><span class="question-type">MÚLTIPLA ESCOLHA</span><span class="question-state">Pendente</span></div>
                        <p class="quiz-question-text"><?= escape($questao['enunciado']) ?></p>
                        <div class="quiz-options">
                            <?php foreach (['A' => $questao['alt_a'], 'B' => $questao['alt_b'], 'C' => $questao['alt_c'], 'D' => $questao['alt_d']] as $letra => $alternativa): ?>
                                <label class="quiz-option"><input type="radio" name="respostas[<?= (int)$questao['id'] ?>]" value="<?= $letra ?>" <?= $letra === 'A' ? 'required' : '' ?>><span class="option-letter"><?= $letra ?></span><span class="option-text"><?= escape($alternativa) ?></span><span class="option-check">✓</span></label>
                            <?php endforeach; ?>
                        </div>
                        <div class="quiz-live-feedback" data-live-feedback aria-live="polite" hidden></div>
                    </fieldset>
                <?php endforeach; ?>
            </div>
            <div class="quiz-submit-row"><span>Você pode revisar suas escolhas antes de finalizar.</span><button type="submit" class="btn btn-primary btn-large">Ver meu resultado <span>↗</span></button></div>
        </form>
    <?php endif; ?>
</section>

<?php require_once '../includes/footer.php'; ?>
