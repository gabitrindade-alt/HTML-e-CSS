<?php
require_once __DIR__ . '/config.php';

function diario_list(): void {
    require_login();
    $rows = db()->query("
        SELECT d.*, t.nome AS turma_nome, p.nome AS professor_nome
        FROM diario d
        LEFT JOIN turmas t ON t.id = d.turma_id
        LEFT JOIN professores p ON p.id = d.professor_id
        ORDER BY d.data DESC
    ")->fetchAll();
    json_ok($rows);
}

function diario_get(): void {
    require_login();
    $stmt = db()->prepare("SELECT * FROM diario WHERE id = ?");
    $stmt->execute([(int)($_GET['id'] ?? 0)]);
    json_ok($stmt->fetch() ?: null);
}

function diario_save(): void {
    if (!perm('manage_diary')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['turma_id','data','disciplina','conteudo'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $u = require_login();
    $profId = $u['perfil'] === 'professor' ? (int)$u['ref_id'] : (int)($in['professor_id'] ?? 0);

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        db()->prepare("UPDATE diario SET turma_id=?, data=?, disciplina=?, professor_id=?, conteudo=?, resumo=?, observacoes=? WHERE id=?")
            ->execute([(int)$in['turma_id'],$in['data'],$in['disciplina'],$profId,$in['conteudo'],$in['resumo']??'',$in['observacoes']??'',$id]);
    } else {
        db()->prepare("INSERT INTO diario (turma_id,data,disciplina,professor_id,conteudo,resumo,observacoes) VALUES (?,?,?,?,?,?,?)")
            ->execute([(int)$in['turma_id'],$in['data'],$in['disciplina'],$profId,$in['conteudo'],$in['resumo']??'',$in['observacoes']??'']);
    }
    json_ok(null, 'Diário salvo');
}

function diario_delete(): void {
    if (!perm('manage_diary')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("DELETE FROM diario WHERE id = ?")->execute([(int)$in['id']]);
    json_ok(null, 'Registro excluído');
}