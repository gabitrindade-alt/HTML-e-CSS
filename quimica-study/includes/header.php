<?php
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/conexao.php';
require_once __DIR__ . '/funcoes.php';
requerLogin();

$usuario = getUsuarioLogado();
$pagina_atual = basename($_SERVER['PHP_SELF']);

// Atualiza pontos na sessão
$stmt_pts = $pdo->prepare("SELECT pontos, avatar_key, foto_perfil FROM usuarios WHERE id = :id");
$stmt_pts->execute(['id' => $usuario['id']]);
$usuario_perfil = $stmt_pts->fetch();
$pontos_atualizados = $usuario_perfil['pontos'];
$usuario['pontos'] = $pontos_atualizados;
$usuario['avatar_key'] = $usuario_perfil['avatar_key'];
$usuario['foto_perfil'] = $usuario_perfil['foto_perfil'];
$_SESSION['usuario_pontos'] = $pontos_atualizados;
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($titulo_pagina) ? $titulo_pagina . ' - ' : '' ?>Química Study</title>
    <script>try{if(localStorage.getItem("qs-theme")==="dark")document.documentElement.dataset.theme="dark";}catch(e){}</script>
    <link rel="stylesheet" href="../css/style.css?v=20261010-preferences">
    <link rel="stylesheet" href="../css/dashboard.css?v=20261010-preferences">
    <link rel="stylesheet" href="../css/preferences.css?v=20261010-agenda-calendar">
    <?php if (isset($css_extra)): ?>
        <link rel="stylesheet" href="../css/<?= escape($css_extra) ?>?v=20261010-agenda-calendar">
    <?php endif; ?>
</head>
<body class="dashboard-body student-app" data-user-role="<?= escape($usuario['tipo']) ?>">
    <div class="app-container">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <a href="../aluno/dashboard.php" class="logo brand-logo"><img src="../assets/logo-chem.svg" alt=""><span class="brand-name">Química<span>STUDY</span></span></a>
            </div>
            <nav class="sidebar-nav">
                <a href="dashboard.php" class="nav-item <?= $pagina_atual == 'dashboard.php' ? 'active' : '' ?>">
                    <span class="icon">📊</span> Dashboard
                </a>
                <a href="conteudos.php" class="nav-item <?= in_array($pagina_atual, ['conteudos.php', 'conteudo.php']) ? 'active' : '' ?>">
                    <span class="icon">📚</span> Conteúdos
                </a>
                <a href="tabela-periodica.php" class="nav-item <?= $pagina_atual == 'tabela-periodica.php' ? 'active' : '' ?>">
                    <span class="icon">⚛️</span> Tabela Periódica
                </a>
                <a href="trilha.php" class="nav-item <?= $pagina_atual == 'trilha.php' ? 'active' : '' ?>"><span class="icon">◎</span> Minha trilha</a>
                <a href="explorar.php" class="nav-item <?= $pagina_atual == 'explorar.php' ? 'active' : '' ?>"><span class="icon">⌕</span> Explorar</a>
                <a href="dicionario.php" class="nav-item <?= $pagina_atual == 'dicionario.php' ? 'active' : '' ?>"><span class="icon">Aa</span> Dicionário</a>
                <a href="formulas.php" class="nav-item <?= $pagina_atual == 'formulas.php' ? 'active' : '' ?>"><span class="icon">ƒ</span> Fórmulas</a>
                <a href="chat.php" class="nav-item <?= $pagina_atual == 'chat.php' ? 'active' : '' ?>"><span class="icon">✦</span> Ajuda nos estudos</a>
                <a href="flashcards.php" class="nav-item <?= $pagina_atual == 'flashcards.php' ? 'active' : '' ?>">
                    <span class="icon">🧠</span> Flashcards
                </a>
                <a href="quiz.php" class="nav-item <?= $pagina_atual == 'quiz.php' ? 'active' : '' ?>">
                    <span class="icon">⚡</span> Quiz Rápido
                </a>
                <a href="simulados.php" class="nav-item <?= in_array($pagina_atual, ['simulados.php', 'simulado.php', 'resultado.php']) ? 'active' : '' ?>">
                    <span class="icon">📝</span> Simulados
                </a>
                <a href="historico.php" class="nav-item <?= $pagina_atual == 'historico.php' ? 'active' : '' ?>">
                    <span class="icon">📜</span> Histórico
                </a>
                <a href="progresso.php" class="nav-item <?= $pagina_atual == 'progresso.php' ? 'active' : '' ?>">
                    <span class="icon">📈</span> Progresso
                </a>
                <a href="conquistas.php" class="nav-item <?= $pagina_atual == 'conquistas.php' ? 'active' : '' ?>">
                    <span class="icon">🏆</span> Conquistas
                </a>
                <a href="agenda.php" class="nav-item <?= $pagina_atual == 'agenda.php' ? 'active' : '' ?>"><span class="icon">▦</span> Agenda</a>
                <a href="perfil.php" class="nav-item <?= $pagina_atual == 'perfil.php' ? 'active' : '' ?>">
                    <span class="icon">👤</span> Perfil
                </a>
            </nav>
            <div class="sidebar-footer">
                <a href="../logout.php" class="nav-item logout">
                    <span class="icon">🚪</span> Sair
                </a>
            </div>
        </aside>

        <main class="main-content">
            <header class="topbar">
                <button class="menu-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
                <div class="appearance-controls"><label for="language-select" class="language-control"><span>Idioma</span><select id="language-select" aria-label="Idioma"><option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option></select></label><button type="button" class="theme-toggle" id="theme-toggle" aria-label="Alternar tema" aria-pressed="false"><span aria-hidden="true">◐</span><span id="theme-label">Modo escuro</span></button></div>
                <div class="user-info">
                    <span class="user-name">Olá, <?= escape($usuario['nome']) ?>!</span>
                    <span class="user-points">⭐ <?= $usuario['pontos'] ?> pts</span>
                </div>
            </header>
            <div class="content-wrapper">



