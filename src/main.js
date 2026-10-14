import './style.css';
import { PHRASES } from './phrases.js';
import { LEVELS, stageOf } from './levels.js';
import * as Mines from './mines.js';
import * as Store from './storage.js';
import * as S from './audio.js';
import { COMPETITION } from './competition.js';

const $ = (s) => document.querySelector(s);
const ATTEMPTS_PER_LEVEL = 3;
const HINTS_PER_BOARD = 6; // pistas por tablero: descubren una casilla segura
// Decagrama DECA (estrella sólida de 10 puntas): icono de los peligros.
const DECA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,1 13.4,7.6 18.5,3.1 15.7,9.3 22.5,8.6 16.6,12 22.5,15.4 15.7,14.7 18.5,20.9 13.4,16.4 12,23 10.6,16.4 5.5,20.9 8.3,14.7 1.5,15.4 7.4,12 1.5,8.6 8.3,9.3 5.5,3.1 10.6,7.6" fill="currentColor"/></svg>';

// Almacenamiento seguro: si el navegador bloquea LocalStorage (algunos
// móviles, modo privado), el juego sigue en memoria en vez de quedarse en blanco.
const memStore = { _m: {},
  getItem(k) { return this._m[k] ?? null; },
  setItem(k, v) { this._m[k] = String(v); },
  removeItem(k) { delete this._m[k]; } };
function safeStorage() {
  try {
    localStorage.setItem('__deca33t', '1');
    localStorage.removeItem('__deca33t');
    return localStorage;
  } catch { return memStore; }
}
const store = safeStorage();
let save = Store.loadSave(store);
let current = 1;          // nivel abierto
let attempts = ATTEMPTS_PER_LEVEL;
let hintsLeft = HINTS_PER_BOARD;
let failsThisLevel = 0;  // fallos en este intento de nivel (para la marca)
let hintsThisLevel = 0;  // pistas usadas en este intento de nivel
let game = null;
let flagMode = false;
let cursor = 0;
let busy = false;         // bloquea clics durante animaciones
const ACCESS_CODE = '33'; // código de acceso del bloqueo inicial
let pin = '';             // dígitos marcados (declarado aquí: init() lo usa)

init();

function init() {
  S.setEnabled(save.sound !== false);
  paintSound();
  $('#btn-start').onclick = () => { S.sfx.click(); S.startDrone(); S.startMusic(); show('screen-levels'); renderLevels(); };
  $('#btn-continue').onclick = () => { S.sfx.click(); S.startDrone(); S.startMusic(); show('screen-levels'); renderLevels(); };
  $('#btn-how').onclick = () => { S.sfx.click(); openOv('ov-how'); };
  $('#btn-how-close').onclick = () => { S.sfx.click(); closeOv('ov-how'); };
  $('#btn-comp').onclick = () => { S.sfx.click(); renderComp(); openOv('ov-comp'); };
  $('#btn-comp-close').onclick = () => { S.sfx.click(); closeOv('ov-comp'); };
  $('#btn-sound').onclick = toggleSound;
  $('#btn-levels-sound').onclick = toggleSound;
  $('#btn-reset').onclick = () => { S.sfx.click(); openOv('ov-wipe'); };
  $('#btn-wipe-no').onclick = () => { S.sfx.click(); closeOv('ov-wipe'); };
  $('#btn-wipe-yes').onclick = () => {
    save = Store.resetSave(store); save.sound = S.isEnabled(); Store.persistSave(save, store);
    closeOv('ov-wipe'); refreshHome(); renderLevels(); show('screen-home'); S.sfx.click();
  };
  $('#btn-levels-home').onclick = () => { S.sfx.click(); refreshHome(); show('screen-home'); };
  $('#btn-game-menu').onclick = () => { S.sfx.click(); show('screen-levels'); renderLevels(); };
  $('#btn-restart').onclick = () => {
    if (busy || !game || game.over) return;
    S.sfx.click();
    game = Mines.createGame(game.rows, game.cols, game.mines);
    hintsLeft = HINTS_PER_BOARD;
    cursor = 0; renderBoard(); say(`Tablero nuevo. Te quedan ${attempts} intento(s).`);
  };
  $('#btn-flagmode').onclick = () => {
    flagMode = !flagMode; S.sfx.flag();
    $('#btn-flagmode').textContent = `⚑ MODO BANDERA: ${flagMode ? 'ON' : 'OFF'}`;
  };
  $('#btn-hint').onclick = () => { useHint(); };
  $('#btn-phrase-next').onclick = () => { S.sfx.click(); closeOv('ov-phrase'); afterPhrase(); };
  $('#btn-retry').onclick = () => { S.sfx.click(); closeOv('ov-defeat'); openLevel(current); };
  $('#btn-exit').onclick = () => { S.sfx.click(); closeOv('ov-defeat'); show('screen-levels'); renderLevels(); };
  $('#btn-again').onclick = () => { S.sfx.click(); closeOv('ov-final'); show('screen-levels'); renderLevels(); };
  $('#btn-share').onclick = shareResult;
  window.addEventListener('resize', () => { if ($('#screen-game').classList.contains('active')) { fitCells(); shrinkToFit(); } });
  document.addEventListener('keydown', onKey);
  refreshHome();
  initLock();
  show('screen-lock');
}

