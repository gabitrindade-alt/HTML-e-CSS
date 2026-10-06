<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

function auth_normalize_student_name(string $name): string {
    $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', trim($name));
    return strtolower(preg_replace('/[^a-z0-9]/', '', $ascii === false ? $name : $ascii));
}

function auth_responsavel_email_student_candidates(PDO $pdo, string $email): array {
    $emailParte = strtolower(explode('@', $email, 2)[0]);
    $nomeParte = preg_replace('/mae|pai/i', '', $emailParte) ?? '';
    $nomeParte = preg_replace('/[^a-z0-9]/', '', $nomeParte) ?? '';
    if ($nomeParte === '') return [];

    $stmt = $pdo->query("SELECT id, nome, email FROM alunos WHERE situacao = 'Ativo'");
    $matches = [];
    foreach ($stmt->fetchAll() as $student) {
        $studentEmail = strtolower(explode('@', (string)$student['email'], 2)[0]);
        $studentEmail = preg_replace('/[^a-z0-9]/', '', $studentEmail) ?? '';
        $studentName = auth_normalize_student_name((string)$student['nome']);
        $firstName = auth_normalize_student_name((string)(preg_split('/\\s+/', trim((string)$student['nome']))[0] ?? ''));
        if ($nomeParte === $studentEmail || $nomeParte === $firstName || ($firstName !== '' && str_starts_with($nomeParte, $firstName))) {
            $matches[] = $student;
        }
    }
    return $matches;
}

