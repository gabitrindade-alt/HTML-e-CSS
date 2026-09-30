async function renderRelatorios() {
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