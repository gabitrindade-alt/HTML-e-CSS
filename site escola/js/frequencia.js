async function renderFrequenciaAluno() {
    const res = await API.get('frequencia.list');
    const freq = res.ok ? res.data : [];
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Minha Frequência</h2>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Data</th><th>Status</th><th>Justificativa</th><th>Observação</th></tr></thead>
                <tbody>
                    ${freq.length ? freq.map(f => `
                        <tr>
                            <td>${f.data}</td>
                            <td>${f.presente==1 ? '<span style="color:#15803d;font-weight:600;"><i class="fas fa-check"></i> Presente</span>' : '<span style="color:#b91c1c;font-weight:600;"><i class="fas fa-times"></i> Falta</span>'}</td>
                            <td>${f.justificativa || '-'}</td>
                            <td>${f.observacao || '-'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum registro.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

let professorFrequenciaTurma = '';

async function renderProfessorFrequencia() {
    const [turmasRes, alunosRes] = await Promise.all([API.get('turmas.list'), API.get('alunos.list')]);
    if (!turmasRes.ok || !alunosRes.ok) return '<div class="card">N&atilde;o foi poss&iacute;vel carregar as turmas e os alunos. Atualize a p&aacute;gina e tente novamente.</div>';
    const turmas = turmasRes.data || [];
    const turmaId = String(turmas.some(t => String(t.id) === professorFrequenciaTurma) ? professorFrequenciaTurma : (turmas[0]?.id ?? ''));
    professorFrequenciaTurma = turmaId;
    const hoje = new Date();
    const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const frequenciaRes = turmaId ? await API.get('frequencia.por_turma', { turma_id: turmaId, data }) : { ok: true, data: [] };
    if (!frequenciaRes.ok) return `<div class="card">${appHtmlSafe(frequenciaRes.msg || 'Erro ao carregar a frequência.')}</div>`;
    const registros = frequenciaRes.data || [];
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Frequência da turma</h2>
        <div class="flex items-center gap-3 mb-4" style="flex-wrap:wrap;">
            <div class="form-group" style="min-width:15rem;margin:0"><label class="form-label" for="professorFrequenciaTurma">Turma</label>
                <select id="professorFrequenciaTurma" class="form-select" onchange="professorFrequenciaTurma=this.value;renderSection()">${turmas.map(t => `<option value="${t.id}" ${String(t.id) === turmaId ? 'selected' : ''}>${appHtmlSafe(t.nome)}</option>`).join('')}</select>
            </div>
            <div class="form-group" style="margin:0"><label class="form-label" for="professorFrequenciaData">Data</label><input id="professorFrequenciaData" type="date" class="form-input" value="${data}" onchange="renderProfessorFrequenciaForDate()"></div>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Aluno</th><th>Presente</th><th>Justificativa</th><th>Observação</th></tr></thead><tbody>
            ${registros.length ? registros.map(r => `<tr><td class="font-medium">${appHtmlSafe(r.nome)}</td><td><label><input type="checkbox" data-frequencia-aluno="${Number(r.aluno_id)}" ${r.presente ? 'checked' : ''}> Presente</label></td><td><input class="form-input" data-frequencia-just="${Number(r.aluno_id)}" value="${appHtmlSafe(r.justificativa || '')}" placeholder="Justificativa"></td><td><input class="form-input" data-frequencia-obs="${Number(r.aluno_id)}" value="${appHtmlSafe(r.observacao || '')}" placeholder="Observação (opcional)"></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum aluno nesta turma.</td></tr>'}
        </tbody></table></div>
        ${registros.length ? `<button class="btn btn-gold mt-4" onclick="salvarFrequenciaProfessor(${Number(turmaId)})"><i class="fas fa-save"></i> Salvar frequência</button>` : ''}
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
    table.innerHTML = rows.length ? rows.map(r => `<tr><td class="font-medium">${appHtmlSafe(r.nome)}</td><td><label><input type="checkbox" data-frequencia-aluno="${Number(r.aluno_id)}" ${r.presente ? 'checked' : ''}> Presente</label></td><td><input class="form-input" data-frequencia-just="${Number(r.aluno_id)}" value="${appHtmlSafe(r.justificativa || '')}" placeholder="Justificativa"></td><td><input class="form-input" data-frequencia-obs="${Number(r.aluno_id)}" value="${appHtmlSafe(r.observacao || '')}" placeholder="Observação (opcional)"></td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum aluno nesta turma.</td></tr>';
    const button = section.querySelector('[onclick^="salvarFrequenciaProfessor"]');
    if (button) button.style.display = rows.length ? '' : 'none';
    if (!button && rows.length) section.querySelector('.table-wrap')?.insertAdjacentHTML('afterend', `<button class="btn btn-gold mt-4" onclick="salvarFrequenciaProfessor(${Number(professorFrequenciaTurma)})"><i class="fas fa-save"></i> Salvar frequência</button>`);
}

async function salvarFrequenciaProfessor(turmaId) {
    const data = document.getElementById('professorFrequenciaData')?.value;
    const registros = [...document.querySelectorAll('[data-frequencia-aluno]')].map(input => ({
        aluno_id: Number(input.dataset.frequenciaAluno),
        presente: input.checked,
        justificativa: document.querySelector(`[data-frequencia-just="${input.dataset.frequenciaAluno}"]`)?.value || '',
        observacao: document.querySelector(`[data-frequencia-obs="${input.dataset.frequenciaAluno}"]`)?.value || ''
    }));
    const res = await API.post('frequencia.save', { turma_id: turmaId, data, registros });
    if (res.ok) toast(res.msg, 'success');
    else toast(res.msg, 'error');
}
