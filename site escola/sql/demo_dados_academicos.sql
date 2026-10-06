-- Dados academicos demonstrativos para alunos ativos.
-- Seguro para reexecutar: nao altera notas nem frequencias ja existentes.
START TRANSACTION;
SET @professor_demo_id := (SELECT id FROM professores WHERE email='professor@lavenir.com' LIMIT 1);

INSERT INTO notas (aluno_id, disciplina, valor, bimestre, observacao, data, professor_id)
SELECT a.id, d.disciplina,
       ROUND(6.0 + MOD(a.id * 7 + d.ordem * 3 + b.bimestre * 2, 41) / 10, 1),
       b.bimestre, 'Dado de demonstração',
       DATE_ADD('2026-03-01', INTERVAL (b.bimestre - 1) * 3 MONTH),
       @professor_demo_id
FROM alunos a
JOIN cursos c ON c.id = a.curso_id
CROSS JOIN (SELECT 1 bimestre UNION ALL SELECT 2 UNION ALL SELECT 3) b
JOIN (
    SELECT 1 ordem, 'Português' disciplina UNION ALL
    SELECT 2, 'Matemática' UNION ALL
    SELECT 3, 'Ciências' UNION ALL
    SELECT 4, 'História' UNION ALL
    SELECT 5, 'Geografia' UNION ALL
    SELECT 6, 'Artes' UNION ALL
    SELECT 7, 'Ed. Física' UNION ALL
    SELECT 8, 'Inglês' UNION ALL
    SELECT 9, 'Filosofia' UNION ALL
    SELECT 10, 'Física' UNION ALL
    SELECT 11, 'Química' UNION ALL
    SELECT 12, 'Biologia' UNION ALL
    SELECT 13, 'Sociologia'
) d ON (c.nome = 'Ensino Fundamental II' AND d.ordem <= 9)
      OR (c.nome = 'Ensino Médio' AND d.ordem IN (1,2,6,5,4,10,11,12,7,8,9,13))
WHERE a.situacao = 'Ativo'
  AND NOT EXISTS (
      SELECT 1 FROM notas n
      WHERE n.aluno_id = a.id AND n.disciplina = d.disciplina AND n.bimestre = b.bimestre
  );

INSERT INTO frequencia (aluno_id, data, presente, justificativa, observacao, professor_id)
SELECT a.id, DATE_ADD('2026-09-01', INTERVAL d.dia - 1 DAY),
       IF(MOD(a.id + d.dia, 9) = 0, 0, 1),
       IF(MOD(a.id + d.dia, 9) = 0, 'Justificativa de demonstração', ''),
       'Dado de demonstração', @professor_demo_id
FROM alunos a
CROSS JOIN (
    SELECT 1 dia UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
    UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
    UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
    UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
    UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25
    UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
) d
WHERE a.situacao = 'Ativo'
  AND DAYOFWEEK(DATE_ADD('2026-09-01', INTERVAL d.dia - 1 DAY)) NOT IN (1, 7)
  AND NOT EXISTS (
      SELECT 1 FROM frequencia f
      WHERE f.aluno_id = a.id AND f.data = DATE_ADD('2026-09-01', INTERVAL d.dia - 1 DAY)
  );
COMMIT;
