import { prefersReducedMotion } from '../core/motion.js';

const COLORS = ['#C84B31', '#5C8374', '#E8A87C', '#6B8E4E', '#D97706', '#B8392E', '#D17A4A'];
const PARTICLE_COUNT = 110;
const FADE_START = 0.55;
const FADE_STEP = 0.02;
const OFFSCREEN_MARGIN = 30;
const LINGER_MS = 1000;

let canvas = null;
let context = null;

const fitCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

export function initConfetti() {
    canvas = document.getElementById('confetti-canvas');
    context = canvas.getContext('2d');
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
}

const createParticle = () => ({
    x: canvas.width * 0.5,
    y: canvas.height * 0.5,
    vx: (Math.random() - 0.5) * 16,
    vy: (Math.random() - 1.2) * 18,
    size: Math.random() * 7 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    gravity: 0.45 + Math.random() * 0.15,
    alpha: 1,
    isRect: Math.random() < 0.5
});

function draw(particle) {
    context.save();
    context.globalAlpha = particle.alpha;
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation);
    context.fillStyle = particle.color;
    if (particle.isRect) {
        context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
    } else {
        context.beginPath();
        context.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        context.fill();
    }
    context.restore();
}

/** A burst of confetti from the middle of the screen. Does nothing when the user prefers less motion. */
export function fireConfetti(durationMs = 2200) {
    if (prefersReducedMotion()) return;

    const particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
    const startedAt = performance.now();

    const animate = (now) => {
        const elapsed = now - startedAt;
        context.clearRect(0, 0, canvas.width, canvas.height);

        let alive = 0;
        particles.forEach((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            particle.rotation += particle.rotationSpeed;
            if (elapsed > durationMs * FADE_START) particle.alpha = Math.max(0, particle.alpha - FADE_STEP);
            if (particle.alpha <= 0 || particle.y > canvas.height + OFFSCREEN_MARGIN) return;

            alive += 1;
            draw(particle);
        });

        if (alive > 0 && elapsed < durationMs + LINGER_MS) requestAnimationFrame(animate);
        else context.clearRect(0, 0, canvas.width, canvas.height);
    };
    requestAnimationFrame(animate);
}
