// Script global - funcionalidades comuns
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNavigation = document.getElementById('main-navigation');
    if (menuToggle && mainNavigation) {
        menuToggle.addEventListener('click', function() {
            const open = mainNavigation.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            menuToggle.textContent = open ? '×' : '☰';
        });
        mainNavigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
            mainNavigation.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.textContent = '☰';
        }));
    }

    const avatarPreview = document.getElementById('avatar-preview');
    const avatarRadios = Array.from(document.querySelectorAll('input[name="avatar_key"]'));
    const photoInput = document.getElementById('profile-photo-input');
    const useAvatar = document.querySelector('input[name="usar_avatar"]');
    if (avatarPreview && avatarRadios.length) {
        const showPreset = radio => {
            document.querySelectorAll('.avatar-option').forEach(option => option.classList.toggle('selected', option.contains(radio)));
            avatarPreview.className = `profile-avatar-preview preset-${radio.value}`;
            avatarPreview.replaceChildren(Object.assign(document.createElement('span'), { textContent: radio.parentElement.querySelector('.avatar-swatch').textContent }));
            if (useAvatar) useAvatar.checked = true;
        };
        avatarRadios.forEach(radio => radio.addEventListener('change', () => showPreset(radio)));
        document.getElementById('random-avatar')?.addEventListener('click', () => {
            const options = avatarRadios.filter(radio => !radio.checked);
            const chosen = options[Math.floor(Math.random() * options.length)] || avatarRadios[0];
            chosen.checked = true;
            showPreset(chosen);
        });
        photoInput?.addEventListener('change', () => {
            const file = photoInput.files?.[0];
            if (!file || !file.type.startsWith('image/')) return;
            if (useAvatar) useAvatar.checked = false;
            const image = document.createElement('img');
            image.alt = 'Prévia da foto de perfil';
            image.src = URL.createObjectURL(file);
            avatarPreview.className = 'profile-avatar-preview has-photo';
            avatarPreview.replaceChildren(image);
        });
    }

    const quizForm = document.querySelector('[data-quiz-form]');
    if (quizForm) {
        const questions = Array.from(quizForm.querySelectorAll('[data-question-card]'));
        const progressFill = document.getElementById('quiz-progress-fill');
        const progressLabel = document.getElementById('quiz-progress-label');
        const progressTrack = quizForm.querySelector('[role="progressbar"]');
        const questionList = quizForm.querySelector('.quiz-question-list');
        let currentQuestion = 0;
        quizForm.noValidate = true;
        quizForm.classList.add('has-stepper');

        // Transforme a lista longa em uma experiência guiada, uma questão por vez.
        const stepper = document.createElement('nav');
        stepper.className = 'quiz-stepper';
        stepper.setAttribute('aria-label', 'Navegação das questões');
        const stepButtons = questions.map((_, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quiz-step';
            button.textContent = String(index + 1).padStart(2, '0');
            button.setAttribute('aria-label', `Ir para a questão ${index + 1}`);
            button.addEventListener('click', () => showQuestion(index));
            stepper.append(button);
            return button;
        });
        const stepStatus = document.createElement('p');
        stepStatus.className = 'quiz-step-status';
        stepStatus.setAttribute('aria-live', 'polite');
        stepper.append(stepStatus);
        if (questionList && questions.length > 1) quizForm.querySelector('.quiz-progress-card')?.after(stepper);

        const controls = document.createElement('div');
        controls.className = 'quiz-step-controls';
        const previousButton = document.createElement('button');
        previousButton.type = 'button';
        previousButton.className = 'btn btn-secondary';
        previousButton.textContent = '← Anterior';
        previousButton.addEventListener('click', () => showQuestion(currentQuestion - 1));
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'btn btn-primary';
        nextButton.textContent = 'Próxima questão →';
        nextButton.addEventListener('click', () => showQuestion(currentQuestion + 1));
        controls.append(previousButton, nextButton);
        if (questionList && questions.length > 1) questionList.after(controls);

        function showQuestion(index) {
            if (!Number.isInteger(index) || index < 0 || index >= questions.length) return;
            currentQuestion = index;
            questions.forEach((question, questionIndex) => {
                question.classList.toggle('is-current', questionIndex === index);
                question.hidden = questionIndex !== index;
            });
            stepButtons.forEach((button, buttonIndex) => {
                button.classList.toggle('is-current', buttonIndex === index);
                button.setAttribute('aria-current', buttonIndex === index ? 'step' : 'false');
            });
            stepStatus.textContent = `Questão ${index + 1} de ${questions.length}`;
            previousButton.disabled = index === 0;
            nextButton.hidden = index === questions.length - 1;
            quizForm.querySelector('.quiz-submit-row button[type="submit"]')?.classList.toggle('is-last-step', index === questions.length - 1);
        }

        const updateQuizProgress = () => {
            let answered = 0;
            questions.forEach(question => {
                const hasAnswer = Boolean(question.querySelector('input[type="radio"]:checked')) || Boolean(question.querySelector('textarea')?.value.trim());
                question.classList.toggle('is-answered', hasAnswer);
                question.querySelector('.question-state').textContent = hasAnswer ? 'Respondida' : 'Pendente';
                stepButtons[questions.indexOf(question)]?.classList.toggle('is-answered', hasAnswer);
                if (hasAnswer) answered++;
            });
            const total = questions.length;
            if (progressFill) progressFill.style.width = `${total ? (answered / total) * 100 : 0}%`;
            if (progressLabel) progressLabel.textContent = `${answered} de ${total} respondidas`;
            if (progressTrack) progressTrack.setAttribute('aria-valuenow', answered);
        };
        async function checkPracticeAnswer(input) {
            const question = input.closest('[data-question-card]');
            const feedback = question?.querySelector('[data-live-feedback]');
            const match = input.name.match(/\[(\d+)\]/);
            if (!feedback || !match) return;
            feedback.hidden = false;
            feedback.className = 'quiz-live-feedback is-loading';
            feedback.textContent = 'Conferindo sua resposta…';
            const body = new URLSearchParams({ acao: 'conferir_resposta', questao_id: match[1], resposta: input.value });
            try {
                const response = await fetch(quizForm.action, { method: 'POST', body, headers: { 'Accept': 'application/json' }, credentials: 'same-origin' });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Não foi possível conferir agora.');
                if (!input.checked) return;
                question.querySelectorAll('.quiz-option').forEach(label => {
                    label.classList.remove('choice-correct', 'choice-wrong');
                    const radio = label.querySelector('input');
                    if (radio.value === result.correct_answer) label.classList.add('choice-correct');
                    else if (radio.checked) label.classList.add('choice-wrong');
                });
                feedback.className = `quiz-live-feedback ${result.correct ? 'is-correct' : 'is-wrong'}`;
                const heading = document.createElement('strong');
                heading.textContent = result.correct ? 'Isso mesmo! Resposta correta.' : `Quase! A resposta correta é ${result.correct_answer}) ${result.correct_text}.`;
                const explanation = document.createElement('span');
                explanation.textContent = result.explanation || '';
                feedback.replaceChildren(heading, explanation);
            } catch (error) {
                feedback.className = 'quiz-live-feedback is-wrong';
                feedback.textContent = 'Não foi possível conferir agora. Sua resposta continua salva no desafio.';
            }
        }

        quizForm.addEventListener('change', event => {
            updateQuizProgress();
            if (quizForm.hasAttribute('data-live-check') && event.target.matches('input[type="radio"]')) checkPracticeAnswer(event.target);
        });
        quizForm.addEventListener('input', updateQuizProgress);
        quizForm.addEventListener('submit', event => {
            const missingIndex = questions.findIndex(question => !question.querySelector('input[type="radio"]:checked') && !question.querySelector('textarea')?.value.trim());
            if (missingIndex >= 0) {
                event.preventDefault();
                showQuestion(missingIndex);
                stepStatus.textContent = `Responda à questão ${missingIndex + 1} para concluir o desafio.`;
                questions[missingIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        updateQuizProgress();
        showQuestion(0);
    }

    // Ctrl+A abre a área do professor. Em campos editáveis, Ctrl+A continua selecionando texto.
    document.addEventListener('keydown', function(e) {
        const active = document.activeElement;
        const editing = active && active.closest('input, textarea, select, [contenteditable="true"]');
        if (!e.ctrlKey || e.altKey || e.metaKey || e.key.toLowerCase() !== 'a' || editing) return;

        e.preventDefault();
        const path = window.location.pathname.toLowerCase();
        const role = document.body.dataset.userRole || '';
        const isAdminArea = path.includes('/admin/');
        if (role === 'admin' || isAdminArea) {
            window.location.href = isAdminArea ? 'dashboard.php' : 'admin/dashboard.php';
        } else {
            window.location.href = path.includes('/aluno/') ? '../login.php?admin=1' : 'login.php?admin=1';
        }
    });

    // Fechar modais com tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modais = document.querySelectorAll('.modal-overlay.active');
            modais.forEach(m => m.classList.remove('active'));
        }
    });

    // Animação suave em links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
});
