const API = {
    async request(action, method = 'GET', data = null) {
        const url = `php/api.php?action=${action}`;
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (data && method !== 'GET') opts.body = JSON.stringify(data);
        if (location.protocol === 'file:') {
            return { ok: false, msg: 'Abra o sistema pelo servidor local (ex.: http://localhost/site-escola/). O cadastro precisa acessar a API PHP e o banco de dados.' };
        }
        try {
            const res = await fetch(url, opts);
            const body = await res.text();
            try {
                const result = JSON.parse(body);
                if (!res.ok && result && !result.msg) result.msg = `Falha na API (HTTP ${res.status})`;
                return result;
            } catch (_) {
                console.error('Resposta inesperada da API:', res.status, body.slice(0, 500));
                return { ok: false, msg: res.status === 404
                    ? `A API não foi encontrada (HTTP 404): ${new URL(url, location.href).pathname}. Confira se abriu a cópia do site dentro da pasta do Apache (htdocs).`
                    : res.status >= 500
                        ? `O PHP/Apache retornou uma página de erro (HTTP ${res.status}). Confira o log do PHP/Apache.`
                        : `A API respondeu em formato inesperado (HTTP ${res.status}). Confira o caminho do site e se o Apache está processando arquivos PHP.` };
            }
        } catch (e) {
            console.error('Falha ao acessar a API:', e);
            return { ok: false, msg: 'Não foi possível conectar à API. Inicie o Apache no XAMPP e abra o site por http://localhost/..., não diretamente pelo arquivo.' };
        }
    },
    get(action, params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(qs ? `${action}&${qs}` : action, 'GET');
    },
    post(action, data = {}) { return this.request(action, 'POST', data); },
    put(action, data = {}) { return this.request(action, 'PUT', data); },
    delete(action, data = {}) { return this.request(action, 'DELETE', data); }
};
