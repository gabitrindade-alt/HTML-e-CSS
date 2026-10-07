<?php
require_once '../includes/admin_auth.php';

$mensagem = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['acao']) && $_POST['acao'] === 'cadastrar') {
    $nome = trim($_POST['nome']);
    $email = trim($_POST['email']);
    $senha = $_POST['senha'];
    $tipo = $_POST['tipo'];
    
    try {
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)");
        $stmt->execute([$nome, $email, $hash, $tipo]);
        $mensagem = "Usuário cadastrado com sucesso!";
    } catch (PDOException $e) {
        $mensagem = "Erro: " . $e->getMessage();
    }
}

if (isset($_GET['excluir'])) {
    $id = (int)$_GET['excluir'];
    if ($id != $_SESSION['usuario_id']) {
        $pdo->prepare("DELETE FROM usuarios WHERE id = ?")->execute([$id]);
    }
    header("Location: usuarios.php");
    exit;
}

$usuarios = $pdo->query("SELECT id, nome, email, tipo, pontos, criado_em FROM usuarios ORDER BY id DESC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerenciar Usuários - Admin</title>
    <link rel="stylesheet" href="../css/style.css?v=20261010-teacher">
    <link rel="stylesheet" href="../css/dashboard.css?v=20261010-teacher">
</head>
<body class="dashboard-body">
    <div class="app-container">
        <aside class="sidebar">
            <div class="sidebar-header"><a href="dashboard.php" class="logo brand-logo"><img src="../assets/logo-chem.svg" alt=""><span class="brand-name">Química<span>STUDY</span></span></a></div>
            <nav class="sidebar-nav">
                <a href="dashboard.php" class="nav-item"><span class="icon">📊</span> Dashboard</a>
                <a href="usuarios.php" class="nav-item active"><span class="icon">👥</span> Usuários</a>
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
                <h2 style="margin-bottom: 24px;">Gerenciar Usuários</h2>
                
                <?php if ($mensagem): ?><div class="alert alert-success"><?= escape($mensagem) ?></div><?php endif; ?>

                <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 32px; box-shadow: var(--shadow);">
                    <h3 style="margin-bottom: 16px;">Novo Usuário</h3>
                    <form method="POST" action="usuarios.php">
                        <input type="hidden" name="acao" value="cadastrar">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div class="form-group" style="margin:0;"><label>Nome</label><input type="text" name="nome" required></div>
                            <div class="form-group" style="margin:0;"><label>E-mail</label><input type="email" name="email" required></div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div class="form-group" style="margin:0;"><label>Senha</label><input type="password" name="senha" required></div>
                            <div class="form-group" style="margin:0;">
                                <label>Tipo</label>
                                <select name="tipo" style="width:100%; padding:12px; border:2px solid #e2e8f0; border-radius:8px;">
                                    <option value="aluno">Aluno</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">Cadastrar</button>
                    </form>
                </div>

                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <tr>
                                <th style="padding: 16px; text-align: left;">ID</th>
                                <th style="padding: 16px; text-align: left;">Nome</th>
                                <th style="padding: 16px; text-align: left;">E-mail</th>
                                <th style="padding: 16px; text-align: center;">Tipo</th>
                                <th style="padding: 16px; text-align: center;">Pontos</th>
                                <th style="padding: 16px; text-align: right;">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($usuarios as $u): ?>
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 16px;"><?= $u['id'] ?></td>
                                    <td style="padding: 16px; font-weight: 600;"><?= escape($u['nome']) ?></td>
                                    <td style="padding: 16px;"><?= escape($u['email']) ?></td>
                                    <td style="padding: 16px; text-align: center;">
                                        <span style="background: <?= $u['tipo'] === 'admin' ? '#f3e8ff' : '#e0f2fe' ?>; color: <?= $u['tipo'] === 'admin' ? '#7e22ce' : '#0369a1' ?>; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                                            <?= ucfirst($u['tipo']) ?>
                                        </span>
                                    </td>
                                    <td style="padding: 16px; text-align: center; font-weight: 700; color: #f59e0b;"><?= $u['pontos'] ?></td>
                                    <td style="padding: 16px; text-align: right;">
                                        <?php if ($u['id'] != $_SESSION['usuario_id']): ?>
                                            <a href="?excluir=<?= $u['id'] ?>" onclick="return confirm('Excluir este usuário?')" style="color: #ef4444; text-decoration: none; font-weight: 600;">Excluir</a>
                                        <?php else: ?>
                                            <span style="color: #94a3b8;">Você</span>
                                        <?php endif; ?>
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