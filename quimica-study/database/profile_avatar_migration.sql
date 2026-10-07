USE quimica_study;

ALTER TABLE usuarios
    ADD COLUMN avatar_key VARCHAR(20) NOT NULL DEFAULT 'atom',
    ADD COLUMN foto_perfil VARCHAR(255) NULL;

ALTER TABLE questoes
    MODIFY COLUMN resposta_correta TEXT NOT NULL;
