import { shareOnWhatsApp } from '../core/whatsapp.js';
import { fireConfetti } from './confetti.js';
import { QUIZ_QUESTIONS } from './quiz-data.js';

const POINTS_PER_ANSWER = 10;
const CONFETTI_MIN_CORRECT = 8;
const CONFETTI_MS = 2400;

// Highest tier first: the first one the score reaches is shown.
const RESULT_TIERS = [
    { fromPercent: 90, title: 'Master Pahlawan Fakta!', message: 'Luar biasa! Kamu siap menjadi penjaga kebenaran keluarga Indonesia.' },
    { fromPercent: 70, title: 'Pejuang Fakta Andal', message: 'Sangat baik. Sedikit latihan lagi dan kamu jadi master.' },
    { fromPercent: 50, title: 'Sedang Berlatih', message: 'Kamu di jalur yang benar. Pelajari trik di tab Edukasi.' },
    { fromPercent: 0, title: 'Tetap Semangat!', message: 'Hoaks memang licik. Pakai SaringSini sebagai senjatamu.' }
];

const byId = (id) => document.getElementById(id);

const shuffled = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export function initQuiz() {
    const answerButtons = document.querySelectorAll('.quiz-answer-btn');

    let questions = [];
    let index = 0;
    let score = 0;
    let correctCount = 0;
    let answered = false;

    const percentCorrect = () => (questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0);

    const showScreen = (name) => {
        ['intro', 'active', 'result'].forEach((screen) => {
            byId(`quiz-${screen}`).classList.toggle('hidden', screen !== name);
        });
    };

    const setProgress = (answeredCount) => {
        byId('quiz-progress-fill').style.width = `${(answeredCount / questions.length) * 100}%`;
    };

    function showQuestion() {
        answered = false;
        byId('quiz-current-num').textContent = String(index + 1);
        byId('quiz-total-num').textContent = String(questions.length);
        byId('quiz-current-score').textContent = String(score);
        byId('quiz-question-text').textContent = questions[index].text;
        setProgress(index);

        answerButtons.forEach((button) => {
            button.disabled = false;
            button.classList.remove('correct-flash', 'wrong-flash');
        });
        byId('quiz-explanation').classList.add('hidden');
    }

    function answer(choice) {
        if (answered) return;
        answered = true;

        const question = questions[index];
        const isCorrect = question.answer === choice;
        answerButtons.forEach((button) => {
            button.disabled = true;
            if (button.dataset.answer === choice) button.classList.add(isCorrect ? 'correct-flash' : 'wrong-flash');
        });

        if (isCorrect) {
            score += POINTS_PER_ANSWER;
            correctCount += 1;
            byId('quiz-current-score').textContent = String(score);
        }

        const header = byId('quiz-explanation-header');
        header.textContent = isCorrect ? 'Tepat!' : 'Belum tepat.';
        header.className = `quiz-explanation-header ${isCorrect ? 'correct' : 'wrong'}`;
        byId('quiz-explanation-text').textContent = question.explanation;
        byId('quiz-explanation').classList.remove('hidden');
        setProgress(index + 1);
    }

    function finish() {
        const percent = percentCorrect();
        const tier = RESULT_TIERS.find((candidate) => percent >= candidate.fromPercent);

        byId('quiz-result-correct').textContent = String(correctCount);
        byId('quiz-result-score').textContent = String(score);
        byId('quiz-result-percent').textContent = `${percent}%`;
        byId('quiz-result-title').textContent = tier.title;
        byId('quiz-result-message').textContent = tier.message;
        showScreen('result');

        if (correctCount >= CONFETTI_MIN_CORRECT) fireConfetti(CONFETTI_MS);
    }

    function start() {
        questions = shuffled(QUIZ_QUESTIONS);
        index = 0;
        score = 0;
        correctCount = 0;
        showScreen('active');
        showQuestion();
    }

    byId('quiz-start-btn').addEventListener('click', start);
    byId('quiz-retry-btn').addEventListener('click', start);
    answerButtons.forEach((button) => button.addEventListener('click', () => answer(button.dataset.answer)));

    byId('quiz-next-btn').addEventListener('click', () => {
        index += 1;
        if (index >= questions.length) finish();
        else showQuestion();
    });

    byId('quiz-share-btn').addEventListener('click', () => {
        shareOnWhatsApp(
            `Saya berhasil deteksi ${correctCount}/${questions.length} hoaks (skor ${score} - ${percentCorrect()}%) di tantangan SaringSini. Ayo uji kemampuanmu juga!`
        );
    });
}
