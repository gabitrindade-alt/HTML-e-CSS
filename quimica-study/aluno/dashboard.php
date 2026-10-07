<?php
$titulo_pagina = 'Painel de estudos';
require_once '../includes/header.php';

$usuario_id = (int)$_SESSION['usuario_id'];
$stmt = $pdo->prepare("SELECT COUNT(h.id) AS simulados_feitos, COALESCE(SUM(h.acertos), 0) AS total_acertos, COALESCE(SUM(h.total_questoes), 0) AS total_questoes_respondidas, u.pontos FROM usuarios u LEFT JOIN historico_simulados h ON u.id = h.usuario_id WHERE u.id = :id GROUP BY u.id, u.pontos");
$stmt->execute(['id' => $usuario_id]);
$stats = $stmt->fetch();
$aproveitamento = $stats['total_questoes_respondidas'] > 0 ? round(($stats['total_acertos'] / $stats['total_questoes_respondidas']) * 100) : 0;

$stmt_prog = $pdo->prepare("SELECT c.titulo, p.porcentagem_concluida FROM progresso p JOIN conteudos c ON p.conteudo_id = c.id WHERE p.usuario_id = :id ORDER BY p.ultima_atualizacao DESC LIMIT 3");
$stmt_prog->execute(['id' => $usuario_id]);
$progressos = $stmt_prog->fetchAll();
$stmt_next = $pdo->prepare('SELECT c.id, c.titulo, c.resumo, p.porcentagem_concluida FROM conteudos c LEFT JOIN progresso p ON p.conteudo_id = c.id AND p.usuario_id = :id WHERE p.id IS NULL OR p.porcentagem_concluida < 100 ORDER BY (p.id IS NULL) DESC, p.ultima_atualizacao ASC LIMIT 1');
$stmt_next->execute(['id' => $usuario_id]);
$proximo_conteudo = $stmt_next->fetch();
$stmt_recent = $pdo->prepare('SELECT h.id, h.realizado_em, h.acertos, h.total_questoes, h.porcentagem, s.titulo FROM historico_simulados h JOIN simulados s ON s.id = h.simulado_id WHERE h.usuario_id = :id ORDER BY h.realizado_em DESC, h.id DESC LIMIT 3');
$stmt_recent->execute(['id' => $usuario_id]);
$atividades = $stmt_recent->fetchAll();
$total_conteudos = (int)$pdo->query('SELECT COUNT(*) FROM conteudos')->fetchColumn();
?>
<section class="student-welcome">
    <div class="welcome-copy"><span class="panel-eyebrow">SEU ESPAÇO DE APRENDIZAGEM</span><h1>Vamos descobrir algo novo, <?= escape(explode(' ', trim($usuario['nome']))[0]) ?>?</h1><p>Continue no seu ritmo: cada conceito aprendido deixa a química mais clara.</p><div class="welcome-actions"><a class="btn btn-primary" href="quiz.php">Começar um quiz <span>↗</span></a><a class="welcome-link" href="conteudos.php">Explorar conteúdos <span>→</span></a></div></div>
    <div class="welcome-visual" aria-hidden="true"><span class="orbital orbital-one"></span><span class="orbital orbital-two"></span><span class="atom-core">Q</span><i>+</i><b>−</b><small>H₂O</small></div>
</section>

<div class="section-heading-row"><div><span class="panel-eyebrow">SEU DESEMPENHO</span><h2>Uma visão do seu progresso</h2></div><a href="historico.php">Ver histórico <span>→</span></a></div>
<section class="stats-grid student-stats">
    <article class="stat-card"><div class="stat-icon blue">✎</div><div class="stat-info"><h3><?= (int)$stats['simulados_feitos'] ?></h3><p>Simulados realizados</p></div><span class="stat-caption">DESAFIOS</span></article>
    <article class="stat-card"><div class="stat-icon green">✓</div><div class="stat-info"><h3><?= (int)$stats['total_acertos'] ?></h3><p>Questões acertadas</p></div><span class="stat-caption">ACERTOS</span></article>
    <article class="stat-card"><div class="stat-icon purple">◌</div><div class="stat-info"><h3><?= $aproveitamento ?><small>%</small></h3><p>Aproveitamento geral</p></div><span class="stat-caption">MÉDIA</span></article>
    <article class="stat-card"><div class="stat-icon orange">✦</div><div class="stat-info"><h3><?= (int)$stats['pontos'] ?></h3><p>Pontos de experiência</p></div><span class="stat-caption">XP</span></article>
