// =========================================================
// BAHASA MAMA MODE - Conversational AI Coach
// Multi-turn chat dengan AI berperan sebagai orang tua
// untuk latih komunikasi anti-hoaks
// =========================================================

(function initCoachModule() {
    const PERSONA_DATA = {
        mama: { name: 'Mama', initial: 'M', mood: 'Skeptis - Defensif', avatarClass: 'member-mama' },
        papa: { name: 'Papa', initial: 'P', mood: 'Tegas - Ngeyel', avatarClass: 'member-papa' },
        om: { name: 'Om Heri', initial: 'O', mood: 'Pamer pengetahuan', avatarClass: 'member-om' },
        tante: { name: 'Tante Rosa', initial: 'T', mood: 'Heboh - Dramatis', avatarClass: 'member-tante' }
    };

    let state = {
        persona: 'mama',
        scenario: '',
        history: [],
        sending: false,
        evaluating: false
    };

    document.addEventListener('DOMContentLoaded', () => {
        const setupEl = document.getElementById('coach-setup');
        const chatWrap = document.getElementById('coach-chat-wrap');
        const evalWrap = document.getElementById('coach-eval-wrap');
        const personaBtns = document.querySelectorAll('.coach-persona-btn');
        const scenarioInput = document.getElementById('coach-scenario-input');
        const scenarioChips = document.querySelectorAll('.coach-scenario-chip');
        const startBtn = document.getElementById('coach-start-btn');
        const backBtn = document.getElementById('coach-back-btn');
        const endBtn = document.getElementById('coach-end-btn');
        const sendBtn = document.getElementById('coach-send-btn');
        const inputEl = document.getElementById('coach-input');
        const messagesEl = document.getElementById('coach-messages');
        const activeAvatar = document.getElementById('coach-active-avatar');
        const activeName = document.getElementById('coach-active-name');
        const activeMood = document.getElementById('coach-active-mood');
        const restartBtn = document.getElementById('coach-restart-btn');

        if (!setupEl || !chatWrap || !startBtn) return;

        // Hero promo card on Beranda -> navigate to Simulator + scroll to coach section
        const heroPromoCoach = document.getElementById('hero-promo-coach');
        if (heroPromoCoach) {
            heroPromoCoach.addEventListener('click', () => {
                const simulatorNavBtn = document.querySelector('.bottom-nav-btn[data-tab="simulator"], .sidebar-nav-btn[data-tab="simulator"]');
                if (simulatorNavBtn) simulatorNavBtn.click();
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        const coachSection = document.getElementById('coach-section');
                        if (coachSection) {
                            coachSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 280);
                });
            });
        }

        // Persona selection
        personaBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                personaBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-checked', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-checked', 'true');
                state.persona = btn.dataset.persona;
            });
        });

        // Scenario preset chips
        scenarioChips.forEach(chip => {
            chip.addEventListener('click', () => {
                scenarioInput.value = chip.dataset.scenario;
                scenarioInput.focus();
            });
        });

        // Start training session
        startBtn.addEventListener('click', () => {
            const scenario = scenarioInput.value.trim();
            if (scenario.length < 5) {
                scenarioInput.focus();
                showCoachToast('Mohon isi atau pilih skenario hoaks terlebih dahulu.', 'warning');
                return;
            }
            state.scenario = scenario;
            state.history = [];

            const persona = PERSONA_DATA[state.persona];
            activeAvatar.textContent = persona.initial;
            activeAvatar.className = 'coach-chat-avatar';
            activeName.textContent = persona.name;
            activeMood.textContent = persona.mood;

            setupEl.classList.add('hidden');
            evalWrap.classList.add('hidden');
            chatWrap.classList.remove('hidden');

            renderInitialForwardedHoax();
            triggerHaptic([8]);
        });

        // Back to setup
        backBtn.addEventListener('click', () => {
            chatWrap.classList.add('hidden');
            evalWrap.classList.add('hidden');
            setupEl.classList.remove('hidden');
            messagesEl.innerHTML = '';
            state.history = [];
        });

        // End session - evaluate
        endBtn.addEventListener('click', async () => {
            if (state.history.filter(h => h.role === 'user').length < 1) {
                showCoachToast('Kirim minimal satu balasan dulu untuk dievaluasi.', 'warning');
                return;
            }
            await evaluateConversation();
        });

        // Restart from evaluation
        restartBtn.addEventListener('click', () => {
            evalWrap.classList.add('hidden');
            setupEl.classList.remove('hidden');
            messagesEl.innerHTML = '';
            state.history = [];
            scenarioInput.value = '';
        });

        // Send message
        sendBtn.addEventListener('click', sendUserMessage);
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendUserMessage();
            }
        });

        // Auto-resize textarea
        inputEl.addEventListener('input', () => {
            inputEl.style.height = 'auto';
            inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
        });

        function renderInitialForwardedHoax() {
            messagesEl.innerHTML = '';
            const persona = PERSONA_DATA[state.persona];
            const forwarded = document.createElement('div');
            forwarded.className = 'coach-msg parent';
            forwarded.innerHTML = `
                <div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(persona.name)} mem-forward:</div>
                <div>${escapeHtml(state.scenario)}</div>
            `;
            messagesEl.appendChild(forwarded);

            // Add the parent message to history as the initial forwarded content
            // (not part of conversation turns; just context)
            scrollToBottom();
        }

        async function sendUserMessage() {
            const text = inputEl.value.trim();
            if (!text || state.sending) return;

            state.sending = true;
            sendBtn.disabled = true;

            // Render user bubble
            const userBubble = document.createElement('div');
            userBubble.className = 'coach-msg user';
            userBubble.textContent = text;
            messagesEl.appendChild(userBubble);
            inputEl.value = '';
            inputEl.style.height = 'auto';
            scrollToBottom();

            state.history.push({ role: 'user', text });
            triggerHaptic([5]);

            // Show typing
            const typingEl = document.createElement('div');
            typingEl.className = 'coach-msg typing';
            typingEl.innerHTML = '<span></span><span></span><span></span>';
            messagesEl.appendChild(typingEl);
            scrollToBottom();

            try {
                const res = await fetch('/api/coach', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        persona: state.persona,
                        scenario: state.scenario,
                        history: state.history
                    })
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || `HTTP ${res.status}`);
                }
                const data = await res.json();
                typingEl.remove();

                const parentBubble = document.createElement('div');
                parentBubble.className = 'coach-msg parent';
                parentBubble.textContent = data.reply;
                messagesEl.appendChild(parentBubble);
                state.history.push({ role: 'model', text: data.reply });

                // Update mood label based on conversation progress
                updateMoodLabel();
                scrollToBottom();
                triggerHaptic([3, 30, 3]);
            } catch (error) {
                typingEl.remove();
                const errBubble = document.createElement('div');
                errBubble.className = 'coach-msg parent';
                errBubble.style.borderLeft = '3px solid var(--danger)';
                errBubble.textContent = `Gagal memuat balasan. ${error.message || ''}`.trim();
                messagesEl.appendChild(errBubble);
                scrollToBottom();
            } finally {
                state.sending = false;
                sendBtn.disabled = false;
                inputEl.focus();
            }
        }

        function updateMoodLabel() {
            const userTurns = state.history.filter(h => h.role === 'user').length;
            if (userTurns < 2) activeMood.textContent = 'Skeptis - Defensif';
            else if (userTurns < 4) activeMood.textContent = 'Mulai Mendengar';
            else if (userTurns < 6) activeMood.textContent = 'Mempertimbangkan';
            else activeMood.textContent = 'Mendukung Klarifikasi';
        }

        async function evaluateConversation() {
            if (state.evaluating) return;
            state.evaluating = true;
            endBtn.disabled = true;
            endBtn.textContent = 'Menganalisis...';

            try {
                const res = await fetch('/api/coach/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ history: state.history })
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || `HTTP ${res.status}`);
                }
                const data = await res.json();
                renderEvaluation(data);
            } catch (error) {
                showCoachToast('Gagal mengevaluasi: ' + (error.message || 'unknown'), 'danger');
            } finally {
                state.evaluating = false;
                endBtn.disabled = false;
                endBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Selesai';
            }
        }

        function renderEvaluation(data) {
            const score = Math.max(0, Math.min(100, Number(data.skorTotal) || 0));
            chatWrap.classList.add('hidden');
            evalWrap.classList.remove('hidden');

            const scoreNum = document.getElementById('coach-eval-score-num');
            const scoreArc = document.getElementById('coach-eval-score-arc');
            const strengthsEl = document.getElementById('coach-eval-strengths');
            const improvementsEl = document.getElementById('coach-eval-improvements');
            const recEl = document.getElementById('coach-eval-rec');

            // Animate score count-up
            const startTime = performance.now();
            const animate = (now) => {
                const t = Math.min(1, (now - startTime) / 1300);
                const eased = 1 - Math.pow(1 - t, 3);
                scoreNum.textContent = String(Math.floor(score * eased));
                if (t < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);

            // Animate score ring
            const circumference = 314.16;
            const offset = circumference - (score / 100) * circumference;
            setTimeout(() => {
                scoreArc.style.strokeDashoffset = String(offset);
            }, 100);

            // Strengths
            strengthsEl.innerHTML = '';
            (data.kekuatan || []).forEach(s => {
                const li = document.createElement('li');
                li.textContent = s;
                strengthsEl.appendChild(li);
            });
            if (!(data.kekuatan || []).length) {
                strengthsEl.innerHTML = '<li>Belum ada poin kekuatan yang menonjol di sesi ini.</li>';
            }

            // Improvements
            improvementsEl.innerHTML = '';
            (data.perbaikan || []).forEach(s => {
                const li = document.createElement('li');
                li.textContent = s;
                improvementsEl.appendChild(li);
            });
            if (!(data.perbaikan || []).length) {
                improvementsEl.innerHTML = '<li>Komunikasi sudah sangat baik, pertahankan.</li>';
            }

            // Recommendation
            recEl.textContent = data.rekomendasi || 'Lanjutkan latihan dengan skenario lain untuk variasi.';

            // Confetti if score is high
            if (score >= 80 && typeof window.__saringSiniConfetti === 'function') {
                setTimeout(() => window.__saringSiniConfetti(1500), 600);
            }
        }

        function scrollToBottom() {
            requestAnimationFrame(() => {
                messagesEl.scrollTop = messagesEl.scrollHeight;
            });
        }

        function escapeHtml(s) {
            return String(s).replace(/[&<>"']/g, c => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[c]));
        }

        function triggerHaptic(pattern) {
            if (navigator.vibrate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                try { navigator.vibrate(pattern); } catch (_) { /* ignore */ }
            }
        }

        function showCoachToast(msg, variant = 'safe') {
            const toast = document.getElementById('toast');
            if (!toast) return;
            toast.textContent = msg;
            toast.classList.remove('toast-safe', 'toast-warning', 'toast-danger');
            toast.classList.add(`toast-${variant}`, 'show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    });
})();
