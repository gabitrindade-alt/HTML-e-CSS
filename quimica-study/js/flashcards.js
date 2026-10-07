document.addEventListener('DOMContentLoaded', () => {
    const app = document.querySelector('[data-practice]');
    if (!app) return;

    const questions = Array.from(app.querySelectorAll('[data-practice-question]'));
    const count = questions.length;
    const counter = app.querySelector('#practice-count');
    const scoreLabel = app.querySelector('#practice-score');
    const progress = app.querySelector('#practice-progress-fill');
    const prev = app.querySelector('[data-practice-prev]');
    const next = app.querySelector('[data-practice-next]');
    const hint = app.querySelector('[data-practice-hint]');
    const stack = app.querySelector('.practice-question-stack');
    const finish = app.querySelector('[data-practice-finish]');
    let index = 0;
    let score = 0;

    function render() {
        questions.forEach((question, questionIndex) => { question.hidden = questionIndex !== index; });
        counter.textContent = `${Math.min(index + 1, count)} / ${count}`;
        scoreLabel.textContent = String(score);
        progress.style.width = `${(index / count) * 100}%`;
        prev.disabled = index === 0;
        const isAnswered = questions[index].dataset.answered === 'true';
        next.disabled = !isAnswered;
        next.textContent = index === count - 1 ? 'Ver resultado →' : 'Próxima questão →';
        hint.textContent = isAnswered ? 'Resposta conferida. Continue quando quiser.' : 'Escolha uma alternativa para conferir.';
    }

    questions.forEach(question => {
        question.addEventListener('change', event => {
            const input = event.target.closest('input[type="radio"]');
            if (!input || question.dataset.answered === 'true') return;
            const correctAnswer = question.dataset.correct;
            const isCorrect = input.value === correctAnswer;
            question.dataset.answered = 'true';
            if (isCorrect) score++;
            question.querySelectorAll('.practice-choice').forEach(choice => {
                const radio = choice.querySelector('input');
                radio.disabled = true;
                if (radio.value === correctAnswer) choice.classList.add('is-correct');
                else if (radio.checked) choice.classList.add('is-wrong');
            });
            const feedback = question.querySelector('[data-practice-feedback]');
            feedback.hidden = false;
            feedback.classList.toggle('feedback-correct', isCorrect);
            feedback.classList.toggle('feedback-wrong', !isCorrect);
            const title = document.createElement('strong');
            title.textContent = isCorrect ? 'Resposta correta!' : `Ainda não. A alternativa correta é ${correctAnswer}.`;
            const explanation = document.createElement('p');
            explanation.textContent = question.dataset.explanation || 'Revise o conteúdo relacionado e tente novamente em outra rodada.';
            feedback.replaceChildren(title, explanation);
            render();
        });
    });

    prev.addEventListener('click', () => { if (index > 0) { index--; render(); } });
    next.addEventListener('click', () => {
        if (questions[index].dataset.answered !== 'true') return;
        if (index < count - 1) { index++; render(); return; }
        stack.hidden = true;
        app.querySelector('.practice-overview').hidden = true;
        app.querySelector('.practice-controls').hidden = true;
        finish.hidden = false;
        finish.querySelector('[data-practice-final-score]').textContent = `${score} de ${count}`;
        progress.style.width = '100%';
    });
    app.querySelector('[data-practice-restart]').addEventListener('click', () => window.location.reload());
    render();
});
