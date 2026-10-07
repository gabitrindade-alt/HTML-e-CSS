-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 07/10/2026 às 21:37
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `quimica_study`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `agenda_estudos`
--

CREATE TABLE `agenda_estudos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `tema` varchar(100) NOT NULL,
  `data_estudo` date NOT NULL,
  `hora_inicio` time NOT NULL DEFAULT '16:00:00',
  `duracao_minutos` smallint(6) NOT NULL DEFAULT 30,
  `observacoes` varchar(500) DEFAULT NULL,
  `concluido` tinyint(1) NOT NULL DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `conquistas`
--

CREATE TABLE `conquistas` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `icone` varchar(50) NOT NULL,
  `criterio` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `conquistas`
--

INSERT INTO `conquistas` (`id`, `nome`, `descricao`, `icone`, `criterio`) VALUES
(1, 'Primeiros Passos', 'Complete seu primeiro simulado.', '🎯', 'simulados >= 1'),
(2, 'Químico Iniciante', 'Acerte 80% ou mais em um simulado.', '🧪', 'porcentagem >= 80'),
(3, 'Mestre da Tabela', 'Estude o conteúdo de Tabela Periódica.', '⚛️', 'conteudo == Tabela'),
(4, 'Rajada de Conhecimento', 'Responda 10 questões corretamente.', '🔥', 'acertos >= 10');

-- --------------------------------------------------------

--
-- Estrutura para tabela `conteudos`
--

CREATE TABLE `conteudos` (
  `id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `resumo` text NOT NULL,
  `conteudo_completo` longtext NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `conteudos`
--

