<?php
$titulo_pagina = 'Histórico de simulados';
$css_extra = 'history.css';
require_once '../includes/header.php';

$usuario_id = (int)$_SESSION['usuario_id'];
$_SESSION['history_csrf'] ??= bin2hex(random_bytes(32));
$erro = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['history_csrf'], $_POST['csrf'])) {
        $erro = 'Sua sessão expirou. Atualize a página e tente novamente.';
    } else {
        $action = $_POST['action'] ?? '';
        if ($action === 'delete_one') {
            $record_id = filter_var($_POST['record_id'] ?? null, FILTER_VALIDATE_INT);
            if ($record_id) {
                $stmt_delete = $pdo->prepare('DELETE FROM historico_simulados WHERE id = :id AND usuario_id = :usuario_id');
                $stmt_delete->execute(['id' => $record_id, 'usuario_id' => $usuario_id]);
                $_SESSION['history_notice'] = $stmt_delete->rowCount() ? 'Resultado removido do seu histórico.' : 'Esse resultado já não está no seu histórico.';
                redirecionar('historico.php');
            }
            $erro = 'Não foi possível identificar o resultado.';
        } elseif ($action === 'delete_all') {
            $stmt_delete = $pdo->prepare('DELETE FROM historico_simulados WHERE usuario_id = :usuario_id');
            $stmt_delete->execute(['usuario_id' => $usuario_id]);
            $_SESSION['history_notice'] = 'Seu histórico de simulados foi apagado.';
            redirecionar('historico.php');
        } else {
            $erro = 'Ação inválida.';
        }
    }
}
$notice = $_SESSION['history_notice'] ?? '';
unset($_SESSION['history_notice']);

$stmt_stats = $pdo->prepare('SELECT COUNT(*) AS total, COALESCE(AVG(porcentagem), 0) AS media, COALESCE(MAX(porcentagem), 0) AS melhor, COALESCE(SUM(acertos), 0) AS acertos FROM historico_simulados WHERE usuario_id = :id');
$stmt_stats->execute(['id' => $usuario_id]);
$stats = $stmt_stats->fetch();
$stmt = $pdo->prepare('SELECT h.id, h.realizado_em, s.titulo AS simulado_titulo, h.acertos, h.total_questoes, h.porcentagem, h.pontuacao FROM historico_simulados h JOIN simulados s ON h.simulado_id = s.id WHERE h.usuario_id = :id ORDER BY h.realizado_em DESC, h.id DESC');
$stmt->execute(['id' => $usuario_id]);
$historico = $stmt->fetchAll();
?>
<section class="history-page">
    <header class="history-hero"><div><span class="history-eyebrow">SUA JORNADA</span><h1>Histórico de simulados</h1><p>Acompanhe suas tentativas, veja sua evolução e escolha o próximo desafio.</p></div><a class="btn btn-primary" href="simulados.php">Fazer um simulado <span>↗</span></a></header>
    <?php if ($notice): ?><div class="history-notice" role="status"><?= escape($notice) ?></div><?php endif; ?>
    <?php if ($erro): ?><div class="history-notice history-error" role="alert"><?= escape($erro) ?></div><?php endif; ?>
    <div class="history-stat-grid"><article><span class="history-stat-icon">▤</span><div><strong><?= (int)$stats['total'] ?></strong><small>Simulados feitos</small></div></article><article><span class="history-stat-icon pink">◌</span><div><strong><?= number_format((float)$stats['media'], 1) ?>%</strong><small>Aproveitamento médio</small></div></article><article><span class="history-stat-icon gold">✦</span><div><strong><?= number_format((float)$stats['melhor'], 1) ?>%</strong><small>Seu melhor resultado</small></div></article><article><span class="history-stat-icon">✓</span><div><strong><?= (int)$stats['acertos'] ?></strong><small>Questões acertadas</small></div></article></div>
    <section class="history-card"><div class="history-card-heading"><div><span class="history-eyebrow">RESULTADOS REGISTRADOS</span><h2>Suas tentativas</h2><p>Apagar um resultado remove apenas o registro. Seus pontos acumulados permanecem.</p></div>
        <?php if ($historico): ?><form method="POST" action="historico.php" onsubmit="return confirm('Apagar todo o seu histórico de simulados? Essa ação não pode ser desfeita. Seus pontos permanecem.')"><input type="hidden" name="csrf" value="<?= escape($_SESSION['history_csrf']) ?>"><input type="hidden" name="action" value="delete_all"><button class="history-clear-button" type="submit">Apagar todo o histórico</button></form><?php endif; ?>
    </div>
    <?php if (!$historico): ?><div class="history-empty"><span class="history-empty-art">↗</span><div><h3>Seu próximo resultado começa com uma tentativa.</h3><p>Quando você concluir um simulado, a data, os acertos e seu aproveitamento aparecerão aqui.</p><a class="btn btn-primary" href="simulados.php">Explorar simulados <span>→</span></a></div></div>
    <?php else: ?><div class="history-table-wrap"><table class="history-table"><thead><tr><th>Simulado</th><th>Data</th><th>Acertos</th><th>Aproveitamento</th><th>Pontos</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody><?php foreach ($historico as $item): $percent = max(0, min(100, (float)$item['porcentagem'])); ?><tr><td><strong><?= escape($item['simulado_titulo']) ?></strong></td><td><?= date('d/m/Y · H:i', strtotime($item['realizado_em'])) ?></td><td><strong class="history-correct-count"><?= (int)$item['acertos'] ?> <small>/ <?= (int)$item['total_questoes'] ?></small></strong></td><td><div class="history-score"><span class="history-score-track"><i style="width:<?= $percent ?>%"></i></span><strong><?= number_format($percent, 1) ?>%</strong></div></td><td><span class="history-xp">+<?= (int)$item['pontuacao'] ?> XP</span></td><td><form method="POST" action="historico.php" onsubmit="return confirm('Remover este resultado do seu histórico? Seus pontos permanecem.')"><input type="hidden" name="csrf" value="<?= escape($_SESSION['history_csrf']) ?>"><input type="hidden" name="action" value="delete_one"><input type="hidden" name="record_id" value="<?= (int)$item['id'] ?>"><button class="history-delete-button" type="submit" aria-label="Apagar resultado de <?= escape($item['simulado_titulo']) ?>">Apagar</button></form></td></tr><?php endforeach; ?></tbody></table></div><?php endif; ?>
    </section>
</section>
<?php require_once '../includes/footer.php'; ?>
