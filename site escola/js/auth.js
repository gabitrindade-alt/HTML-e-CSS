let currentUser = null;

async function loadSession() {
    const res = await API.get('auth.me');
    if (res.ok) {
        currentUser = res.data;
        return true;
    }
    location.href = 'login.html';
    return false;
}

async function logout() {
    await API.post('auth.logout');
    location.href = 'index.html';
}

function toast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (type === 'error') container.querySelectorAll('.toast.error').forEach(existing => existing.remove());
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle', warning:'fa-exclamation-triangle' };
    t.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; setTimeout(() => t.remove(), 300); }, 3000);
}
