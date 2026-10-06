const MENUS = {
    diretor: ['inicio','alunos','professores','turmas','cursos','usuarios','comunicados','ocorrencias','pagamentos','eventos','materiais','relatorios','mensagens'],
    coordenador: ['inicio','alunos','professores','turmas','comunicados','ocorrencias','eventos','materiais','acompanhamento','relatorios','mensagens'],
    professor: ['inicio','calendario','minha-sala','alunos-turma','diario','frequencia','notas','atividades','ocorrencias','comunicados','materiais','mensagens'],
    aluno: ['inicio','perfil','notas','frequencia','atividades','diario','comunicados','ocorrencias','calendario','mensagens'],
    responsavel: ['inicio','dados-aluno','notas','frequencia','atividades','comunicados','ocorrencias','eventos','mensagens','pagamentos']
};

const LABELS = {
    inicio:'Início', alunos:'Alunos', professores:'Professores', turmas:'Turmas',
    cursos:'Cursos', usuarios:'Usuários', comunicados:'Comunicados',
    ocorrencias:'Ocorrências', relatorios:'Relatórios', 'minha-sala':'Minha Sala',
    'alunos-turma':'Alunos da Turma', diario:'Diário de Classe',
    frequencia:'Frequência', notas:'Notas', atividades:'Atividades',
    perfil:'Meu Perfil', calendario:'Calendário', mensagens:'Mensagens',
    'dados-aluno':'Dados do Aluno', acompanhamento:'Acompanhamento',
    pagamentos:'Pagamentos', eventos:'Calendário', materiais:'Materiais'
};

const ICONS = {
    inicio:'fa-home', alunos:'fa-user-graduate', professores:'fa-chalkboard-teacher',
    turmas:'fa-users', cursos:'fa-book', usuarios:'fa-user-shield',
    comunicados:'fa-bullhorn', ocorrencias:'fa-exclamation-triangle', relatorios:'fa-chart-bar',
    'minha-sala':'fa-chalkboard', 'alunos-turma':'fa-user-friends', diario:'fa-book-open',
    frequencia:'fa-calendar-check', notas:'fa-star', atividades:'fa-tasks',
    perfil:'fa-id-card', calendario:'fa-calendar', mensagens:'fa-envelope',
    'dados-aluno':'fa-id-card', acompanhamento:'fa-chart-line',
    pagamentos:'fa-money-bill-wave', eventos:'fa-calendar-alt', materiais:'fa-box-open'
};

let currentSection = 'inicio';

function navigate(section) {
    currentSection = section;
    document.getElementById('pageTitle').textContent = LABELS[section] || section;
    document.querySelectorAll('.sidebar-item').forEach(b => {
        b.classList.toggle('active', b.dataset.section === section);
    });
    renderSection();
}

async function renderSection() {
    const container = document.getElementById('sectionContent');
    const configuredRenderer = SECTION_RENDERERS[currentUser.perfil]?.[currentSection];
    const professorCalendarAlias = currentUser.perfil === 'professor' && ['calendario', 'eventos'].includes(currentSection);
    const fn = configuredRenderer || (professorCalendarAlias && typeof renderCalendario === 'function' ? renderCalendario : null);
    if (fn) {
        container.innerHTML = await fn();
    } else {
        container.innerHTML = '<p>Seção em desenvolvimento.</p>';
    }
}
