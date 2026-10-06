<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

session_start();

define('DB_HOST', 'localhost');
define('DB_NAME', 'lavenir');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function json_ok($data = null, string $msg = 'OK'): void {
    echo json_encode(['ok' => true, 'msg' => $msg, 'data' => $data]);
    exit;
}
function json_err(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'msg' => $msg]);
    exit;
}
function input(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? $_POST;
}
function require_login(): array {
    if (empty($_SESSION['user'])) json_err('Não autenticado', 401);
    return $_SESSION['user'];
}
function can_access_student(array $user, int $alunoId): bool {
    if ($alunoId < 1) return false;
    if (in_array($user['perfil'] ?? '', ['diretor', 'coordenador', 'professor'], true)) return true;
    if (($user['perfil'] ?? '') === 'aluno') return (int)($user['ref_id'] ?? 0) === $alunoId;
    if (($user['perfil'] ?? '') === 'responsavel') {
        $stmt = db()->prepare('SELECT 1 FROM responsaveis WHERE id = ? AND aluno_id = ?');
        $stmt->execute([(int)($user['ref_id'] ?? 0), $alunoId]);
        return (bool)$stmt->fetchColumn();
    }
    return false;
}
function perm(string $key): bool {
    $u = require_login();
    $perms = [
        'diretor'     => ['manage_users'=>1,'manage_school'=>1,'edit_grades'=>1,'edit_freq'=>1,'view_reports'=>1,'manage_announcements'=>1,'manage_occurrences'=>1,'manage_diary'=>1,'manage_activities'=>1,'manage_payments'=>1,'manage_events'=>1,'approve_materials'=>1],
        'coordenador' => ['manage_users'=>0,'manage_school'=>1,'edit_grades'=>1,'edit_freq'=>1,'view_reports'=>1,'manage_announcements'=>1,'manage_occurrences'=>1,'manage_diary'=>1,'manage_activities'=>1,'manage_payments'=>0,'manage_events'=>1,'approve_materials'=>1],
        'professor'   => ['manage_users'=>0,'manage_school'=>0,'edit_grades'=>1,'edit_freq'=>1,'view_reports'=>0,'manage_announcements'=>0,'manage_occurrences'=>1,'manage_diary'=>1,'manage_activities'=>1,'manage_payments'=>0,'manage_events'=>1,'approve_materials'=>0],
        'aluno'       => [], 'responsavel' => [],
    ];
    return !empty($perms[$u['perfil']][$key]);
}
