/**
 * ====================================================================
 * MISIÓN AVENTURA MOTRIZ - JUEGO EDUCATIVO DE MOTRICIDAD GRUESA
 * Especialmente diseñado para 3.º a 5.º grado de primaria (8 a 11 años)
 * JavaScript Nativo (Vanilla JS) sin dependencias externas
 * ====================================================================
 */

// ====================================================================
// 1. MOTOR DE AUDIO SINTETIZADO (Web Audio API)
// ====================================================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio no inicializado:', e);
    }
  }

  // Sonido de clic suave
  click() {
    this.playTone(600, 'triangle', 0.08, 0.1);
  }

  // Latido / Tic de metrónomo rítmico
  beat() {
    this.playTone(440, 'sine', 0.08, 0.12);
  }

  // Alerta de conteo regresivo
  tick(isLast = false) {
    if (isLast) {
      this.playTone(880, 'square', 0.25, 0.2);
    } else {
      this.playTone(520, 'sine', 0.1, 0.15);
    }
  }

  // Éxito / Reto completado (Arpegio ascendente)
  success() {
    if (!this.enabled) return;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.2);
      }, idx * 70);
    });
  }

  // Gran Fanfarria de Victoria
  fanfare() {
    if (!this.enabled) return;
    const melody = [523, 659, 784, 1046, 784, 1046];
    melody.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.35, 0.25);
      }, idx * 120);
    });
  }

  // Sonido de respiración relajante (Tono envolvente)
  breath(isInhale) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const startFreq = isInhale ? 220 : 330;
      const endFreq = isInhale ? 330 : 220;

      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + 3.8);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1.9);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 3.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 4.0);
    } catch (e) {}
  }
}

const sfx = new SoundFX();

// ====================================================================
// 2. SISTEMA DE SÍNTESIS DE VOZ (Text to Speech accesible)
// ====================================================================
class VoiceGuide {
  constructor() {
    this.enabled = true;
    this.voice = null;
    this.init();
  }

