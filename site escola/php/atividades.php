<?php
require_once __DIR__ . '/config.php';

function atividades_list(): void {
    require_login();
    $rows = db()->query("
        SELECT a.*, t.nome AS turma_nome, p.nome AS professor_nome
        FROM atividades a
        LEFT JOIN turmas t ON t.id = a.turma_id
        LEFT JOIN professores p ON p.id = a.professor_id
        ORDER BY a.prazo ASC
    ")->fetchAll();
    json_ok($rows);
}

function atividades_get(): void {
    require_login();
    $stmt = db()->prepare("SELECT * FROM atividades WHERE id = ?");
    $stmt->execute([(int)($_GET['id'] ?? 0)]);
    json_ok($stmt->fetch() ?: null);
}

function atividades_save(): void {
    if (!perm('manage_activities')) json_err('Sem permissão', 403);
    $in = input();
    $required = ['titulo','turma_id','prazo'];
    foreach ($required as $k) if (empty($in[$k])) json_err("Campo '{$k}' obrigatório");

    $u = require_login();
    $profId = $u['perfil'] === 'professor' ? (int)$u['ref_id'] : (int)($in['professor_id'] ?? 0);

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        db()->prepare("UPDATE atividades SET titulo=?, disciplina=?, turma_id=?, professor_id=?, prazo=?, descricao=? WHERE id=?")
            ->execute([$in['titulo'],$in['disciplina']??'',(int)$in['turma_id'],$profId,$in['prazo'],$in['descricao']??'',$id]);
    } else {
        db()->prepare("INSERT INTO atividades (titulo,disciplina,turma_id,professor_id,prazo,descricao) VALUES (?,?,?,?,?,?)")
            ->execute([$in['titulo'],$in['disciplina']??'',(int)$in['turma_id'],$profId,$in['prazo'],$in['descricao']??'']);
    }
    json_ok(null, 'Atividade salva');
}

function atividades_delete(): void {
    if (!perm('manage_activities')) json_err('Sem permissão', 403);
    $in = input();
    db()->prepare("DELETE FROM atividades WHERE id = ?")->execute([(int)$in['id']]);
    json_ok(null, 'Atividade excluída');
}