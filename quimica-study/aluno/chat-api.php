<?php
require_once '../includes/auth.php';
require_once '../includes/conexao.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function chatJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!isset($_SESSION['usuario_id']) || ($_SESSION['usuario_tipo'] ?? '') !== 'aluno') {
    chatJson(401, ['error' => 'Faça login novamente para continuar.']);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    chatJson(405, ['error' => 'Método não permitido.']);
}
$csrf = $_SERVER['HTTP_X_CHAT_CSRF'] ?? '';
if (!isset($_SESSION['chat_csrf']) || !is_string($csrf) || !hash_equals($_SESSION['chat_csrf'], $csrf)) {
    chatJson(403, ['error' => 'A sessão expirou. Atualize a página e tente novamente.']);
}
$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) chatJson(400, ['error' => 'Não foi possível ler a pergunta.']);
$language = in_array($body['language'] ?? '', ['pt', 'en', 'es'], true) ? $body['language'] : 'pt';
$incoming = is_array($body['messages'] ?? null) ? array_slice($body['messages'], -10) : [];
$messages = [];
foreach ($incoming as $message) {
    if (!is_array($message) || !in_array($message['role'] ?? '', ['user', 'assistant'], true) || !is_string($message['content'] ?? null)) continue;
    $content = trim($message['content']);
    if ($content !== '') $messages[] = ['role' => $message['role'], 'content' => mb_substr($content, 0, 1200, 'UTF-8')];
}
if (!$messages || end($messages)['role'] !== 'user') chatJson(400, ['error' => 'Escreva uma pergunta para começar.']);
$apiKey = getenv('OPENAI_API_KEY');
if (!$apiKey) chatJson(503, ['error' => 'A IA ainda não foi ativada neste servidor. Configure OPENAI_API_KEY no ambiente do Apache para habilitar respostas abertas.']);
if (!function_exists('curl_init')) chatJson(503, ['error' => 'A extensão cURL do PHP precisa estar ativada no XAMPP.']);

$languageInstruction = ['pt' => 'Responda em português do Brasil.', 'en' => 'Answer in English.', 'es' => 'Responde en español.'][$language];
$instructions = 'Você é o tutor virtual do Química Study, uma plataforma para estudantes do ensino médio. ' . $languageInstruction . ' Responda qualquer pergunta do aluno de forma útil, clara, respeitosa e adequada à idade. Priorize Química quando a pergunta for de Química, mas ajude também com outros assuntos escolares e perguntas gerais. Explique por etapas quando houver cálculo, defina os termos, mostre unidades e confira o raciocínio. Se a pergunta for ambígua, responda o que for possível e faça uma pergunta objetiva para esclarecer. Não invente fatos nem apresente palpite como certeza; indique incerteza e corrija equívocos com gentileza. Use texto simples, sem HTML, com parágrafos curtos. Para temas fora de estudo, responda brevemente e sugira como isso se conecta ao aprendizado quando fizer sentido.';
$request = [
    'model' => getenv('OPENAI_MODEL') ?: 'gpt-5-mini',
    'instructions' => $instructions,
    'input' => $messages,
    'store' => false,
    'max_output_tokens' => 700,
];
$curl = curl_init('https://api.openai.com/v1/responses');
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey, 'Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 40,
]);
$response = curl_exec($curl);
$httpStatus = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
$curlError = curl_errno($curl);
curl_close($curl);
if ($response === false || $curlError || $httpStatus < 200 || $httpStatus >= 300) {
    error_log('Química Study chat API failed; HTTP ' . $httpStatus . ', cURL ' . $curlError);
    chatJson(502, ['error' => 'Não consegui conectar à IA agora. Tente novamente em alguns instantes.']);
}
$decoded = json_decode($response, true);
$answer = '';
foreach (($decoded['output'] ?? []) as $item) {
    foreach (($item['content'] ?? []) as $content) {
        if (($content['type'] ?? '') === 'output_text' && is_string($content['text'] ?? null)) $answer .= $content['text'];
    }
}
$answer = trim($answer);
if ($answer === '') chatJson(502, ['error' => 'A IA não retornou uma resposta. Tente reformular a pergunta.']);
chatJson(200, ['answer' => mb_substr($answer, 0, 8000, 'UTF-8')]);
