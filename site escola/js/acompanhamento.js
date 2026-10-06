async function renderAcompanhamento() {
    const res = await API.get('relatorios.acompanhamento');
    const alunos = res.ok ? res.data : [];
    const alerta = alunos.filter(a => a.situacao.status === 'ALERTA');
    const atencao = alunos.filter(a => a.situacao.status === 'ATENÇÃO');

    return `
        <h2 class="font-serif text-2xl font-bold text-navy mb-4">Acompanhamento Pedagógico</h2>
        <div class="grid grid-2">
            <div class="card" style="border:2px solid #fca5a5;">
                <h3 class="font-bold text-navy mb-4"><i class="fas fa-exclamation-triangle" style="color:#b91c1c;"></i> ALERTA (${alerta.length})</h3>
                <div style="max-height:400px;overflow-y:auto;">
                    ${alerta.length ? alerta.map(a => `
                        <div style="padding:0.75rem;background:#fef2f2;border-radius:0.5rem;margin-bottom:0.5rem;">
                            <p class="font-semibold text-navy">${a.nome}</p>
                            <p class="text-xs" style="color:#6b7280;">${a.turma_nome || '-'} • Média: ${a.media ? parseFloat(a.media).toFixed(1) : '-'}</p>
                            ${badgeSituacao(a.situacao)}
                        </div>
                    `).join('') : '<p style="color:#6b7280;text-align:center;padding:1rem;">Nenhum aluno.</p>'}
                </div>
            </div>
            <div class="card" style="border:2px solid #fde047;">
                <h3 class="font-bold text-navy mb-4"><i class="fas fa-exclamation-circle" style="color:#a16207;"></i> ATENÇÃO (${atencao.length})</h3>
                <div style="max-height:400px;overflow-y:auto;">
                    ${atencao.length ? atencao.map(a => `
                        <div style="padding:0.75rem;background:#fefce8;border-radius:0.5rem;margin-bottom:0.5rem;">
                            <p class="font-semibold text-navy">${a.nome}</p>
                            <p class="text-xs" style="color:#6b7280;">${a.turma_nome || '-'} • Média: ${a.media ? parseFloat(a.media).toFixed(1) : '-'}</p>
                            ${badgeSituacao(a.situacao)}
                        </div>
                    `).join('') : '<p style="color:#6b7280;text-align:center;padding:1rem;">Nenhum aluno.</p>'}
                </div>
            </div>
        </div>
    `;
}