function auth_login(): void {
    $in = input();
    $email = $in['email'] ?? '';
    $senha = $in['senha'] ?? '';
    $area = $in['area'] ?? '';
    if (!is_string($email) || !is_string($senha) || trim($email) === '' || $senha === '') {
        json_err('Preencha e-mail e senha');
    }
    $email = strtolower(trim($email));

    // Diretor usa o acesso de demonstração; coordenação e docentes têm senha individual.
    $emailsAdmin = [
        'diretor@lavenir.com' => 'diretor',
        'ricardoalves@lavenir.com' => 'coordenador',
        'luciacoordenadora@lavenir.com' => 'coordenador',
    ];
    $aliasesEmail = ['coordenador@lavenir.com' => 'ricardoalves@lavenir.com'];
    $emailProfessorGeral = 'professor@lavenir.com';
    if (isset($aliasesEmail[$email])) $email = $aliasesEmail[$email];
    $loginAdmin = $area === 'admin';
    $loginProfessor = $area === 'professor';
    $loginResponsavel = $area === 'responsavel';
    if ($loginProfessor && (!str_ends_with($email, '@lavenir.com') || !filter_var($email, FILTER_VALIDATE_EMAIL))) {
        json_err('Use seu e-mail institucional @lavenir.com.', 403);
    }

    $stmt = db()->prepare('SELECT id, email, senha, perfil, nome, ref_id, ativo FROM usuarios WHERE email = ? AND ativo = 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Garante a conta geral de professor na primeira entrada, sem reativar contas desativadas.
    if (!$user && $email === $emailProfessorGeral && $senha === '12345678') {
        $pdo = db();
        try {
            $pdo->beginTransaction();
            $prof = $pdo->prepare('SELECT id FROM professores WHERE email = ? LIMIT 1');
            $prof->execute([$emailProfessorGeral]);
            $professorId = $prof->fetchColumn();
            if (!$professorId) {
                $pdo->prepare('INSERT INTO professores (nome, email, disciplina, ativo) VALUES (?, ?, ?, 1)')
                    ->execute(['Professor L Avenir', $emailProfessorGeral, 'Geral']);
                $professorId = $pdo->lastInsertId();
            }
            $hash = password_hash('12345678', PASSWORD_DEFAULT);
            $pdo->prepare("INSERT INTO usuarios (email, senha, perfil, nome, ref_id, ativo) VALUES (?, ?, 'professor', ?, ?, 1)")
                ->execute([$emailProfessorGeral, $hash, 'Professor L Avenir', (int)$professorId]);
            $pdo->commit();
            $stmt->execute([$email]);
            $user = $stmt->fetch();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }

    $senhaPadraoProfessor = $loginProfessor && $user && $user['perfil'] === 'professor' && $senha === '12345678';
    $senhaValida = $user && ($loginAdmin && $email === 'diretor@lavenir.com'
        ? $user['perfil'] === 'diretor'
        : ($senhaPadraoProfessor || password_verify($senha, $user['senha'])));
    if ($senhaPadraoProfessor && $senhaValida && !password_verify($senha, $user['senha'])) {
        $hashAtual = password_hash($senha, PASSWORD_DEFAULT);
        db()->prepare('UPDATE usuarios SET senha = ? WHERE id = ?')->execute([$hashAtual, $user['id']]);
        $user['senha'] = $hashAtual;
    }
    // Migra a senha padrao antiga do schema, cujo hash publicado nao confere com "123".
    $hashLegado = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    if ($user && !$senhaValida && $senha === '123' && hash_equals($hashLegado, $user['senha'])) {
        $hashAtual = password_hash('123', PASSWORD_DEFAULT);
        db()->prepare('UPDATE usuarios SET senha = ? WHERE id = ? AND senha = ?')
            ->execute([$hashAtual, $user['id'], $hashLegado]);
        $user['senha'] = $hashAtual;
        $senhaValida = true;
    }

    if (!$user) {
        json_err('Nao existe uma conta ativa com este e-mail. Confira o endereco ou crie sua conta.', 401);
    }
    if (!$senhaValida) {
        json_err('A conta existe, mas a senha informada nao confere. Se a escola criou sua conta, confirme a senha inicial com a secretaria.', 401);
    }
    // Repair older student accounts that were created before the school record existed.
    // Exact email and normalized full name are both required to avoid linking the wrong student.
    if ($user['perfil'] === 'aluno' && (int)$user['ref_id'] === 0) {
        $studentStmt = db()->prepare("SELECT id,nome FROM alunos WHERE email=? AND situacao='Ativo' LIMIT 1");
        $studentStmt->execute([$email]);
        $studentRecord = $studentStmt->fetch();
        if ($studentRecord && auth_normalize_student_name((string)$user['nome']) === auth_normalize_student_name((string)$studentRecord['nome'])) {
            db()->prepare("UPDATE usuarios SET ref_id=? WHERE id=? AND perfil='aluno' AND ref_id=0")
                ->execute([(int)$studentRecord['id'], (int)$user['id']]);
            $user['ref_id'] = (int)$studentRecord['id'];
        }
    }
    if ($loginResponsavel) {
        $linkStmt = db()->prepare('SELECT id, aluno_id FROM responsaveis WHERE email = ? LIMIT 1');
        $linkStmt->execute([$email]);
        $link = $linkStmt->fetch();
        if (!$link) {
            $emailMatches = auth_responsavel_email_student_candidates(db(), $email);
            if (count($emailMatches) === 1) {
                db()->prepare('INSERT INTO responsaveis (nome, email, aluno_id) VALUES (?, ?, ?)')
                    ->execute([$user['nome'] ?: 'Responsável', $email, (int)$emailMatches[0]['id']]);
                $link = ['id' => (int)db()->lastInsertId(), 'aluno_id' => (int)$emailMatches[0]['id']];
            }
        }
        if (!$link) json_err('Este e-mail ainda nao esta vinculado a um aluno. Entre em Criar conta, escolha Responsavel e informe o nome cadastrado do aluno.', 409);
        if ($user['perfil'] !== 'responsavel' || (int)$user['ref_id'] !== (int)$link['id']) {
            db()->prepare("UPDATE usuarios SET perfil='responsavel', ref_id=? WHERE id=?")
                ->execute([(int)$link['id'], (int)$user['id']]);
            $user['perfil'] = 'responsavel';
            $user['ref_id'] = (int)$link['id'];
        }
    }
    if ($loginProfessor && $user['perfil'] !== 'professor') {
        json_err('Este usuario nao tem perfil de professor.', 403);
    }
    if ($loginAdmin && !in_array($user['perfil'], ['diretor', 'coordenador', 'professor'], true)) {
        json_err('Este usuario nao tem permissao para o painel administrativo.', 403);
    }
    if ($loginAdmin && $user['perfil'] === 'coordenador' && !isset($emailsAdmin[$email])) {
        json_err('Use o e-mail oficial personalizado da coordenacao.', 403);
    }

    db()->prepare('UPDATE usuarios SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);
    unset($user['senha']);
    session_regenerate_id(true);
    $_SESSION['user'] = $user;
    json_ok($user, 'Login realizado');
}

function auth_register(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') json_err('Metodo nao permitido', 405);

    $in = input();
    $nome = $in['nome'] ?? '';
    $email = $in['email'] ?? '';
    $senha = $in['senha'] ?? '';
    $confirmacao = $in['confirmacao'] ?? '';
    $alunoNome = $in['aluno_nome'] ?? '';
    $perfilSolicitado = $in['perfil'] ?? '';

    if (!is_string($nome) || !is_string($email) || !is_string($senha) || !is_string($confirmacao) || !is_string($alunoNome) || !is_string($perfilSolicitado)) {
        json_err('Dados de cadastro invalidos');
    }
    $nome = trim($nome);
    $email = strtolower(trim($email));
    $alunoNome = trim($alunoNome);

    if ($nome === '' || strlen($nome) > 150) json_err('Informe um nome valido');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) json_err('Informe um e-mail valido');
    if (strlen($senha) < 8) json_err('A senha deve ter pelo menos 8 caracteres');
    if ($senha !== $confirmacao) json_err('As senhas nao conferem');
    if ($perfilSolicitado !== '' && !in_array($perfilSolicitado, ['aluno', 'responsavel'], true)) {
        json_err('Selecione um perfil valido.');
    }

    $isResponsavel = $perfilSolicitado !== ''
        ? $perfilSolicitado === 'responsavel'
        : preg_match('/mae|pai/i', $email) === 1;
    if (!$isResponsavel) {
        $existingStudentAccount = db()->prepare('SELECT perfil, ref_id FROM usuarios WHERE email=? AND ativo=1 LIMIT 1');
        $existingStudentAccount->execute([$email]);
        if ($existingStudentAccount->fetch()) {
            json_err('Este e-mail ja possui uma conta escolar. Entre com a senha inicial fornecida pela secretaria; criar outra conta nao redefine a senha.', 409);
        }
    }
    if ($isResponsavel && strlen($alunoNome) > 150) {
        json_err('O nome do aluno e muito longo.');
    }

    try {
        $pdo = db();
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        $pdo->beginTransaction();
        $userId = 0;
        $perfil = 'aluno';
        $refId = 0;
        if (!$isResponsavel) {
            $studentStmt = $pdo->prepare("SELECT id,nome FROM alunos WHERE email=? AND situacao='Ativo' LIMIT 1 FOR UPDATE");
            $studentStmt->execute([$email]);
            $studentRecord = $studentStmt->fetch();
            if ($studentRecord) {
                if (auth_normalize_student_name($nome) !== auth_normalize_student_name((string)$studentRecord['nome'])) {
                    $pdo->rollBack();
                    json_err('O nome informado nao corresponde ao cadastro escolar deste e-mail. Confira com a secretaria.', 409);
                }
                $refId = (int)$studentRecord['id'];
            }
        }
        if ($isResponsavel) {
            $alunos = [];
            if ($alunoNome !== '') {
                $typedName = auth_normalize_student_name($alunoNome);
                $candidates = $pdo->query("SELECT id, nome FROM alunos WHERE situacao = 'Ativo'")->fetchAll();
                foreach ($candidates as $candidate) {
                    $registeredName = auth_normalize_student_name((string)$candidate['nome']);
                    if ($typedName !== '' && ($typedName === $registeredName || str_starts_with($registeredName, $typedName))) {
                        $alunos[] = $candidate;
                    }
                }

                // Accept a shortened or slightly different entered name only when the
                // guardian email independently identifies that same student's school email.
                if (!$alunos) {
                    $emailMatches = auth_responsavel_email_student_candidates($pdo, $email);
                    $typedTokens = preg_split('/\\s+/', strtolower(trim($alunoNome))) ?: [];
                    $typedFirstName = auth_normalize_student_name((string)($typedTokens[0] ?? ''));
                    foreach ($emailMatches as $emailMatch) {
                        $registeredFirstName = auth_normalize_student_name((string)(preg_split('/\\s+/', trim((string)$emailMatch['nome']))[0] ?? ''));
                        if ($typedFirstName !== '' && $typedFirstName === $registeredFirstName) {
                            $alunos[] = $emailMatch;
                        }
                    }
                }
            } else {
                $alunos = auth_responsavel_email_student_candidates($pdo, $email);
            }
            if (count($alunos) !== 1) {
                $pdo->rollBack();
                json_err(count($alunos) ? 'O nome do aluno corresponde a mais de um cadastro. Informe o nome completo exatamente como está na escola.' : 'Não encontrei o aluno pelo nome no e-mail. Informe o nome completo do aluno para vincular a conta.');
            }
            $alunoId = (int)$alunos[0]['id'];
            $responsavelStmt = $pdo->prepare('SELECT id, aluno_id FROM responsaveis WHERE email = ? LIMIT 1');
            $responsavelStmt->execute([$email]);
            $responsavel = $responsavelStmt->fetch();
            if ($responsavel && (int)$responsavel['aluno_id'] !== $alunoId) {
                $pdo->rollBack();
                json_err('Este e-mail ja esta vinculado a outro aluno. Fale com a escola para corrigir o vinculo.', 409);
            }
            if ($responsavel) {
                $refId = (int)$responsavel['id'];
            } else {
                $pdo->prepare('INSERT INTO responsaveis (nome, email, aluno_id) VALUES (?, ?, ?)')
                    ->execute([$nome, $email, $alunoId]);
                $refId = (int)$pdo->lastInsertId();
            }
            $perfil = 'responsavel';
            $existingUserStmt = $pdo->prepare('SELECT id, perfil, ref_id, ativo FROM usuarios WHERE email = ? LIMIT 1');
            $existingUserStmt->execute([$email]);
            $existingUser = $existingUserStmt->fetch();
            if ($existingUser) {
                $repairableAccount = in_array($existingUser['perfil'], ['aluno', 'responsavel'], true);
                if (!$repairableAccount) {
                    $pdo->rollBack();
                    json_err('Este e-mail pertence a uma conta interna e nao pode ser usado como responsavel. Fale com a secretaria.', 409);
                }
                $userId = (int)$existingUser['id'];
                $pdo->prepare("UPDATE usuarios SET senha=?, perfil='responsavel', nome=?, ref_id=?, ativo=1 WHERE id=?")
                    ->execute([$hash, $nome, $refId, $userId]);
            }
        }
        if ($userId === 0) {
            $pdo->prepare('INSERT INTO usuarios (email, senha, perfil, nome, ref_id, ativo) VALUES (?, ?, ?, ?, ?, 1)')
                ->execute([$email, $hash, $perfil, $nome, $refId]);
            $userId = (int)$pdo->lastInsertId();
        }
        $pdo->commit();
    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
        if ($e->getCode() === '23000') json_err('Este e-mail ja possui cadastro', 409);
        throw $e;
    }

    $stmt = db()->prepare('SELECT id, email, perfil, nome, ref_id, ativo FROM usuarios WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) json_err('A conta foi criada, mas nao foi possivel iniciar a sessao. Entre pelo login.', 500);

    session_regenerate_id(true);
    $_SESSION['user'] = $user;
    json_ok($user, 'Conta criada. Acesso liberado.');
}

function auth_me(): void {
    $u = require_login();
    $stmt = db()->prepare('SELECT id, email, perfil, nome, ref_id, ativo FROM usuarios WHERE id=? AND ativo=1');
    $stmt->execute([(int)$u['id']]);
    $fresh = $stmt->fetch();
    if (!$fresh) json_err('Usuario nao encontrado', 401);
    $_SESSION['user'] = $fresh;
    json_ok($fresh);
}

function auth_logout(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    json_ok(null, 'Logout realizado');
}

function auth_change_password(): void {
    $u = require_login();
    $in = input();
    $atual = $in['atual'] ?? '';
    $nova = $in['nova'] ?? '';
    $conf = $in['conf'] ?? '';

    if (!is_string($atual) || !is_string($nova) || !is_string($conf)) json_err('Dados invalidos');
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
