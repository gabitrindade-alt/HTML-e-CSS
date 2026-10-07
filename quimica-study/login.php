<?php
require_once 'includes/conexao.php';
require_once 'includes/funcoes.php';
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

$erro = '';
$_SESSION['auth_csrf'] ??= bin2hex(random_bytes(32));
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    $senha = (string)($_POST['senha'] ?? '');
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['auth_csrf'], $_POST['csrf'])) {
        $erro = 'A sessão expirou. Atualize a página e tente novamente.';
    } elseif ($email === '' || $senha === '') {
        $erro = 'Informe seu e-mail e sua senha.';
    } else {
        $stmt = $pdo->prepare('SELECT id, nome, email, senha, tipo, pontos FROM usuarios WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $usuario = $stmt->fetch();
        if ($usuario && verificarSenha($senha, $usuario['senha'])) {
            session_regenerate_id(true);
            $_SESSION['usuario_id'] = (int)$usuario['id'];
            $_SESSION['usuario_nome'] = $usuario['nome'];
            $_SESSION['usuario_tipo'] = $usuario['tipo'];
            $_SESSION['usuario_pontos'] = (int)$usuario['pontos'];
            redirecionar($usuario['tipo'] === 'admin' ? 'admin/dashboard.php' : 'aluno/dashboard.php');
        }
        $erro = 'E-mail ou senha incorretos.';
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#38204d">
    <title>Entrar | Química Study</title>
    <link rel="icon" href="assets/logo-chem.svg" type="image/svg+xml">
    <link rel="stylesheet" href="css/style.css?v=20261010-auth">
</head>
<body class="bg-auth">
    <main class="auth-container">
        <section class="auth-card login-card" aria-labelledby="login-title">
            <a class="auth-back-link" href="index.php"><span aria-hidden="true">←</span> Voltar à página inicial</a>
            <div class="auth-header">
                <h1 id="login-title"><img src="assets/logo-chem.svg" alt="" class="auth-title-logo"> Que bom ter você de volta.</h1>
                <p>Acesse sua plataforma de estudos</p>
            </div>
            <?php if (isset($_GET['cadastro']) && $_GET['cadastro'] === 'sucesso'): ?><div class="alert alert-success" role="status">Conta criada com sucesso. Entre para começar a estudar.</div><?php endif; ?>
            <?php if ($erro): ?><div class="alert alert-error" role="alert"><?= escape($erro) ?></div><?php endif; ?>
            <form method="POST" action="login.php<?= isset($_GET['admin']) && $_GET['admin'] === '1' ? '?admin=1' : '' ?>" class="auth-form">
                <input type="hidden" name="csrf" value="<?= escape($_SESSION['auth_csrf']) ?>">
                <div class="form-group"><label for="email">E-mail</label><input type="email" id="email" name="email" autocomplete="username" required placeholder="seu@email.com"></div>
                <div class="form-group"><label for="senha">Senha</label><input type="password" id="senha" name="senha" autocomplete="current-password" required placeholder="Sua senha"></div>
                <button type="submit" class="btn btn-primary btn-block auth-submit">Entrar <span aria-hidden="true">↗</span></button>
            </form>
            <div class="auth-footer"><p>Ainda não tem uma conta? <a href="cadastro.php">Criar conta gratuita</a></p><span>Seu próximo passo começa com uma pergunta.</span></div>
        </section>
    </main>
    <script src="js/script.js?v=20261010-auth"></script>
</body>
</html>
