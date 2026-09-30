<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
header_remove('Content-Type');
header('Content-Type: text/html; charset=utf-8');

try {
    // Connect without selecting the application database so the schema can create it.
    $server = new PDO(
        'mysql:host=' . DB_HOST . ';charset=' . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
    );

    $check = $server->prepare("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'");
    $check->execute([DB_NAME]);
    if ((int)$check->fetchColumn() > 0) {
        http_response_code(409);
        echo '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Instalação bloqueada</title>';
        echo '<main style="font:16px Arial;max-width:700px;margin:4rem auto;padding:1rem">';
        echo '<h1>Instalação bloqueada</h1><p>O banco já contém tabelas. A instalação recria as tabelas e apagaria os dados existentes.</p>';
        echo '<p>Para preservar os dados, não execute novamente este instalador.</p><a href="../index.html">Voltar ao site</a></main></html>';
        exit;
    }

    $schemaPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'sql' . DIRECTORY_SEPARATOR . 'schema.sql';
    $schema = file_get_contents($schemaPath);
    if ($schema === false) throw new RuntimeException('Arquivo sql/schema.sql nao encontrado');
    $server->exec($schema);

    $pdo = db();
    // Reset IDs so the seeded director/coordinator remain IDs 1 and 2, used by messaging.
    $pdo->exec('TRUNCATE TABLE usuarios');
    $hash = password_hash('123', PASSWORD_DEFAULT);
    $insert = $pdo->prepare('INSERT INTO usuarios (email, senha, perfil, nome, ativo) VALUES (?, ?, ?, ?, 1)');
    $accounts = [
        ['diretor@lavenir.com', 'diretor', 'Dra. Helena Mendes'],
        ['ricardoalves@lavenir.com', 'coordenador', 'Dr. Ricardo Alves'],
        ['luciacoordenadora@lavenir.com', 'coordenador', 'Lucia'],
        ['professor@lavenir.com', 'professor', 'Professor L Avenir'],
        ['carlos@lavenir.com', 'professor', 'Prof. Carlos Silva'],
        ['mariana@lavenir.com', 'professor', 'Profa. Mariana Costa'],
        ['robertolima@lavenir.com', 'professor', 'Prof. Roberto Lima'],
        ['anapaula@lavenir.com', 'professor', 'Profa. Ana Paula Souza'],
        ['fernando@lavenir.com', 'professor', 'Prof. Fernando Alves'],
        ['ana@aluno.lavenir', 'aluno', 'Ana Beatriz Costa'],
        ['joao@aluno.lavenir', 'aluno', 'Joao Pedro Souza'],
        ['maria@aluno.lavenir', 'aluno', 'Maria Silva Santos'],
        ['pedro@aluno.lavenir', 'aluno', 'Pedro Lucas Oliveira'],
        ['juliana@aluno.lavenir', 'aluno', 'Juliana Ferreira'],
        ['lucas@aluno.lavenir', 'aluno', 'Lucas Martins'],
        ['beatriz@aluno.lavenir', 'aluno', 'Beatriz Almeida'],
        ['gabriel@aluno.lavenir', 'aluno', 'Gabriel Rocha'],
        ['rafael@aluno.lavenir', 'aluno', 'Rafael Souza'],
        ['camila@aluno.lavenir', 'aluno', 'Camila Dias'],
        ['thiago@aluno.lavenir', 'aluno', 'Thiago Nunes'],
        ['isabela@aluno.lavenir', 'aluno', 'Isabela Cardoso'],
        ['felipe@aluno.lavenir', 'aluno', 'Felipe Moraes'],
        ['larissa@aluno.lavenir', 'aluno', 'Larissa Gomes'],
        ['bruno@aluno.lavenir', 'aluno', 'Bruno Teixeira'],
        ['mae.ana@lavenir.com', 'responsavel', 'Maria Costa'],
        ['pai.joao@lavenir.com', 'responsavel', 'Jose Souza'],
    ];
    foreach ($accounts as [$email, $perfil, $nome]) {
        $accountHash = password_hash(in_array($perfil, ['coordenador', 'professor'], true) ? '12345678' : '123', PASSWORD_DEFAULT);
        $insert->execute([$email, $accountHash, $perfil, $nome]);
    }

    $pdo->exec("UPDATE usuarios u JOIN professores p ON u.email = p.email SET u.ref_id = p.id WHERE u.perfil = 'professor'");
    $pdo->exec("UPDATE usuarios u JOIN alunos a ON u.email = a.email SET u.ref_id = a.id WHERE u.perfil = 'aluno'");
    $pdo->exec("UPDATE usuarios u JOIN responsaveis r ON u.email = r.email SET u.ref_id = r.id WHERE u.perfil = 'responsavel'");

    echo '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Instalação concluída</title>';
    echo '<main style="font:16px Arial;max-width:700px;margin:4rem auto;padding:1rem">';
    echo '<h1>Instalação concluída</h1><p>Contas de demonstração criadas. Senha de direção: <strong>123</strong>; senha de professores e coordenação: <strong>12345678</strong>.</p>';
    echo '<p>Altere as senhas iniciais antes de usar o portal com dados reais.</p>';
    echo '<a href="../login.html">Ir para o login</a></main></html>';
} catch (Throwable $e) {
    error_log((string)$e);
    http_response_code(500);
    echo '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Falha na instalação</title>';
    echo '<main style="font:16px Arial;max-width:700px;margin:4rem auto;padding:1rem">';
    echo '<h1>Falha na instalação</h1><p>Verifique se o MySQL está ativo e se as credenciais em php/config.php estão corretas.</p></main></html>';
}
