// Persistencia del modo individual (LocalStorage).
// Guarda: niveles completados, nivel desbloqueado y frases descubiertas.
// Los intentos NO se persisten: cada entrada a un nivel empieza con 3.
// (Evita que recargar restaure intentos; ver sistema de intentos en main.js.)

export const SAVE_KEY = 'deca33_save_v1';
export const MAX_LEVEL = 33;

export function defaultSave() {
  return { unlocked: 1, completed: [], seen: [], stats: {} };
}

export function loadSave(storage = localStorage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const s = JSON.parse(raw);
    const unlocked = Math.min(MAX_LEVEL, Math.max(1, Number(s.unlocked) || 1));
    const completed = Array.isArray(s.completed) ? s.completed.filter((n) => n >= 1 && n <= MAX_LEVEL) : [];
    const seen = Array.isArray(s.seen) ? s.seen.filter((n) => n >= 1 && n <= MAX_LEVEL) : [];
    // Coherencia: lo completado implica desbloqueo del siguiente.
    let u = unlocked;
    for (const n of completed) u = Math.max(u, Math.min(MAX_LEVEL, n + 1));
    // Marcas para el premio: { nivel: {a: intentos usados, h: pistas usadas, at: fecha} }.
    const stats = {};
    if (s.stats && typeof s.stats === 'object') {
      for (const [k, v] of Object.entries(s.stats)) {
        const n = Number(k);
        if (n >= 1 && n <= MAX_LEVEL && v && Number.isFinite(+v.a) && Number.isFinite(+v.h)) {
          stats[n] = { a: Math.max(1, Math.min(99, +v.a)), h: Math.max(0, Math.min(999, +v.h)), at: +v.at || 0 };
        }
      }
    }
    return { unlocked: u, completed: [...new Set(completed)], seen: [...new Set(seen)], stats };
  } catch {
    return defaultSave();
  }
}

export function persistSave(save, storage = localStorage) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch { /* almacenamiento no disponible: el juego sigue en memoria */ }
}

// Solo se llama al completar un nivel de forma legítima (tablero ganado).
// Si trae stat {a, h, at}, guarda la MEJOR marca del nivel (menos intentos,
// luego menos pistas): es la constancia para el premio.
export function registerCompletion(save, n, stat) {
  if (n < 1 || n > MAX_LEVEL) return save;
  if (!save.completed.includes(n)) save.completed.push(n);
  if (!save.seen.includes(n)) save.seen.push(n);
  save.unlocked = Math.max(save.unlocked, Math.min(MAX_LEVEL, n + 1));
  if (stat && Number.isFinite(+stat.a)) {
    if (!save.stats) save.stats = {};
    const cand = { a: Math.max(1, +stat.a), h: Math.max(0, +stat.h || 0), at: +stat.at || Date.now() };
    const cur = save.stats[n];
    if (!cur || cand.a < cur.a || (cand.a === cur.a && cand.h < cur.h)) save.stats[n] = cand;
  }
  // El 33 no desbloquea nada más: ya está todo abierto.
  return save;
}

// Anti-trampas: un nivel solo puede abrirse si está desbloqueado.
export function canOpen(save, n) {
  return n >= 1 && n <= MAX_LEVEL && n <= save.unlocked;
}

export function resetSave(storage = localStorage) {
  try { storage.removeItem(SAVE_KEY); } catch {}
  return defaultSave();
}
