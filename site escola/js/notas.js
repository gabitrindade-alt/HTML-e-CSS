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
    const disciplinas = ['Matemática','Português','História','Geografia','Física','Química','Ciências'];
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Boletim</h2>
        <div class="card mb-4" style="border:2px solid ${sit.cor==='red'?'#fca5a5':(sit.cor==='yellow'?'#fde047':'#86efac')};">
            <p class="font-bold text-navy">Situação: ${sit.status}</p>
            <p class="text-sm">${sit.msg}</p>
        </div>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Disciplina</th><th>1º Bim</th><th>2º Bim</th><th>3º Bim</th><th>4º Bim</th><th>Média</th></tr></thead>
                <tbody>
                    ${disciplinas.map(d => {
                        const nd = notas.filter(n => n.disciplina === d);
                        const bims = [1,2,3,4].map(b => nd.find(n=>n.bimestre==b)?.valor || '-');
                        const vals = bims.filter(v=>v!=='-').map(Number);
                        const media = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : '-';
                        return `<tr><td class="font-medium">${d}</td>${bims.map(b=>`<td>${b}</td>`).join('')}<td class="font-bold text-navy">${media}</td></tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

let professorNotasTurma = '';

async function renderProfessorNotas() {
    const [turmasRes, alunosRes, professorRes] = await Promise.all([
        API.get('turmas.list'), API.get('alunos.list'), API.get('professores.get', { id: currentUser.ref_id })
    ]);
    if (!turmasRes.ok || !alunosRes.ok) return '<div class="card">N&atilde;o foi poss&iacute;vel carregar as turmas e os alunos. Atualize a p&aacute;gina e tente novamente.</div>';
    const turmas = turmasRes.data || [];
    const turmaId = String(turmas.some(t => String(t.id) === professorNotasTurma) ? professorNotasTurma : (turmas[0]?.id ?? ''));
    professorNotasTurma = turmaId;
    const alunos = (alunosRes.data || []).filter(a => String(a.turma_id) === turmaId && a.situacao === 'Ativo');
    const notasPorAluno = await Promise.all(alunos.map(a => API.get('notas.list', { aluno_id: a.id })));
    const disciplinasTexto = professorRes.ok && professorRes.data?.disciplina ? professorRes.data.disciplina : 'Geral';
    const disciplinas = disciplinasTexto.split(',').map(d => d.trim()).filter(Boolean);
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Notas da turma</h2>
        <div class="form-group" style="max-width:28rem"><label class="form-label" for="professorNotasTurma">Turma</label>
            <select id="professorNotasTurma" class="form-select" onchange="professorNotasTurma=this.value;renderSection()">${turmas.map(t => `<option value="${t.id}" ${String(t.id) === turmaId ? 'selected' : ''}>${t.nome}</option>`).join('')}</select>
        </div>
        <div class="table-wrap"><table><thead><tr><th>Aluno</th><th>Disciplina</th><th>Notas registradas</th><th></th></tr></thead><tbody>
            ${alunos.length ? alunos.map((a, i) => {
                const notas = notasPorAluno[i]?.ok ? notasPorAluno[i].data : [];
                const resumo = notas.map(n => `${appHtmlSafe(n.disciplina)} ${n.bimestre}º bim.: ${n.valor}`).join(' · ') || 'Sem notas';
                return `<tr><td class="font-medium">${appHtmlSafe(a.nome)}</td><td>${appHtmlSafe(disciplinasTexto)}</td><td>${resumo}</td><td><button class="btn btn-gold" data-aluno="${appHtmlSafe(a.nome)}" data-disciplinas="${appHtmlSafe(JSON.stringify(disciplinas))}" onclick="abrirNotaProfessor(${Number(a.id)},this)">Registrar nota</button></td></tr>`;
            }).join('') : '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum aluno nesta turma.</td></tr>'}
        </tbody></table></div>
    `;
}

function abrirNotaProfessor(alunoId, button) {
    const alunoNome = button.dataset.aluno;
    const disciplinas = JSON.parse(button.dataset.disciplinas || '[]');
    const opcoes = (disciplinas.length ? disciplinas : ['Geral']).map(d => `<option>${appHtmlSafe(d)}</option>`).join('');
    openModal(`Registrar nota: ${appHtmlSafe(alunoNome)}`, `
        <div class="form-group"><label class="form-label">Disciplina</label><select id="professorNotaDisciplina" class="form-select">${opcoes}</select></div>
        <div class="form-group"><label class="form-label">Bimestre</label><select id="professorNotaBimestre" class="form-select"><option value="1">1º bimestre</option><option value="2">2º bimestre</option><option value="3">3º bimestre</option><option value="4">4º bimestre</option></select></div>
        <div class="form-group"><label class="form-label">Nota (0 a 10)</label><input id="professorNotaValor" type="number" min="0" max="10" step="0.1" class="form-input" required></div>
        <div class="form-group"><label class="form-label">Observação (opcional)</label><textarea id="professorNotaObs" class="form-textarea" rows="2"></textarea></div>
    `, async () => {
        const res = await API.post('notas.save', {
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
