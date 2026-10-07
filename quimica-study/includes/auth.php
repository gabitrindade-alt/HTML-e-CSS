<?php
session_start();

function requerLogin() {
    if (!isset($_SESSION['usuario_id'])) {
        header("Location: ../login.php?erro=nao_autenticado");
        exit;
    }
}

function requerAdmin() {
    requerLogin();
    if ($_SESSION['usuario_tipo'] !== 'admin') {
        header("Location: ../aluno/dashboard.php?erro=acesso_negado");
        exit;
    }
}

function getUsuarioLogado() {
    if (isset($_SESSION['usuario_id'])) {
        return [
            'id' => $_SESSION['usuario_id'],
            'nome' => $_SESSION['usuario_nome'],
            'tipo' => $_SESSION['usuario_tipo'],
            'pontos' => $_SESSION['usuario_pontos'] ?? 0
        ];
    }
    return null;
}
?>