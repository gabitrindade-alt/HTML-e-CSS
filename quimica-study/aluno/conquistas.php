<?php
$titulo_pagina = "Conquistas";
require_once '../includes/header.php';

$usuario_id = $_SESSION['usuario_id'];

$stmt = $pdo->prepare("
    SELECT c.*, uc.desbloqueado_em IS NOT NULL as desbloqueada
    FROM conquistas c
    LEFT JOIN usuario_conquistas uc ON c.id = uc.conquista_id AND uc.usuario_id = :id
    ORDER BY desbloqueada DESC, c.id ASC
");
$stmt->execute(['id' => $usuario_id]);
$conquistas = $stmt->fetchAll();

$total = count($conquistas);
$desbloqueadas = count(array_filter($conquistas, fn($c) => $c['desbloqueada']));
?>

<h2 style="margin-bottom: 16px; color: #0f172a;">🏆 Suas Conquistas</h2>
<p style="color: #64748b; margin-bottom: 32px;">Você desbloqueou <strong><?= $desbloqueadas ?></strong> de <strong><?= $total ?></strong> conquistas.</p>

<?php if (!$conquistas): ?>
    <section class="student-empty-page"><span>✧</span><div><span class="panel-eyebrow">RECONHECIMENTO</span><h2>As conquistas estão sendo preparadas.</h2><p>Continue estudando e praticando. Assim que as conquistas forem publicadas, seu progresso aparecerá aqui.</p><a href="conteudos.php" class="btn btn-primary">Continuar estudando <span>→</span></a></div></section>
<?php else: ?>
<div class="content-grid">
    <?php foreach ($conquistas as $c): ?>
        <div class="conquista-card <?= $c['desbloqueada'] ? 'desbloqueada' : 'bloqueada' ?>">
            <div class="conquista-icone"><?= $c['icone'] ?></div>
            <h3 style="color: #0f172a; margin-bottom: 8px;"><?= escape($c['nome']) ?></h3>
            <p style="color: #64748b; font-size: 0.9rem;"><?= escape($c['descricao']) ?></p>
            <?php if ($c['desbloqueada']): ?>
                <div style="margin-top: 12px; color: #10b981; font-size: 0.85rem; font-weight: 600;">
                    ✅ Desbloqueada em <?= date('d/m/Y', strtotime($c['desbloqueado_em'])) ?>
                </div>
            <?php else: ?>
                <div style="margin-top: 12px; color: #94a3b8; font-size: 0.85rem;">🔒 Bloqueada</div>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<?php require_once '../includes/footer.php'; ?>
