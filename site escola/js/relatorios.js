async function renderRelatorios() {
    const res = await API.get('relatorios.dashboard');
    const pagamentos = res.ok ? res.data.pagamentos : {};
    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Relatórios</h2>
        <p class="text-sm mb-6" style="color:#6b7280;">Gere relatórios em PDF.</p>
        <div class="grid grid-2">
            <div class="card">
                <h3 class="font-bold text-navy mb-4"><i class="fas fa-chart-bar text-gold"></i> Relatórios Gerais</h3>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                    ${['Alunos','Frequência','Desempenho','Ocorrências','Comunicados'].map(r => `
                        <button class="btn btn-ghost" style="justify-content:space-between;border:1px solid #e5e7eb;" onclick="gerarRelatorio('${r}')">
                            <span>${r}</span><i class="fas fa-file-pdf" style="color:#ef4444;"></i>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="card">
                <h3 class="font-bold text-navy mb-4"><i class="fas fa-money-bill-wave text-gold"></i> Relatórios de Pagamentos</h3>
                <div class="grid grid-2 mb-4">
                    ${statCard('Total pendente', 'R$ ' + Number(pagamentos.pendente || 0).toFixed(2).replace('.',','), 'fa-exclamation-circle', {bg:'#fee2e2',text:'#b91c1c'})}
                    ${statCard('Total recebido', 'R$ ' + Number(pagamentos.recebido || 0).toFixed(2).replace('.',','), 'fa-check-circle', {bg:'#dcfce7',text:'#15803d'})}
                    ${statCard('Pagamentos pendentes', pagamentos.qtd_pend || 0, 'fa-clock', {bg:'#fef9c3',text:'#a16207'})}
                    ${statCard('Pagamentos pagos', pagamentos.qtd_pago || 0, 'fa-check', {bg:'#dbeafe',text:'#1d4ed8'})}
                </div>
                <button class="btn btn-gold" onclick="gerarRelatorio('Pagamentos')"><i class="fas fa-file-pdf"></i> Gerar PDF de pagamentos</button>
            </div>
        </div>
    `;
}

async function gerarRelatorio(tipo) {
    const data = await API.get('relatorios.dashboard');
    const dash = data.ok ? data.data : {};
    let html = `<h2>Relatório: ${tipo}</h2><p>Emitido em: ${new Date().toLocaleDateString('pt-BR')}</p>`;
    html += `<p>Total de alunos: ${dash.alunos || 0}</p>`;
    html += `<p>Total de professores: ${dash.professores || 0}</p>`;
    html += `<p>Total de turmas: ${dash.turmas || 0}</p>`;
    if (tipo === 'Pagamentos') {
        const p = dash.pagamentos || {};
        html += '<h3>Resumo de pagamentos</h3><table><thead><tr><th>Status</th><th>Quantidade/valor</th></tr></thead><tbody>';
        html += `<tr><td>Pendente</td><td>${p.qtd_pend || 0} pagamentos — R$ ${Number(p.pendente || 0).toFixed(2).replace('.', ',')}</td></tr>`;
        html += `<tr><td>Pago</td><td>${p.qtd_pago || 0} pagamentos — R$ ${Number(p.recebido || 0).toFixed(2).replace('.', ',')}</td></tr>`;
        html += `<tr><td>Cancelado</td><td>${p.qtd_canc || 0} pagamentos — R$ ${Number(p.cancelado || 0).toFixed(2).replace('.', ',')}</td></tr>`;
        html += '</tbody></table>';
    }
    imprimirPDF(html);
}

function imprimirPDF(conteudo) {
    const w = window.open('', '_blank');
    w.document.write(`
        <html><head><title>Relatório - Colégio L'Avenir</title>
        <style>
            body { font-family: Arial; padding: 40px; color: #0F2A4A; }
            h1 { color: #0F2A4A; border-bottom: 3px solid #F2C230; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #0F2A4A; color: white; padding: 8px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        </style></head><body>
        <h1>Colégio L'Avenir</h1>
        <p><em>Valores que permanecem, conhecimento que transforma.</em></p>
        ${conteudo}
        </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
    toast('Relatório gerado!', 'info');
}
