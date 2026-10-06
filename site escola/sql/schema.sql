-- ============================================================
-- COLÉGIO L'AVENIR - SCHEMA COMPLETO PARA XAMPP
-- Execute este arquivo INTEIRO de uma vez no phpMyAdmin
-- ============================================================

-- 1. CRIA O BANCO DE DADOS
CREATE DATABASE IF NOT EXISTS lavenir CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lavenir;

-- 2. APAGA TABELAS EXISTENTES (na ordem inversa das foreign keys)
DROP TABLE IF EXISTS turma_professor;
DROP TABLE IF EXISTS solicitacoes_materiais;
DROP TABLE IF EXISTS mensagens;
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS eventos;
DROP TABLE IF EXISTS frequencia;
DROP TABLE IF EXISTS notas;
DROP TABLE IF EXISTS diario;
DROP TABLE IF EXISTS atividades;
DROP TABLE IF EXISTS ocorrencias;
DROP TABLE IF EXISTS comunicados;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS responsaveis;
DROP TABLE IF EXISTS alunos;
DROP TABLE IF EXISTS professores;
DROP TABLE IF EXISTS turmas;
DROP TABLE IF EXISTS cursos;

-- ============================================================
-- 3. CRIA AS TABELAS (na ordem correta)
-- ============================================================

-- CURSOS (sem dependências)
CREATE TABLE cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    disciplinas JSON,
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- TURMAS (depende de cursos)
CREATE TABLE turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    curso_id INT NOT NULL,
    periodo ENUM('Manhã','Tarde','Integral') DEFAULT 'Manhã',
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- PROFESSORES (sem dependências)
CREATE TABLE professores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    disciplina VARCHAR(255),
    ativo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ALUNOS (depende de turmas e cursos)
CREATE TABLE alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    turma_id INT,
    curso_id INT,
    situacao ENUM('Ativo','Inativo','Transferido') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE SET NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- RESPONSÁVEIS (depende de alunos)
CREATE TABLE responsaveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    aluno_id INT NOT NULL,
    telefone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- USUÁRIOS (tabela de login geral)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('diretor','coordenador','professor','aluno','responsavel') NOT NULL,
    nome VARCHAR(150),
    ref_id INT,
    ativo TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- VÍNCULO PROFESSOR ↔ TURMA (N:N)
