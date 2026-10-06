async function renderSidebar() {
    const menu = MENUS[currentUser.perfil];
    const roleLabels = { diretor: 'Painel administrativo', coordenador: 'Painel pedagógico', professor: 'Professor', aluno: 'Aluno', responsavel: 'Responsável' };
    const avatar = currentUser.nome.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = avatar;
    document.getElementById('userName').textContent = currentUser.nome;
    document.getElementById('userRole').textContent = currentUser.perfil;
    document.getElementById('userInfo').classList.remove('hidden');

    const unread = await API.get('mensagens.count_unread');
    const badge = document.getElementById('unreadBadge');
    if (unread.ok && unread.data.count > 0) {
        badge.textContent = unread.data.count;
        badge.classList.remove('hidden');
    }

    document.getElementById('sidebar').innerHTML = `
        <div class="sidebar-header">
            <div class="flex items-center gap-3">
                <img class="brand-logo brand-logo-sidebar" src="assets/lavenir-logo.jpeg" alt="Logo oficial do Colégio L'Avenir">
                <div>
                    <h1 class="font-serif font-bold text-lg">L'Avenir</h1>
                    <p class="text-xs" style="color:#9ca3af;text-transform:uppercase;">${roleLabels[currentUser.perfil] || 'Portal escolar'}</p>
                </div>
            </div>
        </div>
        <nav class="sidebar-nav">
            ${menu.map(item => `
                <button class="sidebar-item ${currentSection===item?'active':''}" data-section="${item}" onclick="navigate('${item}')">
                    <i class="fas ${ICONS[item]}"></i>
                    <span>${LABELS[item]}</span>
                </button>
            `).join('')}
        </nav>
        <div style="padding:1rem;border-top:1px solid rgba(255,255,255,0.1);">
            <button class="sidebar-item" onclick="logout()" style="color:#fca5a5;">
                <i class="fas fa-sign-out-alt"></i> Sair
            </button>
        </div>
    `;
}

function openModal(title, contentHTML, onSave) {
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="font-serif text-xl font-bold text-navy">${title}</h3>
                    <button onclick="closeModal()" style="background:none;border:none;cursor:pointer;font-size:1.25rem;"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">${contentHTML}</div>
                ${onSave ? `
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
                    <button class="btn btn-gold" onclick="window._modalSave()">Salvar</button>
                </div>` : ''}
            </div>
        </div>
    `;
    window._modalSave = onSave;
}
function closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
    window._modalSave = null;
}
function openConfirm(title, message, onConfirm) {
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal-overlay">
            <div class="modal" style="max-width:24rem;">
                <div class="modal-body text-center">
                    <div style="width:3.5rem;height:3.5rem;background:#fee2e2;border-radius:9999px;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                        <i class="fas fa-exclamation-triangle" style="color:#ef4444;font-size:1.5rem;"></i>
                    </div>
                    <h3 class="font-serif text-xl font-bold text-navy mb-2">${title}</h3>
                    <p class="text-sm" style="color:#6b7280;">${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
                    <button class="btn btn-danger" id="confirmBtn">Confirmar</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('confirmBtn').onclick = () => { onConfirm(); closeModal(); };
}

function statCard(label, value, icon, color) {
    return `
    <div class="stat-card">
        <div class="icon" style="background:${color.bg};color:${color.text};"><i class="fas ${icon}"></i></div>
        <div>
            <p class="label">${label}</p>
            <p class="value">${value}</p>
        </div>
    </div>`;
}

function badgeSituacao(sit) {
    const cores = { red:'badge-red', yellow:'badge-yellow', green:'badge-green' };
    const icons = { red:'fa-exclamation-triangle', yellow:'fa-exclamation-circle', green:'fa-check-circle' };
    return `<span class="badge ${cores[sit.cor]}" title="${sit.msg}"><i class="fas ${icons[sit.cor]}"></i>${sit.status}</span>`;
}
