document.addEventListener('DOMContentLoaded', () => {
    const typeSelect = document.getElementById('teacher-question-type');
    if (!typeSelect) return;
    const multipleFields = document.getElementById('teacher-multiple-fields');
    const answerLabel = document.getElementById('teacher-choice-answer');
    const answerSelect = document.getElementById('teacher-answer-choice');
    const textAnswer = document.getElementById('teacher-text-answer');
    const textAnswerInput = document.getElementById('teacher-answer-text');
    const alternatives = Array.from(multipleFields.querySelectorAll('input'));

    function updateQuestionFields() {
        const type = typeSelect.value;
        const isMultiple = type === 'multipla';
        const isEssay = type === 'dissertativa';
        multipleFields.hidden = !isMultiple;
        alternatives.forEach(input => { input.required = isMultiple; });
        answerLabel.hidden = isEssay;
        answerSelect.disabled = isEssay;
        answerSelect.required = !isEssay;
        textAnswer.hidden = !isEssay;
        textAnswerInput.required = isEssay;
        textAnswerInput.disabled = !isEssay;
        answerSelect.replaceChildren();
        const choices = isMultiple ? [['A','Alternativa A'],['B','Alternativa B'],['C','Alternativa C'],['D','Alternativa D']] : [['V','Verdadeiro'],['F','Falso']];
        choices.forEach(([value,label]) => answerSelect.add(new Option(label, value)));
    }
    typeSelect.addEventListener('change', updateQuestionFields);
    updateQuestionFields();
});
