<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/mailer.php';

function auth_ensure_verification_schema(): void {
    static $checked = false;
    if ($checked) return;

    $columns = db()->query('SHOW COLUMNS FROM usuarios')->fetchAll(PDO::FETCH_COLUMN, 0);
    $existing = array_fill_keys($columns, true);
    $definitions = [
        'email_verificado' => 'TINYINT(1) NOT NULL DEFAULT 1',
        'email_codigo_hash' => 'VARCHAR(255) NULL',
        'email_codigo_expira' => 'DATETIME NULL',
        'email_codigo_enviado_em' => 'DATETIME NULL',
        'email_codigo_tentativas' => 'TINYINT UNSIGNED NOT NULL DEFAULT 0',
    ];
    foreach ($definitions as $name => $definition) {
        if (!isset($existing[$name])) db()->exec("ALTER TABLE usuarios ADD COLUMN {$name} {$definition}");
    }
    $checked = true;
}

function auth_issue_verification_code(int $userId, string $email, string $name): void {
    $code = (string)random_int(100000, 999999);
    $hash = password_hash($code, PASSWORD_DEFAULT);
    db()->prepare("UPDATE usuarios SET email_codigo_hash = ?, email_codigo_expira = DATE_ADD(NOW(), INTERVAL 15 MINUTE), email_codigo_enviado_em = NOW(), email_codigo_tentativas = 0 WHERE id = ?")
        ->execute([$hash, $userId]);
    try {
        send_verification_email($email, $name, $code);
    } catch (Throwable $e) {
        error_log('Falha no envio do codigo de verificacao: ' . $e->getMessage());
        throw $e;
    }
}

