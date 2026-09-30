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
                <thead><tr><th>Material</th><th>Qtd</th><th>Justificativa</th><th>Data</th><th>Status</th></tr></thead>
                <tbody>
                    ${lista.length ? lista.map(s => `
                        <tr>
                            <td class="font-medium">${s.material}</td>
                            <td>${s.quantidade}</td>
                            <td class="text-sm">${s.justificativa}</td>
                            <td>${s.data}</td>
                            <td><span class="badge ${s.status==='Aprovado'?'badge-green':(s.status==='Rejeitado'?'badge-red':'badge-yellow')}">${s.status}</span></td>
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

function abrirFormMaterial() {
    openModal('Solicitar Material', `
        <div class="form-group"><label class="form-label">Material</label><input id="f_material" class="form-input" required></div>
        <div class="form-group"><label class="form-label">Quantidade</label><input id="f_quantidade" type="number" min="1" value="1" class="form-input" required></div>
        <div class="form-group"><label class="form-label">Justificativa</label><textarea id="f_justificativa" class="form-textarea" rows="3" required></textarea></div>
    `, async () => {
        const res = await API.post('materiais.save', {
            material: document.getElementById('f_material').value,
            quantidade: document.getElementById('f_quantidade').value,
            justificativa: document.getElementById('f_justificativa').value
        });
        if (res.ok) { toast(res.msg); closeModal(); renderSection(); }
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