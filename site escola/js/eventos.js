let calendarState = { events: [], year: 0, month: 0, selected: '', canManage: false };
const calendarWeekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function calendarDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calendarParseDate(key) {
    const [year, month, day] = String(key).split('-').map(Number);
    return new Date(year, month - 1, day);
}

function calendarEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
}

function calendarTypeClass(type) {
    const normalized = String(type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return normalized.includes('reuniao') ? 'meeting' : normalized.includes('passeio') ? 'trip' : 'school-event';
}

function calendarEventMarkup(event, compact = false) {
    const time = String(event.hora || '').slice(0, 5);
    const typeClass = calendarTypeClass(event.tipo);
    if (compact) return `<span class="calendar-event-chip ${typeClass}" title="${calendarEscape(event.titulo)}">${time ? `<b>${time}</b> ` : ''}${calendarEscape(event.titulo)}</span>`;
    return `
        <article class="calendar-agenda-event ${typeClass}">
            <div class="calendar-event-meta"><span>${calendarEscape(event.tipo || 'Evento')}</span><span>${time || 'Horário a confirmar'}</span></div>
            <h4>${calendarEscape(event.titulo)}</h4>
            ${event.descricao ? `<p>${calendarEscape(event.descricao)}</p>` : ''}
            <div class="calendar-event-location"><i class="fas fa-map-marker-alt"></i> ${calendarEscape(event.local || 'Local a confirmar')}</div>
            ${event.publico ? `<div class="calendar-event-audience"><i class="fas fa-users"></i> ${calendarEscape(event.publico)}</div>` : ''}
            ${event.status === 'Suspenso' ? '<span class="calendar-status suspended">Suspenso</span>' : ''}
            ${calendarState.canManage ? `<div class="calendar-event-actions"><button class="btn btn-ghost" onclick="abrirFormEvento(${Number(event.id)})"><i class="fas fa-pen"></i> Editar</button><button class="btn btn-ghost" onclick="excluirEvento(${Number(event.id)})"><i class="fas fa-trash"></i> Excluir</button></div>` : ''}
        </article>`;
}

function calendarWidgetMarkup() {
    const { year, month, selected, events, canManage } = calendarState;
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = calendarDateKey(new Date());
    const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(firstDay);
    const cells = Array.from({ length: 42 }, (_, index) => {
        const day = index - offset + 1;
        const date = new Date(year, month, day);
        const key = calendarDateKey(date);
        const inMonth = day >= 1 && day <= daysInMonth;
        const onDay = events.filter(event => event.data === key).sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')));
        const classes = ['calendar-day', inMonth ? '' : 'outside-month', key === todayKey ? 'today' : '', key === selected ? 'selected' : '', onDay.length ? 'has-events' : ''].filter(Boolean).join(' ');
        return `<button class="${classes}" type="button" ${inMonth ? `onclick="calendarSelectDay('${key}')"` : 'disabled'} aria-label="${date.toLocaleDateString('pt-BR')}${onDay.length ? `, ${onDay.length} compromisso(s)` : ''}">
            <span class="calendar-day-number">${date.getDate()}</span>
            <span class="calendar-day-events">${onDay.slice(0, 2).map(event => calendarEventMarkup(event, true)).join('')}${onDay.length > 2 ? `<span class="calendar-more-events">+${onDay.length - 2} compromisso(s)</span>` : ''}</span>
        </button>`;
    }).join('');
    const dayEvents = events.filter(event => event.data === selected).sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')));
    const today = calendarDateKey(new Date());
    const upcoming = events.filter(event => event.data >= today && event.status !== 'Encerrado').sort((a, b) => `${a.data} ${a.hora || ''}`.localeCompare(`${b.data} ${b.hora || ''}`)).slice(0, 4);
    const selectedDateLabel = selected ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(calendarParseDate(selected)) : '';

    return `<section class="calendar-layout" id="calendarWidget">
        <div class="calendar-main-panel">
            <div class="calendar-toolbar">
                <div><p class="calendar-kicker">Agenda escolar</p><h3>${calendarEscape(monthTitle)}</h3></div>
                <div class="calendar-controls"><button type="button" class="calendar-control" onclick="calendarMoveMonth(-1)" aria-label="Mês anterior"><i class="fas fa-chevron-left"></i></button><button type="button" class="calendar-today-button" onclick="calendarGoToday()">Hoje</button><button type="button" class="calendar-control" onclick="calendarMoveMonth(1)" aria-label="Próximo mês"><i class="fas fa-chevron-right"></i></button></div>
            </div>
            <div class="calendar-weekdays">${calendarWeekdays.map(day => `<span>${day}</span>`).join('')}</div>
            <div class="calendar-month-grid">${cells}</div>
            <div class="calendar-legend"><span><i class="legend-dot meeting"></i> Reunião</span><span><i class="legend-dot trip"></i> Passeio</span><span><i class="legend-dot school-event"></i> Evento escolar</span></div>
        </div>
        <aside class="calendar-agenda-panel">
            <p class="calendar-kicker">Agenda do dia</p><h3>${calendarEscape(selectedDateLabel)}</h3>
            <div class="calendar-day-agenda">${dayEvents.length ? dayEvents.map(event => calendarEventMarkup(event)).join('') : `<div class="calendar-empty-day"><i class="far fa-calendar"></i><p>Nenhum compromisso neste dia.</p></div>`}</div>
            ${!dayEvents.length && upcoming.length ? `<div class="calendar-upcoming"><h4>Próximos compromissos</h4>${upcoming.map(event => `<button type="button" class="calendar-upcoming-item" onclick="calendarSelectDay('${event.data}')"><span class="calendar-upcoming-date">${calendarParseDate(event.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span><span>${calendarEscape(event.titulo)}</span></button>`).join('')}</div>` : ''}
            ${canManage ? '<p class="calendar-manage-note"><i class="fas fa-info-circle"></i> Selecione uma data para conferir, editar ou remover compromissos.</p>' : ''}
        </aside>
    </section>`;
}

async function renderCalendarScreen() {
    const res = await API.get('eventos.list');
    if (!res.ok) return '<div class="card">Não foi possível carregar o calendário. Tente novamente.</div>';
    const today = new Date();
    calendarState = {
        events: Array.isArray(res.data) ? res.data : [],
        year: today.getFullYear(),
        month: today.getMonth(),
        selected: calendarDateKey(today),
        canManage: ['diretor', 'coordenador', 'professor'].includes(currentUser?.perfil)
    };
    const upcomingCount = calendarState.events.filter(event => event.data >= calendarState.selected && event.status !== 'Encerrado').length;
    return `<div class="calendar-page-header"><div><p class="calendar-kicker">Colégio L'Avenir</p><h2 class="font-serif">Calendário da Escola</h2><p>Compromissos e eventos em uma visão mensal.</p></div>${calendarState.canManage ? '<button class="btn btn-gold calendar-add-button" onclick="abrirFormEvento()"><i class="fas fa-plus"></i> Novo compromisso</button>' : ''}</div>
        <div class="calendar-summary"><i class="fas fa-calendar-check"></i><span><strong>${upcomingCount}</strong> compromisso(s) futuro(s)</span></div>
        ${calendarWidgetMarkup()}`;
}

function renderEventos() { return renderCalendarScreen(); }
function renderCalendario() { return renderCalendarScreen(); }

function refreshCalendarWidget() {
    const widget = document.getElementById('calendarWidget');
    if (widget) widget.outerHTML = calendarWidgetMarkup();
}

function calendarMoveMonth(amount) {
    const next = new Date(calendarState.year, calendarState.month + amount, 1);
    calendarState.year = next.getFullYear();
    calendarState.month = next.getMonth();
    calendarState.selected = calendarDateKey(next);
    refreshCalendarWidget();
}

function calendarSelectDay(key) {
    const date = calendarParseDate(key);
    calendarState.year = date.getFullYear();
    calendarState.month = date.getMonth();
    calendarState.selected = key;
    refreshCalendarWidget();
}

function calendarGoToday() { calendarSelectDay(calendarDateKey(new Date())); }

async function abrirFormEvento(id = null) {
    let item = null;
    if (id) {
        const r = await API.get('eventos.get', { id });
        if (r.ok) item = r.data;
    }
    openModal(id ? 'Editar Evento' : 'Novo Evento', `
        <div class="form-group"><label class="form-label">Título</label><input id="f_titulo" class="form-input" value="${item?.titulo||''}" required></div>
        <div class="form-group"><label class="form-label">Tipo</label><select id="f_tipo" class="form-select"><option ${item?.tipo==='Passeio'?'selected':''}>Passeio</option><option ${item?.tipo==='Reunião'?'selected':''}>Reunião</option><option ${item?.tipo==='Evento'?'selected':''}>Evento</option></select></div>
        <div class="form-group"><label class="form-label">Data</label><input id="f_data" type="date" class="form-input" value="${item?.data||''}" required></div>
        <div class="form-group"><label class="form-label">Hora</label><input id="f_hora" type="time" class="form-input" value="${String(item?.hora || '').slice(0, 5)}" required></div>
        <div class="form-group"><label class="form-label">Local</label><input id="f_local" class="form-input" value="${item?.local||''}" required></div>
        <div class="form-group"><label class="form-label">Público</label><input id="f_publico" class="form-input" value="${item?.publico||''}"></div>
        <div class="form-group"><label class="form-label">Descrição</label><textarea id="f_descricao" class="form-textarea" rows="3">${item?.descricao||''}</textarea></div>
        <div class="form-group"><label class="form-label">Status</label><select id="f_status" class="form-select"><option ${item?.status==='Confirmado'?'selected':''}>Confirmado</option><option ${item?.status==='Suspenso'?'selected':''}>Suspenso</option><option ${item?.status==='Encerrado'?'selected':''}>Encerrado</option></select></div>
    `, async () => {
        const data = {
            id: item?.id,
            titulo: document.getElementById('f_titulo').value,
            tipo: document.getElementById('f_tipo').value,
            data: document.getElementById('f_data').value,
            hora: document.getElementById('f_hora').value,
            local: document.getElementById('f_local').value,
            publico: document.getElementById('f_publico').value,
            descricao: document.getElementById('f_descricao').value,
            status: document.getElementById('f_status').value
        };
        const res = await API.post('eventos.save', data);
        if (res.ok) { toast(res.msg); closeModal(); renderSection(); }
        else toast(res.msg, 'error');
    });
}

async function excluirEvento(id) {
    openConfirm('Excluir evento?', 'Esta ação não pode ser desfeita.', async () => {
        const res = await API.delete('eventos.delete', { id });
        if (res.ok) { toast(res.msg); renderSection(); }
        else toast(res.msg, 'error');
    });
}