</section>

<div class="student-lower-grid">
    <section class="student-panel progress-panel"><div class="section-heading-row"><div><span class="panel-eyebrow">RETOME DE ONDE PAROU</span><h2>Seus conteúdos</h2></div><a href="conteudos.php">Ver todos <span>→</span></a></div>
        <?php if ($progressos): ?><div class="dashboard-progress-list"><?php foreach ($progressos as $prog): $pct = max(0, min(100, (float)$prog['porcentagem_concluida'])); ?><article class="dashboard-progress-item"><div class="progress-title"><span><?= escape($prog['titulo']) ?></span><strong><?= number_format($pct, 0) ?>%</strong></div><div class="progress-bar-bg"><div class="progress-bar-fill" style="width: <?= $pct ?>%"></div></div></article><?php endforeach; ?></div>
        <?php else: ?><div class="student-empty"><span>✧</span><div><strong>Seu primeiro passo começa aqui</strong><p>Escolha um conteúdo para começar a montar seu caminho de estudos.</p></div><a href="conteudos.php" class="btn btn-secondary">Encontrar um tema</a></div><?php endif; ?>
        <?php if ($proximo_conteudo): ?><a class="next-topic-card" href="conteudo.php?id=<?= (int)$proximo_conteudo['id'] ?>"><span class="next-topic-icon">✦</span><span class="next-topic-copy"><small>PRÓXIMO PASSO SUGERIDO</small><strong><?= escape($proximo_conteudo['titulo']) ?></strong><span><?= escape($proximo_conteudo['resumo']) ?></span></span><b>Continuar <i>→</i></b></a><?php endif; ?>
    </section>
    <aside class="student-panel study-tools"><span class="panel-eyebrow">FERRAMENTAS DE ESTUDO</span><h2>Aprender também pode ser leve.</h2><p>Alterne entre leitura, prática e revisão para fixar cada assunto.</p><a class="study-tool-link" href="tabela-periodica.php"><span class="tool-icon">⚛</span><span><strong>Tabela periódica</strong><small>Explore os elementos</small></span><b>↗</b></a><a class="study-tool-link" href="flashcards.php"><span class="tool-icon pink">▤</span><span><strong>Flashcards</strong><small>Revise conceitos-chave</small></span><b>↗</b></a><a class="study-tool-link" href="trilha.php"><span class="tool-icon">◎</span><span><strong>Minha trilha de estudos</strong><small>Planeje o que quer aprender</small></span><b>→</b></a><a class="study-tool-link" href="chat.php"><span class="tool-icon pink">✦</span><span><strong>Ajuda nos estudos</strong><small>Tire dúvidas enquanto aprende</small></span><b>→</b></a><div class="content-coverage"><div><span>Conteúdos disponíveis</span><strong><?= $total_conteudos ?></strong></div><span class="coverage-track"><i style="width: <?= $total_conteudos ? '100' : '0' ?>%"></i></span></div></aside>
</div>
<section class="student-panel recent-activity-panel"><div class="section-heading-row"><div><span class="panel-eyebrow">SUA ATIVIDADE</span><h2>Simulados recentes</h2></div><a href="historico.php">Abrir histórico <span>→</span></a></div>
    <?php if ($atividades): ?><div class="recent-activity-list"><?php foreach ($atividades as $atividade): $pct = max(0, min(100, (float)$atividade['porcentagem'])); ?><article class="recent-activity-item"><span class="activity-mark <?= $pct >= 70 ? 'activity-good' : 'activity-review' ?>"><?= $pct >= 70 ? '✓' : '↗' ?></span><div class="activity-name"><strong><?= escape($atividade['titulo']) ?></strong><small><?= date('d/m/Y · H:i', strtotime($atividade['realizado_em'])) ?> · <?= (int)$atividade['acertos'] ?>/<?= (int)$atividade['total_questoes'] ?> acertos</small></div><span class="activity-result"><?= number_format($pct, 0) ?>%</span></article><?php endforeach; ?></div>
    <?php else: ?><div class="activity-empty"><span>◷</span><div><strong>Seu histórico começa no primeiro simulado.</strong><p>As tentativas ficam salvas aqui para você acompanhar a sua evolução.</p></div><a href="simulados.php" class="btn btn-secondary">Escolher simulado</a></div><?php endif; ?>
</section>
<?php require_once '../includes/footer.php'; ?>

