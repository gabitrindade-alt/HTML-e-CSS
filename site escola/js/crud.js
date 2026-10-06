const CRUD_CONFIG = {
    alunos: {
        title: 'Alunos', module: 'alunos',
        columns: ['Matrícula','Nome','E-mail','Turma','Situação','Ações'],
        row: a => `
            <td>${a.matricula}</td>
            <td class="font-medium">${a.nome}</td>
            <td>${a.email}</td>
            <td>${a.turma_nome || '-'}</td>
            <td><span class="badge ${a.situacao==='Ativo'?'badge-green':'badge-red'}">${a.situacao}</span></td>
        `,
        form: (item, extra) => `
            <div class="form-group"><label class="form-label">Matrícula</label><input id="f_matricula" class="form-input" value="${item?.matricula||''}" required></div>
            <div class="form-group"><label class="form-label">Nome</label><input id="f_nome" class="form-input" value="${item?.nome||''}" required></div>
            <div class="form-group"><label class="form-label">E-mail</label><input id="f_email" type="email" class="form-input" value="${item?.email||''}" required></div>
            <div class="form-group"><label class="form-label">Turma</label><select id="f_turma_id" class="form-select" required>${extra.turmas.map(t=>`<option value="${t.id}" ${item?.turma_id==t.id?'selected':''}>${t.nome}</option>`).join('')}</select></div>
            <div class="form-group"><label class="form-label">Curso</label><select id="f_curso_id" class="form-select" required>${extra.cursos.map(c=>`<option value="${c.id}" ${item?.curso_id==c.id?'selected':''}>${c.nome}</option>`).join('')}</select></div>
            <div class="form-group"><label class="form-label">Situação</label><select id="f_situacao" class="form-select"><option ${item?.situacao==='Ativo'?'selected':''}>Ativo</option><option ${item?.situacao==='Inativo'?'selected':''}>Inativo</option></select></div>
        `,
        save: item => ({
            id: item?.id,
            matricula: document.getElementById('f_matricula').value,
            nome: document.getElementById('f_nome').value,
            email: document.getElementById('f_email').value,
            turma_id: document.getElementById('f_turma_id').value,
            curso_id: document.getElementById('f_curso_id').value,
            situacao: document.getElementById('f_situacao').value
        })
    },
    professores: {
        title: 'Professores', module: 'professores',
        columns: ['Nome','E-mail','Disciplinas','Status','Ações'],
        row: p => `
            <td class="font-medium">${p.nome}</td>
            <td>${p.email}</td>
            <td>${p.disciplina}</td>
            <td><span class="badge ${p.ativo==1?'badge-green':'badge-red'}">${p.ativo==1?'Ativo':'Inativo'}</span></td>
        `,
        form: (item) => `
            <div class="form-group"><label class="form-label">Nome</label><input id="f_nome" class="form-input" value="${item?.nome||''}" required></div>
            <div class="form-group"><label class="form-label">E-mail</label><input id="f_email" type="email" class="form-input" value="${item?.email||''}" required></div>
            <div class="form-group"><label class="form-label">Disciplinas (separe por vírgula)</label><input id="f_disciplina" class="form-input" maxlength="255" value="${item?.disciplina||''}" placeholder="Ex.: Matemática, Física" required><small class="text-xs" style="color:#6b7280;">Um professor pode lecionar várias disciplinas.</small></div>
            <div class="form-group"><label class="form-label">Status</label><select id="f_ativo" class="form-select"><option value="1" ${item?.ativo==1?'selected':''}>Ativo</option><option value="0" ${item?.ativo==0?'selected':''}>Inativo</option></select></div>
        `,
        save: item => ({
            id: item?.id,
            nome: document.getElementById('f_nome').value,
            email: document.getElementById('f_email').value,
            disciplina: document.getElementById('f_disciplina').value,
            ativo: document.getElementById('f_ativo').value
        })
    },
    turmas: {
        title: 'Turmas', module: 'turmas',
        columns: ['Nome','Curso','Período','Alunos','Status','Ações'],
        row: t => `
            <td class="font-medium">${t.nome}</td>
            <td>${t.curso_nome || '-'}</td>
            <td>${t.periodo}</td>
            <td>${t.total_alunos}</td>
            <td><span class="badge ${t.ativo==1?'badge-green':'badge-red'}">${t.ativo==1?'Ativa':'Inativa'}</span></td>
        `,
        form: (item, extra) => `
            <div class="form-group"><label class="form-label">Nome</label><input id="f_nome" class="form-input" value="${item?.nome||''}" required></div>
            <div class="form-group"><label class="form-label">Curso</label><select id="f_curso_id" class="form-select" required>${extra.cursos.map(c=>`<option value="${c.id}" ${item?.curso_id==c.id?'selected':''}>${c.nome}</option>`).join('')}</select></div>
            <div class="form-group"><label class="form-label">Período</label><select id="f_periodo" class="form-select"><option ${item?.periodo==='Manhã'?'selected':''}>Manhã</option><option ${item?.periodo==='Tarde'?'selected':''}>Tarde</option><option ${item?.periodo==='Integral'?'selected':''}>Integral</option></select></div>
            <div class="form-group"><label class="form-label">Status</label><select id="f_ativo" class="form-select"><option value="1" ${item?.ativo==1?'selected':''}>Ativa</option><option value="0" ${item?.ativo==0?'selected':''}>Inativa</option></select></div>
        `,
        save: item => ({
            id: item?.id,
            nome: document.getElementById('f_nome').value,
            curso_id: document.getElementById('f_curso_id').value,
            periodo: document.getElementById('f_periodo').value,
            ativo: document.getElementById('f_ativo').value
        })
    },
    cursos: {
        title: 'Cursos', module: 'cursos',
        columns: ['Nome','Disciplinas','Status','Ações'],
        row: c => {
            const disc = typeof c.disciplinas === 'string' ? JSON.parse(c.disciplinas || '[]').join(', ') : (c.disciplinas || []).join(', ');
            return `
                <td class="font-medium">${c.nome}</td>
                <td>${disc || '-'}</td>
                <td><span class="badge ${c.ativo==1?'badge-green':'badge-red'}">${c.ativo==1?'Ativo':'Inativo'}</span></td>
            `;
        },
        form: (item) => {
            const disc = typeof item?.disciplinas === 'string' ? JSON.parse(item.disciplinas || '[]').join(', ') : (item?.disciplinas || []).join(', ');
            return `
                <div class="form-group"><label class="form-label">Nome</label><input id="f_nome" class="form-input" value="${item?.nome||''}" required></div>
                <div class="form-group"><label class="form-label">Disciplinas (separadas por vírgula)</label><input id="f_disciplinas" class="form-input" value="${disc||''}"></div>
                <div class="form-group"><label class="form-label">Status</label><select id="f_ativo" class="form-select"><option value="1" ${item?.ativo==1?'selected':''}>Ativo</option><option value="0" ${item?.ativo==0?'selected':''}>Inativo</option></select></div>
            `;
        },
        save: item => ({
            id: item?.id,
            nome: document.getElementById('f_nome').value,
            disciplinas: document.getElementById('f_disciplinas').value.split(',').map(x=>x.trim()).filter(x=>x),
            ativo: document.getElementById('f_ativo').value
        })
    },
    comunicados: {
        title: 'Comunicados', module: 'comunicados',
        columns: ['Título','Data','Destino','Ações'],
        row: c => `
            <td class="font-medium">${c.titulo}</td>
            <td>${c.data}</td>
            <td><span class="badge badge-navy">${c.destino}</span></td>
        `,
        form: (item) => `
            <div class="form-group"><label class="form-label">Título</label><input id="f_titulo" class="form-input" value="${item?.titulo||''}" required></div>
            <div class="form-group"><label class="form-label">Data</label><input id="f_data" type="date" class="form-input" value="${item?.data||new Date().toISOString().split('T')[0]}" required></div>
            <div class="form-group"><label class="form-label">Destino</label><select id="f_destino" class="form-select"><option ${item?.destino==='Todos'?'selected':''}>Todos</option><option ${item?.destino==='Alunos'?'selected':''}>Alunos</option><option ${item?.destino==='Responsáveis'?'selected':''}>Responsáveis</option><option ${item?.destino==='Professores'?'selected':''}>Professores</option></select></div>
            <div class="form-group"><label class="form-label">Conteúdo</label><textarea id="f_conteudo" class="form-textarea" rows="4">${item?.conteudo||''}</textarea></div>
        `,
        save: item => ({
            id: item?.id,
            titulo: document.getElementById('f_titulo').value,
            data: document.getElementById('f_data').value,
            destino: document.getElementById('f_destino').value,
            conteudo: document.getElementById('f_conteudo').value
        })
    },
    ocorrencias: {
        title: 'Ocorrências', module: 'ocorrencias',
        columns: ['Aluno','Tipo','Descrição','Data','Ações'],
        row: o => `
            <td class="font-medium">${o.aluno_nome || '-'}</td>
            <td><span class="badge ${o.tipo==='Elogio'?'badge-green':'badge-red'}">${o.tipo}</span></td>
            <td class="text-sm">${(o.descricao||'').substring(0,50)}${(o.descricao||'').length>50?'...':''}</td>
            <td>${o.data}</td>
        `,
        form: async (item) => {
            const alunos = await API.get('alunos.list');
            const lista = alunos.ok ? alunos.data : [];
            return `
                <div class="form-group"><label class="form-label">Aluno</label><select id="f_aluno_id" class="form-select" required>${lista.map(a=>`<option value="${a.id}" ${item?.aluno_id==a.id?'selected':''}>${a.nome}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label">Tipo</label><select id="f_tipo" class="form-select"><option ${item?.tipo==='Atraso'?'selected':''}>Atraso</option><option ${item?.tipo==='Falta'?'selected':''}>Falta</option><option ${item?.tipo==='Indisciplina'?'selected':''}>Indisciplina</option><option ${item?.tipo==='Elogio'?'selected':''}>Elogio</option><option ${item?.tipo==='Outro'?'selected':''}>Outro</option></select></div>
                <div class="form-group"><label class="form-label">Data</label><input id="f_data" type="date" class="form-input" value="${item?.data||new Date().toISOString().split('T')[0]}" required></div>
                <div class="form-group"><label class="form-label">Descrição</label><textarea id="f_descricao" class="form-textarea" rows="3" required>${item?.descricao||''}</textarea></div>
                <div class="form-group"><label class="form-label">Observações</label><textarea id="f_observacoes" class="form-textarea" rows="2">${item?.observacoes||''}</textarea></div>
            `;
        },
        save: item => ({
            id: item?.id,
            aluno_id: document.getElementById('f_aluno_id').value,
            tipo: document.getElementById('f_tipo').value,
            data: document.getElementById('f_data').value,
            descricao: document.getElementById('f_descricao').value,
            observacoes: document.getElementById('f_observacoes').value
        })
    },
    atividades: {
        title: 'Atividades', module: 'atividades',
        columns: ['Título','Disciplina','Turma','Prazo','Ações'],
        row: a => `
            <td class="font-medium">${a.titulo}</td>
            <td>${a.disciplina}</td>
            <td>${a.turma_nome || '-'}</td>
            <td>${a.prazo}</td>
        `,
        form: async (item) => {
            const turmas = await API.get('turmas.list');
            const lista = turmas.ok ? turmas.data : [];
            return `
                <div class="form-group"><label class="form-label">Título</label><input id="f_titulo" class="form-input" value="${item?.titulo||''}" required></div>
                <div class="form-group"><label class="form-label">Disciplina</label><input id="f_disciplina" class="form-input" value="${item?.disciplina||''}"></div>
                <div class="form-group"><label class="form-label">Turma</label><select id="f_turma_id" class="form-select" required>${lista.map(t=>`<option value="${t.id}" ${item?.turma_id==t.id?'selected':''}>${t.nome}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label">Prazo</label><input id="f_prazo" type="date" class="form-input" value="${item?.prazo||''}" required></div>
                <div class="form-group"><label class="form-label">Descrição</label><textarea id="f_descricao" class="form-textarea" rows="3">${item?.descricao||''}</textarea></div>
            `;
        },
        save: item => ({
            id: item?.id,
            titulo: document.getElementById('f_titulo').value,
            disciplina: document.getElementById('f_disciplina').value,
            turma_id: document.getElementById('f_turma_id').value,
            prazo: document.getElementById('f_prazo').value,
            descricao: document.getElementById('f_descricao').value
        })
    },
    diario: {
        title: 'Diário de Classe', module: 'diario',
        columns: ['Data','Turma','Disciplina','Conteúdo','Ações'],
        row: d => `
            <td>${d.data}</td>
            <td>${d.turma_nome || '-'}</td>
            <td>${d.disciplina}</td>
            <td class="text-sm">${(d.conteudo||'').substring(0,40)}...</td>
        `,
        form: async (item) => {
            const turmas = await API.get('turmas.list');
            const lista = turmas.ok ? turmas.data : [];
            return `
                <div class="form-group"><label class="form-label">Data</label><input id="f_data" type="date" class="form-input" value="${item?.data||new Date().toISOString().split('T')[0]}" required></div>
                <div class="form-group"><label class="form-label">Turma</label><select id="f_turma_id" class="form-select" required>${lista.map(t=>`<option value="${t.id}" ${item?.turma_id==t.id?'selected':''}>${t.nome}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label">Disciplina</label><input id="f_disciplina" class="form-input" value="${item?.disciplina||''}" required></div>
                <div class="form-group"><label class="form-label">Conteúdo</label><textarea id="f_conteudo" class="form-textarea" rows="2" required>${item?.conteudo||''}</textarea></div>
                <div class="form-group"><label class="form-label">Resumo</label><textarea id="f_resumo" class="form-textarea" rows="2">${item?.resumo||''}</textarea></div>
                <div class="form-group"><label class="form-label">Observações</label><textarea id="f_observacoes" class="form-textarea" rows="2">${item?.observacoes||''}</textarea></div>
            `;
        },
        save: item => ({
            id: item?.id,
            data: document.getElementById('f_data').value,
            turma_id: document.getElementById('f_turma_id').value,
            disciplina: document.getElementById('f_disciplina').value,
            conteudo: document.getElementById('f_conteudo').value,
            resumo: document.getElementById('f_resumo').value,
            observacoes: document.getElementById('f_observacoes').value
        })
    },
    usuarios: {
        title: 'Usuários', module: 'usuarios',
        columns: ['Nome','E-mail','Perfil','Status','Ações'],
        row: u => `
            <td class="font-medium">${u.nome}</td>
            <td>${u.email}</td>
            <td><span class="badge badge-navy">${u.perfil}</span></td>
            <td><span class="badge ${u.ativo==1?'badge-green':'badge-red'}">${u.ativo==1?'Ativo':'Bloqueado'}</span></td>
        `,
        form: (item) => `
            <div class="form-group"><label class="form-label">Nome</label><input id="f_nome" class="form-input" value="${item?.nome||''}" required></div>
            <div class="form-group"><label class="form-label">E-mail</label><input id="f_email" type="email" class="form-input" value="${item?.email||''}" required></div>
            <div class="form-group"><label class="form-label">Perfil</label><select id="f_perfil" class="form-select"><option value="diretor" ${item?.perfil==='diretor'?'selected':''}>Diretor</option><option value="coordenador" ${item?.perfil==='coordenador'?'selected':''}>Coordenador</option><option value="professor" ${item?.perfil==='professor'?'selected':''}>Professor</option><option value="aluno" ${item?.perfil==='aluno'?'selected':''}>Aluno</option><option value="responsavel" ${item?.perfil==='responsavel'?'selected':''}>Responsável</option></select></div>
            <div class="form-group"><label class="form-label">Senha (deixe em branco para manter)</label><input id="f_senha" type="text" class="form-input"></div>
            <div class="form-group"><label class="form-label">Status</label><select id="f_ativo" class="form-select"><option value="1" ${item?.ativo==1?'selected':''}>Ativo</option><option value="0" ${item?.ativo==0?'selected':''}>Bloqueado</option></select></div>
        `,
        save: item => {
            const data = {
                id: item?.id,
                nome: document.getElementById('f_nome').value,
                email: document.getElementById('f_email').value,
                perfil: document.getElementById('f_perfil').value,
                ativo: document.getElementById('f_ativo').value
            };
            const senha = document.getElementById('f_senha').value;
            if (senha) data.senha = senha;
            return data;
        }
    }
};

async function renderCRUDList(entity) {
    const cfg = CRUD_CONFIG[entity];
    const res = await API.get(`${cfg.module}.list`);
    const data = res.ok ? res.data : [];

    return `
        <div class="flex justify-between items-center mb-4">
            <div>
                <h2 class="font-serif text-2xl font-bold text-navy">${cfg.title}</h2>
                <p class="text-sm" style="color:#6b7280;">${data.length} registro(s)</p>
            </div>
            <button class="btn btn-gold" onclick="openCRUDForm('${entity}')"><i class="fas fa-plus"></i> Novo</button>
        </div>
        <div class="table-wrap">
            <table>
                <thead><tr>${cfg.columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
                <tbody>
                    ${data.length ? data.map(item => `
                        <tr>
                            ${cfg.row(item)}
                            <td>
                                <button class="btn btn-ghost" onclick="openCRUDForm('${entity}',${item.id})"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-ghost" style="color:#ef4444;" onclick="deleteCRUDItem('${entity}',${item.id})"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('') : `<tr><td colspan="${cfg.columns.length}" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum registro.</td></tr>`}
                </tbody>
            </table>
        </div>
    `;
}

async function openCRUDForm(entity, id = null) {
    const cfg = CRUD_CONFIG[entity];
    let item = null;
    if (id) {
        const r = await API.get(`${cfg.module}.get`, { id });
        if (r.ok) item = r.data;
    }
    const [turmas, cursos] = await Promise.all([
        API.get('turmas.list'), API.get('cursos.list')
    ]);
    const extra = {
        turmas: turmas.ok ? turmas.data : [],
        cursos: cursos.ok ? cursos.data : []
    };

    const formHTML = await cfg.form(item, extra);
    openModal(id ? `Editar ${cfg.title.slice(0,-1)}` : `Novo ${cfg.title.slice(0,-1)}`, formHTML, async () => {
        const data = cfg.save(item);
        const res = await API.post(`${cfg.module}.save`, data);
        if (res.ok) {
            toast(res.msg, 'success');
            closeModal();
            renderSection();
        } else {
            toast(res.msg, 'error');
        }
    });
}

async function deleteCRUDItem(entity, id) {
    const cfg = CRUD_CONFIG[entity];
    openConfirm(`Excluir registro?`, 'Esta ação não pode ser desfeita.', async () => {
        const res = await API.delete(`${cfg.module}.delete`, { id });
        if (res.ok) { toast(res.msg); renderSection(); }
        else toast(res.msg, 'error');
    });
}
