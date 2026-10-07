<?php
$titulo_pagina = "Conteúdos";
require_once '../includes/header.php';

$stmt = $pdo->query("SELECT id, titulo, resumo, categoria FROM conteudos ORDER BY id ASC");
$conteudos = $stmt->fetchAll();
?>

<h2 style="margin-bottom: 24px; color: #0f172a;">Materiais de Estudo</h2>
<p style="color: #64748b; margin-bottom: 32px;">Selecione um tópico para começar a estudar e ganhar pontos de experiência.</p>

<?php if (!$conteudos): ?>
    <section class="student-empty-page"><span>▤</span><div><span class="panel-eyebrow">NOVOS MATERIAIS EM BREVE</span><h2>Seu espaço de estudo está sendo preparado.</h2><p>Quando o professor publicar novos conteúdos, eles aparecerão aqui. Enquanto isso, explore os elementos e suas propriedades.</p><a href="tabela-periodica.php" class="btn btn-primary">Abrir tabela periódica <span>→</span></a></div></section>
<?php else: ?>
<div class="content-grid">
    <?php foreach ($conteudos as $item): ?>
        <div class="content-card">
            <div class="content-card-header">
                <span><?= escape($item['categoria']) ?></span>
                <h3><?= escape($item['titulo']) ?></h3>
            </div>
            <div class="content-card-body">
                <p><?= escape($item['resumo']) ?></p>
                <a href="conteudo.php?id=<?= $item['id'] ?>" class="btn btn-primary" style="width: 100%;">Estudar Agora</a>
            </div>
        </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<?php require_once '../includes/footer.php'; ?>