  init() {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Buscar voz en español
        this.voice = voices.find(v => v.lang.startsWith('es')) || null;
      };
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  speak(text) {
    if (!this.enabled || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (this.voice) utter.voice = this.voice;
      utter.lang = 'es-ES';
      utter.rate = 1.0;
      utter.pitch = 1.1; // Tono alegre y enérgico
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }
}

const voice = new VoiceGuide();

// ====================================================================
// 3. GENERADOR DE GRÁFICOS SVG DEL PERSONAJE Y ANIMACIONES
// ====================================================================
class CharacterRenderer {
  /**
   * Genera el SVG del personaje explorador "Leo" adaptado a cada postura física
   */
  static getSVG(animationType = 'standing') {
    let animClass = `anim-${animationType}`;
    let extraSVG = '';

    // Elementos adicionales según el ejercicio
    if (animationType === 'rope') {
      extraSVG = `
        <ellipse cx="100" cy="140" rx="65" ry="90" fill="none" stroke="#ffd166" stroke-width="4" stroke-dasharray="8 6">
          <animateTransform attributeName="transform" type="rotate" from="0 100 140" to="360 100 140" dur="0.8s" repeatCount="indefinite"/>
        </ellipse>
      `;
    }

    return `
      <svg viewBox="0 0 200 240" class="character-svg ${animClass}" width="100%" height="100%">
        <!-- Sombra en el suelo -->
        <ellipse cx="100" cy="225" rx="45" ry="8" fill="rgba(0,0,0,0.15)"/>
        
        ${extraSVG}

        <!-- CUERPO DEL PERSONAJE -->
        <g id="character-leo">
          <!-- Pierna Izquierda -->
          <g class="char-leg-left">
            <rect x="74" y="150" width="16" height="55" rx="8" fill="#1e3a8a"/>
            <!-- Zapato -->
            <rect x="68" y="200" width="26" height="15" rx="6" fill="#ef4444"/>
          </g>

          <!-- Pierna Derecha -->
          <g class="char-leg-right">
            <rect x="110" y="150" width="16" height="55" rx="8" fill="#1e3a8a"/>
            <!-- Zapato -->
            <rect x="106" y="200" width="26" height="15" rx="6" fill="#ef4444"/>
          </g>

          <!-- Torso / Camiseta Aventurera -->
          <g class="char-torso">
            <!-- Mochila de explorador atrás -->
            <rect x="66" y="90" width="68" height="60" rx="12" fill="#78350f"/>
            <!-- Torso -->
            <rect x="70" y="85" width="60" height="70" rx="14" fill="#ff6b35"/>
            <!-- Cuello y detalles -->
            <path d="M 85 85 L 100 105 L 115 85 Z" fill="#ffd166"/>
            <!-- Cinturón -->
            <rect x="70" y="142" width="60" height="12" fill="#1f2937"/>
            <rect x="94" y="140" width="12" height="16" rx="2" fill="#facc15"/>
          </g>

          <!-- Brazo Izquierdo -->
          <g class="char-arm-left">
            <rect x="52" y="90" width="16" height="55" rx="8" fill="#ff8c42"/>
            <!-- Mano / Guante -->
            <circle cx="60" cy="148" r="9" fill="#fed7aa"/>
          </g>

          <!-- Brazo Derecho -->
          <g class="char-arm-right">
            <rect x="132" y="90" width="16" height="55" rx="8" fill="#ff8c42"/>
            <!-- Mano / Guante -->
            <circle cx="140" cy="148" r="9" fill="#fed7aa"/>
          </g>

          <!-- Cabeza -->
          <g class="char-head">
            <circle cx="100" cy="54" r="32" fill="#fed7aa"/>
            
            <!-- Orejas -->
            <circle cx="68" cy="54" r="8" fill="#fed7aa"/>
            <circle cx="132" cy="54" r="8" fill="#fed7aa"/>

            <!-- Ojos alegres -->
            <circle cx="88" cy="50" r="5" fill="#1e293b"/>
            <circle cx="112" cy="50" r="5" fill="#1e293b"/>
            <circle cx="90" cy="48" r="1.5" fill="white"/>
            <circle cx="114" cy="48" r="1.5" fill="white"/>

            <!-- Mejillas sonrosadas -->
            <circle cx="80" cy="60" r="6" fill="#fca5a5" opacity="0.6"/>
            <circle cx="120" cy="60" r="6" fill="#fca5a5" opacity="0.6"/>

            <!-- Gran Sonrisa -->
            <path d="M 90 62 Q 100 74 110 62" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>

            <!-- Gorro de Explorador Aventurero -->
            <path d="M 64 36 Q 100 24 136 36 L 144 42 L 56 42 Z" fill="#059669"/>
            <path d="M 76 34 Q 100 12 124 34 Z" fill="#10b981"/>
            <rect x="76" y="32" width="48" height="6" fill="#047857"/>
            <circle cx="100" cy="22" r="5" fill="#ffd166"/>
          </g>
        </g>
      </svg>
    `;
  }
}

// ====================================================================
// 4. CATÁLOGO COMPLETO DE RETOS FÍSICOS Y PEDAGÓGICOS
// ====================================================================
const CHALLENGES_DATABASE = [
  // --- ISLA 1: SELVA DEL EQUILIBRIO ---
  {
    id: 1,
    islandId: 1,
    islandName: "Selva del Equilibrio",
    title: "El Flamenco Dorado",
    skill: "Equilibrio estático y control postural",
    cue: "¡Párate en un solo pie y abre los brazos como alas de flamenco!",
    tip: "Fija tu mirada en un punto quieto al frente para no tambalearte.",
    type: "flamenco",
    baseSeconds: { facil: 15, medio: 25, dificil: 35 },
    rhythmText: "¡Sostén el equilibrio como una estatua!",
    starsAwarded: 3
  },
  {
    id: 2,
    islandId: 1,
    islandName: "Selva del Equilibrio",
    title: "Cuerda Floja de la Jungla",
    skill: "Equilibrio dinámico y marcha talón-punta",
    cue: "¡Camina 5 pasos hacia adelante talón-punta en línea recta, y regresa!",
    tip: "El talón de un pie debe tocar la punta del otro. ¡Brazos extendidos!",
    type: "walk-line",
    baseSeconds: { facil: 20, medio: 30, dificil: 40 },
    rhythmText: "Talón... punta... talón... punta...",
    starsAwarded: 3
  },

  // --- ISLA 2: VOLCÁN DE LA FUERZA ---
  {
    id: 3,
    islandId: 2,
    islandName: "Volcán de la Fuerza",
    title: "Sentadillas de Lava",
    skill: "Fuerza de piernas y glúteos",
    cue: "¡Baja la cadera como sentándote en una silla para esquivar las rocas!",
    tip: "Mantén la espalda recta y no levantes los talones del suelo.",
    type: "squat",
    baseSeconds: { facil: 15, medio: 25, dificil: 35 },
    rhythmText: "¡Baja despacio y sube con energía!",
    starsAwarded: 3
  },
  {
    id: 4,
    islandId: 2,
    islandName: "Volcán de la Fuerza",
    title: "El Puente Fuerte",
    skill: "Fuerza del core y estabilidad lumbar",
    cue: "¡Apoya tus antebrazos y pies en el suelo, sostén tu cuerpo como una tabla!",
    tip: "No subas demasiado la cadera ni la dejes caer. ¡Respira constante!",
    type: "plank",
    baseSeconds: { facil: 12, medio: 20, dificil: 30 },
    rhythmText: "¡Core firme como una roca volcánica!",
    starsAwarded: 3
  },
  {
    id: 5,
    islandId: 2,
    islandName: "Volcán de la Fuerza",
    title: "Saltos de Rana Explosivos",
    skill: "Potencia muscular y salto vertical",
    cue: "¡Agáchate tocando el suelo y salta alto hacia arriba con las manos al sol!",
    tip: "Aterriza suave flexionando las rodillas para cuidar tus articulaciones.",
    type: "frog-jump",
    baseSeconds: { facil: 15, medio: 25, dificil: 35 },
    rhythmText: "¡Cuclillas y... ¡SALTO DE RANA!",
    starsAwarded: 3
  },

  // --- ISLA 3: CAÑÓN DE LA COORDINACIÓN ---
  {
    id: 6,
    islandId: 3,
    islandName: "Cañón de la Coordinación",
    title: "Estrellas Saltarina (Jumping Jacks)",
    skill: "Coordinación dinámica general y ritmo",
    cue: "¡Abre piernas y brazos al saltar, luego ciérralos juntos con ritmo!",
    tip: "Da una palmada suave sobre tu cabeza en cada salto.",
    type: "jumping-jacks",
    baseSeconds: { facil: 15, medio: 25, dificil: 40 },
    rhythmText: "¡Abro estrella... cierro soldado!",
    starsAwarded: 3
  },
  {
    id: 7,
    islandId: 3,
    islandName: "Cañón de la Coordinación",
    title: "La Cuerda Mágica Invisible",
    skill: "Coordinación óculo-manual y cadencia",
    cue: "¡Gira tus muñecas como si tuvieras una cuerda y salta rítmicamente!",
    tip: "Saltos cortitos en puntas de pie. ¡No necesitas una cuerda real!",
    type: "rope",
    baseSeconds: { facil: 15, medio: 25, dificil: 35 },
    rhythmText: "¡Gira y salta... 1, 2, 3...!",
    starsAwarded: 3
  },

  // --- ISLA 4: RÍO DE LA AGILIDAD ---
  {
    id: 8,
    islandId: 4,
    islandName: "Río de la Agilidad",
    title: "Carrera Relámpago en el Sitio",
    skill: "Velocidad de reacción y resistencia aeróbica",
    cue: "¡Corre en tu lugar elevando las rodillas lo más rápido posible!",
    tip: "Mueve los brazos con fuerza para impulsarte más rápido.",
    type: "run",
    baseSeconds: { facil: 15, medio: 25, dificil: 35 },
    rhythmText: "¡Súper velocidad activada!",
    starsAwarded: 3
  },
  {
    id: 9,
    islandId: 4,
    islandName: "Río de la Agilidad",
    title: "Pasos Rápidos del Cangrejo",
    skill: "Agilidad lateral y cambio de dirección",
    cue: "¡Flexiona las rodillas y da 3 pasos a la derecha, luego 3 a la izquierda!",
    tip: "Mantente agachado y no cruces los pies para no tropezar.",
    type: "crab-walk",
    baseSeconds: { facil: 20, medio: 30, dificil: 40 },
    rhythmText: "¡Derecha, derecha... izquierda, izquierda!",
    starsAwarded: 3
  },

  // --- ISLA 5: MONTAÑA DE LA CONEXIÓN CRUZADA ---
  {
    id: 10,
    islandId: 5,
    islandName: "Cima de Cruce Ninja",
    title: "El Cruce Ninja (Codo a Rodilla)",
    skill: "Lateralidad y cruce de línea media corporal",
    cue: "¡Toca tu rodilla derecha con el codo izquierdo, luego al revés!",
    tip: "Gira tu tronco con control. ¡Excelente para conectar ambos hemisferios cerebrales!",
    type: "cross-elbow",
    baseSeconds: { facil: 15, medio: 25, dificil: 35 },
    rhythmText: "¡Codo izquierdo - rodilla derecha... cambio!",
    starsAwarded: 3
  },
  {
    id: 11,
    islandId: 5,
    islandName: "Cima de Cruce Ninja",
    title: "El Escalador de la Cumbre",
    skill: "Disociación segmentaria y flexibilidad dinámica",
    cue: "¡Toca la punta de tu pie derecho con tu mano izquierda, y alterna!",
    tip: "Mantén las piernas derechitas y levanta la pierna al frente.",
    type: "cross-toe",
    baseSeconds: { facil: 15, medio: 25, dificil: 35 },
    rhythmText: "¡Mano opuesta al pie opuesto... excelente!",
    starsAwarded: 3
  }
];

// Fases de Calentamiento Inicial
const WARMUP_EXERCISES = [
  {
    title: "1. Giros Suaves de Hombros",
    desc: "Mueve tus hombros en círculos grandes hacia atrás, como remando.",
    anim: "shoulders",
    seconds: 15
  },
  {
    title: "2. El Hula-Hula de la Selva",
    desc: "Manos en la cintura y haz círculos amplios con la cadera a un lado y al otro.",
    anim: "hips",
    seconds: 15
  },
  {
    title: "3. Rotación de Muñecas y Tobillos",
    desc: "Gira tus muñecas y un pie en círculos en el aire. ¡Luego cambia de pie!",
    anim: "ankles",
    seconds: 15
  }
];

// Fases de Estiramiento Final
const COOLDOWN_EXERCISES = [
  {
    title: "1. Tocar las Nubes",
    desc: "Estira ambos brazos hacia arriba muy alto, en puntas de pie. ¡Respira hondo!",
    anim: "reach-sky",
    seconds: 15
  },
  {
    title: "2. La Mariposa Relajante",
    desc: "Baja tus manos hacia los pies suavemente sin rebotar, relajando la espalda.",
    anim: "reach-toes",
    seconds: 15
  },
  {
    title: "3. El Abrazo del Campeón",
    desc: "Cruza tus brazos sobre tu pecho, abrázate fuerte y dale gracias a tu cuerpo.",
    anim: "hug-body",
    seconds: 15
  }
];

// ====================================================================
// 5. MINI-RETOS "SIMÓN DICE" POR CADA ISLA
// ====================================================================
const SIMON_CHALLENGES = {
  1: [ // Isla 1: Equilibrio
    { command: "¡Simón dice: Párate en un pie como flamenco!", isSimon: true, anim: "flamenco" },
    { command: "¡Baila dando vueltas rápidas!", isSimon: false, anim: "standing" },
    { command: "¡Simón dice: Quédate inmóvil como una estatua!", isSimon: true, anim: "standing" },
    { command: "¡Simón dice: Camina 3 pasos en puntitas de pie!", isSimon: true, anim: "walk-line" }
  ],
  2: [ // Isla 2: Fuerza
    { command: "¡Simón dice: Haz 3 sentadillas profundas!", isSimon: true, anim: "squat" },
    { command: "¡Tírate al suelo!", isSimon: false, anim: "standing" },
    { command: "¡Simón dice: Da un salto de rana con los brazos arriba!", isSimon: true, anim: "frog-jump" },
    { command: "¡Simón dice: Mantén posición de tabla o puente!", isSimon: true, anim: "plank" }
  ],
  3: [ // Isla 3: Coordinación
    { command: "¡Simón dice: 4 Saltos de tijera abriendo brazos!", isSimon: true, anim: "jumping-jacks" },
    { command: "¡Simón dice: Salta la cuerda mágica 5 veces!", isSimon: true, anim: "rope" },
    { command: "¡Aplaude 10 veces rápido!", isSimon: false, anim: "standing" },
    { command: "¡Simón dice: Aplauso arriba y aplauso abajo!", isSimon: true, anim: "jumping-jacks" }
  ],
  4: [ // Isla 4: Agilidad
    { command: "¡Simón dice: Corre a máxima velocidad en el sitio!", isSimon: true, anim: "run" },
    { command: "¡Simón dice: Da dos pasos de cangrejo a la derecha!", isSimon: true, anim: "crab-walk" },
    { command: "¡Corre a tocar la pared!", isSimon: false, anim: "standing" },
    { command: "¡Simón dice: ¡CONGELADOS EN EL LUGAR!", isSimon: true, anim: "standing" }
  ],
  5: [ // Isla 5: Cruzada / Final
    { command: "¡Simón dice: Codo derecho a rodilla izquierda!", isSimon: true, anim: "cross-elbow" },
    { command: "¡Simón dice: Codo izquierdo a rodilla derecha!", isSimon: true, anim: "cross-elbow" },
    { command: "¡Gira como un trompo!", isSimon: false, anim: "standing" },
    { command: "¡Simón dice: Salto de victoria y grita ¡LO LOGRAMOS!", isSimon: true, anim: "jumping-jacks" }
  ]
};

// ====================================================================
// 6. CONTROLADOR PRINCIPAL DEL ESTADO DEL JUEGO
// ====================================================================
class AdventureGame {
  constructor() {
    this.currentScreen = 'screen-welcome';
    this.difficulty = 'medio'; // 'facil' | 'medio' | 'dificil'
    this.sessionMode = 'group'; // 'group' | 'solo'
    this.score = 0;
    this.totalSeconds = 0;
    this.unlockedIslands = [1];
    this.currentIsland = 1;
    this.currentChallengeIndex = 0;
    this.completedChallenges = new Set();
    
    // Temporizadores activos
    this.globalTimerInterval = null;
    this.challengeInterval = null;
    this.simonInterval = null;
    this.breathingInterval = null;
    this.warmupInterval = null;
    this.cooldownInterval = null;

    // Estado del reto actual
    this.remainingSeconds = 25;
    this.isPaused = false;
    this.warmupIndex = 0;
    this.cooldownIndex = 0;
    this.simonRound = 0;
    this.simonHits = 0;

    this.init();
  }

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.renderHeroPreview();
    this.startGlobalTimer();
    this.updateStatsUI();
  }

