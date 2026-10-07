<?php
$titulo_pagina = "Conteúdo";
require_once '../includes/header.php';

$conteudo_id = (int)($_GET['id'] ?? 0);
$usuario_id = $_SESSION['usuario_id'];

$stmt = $pdo->prepare("SELECT * FROM conteudos WHERE id = :id");
$stmt->execute(['id' => $conteudo_id]);
$conteudo = $stmt->fetch();

if (!$conteudo) {
    echo "<div class='alert alert-error'>Conteúdo não encontrado.</div>";
    require_once '../includes/footer.php';
    exit;
}

// Atualiza progresso
$stmt_prog = $pdo->prepare("SELECT id FROM progresso WHERE usuario_id = :uid AND conteudo_id = :cid");
$stmt_prog->execute(['uid' => $usuario_id, 'cid' => $conteudo_id]);
if (!$stmt_prog->fetch()) {
    $stmt_ins = $pdo->prepare("INSERT INTO progresso (usuario_id, conteudo_id, porcentagem_concluida) VALUES (:uid, :cid, 25.00)");
    $stmt_ins->execute(['uid' => $usuario_id, 'cid' => $conteudo_id]);
} else {
    $stmt_upd = $pdo->prepare("UPDATE progresso SET porcentagem_concluida = LEAST(100, porcentagem_concluida + 25) WHERE usuario_id = :uid AND conteudo_id = :cid");
    $stmt_upd->execute(['uid' => $usuario_id, 'cid' => $conteudo_id]);
}

// Adiciona pontos por estudar
$stmt_pts = $pdo->prepare("UPDATE usuarios SET pontos = pontos + 5 WHERE id = :id");
$stmt_pts->execute(['id' => $usuario_id]);
?>

<div style="background: white; padding: 32px; border-radius: 12px; box-shadow: var(--shadow);">
    <div style="margin-bottom: 24px;">
        <span style="background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;"><?= escape($conteudo['categoria']) ?></span>
    </div>
    <h1 style="color: #0f172a; margin-bottom: 16px;"><?= escape($conteudo['titulo']) ?></h1>
    <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 32px;"><?= escape($conteudo['resumo']) ?></p>
    
    <div style="line-height: 1.8; color: #334155;">
        <?= $conteudo['conteudo_completo'] ?>
    </div>

    <div style="margin-top: 32px; padding: 16px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
        <strong>+5 pontos ganhos por estudar este conteúdo!</strong> 🎉
    </div>

    <div style="margin-top: 24px; display: flex; gap: 12px;">
        <a href="conteudos.php" class="btn btn-secondary">← Voltar</a>
        <a href="quiz.php?conteudo=<?= $conteudo_id ?>" class="btn btn-primary">Testar Conhecimento</a>
    </div>
</div>

<?php require_once '../includes/footer.php'; ?>