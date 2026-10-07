USE quimica_study;

INSERT INTO usuarios (nome, email, senha, tipo, pontos)
VALUES (
    'Professor',
    'professor@gmail.com',
    '$2y$10$zTzL4Wd6TC7GhOXHq6iV4OrP0yQGOrAUtvQgX6DwbNbsi9uQ6PNtq',
    'admin',
    0
)
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    senha = VALUES(senha),
    tipo = 'admin';

UPDATE usuarios
SET tipo = 'aluno'
WHERE email = 'admin@quimica.com' AND tipo = 'admin';

UPDATE usuarios
SET senha = '$2y$10$zTzL4Wd6TC7GhOXHq6iV4OrP0yQGOrAUtvQgX6DwbNbsi9uQ6PNtq'
WHERE email = 'aluno@quimica.com' AND tipo = 'aluno';
