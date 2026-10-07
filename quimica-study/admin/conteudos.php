<?php
require_once '../includes/admin_auth.php';

$mensagem = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['acao']) && $_POST['acao'] === 'cadastrar') {
    $titulo = trim($_POST['titulo']);
    $resumo = trim($_POST['resumo']);
    $conteudo = trim($_POST['conteudo']);
    $categoria = trim($_POST['categoria']);

    try {
        $stmt = $pdo->prepare("INSERT INTO conteudos (titulo, resumo, conteudo_completo, categoria) VALUES (?, ?, ?, ?)");
        $stmt->execute([$titulo, $resumo, $conteudo, $categoria]);
        $mensagem = "Conteúdo cadastrado com sucesso!";
    } catch (PDOException $e) {
        $mensagem = "Erro: " . $e->getMessage();
    }
}

if (isset($_GET['excluir'])) {
    $pdo->prepare("DELETE FROM conteudos WHERE id = ?")->execute([(int)$_GET['excluir']]);
    header("Location: conteudos.php");
    exit;
}

$conteudos = $pdo->query("SELECT id, titulo, categoria, criado_em FROM conteudos ORDER BY id DESC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerenciar Conteúdos - Admin</title>
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
                <a href="conteudos.php" class="nav-item active"><span class="icon">📚</span> Conteúdos</a>
                <a href="questoes.php" class="nav-item"><span class="icon">❓</span> Questões</a>
                <a href="simulados.php" class="nav-item"><span class="icon">📝</span> Simulados</a>
                <a href="resultados.php" class="nav-item"><span class="icon">📈</span> Resultados</a><a href="agenda.php" class="nav-item"><span class="icon">▦</span> Agenda dos alunos</a>
                <a href="../logout.php" class="nav-item logout"><span class="icon">🚪</span> Sair</a>
            </nav>
        </aside>

        <main class="main-content">
            <header class="topbar"><div class="user-info"><span class="user-name">Administrador</span></div></header>
            <div class="content-wrapper">
                <h2 style="margin-bottom: 24px;">Gerenciar Conteúdos</h2>
                
                <?php if ($mensagem): ?><div class="alert alert-success"><?= escape($mensagem) ?></div><?php endif; ?>

                <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 32px; box-shadow: var(--shadow);">
                    <h3 style="margin-bottom: 16px;">Novo Conteúdo</h3>
                    <form method="POST" action="conteudos.php">
                        <input type="hidden" name="acao" value="cadastrar">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div class="form-group" style="margin:0;"><label>Título</label><input type="text" name="titulo" required></div>
                            <div class="form-group" style="margin:0;"><label>Categoria</label><input type="text" name="categoria" required placeholder="Ex: Geral, Inorgânica"></div>
                        </div>
                        <div class="form-group"><label>Resumo</label><input type="text" name="resumo" required></div>
                        <div class="form-group"><label>Conteúdo Completo (aceita HTML)</label><textarea name="conteudo" rows="6" style="width:100%; padding:12px; border:2px solid #e2e8f0; border-radius:8px;" required></textarea></div>
                        <button type="submit" class="btn btn-primary">Salvar Conteúdo</button>
                    </form>
                </div>

                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <tr>
                                <th style="padding: 16px; text-align: left;">ID</th>
                                <th style="padding: 16px; text-align: left;">Título</th>
                                <th style="padding: 16px; text-align: left;">Categoria</th>
                                <th style="padding: 16px; text-align: right;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($conteudos as $c): ?>
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 16px;"><?= $c['id'] ?></td>
                                    <td style="padding: 16px; font-weight: 600;"><?= escape($c['titulo']) ?></td>
                                    <td style="padding: 16px;"><span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:4px; font-size:0.85rem;"><?= escape($c['categoria']) ?></span></td>
                                    <td style="padding: 16px; text-align: right;">
                                        <a href="?excluir=<?= $c['id'] ?>" onclick="return confirm('Excluir?')" style="color: #ef4444; text-decoration: none; font-weight: 600;">Excluir</a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
    <script src="../js/script.js?v=20261010-teacher"></script>
</body>
</html>