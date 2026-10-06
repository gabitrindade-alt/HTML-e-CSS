async function renderFrequenciaAluno() {
    const res = await API.get('frequencia.list');
    const freq = res.ok ? res.data : [];
    const presentes = freq.filter(f => Number(f.presente) === 1).length;
    const faltas = freq.length - presentes;
    const percentual = freq.length ? Math.round((presentes / freq.length) * 100) : 0;
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Minha Frequ&ecirc;ncia</h2>
        <div class="grid grid-3 mb-4">
            ${statCard('Aulas registradas', freq.length, 'fa-calendar', {bg:'#dbeafe',text:'#1d4ed8'})}
            ${statCard('Presen&ccedil;as', presentes, 'fa-check-circle', {bg:'#dcfce7',text:'#15803d'})}
            ${statCard('Faltas / frequ&ecirc;ncia', `${faltas} / ${percentual}%`, 'fa-user-clock', {bg:'#fef9c3',text:'#a16207'})}
        </div>
        <div class="table-wrap"><table>
            <thead><tr><th>Data</th><th>Status</th><th>Justificativa</th><th>Observa&ccedil;&atilde;o</th></tr></thead>
            <tbody>
                ${freq.length ? freq.map(f => `
                    <tr>
                        <td>${appHtmlSafe(f.data)}</td>
                        <td>${Number(f.presente) === 1 ? '<span class="badge badge-green"><i class="fas fa-check"></i> Presente</span>' : '<span class="badge badge-red"><i class="fas fa-times"></i> Falta</span>'}</td>
                        <td>${appHtmlSafe(f.justificativa || '—')}</td>
                        <td>${appHtmlSafe(f.observacao || '—')}</td>
                    </tr>
                `).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum registro.</td></tr>'}
            </tbody>
        </table></div>
    `;
}
let professorFrequenciaTurma = '';

function renderAttendanceRows(rows) {
    return rows.length ? rows.map(r => `<tr><td class="font-medium">${appHtmlSafe(r.nome)}</td><td><select class="form-select" data-frequencia-aluno="${Number(r.aluno_id)}"><option value="1" ${r.presente ? 'selected' : ''}>Presente</option><option value="0" ${!r.presente ? 'selected' : ''}>Falta</option></select></td><td><input class="form-input" data-frequencia-just="${Number(r.aluno_id)}" value="${appHtmlSafe(r.justificativa || '')}" placeholder="Obrigatória quando houver falta"><input type="hidden" data-frequencia-obs="${Number(r.aluno_id)}" value="${appHtmlSafe(r.observacao || '')}"></td></tr>`).join('') : '<tr><td colspan="3" style="text-align:center;padding:2rem;color:#6b7280;">Esta turma ainda não possui alunos ativos cadastrados. Adicione ou vincule alunos na seção Alunos da turma.</td></tr>';
}

async function renderProfessorFrequencia() {
    const turmasRes = await API.get('turmas.list');
    if (!turmasRes.ok) return `<div class="card">${appHtmlSafe(turmasRes.msg || 'N&atilde;o foi poss&iacute;vel carregar as turmas.')}</div>`;
    const turmas = turmasRes.data || [];
    if (!turmas.length) return '<div class="card">Nenhuma turma vinculada a este professor.</div>';
    const turmaId = String(turmas.some(t => String(t.id) === professorFrequenciaTurma) ? professorFrequenciaTurma : turmas[0].id);
    professorFrequenciaTurma = turmaId;
    const res = await API.get('frequencia.resumo_turma', { turma_id: turmaId });
    if (!res.ok) return `<div class="card">${appHtmlSafe(res.msg || 'N&atilde;o foi poss&iacute;vel carregar o resumo da frequ&ecirc;ncia.')}</div>`;
    const alunos = res.data || [];
    const totalAulas = alunos.reduce((sum, a) => sum + Number(a.aulas_registradas || 0), 0);
    const totalPresencas = alunos.reduce((sum, a) => sum + Number(a.presencas || 0), 0);
    const totalFaltas = alunos.reduce((sum, a) => sum + Number(a.faltas || 0), 0);
    const percentualGeral = totalAulas ? Math.round((totalPresencas / totalAulas) * 100) : 0;
    const linhas = alunos.length ? alunos.map(a => {
        const aulas = Number(a.aulas_registradas || 0);
        const percentual = a.percentual == null ? null : Number(a.percentual);
        const status = percentual == null ? '<span class="badge badge-gray">Sem registros</span>' : percentual >= 85 ? '<span class="badge badge-green">Regular</span>' : '<span class="badge badge-yellow">Aten&ccedil;&atilde;o</span>';
        return `<tr><td class="font-medium">${appHtmlSafe(a.nome)}</td><td>${appHtmlSafe(a.matricula || '—')}</td><td class="text-center">${aulas}</td><td class="text-center">${Number(a.presencas || 0)}</td><td class="text-center">${Number(a.faltas || 0)}</td><td class="font-bold text-navy">${percentual == null ? '—' : `${percentual.toFixed(1)}%`}</td><td>${status}</td></tr>`;
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum aluno ativo nesta turma.</td></tr>';
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Frequ&ecirc;ncia geral da turma</h2>
        <div class="card mb-4" style="max-width:28rem;">
            <div class="form-group" style="margin:0"><label class="form-label" for="professorFrequenciaTurma">Turma</label><select id="professorFrequenciaTurma" class="form-select" onchange="professorFrequenciaTurma=this.value;renderSection()">${turmas.map(t => `<option value="${Number(t.id)}" ${String(t.id) === turmaId ? 'selected' : ''}>${appHtmlSafe(t.nome)}</option>`).join('')}</select></div>
        </div>
        <div class="grid grid-3 mb-4">
            ${statCard('Presen&ccedil;as', totalPresencas, 'fa-check-circle', {bg:'#dcfce7',text:'#15803d'})}
            ${statCard('Faltas', totalFaltas, 'fa-user-clock', {bg:'#fee2e2',text:'#b91c1c'})}
            ${statCard('Frequ&ecirc;ncia geral', `${percentualGeral}%`, 'fa-chart-pie', {bg:'#dbeafe',text:'#1d4ed8'})}
        </div>
        <div class="table-wrap"><table><thead><tr><th>Aluno</th><th>Matr&iacute;cula</th><th>Aulas registradas</th><th>Presen&ccedil;as</th><th>Faltas</th><th>Frequ&ecirc;ncia</th><th>Situa&ccedil;&atilde;o</th></tr></thead><tbody>${linhas}</tbody></table></div>
        <button class="btn btn-gold mt-4" onclick="professorDiarioTurma='${turmaId}';navigate('diario')"><i class="fas fa-clipboard-check"></i> Lan&ccedil;ar chamada do dia</button>
        <p class="text-xs mt-2" style="color:#6b7280;">O percentual considera todos os registros de frequ&ecirc;ncia lan&ccedil;ados para cada aluno.</p>
    `;
}
async function renderProfessorFrequenciaForDate() {
    const chosenDate = document.getElementById('professorFrequenciaData')?.value;
    const res = await API.get('frequencia.por_turma', { turma_id: professorFrequenciaTurma, data: chosenDate });
    if (!res.ok) { toast(res.msg, 'error'); return; }
    const section = document.getElementById('sectionContent');
    const rows = res.data || [];
    const table = section.querySelector('tbody');
    if (!table) return;
    table.innerHTML = renderAttendanceRows(rows);
    const button = section.querySelector('[onclick^="salvarFrequenciaProfessor"]');
    if (button) button.style.display = rows.length ? '' : 'none';
    if (!button && rows.length) section.querySelector('.table-wrap')?.insertAdjacentHTML('afterend', `<button class="btn btn-gold mt-4" onclick="salvarFrequenciaProfessor(${Number(professorFrequenciaTurma)})"><i class="fas fa-save"></i> Salvar frequência</button>`);
}

async function salvarFrequenciaProfessor(turmaId) {
    const data = document.getElementById('professorFrequenciaData')?.value;
    const registros = [...document.querySelectorAll('[data-frequencia-aluno]')].map(input => ({
        aluno_id: Number(input.dataset.frequenciaAluno),
        presente: input.value === '1',
        justificativa: document.querySelector(`[data-frequencia-just="${input.dataset.frequenciaAluno}"]`)?.value || '',
        observacao: document.querySelector(`[data-frequencia-obs="${input.dataset.frequenciaAluno}"]`)?.value || ''
    }));
    const res = await API.post('frequencia.save', { turma_id: turmaId, data, registros });
    if (res.ok) { toast(res.msg, 'success'); await renderProfessorFrequenciaForDate(); }
    else toast(res.msg, 'error');
}