function auth_login(): void {
    auth_ensure_verification_schema();
    $in = input();
    $email = strtolower(trim($in['email'] ?? ''));
    $senha = $in['senha'] ?? '';
    if ($email === '' || $senha === '') json_err('Preencha e-mail e senha');

    $stmt = db()->prepare('SELECT * FROM usuarios WHERE email = ? AND ativo = 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && (int)$user['email_verificado'] !== 1) {
        json_err('Confirme seu e-mail antes de entrar. Confira sua caixa de entrada ou solicite um novo codigo.', 403);
    }

    $senhaValida = $user && password_verify($senha, $user['senha']);
    // Migra a senha padrao antiga do schema, cujo hash publicado nao confere com "123".
    $hashLegado = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    if ($user && !$senhaValida && $senha === '123' && hash_equals($hashLegado, $user['senha'])) {
        $hashAtual = password_hash('123', PASSWORD_DEFAULT);
        db()->prepare('UPDATE usuarios SET senha = ? WHERE id = ? AND senha = ?')
            ->execute([$hashAtual, $user['id'], $hashLegado]);
        $user['senha'] = $hashAtual;
        $senhaValida = true;
    }

    if (!$senhaValida) {
        json_err('Credenciais invalidas. Se ainda nao criou sua conta, use o cadastro institucional.', 401);
    }

    db()->prepare('UPDATE usuarios SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);
    unset($user['senha']);
    session_regenerate_id(true);
    $_SESSION['user'] = $user;
    json_ok($user, 'Login realizado');
}

function auth_register(): void {
    auth_ensure_verification_schema();
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') json_err('Metodo nao permitido', 405);

    $in = input();
    $nome = trim($in['nome'] ?? '');
    $email = strtolower(trim($in['email'] ?? ''));
    $senha = $in['senha'] ?? '';
    $confirmacao = $in['confirmacao'] ?? '';

    if ($nome === '' || strlen($nome) > 150) json_err('Informe um nome valido');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Informe um e-mail valido');

    if (strlen($senha) < 8) json_err('A senha deve ter pelo menos 8 caracteres');
    if ($senha !== $confirmacao) json_err('As senhas nao conferem');

    $stmt = db()->prepare('SELECT id FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) json_err('Este e-mail ja possui cadastro', 409);

    $hash = password_hash($senha, PASSWORD_DEFAULT);
    $codigo = (string)random_int(100000, 999999);
    $codigoHash = password_hash($codigo, PASSWORD_DEFAULT);
    try {
        db()->prepare("INSERT INTO usuarios (email, senha, perfil, nome, ref_id, ativo, email_verificado, email_codigo_hash, email_codigo_expira, email_codigo_enviado_em, email_codigo_tentativas) VALUES (?, ?, 'aluno', ?, 0, 1, 0, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW(), 0)")
            ->execute([$email, $hash, $nome, $codigoHash]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') json_err('Este e-mail ja possui cadastro', 409);
        throw $e;
    }

    $userId = (int)db()->lastInsertId();
    $emailEnviado = true;
    try {
        send_verification_email($email, $nome, $codigo);
    } catch (Throwable $e) {
        error_log('Falha no envio do codigo de verificacao: ' . $e->getMessage());
        $emailEnviado = false;
    }
    json_ok(['email' => $email, 'verification_required' => true, 'email_sent' => $emailEnviado],
        $emailEnviado ? 'Cadastro criado. Enviamos um codigo para seu e-mail.' : 'Cadastro criado. Nao foi possivel enviar o codigo; use Reenviar codigo apos configurar o envio de e-mail.');
}

function auth_verify_email(): void {
    auth_ensure_verification_schema();
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') json_err('Metodo nao permitido', 405);
    $in = input();
    $email = strtolower(trim($in['email'] ?? ''));
    $code = trim($in['codigo'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[0-9]{6}$/', $code)) {
        json_err('Informe o e-mail e o codigo de 6 digitos');
    }

    $stmt = db()->prepare('SELECT id, email, perfil, nome, ref_id, ativo, email_verificado, email_codigo_hash, email_codigo_expira, email_codigo_tentativas FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user || (int)$user['ativo'] !== 1) json_err('Codigo invalido ou expirado', 400);
    if ((int)$user['email_verificado'] === 1) json_err('Este e-mail ja foi confirmado');
    if ((int)$user['email_codigo_tentativas'] >= 5) json_err('Limite de tentativas atingido. Solicite um novo codigo.', 429);
    if (!$user['email_codigo_expira'] || strtotime($user['email_codigo_expira']) < time()) {
        json_err('Codigo expirado. Solicite um novo codigo.', 400);
    }
    if (!$user['email_codigo_hash'] || !password_verify($code, $user['email_codigo_hash'])) {
        db()->prepare('UPDATE usuarios SET email_codigo_tentativas = email_codigo_tentativas + 1 WHERE id = ?')
            ->execute([$user['id']]);
        json_err('Codigo invalido', 400);
    }

    db()->prepare('UPDATE usuarios SET email_verificado = 1, email_codigo_hash = NULL, email_codigo_expira = NULL, email_codigo_enviado_em = NULL, email_codigo_tentativas = 0 WHERE id = ?')
        ->execute([$user['id']]);
    unset($user['email_verificado'], $user['email_codigo_hash'], $user['email_codigo_expira'], $user['email_codigo_tentativas']);
    session_regenerate_id(true);
    $_SESSION['user'] = $user;
    json_ok($user, 'E-mail confirmado. Acesso liberado.');
}

function auth_resend_verification(): void {
    auth_ensure_verification_schema();
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') json_err('Metodo nao permitido', 405);
    $in = input();
    $email = strtolower(trim($in['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Informe um e-mail valido');

    $stmt = db()->prepare("SELECT id, nome, email_verificado, email_codigo_enviado_em FROM usuarios WHERE email = ? AND ativo = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    $emailEnviado = false;
    $aguardando = false;
    if ($user && (int)$user['email_verificado'] !== 1) {
        $recent = $user['email_codigo_enviado_em'] && strtotime($user['email_codigo_enviado_em']) > time() - 60;
        if ($recent) {
            $aguardando = true;
        } else {
            try {
                auth_issue_verification_code((int)$user['id'], $email, (string)$user['nome']);
                $emailEnviado = true;
            } catch (Throwable $e) {
                // Keep the public response identical for existing and unknown addresses.
            }
        }
    }
    if ($emailEnviado) {
        json_ok(['email_sent' => true], 'Se houver um cadastro pendente, um novo codigo foi enviado.');
    }
    if ($aguardando) {
        json_ok(['email_sent' => false], 'Aguarde 1 minuto antes de solicitar outro codigo.');
    }
    json_ok(['email_sent' => false], 'Nao foi possivel reenviar agora. Verifique o e-mail e tente novamente ou contate a escola.');
}

function auth_me(): void {
    $u = require_login();
    json_ok($u);
}

function auth_logout(): void {
    session_destroy();
    json_ok(null, 'Logout realizado');
}

function auth_change_password(): void {
    $u = require_login();
    $in = input();
    $atual = $in['atual'] ?? '';
    $nova = $in['nova'] ?? '';
    $conf = $in['conf'] ?? '';

    if ($nova !== $conf) json_err('As senhas nao conferem');
    if (strlen($nova) < 8) json_err('A senha deve ter pelo menos 8 caracteres');

    $stmt = db()->prepare('SELECT senha FROM usuarios WHERE id = ?');
    $stmt->execute([$u['id']]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($atual, $row['senha'])) json_err('Senha atual incorreta');

    $hash = password_hash($nova, PASSWORD_DEFAULT);
    db()->prepare('UPDATE usuarios SET senha = ? WHERE id = ?')->execute([$hash, $u['id']]);
    json_ok(null, 'Senha alterada');
}
