async function renderMensagens() {
    const res = await API.get('mensagens.list');
    const mensagens = res.ok ? res.data : [];
    const myKey = `${currentUser.perfil}:${currentUser.ref_id || currentUser.id}`;

    return `
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-serif text-2xl font-bold text-navy">Minhas Mensagens</h2>
            <button class="btn btn-gold" onclick="abrirNovaMensagem()"><i class="fas fa-plus"></i> Nova</button>
        </div>
        <div class="card" style="padding:0;">
            ${mensagens.length ? mensagens.map(m => {
                const isFrom = (m.de_tipo === currentUser.perfil && m.de_id == (currentUser.ref_id || currentUser.id));
                const other = isFrom ? m.para_nome : m.de_nome;
                return `
                <div onclick="verMensagem(${m.id})" style="padding:1rem;border-bottom:1px solid #f1f5f9;cursor:pointer;${!m.lida && !isFrom ? 'background:#eff6ff;' : ''}">
                    <div class="flex justify-between">
                        <div>
                            <span class="text-xs font-bold" style="color:${isFrom?'#15803d':'#1d4ed8'};">${isFrom?'Para:':'De:'}</span>
                            <span class="font-semibold text-navy">${other}</span>
                            ${!m.lida && !isFrom ? '<span style="display:inline-block;width:8px;height:8px;background:#3b82f6;border-radius:9999px;margin-left:6px;"></span>' : ''}
                        </div>
                        <span class="text-xs" style="color:#9ca3af;">${m.data}</span>
                    </div>
                    <h4 class="font-bold text-navy mt-1">${m.assunto}</h4>
                    <p class="text-sm" style="color:#6b7280;">${(m.conteudo||'').substring(0,100)}${(m.conteudo||'').length>100?'...':''}</p>
                </div>`;
            }).join('') : '<p style="padding:2rem;text-align:center;color:#6b7280;">Nenhuma mensagem.</p>'}
        </div>
    `;
}

async function verMensagem(id) {
    const res = await API.get('mensagens.list');
    const m = (res.ok ? res.data : []).find(x => x.id == id);
    if (!m) return;

    const isToMe = (m.para_tipo === currentUser.perfil && m.para_id == (currentUser.ref_id || currentUser.id));
    if (isToMe && !m.lida) {
        await API.post('mensagens.mark_read', { id });
    }

    openModal(m.assunto, `
        <div style="margin-bottom:1rem;">
            <p class="text-sm"><strong>De:</strong> ${m.de_nome}</p>
            <p class="text-sm"><strong>Para:</strong> ${m.para_nome}</p>
            <p class="text-xs" style="color:#9ca3af;">${m.data}</p>
        </div>
        <div class="card" style="background:#f9fafb;">${m.conteudo}</div>
    `);
}

async function abrirNovaMensagem() {
    const destinatarios = [];
    if (['aluno','responsavel'].includes(currentUser.perfil)) {
        const profs = await API.get('professores.list');
        (profs.ok ? profs.data : []).forEach(p => destinatarios.push({tipo:'professor',id:p.id,nome:`Prof. ${p.nome}`}));
        destinatarios.push({tipo:'diretor',id:1,nome:'Diretor(a)'});
        destinatarios.push({tipo:'coordenador',id:2,nome:'Coordenador(a)'});
    } else {
        const alunos = await API.get('alunos.list');
        (alunos.ok ? alunos.data : []).forEach(a => destinatarios.push({tipo:'aluno',id:a.id,nome:`Aluno: ${a.nome}`}));
    }

    openModal('Nova Mensagem', `
        <div class="form-group"><label class="form-label">Para</label><select id="f_para_tipo" class="form-select">${destinatarios.map(d=>`<option value="${d.tipo}" data-id="${d.id}">${d.nome}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Assunto</label><input id="f_assunto" class="form-input" required></div>
        <div class="form-group"><label class="form-label">Mensagem</label><textarea id="f_conteudo" class="form-textarea" rows="5" required></textarea></div>
    `, async () => {
        const sel = document.getElementById('f_para_tipo');
        const para_id = sel.options[sel.selectedIndex].dataset.id;
        const res = await API.post('mensagens.send', {
            para_tipo: sel.value,
            para_id: para_id,
            assunto: document.getElementById('f_assunto').value,
            conteudo: document.getElementById('f_conteudo').value
        });
        if (res.ok) { toast(res.msg); closeModal(); renderSection(); }
        else toast(res.msg, 'error');
    });
}