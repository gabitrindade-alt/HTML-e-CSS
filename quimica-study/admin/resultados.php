<?php
require_once '../includes/admin_auth.php';

$resultados = $pdo->query("
    SELECT h.*, u.nome as aluno_nome, s.titulo as simulado_titulo
    FROM historico_simulados h
    JOIN usuarios u ON h.usuario_id = u.id
    JOIN simulados s ON h.simulado_id = s.id
    ORDER BY h.realizado_em DESC
    LIMIT 100
")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultados - Admin</title>
    <link rel="stylesheet" href="../css/style.css?v=20261010-teacher">
    <link rel="stylesheet" href="../css/dashboard.css?v=20261010-teacher">
</head>
<body class="dashboard-body">
    <div class="app-container">
        <aside class="sidebar">
            <div class="sidebar-header"><a href="dashboard.php" class="logo brand-logo"><img src="../assets/logo-chem.svg" alt=""><span class="brand-name">Química<span>STUDY</span></span></a></div>
            <nav class="sidebar-nav">
                <a href="dashboard.php" class="nav-item"><span class="icon">📊</span> Dashboard</a>
                <a href="usuarios.php" class="nav-item"><span class="icon">👥</span> Usuários</a>
                <a href="conteudos.php" class="nav-item"><span class="icon">📚</span> Conteúdos</a>
                <a href="questoes.php" class="nav-item"><span class="icon">❓</span> Questões</a>
                <a href="simulados.php" class="nav-item"><span class="icon">📝</span> Simulados</a>
                <a href="resultados.php" class="nav-item active"><span class="icon">📈</span> Resultados</a><a href="agenda.php" class="nav-item"><span class="icon">▦</span> Agenda dos alunos</a>
                <a href="../logout.php" class="nav-item logout"><span class="icon">🚪</span> Sair</a>
            </nav>
        </aside>

        <main class="main-content">
            <header class="topbar"><div class="user-info"><span class="user-name">Administrador</span></div></header>
            <div class="content-wrapper">
                <h2 style="margin-bottom: 24px;">Resultados dos Alunos</h2>
                
                <?php if (empty($resultados)): ?>
                    <div class="alert" style="background: #f1f5f9; color: #64748b;">Nenhum resultado registrado ainda.</div>
                <?php else: ?>
                    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow);">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                <tr>
                                    <th style="padding: 16px; text-align: left;">Data</th>
                                    <th style="padding: 16px; text-align: left;">Aluno</th>
                                    <th style="padding: 16px; text-align: left;">Simulado</th>
                                    <th style="padding: 16px; text-align: center;">Acertos</th>
                                    <th style="padding: 16px; text-align: center;">%</th>
                                    <th style="padding: 16px; text-align: center;">Pontos</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($resultados as $r): ?>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 16px;"><?= date('d/m/Y H:i', strtotime($r['realizado_em'])) ?></td>
                                        <td style="padding: 16px; font-weight: 600;"><?= escape($r['aluno_nome']) ?></td>
                                        <td style="padding: 16px;"><?= escape($r['simulado_titulo']) ?></td>
                                        <td style="padding: 16px; text-align: center;"><?= $r['acertos'] ?>/<?= $r['total_questoes'] ?></td>
                                        <td style="padding: 16px; text-align: center;">
                                            <span style="background: <?= $r['porcentagem'] >= 70 ? '#dcfce7' : '#fee2e2' ?>; color: <?= $r['porcentagem'] >= 70 ? '#166534' : '#991b1b' ?>; padding: 4px 12px; border-radius: 12px; font-weight: 600;">
                                                <?= number_format($r['porcentagem'], 1) ?>%
                                            </span>
                                        </td>
                                        <td style="padding: 16px; text-align: center; font-weight: 700; color: #f59e0b;">+<?= $r['pontuacao'] ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </main>
    </div>
    <script src="../js/script.js?v=20261010-teacher"></script>
</body>
</html>