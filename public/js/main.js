import { installErrorBoundary } from './core/error-boundary.js';
import { storage } from './core/storage.js';
import { initToast } from './core/toast.js';
import { initAnalytics } from './features/analytics.js';
import { initAnalyze } from './features/analyze.js';
import { initCoach } from './features/coach.js';
import { initCommunity } from './features/community.js';
import { initConfetti } from './features/confetti.js';
import { initEducation } from './features/education.js';
import { initHeroStats } from './features/hero-stats.js';
import { initHoaxDna } from './features/hoax-dna.js';
import { initHoaxMap } from './features/hoax-map.js';
import { initInfographic } from './features/infographic.js';
import { initInputTabs } from './features/input-tabs.js';
import { initLiveActivity } from './features/live-activity.js';
import { initNavigation } from './features/navigation.js';
import { initOnboarding } from './features/onboarding.js';
import { initPdfReport } from './features/pdf-report.js';
import { initPwa } from './features/pwa.js';
import { initQuiz } from './features/quiz.js';
import { initReplies } from './features/replies.js';
import { initSimulator } from './features/simulator.js';
import { initToneSlider } from './features/tone-slider.js';
import { initVoiceInput } from './features/voice-input.js';

installErrorBoundary();

// Dark mode was removed; forget the preference older versions stored.
storage.remove('saringsini_theme');

initToast();
initConfetti();
initNavigation();
initInputTabs();
initAnalyze();
initVoiceInput();
initReplies();
initToneSlider();
initInfographic();
initPdfReport();
initHoaxDna();
initSimulator();
initCoach();
initEducation();
initQuiz();
initOnboarding();
initHeroStats();
initLiveActivity();
initPwa();
// Last: it announces the loaded feed, which analytics and the map render themselves from.
initAnalytics();
initHoaxMap();
initCommunity();

console.log(
    '%c SaringSini v2.3 ',
    'background:linear-gradient(135deg,#C84B31,#5C8374);color:#fff;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:bold',
    ' Asisten Anti-Hoaks Keluarga Indonesia'
);
