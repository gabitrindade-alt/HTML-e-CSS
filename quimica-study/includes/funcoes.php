<?php
function escape($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

function hashSenha($senha) {
    return password_hash($senha, PASSWORD_DEFAULT);
}

function verificarSenha($senha, $hash) {
    return password_verify($senha, $hash);
}

function redirecionar($url) {
    header("Location: $url");
    exit;
}
?>