/* ---------- navegación ---------- */
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $('#' + id).classList.add('active');
  window.scrollTo(0, 0);
}
function openOv(id) { const o = $('#' + id); o.classList.remove('hidden'); requestAnimationFrame(() => o.classList.add('show')); }
function closeOv(id) { const o = $('#' + id); o.classList.remove('show'); o.classList.add('hidden'); }

function toggleSound() {
  const v = !S.isEnabled();
  S.setEnabled(v); save.sound = v; Store.persistSave(save, store); paintSound(); S.sfx.click();
}
function paintSound() {
  const t = S.isEnabled() ? 'ON' : 'OFF';
  $('#btn-sound').textContent = `SONIDO: ${t}`;
  $('#btn-levels-sound').textContent = S.isEnabled() ? '♪' : '✕';
}
function refreshHome() {
  const has = save.unlocked > 1 || save.completed.length > 0;
  $('#btn-continue').classList.toggle('hidden', !has);
  $('#continue-label').textContent = has ? `· NIVEL ${save.unlocked}` : '';
}

/* ---------- bloqueo por código (33) ---------- */
function initLock() {
  const keys = $('#pin-keys'); keys.innerHTML = '';
  ['1','2','3','4','5','6','7','8','9','⌫','0','✓'].forEach((k) => {
    const b = document.createElement('button'); b.textContent = k;
    b.onclick = () => pinPress(k);
    keys.appendChild(b);
  });
  paintPin();
}
function paintPin() {
  $('#pin-display').textContent = (pin + '––').slice(0, 2);
  $('#pin-msg').textContent = '';
}
function pinPress(k) {
  if (!$('#screen-lock').classList.contains('active')) return;
  if (k === '⌫') { pin = pin.slice(0, -1); paintPin(); return; }
  if (k === '✓') { pinTry(); return; }
  if (pin.length >= 2 || !/^[0-9]$/.test(k)) return;
  pin += k; S.sfx.click(); paintPin();
  if (pin.length === 2) setTimeout(pinTry, 250);
}
function pinTry() {
  if (pin === ACCESS_CODE) {
    S.sfx.win(); pin = ''; paintPin();
    refreshHome(); show('screen-home');
  } else {
    S.sfx.boom();
    $('#pin-msg').textContent = 'Código incorrecto.';
    const box = $('#screen-lock');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    pin = '';
    setTimeout(paintPin, 700);
  }
}

/* ---------- selección de niveles ---------- */
function renderLevels() {
  const grid = $('#level-grid'); grid.innerHTML = '';
  grid.style.display = '';
  $('#level-detail').style.maxHeight = '';
  $('#levels-progress').textContent = `${save.completed.length}/33 · ${save.seen.length} frases`;
  $('#level-detail').classList.add('hidden');
  for (const lv of LEVELS) {
    const b = document.createElement('button');
    const done = save.completed.includes(lv.n);
    const open = Store.canOpen(save, lv.n);
    b.className = 'lvl' + (done ? ' done' : '') + (!open ? ' locked' : '') + (lv.n === save.unlocked && !done ? ' current' : '');
    b.innerHTML = `<b>${open ? lv.n : '·'}</b><span>${done || open ? lv.name : 'Bloqueado'}</span>`;
    if (open) b.onclick = () => { S.sfx.click(); showDetail(lv.n); };
    grid.appendChild(b);
  }
}