CREATE TABLE turma_professor (
    turma_id INT NOT NULL,
    professor_id INT NOT NULL,
    PRIMARY KEY (turma_id, professor_id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- COMUNICADOS
CREATE TABLE comunicados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    data DATE NOT NULL,
    conteudo TEXT,
    destino ENUM('Todos','Alunos','Responsáveis','Professores') DEFAULT 'Todos',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- OCORRÊNCIAS
CREATE TABLE ocorrencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    tipo ENUM('Atraso','Falta','Indisciplina','Elogio','Outro') NOT NULL,
    descricao TEXT NOT NULL,
    observacoes TEXT,
    data DATE NOT NULL,
    registrado_por VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ATIVIDADES
CREATE TABLE atividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    disciplina VARCHAR(100),
    turma_id INT NOT NULL,
    professor_id INT,
    prazo DATE NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- NOTAS
CREATE TABLE notas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    disciplina VARCHAR(100) NOT NULL,
    valor DECIMAL(4,2) NOT NULL,
    bimestre TINYINT NOT NULL,
    observacao TEXT,
    data DATE NOT NULL,
    professor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- FREQUÊNCIA
CREATE TABLE frequencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    data DATE NOT NULL,
    presente TINYINT(1) NOT NULL,
    justificativa VARCHAR(255),
    observacao TEXT,
    professor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_aluno_data (aluno_id, data),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- DIÁRIO DE CLASSE
CREATE TABLE diario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_id INT NOT NULL,
    data DATE NOT NULL,
    disciplina VARCHAR(100),
    professor_id INT,
    conteudo TEXT,
    resumo TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- MENSAGENS
CREATE TABLE mensagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    de_tipo VARCHAR(30) NOT NULL,
    de_id INT NOT NULL,
    para_tipo VARCHAR(30) NOT NULL,
    para_id INT NOT NULL,
    assunto VARCHAR(200) NOT NULL,
    conteudo TEXT NOT NULL,
    data DATE NOT NULL,
    lida TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- PAGAMENTOS
CREATE TABLE pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    responsavel_id INT,
    mes_referencia VARCHAR(7) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('Pendente','Pago','Cancelado') DEFAULT 'Pendente',
    data_vencimento DATE NOT NULL,
    data_pagamento DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- EVENTOS
CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    tipo ENUM('Passeio','Reunião','Evento') NOT NULL,
    data DATE NOT NULL,
    hora TIME,
    local VARCHAR(200),
    descricao TEXT,
    publico VARCHAR(200),
    status ENUM('Confirmado','Suspenso','Encerrado') DEFAULT 'Confirmado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- SOLICITAÇÕES DE MATERIAIS
CREATE TABLE solicitacoes_materiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_id INT NOT NULL,
    material VARCHAR(200) NOT NULL,
    quantidade INT NOT NULL,
    justificativa TEXT,
    data DATE NOT NULL,
    status ENUM('Pendente','Aprovado','Rejeitado') DEFAULT 'Pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 4. DADOS INICIAIS
-- ============================================================

-- CURSOS
INSERT INTO cursos (nome, disciplinas) VALUES
('Educação Infantil', '["Português","Matemática","Artes","Ed. Física"]'),
('Ensino Fundamental I', '["Português","Matemática","Ciências","História","Geografia","Artes","Ed. Física","Inglês"]'),
('Ensino Fundamental II', '["Português","Matemática","Ciências","História","Geografia","Artes","Ed. Física","Inglês","Filosofia"]'),
('Ensino Médio', '["Português","Matemática","Física","Química","Biologia","História","Geografia","Inglês","Filosofia","Sociologia","Artes","Ed. Física"]');

-- TURMAS
INSERT INTO turmas (nome, curso_id, periodo) VALUES
('6º Ano A', 3, 'Manhã'),
('6º Ano B', 3, 'Tarde'),
('7º Ano A', 3, 'Manhã'),
('7º Ano B', 3, 'Tarde'),
('8º Ano A', 3, 'Manhã'),
('8º Ano B', 3, 'Tarde'),
('9º Ano A', 3, 'Manhã'),
('9º Ano B', 3, 'Tarde'),
('1º Ano EM A', 4, 'Manhã'),
('2º Ano EM A', 4, 'Manhã'),
('3º Ano EM A', 4, 'Manhã');

-- PROFESSORES
INSERT INTO professores (nome, email, disciplina) VALUES
('Prof. Carlos Silva', 'carlos@lavenir.com', 'Matemática'),
('Profa. Mariana Costa', 'mariana@lavenir.com', 'Português'),
('Prof. Roberto Lima', 'robertolima@lavenir.com', 'História'),
('Profa. Ana Paula Souza', 'anapaula@lavenir.com', 'Geografia'),
('Prof. Fernando Alves', 'fernando@lavenir.com', 'Ciências'),
('Professor L Avenir', 'professor@lavenir.com', 'Geral');

-- ALUNOS
INSERT INTO alunos (matricula, nome, email, turma_id, curso_id) VALUES
('2026001', 'Ana Beatriz Costa', 'ana@aluno.lavenir', 1, 3),
('2026002', 'João Pedro Souza', 'joao@aluno.lavenir', 1, 3),
('2026003', 'Maria Silva Santos', 'maria@aluno.lavenir', 1, 3),
('2026004', 'Pedro Lucas Oliveira', 'pedro@aluno.lavenir', 3, 3),
('2026005', 'Juliana Ferreira', 'juliana@aluno.lavenir', 3, 3),
('2026006', 'Lucas Martins', 'lucas@aluno.lavenir', 5, 3),
('2026007', 'Beatriz Almeida', 'beatriz@aluno.lavenir', 5, 3),
('2026008', 'Gabriel Rocha', 'gabriel@aluno.lavenir', 5, 3),
('2026009', 'Rafael Souza', 'rafael@aluno.lavenir', 7, 3),
('2026010', 'Camila Dias', 'camila@aluno.lavenir', 7, 3),
('2026011', 'Thiago Nunes', 'thiago@aluno.lavenir', 9, 4),
('2026012', 'Isabela Cardoso', 'isabela@aluno.lavenir', 9, 4),
('2026013', 'Felipe Moraes', 'felipe@aluno.lavenir', 10, 4),
('2026014', 'Larissa Gomes', 'larissa@aluno.lavenir', 11, 4),
('2026015', 'Bruno Teixeira', 'bruno@aluno.lavenir', 11, 4);

-- RESPONSÁVEIS
INSERT INTO responsaveis (nome, email, aluno_id, telefone) VALUES
('Maria Costa (Mãe)', 'mae.ana@lavenir.com', 1, '(11) 98765-4321'),
('José Souza (Pai)', 'pai.joao@lavenir.com', 2, '(11) 91234-5678');

-- VÍNCULO PROFESSOR ↔ TURMA
INSERT INTO turma_professor (turma_id, professor_id) VALUES
(1, 1), (1, 2), (1, 4),
(2, 1), (2, 2),
(3, 2), (3, 3),
(4, 1), (4, 2),
(5, 1), (5, 2), (5, 4),
(6, 1), (6, 2),
(7, 1), (7, 3),
(8, 2), (8, 5),
(9, 1), (9, 3), (9, 4),
(10, 2), (10, 3),
(11, 3), (11, 1), (11, 5);

-- COMUNICADOS
INSERT INTO comunicados (titulo, data, conteudo, destino) VALUES
('Reunião de Pais e Mestres', '2026-09-18', 'Auditório principal às 19h. Presença obrigatória.', 'Todos'),
('Matrículas Abertas 2027', '2026-09-15', 'Garanta já a vaga do seu filho para o próximo ano letivo!', 'Todos'),
('Feira de Ciências', '2026-11-20', 'Apresentação dos projetos no pátio principal.', 'Alunos');

-- OCORRÊNCIAS
INSERT INTO ocorrencias (aluno_id, tipo, descricao, data, registrado_por, observacoes) VALUES
(2, 'Atraso', 'Chegou 15 minutos atrasado', '2026-09-20', 'Prof. Carlos', ''),
(6, 'Elogio', 'Destaque na feira de ciências', '2026-09-19', 'Profa. Mariana', 'Excelente apresentação'),
(4, 'Indisciplina', 'Conversou durante a prova', '2026-09-21', 'Prof. Carlos', 'Advertência verbal');

-- ATIVIDADES
INSERT INTO atividades (titulo, disciplina, turma_id, professor_id, prazo, descricao) VALUES
('Lista de Exercícios Cap. 4', 'Matemática', 5, 1, '2026-10-01', 'Resolver exercícios 1 a 10 da página 45'),
('Resumo Rev. Francesa', 'História', 11, 3, '2026-10-05', 'Resumo de 2 páginas sobre a Revolução Francesa'),
('Redação Dissertativa', 'Português', 1, 2, '2026-10-25', 'Tema: Tecnologia e Educação - mínimo 30 linhas');

-- NOTAS
INSERT INTO notas (aluno_id, disciplina, valor, bimestre, observacao, data, professor_id) VALUES
(1, 'Matemática', 9.0, 1, 'Excelente desempenho', '2026-03-15', 1),
(1, 'Matemática', 8.5, 2, 'Manteve o bom nível', '2026-06-10', 1),
(1, 'Português', 8.5, 1, '', '2026-03-20', 2),
(2, 'Matemática', 4.5, 1, 'Precisa de reforço em equações', '2026-03-15', 1),
(2, 'Matemática', 5.0, 2, 'Melhorou pouco, continua em recuperação', '2026-06-10', 1),
(2, 'Português', 6.0, 1, '', '2026-03-20', 2),
(6, 'Matemática', 7.5, 1, 'Bom progresso', '2026-03-15', 1),
(4, 'Matemática', 5.5, 1, 'Atenção: aluno com muitas faltas', '2026-03-15', 1),
(14, 'Matemática', 9.5, 1, 'Destaque da turma', '2026-03-15', 1),
(11, 'Matemática', 3.5, 1, 'ALERTA: desempenho muito baixo', '2026-03-15', 1);

-- FREQUÊNCIA (gerada automaticamente para os primeiros 20 dias de setembro)
-- Vamos inserir alguns registros de exemplo
INSERT INTO frequencia (aluno_id, data, presente, justificativa, observacao, professor_id) VALUES
(1, '2026-09-01', 1, '', '', 1),
(1, '2026-09-02', 1, '', '', 1),
(1, '2026-09-03', 0, 'Atestado médico', '', 1),
(1, '2026-09-04', 1, '', '', 1),
(1, '2026-09-05', 1, '', '', 1),
(2, '2026-09-01', 0, '', 'Chegou atrasado', 1),
(2, '2026-09-02', 1, '', '', 1),
(2, '2026-09-03', 0, '', '', 1),
(2, '2026-09-04', 1, '', '', 1),
(2, '2026-09-05', 0, '', '', 1),
(4, '2026-09-01', 0, '', 'Falta recorrente', 1),
(4, '2026-09-02', 1, '', '', 1),
(4, '2026-09-03', 0, '', '', 1),
(4, '2026-09-04', 0, '', '', 1),
(4, '2026-09-05', 1, '', '', 1),
(6, '2026-09-01', 1, '', '', 1),
(6, '2026-09-02', 1, '', '', 1),
(6, '2026-09-03', 1, '', '', 1),
(6, '2026-09-04', 1, '', '', 1),
(6, '2026-09-05', 1, '', '', 1),
(11, '2026-09-01', 0, '', '', 1),
(11, '2026-09-02', 0, '', '', 1),
(11, '2026-09-03', 1, '', '', 1),
(11, '2026-09-04', 0, '', '', 1),
(11, '2026-09-05', 1, '', '', 1);

-- DIÁRIO DE CLASSE
INSERT INTO diario (turma_id, data, disciplina, professor_id, conteudo, resumo, observacoes) VALUES
(5, '2026-09-20', 'Matemática', 1, 'Equações do 2º grau', 'Aula expositiva com exercícios práticos', 'Turma participativa'),
(1, '2026-09-20', 'Português', 2, 'Interpretação de texto', 'Leitura e análise de conto', 'Alunos engajados'),
(9, '2026-09-21', 'História', 3, 'Revolução Francesa - causas', 'Contexto histórico e social', 'Bom debate em sala');

-- PAGAMENTOS
INSERT INTO pagamentos (aluno_id, responsavel_id, mes_referencia, valor, status, data_vencimento, data_pagamento) VALUES
(2, 2, '2026-09', 1850.00, 'Pendente', '2026-09-10', NULL),
(4, NULL, '2026-09', 1850.00, 'Pendente', '2026-09-10', NULL),
(6, NULL, '2026-08', 2100.00, 'Pendente', '2026-08-10', NULL),
(1, 1, '2026-09', 1850.00, 'Pago', '2026-09-10', '2026-09-08'),
(3, NULL, '2026-09', 1850.00, 'Pago', '2026-09-10', '2026-09-05');

-- EVENTOS
INSERT INTO eventos (titulo, tipo, data, hora, local, descricao, publico, status) VALUES
('Passeio ao Museu da Língua Portuguesa', 'Passeio', '2026-10-15', '08:00:00', 'Museu - Luz, SP', 'Visita guiada para alunos do 8º e 9º ano.', '8º e 9º Ano', 'Confirmado'),
('Reunião de Pais - 3º Bimestre', 'Reunião', '2026-10-05', '19:00:00', 'Auditório Principal', 'Entrega de boletins e alinhamento pedagógico.', 'Todos os responsáveis', 'Confirmado'),
('Feira de Ciências 2026', 'Evento', '2026-11-20', '09:00:00', 'Pátio e Quadra', 'Apresentação dos projetos científicos dos alunos.', 'Comunidade escolar', 'Confirmado');

-- SOLICITAÇÕES DE MATERIAIS
INSERT INTO solicitacoes_materiais (professor_id, material, quantidade, justificativa, data, status) VALUES
(1, 'Régua grande e compasso', 30, 'Aula de geometria - 8º ano', '2026-09-18', 'Aprovado'),
(2, 'Livro Dom Casmurro', 30, 'Leitura obrigatória - 9º ano', '2026-09-20', 'Pendente');

-- ============================================================
-- 5. USUÁRIOS DE LOGIN (serão criados pelo install.php com hash)
-- Mas vamos criar alguns básicos para teste imediato
-- ============================================================
-- Senha padrão: 123 (hash gerado por password_hash do PHP)
-- Como não temos PHP aqui, vamos inserir com hash pré-gerado

-- Hash de "123" gerado com: password_hash('123', PASSWORD_DEFAULT)
-- Hash valido para a senha padrao "123". O install.php gera um hash novo na instalacao.
INSERT INTO usuarios (email, senha, perfil, nome, ref_id, ativo) VALUES
('diretor@lavenir.com', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'diretor', 'Dra. Helena Mendes', NULL, 1),
('ricardoalves@lavenir.com', '$2y$10$9MsXmo9C6qs0lsrSoO0OO.l9ty3n5xSC3bJ42TIOwGXUcPIgRkT4K', 'coordenador', 'Dr. Ricardo Alves', NULL, 1),
('luciacoordenadora@lavenir.com', '$2y$10$9MsXmo9C6qs0lsrSoO0OO.l9ty3n5xSC3bJ42TIOwGXUcPIgRkT4K', 'coordenador', 'Lucia', NULL, 1),
('professor@lavenir.com', '$2y$10$9MsXmo9C6qs0lsrSoO0OO.l9ty3n5xSC3bJ42TIOwGXUcPIgRkT4K', 'professor', 'Professor L Avenir', (SELECT id FROM professores WHERE email = 'professor@lavenir.com' LIMIT 1), 1),
('carlos@lavenir.com', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'professor', 'Prof. Carlos Silva', 1, 1),
('mariana@lavenir.com', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'professor', 'Profa. Mariana Costa', 2, 1),
('robertolima@lavenir.com', '$2y$10$9MsXmo9C6qs0lsrSoO0OO.l9ty3n5xSC3bJ42TIOwGXUcPIgRkT4K', 'professor', 'Prof. Roberto Lima', 3, 1),
('anapaula@lavenir.com', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'professor', 'Profa. Ana Paula Souza', 4, 1),
('fernando@lavenir.com', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'professor', 'Prof. Fernando Alves', 5, 1),
('ana@aluno.lavenir', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'aluno', 'Ana Beatriz Costa', 1, 1),
('joao@aluno.lavenir', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'aluno', 'João Pedro Souza', 2, 1),
('maria@aluno.lavenir', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'aluno', 'Maria Silva Santos', 3, 1),
('pedro@aluno.lavenir', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'aluno', 'Pedro Lucas Oliveira', 4, 1),
('juliana@aluno.lavenir', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'aluno', 'Juliana Ferreira', 5, 1),
('lucas@aluno.lavenir', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'aluno', 'Lucas Martins', 6, 1),
('thiago@aluno.lavenir', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'aluno', 'Thiago Nunes', 11, 1),
('larissa@aluno.lavenir', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'aluno', 'Larissa Gomes', 14, 1),
('mae.ana@lavenir.com', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'responsavel', 'Maria Costa', 1, 1),
('pai.joao@lavenir.com', '$2y$10$3oZ3HotGgJbmSoqk0sLD6ONDZsLJgnn.X6enk/ipWC.rFk3N7zMki', 'responsavel', 'José Souza', 2, 1);

UPDATE usuarios SET senha = '$2y$10$9MsXmo9C6qs0lsrSoO0OO.l9ty3n5xSC3bJ42TIOwGXUcPIgRkT4K' WHERE perfil IN ('coordenador', 'professor');

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
