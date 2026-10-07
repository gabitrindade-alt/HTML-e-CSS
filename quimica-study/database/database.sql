CREATE DATABASE IF NOT EXISTS quimica_study CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quimica_study;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('aluno', 'admin') DEFAULT 'aluno',
    pontos INT DEFAULT 0,
    avatar_key VARCHAR(20) NOT NULL DEFAULT 'atom',
    foto_perfil VARCHAR(255) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conteudos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    resumo TEXT NOT NULL,
    conteudo_completo LONGTEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conteudo_id INT,
    tipo ENUM('multipla', 'vf', 'dissertativa') DEFAULT 'multipla',
    enunciado TEXT NOT NULL,
    alt_a VARCHAR(255),
    alt_b VARCHAR(255),
    alt_c VARCHAR(255),
    alt_d VARCHAR(255),
    resposta_correta TEXT NOT NULL,
    explicacao TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conteudo_id) REFERENCES conteudos(id) ON DELETE SET NULL
);

CREATE TABLE simulados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    conteudo_id INT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conteudo_id) REFERENCES conteudos(id) ON DELETE SET NULL
);

CREATE TABLE simulado_questoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    simulado_id INT NOT NULL,
    questao_id INT NOT NULL,
    FOREIGN KEY (simulado_id) REFERENCES simulados(id) ON DELETE CASCADE,
    FOREIGN KEY (questao_id) REFERENCES questoes(id) ON DELETE CASCADE
);

CREATE TABLE historico_simulados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    simulado_id INT NOT NULL,
    acertos INT NOT NULL,
    erros INT NOT NULL,
    total_questoes INT NOT NULL,
    porcentagem DECIMAL(5,2) NOT NULL,
    pontuacao INT NOT NULL,
    realizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (simulado_id) REFERENCES simulados(id) ON DELETE CASCADE
);

CREATE TABLE progresso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    conteudo_id INT NOT NULL,
    porcentagem_concluida DECIMAL(5,2) DEFAULT 0.00,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (conteudo_id) REFERENCES conteudos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_conteudo (usuario_id, conteudo_id)
);

CREATE TABLE conquistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    icone VARCHAR(50) NOT NULL,
    criterio VARCHAR(100) NOT NULL
);

CREATE TABLE usuario_conquistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    conquista_id INT NOT NULL,
    desbloqueado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (conquista_id) REFERENCES conquistas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_conquista (usuario_id, conquista_id)
);

-- DADOS DE TESTE
-- Senha padrão: 123456 (hash gerado por password_hash)
INSERT INTO usuarios (nome, email, senha, tipo, pontos) VALUES
('Professor', 'professor@gmail.com', '$2y$10$zTzL4Wd6TC7GhOXHq6iV4OrP0yQGOrAUtvQgX6DwbNbsi9uQ6PNtq', 'admin', 0),
('João Estudante', 'aluno@quimica.com', '$2y$10$zTzL4Wd6TC7GhOXHq6iV4OrP0yQGOrAUtvQgX6DwbNbsi9uQ6PNtq', 'aluno', 150);

INSERT INTO conteudos (titulo, resumo, conteudo_completo, categoria) VALUES
('Estrutura Atômica', 'Entenda as partículas subatômicas e os modelos atômicos.', '<h2>Modelos Atômicos</h2><p>O átomo é composto por prótons, nêutrons e elétrons. O modelo de Rutherford-Bohr descreve elétrons em órbitas definidas ao redor do núcleo.</p><h3>Número Atômico (Z)</h3><p>É o número de prótons no núcleo. Define o elemento químico.</p>', 'Geral'),
('Tabela Periódica', 'Organização dos elementos químicos e suas propriedades.', '<h2>A Tabela Periódica</h2><p>Organiza os elementos por número atômico crescente. Os períodos são as linhas horizontais e os grupos (ou famílias) são as colunas verticais.</p><p>Elementos do mesmo grupo possuem propriedades químicas semelhantes.</p>', 'Geral'),
('Ligações Químicas', 'Como os átomos se unem para formar moléculas.', '<h2>Tipos de Ligações</h2><ul><li><strong>Iônica:</strong> Transferência de elétrons (Metal + Ametal).</li><li><strong>Covalente:</strong> Compartilhamento de elétrons (Ametal + Ametal).</li><li><strong>Metálica:</strong> Mar de elétrons livres (Metal + Metal).</li></ul>', 'Geral'),
('Ácidos e Bases', 'Conceitos de Arrhenius, propriedades e pH.', '<h2>Teoria de Arrhenius</h2><p><strong>Ácidos:</strong> Substâncias que, em solução aquosa, liberam H⁺ como único cátion.</p><p><strong>Bases:</strong> Substâncias que, em solução aquosa, liberam OH⁻ como único ânion.</p><p>A escala de pH varia de 0 a 14, sendo 7 neutro.</p>', 'Inorgânica');

INSERT INTO questoes (conteudo_id, tipo, enunciado, alt_a, alt_b, alt_c, alt_d, resposta_correta, explicacao) VALUES
(1, 'multipla', 'Qual partícula subatômica possui carga elétrica positiva?', 'Elétron', 'Nêutron', 'Próton', 'Fóton', 'C', 'O próton está localizado no núcleo do átomo e possui carga relativa +1.'),
(1, 'multipla', 'O número atômico (Z) representa a quantidade de:', 'Nêutrons', 'Prótons', 'Elétrons na eletrosfera', 'Núcleons', 'B', 'O número atômico define a identidade do elemento e é igual ao número de prótons.'),
(2, 'multipla', 'Os elementos da coluna 17 (ou 7A) da Tabela Periódica são conhecidos como:', 'Metais Alcalinos', 'Gases Nobres', 'Halogênios', 'Metais de Transição', 'C', 'Os halogênios (Flúor, Cloro, Bromo, etc.) estão no grupo 17 e são altamente reativos.'),
(3, 'multipla', 'Qual tipo de ligação química ocorre pelo compartilhamento de pares de elétrons?', 'Iônica', 'Metálica', 'Covalente', 'Intermolecular', 'C', 'A ligação covalente ocorre tipicamente entre ametais, que compartilham elétrons para atingir a estabilidade.'),
(4, 'multipla', 'De acordo com Arrhenius, uma base em solução aquosa libera:', 'Íons H⁺', 'Íons OH⁻', 'Íons Na⁺', 'Elétrons livres', 'B', 'Bases de Arrhenius são compostos que se dissociam em água liberando o ânion hidroxila (OH⁻).');

INSERT INTO simulados (titulo, descricao, conteudo_id) VALUES
('Simulado Geral de Química', 'Teste seus conhecimentos sobre os fundamentos da química.', NULL),
('Desafio: Ácidos e Bases', 'Questões focadas exclusivamente em funções inorgânicas.', 4);

INSERT INTO simulado_questoes (simulado_id, questao_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 5);

INSERT INTO conquistas (nome, descricao, icone, criterio) VALUES
('Primeiros Passos', 'Complete seu primeiro simulado.', '🎯', 'simulados >= 1'),
('Químico Iniciante', 'Acerte 80% ou mais em um simulado.', '🧪', 'porcentagem >= 80'),
('Mestre da Tabela', 'Estude o conteúdo de Tabela Periódica.', '⚛️', 'conteudo == Tabela'),
('Rajada de Conhecimento', 'Responda 10 questões corretamente.', '🔥', 'acertos >= 10');

INSERT INTO progresso (usuario_id, conteudo_id, porcentagem_concluida) VALUES
(2, 1, 100.00),
(2, 2, 50.00);
