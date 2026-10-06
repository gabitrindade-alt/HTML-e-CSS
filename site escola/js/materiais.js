async function renderMateriaisProfessor() {
    const res = await API.get('materiais.list');
    const lista = res.ok ? res.data : [];
    return `
        <div class="flex justify-between items-center mb-4">
            <div>
                <h2 class="font-serif text-2xl font-bold text-navy">Solicitação de Materiais</h2>
                <p class="text-sm" style="color:#6b7280;">Solicite materiais didáticos</p>
            </div>
            <button class="btn btn-gold" onclick="abrirFormMaterial()"><i class="fas fa-plus"></i> Nova</button>
        </div>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Material</th><th>Qtd</th><th>Justificativa</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                    ${lista.length ? lista.map(s => `
                        <tr>
                            <td class="font-medium">${s.material}</td>
                            <td>${s.quantidade}</td>
                            <td class="text-sm">${s.justificativa}</td>
                            <td>${s.data}</td>
                            <td><span class="badge ${s.status==='Aprovado'?'badge-green':(s.status==='Rejeitado'?'badge-red':'badge-yellow')}">${s.status}</span>${s.status !== 'Pendente' ? `<button class="btn btn-gold" style="margin-left:.5rem;padding:.35rem .55rem;" onclick="pendenteMat(${s.id})" title="Voltar para pendente"><i class="fas fa-undo"></i> Pendente</button>` : ''}</td>
                            <td><button class="btn btn-ghost" onclick="editarMaterial(${s.id})" title="Editar"><i class="fas fa-pen"></i></button><button class="btn btn-ghost" onclick="excluirMaterial(${s.id})" title="Excluir"><i class="fas fa-trash" style="color:#b91c1c;"></i></button></td>
                        </tr>
                    `).join('') : '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#6b7280;">Nenhuma solicitação.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

async function renderMateriaisDiretor() {
    const res = await API.get('materiais.list');
    const lista = res.ok ? res.data : [];
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Solicitações de Materiais</h2>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Professor</th><th>Material</th><th>Qtd</th><th>Justificativa</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                    ${lista.length ? lista.map(s => `
                        <tr>
                            <td>${s.professor_nome || '-'}</td>
                            <td class="font-medium">${s.material}</td>
                            <td>${s.quantidade}</td>
                            <td class="text-sm">${s.justificativa}</td>
                            <td>${s.data}</td>
                            <td><span class="badge ${s.status==='Aprovado'?'badge-green':(s.status==='Rejeitado'?'badge-red':'badge-yellow')}">${s.status}</span></td>
                            <td>
                                <select id="matStatus${s.id}" class="form-select" style="display:inline-block;width:auto;min-width:120px;padding:.4rem;margin-right:.35rem;">
                                    <option value="Pendente" ${s.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                    <option value="Aprovado" ${s.status === 'Aprovado' ? 'selected' : ''}>Aprovado</option>
                                    <option value="Rejeitado" ${s.status === 'Rejeitado' ? 'selected' : ''}>Rejeitado</option>
                                </select>
                                <button class="btn btn-ghost" onclick="alterarStatusMat(${s.id})" title="Salvar status"><i class="fas fa-save" style="color:#1d4ed8;"></i></button>
                                ${s.status === 'Pendente' ? `
                                    <button class="btn btn-ghost" onclick="aprovarMat(${s.id})"><i class="fas fa-check" style="color:#15803d;"></i></button>
                                    <button class="btn btn-ghost" onclick="rejeitarMat(${s.id})"><i class="fas fa-times" style="color:#b91c1c;"></i></button>
                                ` : '—'}
                            </td>
                        </tr>
                    `).join('') : '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#6b7280;">Nenhuma solicitação.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function abrirFormMaterial(item = null) {
    openModal(item ? 'Editar Solicitação' : 'Solicitar Material', `
        <div class="form-group"><label class="form-label">Material</label><input id="f_material" class="form-input" value="${item?.material || ''}" required></div>
        <div class="form-group"><label class="form-label">Quantidade</label><input id="f_quantidade" type="number" min="1" value="${item?.quantidade || 1}" class="form-input" required></div>
        <div class="form-group"><label class="form-label">Justificativa</label><textarea id="f_justificativa" class="form-textarea" rows="3" required>${item?.justificativa || ''}</textarea></div>
    `, async () => {
        const res = await API.post('materiais.save', {
            ...(item ? { id: item.id } : {}),
            material: document.getElementById('f_material').value,
            quantidade: document.getElementById('f_quantidade').value,
            justificativa: document.getElementById('f_justificativa').value
        });
        if (res.ok) { toast(res.msg); closeModal(); renderSection(); }
        else toast(res.msg, 'error');
    });
}

async function editarMaterial(id) {
    const res = await API.get('materiais.list');
    const item = res.ok ? res.data.find(s => Number(s.id) === Number(id)) : null;
    if (!item) return toast(res.msg || 'Solicitação não encontrada', 'error');
    abrirFormMaterial(item);
}

async function excluirMaterial(id) {
    openConfirm('Excluir solicitação?', 'Esta ação não pode ser desfeita.', async () => {
        const res = await API.delete('materiais.delete', { id });
        if (res.ok) { toast(res.msg); renderSection(); }
        else toast(res.msg, 'error');
    });
}

async function aprovarMat(id) {
    const res = await API.post('materiais.aprovar', { id });
    if (res.ok) { toast(res.msg); renderSection(); }
    else toast(res.msg, 'error');
}
async function rejeitarMat(id) {
    openConfirm('Rejeitar solicitação?', '', async () => {
        const res = await API.post('materiais.rejeitar', { id });
        if (res.ok) { toast(res.msg); renderSection(); }
        else toast(res.msg, 'error');
    });
}

async function pendenteMat(id) {
    const res = await API.post('materiais.status', { id, status: 'Pendente' });
    if (res.ok) { toast(res.msg); renderSection(); }
    else toast(res.msg, 'error');
}

async function alterarStatusMat(id) {
    const status = document.getElementById(`matStatus${id}`).value;
    const res = await API.post('materiais.status', { id, status });
    if (res.ok) { toast(res.msg); renderSection(); }
    else toast(res.msg, 'error');
}
