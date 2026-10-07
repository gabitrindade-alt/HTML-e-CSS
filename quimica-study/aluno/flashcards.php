<?php
$titulo_pagina = 'Prática interativa';
$css_extra = 'flashcards.css';
$script_extra = 'flashcards.js';
require_once '../includes/header.php';

$stmt = $pdo->query("SELECT q.id, q.enunciado, q.alt_a, q.alt_b, q.alt_c, q.alt_d, q.resposta_correta, q.explicacao, c.titulo AS conteudo FROM questoes q LEFT JOIN conteudos c ON c.id = q.conteudo_id WHERE q.tipo = 'multipla' ORDER BY RAND() LIMIT 10");
$questoes_pratica = $stmt->fetchAll();
?>
<section class="practice-page">
    <header class="practice-heading"><div><span class="practice-eyebrow">PRÁTICA GUIADA · QUÍMICA</span><h1>Teste suas ideias na prática.</h1><p>Escolha uma alternativa e veja o resultado com uma explicação na hora.</p></div><div class="practice-streak" aria-hidden="true"><span>⚛</span><small>APRENDER<br>FAZENDO</small></div></header>
    <?php if (!$questoes_pratica): ?>
        <div class="practice-empty"><span>✧</span><h2>As questões estão sendo preparadas.</h2><p>Quando o professor publicar novas questões, elas aparecerão aqui para você.</p><a href="conteudos.php" class="btn btn-primary">Explorar conteúdos</a></div>
    <?php else: ?>
        <div class="practice-shell" data-practice data-count="<?= count($questoes_pratica) ?>">
            <div class="practice-overview"><div><span>QUESTÕES</span><strong id="practice-count">1 / <?= count($questoes_pratica) ?></strong></div><div class="practice-score"><span>ACERTOS</span><strong id="practice-score">0</strong></div><div class="practice-progress"><i id="practice-progress-fill"></i></div></div>
            <div class="practice-question-stack">
                <?php foreach ($questoes_pratica as $index => $q): ?>
                    <section class="practice-question" data-practice-question data-correct="<?= escape(strtoupper($q['resposta_correta'])) ?>" data-explanation="<?= escape($q['explicacao']) ?>" <?= $index > 0 ? 'hidden' : '' ?> aria-labelledby="practice-question-<?= $index ?>">
                        <div class="practice-question-meta"><span class="practice-number"><?= str_pad((string)($index + 1), 2, '0', STR_PAD_LEFT) ?></span><span><?= escape($q['conteudo'] ?? 'Química') ?></span></div>
                        <h2 id="practice-question-<?= $index ?>"><?= escape($q['enunciado']) ?></h2>
                        <div class="practice-choices">
                            <?php foreach (['A' => $q['alt_a'], 'B' => $q['alt_b'], 'C' => $q['alt_c'], 'D' => $q['alt_d']] as $letter => $choice): ?>
                                <?php if (trim((string)$choice) !== ''): ?><label class="practice-choice"><input type="radio" name="resposta_<?= (int)$q['id'] ?>" value="<?= $letter ?>"><span class="practice-choice-letter"><?= $letter ?></span><span class="practice-choice-text"><?= escape($choice) ?></span><span class="practice-choice-mark" aria-hidden="true"></span></label><?php endif; ?>
                            <?php endforeach; ?>
                        </div>
                        <div class="practice-feedback" data-practice-feedback aria-live="polite" hidden></div>
                    </section>
                <?php endforeach; ?>
            </div>
            <div class="practice-controls"><button type="button" class="btn btn-secondary" data-practice-prev disabled>← Anterior</button><span class="practice-hint" data-practice-hint>Selecione uma alternativa para conferir.</span><button type="button" class="btn btn-primary" data-practice-next disabled>Conferir resposta →</button></div>
            <section class="practice-finish" data-practice-finish hidden><span class="finish-symbol">✦</span><span class="practice-eyebrow">FIM DA RODADA</span><h2>Você avançou mais um pouco.</h2><p>Seu resultado: <strong data-practice-final-score>0 de 0</strong> respostas corretas.</p><button type="button" class="btn btn-primary" data-practice-restart>Praticar novamente ↻</button></section>
        </div>
    <?php endif; ?>
</section>
<?php require_once '../includes/footer.php'; ?>
