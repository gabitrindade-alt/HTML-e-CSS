<?php
$titulo_pagina = "Simulados";
require_once '../includes/header.php';

$stmt = $pdo->query("
    SELECT s.id, s.titulo, s.descricao, c.titulo as categoria_nome,
           COUNT(sq.questao_id) as total_questoes
    FROM simulados s
    LEFT JOIN conteudos c ON s.conteudo_id = c.id
    LEFT JOIN simulado_questoes sq ON s.id = sq.simulado_id
    GROUP BY s.id
    ORDER BY s.id DESC
");
$simulados = $stmt->fetchAll();
?>

<h2 style="margin-bottom: 16px; color: #0f172a;">Simulados Disponíveis</h2>
<p style="color: #64748b; margin-bottom: 32px;">Teste seus conhecimentos e ganhe pontos extras.</p>

<?php if (!$simulados): ?>
    <section class="student-empty-page"><span>✎</span><div><span class="panel-eyebrow">DESAFIOS EM BREVE</span><h2>Ainda não há simulados publicados.</h2><p>O professor pode montar desafios usando as questões da plataforma. Você será avisado aqui quando houver um novo simulado.</p><a href="flashcards.php" class="btn btn-primary">Praticar questões agora <span>→</span></a></div></section>
<?php else: ?>
<div class="content-grid">
    <?php foreach ($simulados as $sim): ?>
        <div class="content-card">
            <div class="content-card-header">
                <span><?= escape($sim['categoria_nome'] ?? 'Geral') ?></span>
                <h3><?= escape($sim['titulo']) ?></h3>
            </div>
            <div class="content-card-body">
                <p><?= escape($sim['descricao']) ?></p>
                <p style="font-weight: 600; color: #0f172a; margin-bottom: 16px;">📝 <?= $sim['total_questoes'] ?> questões</p>
                <a href="simulado.php?id=<?= $sim['id'] ?>" class="btn btn-primary" style="width: 100%;">Iniciar Simulado</a>
            </div>
        </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<?php require_once '../includes/footer.php'; ?>
