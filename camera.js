/**
 * ====================================================================
 * MISIÓN AVENTURA MOTRIZ - MÓDULO DE CÁMARA Y DETECCIÓN CORPORAL
 * Mediapipe Pose Landmarker + Dibujo de Muñequito Divertido
 * Diseñado con tolerancia amplia para niños de 3.º a 5.º grado (8-11 años)
 * 100% Procesamiento Local en el Navegador (Privacidad Garantizada)
 * ====================================================================
 */

class CameraPoseManager {
  constructor() {
    this.isActive = false;
    this.isLoaded = false;
    this.isLoading = false;
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.ctx = null;
    this.pose = null;
    this.cameraInstance = null;

    // Estado del reto actual
    this.currentChallenge = null;
    this.requiredReps = 8;
    this.currentReps = 0;
    this.poseHoldTime = 0; // segundos manteniendo postura (para equilibrio)
    this.requiredHoldTime = 10;
    this.lastState = 'idle'; // Para máquina de estados (ej. 'up', 'down')
    this.lastFeedback = '';
    this.feedbackTimer = 0;

    // Métricas y suavizado
    this.lastPoseTime = 0;
    this.lastLeftStep = 0;
    this.lastRightStep = 0;
    this.sideStepState = 'center';

    // Callbacks
    this.onRepCompleted = null;
    this.onChallengeCompleted = null;
    this.onFeedbackMessage = null;

    // Scripts CDN de MediaPipe Pose
    this.mediaPipeScripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
    ];
  }

  initElements(videoEl, canvasEl) {
    this.videoElement = videoEl;
    this.canvasElement = canvasEl;
    if (this.canvasElement) {
      this.ctx = this.canvasElement.getContext('2d');
    }
  }

  /**
   * Carga dinámica y asíncrona de los scripts de MediaPipe.
   * Si no hay internet o falla la carga, devuelve false sin romper el juego.
   */
  async loadScripts() {
    if (window.Pose && window.Camera) {
      this.isLoaded = true;
      return true;
    }

    try {
      this.isLoading = true;
      for (const src of this.mediaPipeScripts) {
        await this.loadSingleScript(src);
      }
      this.isLoaded = !!(window.Pose && window.Camera);
      this.isLoading = false;
      return this.isLoaded;
    } catch (err) {
      console.warn('No se pudo cargar MediaPipe desde CDN (posible modo offline):', err);
      this.isLoading = false;
      this.isLoaded = false;
      return false;
    }
  }

  loadSingleScript(src) {
    return new Promise((resolve, reject) => {
      // Verificar si ya existe en el DOM
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Error al cargar ${src}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Solicita acceso a la cámara y arranca MediaPipe Pose
   */
  async startCamera() {
    if (this.isActive) return true;

    // 1. Cargar scripts si es necesario
    const loaded = await this.loadScripts();
    if (!loaded) {
      throw new Error('NO_SCRIPTS');
    }

    // 2. Pedir permiso a getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('NO_GETUSERMEDIA');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // Ajustar dimensiones del canvas
      this.canvasElement.width = this.videoElement.videoWidth || 640;
      this.canvasElement.height = this.videoElement.videoHeight || 480;

      // 3. Inicializar modelo de MediaPipe Pose
      this.pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.pose.onResults((results) => this.onResults(results));

      // 4. Instanciar Camera Utils para procesar frames
      this.cameraInstance = new window.Camera(this.videoElement, {
        onFrame: async () => {
          if (this.isActive && this.pose) {
            await this.pose.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.cameraInstance.start();
      this.isActive = true;
      return true;
    } catch (err) {
      console.warn('Error al iniciar cámara:', err);
      this.stopCamera();
      throw err;
    }
  }

  /**
   * Detiene la cámara y libera recursos
   */
  stopCamera() {
    this.isActive = false;
    if (this.cameraInstance) {
      try { this.cameraInstance.stop(); } catch (e) {}
      this.cameraInstance = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    if (this.ctx && this.canvasElement) {
      this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    }
    this.currentChallenge = null;
  }

  /**
   * Configura el reto actual para la detección y conteo de repeticiones
   */
  setChallenge(challenge, difficulty = 'medio') {
    this.currentChallenge = challenge;
    this.currentReps = 0;
    this.poseHoldTime = 0;
    this.lastState = 'idle';
    this.lastFeedback = '';

    // Repeticiones o tiempo según dificultad adaptada a niños
    const repGoals = {
      facil: 6,
      medio: 8,
      dificil: 12
    };
    this.requiredReps = repGoals[difficulty] || 8;

    const holdGoals = {
      facil: 8,
      medio: 12,
      dificil: 16
    };
    this.requiredHoldTime = holdGoals[difficulty] || 12;
  }

  /**
   * Callback principal que procesa cada fotograma detectado
   */
  onResults(results) {
    if (!this.isActive || !this.ctx) return;

    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    this.ctx.save();
    this.ctx.clearRect(0, 0, width, height);

    // Espejar horizontalmente para que se sienta como un espejo natural
    this.ctx.translate(width, 0);
    this.ctx.scale(-1, 1);

    // 1. Dibujar imagen del video tenue de fondo para que el niño se vea
    this.ctx.drawImage(results.image, 0, 0, width, height);
    // Velo suave semitransparente para resaltar el muñequito
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    this.ctx.fillRect(0, 0, width, height);

    if (results.poseLandmarks) {
      const landmarks = results.poseLandmarks;

      // 2. Dibujar el esqueleto estilo muñequito alegre infantil
      this.drawFunSkelly(landmarks, width, height);

      // 3. Evaluar el ejercicio físico del reto actual
      if (this.currentChallenge) {
        this.evaluateChallengeMovement(landmarks);
      }
    } else {
      // Si no detecta cuerpo completo
      this.drawGuideSilhouette(width, height, "Buscando al explorador... ¡Párate de pie!");
    }

    this.ctx.restore();

    // 4. Dibujar HUD sobre el video (orientación normal sin espejo)
    this.drawCameraHUD(width, height);
  }

  /**
   * Dibuja al niño como un muñequito divertido:
   * Colores brillantes, articulaciones con gemas y gorro/cara de explorador
   */
  drawFunSkelly(lm, w, h) {
    const ctx = this.ctx;

    // Función auxiliar para obtener coordenadas en píxeles
    const pt = (index) => ({
      x: lm[index].x * w,
      y: lm[index].y * h,
      v: lm[index].visibility
    });

    // Puntos clave de MediaPipe Pose
    const nose = pt(0);
    const lShoulder = pt(11), rShoulder = pt(12);
    const lElbow = pt(13), rElbow = pt(14);
    const lWrist = pt(15), rWrist = pt(16);
    const lHip = pt(23), rHip = pt(24);
    const lKnee = pt(25), rKnee = pt(26);
    const lAnkle = pt(27), rAnkle = pt(28);

    // Conexiones de huesos alegres (cápsulas redondeadas)
    const drawBone = (p1, p2, color, thickness = 10) => {
      if ((p1.v !== undefined && p1.v < 0.3) || (p2.v !== undefined && p2.v < 0.3)) return;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Brillo interno blanco para efecto 3D
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = thickness / 3;
      ctx.stroke();
    };

    // Dibujar Torso
    drawBone(lShoulder, rShoulder, '#ff6b35', 14);
    drawBone(lShoulder, lHip, '#ff8c42', 12);
    drawBone(rShoulder, rHip, '#ff8c42', 12);
    drawBone(lHip, rHip, '#ffd166', 14);

    // Brazos (Naranja brillante y Amarillo)
    drawBone(lShoulder, lElbow, '#ffd166', 11);
    drawBone(lElbow, lWrist, '#ffb703', 10);
    drawBone(rShoulder, rElbow, '#ffd166', 11);
    drawBone(rElbow, rWrist, '#ffb703', 10);

    // Piernas (Verde esmeralda y Turquesa)
    drawBone(lHip, lKnee, '#06d6a0', 13);
    drawBone(lKnee, lAnkle, '#118ab2', 12);
    drawBone(rHip, rKnee, '#06d6a0', 13);
    drawBone(rKnee, rAnkle, '#118ab2', 12);

    // Articulaciones redondas tipo gemas
    const joints = [
      { p: lShoulder, c: '#ef476f', r: 9 },
      { p: rShoulder, c: '#ef476f', r: 9 },
      { p: lElbow, c: '#f72585', r: 8 },
      { p: rElbow, c: '#f72585', r: 8 },
      { p: lWrist, c: '#ffd166', r: 10 },
      { p: rWrist, c: '#ffd166', r: 10 },
      { p: lHip, c: '#06d6a0', r: 9 },
      { p: rHip, c: '#06d6a0', r: 9 },
      { p: lKnee, c: '#48cae4', r: 9 },
      { p: rKnee, c: '#48cae4', r: 9 },
      { p: lAnkle, c: '#ef4444', r: 11 },
      { p: rAnkle, c: '#ef4444', r: 11 }
    ];

    joints.forEach(j => {
      if (j.p.v !== undefined && j.p.v < 0.3) return;
      ctx.beginPath();
      ctx.arc(j.p.x, j.p.y, j.r, 0, Math.PI * 2);
      ctx.fillStyle = j.c;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

    // CABEZA DIVERTIDA DE EXPLORADOR
    if (nose.v === undefined || nose.v > 0.4) {
      // Carita redonda
      const headRadius = Math.max(22, Math.abs(lShoulder.x - rShoulder.x) * 0.28);
      ctx.beginPath();
      ctx.arc(nose.x, nose.y, headRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#fed7aa';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f97316';
      ctx.stroke();

      // Sombrero de explorador virtual
      ctx.beginPath();
      ctx.ellipse(nose.x, nose.y - headRadius * 0.8, headRadius * 1.3, headRadius * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#059669';
      ctx.fill();
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Corona del sombrero
      ctx.beginPath();
      ctx.arc(nose.x, nose.y - headRadius * 1.1, headRadius * 0.65, Math.PI, 0, false);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.stroke();
    }
  }

  /**
   * Silueta guía cuando la persona está lejos o buscando encuadre
   */
  drawGuideSilhouette(w, h, text) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);

    // Marco de cuerpo completo
    const marginX = w * 0.22;
    const marginY = h * 0.1;
    ctx.strokeRect(marginX, marginY, w - marginX * 2, h - marginY * 1.5);
    ctx.setLineDash([]);

    // Texto guía
    ctx.font = 'bold 18px Nunito, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, h * 0.5);
    ctx.restore();
  }

  /**
   * HUD sobre el canvas (contadores y mensajes de ánimo)
   */
  drawCameraHUD(w, h) {
    const ctx = this.ctx;
    ctx.save();

    // Fondo del HUD superior
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.roundRect(14, 14, w - 28, 48, 12);
    ctx.fill();

    // Texto de feedback en vivo
    ctx.font = 'bold 16px Fredoka, sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'left';
    const msg = this.lastFeedback || "¡Cámara activa! Muévete al ritmo";
    ctx.fillText(`✨ ${msg}`, 26, 44);

    // Contador de repeticiones o tiempo
    ctx.textAlign = 'right';
    if (this.currentChallenge) {
      if (this.isHoldChallenge(this.currentChallenge.type)) {
        ctx.fillStyle = '#06d6a0';
        ctx.fillText(`Equilibrio: ${Math.floor(this.poseHoldTime)}s / ${this.requiredHoldTime}s`, w - 26, 44);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Reps: ${this.currentReps} / ${this.requiredReps}`, w - 26, 44);
      }
    }

    ctx.restore();
  }

  /**
   * Determina si el ejercicio es de mantener postura (equilibrio/plancha) o repeticiones
   */
  isHoldChallenge(type) {
    return type === 'flamenco' || type === 'plank' || type === 'walk-line';
  }

  /**
   * MOTOR DE EVALUACIÓN MOTRIZ
   * Analiza ángulos y posiciones con tolerancias amplias para niños
   */
  evaluateChallengeMovement(lm) {
    const type = this.currentChallenge.type;
    const now = Date.now();

    // Helper de puntos
    const lSh = lm[11], rSh = lm[12];
    const lEl = lm[13], rEl = lm[14];
    const lWr = lm[15], rWr = lm[16];
    const lHip = lm[23], rHip = lm[24];
    const lKn = lm[25], rKn = lm[26];
    const lAnk = lm[27], rAnk = lm[28];

    // Verificar que los puntos esenciales sean visibles
    const bodyVisible = lSh.visibility > 0.4 && rSh.visibility > 0.4 && lHip.visibility > 0.4;
    if (!bodyVisible) {
      this.giveFeedback("Párate donde la cámara pueda verte completo.");
      return;
    }

    // 1. EL FLAMENCO DORADO (Equilibrio en 1 pie, brazos abiertos)
    if (type === 'flamenco') {
      const armSpan = Math.abs(lWr.x - rWr.x);
      const shoulderWidth = Math.abs(lSh.x - rSh.x);
      const anklesDiff = Math.abs(lAnk.y - rAnk.y);
      const kneesDiff = Math.abs(lKn.y - rKn.y);

      const oneFootUp = anklesDiff > 0.07 || kneesDiff > 0.08;
      const armsOpen = armSpan > shoulderWidth * 1.35;

      if (!oneFootUp) {
        this.giveFeedback("¡Levanta un pie del suelo como flamenco!");
      } else if (!armsOpen) {
        this.giveFeedback("¡Abre los brazos como alas de pájaro!");
      } else {
        this.giveFeedback("¡Excelente equilibrio! ¡Mantente firme!");
        this.poseHoldTime += 0.06; // Incrementa según framerate
        if (this.poseHoldTime >= this.requiredHoldTime) {
          this.triggerChallengeSuccess();
        }
      }
    }

    // 2. CUERDA FLOJA TALÓN-PUNTA
    else if (type === 'walk-line') {
      const feetDistance = Math.abs(lAnk.x - rAnk.x);
      const armsSpread = Math.abs(lWr.x - rWr.x) > Math.abs(lSh.x - rSh.x) * 1.25;

      if (armsSpread && feetDistance < 0.12) {
        this.giveFeedback("¡Caminata en línea recta perfecta!");
        this.poseHoldTime += 0.06;
        if (this.poseHoldTime >= this.requiredHoldTime) {
          this.triggerChallengeSuccess();
        }
      } else {
        this.giveFeedback("Pon un pie delante del otro y abre los brazos.");
      }
    }

    // 3. SENTADILLAS DE LAVA
    else if (type === 'squat') {
      const lAngle = this.calculateAngle(lHip, lKn, lAnk);
      const rAngle = this.calculateAngle(rHip, rKn, rAnk);
      const avgKneeAngle = (lAngle + rAngle) / 2;

      // Tolerancia amplia para niños (un niño bajando a 135° ya hace una sentadilla efectiva)
      if (avgKneeAngle < 135) {
        if (this.lastState !== 'down') {
          this.lastState = 'down';
          this.giveFeedback("¡Muy bien abajo! ¡Ahora sube!");
        }
      } else if (avgKneeAngle > 155) {
        if (this.lastState === 'down') {
          this.lastState = 'up';
          this.addRepetition();
          this.giveFeedback("¡Excelente sentadilla! (+1)");
        } else {
          this.giveFeedback("¡Baja un poco más las rodillas!");
        }
      }
    }

    // 4. EL PUENTE FUERTE (Plancha)
    else if (type === 'plank') {
      const torsoAngle = this.calculateAngle(lSh, lHip, lKn);
      if (torsoAngle > 140 && torsoAngle < 185) {
        this.giveFeedback("¡Core de hierro! ¡Cuerpo bien firme!");
        this.poseHoldTime += 0.06;
        if (this.poseHoldTime >= this.requiredHoldTime) {
          this.triggerChallengeSuccess();
        }
      } else {
        this.giveFeedback("Mantén tu cuerpo recto como una tabla.");
      }
    }

    // 5. SALTOS DE RANA
    else if (type === 'frog-jump') {
      const lAngle = this.calculateAngle(lHip, lKn, lAnk);
      const hipHeight = (lHip.y + rHip.y) / 2;

      if (lAngle < 120 || hipHeight > 0.65) {
        this.lastState = 'crouch';
        this.giveFeedback("¡Cuclillas listas! ¡Salta hacia el sol!");
      } else if (this.lastState === 'crouch' && (lWr.y < lSh.y || hipHeight < 0.52)) {
        this.lastState = 'jump';
        this.addRepetition();
        this.giveFeedback("¡Gran salto de rana! (+1)");
      }
    }

    // 6. ESTRELLAS SALTARINA (Jumping Jacks)
    else if (type === 'jumping-jacks') {
      const handsUp = lWr.y < lSh.y && rWr.y < rSh.y;
      const feetApart = Math.abs(lAnk.x - rAnk.x) > Math.abs(lSh.x - rSh.x) * 1.35;

      const handsDown = lWr.y > lSh.y && rWr.y > rSh.y;
      const feetTogether = Math.abs(lAnk.x - rAnk.x) < Math.abs(lSh.x - rSh.x) * 1.1;

      if (handsUp && feetApart) {
        this.lastState = 'open';
        this.giveFeedback("¡Gran estrella! Ahora cierra al centro.");
      } else if (handsDown && feetTogether && this.lastState === 'open') {
        this.lastState = 'closed';
        this.addRepetition();
        this.giveFeedback("¡Salto de tijera completado! (+1)");
      }
    }

    // 7. LA CUERDA MÁGICA
    else if (type === 'rope') {
      const hipY = (lHip.y + rHip.y) / 2;
      if (!this.lastHipY) this.lastHipY = hipY;

      // Detección de rebote vertical
      const deltaY = this.lastHipY - hipY;
      if (deltaY > 0.025 && now - this.lastPoseTime > 350) {
        this.lastPoseTime = now;
        this.addRepetition();
        this.giveFeedback("¡Salto de cuerda con ritmo! (+1)");
      }
      this.lastHipY = hipY;
    }

    // 8. CARRERA RELÁMPAGO EN EL SITIO
    else if (type === 'run') {
      const lKneeUp = lKn.y < lHip.y + 0.16;
      const rKneeUp = rKn.y < rHip.y + 0.16;

      if (lKneeUp && now - this.lastLeftStep > 300) {
        this.lastLeftStep = now;
        this.addRepetition();
        this.giveFeedback("¡Rodilla izquierda arriba! (+1)");
      } else if (rKneeUp && now - this.lastRightStep > 300) {
        this.lastRightStep = now;
        this.addRepetition();
        this.giveFeedback("¡Rodilla derecha arriba! (+1)");
      }
    }

    // 9. PASOS DEL CANGREJO (Desplazamiento Lateral)
    else if (type === 'crab-walk') {
      const centerX = (lHip.x + rHip.x) / 2;
      if (centerX < 0.42 && this.sideStepState !== 'left') {
        this.sideStepState = 'left';
        this.addRepetition();
        this.giveFeedback("¡Paso a la izquierda! Ahora al otro lado.");
      } else if (centerX > 0.58 && this.sideStepState !== 'right') {
        this.sideStepState = 'right';
        this.addRepetition();
        this.giveFeedback("¡Paso a la derecha! (+1)");
      }
    }

    // 10. EL CRUCE NINJA (Codo a Rodilla Contraria)
    else if (type === 'cross-elbow') {
      const distL_R = Math.hypot(lEl.x - rKn.x, lEl.y - rKn.y);
      const distR_L = Math.hypot(rEl.x - lKn.x, rEl.y - lKn.y);

      if (distL_R < 0.22 && now - this.lastPoseTime > 500) {
        this.lastPoseTime = now;
        this.addRepetition();
        this.giveFeedback("¡Codo izquierdo a rodilla derecha! (+1)");
      } else if (distR_L < 0.22 && now - this.lastPoseTime > 500) {
        this.lastPoseTime = now;
        this.addRepetition();
        this.giveFeedback("¡Codo derecho a rodilla izquierda! (+1)");
      } else {
        this.giveFeedback("Gira el torso: codo con rodilla contraria.");
      }
    }

    // 11. EL ESCALADOR DE LA CUMBRE (Mano a Pie Contrario)
    else if (type === 'cross-toe') {
      const distWrAnkL = Math.hypot(lWr.x - rAnk.x, lWr.y - rAnk.y);
      const distWrAnkR = Math.hypot(rWr.x - lAnk.x, rWr.y - lAnk.y);

      if (distWrAnkL < 0.26 && now - this.lastPoseTime > 600) {
        this.lastPoseTime = now;
        this.addRepetition();
        this.giveFeedback("¡Toque cruzado pie derecho! (+1)");
      } else if (distWrAnkR < 0.26 && now - this.lastPoseTime > 600) {
        this.lastPoseTime = now;
        this.addRepetition();
        this.giveFeedback("¡Toque cruzado pie izquierdo! (+1)");
      }
    }
  }

  addRepetition() {
    this.currentReps++;
    if (this.onRepCompleted) {
      this.onRepCompleted(this.currentReps, this.requiredReps);
    }
    if (this.currentReps >= this.requiredReps) {
      this.triggerChallengeSuccess();
    }
  }

  triggerChallengeSuccess() {
    if (this.onChallengeCompleted) {
      this.onChallengeCompleted();
    }
  }

  giveFeedback(msg) {
    this.lastFeedback = msg;
    if (this.onFeedbackMessage) {
      this.onFeedbackMessage(msg);
    }
  }

  calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  }
}

// Instancia global
window.cameraManager = new CameraPoseManager();
