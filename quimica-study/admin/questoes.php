<?php
require_once '../includes/admin_auth.php';
$mensagem = '';
$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['acao'] ?? '') === 'cadastrar') {
    $conteudo_id = filter_var($_POST['conteudo_id'] ?? null, FILTER_VALIDATE_INT);
    $tipo = $_POST['tipo'] ?? '';
    $enunciado = trim($_POST['enunciado'] ?? '');
    $alternativas = array_map(static fn($key) => trim($_POST[$key] ?? ''), ['alt_a', 'alt_b', 'alt_c', 'alt_d']);
    $resposta_correta = $tipo === 'dissertativa' ? trim($_POST['resposta_texto'] ?? '') : trim($_POST['resposta_correta'] ?? '');
    $explicacao = trim($_POST['explicacao'] ?? '');
    if (!$conteudo_id || !in_array($tipo, ['multipla', 'vf', 'dissertativa'], true) || $enunciado === '' || $resposta_correta === '' || $explicacao === '') {
        $erro = 'Preencha o conteúdo, o enunciado, a resposta e a explicação.';
    } elseif ($tipo === 'multipla' && (in_array('', $alternativas, true) || !in_array($resposta_correta, ['A', 'B', 'C', 'D'], true))) {
        $erro = 'Informe as quatro alternativas e indique a correta.';
    } elseif ($tipo === 'vf' && !in_array($resposta_correta, ['V', 'F'], true)) {
        $erro = 'Escolha V ou F como resposta correta.';
    } else {
        $check = $pdo->prepare('SELECT COUNT(*) FROM conteudos WHERE id = ?');
        $check->execute([$conteudo_id]);
        if (!(int)$check->fetchColumn()) {
            $erro = 'O conteúdo selecionado não está disponível.';
        } else {
            $stmt = $pdo->prepare('INSERT INTO questoes (conteudo_id, tipo, enunciado, alt_a, alt_b, alt_c, alt_d, resposta_correta, explicacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$conteudo_id, $tipo, $enunciado, $tipo === 'multipla' ? $alternativas[0] : null, $tipo === 'multipla' ? $alternativas[1] : null, $tipo === 'multipla' ? $alternativas[2] : null, $tipo === 'multipla' ? $alternativas[3] : null, $resposta_correta, $explicacao]);
            $mensagem = 'Questão publicada. Ela já está disponível para os alunos e pode entrar em um simulado.';
        }
    }
}

if (isset($_GET['excluir'])) {
    $pdo->prepare('DELETE FROM questoes WHERE id = ?')->execute([(int)$_GET['excluir']]);
    header('Location: questoes.php');
    exit;
}
$conteudos = $pdo->query('SELECT id, titulo FROM conteudos ORDER BY titulo')->fetchAll();
$questoes = $pdo->query('SELECT q.id, q.enunciado, q.tipo, q.resposta_correta, c.titulo AS conteudo FROM questoes q LEFT JOIN conteudos c ON q.conteudo_id = c.id ORDER BY q.id DESC LIMIT 100')->fetchAll();
?>
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Questões | Química Study</title><link rel="stylesheet" href="../css/style.css?v=20261010-teacher"><link rel="stylesheet" href="../css/dashboard.css?v=20261010-teacher"><link rel="stylesheet" href="../css/teacher-tools.css?v=20261010-teacher"></head>
<body class="dashboard-body"><div class="app-container"><aside class="sidebar"><div class="sidebar-header"><a href="dashboard.php" class="logo brand-logo"><img src="../assets/logo-chem.svg" alt=""><span class="brand-name">Química<span>STUDY</span></span></a></div><nav class="sidebar-nav"><a href="dashboard.php" class="nav-item"><span class="icon">▦</span> Painel</a><a href="usuarios.php" class="nav-item"><span class="icon">♙</span> Alunos</a><a href="conteudos.php" class="nav-item"><span class="icon">▤</span> Conteúdos</a><a href="questoes.php" class="nav-item active"><span class="icon">?</span> Questões</a><a href="simulados.php" class="nav-item"><span class="icon">✎</span> Simulados</a><a href="resultados.php" class="nav-item"><span class="icon">↗</span> Resultados</a><a href="agenda.php" class="nav-item"><span class="icon">▦</span> Agenda dos alunos</a></nav><div class="sidebar-footer"><a href="../logout.php" class="nav-item logout"><span class="icon">↪</span> Sair</a></div></aside>
<main class="main-content"><header class="topbar"><div class="user-info"><span class="user-name">Área do professor</span></div></header><div class="content-wrapper teacher-page"><section class="teacher-hero"><span>PAINEL DE CONTEÚDO</span><h1>Monte questões que ensinam.</h1><p>O que você publicar aqui alimenta automaticamente a prática de todos os alunos cadastrados. Depois, reúna as questões em simulados.</p><div class="teacher-hero-stats"><strong><?= count($questoes) ?><small> questões disponíveis</small></strong><strong><?= count($conteudos) ?><small> conteúdos</small></strong></div></section>
<?php if ($mensagem): ?><div class="teacher-notice success" role="status"><?= escape($mensagem) ?></div><?php endif; ?><?php if ($erro): ?><div class="teacher-notice error" role="alert"><?= escape($erro) ?></div><?php endif; ?>
<section class="teacher-card"><div class="teacher-card-heading"><span class="teacher-heading-icon">＋</span><div><h2>Nova questão</h2><p>Associe a pergunta a um conteúdo para ela aparecer aos alunos no lugar certo.</p></div></div>
<?php if (!$conteudos): ?><div class="teacher-no-content"><strong>Cadastre um conteúdo primeiro.</strong><p>As questões precisam estar ligadas a uma matéria/conteúdo antes de serem publicadas.</p><a href="conteudos.php" class="btn btn-primary">Criar conteúdo</a></div><?php else: ?>
<form method="POST" action="questoes.php" class="teacher-form" id="question-editor"><input type="hidden" name="acao" value="cadastrar"><div class="teacher-form-grid"><label class="teacher-field"><span>Conteúdo</span><select name="conteudo_id" required><option value="">Selecione um conteúdo</option><?php foreach ($conteudos as $c): ?><option value="<?= (int)$c['id'] ?>"><?= escape($c['titulo']) ?></option><?php endforeach; ?></select></label><label class="teacher-field"><span>Formato da pergunta</span><select name="tipo" id="teacher-question-type"><option value="multipla">Múltipla escolha</option><option value="vf">Verdadeiro ou falso</option><option value="dissertativa">Dissertativa</option></select></label></div>
<label class="teacher-field"><span>Enunciado</span><textarea name="enunciado" rows="3" required placeholder="Escreva uma pergunta clara e direta..."></textarea></label>
<div id="teacher-multiple-fields"><span class="teacher-field-caption">ALTERNATIVAS</span><div class="teacher-alternatives"><?php foreach (['a' => 'A', 'b' => 'B', 'c' => 'C', 'd' => 'D'] as $key => $letter): ?><label class="teacher-field teacher-option-field"><span>Alternativa <?= $letter ?></span><input type="text" name="alt_<?= $key ?>" placeholder="Digite a alternativa"></label><?php endforeach; ?></div></div>
<div class="teacher-form-grid"><label class="teacher-field" id="teacher-choice-answer"><span>Resposta correta</span><select name="resposta_correta" id="teacher-answer-choice"><option value="A">Alternativa A</option><option value="B">Alternativa B</option><option value="C">Alternativa C</option><option value="D">Alternativa D</option></select></label><label class="teacher-field" id="teacher-text-answer" hidden><span>Gabarito da questão</span><textarea name="resposta_texto" id="teacher-answer-text" rows="2" placeholder="Escreva a resposta esperada"></textarea></label><label class="teacher-field"><span>Explicação / comentário</span><textarea name="explicacao" rows="2" required placeholder="Explique por que essa é a resposta..."></textarea></label></div><button type="submit" class="btn btn-primary teacher-publish">Publicar para os alunos <span>↗</span></button></form><?php endif; ?></section>
<section class="teacher-card question-library"><div class="teacher-card-heading"><span class="teacher-heading-icon pink">▤</span><div><h2>Banco de questões</h2><p>Questões publicadas e ligadas aos conteúdos da plataforma.</p></div></div><div class="teacher-table-wrap"><table class="teacher-table"><thead><tr><th>Questão</th><th>Conteúdo</th><th>Tipo</th><th>Gabarito</th><th></th></tr></thead><tbody><?php foreach ($questoes as $q): ?><tr><td><strong><?= escape($q['enunciado']) ?></strong></td><td><?= escape($q['conteudo'] ?? 'Conteúdo removido') ?></td><td><span class="teacher-tag"><?= $q['tipo'] === 'multipla' ? 'Múltipla escolha' : ($q['tipo'] === 'vf' ? 'Verdadeiro ou falso' : 'Dissertativa') ?></span></td><td><?= $q['tipo'] === 'dissertativa' ? 'Gabarito escrito' : escape($q['resposta_correta']) ?></td><td><a class="teacher-delete" href="?excluir=<?= (int)$q['id'] ?>" onclick="return confirm('Excluir esta questão? Ela também será retirada dos simulados em que estiver.')">Excluir</a></td></tr><?php endforeach; ?><?php if (!$questoes): ?><tr><td colspan="5" class="teacher-empty-row">Nenhuma questão publicada ainda. As próximas aparecerão aqui e na área de prática dos alunos.</td></tr><?php endif; ?></tbody></table></div></section>
</div></main></div><script src="../js/script.js?v=20261010-teacher"></script><script src="../js/admin-questions.js?v=20261010-teacher"></script></body></html>
