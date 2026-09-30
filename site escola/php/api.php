<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$parts = explode('.', $action);
$module = $parts[0] ?? '';
$method = $parts[1] ?? 'list';

$modules = [
    'auth','alunos','professores','turmas','cursos','usuarios',
    'comunicados','ocorrencias','atividades','diario','notas',
    'frequencia','pagamentos','eventos','materiais','mensagens','relatorios'
];

if (!in_array($module, $modules, true)) json_err('Módulo inválido', 404);

$file = __DIR__ . "/{$module}.php";
if (!file_exists($file)) json_err('Módulo não encontrado', 404);

require_once $file;

$fn = "{$module}_{$method}";
if (!function_exists($fn)) json_err("Ação '{$method}' não existe em {$module}", 404);

try {
    $fn();
} catch (Throwable $e) {
    error_log((string)$e);
    json_err('Erro interno ao processar a solicitação', 500);
}
