<?php
require_once 'includes/conexao.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

if (isset($_SESSION['usuario_id'])) {
    $destino = ($_SESSION['usuario_tipo'] ?? 'aluno') === 'admin'
        ? 'admin/dashboard.php'
        : 'aluno/dashboard.php';
    header('Location: ' . $destino);
    exit;
}

$total_conteudos = (int)$pdo->query('SELECT COUNT(*) FROM conteudos')->fetchColumn();
$total_questoes = (int)$pdo->query('SELECT COUNT(*) FROM questoes')->fetchColumn();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#261438">
    <meta name="description" content="Aprenda Química com conteúdos diretos, simulados e uma tabela periódica interativa.">
    <title>Química Study — aprenda fazendo</title>
    <link rel="icon" href="assets/logo-chem.svg" type="image/svg+xml">
    <link rel="stylesheet" href="css/style.css?v=20261008-complete">
</head>
<body class="home-page">
    <nav class="navbar home-nav">
        <div class="container nav-shell">
            <a href="index.php" class="brand" aria-label="Química Study — início">
                <img src="assets/logo-chem.svg" alt="">
                <span>Química<span class="brand-light">STUDY</span></span>
            </a>
            <button class="mobile-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false">☰</button>
            <div class="nav-links" id="main-navigation">
                <a href="#trilhas">Trilhas de estudo</a>
                <a href="#laboratorio">Laboratório</a>
                <a href="#periodica">Tabela periódica</a>
                <a href="login.php" class="nav-login">Entrar</a>
                <a href="cadastro.php" class="btn btn-primary nav-signup">Criar minha conta</a>
            </div>
        </div>
    </nav>

    <main>
        <section class="home-hero">
            <div class="hero-glow hero-glow-one"></div>
            <div class="hero-glow hero-glow-two"></div>
            <div class="container hero-layout">
                <div class="hero-copy">
                    <span class="eyebrow"><i></i> Química do ensino médio, do seu jeito</span>
                    <h1>Entenda a química.<br><em>Transforme</em> o seu jeito de estudar.</h1>
                    <p>Conceitos que fazem sentido, desafios para praticar e ferramentas para acompanhar cada avanço — tudo em um só lugar.</p>
                    <div class="hero-actions">
                        <a href="cadastro.php" class="btn btn-primary btn-large">Começar a estudar <span aria-hidden="true">↗</span></a>
                        <a href="#trilhas" class="hero-text-link">Explorar a plataforma <span aria-hidden="true">↓</span></a>
                    </div>
                    <div class="hero-proof"><span class="proof-dots"><i></i><i></i><i></i></span><span>Aprenda no seu ritmo, um conceito por vez.</span></div>
                </div>
                <div class="hero-visual" aria-label="Animação de moléculas em movimento">
                    <div class="visual-frame">
                        <div class="visual-topline"><span><i></i> ESTÚDIO DE QUÍMICA</span><span>01 / 04</span></div>
                        <canvas id="chemistry-scene" aria-hidden="true"></canvas>
                        <div class="molecule-label label-water"><b>H₂O</b><span>molécula de água</span></div>
                        <div class="molecule-label label-carbon"><b>CH₄</b><span>metano</span></div>
                        <div class="scene-caption"><span class="scene-caption-icon">✳</span><span>Observe as ligações.<br><strong>Descubra o que conecta tudo.</strong></span></div>
                        <div class="scene-controls"><span class="scene-live"><i></i> SIMULAÇÃO AO VIVO</span><button type="button" id="scene-toggle" aria-label="Pausar animação">Ⅱ</button></div>
                    </div>
                    <div class="floating-note note-atom"><span class="note-orbit">e⁻</span><span><b>Estrutura atômica</b><small>do núcleo à eletrosfera</small></span></div>
                    <div class="floating-note note-bond"><span class="bond-symbol">↗</span><span><b>Ligações químicas</b><small>átomos em conexão</small></span></div>
                </div>
            </div>
            <div class="hero-bottom-line"><span>UM UNIVERSO DE DESCOBERTAS</span><span>ROLE PARA EXPLORAR ↓</span></div>
        </section>

        <section class="quick-stats" aria-label="Conteúdo disponível">
            <div class="container stats-inner">
                <div class="stat-intro"><span class="stat-spark">✳</span><span>Seu próximo grande insight<br><strong>começa com uma pergunta.</strong></span></div>
                <div class="quick-stat"><strong><?= $total_conteudos ?></strong><span>guias de estudo</span></div>
                <div class="quick-stat"><strong><?= $total_questoes ?>+</strong><span>questões para praticar</span></div>
                <div class="quick-stat"><strong>118</strong><span>elementos para explorar</span></div>
            </div>
        </section>

        <section id="trilhas" class="learning-section section-space">
            <div class="container">
                <div class="section-heading">
                    <div><span class="eyebrow eyebrow-light">UM BOM COMEÇO</span><h2>Escolha por onde<br><em>começar a descobrir.</em></h2></div>
                    <p>Aprender fica mais leve quando o caminho é claro. Explore os temas, teste o que entendeu e volte sempre que quiser.</p>
                </div>
                <div class="learning-cards">
                    <a href="login.php" class="learning-card card-lilac">
                        <span class="card-index">01 / BASES</span><span class="card-art art-atom">⊙</span>
                        <h3>Do átomo<br>às ligações</h3><p>Entenda a estrutura da matéria e como os átomos se combinam.</p><span class="card-cta">Explorar conteúdos <b>↗</b></span>
                    </a>
                    <a href="login.php" class="learning-card card-rose">
                        <span class="card-index">02 / TRANSFORMAÇÕES</span><span class="card-art art-reaction">A + B → C</span>
                        <h3>Reações que<br>transformam</h3><p>Balanceamento, estequiometria e a lógica por trás das reações.</p><span class="card-cta">Explorar conteúdos <b>↗</b></span>
                    </a>
                    <a href="login.php" class="learning-card card-peach">
                        <span class="card-index">03 / NO COTIDIANO</span><span class="card-art art-ph">pH <small>0—14</small></span>
                        <h3>Química<br>ao seu redor</h3><p>Descubra a ciência presente nos alimentos, materiais e ambiente.</p><span class="card-cta">Explorar conteúdos <b>↗</b></span>
                    </a>
                </div>
            </div>
        </section>

        <section id="laboratorio" class="practice-section section-space">
            <div class="container practice-layout">
                <div class="practice-visual">
                    <div class="practice-orbit orbit-a"></div><div class="practice-orbit orbit-b"></div>
                    <div class="practice-center"><span>Na</span><small>11</small></div>
                    <span class="practice-particle particle-a">Cl⁻</span><span class="practice-particle particle-b">e⁻</span><span class="practice-particle particle-c">Na⁺</span>
                    <div class="practice-chip">EXPERIMENTE · ERRE · APRENDA</div>
                </div>
                <div class="practice-copy"><span class="eyebrow eyebrow-light">SEU LABORATÓRIO DE BOLSO</span><h2>Aprender fazendo<br>muda <em>tudo.</em></h2><p>Responda questões, confira explicações e acompanhe seu progresso. Cada tentativa ajuda a fixar uma ideia nova.</p>
                    <div class="practice-tools"><div><span class="tool-icon">✳</span><span><b>Quiz rápido</b><small>Desafios curtos para revisar.</small></span></div><div><span class="tool-icon">▤</span><span><b>Simulados</b><small>Pratique como se fosse prova.</small></span></div><div><span class="tool-icon">↗</span><span><b>Seu progresso</b><small>Veja o quanto já evoluiu.</small></span></div></div>
                    <a href="cadastro.php" class="btn btn-primary btn-large">Experimentar agora <span>↗</span></a>
                </div>
            </div>
        </section>

        <section id="periodica" class="periodic-promo section-space">
            <div class="container periodic-layout">
                <div class="periodic-copy"><span class="eyebrow eyebrow-light">UM MAPA DE POSSIBILIDADES</span><h2>118 elementos.<br><em>Histórias infinitas.</em></h2><p>Explore a tabela periódica, descubra propriedades e veja como cada elemento participa do mundo à sua volta.</p><a href="cadastro.php" class="btn btn-light btn-large">Conhecer a tabela <span>↗</span></a></div>
                <div class="periodic-preview" aria-hidden="true"><div class="preview-grid">
                    <span class="preview-element p-violet"><small>1</small><b>H</b></span><span class="preview-element p-pink"><small>2</small><b>He</b></span><span class="preview-element p-peach"><small>3</small><b>Li</b></span><span class="preview-element p-lilac"><small>6</small><b>C</b></span><span class="preview-element p-pink"><small>8</small><b>O</b></span><span class="preview-element p-violet"><small>11</small><b>Na</b></span><span class="preview-element p-peach"><small>17</small><b>Cl</b></span><span class="preview-element p-lilac"><small>26</small><b>Fe</b></span><span class="preview-element p-pink"><small>29</small><b>Cu</b></span><span class="preview-element p-violet"><small>47</small><b>Ag</b></span><span class="preview-element p-peach"><small>79</small><b>Au</b></span><span class="preview-element p-lilac"><small>92</small><b>U</b></span>
                </div><span class="preview-caption">A TABELA É SÓ O COMEÇO <b>↗</b></span></div>
            </div>
        </section>

        <section class="closing-section section-space"><div class="container closing-card"><img src="assets/logo-chem.svg" alt="" class="closing-logo"><span class="eyebrow eyebrow-light">PRONTO PARA A PRÓXIMA DESCOBERTA?</span><h2>Seu jeito de aprender<br>pode ser <em>mais interessante.</em></h2><a href="cadastro.php" class="btn btn-primary btn-large">Criar conta gratuita <span>↗</span></a><p>Sem pressa. Sem complicação. No seu ritmo.</p></div></section>
    </main>

    <footer class="home-footer"><div class="container footer-inner"><a href="index.php" class="brand"><img src="assets/logo-chem.svg" alt=""><span>Química<span class="brand-light">STUDY</span></span></a><p>Feito para aprender química com curiosidade.</p><span>© <?= date('Y') ?> Química Study</span></div></footer>
    <script src="js/script.js?v=20261008-complete"></script>
    <script src="js/chemistry-scene.js?v=20261008-complete"></script>
</body>
</html>
