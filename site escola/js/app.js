function appHtmlSafe(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
}

let professorRosterClass = '';
async function renderProfessorAlunos() {
    const [turmasRes, alunosRes] = await Promise.all([API.get('turmas.list'), API.get('alunos.list')]);
    if (!turmasRes.ok || !alunosRes.ok) return '<div class="card">N&atilde;o foi poss&iacute;vel carregar a lista de alunos. Tente novamente.</div>';
    const turmas = turmasRes.data || [];
    const turmaId = String(turmas.some(t => String(t.id) === professorRosterClass) ? professorRosterClass : (turmas[0]?.id ?? ''));
    professorRosterClass = turmaId;
    const alunos = (alunosRes.data || []).filter(a => String(a.turma_id) === turmaId && a.situacao === 'Ativo');
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Alunos da turma</h2>
        <div class="form-group" style="max-width:28rem"><label class="form-label" for="professorRosterClass">Turma</label>
            <select id="professorRosterClass" class="form-select" onchange="professorRosterClass=this.value;renderSection()">${turmas.map(t => `<option value="${t.id}" ${String(t.id) === turmaId ? 'selected' : ''}>${appHtmlSafe(t.nome)}</option>`).join('')}</select>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Matr&iacute;cula</th><th>Nome</th><th>E-mail escolar</th><th>Curso</th></tr></thead><tbody>
            ${alunos.length ? alunos.map(a => `<tr><td>${appHtmlSafe(a.matricula || '—')}</td><td class="font-medium">${appHtmlSafe(a.nome)}</td><td>${appHtmlSafe(a.email || '—')}</td><td>${appHtmlSafe(a.curso_nome || '—')}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum aluno ativo nesta turma.</td></tr>'}
        </tbody></table></div>
    `;
}

const SECTION_RENDERERS = {
    diretor: {
        inicio: async () => {
            const [alunos, profs, turmas, pags] = await Promise.all([
                API.get('alunos.list'), API.get('professores.list'),
                API.get('turmas.list'), API.get('pagamentos.list')
            ]);
            const pendentes = (pags.ok ? pags.data : []).filter(p => p.status === 'Pendente').length;
            return `
                <div class="mb-6">
                    <h2 class="font-serif text-2xl font-bold text-navy">Olá, ${currentUser.nome.split(' ')[0]}! 👋</h2>
                    <p class="text-sm" style="color:#6b7280;">Painel administrativo e gestão escolar.</p>
                </div>
                <div class="grid grid-4 mb-6">
                    ${statCard('Alunos', alunos.ok ? alunos.data.length : 0, 'fa-user-graduate', {bg:'#dbeafe',text:'#1d4ed8'})}
                    ${statCard('Professores', profs.ok ? profs.data.length : 0, 'fa-chalkboard-teacher', {bg:'#f3e8ff',text:'#7e22ce'})}
                    ${statCard('Turmas', turmas.ok ? turmas.data.length : 0, 'fa-users', {bg:'#fef9c3',text:'#a16207'})}
                    ${statCard('Pendências Pgto', pendentes, 'fa-money-bill-wave', {bg:'#fee2e2',text:'#b91c1c'})}
                </div>
                <h3 class="font-serif text-xl font-bold text-navy mb-4">Acesso rápido</h3>
                <div class="grid grid-3">
                    <button class="card" style="text-align:left;cursor:pointer;" onclick="navigate('usuarios')">
                        <i class="fas fa-user-shield text-2xl text-navy mb-2"></i>
                        <p class="font-bold text-navy">Contas e acessos</p>
                        <p class="text-sm" style="color:#6b7280;">Gerencie usuários e perfis.</p>
                    </button>
                    <button class="card" style="text-align:left;cursor:pointer;" onclick="navigate('alunos')">
                        <i class="fas fa-user-graduate text-2xl text-navy mb-2"></i>
                        <p class="font-bold text-navy">Alunos</p>
                        <p class="text-sm" style="color:#6b7280;">Consulte e atualize os cadastros.</p>
                    </button>
                    <button class="card" style="text-align:left;cursor:pointer;" onclick="navigate('relatorios')">
                        <i class="fas fa-chart-bar text-2xl text-navy mb-2"></i>
                        <p class="font-bold text-navy">Relatórios</p>
                        <p class="text-sm" style="color:#6b7280;">Acompanhe os indicadores da escola.</p>
                    </button>
                </div>
            `;
        },
        alunos: () => renderCRUDList('alunos'),
        professores: () => renderCRUDList('professores'),
        turmas: () => renderCRUDList('turmas'),
        cursos: () => renderCRUDList('cursos'),
        usuarios: () => renderCRUDList('usuarios'),
        comunicados: () => renderCRUDList('comunicados'),
        ocorrencias: () => renderCRUDList('ocorrencias'),
        pagamentos: () => renderPagamentosDiretor(),
        eventos: () => renderEventos(),
        materiais: () => renderMateriaisDiretor(),
        relatorios: () => renderRelatorios(),
        mensagens: () => renderMensagens()
    },
    coordenador: {
        inicio: async () => {
            const [alunos, profs, turmas] = await Promise.all([
                API.get('alunos.list'), API.get('professores.list'), API.get('turmas.list')
            ]);
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Painel Pedagógico</h2>
                <div class="grid grid-4 mb-6">
                    ${statCard('Alunos', alunos.ok ? alunos.data.length : 0, 'fa-user-graduate', {bg:'#dbeafe',text:'#1d4ed8'})}
                    ${statCard('Professores', profs.ok ? profs.data.length : 0, 'fa-chalkboard-teacher', {bg:'#f3e8ff',text:'#7e22ce'})}
                    ${statCard('Turmas', turmas.ok ? turmas.data.length : 0, 'fa-users', {bg:'#fef9c3',text:'#a16207'})}
                </div>
                <button class="btn btn-navy" onclick="navigate('acompanhamento')"><i class="fas fa-chart-line"></i> Ver Acompanhamento</button>
            `;
        },
        alunos: () => renderCRUDList('alunos'),
        professores: () => renderCRUDList('professores'),
        turmas: () => renderCRUDList('turmas'),
        comunicados: () => renderCRUDList('comunicados'),
        ocorrencias: () => renderCRUDList('ocorrencias'),
        eventos: () => renderEventos(),
        materiais: () => renderMateriaisDiretor(),
        acompanhamento: () => renderAcompanhamento(),
        relatorios: () => renderRelatorios(),
        mensagens: () => renderMensagens()
    },
    professor: {
        inicio: async () => {
            const [turmas, atividades] = await Promise.all([
                API.get('turmas.list'), API.get('atividades.list')
            ]);
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Olá, ${currentUser.nome.split(' ').slice(-1)[0]}! 👋</h2>
                <div class="grid grid-4 mb-6">
                    ${statCard('Turmas', turmas.ok ? turmas.data.length : 0, 'fa-users', {bg:'#dbeafe',text:'#1d4ed8'})}
                    ${statCard('Atividades', atividades.ok ? atividades.data.length : 0, 'fa-tasks', {bg:'#fef9c3',text:'#a16207'})}
                </div>
                <button class="btn btn-gold" onclick="navigate('minha-sala')"><i class="fas fa-chalkboard"></i> Minha Sala</button>
            `;
        },
        'minha-sala': async () => {
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Minha Sala</h2>
                <div class="grid grid-4">
                    <button class="card" onclick="navigate('frequencia')" style="cursor:pointer;text-align:left;">
                        <i class="fas fa-calendar-check text-2xl text-navy mb-2"></i>
                        <p class="font-bold">Frequência</p>
                    </button>
                    <button class="card" onclick="navigate('notas')" style="cursor:pointer;text-align:left;">
                        <i class="fas fa-star text-2xl text-gold mb-2"></i>
                        <p class="font-bold">Notas</p>
                    </button>
                    <button class="card" onclick="navigate('atividades')" style="cursor:pointer;text-align:left;">
                        <i class="fas fa-tasks text-2xl" style="color:#1d4ed8;"></i>
                        <p class="font-bold">Atividades</p>
                    </button>
                    <button class="card" onclick="navigate('diario')" style="cursor:pointer;text-align:left;">
                        <i class="fas fa-book-open text-2xl" style="color:#15803d;"></i>
                        <p class="font-bold">Diário</p>
                    </button>
                </div>
            `;
        },
        calendario: () => renderCalendario(),
        'alunos-turma': () => renderProfessorAlunos(),
        diario: () => renderCRUDList('diario'),
        frequencia: () => renderProfessorFrequencia(),
        notas: () => renderProfessorNotas(),
        atividades: () => renderCRUDList('atividades'),
        ocorrencias: () => renderCRUDList('ocorrencias'),
        comunicados: async () => {
            const res = await API.get('comunicados.list');
            const lista = res.ok ? res.data : [];
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Comunicados</h2>
                ${lista.length ? lista.map(c => `
                    <div class="card mb-2" style="border-left:4px solid var(--gold);">
                        <h4 class="font-bold text-navy">${c.titulo}</h4>
                        <p class="text-xs" style="color:#9ca3af;">${c.data} • ${c.destino}</p>
                        <p class="text-sm mt-2">${c.conteudo}</p>
                    </div>
                `).join('') : '<p>Nenhum comunicado.</p>'}
            `;
        },
        materiais: () => renderMateriaisProfessor(),
        mensagens: () => renderMensagens()
    },
    aluno: {
        inicio: async () => {
            const [notasRes, freqRes, sitRes] = await Promise.all([
                API.get('notas.list'), API.get('frequencia.list'), API.get('notas.situacao', { aluno_id: currentUser.ref_id })
            ]);
            const notas = notasRes.ok ? notasRes.data : [];
            const freq = freqRes.ok ? freqRes.data : [];
            const sit = sitRes.ok ? sitRes.data : { status:'OK', cor:'green', msg:'Situação regular' };
            const media = notas.length ? (notas.reduce((s,n)=>s+parseFloat(n.valor),0)/notas.length).toFixed(1) : '-';
            const pctFreq = freq.length ? Math.round((freq.filter(f=>f.presente==1).length/freq.length)*100) : 0;

            return `
                <div style="background:var(--navy);color:white;padding:2rem;border-radius:1rem;margin-bottom:1.5rem;">
                    <h2 class="font-serif text-2xl font-bold mb-2">Olá, ${currentUser.nome.split(' ')[0]}! 👋</h2>
                    <p style="color:#d1d5db;">${badgeSituacao(sit)}</p>
                </div>
                ${sit.status !== 'OK' ? `
                <div class="card mb-4" style="border-left:4px solid ${sit.cor==='red'?'#ef4444':'#f59e0b'};">
                    <p class="font-bold text-navy">Situação: ${sit.status}</p>
                    <p class="text-sm" style="color:#6b7280;">${sit.msg}</p>
                </div>` : ''}
                <div class="grid grid-4 mb-6">
                    ${statCard('Média', media, 'fa-star', {bg:'#fef9c3',text:'#a16207'})}
                    ${statCard('Frequência', pctFreq+'%', 'fa-calendar-check', {bg:'#dcfce7',text:'#15803d'})}
                    ${statCard('Faltas', sit.faltas || 0, 'fa-times-circle', {bg:'#fee2e2',text:'#b91c1c'})}
                </div>
            `;
        },
        perfil: async () => {
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Meu Perfil</h2>
                <div class="card">
                    <p><strong>Nome:</strong> ${currentUser.nome}</p>
                    <p><strong>E-mail:</strong> ${currentUser.email}</p>
                    <p><strong>Perfil:</strong> ${currentUser.perfil}</p>
                    <button class="btn btn-navy mt-4" onclick="abrirTrocaSenha()"><i class="fas fa-key"></i> Alterar Senha</button>
                </div>
            `;
        },
        notas: () => renderNotasAluno(),
        frequencia: () => renderFrequenciaAluno(),
        atividades: async () => {
            const res = await API.get('atividades.list');
            const lista = res.ok ? res.data : [];
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Atividades</h2>
                <div class="grid grid-2">
                    ${lista.length ? lista.map(a => `
                        <div class="card">
                            <span class="badge badge-navy">${a.disciplina || 'Geral'}</span>
                            <h4 class="font-bold text-navy mt-2">${a.titulo}</h4>
                            <p class="text-sm" style="color:#6b7280;">${a.descricao || ''}</p>
                            <p class="text-xs mt-2"><i class="far fa-clock"></i> Prazo: ${a.prazo}</p>
                        </div>
                    `).join('') : '<p>Nenhuma atividade.</p>'}
                </div>
            `;
        },
        diario: async () => {
            const res = await API.get('diario.list');
            const lista = res.ok ? res.data : [];
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Diário de Classe</h2>
                ${lista.length ? lista.map(d => `
                    <div class="card mb-2">
                        <div class="flex justify-between">
                            <span class="badge badge-navy">${d.disciplina}</span>
                            <span class="text-xs" style="color:#9ca3af;">${d.data}</span>
                        </div>
                        <h4 class="font-bold text-navy mt-2">${d.conteudo}</h4>
                        ${d.resumo ? `<p class="text-sm mt-1"><strong>Resumo:</strong> ${d.resumo}</p>` : ''}
                        ${d.observacoes ? `<p class="text-sm mt-1 italic">${d.observacoes}</p>` : ''}
                    </div>
                `).join('') : '<p>Nenhum registro.</p>'}
            `;
        },
        comunicados: async () => {
            const res = await API.get('comunicados.list');
            const lista = res.ok ? res.data : [];
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Comunicados</h2>
                ${lista.length ? lista.map(c => `
                    <div class="card mb-2" style="border-left:4px solid var(--gold);">
                        <h4 class="font-bold text-navy">${c.titulo}</h4>
                        <p class="text-xs" style="color:#9ca3af;">${c.data} • ${c.destino}</p>
                        <p class="text-sm mt-2">${c.conteudo}</p>
                    </div>
                `).join('') : '<p>Nenhum comunicado.</p>'}
            `;
        },
        ocorrencias: async () => {
            const res = await API.get('ocorrencias.list');
            const lista = (res.ok ? res.data : []).filter(o => Number(o.aluno_id) === Number(currentUser.ref_id));
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Minhas Ocorrências</h2>
                ${lista.length ? lista.map(o => `
                    <div class="card mb-2">
                        <span class="badge ${o.tipo==='Elogio'?'badge-green':'badge-red'}">${o.tipo}</span>
                        <span class="text-xs" style="color:#9ca3af;margin-left:8px;">${o.data}</span>
                        <p class="text-sm mt-2">${o.descricao}</p>
                        ${o.observacoes ? `<p class="text-sm italic mt-1">${o.observacoes}</p>` : ''}
                    </div>
                `).join('') : '<p>Nenhuma ocorrência.</p>'}
            `;
        },
        calendario: () => renderCalendario(),
        mensagens: () => renderMensagens()
    },
    responsavel: {
        inicio: async () => {
            const [notasRes, pagsRes, alunosRes] = await Promise.all([
                API.get('notas.list'), API.get('pagamentos.list'), API.get('alunos.list')
            ]);
            const alunoVinculado = alunosRes.ok ? alunosRes.data[0] : null;
            const sitRes = alunoVinculado ? await API.get('notas.situacao', { aluno_id: alunoVinculado.id }) : { ok: false };
            const notas = notasRes.ok ? notasRes.data : [];
            const sit = sitRes.ok ? sitRes.data : { status:'OK', cor:'green', msg:'Situação regular' };
            const pags = pagsRes.ok ? pagsRes.data : [];
            const pend = pags.filter(p => p.status === 'Pendente');
            const media = notas.length ? (notas.reduce((s,n)=>s+parseFloat(n.valor),0)/notas.length).toFixed(1) : '-';

            return `
                <div style="background:var(--navy);color:white;padding:2rem;border-radius:1rem;margin-bottom:1.5rem;">
                    <h2 class="font-serif text-2xl font-bold mb-2">Olá, ${currentUser.nome.split(' ')[0]}! 👋</h2>
                    <p style="color:#d1d5db;">${badgeSituacao(sit)}</p>
                </div>
                ${pend.length ? `<div class="card mb-4" style="background:#fef2f2;border:1px solid #fecaca;"><p style="color:#b91c1c;"><strong>${pend.length} pendência(s) de pagamento</strong></p></div>` : ''}
                <div class="grid grid-4 mb-6">
                    ${statCard('Média', media, 'fa-star', {bg:'#fef9c3',text:'#a16207'})}
                    ${statCard('Faltas', sit.faltas || 0, 'fa-times-circle', {bg:'#fee2e2',text:'#b91c1c'})}
                </div>
            `;
        },
        'dados-aluno': async () => {
            const res = await API.get('alunos.list');
            const aluno = res.ok && Array.isArray(res.data) ? res.data[0] : null;
            if (!aluno) {
                return `
                    <h2 class="font-serif text-2xl font-bold text-navy mb-4">Dados do Aluno</h2>
                    <div class="card student-empty-state"><i class="fas fa-info-circle"></i><p>Não há um aluno vinculado a esta conta. Entre em contato com a secretaria para conferir o cadastro do responsável.</p></div>
                `;
            }
            const safe = appHtmlSafe;
            const ativo = aluno.situacao === 'Ativo';
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Dados do Aluno</h2>
                <section class="student-profile-card">
                    <header class="student-profile-heading">
                        <div class="student-profile-monogram"><i class="fas fa-user-graduate"></i></div>
                        <div>
                            <p class="student-profile-eyebrow">Estudante vinculado à sua conta</p>
                            <h3>${safe(aluno.nome)}</h3>
                            <span class="badge ${ativo ? 'badge-green' : 'badge-gray'}">${safe(aluno.situacao || 'Situação não informada')}</span>
                        </div>
                    </header>
                    <div class="student-profile-details">
                        <div class="student-detail"><span>Matrícula</span><strong>${safe(aluno.matricula || '—')}</strong></div>
                        <div class="student-detail"><span>Turma</span><strong>${safe(aluno.turma_nome || 'Não informada')}</strong></div>
                        <div class="student-detail"><span>Curso</span><strong>${safe(aluno.curso_nome || 'Não informado')}</strong></div>
                        <div class="student-detail"><span>E-mail escolar</span><strong>${safe(aluno.email || '—')}</strong></div>
                    </div>
                    <footer class="student-profile-footer"><i class="fas fa-link"></i> Responsável cadastrado: ${safe(currentUser.nome)}</footer>
                </section>
                <p class="student-profile-note">As notas, a frequência e as atividades deste portal correspondem a este aluno.</p>
            `;
        },
        notas: () => renderNotasAluno(),
        frequencia: () => renderFrequenciaAluno(),
        atividades: async () => {
            const res = await API.get('atividades.list');
            const lista = res.ok ? res.data : [];
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Atividades</h2>
                <div class="grid grid-2">
                    ${lista.length ? lista.map(a => `
                        <div class="card">
                            <span class="badge badge-navy">${a.disciplina || 'Geral'}</span>
                            <h4 class="font-bold text-navy mt-2">${a.titulo}</h4>
                            <p class="text-xs mt-2"><i class="far fa-clock"></i> Prazo: ${a.prazo}</p>
                        </div>
                    `).join('') : '<p>Nenhuma atividade.</p>'}
                </div>
            `;
        },
        comunicados: async () => {
            const res = await API.get('comunicados.list');
            const lista = res.ok ? res.data : [];
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Comunicados</h2>
                ${lista.length ? lista.map(c => `
                    <div class="card mb-2" style="border-left:4px solid var(--gold);">
                        <h4 class="font-bold text-navy">${c.titulo}</h4>
                        <p class="text-sm mt-2">${c.conteudo}</p>
                    </div>
                `).join('') : '<p>Nenhum comunicado.</p>'}
            `;
        },
        ocorrencias: async () => {
            const res = await API.get('ocorrencias.list');
            const linkedStudents = await API.get('alunos.list');
            const linkedStudentId = linkedStudents.ok ? linkedStudents.data[0]?.id : 0;
            const lista = (res.ok ? res.data : []).filter(o => Number(o.aluno_id) === Number(linkedStudentId));
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Ocorrências</h2>
                ${lista.length ? lista.map(o => `
                    <div class="card mb-2">
                        <span class="badge ${o.tipo==='Elogio'?'badge-green':'badge-red'}">${o.tipo}</span>
                        <p class="text-sm mt-2">${o.descricao}</p>
                    </div>
                `).join('') : '<p>Nenhuma ocorrência.</p>'}
            `;
        },
        eventos: () => renderEventos(),
        mensagens: () => renderMensagens(),
        pagamentos: () => renderPagamentosResp()
    }
};

async function abrirTrocaSenha() {
    openModal('Alterar Senha', `
        <div class="form-group"><label class="form-label">Senha atual</label><input id="f_atual" type="password" class="form-input"></div>
        <div class="form-group"><label class="form-label">Nova senha (mínimo 8 caracteres)</label><input id="f_nova" type="password" class="form-input" minlength="8" required></div>
        <div class="form-group"><label class="form-label">Confirmar</label><input id="f_conf" type="password" class="form-input" minlength="8" required></div>
    `, async () => {
        const res = await API.post('auth.change_password', {
            atual: document.getElementById('f_atual').value,
            nova: document.getElementById('f_nova').value,
            conf: document.getElementById('f_conf').value
        });
        if (res.ok) { toast(res.msg); closeModal(); }
        else toast(res.msg, 'error');
    });
}

// Inicialização
(async () => {
    if (await loadSession()) {
        await renderSidebar();
        navigate('inicio');
    }
})();