function showDetail(n) {
  const lv = LEVELS[n - 1];
  const d = $('#level-detail');
  const grid = $('#level-grid');
  const seen = save.seen.includes(n);
  // En móvil la cuadrícula se pliega para que la ficha quepa sin scroll.
  const compact = window.innerWidth < 900;
  grid.style.display = compact ? 'none' : '';
  d.style.maxHeight = compact ? 'none' : '';
  d.classList.remove('hidden');
  d.innerHTML = `<b>NIVEL ${n} · ${lv.name}</b><br><span class="muted">${stageOf(n).name} · ${lv.rows}×${lv.cols} · ✦ ${lv.mines}</span>` +
    (save.stats && save.stats[n] ? `<br><span class="muted">✔ ${save.stats[n].a} intento(s) · ${save.stats[n].h} pista(s)</span>` : '') +
    (seen ? `<p class="phrase">«${PHRASES[n - 1]}»</p>` : `<p class="locked-phrase">????? — supéralo para descubrir su frase</p>`);
  const row = document.createElement('div');
  row.className = 'row'; row.style.marginTop = '8px';
  const back = document.createElement('button');
  back.className = 'btn'; back.textContent = '‹ NIVELES';
  back.onclick = () => { S.sfx.click(); d.classList.add('hidden'); grid.style.display = ''; };
  const go = document.createElement('button');
  go.className = 'btn primary'; go.textContent = 'JUGAR';
  go.onclick = () => { S.sfx.click(); openLevel(n); };
  row.append(back, go);
  d.appendChild(row);
}

/* ---------- partida ---------- */
function openLevel(n) {
  // Anti-trampas: imposible saltar al 33 ni a ningún nivel bloqueado.
  if (!Store.canOpen(save, n)) { renderLevels(); return; }
  current = n;
  attempts = ATTEMPTS_PER_LEVEL; // cada entrada a un nivel empieza con 3
  hintsLeft = HINTS_PER_BOARD;
  failsThisLevel = 0; hintsThisLevel = 0;
  flagMode = false;
  $('#btn-flagmode').textContent = '⚑ MODO BANDERA: OFF';
  const lv = LEVELS[n - 1];
  game = Mines.createGame(lv.rows, lv.cols, lv.mines);
  cursor = 0; busy = false;
  $('#game-title').textContent = `NIVEL ${n} · ${lv.name}`;
  $('#game-sub').textContent = `${stageOf(n).name} · ${lv.rows}×${lv.cols} · ✦ ${lv.mines} peligros · ${n}/33`;
  show('screen-game');
  renderBoard();
  say('Descubre las casillas seguras. El primer toque siempre es seguro.');
}

function say(m) { $('#game-msg').textContent = m || ''; shrinkToFit(); }
function paintAttempts() {
  let h = '';
  for (let i = 0; i < ATTEMPTS_PER_LEVEL; i++) h += `<span class="${i < attempts ? '' : 'lost'}">●</span>`;
  $('#attempts').innerHTML = h + `<span class="muted" style="font-size:12px;letter-spacing:.1em"> ${attempts} INTENTO${attempts === 1 ? '' : 'S'}</span>`;
}
function paintStats() {
  const totalSafe = game.rows * game.cols - game.mines;
  $('#stat-safe').textContent = `▦ ${game.revealed.size}/${totalSafe}`;
  $('#stat-flags').textContent = `⚑ ${game.flags.size}`;
}

function heightOf(sel) {
  const el = $(sel);
  return el ? el.getBoundingClientRect().height : 0;
}

