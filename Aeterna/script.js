/* =========================================================================
   AETERNA BEAUTY — lógica do sistema
   =========================================================================
   ESTRUTURA DE BANCO DE DADOS DE REFERÊNCIA
   Todo o "DB" abaixo é um objeto em memória que espelha, tabela por tabela,
   o schema relacional pensado para este sistema. A ideia é que, na hora de
   ligar isso a um banco de verdade (Postgres, MySQL, Supabase etc.), essas
   mesmas tabelas e campos sejam usados quase 1:1.

   CREATE TABLE usuarios (
     id            INTEGER PRIMARY KEY AUTOINCREMENT,
     nome          VARCHAR(120) NOT NULL,
     telefone      VARCHAR(20)  NOT NULL,
     email         VARCHAR(120) NOT NULL UNIQUE,
     usuario       VARCHAR(60)  UNIQUE,          -- login alternativo (usado pela equipe)
     senha_hash    VARCHAR(255) NOT NULL,        -- em produção: hash (bcrypt/argon2), nunca texto puro
     papel         ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
     criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE servicos (
     id            INTEGER PRIMARY KEY AUTOINCREMENT,
     categoria     VARCHAR(60)   NOT NULL,
     nome          VARCHAR(120)  NOT NULL,
     preco         DECIMAL(10,2) NOT NULL,
     ativo         BOOLEAN NOT NULL DEFAULT TRUE
   );

   CREATE TABLE profissionais (
     id            INTEGER PRIMARY KEY AUTOINCREMENT,
     nome          VARCHAR(120) NOT NULL,
     especialidade VARCHAR(120) NOT NULL,
     ativo         BOOLEAN NOT NULL DEFAULT TRUE
   );

   CREATE TABLE profissional_servico (            -- relação N:N
     profissional_id INTEGER NOT NULL REFERENCES profissionais(id),
     servico_id       INTEGER NOT NULL REFERENCES servicos(id),
     PRIMARY KEY (profissional_id, servico_id)
   );

   CREATE TABLE horario_funcionamento (
     id              INTEGER PRIMARY KEY AUTOINCREMENT,
     dia_semana      TINYINT NOT NULL,             -- 0=domingo ... 6=sábado
     aberto          BOOLEAN NOT NULL DEFAULT FALSE,
     hora_abertura   TINYINT,                       -- hora cheia, ex: 9
     hora_fechamento TINYINT                        -- hora cheia, ex: 19
   );

   CREATE TABLE agendamentos (
     id               INTEGER PRIMARY KEY AUTOINCREMENT,
     cliente_id       INTEGER REFERENCES usuarios(id),   -- NULL = cliente avulso (cadastrado pela equipe)
     cliente_nome     VARCHAR(120) NOT NULL,
     cliente_telefone VARCHAR(20)  NOT NULL,
     servico_id       INTEGER NOT NULL REFERENCES servicos(id),
     profissional_id  INTEGER NOT NULL REFERENCES profissionais(id),
     data             DATE NOT NULL,
     horario          TIME NOT NULL,
     valor            DECIMAL(10,2) NOT NULL,
     status           ENUM('confirmado','cancelado') NOT NULL DEFAULT 'confirmado',
     criado_em        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
     UNIQUE (profissional_id, data, horario)             -- impede conflito de horário
   );
   ========================================================================= */
