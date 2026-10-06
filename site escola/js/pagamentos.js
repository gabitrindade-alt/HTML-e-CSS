async function renderPagamentosResp() {
    const res = await API.get('pagamentos.list');
    const pagamentos = res.ok ? res.data : [];
    const pendentes = pagamentos.filter(p => p.status === 'Pendente');
    const total = pendentes.reduce((s,p) => s+parseFloat(p.valor), 0);
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Meus Pagamentos</h2>
        ${pendentes.length ? `
        <div class="card mb-4" style="background:#fef2f2;border:1px solid #fecaca;">
            <p style="color:#b91c1c;"><strong>Você tem ${pendentes.length} pendência(s)</strong> no valor total de R$ ${total.toFixed(2).replace('.',',')}</p>
        </div>` : `
        <div class="card mb-4" style="background:#f0fdf4;border:1px solid #bbf7d0;">
            <p style="color:#15803d;"><strong>Todas as mensalidades estão em dia!</strong> ✓</p>
        </div>`}
        <div class="table-wrap">
            <table>
                <thead><tr><th>Mês</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Data Pgto</th></tr></thead>
                <tbody>
                    ${pagamentos.length ? pagamentos.map(p => `
                        <tr>
                            <td>${p.mes_referencia}</td>
                            <td class="font-bold">R$ ${parseFloat(p.valor).toFixed(2).replace('.',',')}</td>
                            <td>${p.data_vencimento}</td>
                            <td><span class="badge ${p.status==='Pago'?'badge-green':(p.status==='Cancelado'?'badge-gray':'badge-red')}">${p.status}</span></td>
                            <td>${p.data_pagamento || '-'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum pagamento.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

async function renderPagamentosDiretor() {
    const res = await API.get('pagamentos.list');
    const pagamentos = res.ok ? res.data : [];
    const pendentes = pagamentos.filter(p => p.status === 'Pendente');
    const pagos = pagamentos.filter(p => p.status === 'Pago');
    const totalPend = pendentes.reduce((s,p) => s+parseFloat(p.valor), 0);
    const totalPago = pagos.reduce((s,p) => s+parseFloat(p.valor), 0);

    return `
        <div class="flex justify-between items-center mb-4">
            <div>
                <h2 class="font-serif text-2xl font-bold text-navy">Pendências de Pagamento</h2>
                <p class="text-sm" style="color:#6b7280;">Gerencie mensalidades e envie lembretes</p>
            </div>
            <button class="btn btn-gold" onclick="abrirFormPendencia()"><i class="fas fa-plus"></i> Adicionar</button>
        </div>
        <div class="grid grid-4 mb-6">
            ${statCard('Pendente', 'R$ ' + totalPend.toFixed(2).replace('.',','), 'fa-exclamation-circle', {bg:'#fee2e2',text:'#b91c1c'})}
            ${statCard('Recebido', 'R$ ' + totalPago.toFixed(2).replace('.',','), 'fa-check-circle', {bg:'#dcfce7',text:'#15803d'})}
            ${statCard('Pendências', pendentes.length, 'fa-money-bill-wave', {bg:'#fef9c3',text:'#a16207'})}
            ${statCard('Pagos', pagos.length, 'fa-check', {bg:'#dbeafe',text:'#1d4ed8'})}
        </div>
        <div class="table-wrap">
            <table>
                <thead><tr><th>Aluno</th><th>Responsável</th><th>Mês</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                    ${pagamentos.length ? pagamentos.map(p => `
                        <tr>
                            <td class="font-medium">${p.aluno_nome || '-'}</td>
                            <td>${p.responsavel_nome || '<span style="color:#9ca3af;">—</span>'}</td>
                            <td>${p.mes_referencia}</td>
                            <td class="font-bold">R$ ${parseFloat(p.valor).toFixed(2).replace('.',',')}</td>
                            <td>${p.data_vencimento}</td>
                            <td><span class="badge ${p.status==='Pago'?'badge-green':(p.status==='Cancelado'?'badge-gray':'badge-red')}">${p.status}</span></td>
                            <td>
                                <select id="statusPag${p.id}" class="form-select" style="display:inline-block;width:auto;min-width:125px;padding:.4rem;margin-right:.35rem;">
                                    <option value="Pendente" ${p.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                    <option value="Pago" ${p.status === 'Pago' ? 'selected' : ''}>Pago</option>
                                    <option value="Cancelado" ${p.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                                </select>
                                <button class="btn btn-ghost" onclick="alterarStatusPag(${p.id})" title="Salvar status"><i class="fas fa-save" style="color:#1d4ed8;"></i></button>
                                ${p.status === 'Pago' ? '' : p.status === 'Pendente' ? `
                                    <button class="btn btn-ghost" onclick="marcarPago(${p.id})" title="Marcar pago"><i class="fas fa-check" style="color:#15803d;"></i></button>
                                    <button class="btn btn-ghost" onclick="enviarLembrete(${p.id})" title="Lembrete"><i class="fas fa-bell" style="color:#1d4ed8;"></i></button>
                                    <button class="btn btn-ghost" onclick="cancelarPag(${p.id})" title="Cancelar"><i class="fas fa-ban" style="color:#6b7280;"></i></button>
                                ` : '<span class="text-xs" style="color:#9ca3af;">—</span>'}
                            </td>
                        </tr>
                    `).join('') : '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#6b7280;">Nenhum pagamento.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

async function abrirFormPendencia() {
    const alunos = await API.get('alunos.list');
    const lista = alunos.ok ? alunos.data : [];
    openModal('Adicionar Pendência', `
        <div class="form-group"><label class="form-label">Aluno</label><select id="f_aluno_id" class="form-select" required>${lista.map(a=>`<option value="${a.id}">${a.nome} - ${a.matricula}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Mês</label><input id="f_mes" type="month" class="form-input" value="${new Date().toISOString().slice(0,7)}" required></div>
        <div class="form-group"><label class="form-label">Valor (R$)</label><input id="f_valor" type="number" step="0.01" class="form-input" required></div>
        <div class="form-group"><label class="form-label">Vencimento</label><input id="f_venc" type="date" class="form-input" required></div>
    `, async () => {
        const res = await API.post('pagamentos.save', {
            aluno_id: document.getElementById('f_aluno_id').value,
            mes_referencia: document.getElementById('f_mes').value,
            valor: document.getElementById('f_valor').value,
            data_vencimento: document.getElementById('f_venc').value
        });
        if (res.ok) { toast(res.msg); closeModal(); renderSection(); }
        else toast(res.msg, 'error');
    });
}

async function marcarPago(id) {
    const res = await API.post('pagamentos.marcar_pago', { id });
    if (res.ok) { toast(res.msg); renderSection(); }
    else toast(res.msg, 'error');
}
async function marcarPendentePag(id) {
    const res = await API.post('pagamentos.marcar_pendente', { id });
    if (res.ok) { toast(res.msg); renderSection(); }
    else toast(res.msg, 'error');
}
async function alterarStatusPag(id) {
    const status = document.getElementById(`statusPag${id}`).value;
    const res = await API.post('pagamentos.status', { id, status });
    if (res.ok) { toast(res.msg); renderSection(); }
    else toast(res.msg, 'error');
}
async function enviarLembrete(id) {
    const res = await API.post('pagamentos.lembrete', { id });
    if (res.ok) toast(res.msg);
    else toast(res.msg, 'error');
}
async function cancelarPag(id) {
    openConfirm('Cancelar pendência?', 'A pendência será marcada como cancelada.', async () => {
        const res = await API.post('pagamentos.cancelar', { id });
        if (res.ok) { toast(res.msg); renderSection(); }
        else toast(res.msg, 'error');
    });
}