  cacheDOM() {
    this.screens = {
      welcome: document.getElementById('screen-welcome'),
      safety: document.getElementById('screen-safety'),
      warmup: document.getElementById('screen-warmup'),
      map: document.getElementById('screen-map'),
      challenge: document.getElementById('screen-challenge'),
      simon: document.getElementById('screen-simon'),
      breathing: document.getElementById('screen-breathing'),
      cooldown: document.getElementById('screen-cooldown'),
      victory: document.getElementById('screen-victory')
    };

    // Header y Stats
    this.scoreDisplay = document.getElementById('score-display');
    this.totalTimeDisplay = document.getElementById('total-time-display');
    this.btnHome = document.getElementById('btn-home');
    this.btnMap = document.getElementById('btn-map');
    this.btnSound = document.getElementById('btn-sound');
    this.soundIcon = document.getElementById('sound-icon');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    this.btnTeacherPanelToggle = document.getElementById('btn-teacher-panel-toggle');
    this.teacherModal = document.getElementById('teacher-modal');
    this.btnCloseTeacher = document.getElementById('btn-close-teacher');

    // Pantalla Reto
    this.challengeTitle = document.getElementById('challenge-title');
    this.challengeCue = document.getElementById('challenge-cue');
    this.challengeIslandTag = document.getElementById('challenge-island-tag');
    this.challengeNumberTag = document.getElementById('challenge-number-tag');
    this.characterFigure = document.getElementById('character-figure');
    this.metricValue = document.getElementById('metric-value');
    this.rhythmText = document.getElementById('rhythm-text');
    this.exerciseBarFill = document.getElementById('exercise-bar-fill');
    this.feedbackMessage = document.getElementById('feedback-message');
    this.btnCompleteChallenge = document.getElementById('btn-complete-challenge');
    this.btnPauseChallenge = document.getElementById('btn-pause-challenge');
    this.btnRestartChallenge = document.getElementById('btn-restart-challenge');

    // Calentamiento y Cooldown
    this.warmupSlot = document.getElementById('warmup-avatar-slot');
    this.warmupTitle = document.getElementById('warmup-step-title');
    this.warmupDesc = document.getElementById('warmup-step-desc');
    this.warmupCountdown = document.getElementById('warmup-countdown');
    this.btnWarmupNext = document.getElementById('btn-warmup-next');
    this.btnWarmupSkip = document.getElementById('btn-warmup-skip');

    this.cooldownSlot = document.getElementById('cooldown-avatar-slot');
    this.cooldownTitle = document.getElementById('cooldown-step-title');
    this.cooldownDesc = document.getElementById('cooldown-step-desc');
    this.cooldownCountdown = document.getElementById('cooldown-countdown');
    this.btnCooldownNext = document.getElementById('btn-cooldown-next');
    this.btnCooldownFinish = document.getElementById('btn-cooldown-finish');

    // Simón Dice
    this.simonCommandText = document.getElementById('simon-command-text');
    this.simonAvatarBox = document.getElementById('simon-avatar-box');
    this.simonCountdown = document.getElementById('simon-countdown');
    this.simonRoundSpan = document.getElementById('simon-round');
    this.simonHitsSpan = document.getElementById('simon-hits');
    this.btnSimonSuccess = document.getElementById('btn-simon-success');
    this.btnSimonMiss = document.getElementById('btn-simon-miss');

    // Respiración
    this.breathingOrb = document.getElementById('breathing-orb');
    this.breathingInstruction = document.getElementById('breathing-instruction');
    this.breathSeconds = document.getElementById('breath-seconds');
    this.btnFinishBreath = document.getElementById('btn-finish-breath');

    // Mapa
    this.mapProgressPct = document.getElementById('map-progress-pct');
    this.mapProgressFill = document.getElementById('map-progress-fill');
    this.islandsGrid = document.getElementById('islands-grid');

    // Panel Docente
    this.tTimeActive = document.getElementById('t-time-active');
    this.tChallengesDone = document.getElementById('t-challenges-done');
    this.tCaloriesApprox = document.getElementById('t-calories-approx');
    this.btnTeacherReset = document.getElementById('btn-teacher-reset');
    this.btnTeacherVoiceToggle = document.getElementById('btn-teacher-voice-toggle');
    this.voiceStatusLabel = document.getElementById('voice-status-label');

    // Modo Cámara
    this.btnCameraToggle = document.getElementById('btn-camera-toggle');
    this.btnWelcomeCamera = document.getElementById('btn-welcome-camera');
    this.cameraGuideModal = document.getElementById('camera-guide-modal');
    this.btnCloseCameraGuide = document.getElementById('btn-close-camera-guide');
    this.btnStartCameraConfirmed = document.getElementById('btn-start-camera-confirmed');
    this.btnCancelCamera = document.getElementById('btn-cancel-camera');
    this.cameraFeedContainer = document.getElementById('camera-feed-container');
    this.cameraVideo = document.getElementById('camera-video');
    this.cameraCanvas = document.getElementById('camera-canvas');
    this.btnCameraStageClose = document.getElementById('btn-camera-stage-close');
    this.cameraCueText = document.getElementById('camera-cue-text');
    this.cameraCounterBadge = document.getElementById('camera-counter-badge');

    // Inicializar listeners del gestor de cámara
    if (window.cameraManager) {
      window.cameraManager.initElements(this.cameraVideo, this.cameraCanvas);

      window.cameraManager.onRepCompleted = (current, required) => {
        sfx.beat();
        if (this.cameraCounterBadge) {
          this.cameraCounterBadge.textContent = `Reps: ${current} / ${required}`;
        }
        this.showLiveFeedback(`¡Excelente repetición! (${current}/${required}) 🌟`);
      };

      window.cameraManager.onChallengeCompleted = () => {
        sfx.success();
        voice.speak("¡Reto completado con detección de movimiento!");
        this.finishCurrentChallenge(false);
      };

      window.cameraManager.onFeedbackMessage = (msg) => {
        if (this.cameraCueText) {
          this.cameraCueText.textContent = msg;
        }
      };
    }
  }

