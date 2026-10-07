<?php
$titulo_pagina = 'Meu perfil';
$css_extra = 'profile.css';
require_once '../includes/header.php';

$usuario_id = (int)$_SESSION['usuario_id'];
$presets = ['atom' => ['⚛', 'Violeta'], 'flask' => ['⚗', 'Rosa'], 'molecule' => ['✣', 'Lavanda'], 'star' => ['✦', 'Pêssego'], 'planet' => ['◉', 'Azul'], 'spark' => ['✧', 'Orquídea']];
$mensagem = '';
$erro = '';
$_SESSION['profile_csrf'] ??= bin2hex(random_bytes(32));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['profile_csrf'], $_POST['csrf'])) {
        $erro = 'A sessão expirou. Atualize a página e tente novamente.';
    } else {
        $novo_nome = trim($_POST['nome'] ?? '');
        $avatar = $_POST['avatar_key'] ?? 'atom';
        $avatar = isset($presets[$avatar]) ? $avatar : 'atom';
        $foto = null;
        $foto_enviada = isset($_FILES['foto_perfil']) && $_FILES['foto_perfil']['error'] !== UPLOAD_ERR_NO_FILE;

        if ($novo_nome === '' || mb_strlen($novo_nome) > 100) {
            $erro = 'Informe um nome válido com até 100 caracteres.';
        } elseif ($foto_enviada) {
            $upload = $_FILES['foto_perfil'];
            if ($upload['error'] !== UPLOAD_ERR_OK || $upload['size'] > 4 * 1024 * 1024) {
                $erro = 'A foto deve ter até 4 MB.';
            } else {
                $image = @getimagesize($upload['tmp_name']);
                $mime = $image['mime'] ?? '';
                $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
                if (!$image || !isset($extensions[$mime])) {
                    $erro = 'Use uma imagem JPG, PNG ou WEBP.';
                } else {
                    $folder = dirname(__DIR__) . '/uploads/avatars';
                    if (!is_dir($folder) && !mkdir($folder, 0755, true) && !is_dir($folder)) {
                        $erro = 'Não foi possível preparar o espaço da foto. Tente novamente.';
                    } else {
                        $foto = 'uploads/avatars/' . $usuario_id . '-' . bin2hex(random_bytes(12)) . '.' . $extensions[$mime];
                        if (!move_uploaded_file($upload['tmp_name'], dirname(__DIR__) . '/' . $foto)) {
                            $erro = 'Não foi possível salvar a foto. Tente novamente.';
                        }
                    }
                }
            }
        }

        if ($erro === '') {
            $stmt = $pdo->prepare('UPDATE usuarios SET nome = :nome, avatar_key = :avatar, foto_perfil = COALESCE(:foto, foto_perfil) WHERE id = :id');
            if (isset($_POST['usar_avatar'])) {
                $stmt = $pdo->prepare('UPDATE usuarios SET nome = :nome, avatar_key = :avatar, foto_perfil = NULL WHERE id = :id');
                $stmt->execute(['nome' => $novo_nome, 'avatar' => $avatar, 'id' => $usuario_id]);
            } else {
                $stmt->execute(['nome' => $novo_nome, 'avatar' => $avatar, 'foto' => $foto, 'id' => $usuario_id]);
            }
            $_SESSION['usuario_nome'] = $novo_nome;
            $mensagem = 'Perfil atualizado. Suas escolhas já estão salvas.';
            $_SESSION['profile_csrf'] = bin2hex(random_bytes(32));
        }
    }
}