// La celda se ajusta al ANCHO y al ALTO disponibles para que la partida
// entera quepa en pantalla sin scroll, en PC y en móvil.
function fitCells() {
  const lv = LEVELS[current - 1];
  const gap = 3, pad = 16;
  const wide = window.innerWidth >= 900;
  const wrapW = wide ? Math.min(1100, window.innerWidth - 80) : window.innerWidth - 40;
  const used = heightOf('#screen-game .topbar') + heightOf('#hud')
    + heightOf('#game-msg') + heightOf('#screen-game .game-tools')
    + heightOf('#screen-game .hint') + 64; // + márgenes y relleno de pantalla
  const availH = window.innerHeight - used;
  const pxW = Math.floor((wrapW - pad - gap * (lv.cols - 1)) / lv.cols);
  const pxH = Math.floor((availH - pad - gap * (lv.rows - 1)) / lv.rows);
  const px = Math.max(15, Math.min(wide ? 46 : 38, pxW, pxH));
  document.documentElement.style.setProperty('--cell', px + 'px');
}

// Garantía: tras pintar, encoge la celda hasta que el tablero quepa
// de verdad en su hueco (por si algún margen o fuente midió distinto).
function shrinkToFit() {
  const wrap = $('#board-wrap'), board = $('#board');
  if (!wrap || !board) return;
  const smaller = () => {
    const cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell')) || 30;
    if (cur <= 12) return false;
    document.documentElement.style.setProperty('--cell', (cur - 1) + 'px');
    return true;
  };
  for (let i = 0; i < 16; i++) {
    if (board.scrollHeight <= wrap.clientHeight + 1 && board.scrollWidth <= wrap.clientWidth + 1) break;
    if (!smaller()) break;
  }
  // Garantía final: la pantalla entera (tablero + botones + textos) cabe.
  const scr = $('#screen-game');
  if (scr && scr.classList.contains('active')) {
    for (let i = 0; i < 16; i++) {
      if (scr.scrollHeight <= window.innerHeight + 1) break;
      if (!smaller()) break;
    }
  }
}

function renderBoard(showMines = false) {
  fitCells();
  paintAttempts(); paintStats(); paintHint();
  const b = $('#board'); b.innerHTML = '';
  b.style.gridTemplateColumns = `repeat(${game.cols}, 1fr)`;
  const total = game.rows * game.cols;
  for (let i = 0; i < total; i++) {
    const c = document.createElement('button');
    c.className = 'cell'; c.dataset.i = i;
    c.setAttribute('aria-label', `casilla ${i + 1}`);
    paintCell(c, i, showMines);
    // clic / toque
    c.addEventListener('click', () => onCellActivate(i, false));
    c.addEventListener('dblclick', (e) => { e.preventDefault(); onCellActivate(i, true); });
    c.addEventListener('contextmenu', (e) => { e.preventDefault(); doFlag(i); });
    // mantén pulsado = bandera (móvil)
    let timer = null, longFired = false;
    c.addEventListener('pointerdown', () => {
      longFired = false;
      timer = setTimeout(() => { longFired = true; doFlag(i); }, 450);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) =>
      c.addEventListener(ev, () => clearTimeout(timer)));
    c.addEventListener('click', () => { if (longFired) { longFired = false; } }, true);
    b.appendChild(c);
  }
  paintCursor();
  shrinkToFit();
}

