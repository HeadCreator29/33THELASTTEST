// Sonido ambiental y efectos con WebAudio (sin assets).
// Música de fondo: pon tu MP3 en public/music/fondo.mp3 (ver public/music/LEEME.txt).
let ctx = null;
let drone = [];
let music = null;
let musicFile = '/music/fondo.mp3';
let bombSound = null;
let enabled = true;

export function setEnabled(v) {
  enabled = v;
  if (!v) { stopDrone(); stopMusic(); }
  else if (music) startMusic(); // reanuda tras un gesto del usuario
}
export function isEnabled() { return enabled; }

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function tone(freq = 520, dur = 0.12, type = 'sine', vol = 0.1) {
  if (!enabled) return;
  try {
    const c = ac();
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  } catch { /* sin audio: el juego continúa */ }
}

export const sfx = {
  open: () => tone(340, 0.06, 'triangle', 0.06),
  flag: () => tone(660, 0.08, 'sine', 0.08),
  boom: () => {
    if (!enabled) return;
    try {
      if (!bombSound) {
        bombSound = new Audio('/music/bomba.mp3');
        bombSound.preload = 'auto';
        bombSound.volume = 0.5;
      }
      bombSound.currentTime = 0;
      bombSound.play().catch(() => {});
    } catch {
      tone(140, 0.3, 'sawtooth', 0.12);
    }
  },
  win: () => { tone(523, 0.14); setTimeout(() => tone(784, 0.2), 120); },
  click: () => tone(500, 0.06, 'sine', 0.06),
};

export function startDrone() {
  if (!enabled || drone.length) return;
  try {
    const c = ac();
    const g = c.createGain(); g.gain.value = 0.03; g.connect(c.destination);
    [55, 82.5, 110].forEach((f) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o.connect(g); o.start(); drone.push(o);
    });
    drone.push(g);
  } catch {}
}

export function stopDrone() {
  drone.forEach((n) => { try { n.stop ? n.stop() : n.disconnect(); } catch {} });
  drone = [];
}

// Música de fondo en bucle. Se inicia con un clic (COMENZAR/CONTINUAR)
// porque el navegador bloquea el audio antes del primer gesto.
// Si el archivo no existe, avisa en consola y el juego sigue sin música.
export function startMusic(file) {
  if (!enabled) return;
  if (file) { musicFile = file; music = null; }
  if (music && !music.paused) return;
  try {
    if (!music) {
      music = new Audio(musicFile);
      music.loop = true;
      music.preload = 'auto';
      music.volume = 0.35;
      music.addEventListener('error', () => {
        console.warn(`[33] No encuentro "${musicFile}". Pon tu MP3 en la carpeta public/music/ (mira public/music/LEEME.txt).`);
      });
    }
    const p = music.play();
    if (p && p.catch) p.catch(() => {});
  } catch { /* sin música: el juego continúa */ }
}

export function stopMusic() {
  try { if (music) music.pause(); } catch {}
}
