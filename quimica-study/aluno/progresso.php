<?php
$titulo_pagina = 'Meu progresso';
$css_extra = 'progress.css';
require_once '../includes/header.php';
$usuario_id = (int)$_SESSION['usuario_id'];
$stmt = $pdo->prepare('SELECT c.id, c.titulo, c.resumo, p.porcentagem_concluida, p.ultima_atualizacao FROM progresso p JOIN conteudos c ON c.id = p.conteudo_id WHERE p.usuario_id = :id ORDER BY p.porcentagem_concluida DESC, p.ultima_atualizacao DESC');
$stmt->execute(['id' => $usuario_id]);
$progressos = $stmt->fetchAll();
$stmt_stats = $pdo->prepare('SELECT COUNT(*) AS tentativas, COALESCE(AVG(porcentagem), 0) AS media, COALESCE(MAX(porcentagem), 0) AS melhor FROM historico_simulados WHERE usuario_id = :id');
$stmt_stats->execute(['id' => $usuario_id]);
$stats = $stmt_stats->fetch();
$concluidos = count(array_filter($progressos, static fn($p) => (float)$p['porcentagem_concluida'] >= 100));
?>
<section class="progress-page"><header class="progress-hero"><span class="panel-eyebrow">SEU CAMINHO DE APRENDIZAGEM</span><h1>O progresso acontece passo a passo.</h1><p>Acompanhe o que você já estudou e retome os conteúdos quando quiser.</p></header>
<div class="progress-summary"><article><span>◷</span><div><strong><?= (int)$stats['tentativas'] ?></strong><small>Simulados concluídos</small></div></article><article><span class="pink">◌</span><div><strong><?= number_format((float)$stats['media'], 1) ?>%</strong><small>Média nos simulados</small></div></article><article><span class="gold">✦</span><div><strong><?= number_format((float)$stats['melhor'], 1) ?>%</strong><small>Seu melhor resultado</small></div></article><article><span>▤</span><div><strong><?= $concluidos ?></strong><small>Conteúdos concluídos</small></div></article></div>
<section class="progress-content-panel"><div class="progress-panel-heading"><div><span class="panel-eyebrow">SEUS CONTEÚDOS</span><h2>Retome seus estudos</h2></div><a href="conteudos.php">Ver biblioteca <span>→</span></a></div>
<?php if (!$progressos): ?><div class="student-empty-page compact-empty"><span>▤</span><div><h2>Seu primeiro conteúdo ainda está à espera.</h2><p>Abra um tema para registrar o início da sua trilha. Seu progresso ficará salvo automaticamente.</p><a href="conteudos.php" class="btn btn-primary">Escolher conteúdo <span>→</span></a></div></div>
<?php else: ?><div class="progress-content-list"><?php foreach ($progressos as $item): $percent = max(0, min(100, (float)$item['porcentagem_concluida'])); ?><article class="progress-content-item"><span class="progress-content-symbol">⚛</span><div class="progress-content-main"><div class="progress-content-title"><strong><?= escape($item['titulo']) ?></strong><span><?= number_format($percent, 0) ?>%</span></div><p><?= escape($item['resumo']) ?></p><span class="progress-long-track"><i style="width:<?= $percent ?>%"></i></span><small>Atualizado em <?= date('d/m/Y · H:i', strtotime($item['ultima_atualizacao'])) ?></small></div><a href="conteudo.php?id=<?= (int)$item['id'] ?>" aria-label="Continuar <?= escape($item['titulo']) ?>">Continuar <span>→</span></a></article><?php endforeach; ?></div><?php endif; ?>
</section>
</section>
<?php require_once '../includes/footer.php'; ?>
