<?php
require_once '../includes/admin_auth.php';
$mensagem = '';
$erro = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['acao'] ?? '') === 'cadastrar') {
    $titulo = trim($_POST['titulo'] ?? '');
    $descricao = trim($_POST['descricao'] ?? '');
    $conteudo_id = !empty($_POST['conteudo_id']) ? (int)$_POST['conteudo_id'] : null;
    $selected = array_values(array_unique(array_filter(array_map('intval', (array)($_POST['questoes'] ?? [])))));
    if ($titulo === '' || $descricao === '' || !$selected) {
        $erro = 'Informe o título, a descrição e escolha pelo menos uma questão.';
    } else {
        $marks = implode(',', array_fill(0, count($selected), '?'));
        $check = $pdo->prepare("SELECT id FROM questoes WHERE id IN ($marks)");
        $check->execute($selected);
        $valid_ids = $check->fetchAll(PDO::FETCH_COLUMN);
        $content_matches = true;
        if ($conteudo_id) {
            $same_content = $pdo->prepare("SELECT COUNT(*) FROM questoes WHERE conteudo_id = ? AND id IN ($marks)");
            $same_content->execute(array_merge([$conteudo_id], $selected));
            $content_matches = (int)$same_content->fetchColumn() === count($selected);
        }
        if (count($valid_ids) !== count($selected)) {
            $erro = 'Uma das questões selecionadas não está mais disponível. Atualize e tente novamente.';
        } elseif (!$content_matches) {
            $erro = 'Selecione questões do conteúdo escolhido.';
        } else {
            try {
                $pdo->beginTransaction();
                $stmt = $pdo->prepare('INSERT INTO simulados (titulo, descricao, conteudo_id) VALUES (?, ?, ?)');
                $stmt->execute([$titulo, $descricao, $conteudo_id]);
                $simulado_id = (int)$pdo->lastInsertId();
                $link = $pdo->prepare('INSERT INTO simulado_questoes (simulado_id, questao_id) VALUES (?, ?)');
                foreach ($selected as $qid) $link->execute([$simulado_id, $qid]);
                $pdo->commit();
                $mensagem = 'Simulado publicado para todos os alunos cadastrados.';
            } catch (Throwable $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                $erro = 'Não foi possível publicar o simulado. Revise os dados e tente novamente.';
            }
        }
    }
}
if (isset($_GET['excluir'])) {
    $pdo->prepare('DELETE FROM simulados WHERE id = ?')->execute([(int)$_GET['excluir']]);
    header('Location: simulados.php'); exit;
}
$conteudos = $pdo->query('SELECT id, titulo FROM conteudos ORDER BY titulo')->fetchAll();
$questoes = $pdo->query('SELECT q.id, q.enunciado, q.tipo, q.conteudo_id, c.titulo AS conteudo FROM questoes q LEFT JOIN conteudos c ON c.id = q.conteudo_id ORDER BY c.titulo, q.id DESC')->fetchAll();
$simulados = $pdo->query('SELECT s.id, s.titulo, s.descricao, c.titulo AS categoria, COUNT(sq.questao_id) AS total FROM simulados s LEFT JOIN conteudos c ON c.id = s.conteudo_id LEFT JOIN simulado_questoes sq ON s.id = sq.simulado_id GROUP BY s.id ORDER BY s.id DESC')->fetchAll();
?>
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Simulados | Química Study</title><link rel="stylesheet" href="../css/style.css?v=20261010-teacher"><link rel="stylesheet" href="../css/dashboard.css?v=20261010-teacher"><link rel="stylesheet" href="../css/teacher-tools.css?v=20261010-teacher"></head>
<body class="dashboard-body"><div class="app-container"><aside class="sidebar"><div class="sidebar-header"><a href="dashboard.php" class="logo brand-logo"><img src="../assets/logo-chem.svg" alt=""><span class="brand-name">Química<span>STUDY</span></span></a></div><nav class="sidebar-nav"><a href="dashboard.php" class="nav-item"><span class="icon">▦</span> Painel</a><a href="usuarios.php" class="nav-item"><span class="icon">♙</span> Alunos</a><a href="conteudos.php" class="nav-item"><span class="icon">▤</span> Conteúdos</a><a href="questoes.php" class="nav-item"><span class="icon">?</span> Questões</a><a href="simulados.php" class="nav-item active"><span class="icon">✎</span> Simulados</a><a href="resultados.php" class="nav-item"><span class="icon">↗</span> Resultados</a><a href="agenda.php" class="nav-item"><span class="icon">▦</span> Agenda dos alunos</a></nav><div class="sidebar-footer"><a href="../logout.php" class="nav-item logout"><span class="icon">↪</span> Sair</a></div></aside>
<main class="main-content"><header class="topbar"><div class="user-info"><span class="user-name">Área do professor</span></div></header><div class="content-wrapper teacher-page"><section class="teacher-hero"><span>PUBLICAÇÃO PARA A TURMA</span><h1>Crie um simulado completo.</h1><p>Selecione as questões do seu banco. Ao publicar, o simulado aparece automaticamente na área de todos os alunos cadastrados, e cada tentativa fica ligada ao perfil de quem respondeu.</p><div class="teacher-hero-stats"><strong><?= count($simulados) ?><small> simulados publicados</small></strong><strong><?= count($questoes) ?><small> questões no banco</small></strong></div></section>
<?php if ($mensagem): ?><div class="teacher-notice success" role="status"><?= escape($mensagem) ?></div><?php endif; ?><?php if ($erro): ?><div class="teacher-notice error" role="alert"><?= escape($erro) ?></div><?php endif; ?>
<section class="teacher-card"><div class="teacher-card-heading"><span class="teacher-heading-icon">✎</span><div><h2>Novo simulado</h2><p>Escolha uma matéria e monte a lista de questões.</p></div></div>
<?php if (!$questoes): ?><div class="teacher-no-content"><strong>O banco de questões está vazio.</strong><p>Publique questões primeiro. Elas serão compartilhadas com os alunos e aparecerão nesta lista.</p><a href="questoes.php" class="btn btn-primary">Criar questões</a></div><?php else: ?>
<form method="POST" action="simulados.php" class="teacher-form"><input type="hidden" name="acao" value="cadastrar"><div class="teacher-form-grid"><label class="teacher-field"><span>Título</span><input type="text" name="titulo" required placeholder="Ex.: Revisão de ligações químicas"></label><label class="teacher-field"><span>Conteúdo / matéria</span><select name="conteudo_id" id="simulado-content-filter"><option value="">Todos os conteúdos</option><?php foreach ($conteudos as $c): ?><option value="<?= (int)$c['id'] ?>"><?= escape($c['titulo']) ?></option><?php endforeach; ?></select></label></div><label class="teacher-field"><span>Orientação para os alunos</span><textarea name="descricao" rows="2" required placeholder="Explique o objetivo deste simulado..."></textarea></label><div class="teacher-question-picker"><div class="picker-heading"><div><strong>Selecione as questões</strong><small><span id="simulado-selected-count">0</span> selecionadas · questões de dissertação recebem gabarito comentado</small></div><button type="button" id="select-visible-questions">Selecionar visíveis</button></div><div class="teacher-question-list"><?php foreach ($questoes as $q): ?><label class="teacher-question-choice" data-question-content="<?= (int)$q['conteudo_id'] ?>"><input type="checkbox" name="questoes[]" value="<?= (int)$q['id'] ?>"><span class="question-choice-check"></span><span class="question-choice-content"><strong><?= escape($q['enunciado']) ?></strong><small><?= escape($q['conteudo'] ?? 'Sem conteúdo') ?> · <?= $q['tipo'] === 'multipla' ? 'Múltipla escolha' : ($q['tipo'] === 'vf' ? 'Verdadeiro ou falso' : 'Dissertativa') ?></small></span></label><?php endforeach; ?></div></div><button type="submit" class="btn btn-primary teacher-publish">Publicar simulado <span>↗</span></button></form><?php endif; ?></section>
<section class="teacher-card question-library"><div class="teacher-card-heading"><span class="teacher-heading-icon pink">▦</span><div><h2>Simulados publicados</h2><p>Disponíveis para toda a comunidade de alunos da plataforma.</p></div></div><div class="teacher-table-wrap"><table class="teacher-table"><thead><tr><th>Simulado</th><th>Conteúdo</th><th>Questões</th><th></th></tr></thead><tbody><?php foreach ($simulados as $s): ?><tr><td><strong><?= escape($s['titulo']) ?></strong><small class="teacher-row-detail"><?= escape($s['descricao']) ?></small></td><td><?= escape($s['categoria'] ?? 'Geral') ?></td><td><?= (int)$s['total'] ?></td><td><a class="teacher-delete" href="?excluir=<?= (int)$s['id'] ?>" onclick="return confirm('Excluir este simulado?')">Excluir</a></td></tr><?php endforeach; ?><?php if (!$simulados): ?><tr><td colspan="4" class="teacher-empty-row">Nenhum simulado publicado. Crie o primeiro acima.</td></tr><?php endif; ?></tbody></table></div></section>
</div></main></div><script src="../js/script.js?v=20261010-teacher"></script><script src="../js/admin-simulations.js?v=20261010-teacher"></script></body></html>
