function appHtmlSafe(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
}

function renderAcademicGradeRows(notas) {
    const grouped = new Map();
    (notas || []).forEach(n => {
        const discipline = String(n.disciplina || 'Geral');
        if (!grouped.has(discipline)) grouped.set(discipline, []);
        grouped.get(discipline).push(n);
    });
    if (!grouped.size) return '<tr><td colspan="6">Nenhuma nota cadastrada.</td></tr>';
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([discipline, entries]) => {
        const grades = [1, 2, 3, 4].map(term => entries.find(n => Number(n.bimestre) === term)?.valor);
        const valid = grades.filter(value => value !== undefined && value !== null && value !== '').map(Number);
        const average = valid.length ? (valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1) : '—';
        return `<tr><td class="font-medium">${appHtmlSafe(discipline)}</td>${grades.map(value => `<td>${value == null ? '—' : appHtmlSafe(value)}</td>`).join('')}<td class="font-bold">${average}</td></tr>`;
    }).join('');
}
let professorRosterClass = '';
async function renderProfessorAlunos() {
    const [turmasRes, alunosRes] = await Promise.all([API.get('turmas.list'), API.get('alunos.list')]);
    if (!turmasRes.ok || !alunosRes.ok) return '<div class="card">Não foi possível carregar a lista de alunos. Tente novamente.</div>';
    const turmas = turmasRes.data || [];
    const turmaId = String(turmas.some(t => String(t.id) === professorRosterClass) ? professorRosterClass : (turmas[0]?.id ?? ''));
    professorRosterClass = turmaId;
    const alunos = (alunosRes.data || []).filter(a => String(a.turma_id) === turmaId && a.situacao === 'Ativo');
    return `
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-serif text-2xl font-bold text-navy">Alunos da turma</h2>
            <button class="btn btn-gold" onclick="abrirVinculoAluno()"><i class="fas fa-user-plus"></i> Adicionar aluno cadastrado</button>
        </div>
        <div class="form-group" style="max-width:28rem"><label class="form-label" for="professorRosterClass">Turma</label>
            <select id="professorRosterClass" class="form-select" onchange="professorRosterClass=this.value;renderSection()">${turmas.map(t => `<option value="${t.id}" ${String(t.id) === turmaId ? 'selected' : ''}>${appHtmlSafe(t.nome)}</option>`).join('')}</select>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Matrícula</th><th>Nome</th><th>E-mail</th><th>Curso</th><th>Perfil</th></tr></thead><tbody>
            ${alunos.length ? alunos.map(a => `<tr><td>${appHtmlSafe(a.matricula || '—')}</td><td class="font-medium">${appHtmlSafe(a.nome)}</td><td>${appHtmlSafe(a.email || '—')}</td><td>${appHtmlSafe(a.curso_nome || '—')}</td><td><button class="btn btn-ghost" onclick="abrirPerfilAlunoProfessor(${Number(a.id)})"><i class="fas fa-folder-open"></i> Abrir perfil</button></td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum aluno ativo nesta turma.</td></tr>'}
        </tbody></table></div>
    `;
}

let professorDiarioTurma = '';

function dataLocalISO() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

async function renderProfessorDiario() {
    const turmasRes = await API.get('turmas.list');
    if (!turmasRes.ok) return `<div class="card">${appHtmlSafe(turmasRes.msg || 'Não foi possível carregar as turmas.')}</div>`;
    const turmas = turmasRes.data || [];
    const classId = String(turmas.some(t => String(t.id) === professorDiarioTurma) ? professorDiarioTurma : (turmas[0]?.id ?? ''));
    professorDiarioTurma = classId;
    const date = dataLocalISO();
    const callRes = classId ? await API.get('frequencia.por_turma', { turma_id: classId, data: date }) : { ok: true, data: [] };
    if (!callRes.ok) return `<div class="card">${appHtmlSafe(callRes.msg || 'Não foi possível carregar a chamada.')}</div>`;
    const students = callRes.data || [];
    const diario = await renderCRUDList('diario');
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Diário de Classe</h2>
        ${turmas.length ? `
            <div class="card mb-6">
                <h3 class="font-bold text-navy mb-3">Presença e falta da turma</h3>
                <div class="flex items-center gap-3 mb-4" style="flex-wrap:wrap;">
                    <div class="form-group" style="min-width:15rem;margin:0"><label class="form-label" for="professorDiarioTurma">Turma</label>
                        <select id="professorDiarioTurma" class="form-select" onchange="professorDiarioTurma=this.value;renderSection()">${turmas.map(t => `<option value="${Number(t.id)}" ${String(t.id) === classId ? 'selected' : ''}>${appHtmlSafe(t.nome)}</option>`).join('')}</select>
                    </div>
                    <div class="form-group" style="margin:0"><label class="form-label" for="professorDiarioData">Data</label><input id="professorDiarioData" type="date" class="form-input" value="${date}" onchange="renderProfessorDiarioForDate()"></div>
                </div>
                <div class="table-wrap"><table><thead><tr><th>Matrícula</th><th>Aluno</th><th>Presença</th><th>Justificativa da falta</th></tr></thead><tbody id="professorDiarioChamada">
                    ${students.length ? students.map(s => `<tr><td>${appHtmlSafe(s.matricula || '—')}</td><td class="font-medium">${appHtmlSafe(s.nome)}</td><td><select class="form-select" data-diario-presenca="${Number(s.aluno_id)}"><option value="1" ${s.presente ? 'selected' : ''}>Presente</option><option value="0" ${!s.presente ? 'selected' : ''}>Falta</option></select></td><td><input class="form-input" data-diario-justificativa="${Number(s.aluno_id)}" value="${appHtmlSafe(s.justificativa || '')}" placeholder="Opcional"></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum aluno ativo cadastrado nesta turma.</td></tr>'}
                </tbody></table></div>
                ${students.length ? `<button class="btn btn-gold mt-4" onclick="salvarChamadaDiario(${Number(classId)})"><i class="fas fa-save"></i> Salvar chamada</button>` : ''}
            </div>
        ` : '<div class="card mb-6">Nenhuma turma está vinculada a este professor.</div>'}
        ${diario}
    `;
}

async function renderProfessorDiarioForDate() {
    const date = document.getElementById('professorDiarioData')?.value;
    const res = await API.get('frequencia.por_turma', { turma_id: professorDiarioTurma, data: date });
    if (!res.ok) return toast(res.msg || 'Não foi possível carregar a chamada.', 'error');
    const students = res.data || [];
    const tbody = document.getElementById('professorDiarioChamada');
    if (!tbody) return;
    tbody.innerHTML = students.length ? students.map(s => `<tr><td>${appHtmlSafe(s.matricula || '—')}</td><td class="font-medium">${appHtmlSafe(s.nome)}</td><td><select class="form-select" data-diario-presenca="${Number(s.aluno_id)}"><option value="1" ${s.presente ? 'selected' : ''}>Presente</option><option value="0" ${!s.presente ? 'selected' : ''}>Falta</option></select></td><td><input class="form-input" data-diario-justificativa="${Number(s.aluno_id)}" value="${appHtmlSafe(s.justificativa || '')}" placeholder="Opcional"></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum aluno ativo cadastrado nesta turma.</td></tr>';
    const button = document.querySelector('[onclick^="salvarChamadaDiario"]');
    if (button) button.style.display = students.length ? '' : 'none';
}

async function salvarChamadaDiario(turmaId) {
    const date = document.getElementById('professorDiarioData')?.value;
    const records = [...document.querySelectorAll('[data-diario-presenca]')].map(field => ({
        aluno_id: Number(field.dataset.diarioPresenca),
        presente: field.value === '1',
        justificativa: document.querySelector(`[data-diario-justificativa="${field.dataset.diarioPresenca}"]`)?.value || ''
    }));
    const res = await API.post('frequencia.save', { turma_id: turmaId, data: date, registros: records });
    if (res.ok) { toast(res.msg || 'Chamada salva.', 'success'); await renderProfessorDiarioForDate(); }
    else toast(res.msg || 'Não foi possível salvar a chamada.', 'error');
}

async function abrirVinculoAluno() {
    const [contasRes, turmasRes] = await Promise.all([API.get('alunos.contas_pendentes'), API.get('turmas.list')]);
    const contas = contasRes.ok ? contasRes.data : [];
    const turmas = turmasRes.ok ? turmasRes.data : [];
    if (!contas.length) return toast('Não há contas de aluno aguardando vínculo.', 'info');
    if (!turmas.length) return toast('Você não possui turma vinculada para adicionar alunos.', 'error');
    const classId = turmas.some(t => String(t.id) === professorRosterClass) ? professorRosterClass : String(turmas[0].id);
    openModal('Adicionar aluno cadastrado', `
        <p class="text-sm mb-4">Selecione a conta e a turma. O cadastro será vinculado para notas e frequência.</p>
        <div class="form-group"><label class="form-label">Conta do aluno</label><select id="vinculoContaAluno" class="form-select" required>${contas.map(c => `<option value="${Number(c.id)}">${appHtmlSafe(c.nome)} — ${appHtmlSafe(c.email)}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Turma</label><select id="vinculoTurmaAluno" class="form-select" required>${turmas.map(t => `<option value="${Number(t.id)}" ${String(t.id) === classId ? 'selected' : ''}>${appHtmlSafe(t.nome)}</option>`).join('')}</select></div>
    `, async () => {
        const res = await API.post('alunos.vincular_conta', {
            usuario_id: document.getElementById('vinculoContaAluno').value,
            turma_id: document.getElementById('vinculoTurmaAluno').value
        });
        if (res.ok) { toast(res.msg); closeModal(); renderSection(); }
        else toast(res.msg, 'error');
    });
}

async function abrirPerfilAlunoProfessor(alunoId) {
    const [alunoRes, notasRes, freqRes] = await Promise.all([
        API.get('alunos.get', { id: alunoId }),
        API.get('notas.list', { aluno_id: alunoId }),
        API.get('frequencia.list', { aluno_id: alunoId })
    ]);
    if (!alunoRes.ok || !alunoRes.data) return toast(alunoRes.msg || 'Não foi possível abrir o perfil do aluno.', 'error');
    const a = alunoRes.data;
    const notas = notasRes.ok ? notasRes.data : [];
    const frequencias = freqRes.ok ? freqRes.data : [];
    openModal(`Perfil de ${appHtmlSafe(a.nome)}`, `
        <div class="card mb-4">
            <p><strong>Matrícula:</strong> ${appHtmlSafe(a.matricula || '—')}</p>
            <p><strong>E-mail:</strong> ${appHtmlSafe(a.email || '—')}</p>
            <p><strong>Turma:</strong> ${appHtmlSafe(a.turma_nome || '—')}</p>
            <p><strong>Curso:</strong> ${appHtmlSafe(a.curso_nome || '—')}</p>
            <p><strong>Situação:</strong> ${appHtmlSafe(a.situacao || 'Ativo')}</p>
        </div>
        <h4 class="font-bold text-navy mb-2">Notas por matéria</h4>
        <div class="table-wrap gradebook-table mb-4"><table><thead><tr><th>Matéria</th><th>1º bimestre</th><th>2º bimestre</th><th>3º bimestre</th><th>4º bimestre</th><th>Média</th></tr></thead><tbody>
            ${renderAcademicGradeRows(notas)}
        </tbody></table></div>
        <h4 class="font-bold text-navy mb-2">Frequência</h4>
        <div class="table-wrap"><table><thead><tr><th>Data</th><th>Presença</th><th>Justificativa</th></tr></thead><tbody>
            ${frequencias.length ? frequencias.map(f => `<tr><td>${appHtmlSafe(f.data)}</td><td>${Number(f.presente) ? 'Presente' : 'Falta'}</td><td>${appHtmlSafe(f.justificativa || '—')}</td></tr>`).join('') : '<tr><td colspan="3">Nenhuma frequência cadastrada.</td></tr>'}
        </tbody></table></div>
    `);
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
                    <button class="card" onclick="navigate('alunos-turma')" style="cursor:pointer;text-align:left;"><i class="fas fa-user-graduate text-2xl text-navy mb-2"></i><p class="font-bold">Alunos da turma</p></button><button class="card" onclick="navigate('frequencia')" style="cursor:pointer;text-align:left;">
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
        diario: () => renderProfessorDiario(),
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
            const [alunoRes, notasRes, frequenciaRes] = await Promise.all([
                API.get('alunos.list'), API.get('notas.list'), API.get('frequencia.list')
            ]);
            const aluno = alunoRes.ok ? alunoRes.data[0] : null;
            const notas = notasRes.ok ? notasRes.data : [];
            const frequencias = frequenciaRes.ok ? frequenciaRes.data : [];
            return `
                <h2 class="font-serif text-2xl font-bold text-navy mb-4">Meu Perfil</h2>
                <div class="card">
                    <p><strong>Nome:</strong> ${currentUser.nome}</p>
                    <p><strong>E-mail:</strong> ${currentUser.email}</p>
                    <p><strong>Perfil:</strong> ${currentUser.perfil}</p>
                    ${aluno ? `<p><strong>Matrícula:</strong> ${appHtmlSafe(aluno.matricula || '—')}</p><p><strong>Turma:</strong> ${appHtmlSafe(aluno.turma_nome || '—')}</p><p><strong>Curso:</strong> ${appHtmlSafe(aluno.curso_nome || '—')}</p>` : '<p class="mt-2" style="color:#b91c1c;">Seu cadastro escolar ainda não está vinculado. Entre em contato com a secretaria.</p>'}
                    <button class="btn btn-navy mt-4" onclick="abrirTrocaSenha()"><i class="fas fa-key"></i> Alterar Senha</button>
                </div>
                <h3 class="font-serif text-xl font-bold text-navy mt-6 mb-3">Notas por matéria</h3>
                <div class="table-wrap gradebook-table mb-6"><table><thead><tr><th>Matéria</th><th>1º bimestre</th><th>2º bimestre</th><th>3º bimestre</th><th>4º bimestre</th><th>Média</th></tr></thead><tbody>
                    ${renderAcademicGradeRows(notas)}
                </tbody></table></div>
                <h3 class="font-serif text-xl font-bold text-navy mb-3">Frequência</h3>
                <div class="table-wrap"><table><thead><tr><th>Data</th><th>Status</th><th>Justificativa</th><th>Observação</th></tr></thead><tbody>
                    ${frequencias.length ? frequencias.map(f => `<tr><td>${appHtmlSafe(f.data)}</td><td>${Number(f.presente) ? 'Presente' : 'Falta'}</td><td>${appHtmlSafe(f.justificativa || '—')}</td><td>${appHtmlSafe(f.observacao || '—')}</td></tr>`).join('') : '<tr><td colspan="4">Nenhuma frequência cadastrada.</td></tr>'}
                </tbody></table></div>
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