INSERT INTO `conteudos` (`id`, `titulo`, `resumo`, `conteudo_completo`, `categoria`, `criado_em`) VALUES
(1, 'Estrutura Atômica', 'Entenda as partículas subatômicas e os modelos atômicos.', '<h2>Modelos Atômicos</h2><p>O átomo é composto por prótons, nêutrons e elétrons. O modelo de Rutherford-Bohr descreve elétrons em órbitas definidas ao redor do núcleo.</p><h3>Número Atômico (Z)</h3><p>É o número de prótons no núcleo. Define o elemento químico.</p>', 'Geral', '2026-10-07 13:55:37'),
(2, 'Tabela Periódica', 'Organização dos elementos químicos e suas propriedades.', '<h2>A Tabela Periódica</h2><p>Organiza os elementos por número atômico crescente. Os períodos são as linhas horizontais e os grupos (ou famílias) são as colunas verticais.</p><p>Elementos do mesmo grupo possuem propriedades químicas semelhantes.</p>', 'Geral', '2026-10-07 13:55:37'),
(3, 'Ligações Químicas', 'Como os átomos se unem para formar moléculas.', '<h2>Tipos de Ligações</h2><ul><li><strong>Iônica:</strong> Transferência de elétrons (Metal + Ametal).</li><li><strong>Covalente:</strong> Compartilhamento de elétrons (Ametal + Ametal).</li><li><strong>Metálica:</strong> Mar de elétrons livres (Metal + Metal).</li></ul>', 'Geral', '2026-10-07 13:55:37'),
(4, 'Ácidos e Bases', 'Conceitos de Arrhenius, propriedades e pH.', '<h2>Teoria de Arrhenius</h2><p><strong>Ácidos:</strong> Substâncias que, em solução aquosa, liberam H⁺ como único cátion.</p><p><strong>Bases:</strong> Substâncias que, em solução aquosa, liberam OH⁻ como único ânion.</p><p>A escala de pH varia de 0 a 14, sendo 7 neutro.</p>', 'Inorgânica', '2026-10-07 13:55:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_simulados`
--

CREATE TABLE `historico_simulados` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `simulado_id` int(11) NOT NULL,
  `acertos` int(11) NOT NULL,
  `erros` int(11) NOT NULL,
  `total_questoes` int(11) NOT NULL,
  `porcentagem` decimal(5,2) NOT NULL,
  `pontuacao` int(11) NOT NULL,
  `realizado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `historico_simulados`
--

INSERT INTO `historico_simulados` (`id`, `usuario_id`, `simulado_id`, `acertos`, `erros`, `total_questoes`, `porcentagem`, `pontuacao`, `realizado_em`) VALUES
(1, 3, 2, 1, 0, 1, 100.00, 10, '2026-10-07 14:48:36'),
(2, 3, 1, 3, 2, 5, 60.00, 30, '2026-10-07 14:50:45');

-- --------------------------------------------------------

--
-- Estrutura para tabela `progresso`
--

CREATE TABLE `progresso` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `conteudo_id` int(11) NOT NULL,
  `porcentagem_concluida` decimal(5,2) DEFAULT 0.00,
  `ultima_atualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `progresso`
--

INSERT INTO `progresso` (`id`, `usuario_id`, `conteudo_id`, `porcentagem_concluida`, `ultima_atualizacao`) VALUES
(1, 2, 1, 100.00, '2026-10-07 13:55:38'),
(2, 2, 2, 50.00, '2026-10-07 13:55:38'),
(3, 3, 1, 50.00, '2026-10-07 19:16:41'),
(4, 3, 2, 25.00, '2026-10-07 18:52:48');

-- --------------------------------------------------------

--
-- Estrutura para tabela `questoes`
--

CREATE TABLE `questoes` (
  `id` int(11) NOT NULL,
  `conteudo_id` int(11) DEFAULT NULL,
  `tipo` enum('multipla','vf','dissertativa') DEFAULT 'multipla',
  `enunciado` text NOT NULL,
  `alt_a` varchar(255) DEFAULT NULL,
  `alt_b` varchar(255) DEFAULT NULL,
  `alt_c` varchar(255) DEFAULT NULL,
  `alt_d` varchar(255) DEFAULT NULL,
  `resposta_correta` text NOT NULL,
  `explicacao` text NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `questoes`
--

INSERT INTO `questoes` (`id`, `conteudo_id`, `tipo`, `enunciado`, `alt_a`, `alt_b`, `alt_c`, `alt_d`, `resposta_correta`, `explicacao`, `criado_em`) VALUES
(1, 1, 'multipla', 'Qual partícula subatômica possui carga elétrica positiva?', 'Elétron', 'Nêutron', 'Próton', 'Fóton', 'C', 'O próton está localizado no núcleo do átomo e possui carga relativa +1.', '2026-10-07 13:55:37'),
(2, 1, 'multipla', 'O número atômico (Z) representa a quantidade de:', 'Nêutrons', 'Prótons', 'Elétrons na eletrosfera', 'Núcleons', 'B', 'O número atômico define a identidade do elemento e é igual ao número de prótons.', '2026-10-07 13:55:37'),
(3, 2, 'multipla', 'Os elementos da coluna 17 (ou 7A) da Tabela Periódica são conhecidos como:', 'Metais Alcalinos', 'Gases Nobres', 'Halogênios', 'Metais de Transição', 'C', 'Os halogênios (Flúor, Cloro, Bromo, etc.) estão no grupo 17 e são altamente reativos.', '2026-10-07 13:55:37'),
(4, 3, 'multipla', 'Qual tipo de ligação química ocorre pelo compartilhamento de pares de elétrons?', 'Iônica', 'Metálica', 'Covalente', 'Intermolecular', 'C', 'A ligação covalente ocorre tipicamente entre ametais, que compartilham elétrons para atingir a estabilidade.', '2026-10-07 13:55:37'),
(5, 4, 'multipla', 'De acordo com Arrhenius, uma base em solução aquosa libera:', 'Íons H⁺', 'Íons OH⁻', 'Íons Na⁺', 'Elétrons livres', 'B', 'Bases de Arrhenius são compostos que se dissociam em água liberando o ânion hidroxila (OH⁻).', '2026-10-07 13:55:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `simulados`
--

CREATE TABLE `simulados` (
  `id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `conteudo_id` int(11) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `simulados`
--

INSERT INTO `simulados` (`id`, `titulo`, `descricao`, `conteudo_id`, `criado_em`) VALUES
(1, 'Simulado Geral de Química', 'Teste seus conhecimentos sobre os fundamentos da química.', NULL, '2026-10-07 13:55:38'),
(2, 'Desafio: Ácidos e Bases', 'Questões focadas exclusivamente em funções inorgânicas.', 4, '2026-10-07 13:55:38');

-- --------------------------------------------------------

--
-- Estrutura para tabela `simulado_questoes`
--

CREATE TABLE `simulado_questoes` (
  `id` int(11) NOT NULL,
  `simulado_id` int(11) NOT NULL,
  `questao_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `simulado_questoes`
--

INSERT INTO `simulado_questoes` (`id`, `simulado_id`, `questao_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 1, 4),
(5, 1, 5),
(6, 2, 5);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('aluno','admin') DEFAULT 'aluno',
  `pontos` int(11) DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `avatar_key` varchar(20) NOT NULL DEFAULT 'atom',
  `foto_perfil` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `tipo`, `pontos`, `criado_em`, `avatar_key`, `foto_perfil`) VALUES
(1, 'Administrador', 'admin@quimica.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'aluno', 0, '2026-10-07 13:55:37', 'atom', NULL),
(2, 'João Estudante', 'aluno@quimica.com', '$2y$10$zTzL4Wd6TC7GhOXHq6iV4OrP0yQGOrAUtvQgX6DwbNbsi9uQ6PNtq', 'aluno', 155, '2026-10-07 13:55:37', 'atom', NULL),
(3, 'Gaby Trindade', 'gaby@gmail.com', '$2y$10$vsYqW4eFkI.kX0tFFB5h/eh5mSV6ujpwZOc9HI9ApmLIDvt3IJlJa', 'aluno', 55, '2026-10-07 14:31:49', 'atom', NULL),
(4, 'Professor', 'professor@gmail.com', '$2y$10$zTzL4Wd6TC7GhOXHq6iV4OrP0yQGOrAUtvQgX6DwbNbsi9uQ6PNtq', 'admin', 0, '2026-10-07 14:39:08', 'atom', NULL),
(6, 'Isa Clara', 'isa@gmail.com', '$2y$10$GRRNU6F6jS7sWtJzlFX2Cuip7hx5tXXhQUuA1usGKVspQSR7b4aim', 'aluno', 0, '2026-10-07 16:38:36', 'atom', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_conquistas`
--

CREATE TABLE `usuario_conquistas` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `conquista_id` int(11) NOT NULL,
  `desbloqueado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `agenda_estudos`
--
ALTER TABLE `agenda_estudos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agenda_usuario_data` (`usuario_id`,`data_estudo`);

--
-- Índices de tabela `conquistas`
--
ALTER TABLE `conquistas`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `conteudos`
--
ALTER TABLE `conteudos`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `historico_simulados`
--
ALTER TABLE `historico_simulados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `simulado_id` (`simulado_id`);

--
-- Índices de tabela `progresso`
--
ALTER TABLE `progresso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_usuario_conteudo` (`usuario_id`,`conteudo_id`),
  ADD KEY `conteudo_id` (`conteudo_id`);

--
-- Índices de tabela `questoes`
--
ALTER TABLE `questoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conteudo_id` (`conteudo_id`);

--
-- Índices de tabela `simulados`
--
ALTER TABLE `simulados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conteudo_id` (`conteudo_id`);

--
-- Índices de tabela `simulado_questoes`
--
ALTER TABLE `simulado_questoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `simulado_id` (`simulado_id`),
  ADD KEY `questao_id` (`questao_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices de tabela `usuario_conquistas`
--
ALTER TABLE `usuario_conquistas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_usuario_conquista` (`usuario_id`,`conquista_id`),
  ADD KEY `conquista_id` (`conquista_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `agenda_estudos`
--
ALTER TABLE `agenda_estudos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `conquistas`
--
ALTER TABLE `conquistas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `conteudos`
--
ALTER TABLE `conteudos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `historico_simulados`
--
ALTER TABLE `historico_simulados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `progresso`
--
ALTER TABLE `progresso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `questoes`
--
ALTER TABLE `questoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `simulados`
--
ALTER TABLE `simulados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `simulado_questoes`
--
ALTER TABLE `simulado_questoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `usuario_conquistas`
--
ALTER TABLE `usuario_conquistas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `agenda_estudos`
--
ALTER TABLE `agenda_estudos`
  ADD CONSTRAINT `fk_agenda_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `historico_simulados`
--
ALTER TABLE `historico_simulados`
  ADD CONSTRAINT `historico_simulados_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `historico_simulados_ibfk_2` FOREIGN KEY (`simulado_id`) REFERENCES `simulados` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `progresso`
--
ALTER TABLE `progresso`
  ADD CONSTRAINT `progresso_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `progresso_ibfk_2` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `questoes`
--
ALTER TABLE `questoes`
  ADD CONSTRAINT `questoes_ibfk_1` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudos` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `simulados`
--
ALTER TABLE `simulados`
  ADD CONSTRAINT `simulados_ibfk_1` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudos` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `simulado_questoes`
--
ALTER TABLE `simulado_questoes`
  ADD CONSTRAINT `simulado_questoes_ibfk_1` FOREIGN KEY (`simulado_id`) REFERENCES `simulados` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `simulado_questoes_ibfk_2` FOREIGN KEY (`questao_id`) REFERENCES `questoes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuario_conquistas`
--
ALTER TABLE `usuario_conquistas`
  ADD CONSTRAINT `usuario_conquistas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuario_conquistas_ibfk_2` FOREIGN KEY (`conquista_id`) REFERENCES `conquistas` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
