# Química Study — instalação no XAMPP

1. Coloque a pasta `quimica-study` em `C:\xampp1\htdocs\`.
2. Abra o XAMPP Control Panel e inicie **Apache** e **MySQL**.
3. Acesse `http://localhost/phpmyadmin`, crie/importa o banco usando `database/database.sql` (o script cria `quimica_study`).
4. Acesse `http://localhost/quimica-study/`.

## Acessos de demonstração

- Professor (administrador): `professor@gmail.com` — senha inicial `123456`
- Aluno: `aluno@quimica.com` — senha `123456`

O cadastro público cria contas de aluno. Para habilitar o acesso inicial do professor em uma instalação existente, importe `database/provisionar-professor.sql` pelo phpMyAdmin. Essa migração também retira o perfil administrativo da conta antiga `admin@quimica.com`.

O professor pode abrir a área administrativa com **Ctrl+A** em qualquer página. O atalho leva ao painel após o login; somente contas com perfil de administrador podem acessar as ferramentas de cadastro de conteúdos, questões e simulados.