function paintCell(c, i, showMines) {
  c.classList.remove('covered', 'open', 'flag', 'mine-hit', 'mine-shown', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8');
  if (game.flags.has(i) && !game.revealed.has(i)) {
    c.classList.add('covered', 'flag'); c.textContent = '⚑'; return;
  }
  if (!game.revealed.has(i)) {
    c.classList.add('covered'); c.textContent = '';
    if (showMines && game.mineCells.has(i)) { c.classList.add('mine-shown'); c.innerHTML = DECA_SVG; }
    return;
  }
  const v = Mines.numberAt(game, i);
  c.classList.add('open');
  if (v > 0) { c.classList.add('n' + v); c.textContent = String(v); }
  else c.textContent = '';
}

function paintCursor() {
  $('#board').querySelectorAll('.cell').forEach((el) => el.classList.remove('cursor'));
  const el = $('#board').querySelector(`[data-i="${cursor}"]`);
  if (el) el.classList.add('cursor');
}

function onCellActivate(i, isChord) {
  if (busy || !game || game.over) return;
  if (isChord) { doChord(i); return; }
  if (flagMode) { doFlag(i); return; }
  doReveal(i);
}

function refreshCells(indices) {
  for (const i of indices) {
    const el = $('#board').querySelector(`[data-i="${i}"]`);
    if (el) paintCell(el, i, false);
  }
  paintStats();
}

function doReveal(i) {
  if (game.revealed.has(i)) { doChord(i); return; }
  if (game.flags.has(i)) return;
  const r = Mines.reveal(game, i);
  if (r.hit) { onMineHit(i); return; }
  S.sfx.open();
  refreshCells(r.opened.length ? r.opened : [i]);
  if (game.won) onWin();
  else if (r.opened.length <= 1) paintStats();
}

function doFlag(i) {
  if (busy || !game || game.over) return;
  if (Mines.toggleFlag(game, i)) { S.sfx.flag(); refreshCells([i]); }
}

function paintHint() {
  const b = $('#btn-hint');
  b.textContent = `💡 PISTA (${hintsLeft})`;
  b.style.opacity = hintsLeft > 0 ? '1' : '.4';
}

// Pista: descubre una casilla segura (nunca un peligro).
// Prefiere casillas junto a lo ya descubierto, que son las más útiles.
function useHint() {
  if (busy || !game || game.over) return;
  if (hintsLeft <= 0) { say(`Ya usaste tus ${HINTS_PER_BOARD} pistas en este tablero.`); return; }
  const total = game.rows * game.cols;
  let idx = -1;
  if (!game.started) {
    idx = Math.floor(total / 2); // el primer descubrimiento siempre es seguro
  } else {
    const safe = [];
    for (let i = 0; i < total; i++) {
      if (!game.revealed.has(i) && !game.flags.has(i) && !game.mineCells.has(i)) safe.push(i);
    }
    if (!safe.length) return;
    const useful = safe.filter((i) =>
      Mines.neighbors(game.rows, game.cols, i).some((nb) => game.revealed.has(nb)));
    const pool = useful.length ? useful : safe;
    idx = pool[Math.floor(Math.random() * pool.length)];
  }
  hintsLeft -= 1;
  hintsThisLevel += 1;
  S.sfx.flag();
  const r = Mines.reveal(game, idx);
  refreshCells(r.opened.length ? r.opened : [idx]);
  paintHint();
  if (game.won) onWin();
  else say(hintsLeft > 0 ? `Pista usada. Te quedan ${hintsLeft}.` : 'Pista usada. Ya no quedan pistas en este tablero.');
}

function doChord(i) {
  if (busy || !game || game.over) return;
  const r = Mines.chord(game, i);
  if (!r) return;
  if (r.hit) { onMineHit(i); return; }
  S.sfx.open();
  refreshCells(r.opened.length ? r.opened : [i]);
  if (game.won) onWin();
}

function onMineHit(at) {
  attempts -= 1; // exactamente 1 intento por peligro
  failsThisLevel += 1;
  S.sfx.boom();
  game.over = true;
  // Anti-trampa: solo se revela la bomba tocada, no las demás.
  renderBoard(false);
  const hitEl = $('#board').querySelector(`[data-i="${at}"]`);
  if (hitEl) { hitEl.classList.remove('mine-shown'); hitEl.classList.add('mine-hit'); hitEl.innerHTML = DECA_SVG; }
  const board = $('#board');
  board.classList.remove('shake'); void board.offsetWidth; board.classList.add('shake');
  paintAttempts();
  busy = true;
  if (attempts > 0) {
    say(`Peligro. Te quedan ${attempts} intento(s). Memoriza dónde estaba…`);
    setTimeout(() => {
      Mines.coverBoard(game); // se tapa, pero los peligros NO se mueven
      hintsLeft = HINTS_PER_BOARD; // tablero nuevo = pistas nuevas
      busy = false; cursor = 0;
      renderBoard();
      say(`Intento ${ATTEMPTS_PER_LEVEL - attempts + 1} de ${ATTEMPTS_PER_LEVEL}. Nada se movió: ni peligros ni tus ⚑.`);
    }, 1100);
  } else {
    say('Sin intentos. Mira dónde estaban los peligros…');
    renderBoard(true); // último intento: se revelan todas para aprender
    const last = $('#board').querySelector(`[data-i="${at}"]`);
    if (last) { last.classList.remove('mine-shown'); last.classList.add('mine-hit'); last.innerHTML = DECA_SVG; }
    S.sfx.error();
    setTimeout(() => { busy = false; openOv('ov-defeat'); }, 2000);
  }
}

function onWin() {
  if (current === 33) {
    S.sfx.premio();
  } else {
    S.sfx.win();
  }
  // Persistencia legítima: solo aquí se desbloquea, se revela la frase
  // y se anota la marca (fallos + 1 intento bueno, pistas, fecha).
  Store.registerCompletion(save, current, { a: failsThisLevel + 1, h: hintsThisLevel, at: Date.now() });
  Store.persistSave(save, store);
  showPhrase(current);
}

/* ---------- D. frase tras completar ---------- */
let pendingAfter = null;
function showPhrase(n) {
  pendingAfter = n >= 33 ? 'final' : n + 1;
  $('#phrase-kicker').textContent = `NIVEL ${n} SUPERADO`;
  $('#phrase-text').textContent = `«${PHRASES[n - 1]}»`;
  const btn = $('#btn-phrase-next');
  btn.classList.add('hidden');
  openOv('ov-phrase');
  setTimeout(() => btn.classList.remove('hidden'), 1400); // tiempo para leer
}
function afterPhrase() {
  if (pendingAfter === 'final') { showFinal(); return; }
  openLevel(pendingAfter);
}

/* ---------- F. final secreto ---------- */
function showFinal() {
  $('#final-count').textContent = `${save.completed.length}/33 niveles · ${save.seen.length}/33 frases`;
  openOv('ov-final');
}

const WS_NUMBER = '18294662735'; // WhatsApp del organizador (premio DECA): 829-466-2735
function shareResult() {
  // Constancia para el premio: totales con mejor marca por nivel + fecha del 33.
  let totA = 0, totH = 0, withStats = 0, lastAt = 0;
  for (const lv of LEVELS) {
    const s = save.stats && save.stats[lv.n];
    if (s) { totA += s.a; totH += s.h; withStats++; lastAt = Math.max(lastAt, s.at); }
  }
  const head = `Completé 33 THE LAST TEST (${save.completed.length}/33)`;
  const proof = withStats > 0
    ? ` · ${totA} intentos usados · ${totH} pistas` + (lastAt ? ` · ${new Date(lastAt).toLocaleString()}` : '')
    : '';
  S.sfx.click();
  window.open('https://wa.me/' + WS_NUMBER + '?text=' + encodeURIComponent(head + proof + ' · DECA DREAM ◆'), '_blank');
}

/* ---------- competición (fase 4, informativa) ---------- */
function renderComp() {
  const ul = $('#comp-rules'); ul.innerHTML = '';
  for (const r of COMPETITION.rules) {
    const li = document.createElement('li'); li.textContent = r; ul.appendChild(li);
  }
}

/* ---------- teclado ---------- */
function onKey(e) {
  if ($('#screen-lock').classList.contains('active')) {
    if (/^[0-9]$/.test(e.key)) pinPress(e.key);
    else if (e.key === 'Backspace') pinPress('⌫');
    else if (e.key === 'Enter') pinPress('✓');
    return;
  }
  if (!$('#screen-game').classList.contains('active') || !game || game.over || busy) return;
  const lv = LEVELS[current - 1];
  const r = Math.floor(cursor / lv.cols), c = cursor % lv.cols;
  let moved = true;
  if (e.key === 'ArrowUp') cursor = Math.max(0, (r - 1) * lv.cols + c);
  else if (e.key === 'ArrowDown') cursor = Math.min(lv.rows * lv.cols - 1, (r + 1) * lv.cols + c);
  else if (e.key === 'ArrowLeft') cursor = Math.max(0, cursor - 1);
  else if (e.key === 'ArrowRight') cursor = Math.min(lv.rows * lv.cols - 1, cursor + 1);
  else if (e.key === 'Enter' || e.key === ' ') { onCellActivate(cursor, false); e.preventDefault(); }
  else if (e.key === 'f' || e.key === 'F') doFlag(cursor);
  else if (e.key === 'c' || e.key === 'C') doChord(cursor);
  else moved = false;
  if (moved) paintCursor();
}