  bindEvents() {
    // Selección de Dificultad
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        this.difficulty = target.dataset.diff;
        sfx.click();
      });
    });

    // Botones de inicio
    document.getElementById('btn-start-adventure').addEventListener('click', () => {
      sfx.click();
      this.switchScreen('screen-safety');
    });

    document.getElementById('btn-group-mode').addEventListener('click', () => {
      sfx.click();
      this.sessionMode = 'group';
      this.switchScreen('screen-safety');
    });

    // Confirmación de Seguridad
    document.getElementById('btn-safety-confirm').addEventListener('click', () => {
      sfx.success();
      this.startWarmupSession();
    });

    // Calentamiento controles
    this.btnWarmupNext.addEventListener('click', () => {
      sfx.click();
      this.nextWarmupStep();
    });

    this.btnWarmupSkip.addEventListener('click', () => {
      sfx.click();
      clearInterval(this.warmupInterval);
      this.switchScreen('screen-map');
    });

    // Navegación Header
    this.btnHome.addEventListener('click', () => {
      sfx.click();
      this.switchScreen('screen-welcome');
    });

    this.btnMap.addEventListener('click', () => {
      sfx.click();
      this.switchScreen('screen-map');
    });

    this.btnSound.addEventListener('click', () => {
      sfx.enabled = !sfx.enabled;
      this.soundIcon.textContent = sfx.enabled ? '🔊' : '🔇';
      if (sfx.enabled) sfx.click();
    });

    this.btnFullscreen.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Eventos Modo Cámara
    const openCameraGuide = () => {
      sfx.click();
      if (window.cameraManager && window.cameraManager.isActive) {
        window.cameraManager.stopCamera();
        this.btnCameraToggle.classList.remove('active');
        this.btnCameraToggle.querySelector('.btn-text').textContent = 'Cámara';
        if (this.cameraFeedContainer) this.cameraFeedContainer.classList.add('hidden');
      } else {
        if (this.cameraGuideModal) this.cameraGuideModal.classList.remove('hidden');
      }
    };

    if (this.btnCameraToggle) {
      this.btnCameraToggle.addEventListener('click', openCameraGuide);
    }
    if (this.btnWelcomeCamera) {
      this.btnWelcomeCamera.addEventListener('click', openCameraGuide);
    }

    if (this.btnCloseCameraGuide) {
      this.btnCloseCameraGuide.addEventListener('click', () => {
        sfx.click();
        this.cameraGuideModal.classList.add('hidden');
      });
    }

    if (this.btnCancelCamera) {
      this.btnCancelCamera.addEventListener('click', () => {
        sfx.click();
        this.cameraGuideModal.classList.add('hidden');
      });
    }

    if (this.btnCameraStageClose) {
      this.btnCameraStageClose.addEventListener('click', () => {
        sfx.click();
        if (window.cameraManager) window.cameraManager.stopCamera();
        if (this.btnCameraToggle) {
          this.btnCameraToggle.classList.remove('active');
          this.btnCameraToggle.querySelector('.btn-text').textContent = 'Cámara';
        }
        if (this.cameraFeedContainer) this.cameraFeedContainer.classList.add('hidden');
      });
    }

    if (this.btnStartCameraConfirmed) {
      this.btnStartCameraConfirmed.addEventListener('click', async () => {
        sfx.click();
        this.cameraGuideModal.classList.add('hidden');

        const btnTextEl = this.btnCameraToggle.querySelector('.btn-text');
        if (btnTextEl) btnTextEl.textContent = 'Conectando...';

        try {
          if (window.cameraManager) {
            await window.cameraManager.startCamera();
            this.btnCameraToggle.classList.add('active');
            if (btnTextEl) btnTextEl.textContent = 'Cámara ON';
            sfx.success();
            voice.speak("¡Cámara infantil activada! Colócate a 2 metros de la pantalla.");

            // Si estaba en reto, activar inmediatamente el reto en cámara
            if (this.currentScreen === 'screen-challenge') {
              const curChal = CHALLENGES_DATABASE[this.currentChallengeIndex];
              if (curChal) {
                this.cameraFeedContainer.classList.remove('hidden');
                window.cameraManager.setChallenge(curChal, this.difficulty);
              }
            } else if (this.currentScreen === 'screen-welcome') {
              this.switchScreen('screen-safety');
            }
          }
        } catch (err) {
          console.warn('Fallo al inicializar cámara:', err);
          if (btnTextEl) btnTextEl.textContent = 'Cámara';
          this.btnCameraToggle.classList.remove('active');
          alert('Aviso de Cámara:\nNo se pudo acceder a la cámara (verifica que diste permiso y tengas conexión para cargar el sensor).\n\n¡No te preocupes! El juego sigue funcionando normalmente con el botón ¡Listo!');
        }
      });
    }

    // Botones de Reto
    this.btnCompleteChallenge.addEventListener('click', () => {
      this.finishCurrentChallenge(true);
    });

    this.btnPauseChallenge.addEventListener('click', () => {
      this.togglePauseChallenge();
    });

    this.btnRestartChallenge.addEventListener('click', () => {
      sfx.click();
      this.loadChallenge(CHALLENGES_DATABASE[this.currentChallengeIndex]);
    });

    // Simón Dice botones
    this.btnSimonSuccess.addEventListener('click', () => {
      this.handleSimonAnswer(true);
    });

    this.btnSimonMiss.addEventListener('click', () => {
      this.handleSimonAnswer(false);
    });

    // Pausa Activa Respiración
    this.btnFinishBreath.addEventListener('click', () => {
      sfx.click();
      clearInterval(this.breathingInterval);
      this.advanceAfterBreath();
    });

    // Estiramiento
    this.btnCooldownNext.addEventListener('click', () => {
      sfx.click();
      this.nextCooldownStep();
    });

    this.btnCooldownFinish.addEventListener('click', () => {
      sfx.fanfare();
      clearInterval(this.cooldownInterval);
      this.showVictoryScreen();
    });

    // Reiniciar aventura
    document.getElementById('btn-replay-all').addEventListener('click', () => {
      sfx.click();
      this.resetProgress();
      this.switchScreen('screen-map');
    });

    // Panel Docente Toggle & Modal
    this.btnTeacherPanelToggle.addEventListener('click', () => {
      sfx.click();
      this.openTeacherModal();
    });

    this.btnCloseTeacher.addEventListener('click', () => {
      sfx.click();
      this.teacherModal.classList.add('hidden');
    });

    this.teacherModal.addEventListener('click', (e) => {
      if (e.target === this.teacherModal) {
        this.teacherModal.classList.add('hidden');
      }
    });

    // Control de Modo en Panel Docente
    const btnModeClass = document.getElementById('btn-toggle-mode-class');
    const btnModeSolo = document.getElementById('btn-toggle-mode-solo');
    if (btnModeClass && btnModeSolo) {
      btnModeClass.addEventListener('click', () => {
        btnModeClass.classList.add('active');
        btnModeSolo.classList.remove('active');
        this.sessionMode = 'group';
        sfx.click();
      });
      btnModeSolo.addEventListener('click', () => {
        btnModeSolo.classList.add('active');
        btnModeClass.classList.remove('active');
        this.sessionMode = 'solo';
        sfx.click();
      });
    }

    // Dificultad dinámica desde Panel Docente
    document.querySelectorAll('.diff-btn-t').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.diff-btn-t').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        this.difficulty = target.dataset.diff;
        // Sincronizar también botones de pantalla bienvenida
        document.querySelectorAll('.diff-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.diff === this.difficulty);
        });
        sfx.click();
      });
    });

    // Salto rápido en panel docente
    document.querySelectorAll('.t-jump-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const islandId = parseInt(e.currentTarget.dataset.targetIsland, 10);
        if (islandId) {
          this.teacherModal.classList.add('hidden');
          this.startIsland(islandId);
        }
      });
    });

    document.getElementById('t-btn-cooldown').addEventListener('click', () => {
      this.teacherModal.classList.add('hidden');
      this.startCooldownSession();
    });

    this.btnTeacherReset.addEventListener('click', () => {
      if (confirm('¿Deseas reiniciar todo el avance y los puntos de esta sesión?')) {
        this.resetProgress();
        this.teacherModal.classList.add('hidden');
        this.switchScreen('screen-welcome');
      }
    });

    this.btnTeacherVoiceToggle.addEventListener('click', () => {
      voice.enabled = !voice.enabled;
      this.voiceStatusLabel.textContent = voice.enabled ? 'Activada' : 'Silenciada';
      sfx.click();
    });

    // Selección de islas en el mapa
    document.querySelectorAll('.island-enter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const islandId = parseInt(e.currentTarget.dataset.island, 10);
        if (this.unlockedIslands.includes(islandId)) {
          sfx.click();
          this.startIsland(islandId);
        }
      });
    });

    // Atajos de teclado para el docente (Pizarra digital / Control inalámbrico)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        // Espacio completa o confirma si está en reto
        if (this.currentScreen === 'screen-challenge') {
          e.preventDefault();
          this.finishCurrentChallenge(true);
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (this.currentScreen === 'screen-challenge') {
          this.togglePauseChallenge();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        this.toggleFullscreen();
      } else if (e.key === 'd' || e.key === 'D') {
        this.openTeacherModal();
      }
    });
  }

  // ==================================================================
  // NAVEGACIÓN Y CAMBIO DE PANTALLAS
  // ==================================================================
  switchScreen(screenId) {
    this.currentScreen = screenId;
    Object.keys(this.screens).forEach(key => {
      const scr = this.screens[key];
      if (scr.id === screenId) {
        scr.classList.add('active');
      } else {
        scr.classList.remove('active');
      }
    });

    // Controlar visibilidad del botón de mapa en el header
    if (screenId === 'screen-welcome' || screenId === 'screen-safety') {
      this.btnMap.classList.add('hidden');
    } else {
      this.btnMap.classList.remove('hidden');
    }

    // Gestionar evaluación de cámara según la pantalla
    if (window.cameraManager) {
      if (screenId !== 'screen-challenge') {
        window.cameraManager.currentChallenge = null;
      }
    }

    if (screenId === 'screen-map') {
      this.updateMapUI();
    }
  }

  renderHeroPreview() {
    const heroSlot = document.getElementById('hero-character-svg');
    if (heroSlot) {
      heroSlot.innerHTML = CharacterRenderer.getSVG('jumping-jacks');
    }
  }

  // ==================================================================
  // FASE 1: CALENTAMIENTO ACTIVO
  // ==================================================================
  startWarmupSession() {
    this.warmupIndex = 0;
    this.switchScreen('screen-warmup');
    this.runWarmupStep();
  }

  runWarmupStep() {
    clearInterval(this.warmupInterval);
    const exercise = WARMUP_EXERCISES[this.warmupIndex];
    if (!exercise) {
      this.switchScreen('screen-map');
      return;
    }

    this.warmupTitle.textContent = exercise.title;
    this.warmupDesc.textContent = exercise.desc;
    this.warmupSlot.innerHTML = CharacterRenderer.getSVG(exercise.anim || 'standing');
    let timeLeft = exercise.seconds;
    this.warmupCountdown.textContent = timeLeft;

    voice.speak(`Calentamiento: ${exercise.title}. ${exercise.desc}`);

    this.warmupInterval = setInterval(() => {
      timeLeft--;
      this.warmupCountdown.textContent = timeLeft;
      sfx.beat();
      if (timeLeft <= 0) {
        clearInterval(this.warmupInterval);
        sfx.success();
        this.nextWarmupStep();
      }
    }, 1000);
  }

  nextWarmupStep() {
    clearInterval(this.warmupInterval);
    this.warmupIndex++;
    if (this.warmupIndex < WARMUP_EXERCISES.length) {
      this.runWarmupStep();
    } else {
      voice.speak("¡Calentamiento terminado! ¡Listos para explorar las islas!");
      sfx.fanfare();
      this.switchScreen('screen-map');
    }
  }

  // ==================================================================
  // FASE 2: GESTIÓN DE ISLAS Y RETOS FÍSICOS
  // ==================================================================
  startIsland(islandId) {
    this.currentIsland = islandId;
    // Buscar el primer reto de esta isla
    const islandChallenges = CHALLENGES_DATABASE.filter(c => c.islandId === islandId);
    if (islandChallenges.length > 0) {
      const firstIndex = CHALLENGES_DATABASE.indexOf(islandChallenges[0]);
      this.currentChallengeIndex = firstIndex;
      this.loadChallenge(CHALLENGES_DATABASE[firstIndex]);
    }
  }

  loadChallenge(challenge) {
    clearInterval(this.challengeInterval);
    this.isPaused = false;
    this.btnPauseChallenge.textContent = '⏸️ Pausar';
    this.switchScreen('screen-challenge');

    // Metadata
    const islandChallenges = CHALLENGES_DATABASE.filter(c => c.islandId === challenge.islandId);
    const indexInIsland = islandChallenges.findIndex(c => c.id === challenge.id) + 1;
    this.challengeIslandTag.textContent = `Isla ${challenge.islandId}: ${challenge.islandName}`;
    this.challengeNumberTag.textContent = `Reto ${indexInIsland} de ${islandChallenges.length}`;

    this.challengeTitle.textContent = challenge.title;
    this.challengeCue.textContent = challenge.cue;
    this.rhythmText.textContent = challenge.rhythmText;
    this.feedbackMessage.textContent = "¡Mantén la energía y la respiración fluida!";

    // Personaje SVG animado con la postura correspondiente
    this.characterFigure.innerHTML = CharacterRenderer.getSVG(challenge.type);

    // Modo Cámara si está activa
    if (window.cameraManager && window.cameraManager.isActive) {
      if (this.cameraFeedContainer) this.cameraFeedContainer.classList.remove('hidden');
      window.cameraManager.setChallenge(challenge, this.difficulty);
      if (this.cameraCounterBadge) {
        if (window.cameraManager.isHoldChallenge(challenge.type)) {
          this.cameraCounterBadge.textContent = `Equilibrio: 0s / ${window.cameraManager.requiredHoldTime}s`;
        } else {
          this.cameraCounterBadge.textContent = `Reps: 0 / ${window.cameraManager.requiredReps}`;
        }
      }
      if (this.cameraCueText) {
        this.cameraCueText.textContent = "¡Cuerpo detectado! ¡Comienza a moverte!";
      }
    } else {
      if (this.cameraFeedContainer) this.cameraFeedContainer.classList.add('hidden');
    }

    // Ajustar duración según nivel de dificultad
    const totalDuration = challenge.baseSeconds[this.difficulty] || 25;
    this.remainingSeconds = totalDuration;
    this.metricValue.textContent = this.remainingSeconds;
    this.exerciseBarFill.style.width = '100%';

    // Voz y sonido
    voice.speak(`${challenge.title}. ${challenge.cue}`);

    // Contador regresivo interactivo
    this.challengeInterval = setInterval(() => {
      if (!this.isPaused) {
        this.remainingSeconds--;
        this.metricValue.textContent = this.remainingSeconds;
        
        const pct = (this.remainingSeconds / totalDuration) * 100;
        this.exerciseBarFill.style.width = `${Math.max(0, pct)}%`;

        if (this.remainingSeconds <= 3 && this.remainingSeconds > 0) {
          sfx.tick(false);
        } else {
          sfx.beat();
        }

        // Frases de motivación
        if (this.remainingSeconds === Math.floor(totalDuration / 2)) {
          this.showLiveFeedback("¡Mitad de camino! ¡Excelente esfuerzo físico!");
        }

        if (this.remainingSeconds <= 0) {
          clearInterval(this.challengeInterval);
          sfx.tick(true);
          this.finishCurrentChallenge(true);
        }
      }
    }, 1000);
  }

  showLiveFeedback(text) {
    this.feedbackMessage.textContent = text;
    sfx.beat();
  }

  togglePauseChallenge() {
    this.isPaused = !this.isPaused;
    this.btnPauseChallenge.textContent = this.isPaused ? '▶️ Reanudar' : '⏸️ Pausar';
    sfx.click();
    if (this.isPaused) {
      voice.speak("Pausa. Respira hondo.");
    }
  }

  finishCurrentChallenge(isManual = false) {
    clearInterval(this.challengeInterval);
    const challenge = CHALLENGES_DATABASE[this.currentChallengeIndex];
    this.completedChallenges.add(challenge.id);

    // Otorgar puntos y estrellas
    const earnedPoints = 150;
    this.score += earnedPoints;
    this.updateStatsUI();

    sfx.success();
    voice.speak("¡Excelente trabajo! ¡Reto superado con éxito!");

    // Verificar si hay más retos en esta isla o si toca Mini-Reto Simón Dice
    const islandChallenges = CHALLENGES_DATABASE.filter(c => c.islandId === this.currentIsland);
    const lastChallengeOfIsland = islandChallenges[islandChallenges.length - 1];

    if (challenge.id === lastChallengeOfIsland.id) {
      // Fin de la isla -> Mini-reto Simón Dice
      setTimeout(() => {
        this.startSimonChallenge(this.currentIsland);
      }, 800);
    } else {
      // Pausa activa de respiración antes del siguiente reto
      setTimeout(() => {
        this.startBreathingBreak(() => {
          this.currentChallengeIndex++;
          this.loadChallenge(CHALLENGES_DATABASE[this.currentChallengeIndex]);
        });
      }, 600);
    }
  }

  // ==================================================================
  // FASE 3: PAUSA ACTIVA DE RESPIRACIÓN Y OXIGENACIÓN
  // ==================================================================
  startBreathingBreak(onCompleteCallback) {
    this.nextActionAfterBreath = onCompleteCallback;
    this.switchScreen('screen-breathing');

    let breathTime = 16; // 4 ciclos de 4 segs
    this.breathSeconds.textContent = breathTime;
    let isInhale = true;

    this.breathingOrb.className = 'breathing-orb inhale';
    this.breathingInstruction.textContent = 'Inhala profundo...';
    voice.speak("Pausa de oxigenación. Inhala profundo por la nariz.");
    sfx.breath(true);

    clearInterval(this.breathingInterval);
    this.breathingInterval = setInterval(() => {
      breathTime--;
      this.breathSeconds.textContent = breathTime;

      // Cada 4 segundos alternar entre inhalar y exhalar
      if (breathTime % 4 === 0) {
        isInhale = !isInhale;
        if (isInhale) {
          this.breathingOrb.className = 'breathing-orb inhale';
          this.breathingInstruction.textContent = 'Inhala profundo...';
          sfx.breath(true);
        } else {
          this.breathingOrb.className = 'breathing-orb exhale';
          this.breathingInstruction.textContent = 'Exhala lentamente...';
          sfx.breath(false);
        }
      }

      if (breathTime <= 0) {
        clearInterval(this.breathingInterval);
        this.advanceAfterBreath();
      }
    }, 1000);
  }

  advanceAfterBreath() {
    clearInterval(this.breathingInterval);
    if (this.nextActionAfterBreath) {
      this.nextActionAfterBreath();
    } else {
      this.switchScreen('screen-map');
    }
  }

  // ==================================================================
  // FASE 4: MINI-RETO ESPECIAL "SIMÓN DICE"
  // ==================================================================
  startSimonChallenge(islandId) {
    this.simonRound = 0;
    this.simonHits = 0;
    this.switchScreen('screen-simon');
    this.nextSimonRound();
  }

  nextSimonRound() {
    clearInterval(this.simonInterval);
    const rounds = SIMON_CHALLENGES[this.currentIsland] || SIMON_CHALLENGES[1];
    
    if (this.simonRound >= rounds.length) {
      // Fin del mini-reto -> Desbloquear siguiente isla
      this.finishIslandSimon();
      return;
    }

    const currentTask = rounds[this.simonRound];
    this.simonRoundSpan.textContent = this.simonRound + 1;
    this.simonHitsSpan.textContent = this.simonHits;

    this.simonCommandText.textContent = currentTask.command;
    this.simonAvatarBox.innerHTML = CharacterRenderer.getSVG(currentTask.anim || 'standing');

    voice.speak(currentTask.command);

    let countdown = 5;
    this.simonCountdown.textContent = countdown;

    this.simonInterval = setInterval(() => {
      countdown--;
      this.simonCountdown.textContent = countdown;
      sfx.tick(false);

      if (countdown <= 0) {
        clearInterval(this.simonInterval);
        sfx.tick(true);
      }
    }, 1000);
  }

  handleSimonAnswer(isSuccess) {
    clearInterval(this.simonInterval);
    if (isSuccess) {
      this.score += 100;
      this.simonHits++;
      sfx.success();
    } else {
      sfx.click();
    }
    this.simonRound++;
    this.nextSimonRound();
  }

  finishIslandSimon() {
    sfx.fanfare();
    voice.speak(`¡Felicitaciones! Has conquistado completamente la Isla ${this.currentIsland}!`);

    // Desbloquear siguiente isla si existe
    const nextIsland = this.currentIsland + 1;
    if (nextIsland <= 5 && !this.unlockedIslands.includes(nextIsland)) {
      this.unlockedIslands.push(nextIsland);
    }

    // Si completó la isla 5, pasar al estiramiento final
    if (this.currentIsland === 5) {
      setTimeout(() => {
        this.startCooldownSession();
      }, 1200);
    } else {
      setTimeout(() => {
        this.switchScreen('screen-map');
      }, 1200);
    }
  }

  // ==================================================================
  // FASE 5: ESTIRAMIENTO Y VUELTA A LA CALMA
  // ==================================================================
  startCooldownSession() {
    this.cooldownIndex = 0;
    this.switchScreen('screen-cooldown');
    this.runCooldownStep();
  }

  runCooldownStep() {
    clearInterval(this.cooldownInterval);
    const exercise = COOLDOWN_EXERCISES[this.cooldownIndex];
    if (!exercise) {
      this.showVictoryScreen();
      return;
    }

    this.cooldownTitle.textContent = exercise.title;
    this.cooldownDesc.textContent = exercise.desc;
    this.cooldownSlot.innerHTML = CharacterRenderer.getSVG(exercise.anim || 'standing');
    let timeLeft = exercise.seconds;
    this.cooldownCountdown.textContent = timeLeft;

    voice.speak(`Estiramiento: ${exercise.title}. ${exercise.desc}`);

    this.cooldownInterval = setInterval(() => {
      timeLeft--;
      this.cooldownCountdown.textContent = timeLeft;
      sfx.beat();
      if (timeLeft <= 0) {
        clearInterval(this.cooldownInterval);
        sfx.success();
        this.nextCooldownStep();
      }
    }, 1000);
  }

  nextCooldownStep() {
    clearInterval(this.cooldownInterval);
    this.cooldownIndex++;
    if (this.cooldownIndex < COOLDOWN_EXERCISES.length) {
      this.runCooldownStep();
    } else {
      this.showVictoryScreen();
    }
  }

  // ==================================================================
  // FASE 6: VICTORIA, TROFEO Y DIPLOMA
  // ==================================================================
  showVictoryScreen() {
    this.switchScreen('screen-victory');
    sfx.fanfare();
    voice.speak("¡Misión Aventura Cumplida! ¡Eres un explorador de oro en motricidad física!");

    document.getElementById('final-score-val').textContent = this.score;
    document.getElementById('final-time-val').textContent = this.formatTime(this.totalSeconds);
    document.getElementById('final-islands-val').textContent = `${this.unlockedIslands.length} / 5`;
    document.getElementById('final-stars-val').textContent = `${this.completedChallenges.size * 3}`;
  }

  // ==================================================================
  // MAPA Y ACTUALIZACIÓN VISUAL
  // ==================================================================
  updateMapUI() {
    const totalChallenges = CHALLENGES_DATABASE.length;
    const completedCount = this.completedChallenges.size;
    const pct = Math.round((completedCount / totalChallenges) * 100);

    this.mapProgressPct.textContent = `${pct}%`;
    this.mapProgressFill.style.width = `${pct}%`;

    // Actualizar estado de las tarjetas de islas
    document.querySelectorAll('.island-card').forEach(card => {
      const id = parseInt(card.dataset.islandId, 10);
      const btn = card.querySelector('.island-enter-btn');
      const starsDiv = card.querySelector('.island-stars');

      if (this.unlockedIslands.includes(id)) {
        card.classList.remove('locked');
        btn.disabled = false;

        // Comprobar si todos los retos de la isla están completos
        const islandChallenges = CHALLENGES_DATABASE.filter(c => c.islandId === id);
        const isDone = islandChallenges.every(c => this.completedChallenges.has(c.id));

        if (isDone) {
          card.classList.add('completed');
          card.classList.remove('current');
          btn.textContent = '¡Completada! ⭐';
          starsDiv.textContent = '⭐⭐⭐';
        } else if (id === this.currentIsland) {
          card.classList.add('current');
          btn.textContent = '¡Explorar Isla!';
          starsDiv.textContent = '⭐⭐☆';
        } else {
          card.classList.remove('current');
          btn.textContent = 'Entrar a Isla';
          starsDiv.textContent = '⭐☆☆';
        }
      } else {
        card.classList.add('locked');
        card.classList.remove('current', 'completed');
        btn.disabled = true;
        btn.textContent = 'Bloqueado 🔒';
        starsDiv.textContent = '☆☆☆';
      }
    });
  }

  // ==================================================================
  // ESTADÍSTICAS Y TEMPORIZADOR GLOBAL DE SESIÓN
  // ==================================================================
  startGlobalTimer() {
    clearInterval(this.globalTimerInterval);
    this.globalTimerInterval = setInterval(() => {
      this.totalSeconds++;
      this.totalTimeDisplay.textContent = this.formatTime(this.totalSeconds);
      if (this.tTimeActive) {
        this.tTimeActive.textContent = this.formatTime(this.totalSeconds);
      }
    }, 1000);
  }

  updateStatsUI() {
    this.scoreDisplay.textContent = this.score;
    if (this.tChallengesDone) {
      this.tChallengesDone.textContent = `${this.completedChallenges.size} / ${CHALLENGES_DATABASE.length}`;
      // Estimación pedagógica lúdica: ~4.5 kcal por minuto activo infantil
      const mins = this.totalSeconds / 60;
      const calories = Math.round(mins * 4.5);
      this.tCaloriesApprox.textContent = `${calories} kcal`;
    }
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // ==================================================================
  // PANEL DOCENTE Y UTILIDADES
  // ==================================================================
  openTeacherModal() {
    this.updateStatsUI();
    this.teacherModal.classList.remove('hidden');
  }

  resetProgress() {
    this.score = 0;
    this.totalSeconds = 0;
    this.unlockedIslands = [1];
    this.currentIsland = 1;
    this.currentChallengeIndex = 0;
    this.completedChallenges.clear();
    this.updateStatsUI();
    this.updateMapUI();
    sfx.click();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Error al activar fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}

// Iniciar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  window.game = new AdventureGame();
});
