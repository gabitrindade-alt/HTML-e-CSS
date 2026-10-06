async function renderNotasAluno() {
    const notasRes = await API.get('notas.list');
    let studentId = currentUser.ref_id;
    if (currentUser.perfil === 'responsavel') {
        const linkedStudents = await API.get('alunos.list');
        studentId = linkedStudents.ok ? linkedStudents.data[0]?.id : 0;
    }
    const sitRes = studentId ? await API.get('notas.situacao', { aluno_id: studentId }) : { ok: false };
    const notas = notasRes.ok ? notasRes.data : [];
    const sit = sitRes.ok ? sitRes.data : { status:'OK', cor:'green', msg:'Situação regular' };
    const disciplinas = [...new Set(notas.map(n => n.disciplina).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Boletim</h2>
        <div class="card mb-4" style="border:2px solid ${sit.cor==='red'?'#fca5a5':(sit.cor==='yellow'?'#fde047':'#86efac')};">
            <p class="font-bold text-navy">Situação: ${sit.status}</p>
            <p class="text-sm">${sit.msg}</p>
        </div>
        <div class="table-wrap gradebook-table">
            <table>
                <thead><tr><th>Matéria</th><th>1º bimestre</th><th>2º bimestre</th><th>3º bimestre</th><th>4º bimestre</th><th>Média</th></tr></thead>
                <tbody>
                    ${disciplinas.length ? disciplinas.map(d => {
                        const nd = notas.filter(n => n.disciplina === d);
                        const bims = [1,2,3,4].map(b => nd.find(n=>n.bimestre==b)?.valor || '-');
                        const vals = bims.filter(v=>v!=='-').map(Number);
                        const media = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : '-';
                        return `<tr><td class="font-medium">${d}</td>${bims.map(b=>`<td>${b}</td>`).join('')}<td class="font-bold text-navy">${media}</td></tr>`;
                    }).join('') : '<tr><td colspan="6" style="text-align:center;padding:2rem;">Nenhuma nota lançada.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

let professorNotasTurma = '';
let professorNotasMateria = '';

async function renderProfessorNotas() {
    const [turmasRes, alunosRes, professorRes] = await Promise.all([
        API.get('turmas.list'), API.get('alunos.list'), API.get('professores.get', { id: currentUser.ref_id })
    ]);
    if (!turmasRes.ok || !alunosRes.ok) return '<div class="card">N&atilde;o foi poss&iacute;vel carregar turmas e alunos.</div>';
    const turmas = turmasRes.data || [];
    if (!turmas.length) return '<div class="card">Nenhuma turma vinculada a este professor.</div>';
    const turmaId = String(turmas.some(t => String(t.id) === professorNotasTurma) ? professorNotasTurma : turmas[0].id);
    professorNotasTurma = turmaId;
    const alunos = (alunosRes.data || []).filter(a => String(a.turma_id) === turmaId && a.situacao === 'Ativo');
    const notasRes = await Promise.all(alunos.map(a => API.get('notas.list', { aluno_id: a.id })));
    const notasPorAluno = notasRes.map(r => r.ok ? r.data : []);
    const notasTodas = notasPorAluno.flat();
    const disciplinaProfessor = (professorRes.ok ? professorRes.data?.disciplina || '' : '').split(',').map(d => d.trim()).filter(d => d && d.toLowerCase() !== 'geral');
    const materias = [...new Set([...disciplinaProfessor, ...notasTodas.map(n => n.disciplina).filter(Boolean)])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (!materias.length) materias.push('Geral');
    const preferida = materias.includes('Matemática') ? 'Matemática' : materias[0];
    if (!materias.includes(professorNotasMateria)) professorNotasMateria = preferida;
    const materia = professorNotasMateria;
    const linhas = alunos.map((aluno, index) => {
        const notas = notasPorAluno[index].filter(n => n.disciplina === materia);
        const bimestres = [1, 2, 3, 4].map(b => notas.find(n => Number(n.bimestre) === b));
        const valores = bimestres.filter(Boolean).map(n => Number(n.valor));
        const media = valores.length ? (valores.reduce((sum, value) => sum + value, 0) / valores.length).toFixed(1) : '—';
        const cells = bimestres.map((nota, i) => nota
            ? `<td><button class="grade-cell grade-cell-filled" data-aluno="${appHtmlSafe(aluno.nome)}" data-disciplinas="${appHtmlSafe(JSON.stringify(materias))}" data-nota-id="${Number(nota.id)}" data-nota-disciplina="${appHtmlSafe(nota.disciplina)}" data-nota-bimestre="${Number(nota.bimestre)}" data-nota-valor="${appHtmlSafe(nota.valor)}" data-nota-observacao="${appHtmlSafe(nota.observacao || '')}" onclick="editarNotaProfessor(${Number(aluno.id)},this)" title="Editar nota">${appHtmlSafe(nota.valor)} <i class="fas fa-pen"></i></button></td>`
            : `<td><button class="grade-cell grade-cell-empty" data-aluno="${appHtmlSafe(aluno.nome)}" data-disciplinas="${appHtmlSafe(JSON.stringify(materias))}" data-disciplina="${appHtmlSafe(materia)}" data-bimestre="${i + 1}" onclick="abrirNotaProfessor(${Number(aluno.id)},this)" title="Lançar nota">+ Lançar</button></td>`
        ).join('');
        return `<tr><td class="font-medium">${appHtmlSafe(aluno.nome)}<small class="gradebook-matricula">${appHtmlSafe(aluno.matricula || '')}</small></td>${cells}<td class="font-bold text-navy">${media}</td></tr>`;
    }).join('');
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Boletim da turma</h2>
        <div class="card gradebook-filter mb-4">
            <div class="form-group" style="margin:0"><label class="form-label" for="professorNotasTurma">Turma</label><select id="professorNotasTurma" class="form-select" onchange="professorNotasTurma=this.value;renderSection()">${turmas.map(t => `<option value="${t.id}" ${String(t.id) === turmaId ? 'selected' : ''}>${appHtmlSafe(t.nome)}</option>`).join('')}</select></div>
            <div class="form-group" style="margin:0"><label class="form-label" for="professorNotasMateria">Matéria</label><select id="professorNotasMateria" class="form-select" onchange="professorNotasMateria=this.value;renderSection()">${materias.map(m => `<option value="${appHtmlSafe(m)}" ${m === materia ? 'selected' : ''}>${appHtmlSafe(m)}</option>`).join('')}</select></div>
        </div>
        <div class="table-wrap gradebook-table"><table><thead><tr><th>Aluno</th><th>1º bimestre</th><th>2º bimestre</th><th>3º bimestre</th><th>4º bimestre</th><th>Média</th></tr></thead><tbody>
            ${linhas || '<tr><td colspan="6" style="text-align:center;padding:1.5rem;">Nenhum aluno ativo nesta turma.</td></tr>'}
        </tbody></table></div>
        <p class="text-xs mt-2" style="color:#6b7280;">Clique em uma nota para editar ou em + Lançar para preencher um bimestre.</p>
    `;
}
function editarNotaProfessor(alunoId, button) {
    abrirNotaProfessor(alunoId, button, {
        id: Number(button.dataset.notaId),
        disciplina: button.dataset.notaDisciplina,
        bimestre: Number(button.dataset.notaBimestre),
        valor: button.dataset.notaValor,
        observacao: button.dataset.notaObservacao || ''
    });
}

function abrirNotaProfessor(alunoId, button, nota = null) {
    const alunoNome = button.dataset.aluno;
    const disciplinas = JSON.parse(button.dataset.disciplinas || '[]');
    const disciplinaInicial = nota?.disciplina || button.dataset.disciplina || '';
    if (nota?.disciplina && !disciplinas.includes(nota.disciplina)) disciplinas.push(nota.disciplina);
    const listaDisciplinas = disciplinas.length ? [...new Set(disciplinas)] : ['Geral'];
    const opcoes = listaDisciplinas.map(d => `<option value="${appHtmlSafe(d)}" ${disciplinaInicial === d ? 'selected' : ''}>${appHtmlSafe(d)}</option>`).join('');
    openModal(`${nota ? 'Editar' : 'Registrar'} nota: ${appHtmlSafe(alunoNome)}`, `
        <div class="form-group"><label class="form-label">Disciplina</label><select id="professorNotaDisciplina" class="form-select">${opcoes}</select></div>
        <div class="form-group"><label class="form-label">Bimestre</label><select id="professorNotaBimestre" class="form-select">${[1,2,3,4].map(b => `<option value="${b}" ${Number(nota?.bimestre || button.dataset.bimestre) === b ? 'selected' : ''}>${b}º bimestre</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Nota (0 a 10)</label><input id="professorNotaValor" type="number" min="0" max="10" step="0.1" class="form-input" value="${nota ? appHtmlSafe(nota.valor) : ''}" required></div>
        <div class="form-group"><label class="form-label">Observação (opcional)</label><textarea id="professorNotaObs" class="form-textarea" rows="2">${nota ? appHtmlSafe(nota.observacao) : ''}</textarea></div>
    `, async () => {
        const res = await API.post('notas.save', {
            ...(nota ? { id: nota.id } : {}),
            aluno_id: alunoId,
            disciplina: document.getElementById('professorNotaDisciplina').value,
            bimestre: document.getElementById('professorNotaBimestre').value,
            valor: document.getElementById('professorNotaValor').value,
            observacao: document.getElementById('professorNotaObs').value
        });
        if (res.ok) { toast(res.msg, 'success'); closeModal(); renderSection(); }
        else toast(res.msg, 'error');
    });
}
