<?php
require_once 'includes/conexao.php';
require_once 'includes/funcoes.php';
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

$erro = '';
$nome = '';
$email = '';
$_SESSION['auth_csrf'] ??= bin2hex(random_bytes(32));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = trim((string)($_POST['nome'] ?? ''));
    $email = strtolower(trim((string)($_POST['email'] ?? '')));
    $senha = (string)($_POST['senha'] ?? '');
    $confirma_senha = (string)($_POST['confirma_senha'] ?? '');

    if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['auth_csrf'], $_POST['csrf'])) {
        $erro = 'A sessão expirou. Atualize a página e tente novamente.';
    } elseif ($nome === '' || $email === '' || $senha === '' || $confirma_senha === '') {
        $erro = 'Preencha todos os campos para criar sua conta.';
    } elseif ((function_exists('mb_strlen') ? mb_strlen($nome, 'UTF-8') : strlen($nome)) > 100) {
        $erro = 'O nome deve ter no máximo 100 caracteres.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 100) {
        $erro = 'Informe um e-mail válido com até 100 caracteres.';
    } elseif (strlen($senha) < 6) {
        $erro = 'A senha deve ter pelo menos 6 caracteres.';
    } elseif ($senha !== $confirma_senha) {
        $erro = 'As senhas não coincidem.';
    } else {
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = :email');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            $erro = 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.';
        } else {
            try {
                $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (:nome, :email, :senha, 'aluno')");
                $stmt->execute(['nome' => $nome, 'email' => $email, 'senha' => hashSenha($senha)]);
                $_SESSION['auth_csrf'] = bin2hex(random_bytes(32));
                redirecionar('login.php?cadastro=sucesso');
            } catch (PDOException $e) {
                $erro = $e->getCode() === '23000'
                    ? 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.'
                    : 'Não foi possível concluir o cadastro agora. Tente novamente.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#38204d">
    <title>Criar conta | Química Study</title>
    <link rel="icon" href="assets/logo-chem.svg" type="image/svg+xml">
    <link rel="stylesheet" href="css/style.css?v=20261010-auth">
</head>
<body class="bg-auth">
    <main class="auth-container">
        <section class="auth-card" aria-labelledby="signup-title">
            <a class="auth-back-link" href="index.php"><span aria-hidden="true">←</span> Voltar à página inicial</a>
            <div class="auth-header">
                <h1 id="signup-title"><img src="assets/logo-chem.svg" alt="" class="auth-title-logo"> Criar conta</h1>
                <p>Comece sua jornada na Química</p>
            </div>
            <?php if ($erro): ?><div class="alert alert-error" role="alert"><?= escape($erro) ?></div><?php endif; ?>
            <form method="POST" action="cadastro.php" class="auth-form">
                <input type="hidden" name="csrf" value="<?= escape($_SESSION['auth_csrf']) ?>">
                <div class="form-group"><label for="nome">Nome completo</label><input type="text" id="nome" name="nome" value="<?= escape($nome) ?>" maxlength="100" autocomplete="name" required placeholder="Seu nome"></div>
                <div class="form-group"><label for="email">E-mail</label><input type="email" id="email" name="email" value="<?= escape($email) ?>" maxlength="100" autocomplete="email" required placeholder="seu@email.com"></div>
                <div class="form-group"><label for="senha">Senha</label><input type="password" id="senha" name="senha" minlength="6" autocomplete="new-password" required placeholder="Mínimo 6 caracteres"></div>
                <div class="form-group"><label for="confirma_senha">Confirmar senha</label><input type="password" id="confirma_senha" name="confirma_senha" minlength="6" autocomplete="new-password" required placeholder="Repita a senha"></div>
                <button type="submit" class="btn btn-primary btn-block auth-submit">Criar minha conta <span aria-hidden="true">↗</span></button>
            </form>
            <div class="auth-footer"><p>Já tem uma conta? <a href="login.php">Faça login</a></p><span>Aprenda no seu ritmo, uma descoberta por vez.</span></div>
        </section>
    </main>
    <script src="js/script.js?v=20261010-auth"></script>
</body>
</html>
