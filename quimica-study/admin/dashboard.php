<?php
require_once '../includes/admin_auth.php';

$total_alunos = $pdo->query("SELECT COUNT(*) FROM usuarios WHERE tipo = 'aluno'")->fetchColumn();
$total_conteudos = $pdo->query("SELECT COUNT(*) FROM conteudos")->fetchColumn();
$total_questoes = $pdo->query("SELECT COUNT(*) FROM questoes")->fetchColumn();
$total_simulados = $pdo->query("SELECT COUNT(*) FROM simulados")->fetchColumn();
$total_simulados_realizados = $pdo->query("SELECT COUNT(*) FROM historico_simulados")->fetchColumn();
$media_geral = $pdo->query("SELECT AVG(porcentagem) FROM historico_simulados")->fetchColumn() ?? 0;
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Química Study</title>
    <link rel="stylesheet" href="../css/style.css?v=20261010-teacher">
    <link rel="stylesheet" href="../css/dashboard.css?v=20261010-teacher">
</head>
<body class="dashboard-body">
    <div class="app-container">
        <aside class="sidebar">
            <div class="sidebar-header"><a href="dashboard.php" class="logo brand-logo"><img src="../assets/logo-chem.svg" alt=""><span class="brand-name">Química<span>STUDY</span></span></a></div>
            <nav class="sidebar-nav">
                <a href="dashboard.php" class="nav-item active"><span class="icon">📊</span> Dashboard</a>
                <a href="usuarios.php" class="nav-item"><span class="icon">👥</span> Usuários</a>
                <a href="conteudos.php" class="nav-item"><span class="icon">📚</span> Conteúdos</a>
                <a href="questoes.php" class="nav-item"><span class="icon">❓</span> Questões</a>
                <a href="simulados.php" class="nav-item"><span class="icon">📝</span> Simulados</a>
                <a href="resultados.php" class="nav-item"><span class="icon">📈</span> Resultados</a><a href="agenda.php" class="nav-item"><span class="icon">▦</span> Agenda dos alunos</a>
                <a href="../logout.php" class="nav-item logout"><span class="icon">🚪</span> Sair</a>
            </nav>
        </aside>

        <main class="main-content">
            <header class="topbar"><div class="user-info"><span class="user-name">Administrador</span></div></header>
            <div class="content-wrapper">
                <h2 style="margin-bottom: 24px; color: #0f172a;">Visão Geral do Sistema</h2>
                
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-icon blue">👥</div><div class="stat-info"><h3><?= $total_alunos ?></h3><p>Alunos</p></div></div>
                    <div class="stat-card"><div class="stat-icon green">📚</div><div class="stat-info"><h3><?= $total_conteudos ?></h3><p>Conteúdos</p></div></div>
                    <div class="stat-card"><div class="stat-icon purple">❓</div><div class="stat-info"><h3><?= $total_questoes ?></h3><p>Questões</p></div></div>
                    <div class="stat-card"><div class="stat-icon orange">📝</div><div class="stat-info"><h3><?= $total_simulados ?></h3><p>Simulados</p></div></div>
                    <div class="stat-card"><div class="stat-icon blue">📊</div><div class="stat-info"><h3><?= $total_simulados_realizados ?></h3><p>Simulados Realizados</p></div></div>
                    <div class="stat-card"><div class="stat-icon green">🎯</div><div class="stat-info"><h3><?= number_format($media_geral, 1) ?>%</h3><p>Média Geral</p></div></div>
                </div>

                <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow);">
                    <h3 style="margin-bottom: 16px;">Ações Rápidas</h3>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <a href="conteudos.php" class="btn btn-primary">Gerenciar Conteúdos</a>
                        <a href="questoes.php" class="btn btn-secondary">Gerenciar Questões</a>
                        <a href="usuarios.php" class="btn btn-secondary">Gerenciar Usuários</a>
                        <a href="resultados.php" class="btn btn-secondary">Ver Resultados</a>
                        <a href="agenda.php" class="btn btn-secondary">Agenda dos alunos</a>
                    </div>
                </div>
            </div>
        </main>
    </div>
    <script src="../js/script.js?v=20261010-teacher"></script>
</body>
</html>