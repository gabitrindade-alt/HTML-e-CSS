document.addEventListener('DOMContentLoaded', () => {
    const filter = document.getElementById('simulado-content-filter');
    const list = document.querySelector('.teacher-question-list');
    if (!list) return;
    const cards = Array.from(list.querySelectorAll('[data-question-content]'));
    const checkboxes = Array.from(list.querySelectorAll('input[type="checkbox"]'));
    const count = document.getElementById('simulado-selected-count');
    const selectVisible = document.getElementById('select-visible-questions');
    const updateCount = () => { count.textContent = String(checkboxes.filter(input => input.checked).length); };
    filter?.addEventListener('change', () => {
        cards.forEach(card => { card.hidden = Boolean(filter.value) && card.dataset.questionContent !== filter.value; });
    });
    checkboxes.forEach(input => input.addEventListener('change', updateCount));
    selectVisible?.addEventListener('click', () => {
        const visible = cards.filter(card => !card.hidden).map(card => card.querySelector('input'));
        const select = visible.some(input => !input.checked);
        visible.forEach(input => { input.checked = select; });
        updateCount();
    });
});