(function(){
  "use strict";

  /* ---------------------------------------------------------
     "BANCO DE DADOS" EM MEMÓRIA
  --------------------------------------------------------- */
  const DB = {
    usuarios: [],
    servicos: [],
    profissionais: [],
    profissional_servico: [],
    horario_funcionamento: [],
    agendamentos: [],
    _seq: { usuarios: 1, servicos: 1, profissionais: 1, agendamentos: 1 },
  };

  function dbInsert(tabela, registro){
    registro.id = DB._seq[tabela]++;
    DB[tabela].push(registro);
    return registro;
  }
  function dbFind(tabela, id){ return DB[tabela].find(r => r.id === id); }
  function dbWhere(tabela, pred){ return DB[tabela].filter(pred); }
  function dbDelete(tabela, id){ const i = DB[tabela].findIndex(r => r.id === id); if(i > -1) DB[tabela].splice(i,1); }

  /* Consultas de domínio (equivalentes a JOINs simples) */
  function servicoPorId(id){ return dbFind('servicos', id); }
  function profissionalPorId(id){ return dbFind('profissionais', id); }
  function profissionaisDoServico(servicoId){
    const ids = dbWhere('profissional_servico', r => r.servico_id === servicoId).map(r => r.profissional_id);
    return DB.profissionais.filter(p => ids.includes(p.id) && p.ativo);
  }
  function servicosDoProfissional(profissionalId){
    const ids = dbWhere('profissional_servico', r => r.profissional_id === profissionalId).map(r => r.servico_id);
    return DB.servicos.filter(s => ids.includes(s.id));
  }
  function horarioDoDia(diaSemana){ return DB.horario_funcionamento.find(h => h.dia_semana === diaSemana); }

  /* ---------------------------------------------------------
     SEED — dados iniciais (conforme documentação do projeto)
  --------------------------------------------------------- */
  function seedDatabase(){
    const servicosSeed = [
      ['Cabelo','Corte feminino',60], ['Cabelo','Escova',45], ['Cabelo','Hidratação',50],
      ['Cabelo','Progressiva',180], ['Cabelo','Coloração',150],
      ['Unhas','Manicure',30], ['Unhas','Pedicure',35], ['Unhas','Manicure + Pedicure',60], ['Unhas','Alongamento de unhas',120],
      ['Sobrancelhas','Design de sobrancelhas',35], ['Sobrancelhas','Design com henna',45],
      ['Maquiagem','Maquiagem social',100], ['Maquiagem','Maquiagem para eventos',130],
    ];
    servicosSeed.forEach(([categoria, nome, preco]) => dbInsert('servicos', { categoria, nome, preco, ativo:true }));

    const profissionaisSeed = [
      ['Ana','Cabeleireira', ['Corte feminino','Escova','Hidratação','Progressiva','Coloração']],
      ['Beatriz','Manicure e Nail Designer', ['Manicure','Pedicure','Manicure + Pedicure','Alongamento de unhas']],
      ['Camila','Designer de Sobrancelhas', ['Design de sobrancelhas','Design com henna']],
      ['Daniela','Maquiadora', ['Maquiagem social','Maquiagem para eventos']],
    ];
    profissionaisSeed.forEach(([nome, especialidade, servicosNomes]) => {
      const pro = dbInsert('profissionais', { nome, especialidade, ativo:true });
      servicosNomes.forEach(nomeServico => {
        const svc = DB.servicos.find(s => s.nome === nomeServico);
        if(svc) dbInsert('profissional_servico', { profissional_id: pro.id, servico_id: svc.id });
      });
    });

    // dia_semana: 0=domingo ... 6=sábado — aberto de terça(2) a sábado(6)
    for(let d = 0; d <= 6; d++){
      const aberto = d >= 2 && d <= 6;
      dbInsert('horario_funcionamento', { dia_semana: d, aberto, hora_abertura: aberto ? 9 : null, hora_fechamento: aberto ? 19 : null });
    }

    // conta administrativa da equipe
    dbInsert('usuarios', {
      nome:'Gaby', telefone:'(11) 90000-0000', email:'gaby@aeternabeauty.com',
      usuario:'gaby', senha_hash:'1234', papel:'admin',
      criado_em: new Date().toISOString(),
    });

    // cliente de demonstração + agendamentos de exemplo
    const demo = dbInsert('usuarios', {
      nome:'Marina Alves', telefone:'(11) 99888-1234', email:'marina@exemplo.com',
      usuario:null, senha_hash:'123456', papel:'cliente',
      criado_em: new Date().toISOString(),
    });
    const upcoming = getUpcomingDates(6);
    const ana = DB.profissionais.find(p => p.nome === 'Ana');
    const corte = DB.servicos.find(s => s.nome === 'Corte feminino');
    const escova = DB.servicos.find(s => s.nome === 'Escova');
    if(upcoming[0]) dbInsert('agendamentos', {
      cliente_id: demo.id, cliente_nome: demo.nome, cliente_telefone: demo.telefone,
      servico_id: corte.id, profissional_id: ana.id, data: isoDate(upcoming[0]), horario:'14:00',
      valor: corte.preco, status:'confirmado', criado_em: new Date().toISOString(),
    });
    if(upcoming[2]) dbInsert('agendamentos', {
      cliente_id: demo.id, cliente_nome: demo.nome, cliente_telefone: demo.telefone,
      servico_id: escova.id, profissional_id: ana.id, data: isoDate(upcoming[2]), horario:'10:00',
      valor: escova.preco, status:'confirmado', criado_em: new Date().toISOString(),
    });
  }

  /* ---------------------------------------------------------
     ESTADO DE SESSÃO / UI (não é "banco", é só a tela atual)
  --------------------------------------------------------- */
  const state = {
    currentUser: null,
    booking: { step:1, serviceId:null, professionalId:null, date:null, time:null },
    pendingAfterAuth: null,
    confirmAction: null,
    adminTab: 'dashboard',
    adminNewAppt: { clientId:'avulso', name:'', phone:'', serviceId:null, professionalId:null, date:null, time:null },
    servicesFilter: '',
    testimonialIndex: 0,
  };

  const TESTIMONIALS = [
    { quote:'Marquei em dois minutos pelo celular e não perdi mais nenhum horário. Muito mais tranquilo que combinar tudo por mensagem.', author:'Beatriz R., cliente há 2 anos' },
    { quote:'Adoro poder ver o preço de cada serviço antes de agendar. Nunca tem surpresa na hora de pagar.', author:'Juliana M., cliente fiel' },
    { quote:'A Ana é maravilhosa com cabelo cacheado. O sistema novo deixou tudo mais organizado, recomendo demais.', author:'Camila S., cliente desde 2023' },
  ];

  /* ---------------------------------------------------------
     HELPERS
  --------------------------------------------------------- */
  const $  = (sel, ctx) => (ctx||document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx||document).querySelectorAll(sel));
  const pad = n => String(n).padStart(2,'0');
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const money = v => 'R$ ' + v.toFixed(2).replace('.', ',');

  const DOW_LABELS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const MONTH_LABELS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  function formatDateLabel(iso){
    const [y,m,d] = iso.split('-').map(Number);
    const dt = new Date(y, m-1, d);
    return `${pad(d)} ${MONTH_LABELS[m-1].charAt(0).toUpperCase()+MONTH_LABELS[m-1].slice(1)} · ${DOW_LABELS[dt.getDay()]}`;
  }

  function showToast(msg, type){
    const region = $('#toast-region');
    if(!region) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    region.appendChild(el);
    setTimeout(()=>{ el.remove(); }, 4200);
  }

  /* ---------------------------------------------------------
     TEMA (MODO ESCURO / CLARO) - ADICIONADO PARA CORRIGIR O MODO ESCURO
  --------------------------------------------------------- */
  function initTheme() {
    const themeToggle = $('#theme-toggle');
    if (!themeToggle) return;
    const savedTheme = localStorage.getItem('aeterna-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('aeterna-theme', newTheme);
      themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
  }

  /* ---------------------------------------------------------
     NAVEGAÇÃO ENTRE PÁGINAS
  --------------------------------------------------------- */
  function goToPage(pageId, scrollTo){
    $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === pageId));
    try{ window.scrollTo({top:0, behavior: scrollTo ? 'auto' : 'smooth'}); }catch(e){}
    const nav = $('#main-nav'); if(nav) nav.classList.remove('open');
    const toggle = $('#nav-toggle'); if(toggle) toggle.setAttribute('aria-expanded','false');

    if(pageId === 'book') renderBooking();
    if(pageId === 'appointments') renderAppointments();
    if(pageId === 'admin') renderAdmin();

    if(scrollTo){
      const run = ()=>{
        const el = document.getElementById(scrollTo);
        if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
      };
      if(typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
      else setTimeout(run, 0);
    }
  }

  document.addEventListener('click', (e)=>{
    const navBtn = e.target.closest('[data-nav]');
    if(navBtn) goToPage(navBtn.dataset.nav, navBtn.dataset.scroll);
  });

  const navToggle = $('#nav-toggle');
  if(navToggle) navToggle.addEventListener('click', ()=>{
    const nav = $('#main-nav');
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  /* ---------------------------------------------------------
     AUTENTICAÇÃO — login único (cliente ou administradora)
  --------------------------------------------------------- */
  function refreshAuthUI(){
    const chip = $('#user-chip');
    const loginBtn = $('#btn-login');
    const registerBtn = $('#btn-register');
    const logoutBtn = $('#btn-logout');
    if(!chip || !loginBtn || !registerBtn || !logoutBtn) return;
    if(state.currentUser){
      const label = state.currentUser.papel === 'admin' ? 'Gaby (equipe)' : state.currentUser.nome.split(' ')[0];
      chip.textContent = 'Olá, ' + label;
      chip.classList.remove('hidden');
      loginBtn.classList.add('hidden');
      registerBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
    } else {
      chip.classList.add('hidden');
      loginBtn.classList.remove('hidden');
      registerBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
    }
  }

  function openModal(id){
    $('#modal-overlay').classList.remove('hidden');
    $$('.modal').forEach(m => m.classList.toggle('open', m.id === id));
  }
  function closeModals(){
    $('#modal-overlay').classList.add('hidden');
    $$('.modal').forEach(m => m.classList.remove('open'));
    $('#login-error').classList.add('hidden');
    $('#register-error').classList.add('hidden');
  }
  $('#modal-overlay').addEventListener('click', (e)=>{ if(e.target.id === 'modal-overlay') closeModals(); });
  $$('[data-close-modal]').forEach(b => b.addEventListener('click', closeModals));
  $$('[data-switch-modal]').forEach(b => b.addEventListener('click', ()=> openModal('modal-' + b.dataset.switchModal)));

  $('#btn-login').addEventListener('click', ()=> openModal('modal-login'));
  $('#btn-register').addEventListener('click', ()=> openModal('modal-register'));
  $('#btn-appt-login').addEventListener('click', ()=> openModal('modal-login'));
  $('#btn-appt-register').addEventListener('click', ()=> openModal('modal-register'));
  $('#admin-gate-login').addEventListener('click', ()=>{ state.pendingAfterAuth = ()=> goToPage('admin'); openModal('modal-login'); });

  function doLogout(){
    state.currentUser = null;
    refreshAuthUI();
    showToast('Você saiu da sua conta.');
    renderAppointments();
    if($('#page-admin').classList.contains('active')) renderAdmin();
  }
  $('#btn-logout').addEventListener('click', doLogout);
  $('#btn-admin-logout').addEventListener('click', ()=>{ doLogout(); goToPage('home'); });

  $('#login-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const input = $('#login-email').value.trim().toLowerCase();
    const pass = $('#login-password').value;
    const user = DB.usuarios.find(u =>
      (u.email.toLowerCase() === input || (u.usuario && u.usuario.toLowerCase() === input)) &&
      u.senha_hash === pass
    );
    if(!user){
      $('#login-error').textContent = 'Usuário/e-mail ou senha incorretos.';
      $('#login-error').classList.remove('hidden');
      return;
    }
    state.currentUser = user;
    refreshAuthUI();
    closeModals();
    showToast(user.papel === 'admin' ? 'Bem-vinda, Gaby!' : 'Login realizado com sucesso.', 'success');
    e.target.reset();
    if(state.pendingAfterAuth){ const cb = state.pendingAfterAuth; state.pendingAfterAuth = null; cb(); }
    else { renderAppointments(); renderBooking(); }
  });

  $('#register-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const nome = $('#register-name').value.trim();
    const telefone = $('#register-phone').value.trim();
    const email = $('#register-email').value.trim();
    const senha_hash = $('#register-password').value;

    if(DB.usuarios.some(u => u.email.toLowerCase() === email.toLowerCase())){
      $('#register-error').textContent = 'Já existe uma conta com este e-mail.';
      $('#register-error').classList.remove('hidden');
      return;
    }
    const user = dbInsert('usuarios', { nome, telefone, email, usuario:null, senha_hash, papel:'cliente', criado_em: new Date().toISOString() });
    state.currentUser = user;
    refreshAuthUI();
    closeModals();
    showToast('Conta criada! Bem-vinda(o), ' + nome.split(' ')[0] + '.', 'success');
    e.target.reset();
    if(state.pendingAfterAuth){ const cb = state.pendingAfterAuth; state.pendingAfterAuth = null; cb(); }
    else { renderAppointments(); renderBooking(); }
  });

  /* ---------------------------------------------------------
     CONFIRM MODAL GENÉRICO
  --------------------------------------------------------- */
  function askConfirm(title, message, onAccept){
    $('#confirm-title').textContent = title;
    $('#confirm-message').textContent = message;
    state.confirmAction = onAccept;
    openModal('modal-confirm');
  }
  $('#confirm-accept').addEventListener('click', ()=>{
    const action = state.confirmAction;
    closeModals();
    if(action) action();
  });
  $('#confirm-cancel').addEventListener('click', closeModals);

  /* ---------------------------------------------------------
     CONTADORES ANIMADOS
  --------------------------------------------------------- */
  function animateCount(el){
    const target = Number(el.dataset.count || '0');
    const duration = 900;
    const start = performance.now();
    function tick(now){
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if(progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    if(typeof requestAnimationFrame === 'function') requestAnimationFrame(tick);
    else el.textContent = target;
  }

  function initRevealAndCounters(){
    const revealTargets = $$('.reveal');
    const countTargets = $$('[data-count]');
    if(!('IntersectionObserver' in window)){
      revealTargets.forEach(el => el.classList.add('in-view'));
      countTargets.forEach(animateCount);
      return;
    }
    const revealObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target); } });
    }, { threshold: 0.12 });
    revealTargets.forEach(el => revealObserver.observe(el));

    const countObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry => { if(entry.isIntersecting){ animateCount(entry.target); countObserver.unobserve(entry.target); } });
    }, { threshold: 0.4 });
    countTargets.forEach(el => countObserver.observe(el));
  }

  /* ---------------------------------------------------------
     HOME — SERVIÇOS
  --------------------------------------------------------- */
  function renderServicesList(){
    const wrap = $('#services-list');
    const filter = state.servicesFilter.trim().toLowerCase();
    const categorias = [...new Set(DB.servicos.map(s => s.categoria))];
    let html = '';
    categorias.forEach(cat => {
      const items = DB.servicos.filter(s => s.categoria === cat && s.nome.toLowerCase().includes(filter));
      if(items.length === 0) return;
      html += `
        <div class="menu-group">
          <h3>${cat}</h3>
          ${items.map(s => `
            <div class="menu-item">
              <span class="name">${s.nome}</span>
              <span class="leader"></span>
              <span class="price">${money(s.preco)}</span>
            </div>
          `).join('')}
        </div>
      `;
    });
    wrap.innerHTML = html || `<p class="menu-empty">Nenhum serviço encontrado para "${state.servicesFilter}".</p>`;
  }

  const searchInput = $('#services-search');
  if(searchInput){
    searchInput.addEventListener('input', (e)=>{ state.servicesFilter = e.target.value; renderServicesList(); });
  }

  $$('[data-filter-category]').forEach(btn => btn.addEventListener('click', ()=>{
    const cat = btn.dataset.filterCategory;
    const map = { 'Cabelo':'', 'Unhas':'', 'Sobrancelhas':'', 'Maquiagem':'' };
    if(searchInput){ searchInput.value=''; }
    state.servicesFilter = '';
    renderServicesList();
    goToPage('home');
    requestAnimationFrame(()=>{
      const el = document.getElementById('services');
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }));

  function renderProfessionalsList(){
    const wrap = $('#professionals-list');
    wrap.innerHTML = DB.profissionais.filter(p => p.ativo).map(p => `
      <div class="pro-card">
        <div class="pro-avatar">${p.nome.charAt(0)}</div>
        <h4>${p.nome}</h4>
        <p class="pro-role">${p.especialidade}</p>
        <p class="pro-services">${servicosDoProfissional(p.id).map(s => s.nome).join(' · ')}</p>
        <button class="btn btn-outline pro-cta" data-nav="book">Agendar</button>
      </div>
    `).join('');
  }

  /* ---------------------------------------------------------
     DEPOIMENTOS
  --------------------------------------------------------- */
  function renderTestimonial(){
    const card = $('#testimonial-card');
    const t = TESTIMONIALS[state.testimonialIndex];
    card.innerHTML = `
      <p class="testimonial-quote">"${t.quote}"</p>
      <p class="testimonial-author">${t.author}</p>
    `;
    $('#testimonial-dots').innerHTML = TESTIMONIALS.map((_, i) =>
      `<button class="${i === state.testimonialIndex ? 'active' : ''}" data-dot="${i}" aria-label="Depoimento ${i+1}"></button>`
    ).join('');
    $$('[data-dot]').forEach(b => b.addEventListener('click', ()=>{ state.testimonialIndex = Number(b.dataset.dot); renderTestimonial(); }));
  }
  $('#testimonial-prev').addEventListener('click', ()=>{ state.testimonialIndex = (state.testimonialIndex - 1 + TESTIMONIALS.length) % TESTIMONIALS.length; renderTestimonial(); });
  $('#testimonial-next').addEventListener('click', ()=>{ state.testimonialIndex = (state.testimonialIndex + 1) % TESTIMONIALS.length; renderTestimonial(); });

  /* ---------------------------------------------------------
     AGENDA — cálculo de disponibilidade
  --------------------------------------------------------- */
  function getUpcomingDates(count){
    const dates = [];
    let d = new Date(); d.setHours(0,0,0,0);
    let guard = 0;
    while(dates.length < count && guard < 90){
      const h = horarioDoDia(d.getDay());
      if(h && h.aberto) dates.push(new Date(d));
      d.setDate(d.getDate()+1);
      guard++;
    }
    return dates;
  }

  function getDaySlots(diaSemana){
    const h = horarioDoDia(diaSemana);
    if(!h || !h.aberto) return [];
    const slots = [];
    for(let hour = h.hora_abertura; hour < h.hora_fechamento; hour++) slots.push(pad(hour) + ':00');
    return slots;
  }

  function getAvailableTimes(profissionalId, dataIso){
    const [y,m,d] = dataIso.split('-').map(Number);
    const dow = new Date(y, m-1, d).getDay();
    const all = getDaySlots(dow);
    const now = new Date();
    const isToday = dataIso === isoDate(now);
    const ocupados = dbWhere('agendamentos', a => a.status === 'confirmado' && a.profissional_id === profissionalId && a.data === dataIso).map(a => a.horario);
    return all.map(t => {
      let disabled = ocupados.includes(t);
      if(!disabled && isToday){
        const [hh,mm] = t.split(':').map(Number);
        const slotDate = new Date(now); slotDate.setHours(hh,mm,0,0);
        if(slotDate <= now) disabled = true;
      }
      return { time:t, disabled };
    });
  }

  /* ---------------------------------------------------------
     BOOKING WIZARD
  --------------------------------------------------------- */
  function resetBooking(){ state.booking = { step:1, serviceId:null, professionalId:null, date:null, time:null }; }
  function bookingIsComplete(){ const b = state.booking; return b.serviceId && b.professionalId && b.date && b.time; }

  function renderStepper(){
    $$('#stepper li').forEach(li => {
      const n = Number(li.dataset.step);
      li.classList.toggle('active', n === state.booking.step);
      li.classList.toggle('done', n < state.booking.step);
    });
  }

  function renderLiveTicket(){
    const b = state.booking;
    const svc = b.serviceId ? servicoPorId(b.serviceId) : null;
    const pro = b.professionalId ? profissionalPorId(b.professionalId) : null;
    const ticket = $('#live-ticket');
    ticket.innerHTML = `
      <div class="ticket-top">
        <span class="ticket-label">Bilhete de agendamento</span>
        <span class="ticket-id">Nº ${String(DB._seq.agendamentos).padStart(5,'0')}</span>
      </div>
      <div class="ticket-row"><span>Serviço</span><strong>${svc ? svc.nome : '—'}</strong></div>
      <div class="ticket-row"><span>Profissional</span><strong>${pro ? pro.nome : '—'}</strong></div>
      <div class="ticket-row"><span>Data</span><strong>${b.date ? formatDateLabel(b.date) : '—'}</strong></div>
      <div class="ticket-perf"><span class="notch notch-left"></span><span class="notch notch-right"></span></div>
      <div class="ticket-row"><span>Horário</span><strong>${b.time || '—'}</strong></div>
      <div class="ticket-row"><span>Valor</span><strong>${svc ? money(svc.preco) : '—'}</strong></div>
      ${bookingIsComplete() ? '<div class="ticket-stamp pending">Aguardando confirmação</div>' : ''}
    `;
    $('#booking-confirm-box').classList.toggle('hidden', !bookingIsComplete());
  }

  function renderBooking(){
    renderStepper();
    renderLiveTicket();
    const panel = $('#booking-panel');
    const b = state.booking;

    if(b.step === 1){
      const categorias = [...new Set(DB.servicos.map(s => s.categoria))];
      panel.innerHTML = `
        <h3 class="step-title">Escolha o serviço</h3>
        ${categorias.map(cat => `
          <p class="eyebrow" style="margin-top:1rem">${cat}</p>
          <div class="option-grid">
            ${DB.servicos.filter(s => s.categoria === cat).map(s => `
              <button class="option-card ${b.serviceId === s.id ? 'selected' : ''}" data-pick-service="${s.id}">
                <span class="oc-title">${s.nome}</span>
                <span class="oc-price">${money(s.preco)}</span>
              </button>
            `).join('')}
          </div>
        `).join('')}
        <div class="step-nav"><span></span><button class="btn btn-primary" id="step-next" ${b.serviceId ? '' : 'disabled'}>Continuar</button></div>
      `;
      $$('[data-pick-service]').forEach(btn => btn.addEventListener('click', ()=>{
        const id = Number(btn.dataset.pickService);
        if(b.serviceId !== id){ b.professionalId = null; b.date = null; b.time = null; }
        b.serviceId = id;
        renderBooking();
      }));
      const nextBtn = $('#step-next');
      if(nextBtn) nextBtn.addEventListener('click', ()=>{ b.step = 2; renderBooking(); });

    } else if(b.step === 2){
      const options = profissionaisDoServico(b.serviceId);
      panel.innerHTML = `
        <h3 class="step-title">Escolha a profissional</h3>
        <p class="section-note" style="margin-bottom:1.2rem">Somente profissionais que realizam “${servicoPorId(b.serviceId).nome}” aparecem aqui.</p>
        <div class="option-grid">
          ${options.map(p => `
            <button class="option-card ${b.professionalId === p.id ? 'selected' : ''}" data-pick-pro="${p.id}">
              <span class="oc-title">${p.nome}</span>
              <span class="oc-sub">${p.especialidade}</span>
            </button>
          `).join('')}
        </div>
        <div class="step-nav">
          <button class="btn btn-ghost" id="step-back">Voltar</button>
          <button class="btn btn-primary" id="step-next" ${b.professionalId ? '' : 'disabled'}>Continuar</button>
        </div>
      `;
      $$('[data-pick-pro]').forEach(btn => btn.addEventListener('click', ()=>{
        const id = Number(btn.dataset.pickPro);
        if(b.professionalId !== id){ b.date = null; b.time = null; }
        b.professionalId = id;
        renderBooking();
      }));
      $('#step-back').addEventListener('click', ()=>{ b.step = 1; renderBooking(); });
      const nextBtn = $('#step-next');
      if(nextBtn) nextBtn.addEventListener('click', ()=>{ b.step = 3; renderBooking(); });

    } else if(b.step === 3){
      const dates = getUpcomingDates(14);
      panel.innerHTML = `
        <h3 class="step-title">Escolha a data</h3>
        <div class="date-strip">
          ${dates.map(d => {
            const iso = isoDate(d);
            return `<button class="date-pill ${b.date === iso ? 'selected' : ''}" data-pick-date="${iso}">
              <span class="dow">${DOW_LABELS[d.getDay()]}</span>
              <span class="dnum">${pad(d.getDate())}</span>
              <span class="mon">${MONTH_LABELS[d.getMonth()]}</span>
            </button>`;
          }).join('')}
        </div>
        <p class="empty-note">Atendimento apenas de terça a sábado.</p>
        <div class="step-nav">
          <button class="btn btn-ghost" id="step-back">Voltar</button>
          <button class="btn btn-primary" id="step-next" ${b.date ? '' : 'disabled'}>Continuar</button>
        </div>
      `;
      $$('[data-pick-date]').forEach(btn => btn.addEventListener('click', ()=>{
        if(b.date !== btn.dataset.pickDate){ b.time = null; }
        b.date = btn.dataset.pickDate;
        renderBooking();
      }));
      $('#step-back').addEventListener('click', ()=>{ b.step = 2; renderBooking(); });
      const nextBtn = $('#step-next');
      if(nextBtn) nextBtn.addEventListener('click', ()=>{ b.step = 4; renderBooking(); });

    } else if(b.step === 4){
      const times = getAvailableTimes(b.professionalId, b.date);
      const anyAvailable = times.some(t => !t.disabled);
      panel.innerHTML = `
        <h3 class="step-title">Horários disponíveis</h3>
        <p class="section-note" style="margin-bottom:1.2rem">${formatDateLabel(b.date)} · ${profissionalPorId(b.professionalId).nome}</p>
        <div class="time-grid">
          ${times.map(t => `<button class="time-pill ${b.time === t.time ? 'selected' : ''}" data-pick-time="${t.time}" ${t.disabled ? 'disabled' : ''}>${t.time}</button>`).join('')}
        </div>
        ${anyAvailable ? '' : '<p class="empty-note">Nenhum horário livre neste dia para esta profissional. Escolha outra data.</p>'}
        <div class="step-nav">
          <button class="btn btn-ghost" id="step-back">Voltar</button>
          <button class="btn btn-primary" id="step-next" ${b.time ? '' : 'disabled'}>Continuar</button>
        </div>
      `;
      $$('[data-pick-time]').forEach(btn => btn.addEventListener('click', ()=>{ b.time = btn.dataset.pickTime; renderBooking(); }));
      $('#step-back').addEventListener('click', ()=>{ b.step = 3; renderBooking(); });
      const nextBtn = $('#step-next');
      if(nextBtn) nextBtn.addEventListener('click', ()=>{ b.step = 5; renderBooking(); });

    } else if(b.step === 5){
      if(!state.currentUser){
        panel.innerHTML = `
          <h3 class="step-title">Seus dados</h3>
          <p class="section-note" style="margin-bottom:1.4rem">Entre na sua conta ou cadastre-se para concluir o agendamento.</p>
          <div class="hero-actions">
            <button class="btn btn-primary" id="inline-login">Entrar</button>
            <button class="btn btn-outline" id="inline-register">Cadastrar</button>
          </div>
          <div class="step-nav"><button class="btn btn-ghost" id="step-back">Voltar</button><span></span></div>
        `;
        $('#step-back').addEventListener('click', ()=>{ b.step = 4; renderBooking(); });
        $('#inline-login').addEventListener('click', ()=>{ state.pendingAfterAuth = renderBooking; openModal('modal-login'); });
        $('#inline-register').addEventListener('click', ()=>{ state.pendingAfterAuth = renderBooking; openModal('modal-register'); });
      } else {
        const svc = servicoPorId(b.serviceId);
        const pro = profissionalPorId(b.professionalId);
        panel.innerHTML = `
          <h3 class="step-title">Confirme seus dados</h3>
          <div class="booking-form-grid">
            <label>Nome completo <input type="text" id="bk-name" value="${state.currentUser.nome}"></label>
            <label>Telefone <input type="tel" id="bk-phone" value="${state.currentUser.telefone}"></label>
          </div>
          <p class="section-note" style="margin-top:1.4rem">${svc.nome} com ${pro.nome} · ${formatDateLabel(b.date)} às ${b.time} · ${money(svc.preco)}</p>
          <div class="step-nav"><button class="btn btn-ghost" id="step-back">Voltar</button><span></span></div>
        `;
        $('#step-back').addEventListener('click', ()=>{ b.step = 4; renderBooking(); });
      }
    }
  }

  $('#btn-confirm-booking').addEventListener('click', ()=>{
    const b = state.booking;
    if(!bookingIsComplete()){ showToast('Complete todas as etapas antes de confirmar.', 'error'); return; }
    if(!state.currentUser){ b.step = 5; renderBooking(); return; }

    const stillFree = getAvailableTimes(b.professionalId, b.date).find(t => t.time === b.time && !t.disabled);
    if(!stillFree){
      showToast('Esse horário acabou de ser reservado. Escolha outro.', 'error');
      b.time = null; b.step = 4; renderBooking();
      return;
    }

    const nameInput = $('#bk-name');
    const phoneInput = $('#bk-phone');
    const svc = servicoPorId(b.serviceId);
    const pro = profissionalPorId(b.professionalId);

    dbInsert('agendamentos', {
      cliente_id: state.currentUser.id,
      cliente_nome: (nameInput ? nameInput.value.trim() : state.currentUser.nome) || state.currentUser.nome,
      cliente_telefone: (phoneInput ? phoneInput.value.trim() : state.currentUser.telefone) || state.currentUser.telefone,
      servico_id: svc.id, profissional_id: pro.id,
      data: b.date, horario: b.time, valor: svc.preco,
      status:'confirmado', criado_em: new Date().toISOString(),
    });
    showToast('Agendamento confirmado! Você já pode vê-lo em "Meus agendamentos".', 'success');
    resetBooking();
    goToPage('appointments');
  });

  /* ---------------------------------------------------------
     MEUS AGENDAMENTOS
  --------------------------------------------------------- */
  function renderAppointments(){
    const notice = $('#appointments-auth-notice');
    const list = $('#appointments-list');
    if(!state.currentUser){
      notice.classList.remove('hidden');
      list.innerHTML = '';
      return;
    }
    notice.classList.add('hidden');

    const minhas = dbWhere('agendamentos', a => a.cliente_id === state.currentUser.id)
      .sort((a,b) => (a.data + a.horario).localeCompare(b.data + b.horario));

    if(minhas.length === 0){
      list.innerHTML = `<p class="empty-note">Você ainda não tem agendamentos. <button class="link-btn" data-nav="book" style="display:inline">Agendar horário</button></p>`;
      return;
    }

    list.innerHTML = minhas.map(a => {
      const svc = servicoPorId(a.servico_id), pro = profissionalPorId(a.profissional_id);
      const cancellable = canCancel(a);
      return `
      <div class="ticket">
        <div class="ticket-top">
          <span class="ticket-label">Bilhete de agendamento</span>
          <span class="ticket-id">Nº ${String(a.id).padStart(5,'0')}</span>
        </div>
        <div class="ticket-row"><span>Serviço</span><strong>${svc.nome}</strong></div>
        <div class="ticket-row"><span>Profissional</span><strong>${pro.nome}</strong></div>
        <div class="ticket-row"><span>Data</span><strong>${formatDateLabel(a.data)}</strong></div>
        <div class="ticket-perf"><span class="notch notch-left"></span><span class="notch notch-right"></span></div>
        <div class="ticket-row"><span>Horário</span><strong>${a.horario}</strong></div>
        <div class="ticket-row"><span>Valor</span><strong>${money(a.valor)}</strong></div>
        <div class="ticket-stamp ${a.status === 'cancelado' ? 'cancelled' : ''}">${a.status === 'cancelado' ? 'Cancelado' : 'Confirmado'}</div>
        ${a.status === 'confirmado' ? `
          <div class="ticket-actions">
            <button class="btn btn-outline" data-cancel-appt="${a.id}" ${cancellable ? '' : 'disabled'}>Cancelar</button>
          </div>
          ${cancellable ? '' : '<p class="empty-note" style="padding-top:.6rem">Cancelamento indisponível: faltam menos de 2h para o horário.</p>'}
        ` : ''}
      </div>`;
    }).join('');

    $$('[data-cancel-appt]').forEach(btn => btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.cancelAppt);
      const appt = dbFind('agendamentos', id);
      const svc = servicoPorId(appt.servico_id), pro = profissionalPorId(appt.profissional_id);
      askConfirm('Cancelar agendamento', `Cancelar ${svc.nome} com ${pro.nome} em ${formatDateLabel(appt.data)} às ${appt.horario}?`, ()=>{
        appt.status = 'cancelado';
        showToast('Agendamento cancelado. O horário voltou a ficar disponível.', 'success');
        renderAppointments();
      });
    }));
  }

  function canCancel(appt){
    const [y,m,d] = appt.data.split('-').map(Number);
    const [hh,mm] = appt.horario.split(':').map(Number);
    const start = new Date(y, m-1, d, hh, mm, 0);
    return (start.getTime() - Date.now()) >= 2 * 60 * 60 * 1000;
  }

  /* ---------------------------------------------------------
     ADMIN
  --------------------------------------------------------- */
  function renderAdmin(){
    const isAdmin = !!(state.currentUser && state.currentUser.papel === 'admin');
    $('#admin-gate').classList.toggle('hidden', isAdmin);
    $('#admin-content').classList.toggle('hidden', !isAdmin);
    if(!isAdmin){
      const text = $('#admin-gate-text');
      if(state.currentUser && state.currentUser.papel !== 'admin'){
        text.textContent = `Você está logada como ${state.currentUser.nome}, mas esta conta não tem acesso administrativo. Entre com a conta da equipe.`;
      } else {
        text.textContent = 'Esta área é exclusiva para a equipe do Aeterna Beauty. Entre com uma conta administrativa para continuar.';
      }
      return;
    }
    $('#admin-welcome').textContent = 'Olá, Gaby 👋';
    $$('#admin-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === state.adminTab));
    const panel = $('#admin-panel');
    if(state.adminTab === 'dashboard') return renderAdminDashboard(panel);
    if(state.adminTab === 'agendamentos') return renderAdminAppointments(panel);
    if(state.adminTab === 'servicos') return renderAdminServices(panel);
    if(state.adminTab === 'profissionais') return renderAdminProfessionals(panel);
    if(state.adminTab === 'horarios') return renderAdminHours(panel);
    if(state.adminTab === 'clientes') return renderAdminClients(panel);
  }

  $('#admin-tabs').addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-tab]');
    if(!btn) return;
    state.adminTab = btn.dataset.tab;
    renderAdmin();
  });

  function renderAdminDashboard(panel){
    const confirmados = dbWhere('agendamentos', a => a.status === 'confirmado');
    const todayIso = isoDate(new Date());
    const hoje = confirmados.filter(a => a.data === todayIso);
    const receita = confirmados.reduce((sum,a) => sum + a.valor, 0);
    const clientes = dbWhere('usuarios', u => u.papel === 'cliente');
    panel.innerHTML = `
      <div class="admin-grid">
        <div class="stat-card"><div class="stat-num">${confirmados.length}</div><div class="stat-label">Agendamentos confirmados</div></div>
        <div class="stat-card"><div class="stat-num">${hoje.length}</div><div class="stat-label">Agendamentos hoje</div></div>
        <div class="stat-card"><div class="stat-num">${money(receita)}</div><div class="stat-label">Receita prevista</div></div>
        <div class="stat-card"><div class="stat-num">${clientes.length}</div><div class="stat-label">Clientes cadastradas</div></div>
      </div>
      <p class="panel-title">Próximos agendamentos</p>
      <div class="admin-table-wrap">
        <table class="data-table">
          <thead><tr><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Data</th><th>Horário</th></tr></thead>
          <tbody>
            ${confirmados.sort((a,b) => (a.data+a.horario).localeCompare(b.data+b.horario)).slice(0,6).map(a => `
              <tr><td>${a.cliente_nome}</td><td>${servicoPorId(a.servico_id).nome}</td><td>${profissionalPorId(a.profissional_id).nome}</td><td>${formatDateLabel(a.data)}</td><td>${a.horario}</td></tr>
            `).join('') || `<tr><td colspan="5" class="muted">Nenhum agendamento no momento.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderAdminAppointments(panel){
    const rows = [...DB.agendamentos].sort((a,b) => (b.data+b.horario).localeCompare(a.data+a.horario));
    panel.innerHTML = `
      <p class="panel-title">Novo agendamento</p>
      <div id="admin-new-appt-form"></div>
      <p class="panel-title" style="margin-top:2rem">Todos os agendamentos</p>
      <div class="admin-table-wrap">
        <table class="data-table">
          <thead><tr><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Data</th><th>Horário</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            ${rows.map(a => `
              <tr>
                <td>${a.cliente_nome}</td>
                <td>${servicoPorId(a.servico_id).nome}</td>
                <td>${profissionalPorId(a.profissional_id).nome}</td>
                <td>${formatDateLabel(a.data)}</td>
                <td>${a.horario}</td>
                <td>${money(a.valor)}</td>
                <td><span class="status-pill ${a.status}">${a.status === 'confirmado' ? 'Confirmado' : 'Cancelado'}</span></td>
                <td class="row-actions">${a.status === 'confirmado' ? `<button class="btn btn-outline" data-admin-cancel="${a.id}">Cancelar</button>` : '—'}</td>
              </tr>
            `).join('') || `<tr><td colspan="8" class="muted">Nenhum agendamento registrado.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
    $$('[data-admin-cancel]').forEach(btn => btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.adminCancel);
      const appt = dbFind('agendamentos', id);
      askConfirm('Cancelar agendamento', `Cancelar o horário de ${appt.cliente_nome} (${servicoPorId(appt.servico_id).nome})?`, ()=>{
        appt.status = 'cancelado';
        showToast('Agendamento cancelado.', 'success');
        renderAdmin();
      });
    }));
    renderAdminNewApptForm($('#admin-new-appt-form'));
  }

  function renderAdminNewApptForm(wrap){
    const na = state.adminNewAppt;
    const dates = getUpcomingDates(14);
    const proOptions = na.serviceId ? profissionaisDoServico(na.serviceId) : [];
    const timeOptions = (na.professionalId && na.date) ? getAvailableTimes(na.professionalId, na.date) : [];
    const clientesCadastradas = dbWhere('usuarios', u => u.papel === 'cliente');

    wrap.innerHTML = `
      <form class="admin-form-inline" id="form-admin-new-appt">
        <label>Cliente
          <select id="na-client">
            <option value="avulso" ${na.clientId === 'avulso' ? 'selected' : ''}>+ Cliente avulso (digitar dados)</option>
            ${clientesCadastradas.map(u => `<option value="${u.id}" ${String(na.clientId) === String(u.id) ? 'selected' : ''}>${u.nome}</option>`).join('')}
          </select>
        </label>
        ${na.clientId === 'avulso' ? `
          <label>Nome <input type="text" id="na-name" value="${na.name}" placeholder="Nome completo" required></label>
          <label>Telefone <input type="tel" id="na-phone" value="${na.phone}" placeholder="(11) 90000-0000" required></label>
        ` : ''}
        <label>Serviço
          <select id="na-service">
            <option value="">Selecione</option>
            ${DB.servicos.map(s => `<option value="${s.id}" ${na.serviceId === s.id ? 'selected' : ''}>${s.nome}</option>`).join('')}
          </select>
        </label>
        <label>Profissional
          <select id="na-pro" ${na.serviceId ? '' : 'disabled'}>
            <option value="">Selecione</option>
            ${proOptions.map(p => `<option value="${p.id}" ${na.professionalId === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}
          </select>
        </label>
        <label>Data
          <select id="na-date" ${na.professionalId ? '' : 'disabled'}>
            <option value="">Selecione</option>
            ${dates.map(d => { const iso = isoDate(d); return `<option value="${iso}" ${na.date === iso ? 'selected' : ''}>${formatDateLabel(iso)}</option>`; }).join('')}
          </select>
        </label>
        <label>Horário
          <select id="na-time" ${na.date ? '' : 'disabled'}>
            <option value="">Selecione</option>
            ${timeOptions.map(t => `<option value="${t.time}" ${t.disabled ? 'disabled' : ''} ${na.time === t.time ? 'selected' : ''}>${t.time}${t.disabled ? ' · ocupado' : ''}</option>`).join('')}
          </select>
        </label>
        <button class="btn btn-primary" type="submit">Adicionar agendamento</button>
      </form>
    `;

    $('#na-client').addEventListener('change', (e)=>{ na.clientId = e.target.value; renderAdminNewApptForm(wrap); });
    const nameInput = $('#na-name'); if(nameInput) nameInput.addEventListener('input', e => na.name = e.target.value);
    const phoneInput = $('#na-phone'); if(phoneInput) phoneInput.addEventListener('input', e => na.phone = e.target.value);
    $('#na-service').addEventListener('change', (e)=>{ na.serviceId = e.target.value ? Number(e.target.value) : null; na.professionalId = null; na.date = null; na.time = null; renderAdminNewApptForm(wrap); });
    $('#na-pro').addEventListener('change', (e)=>{ na.professionalId = e.target.value ? Number(e.target.value) : null; na.date = null; na.time = null; renderAdminNewApptForm(wrap); });
    $('#na-date').addEventListener('change', (e)=>{ na.date = e.target.value || null; na.time = null; renderAdminNewApptForm(wrap); });
    $('#na-time').addEventListener('change', (e)=>{ na.time = e.target.value || null; });

    $('#form-admin-new-appt').addEventListener('submit', (e)=>{
      e.preventDefault();
      if(!na.serviceId || !na.professionalId || !na.date || !na.time){ showToast('Complete serviço, profissional, data e horário.', 'error'); return; }
      let cliente_id = null, cliente_nome, cliente_telefone;
      if(na.clientId === 'avulso'){
        cliente_nome = (nameInput ? nameInput.value.trim() : '');
        cliente_telefone = (phoneInput ? phoneInput.value.trim() : '');
        if(!cliente_nome || !cliente_telefone){ showToast('Informe nome e telefone do cliente.', 'error'); return; }
      } else {
        const u = dbFind('usuarios', Number(na.clientId));
        cliente_id = u.id; cliente_nome = u.nome; cliente_telefone = u.telefone;
      }
      const stillFree = getAvailableTimes(na.professionalId, na.date).find(t => t.time === na.time && !t.disabled);
      if(!stillFree){ showToast('Esse horário acabou de ser ocupado. Escolha outro.', 'error'); na.time = null; renderAdminNewApptForm(wrap); return; }

      const svc = servicoPorId(na.serviceId);
      dbInsert('agendamentos', {
        cliente_id, cliente_nome, cliente_telefone,
        servico_id: na.serviceId, profissional_id: na.professionalId,
        data: na.date, horario: na.time, valor: svc.preco,
        status:'confirmado', criado_em: new Date().toISOString(),
      });
      showToast(`Agendamento criado para ${cliente_nome}.`, 'success');
      state.adminNewAppt = { clientId:'avulso', name:'', phone:'', serviceId:null, professionalId:null, date:null, time:null };
      renderAdminAppointments($('#admin-panel'));
    });
  }

  function renderAdminServices(panel){
    panel.innerHTML = `
      <p class="panel-title">Cadastrar serviço</p>
      <form class="admin-form-inline" id="form-add-service">
        <label>Categoria <input type="text" id="new-service-category" placeholder="Cabelo" required></label>
        <label>Nome <input type="text" id="new-service-name" placeholder="Corte masculino" required></label>
        <label>Preço (R$) <input type="number" min="0" step="0.01" id="new-service-price" placeholder="60" required></label>
        <button class="btn btn-primary" type="submit">Adicionar</button>
      </form>
      <div class="admin-table-wrap">
        <table class="data-table">
          <thead><tr><th>Categoria</th><th>Serviço</th><th>Preço</th><th>Ações</th></tr></thead>
          <tbody>
            ${DB.servicos.map(s => `
              <tr>
                <td>${s.categoria}</td>
                <td>${s.nome}</td>
                <td><input type="number" min="0" step="0.01" value="${s.preco}" data-edit-price="${s.id}"></td>
                <td class="row-actions"><button class="btn btn-outline" data-remove-service="${s.id}">Remover</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    $('#form-add-service').addEventListener('submit', (e)=>{
      e.preventDefault();
      const categoria = $('#new-service-category').value.trim();
      const nome = $('#new-service-name').value.trim();
      const preco = parseFloat($('#new-service-price').value);
      dbInsert('servicos', { categoria, nome, preco, ativo:true });
      showToast('Serviço adicionado.', 'success');
      renderAdminServices(panel);
      renderServicesList();
    });
    $$('[data-edit-price]').forEach(input => input.addEventListener('change', ()=>{
      const svc = dbFind('servicos', Number(input.dataset.editPrice));
      const val = parseFloat(input.value);
      if(!isNaN(val) && val >= 0){ svc.preco = val; showToast(`Preço de "${svc.nome}" atualizado.`, 'success'); renderServicesList(); }
    }));
    $$('[data-remove-service]').forEach(btn => btn.addEventListener('click', ()=>{
      const svc = dbFind('servicos', Number(btn.dataset.removeService));
      askConfirm('Remover serviço', `Remover "${svc.nome}" do cardápio? Profissionais perderão este serviço na lista.`, ()=>{
        dbDelete('servicos', svc.id);
        DB.profissional_servico = DB.profissional_servico.filter(r => r.servico_id !== svc.id);
        renderAdminServices(panel);
        renderServicesList();
        renderProfessionalsList();
        showToast('Serviço removido.', 'success');
      });
    }));
  }

  function renderAdminProfessionals(panel){
    panel.innerHTML = `
      <p class="panel-title">Cadastrar profissional</p>
      <form class="admin-form-inline" id="form-add-pro">
        <label>Nome <input type="text" id="new-pro-name" placeholder="Larissa" required></label>
        <label>Especialidade <input type="text" id="new-pro-role" placeholder="Cabeleireira" required></label>
        <button class="btn btn-primary" type="submit">Adicionar</button>
      </form>
      <div class="admin-table-wrap">
        <table class="data-table">
          <thead><tr><th>Nome</th><th>Especialidade</th><th>Serviços realizados</th><th>Ações</th></tr></thead>
          <tbody>
            ${DB.profissionais.map(p => `
              <tr>
                <td>${p.nome}</td>
                <td>${p.especialidade}</td>
                <td>
                  <div class="chip-toggle">
                    ${DB.servicos.map(s => {
                      const checked = DB.profissional_servico.some(r => r.profissional_id === p.id && r.servico_id === s.id);
                      return `<label><input type="checkbox" data-pro-service="${p.id}|${s.id}" ${checked ? 'checked' : ''}> ${s.nome}</label>`;
                    }).join('')}
                  </div>
                </td>
                <td class="row-actions"><button class="btn btn-outline" data-remove-pro="${p.id}">Remover</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    $('#form-add-pro').addEventListener('submit', (e)=>{
      e.preventDefault();
      const nome = $('#new-pro-name').value.trim();
      const especialidade = $('#new-pro-role').value.trim();
      dbInsert('profissionais', { nome, especialidade, ativo:true });
      showToast('Profissional adicionada.', 'success');
      renderAdminProfessionals(panel);
      renderProfessionalsList();
    });
    $$('[data-pro-service]').forEach(chk => chk.addEventListener('change', ()=>{
      const [proId, svcId] = chk.dataset.proService.split('|').map(Number);
      if(chk.checked){
        if(!DB.profissional_servico.some(r => r.profissional_id === proId && r.servico_id === svcId)){
          DB.profissional_servico.push({ profissional_id: proId, servico_id: svcId });
        }
      } else {
        DB.profissional_servico = DB.profissional_servico.filter(r => !(r.profissional_id === proId && r.servico_id === svcId));
      }
      renderProfessionalsList();
    }));
    $$('[data-remove-pro]').forEach(btn => btn.addEventListener('click', ()=>{
      const pro = dbFind('profissionais', Number(btn.dataset.removePro));
      askConfirm('Remover profissional', `Remover ${pro.nome} da equipe?`, ()=>{
        dbDelete('profissionais', pro.id);
        DB.profissional_servico = DB.profissional_servico.filter(r => r.profissional_id !== pro.id);
        renderAdminProfessionals(panel);
        renderProfessionalsList();
        showToast('Profissional removida.', 'success');
      });
    }));
  }

  function renderAdminHours(panel){
    const hoursOptions = Array.from({length:15}, (_,i) => i+7);
    panel.innerHTML = `
      <p class="panel-title">Dias de atendimento</p>
      <div class="days-toggle">
        ${DOW_LABELS.map((label, idx) => `<button class="day-chip ${horarioDoDia(idx) && horarioDoDia(idx).aberto ? 'on' : ''}" data-toggle-day="${idx}">${label}</button>`).join('')}
      </div>
      <p class="panel-title">Horário de funcionamento (aplicado aos dias abertos)</p>
      <div class="hours-row">
        <label>Abertura
          <select id="hours-start">${hoursOptions.map(h => `<option value="${h}">${pad(h)}:00</option>`).join('')}</select>
        </label>
        <label>Fechamento
          <select id="hours-end">${hoursOptions.map(h => `<option value="${h}">${pad(h)}:00</option>`).join('')}</select>
        </label>
        <button class="btn btn-primary" id="save-hours">Salvar horário</button>
      </div>
      <p class="section-note">Alterações valem para novos agendamentos a partir de agora.</p>
    `;
    const abertoRef = DB.horario_funcionamento.find(h => h.aberto);
    if(abertoRef){
      $('#hours-start').value = abertoRef.hora_abertura;
      $('#hours-end').value = abertoRef.hora_fechamento;
    }
    $$('[data-toggle-day]').forEach(btn => btn.addEventListener('click', ()=>{
      const dia = Number(btn.dataset.toggleDay);
      const h = horarioDoDia(dia);
      h.aberto = !h.aberto;
      if(h.aberto && !h.hora_abertura){ h.hora_abertura = 9; h.hora_fechamento = 19; }
      renderAdminHours(panel);
    }));
    $('#save-hours').addEventListener('click', ()=>{
      const start = Number($('#hours-start').value);
      const end = Number($('#hours-end').value);
      if(start >= end){ showToast('O horário de abertura deve ser antes do fechamento.', 'error'); return; }
      DB.horario_funcionamento.forEach(h => { if(h.aberto){ h.hora_abertura = start; h.hora_fechamento = end; } });
      showToast('Horário de funcionamento atualizado.', 'success');
    });
  }

  function renderAdminClients(panel){
    const clientes = dbWhere('usuarios', u => u.papel === 'cliente');
    panel.innerHTML = `
      <div class="admin-table-wrap">
        <table class="data-table">
          <thead><tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Agendamentos</th></tr></thead>
          <tbody>
            ${clientes.map(u => `
              <tr>
                <td>${u.nome}</td><td>${u.telefone}</td><td>${u.email}</td>
                <td>${dbWhere('agendamentos', a => a.cliente_id === u.id).length}</td>
              </tr>
            `).join('') || `<tr><td colspan="4" class="muted">Nenhuma cliente cadastrada ainda.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ---------------------------------------------------------
     INICIALIZAÇÃO
  --------------------------------------------------------- */
  function init(){
    const yearEl = $('#footer-year'); if(yearEl) yearEl.textContent = new Date().getFullYear();
    seedDatabase();
    initTheme(); // <-- ADICIONADO: Inicializa o modo escuro/claro
    renderServicesList();
    renderProfessionalsList();
    renderTestimonial();
    refreshAuthUI();
    renderAppointments();
    goToPage('home', true);
    initRevealAndCounters();
  }

  init();
})();