$stmt = $pdo->prepare('SELECT id, nome, email, pontos, criado_em, avatar_key, foto_perfil FROM usuarios WHERE id = :id');
$stmt->execute(['id' => $usuario_id]);
$usuario = $stmt->fetch();
$avatar_key = isset($presets[$usuario['avatar_key'] ?? '']) ? $usuario['avatar_key'] : 'atom';
$stmt_stats = $pdo->prepare('SELECT COUNT(*) AS total_simulados, COALESCE(SUM(acertos), 0) AS total_acertos FROM historico_simulados WHERE usuario_id = :id');
$stmt_stats->execute(['id' => $usuario_id]);
$stats = $stmt_stats->fetch();
$stmt_conq = $pdo->prepare('SELECT COUNT(*) FROM usuario_conquistas WHERE usuario_id = :id');
$stmt_conq->execute(['id' => $usuario_id]);
$total_conquistas = (int)$stmt_conq->fetchColumn();
?>
<section class="profile-page">
    <header class="profile-heading"><span class="profile-eyebrow">SUA CONTA</span><h1>Seu perfil, do seu jeito.</h1><p>Personalize sua identidade e acompanhe a sua jornada de estudos.</p></header>
    <?php if ($mensagem): ?><div class="profile-alert success" role="status"><?= escape($mensagem) ?></div><?php endif; ?>
    <?php if ($erro): ?><div class="profile-alert error" role="alert"><?= escape($erro) ?></div><?php endif; ?>
    <form method="POST" action="perfil.php" enctype="multipart/form-data" class="profile-layout">
        <input type="hidden" name="csrf" value="<?= escape($_SESSION['profile_csrf']) ?>">
        <section class="profile-card identity-card">
            <div class="profile-avatar-preview <?= $usuario['foto_perfil'] ? 'has-photo' : 'preset-' . escape($avatar_key) ?>" id="avatar-preview">
                <?php if ($usuario['foto_perfil']): ?><img src="../<?= escape($usuario['foto_perfil']) ?>" alt="Foto de perfil" id="avatar-photo"><?php else: ?><span id="avatar-symbol"><?= $presets[$avatar_key][0] ?></span><?php endif; ?>
            </div>
            <h2><?= escape($usuario['nome']) ?></h2><p><?= escape($usuario['email']) ?></p>
            <span class="profile-points">✦ <?= (int)$usuario['pontos'] ?> pontos</span>
            <div class="identity-divider"></div>
            <div class="identity-meta"><span>MEMBRO DESDE</span><strong><?= date('d/m/Y', strtotime($usuario['criado_em'])) ?></strong></div>
            <div class="identity-meta"><span>ESTUDANTE</span><strong>Química do ensino médio</strong></div>
        </section>
        <div class="profile-main-column">
            <section class="profile-card profile-edit-card">
                <div class="profile-section-title"><span class="section-icon">✧</span><div><h2>Personalize seu perfil</h2><p>Adicione uma foto ou escolha um avatar para representar você.</p></div></div>
                <div class="profile-form-grid"><div class="profile-field"><label for="profile-name">Nome de exibição</label><input id="profile-name" type="text" name="nome" value="<?= escape($usuario['nome']) ?>" maxlength="100" required></div><div class="profile-field"><label>E-mail da conta</label><input type="email" value="<?= escape($usuario['email']) ?>" disabled><small>O e-mail de acesso não pode ser alterado.</small></div></div>
                <div class="avatar-choice-block"><div class="avatar-choice-heading"><strong>Escolha seu avatar</strong><button type="button" class="avatar-random" id="random-avatar">Sortear um avatar ✦</button></div><div class="avatar-options">
                    <?php foreach ($presets as $key => [$symbol, $label]): ?><label class="avatar-option <?= $key === $avatar_key ? 'selected' : '' ?>"><input type="radio" name="avatar_key" value="<?= $key ?>" <?= $key === $avatar_key ? 'checked' : '' ?>><span class="avatar-swatch avatar-<?= $key ?>"><?= $symbol ?></span><small><?= $label ?></small></label><?php endforeach; ?>
                </div></div>
                <div class="photo-upload-row"><label class="photo-upload-button" for="profile-photo-input"><span>＋</span> Enviar uma foto</label><input id="profile-photo-input" type="file" name="foto_perfil" accept="image/png,image/jpeg,image/webp"><p>JPG, PNG ou WEBP · até 4 MB</p></div>
                <label class="use-avatar-option"><input type="checkbox" id="use-avatar-choice" name="usar_avatar" value="1"><span>Usar o avatar escolhido e remover a foto atual</span></label>
                <div class="profile-actions"><button type="submit" class="btn btn-primary">Salvar meu perfil <span>↗</span></button></div>
            </section>
            <section class="profile-card learning-stats"><div class="profile-section-title"><span class="section-icon pink-icon">↗</span><div><h2>Sua jornada até aqui</h2><p>Cada atividade concluída conta.</p></div></div><div class="profile-stat-grid"><article><span class="profile-stat-icon">▤</span><strong><?= (int)$stats['total_simulados'] ?></strong><small>Simulados feitos</small></article><article><span class="profile-stat-icon pink-icon">✓</span><strong><?= (int)$stats['total_acertos'] ?></strong><small>Respostas corretas</small></article><article><span class="profile-stat-icon">✦</span><strong><?= $total_conquistas ?></strong><small>Conquistas</small></article></div></section>
        </div>
    </form>
</section>
<?php require_once '../includes/footer.php'; ?>
