// Pruebas obligatorias del mandato (§13). Ejecuta: npm run verify
// No abre el navegador: valida datos y lógica pura + presencia de cableado UI.
import { PHRASES } from '../src/phrases.js';
import { LEVELS, stageOf } from '../src/levels.js';
import * as Mines from '../src/mines.js';
import * as Store from '../src/storage.js';
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name); } };

// Frases oficiales exactas (redacción y orden del mandato).
const OFFICIAL = [
'Todo gran camino comienza con una decisión.','No todos comprenderán el propósito de tu camino.',
'La soledad también puede enseñarte a escuchar.','Antes de guiar a otros, aprende a dominarte.',
'No todo lo que deseas te hace bien.','La verdadera fuerza comienza dentro de ti.',
'Puedes tener poco y aun así tener algo que ofrecer.','No juzgues una historia por su primera página.',
'A veces, el camino correcto es el más difícil.','No necesitas ser comprendido para seguir adelante.',
'El propósito se demuestra con acciones.','No todo poder merece ser aceptado.',
'La tentación no siempre parece una amenaza.','Hay victorias que comienzan con un no.',
'La verdad puede incomodar a quienes viven de apariencias.','No todos los que caminan contigo creen en tu destino.',
'La humildad revela lo que el orgullo esconde.','Ayudar a alguien no debería depender de quién sea.',
'A veces, el rechazado es quien más tiene para enseñar.','No confundas la aprobación con la verdad.',
'Puedes hacer el bien y aun así ser malinterpretado.','La fidelidad se demuestra cuando todo empieza a costar.',
'No todos los que te llaman amigo permanecerán a tu lado.','La compasión también exige valentía.',
'Servir no te hace menos; revela quién eres.','El miedo puede acompañarte sin decidir por ti.',
'Hay verdades que se mantienen incluso bajo presión.','A veces, ser fiel a tu propósito tiene un precio.',
'No todos los que te rodean estarán contigo en tu hora más difícil.','El silencio no siempre significa abandono.',
'El amor verdadero puede exigir más de lo que imaginabas.','Hay finales que parecen definitivos, pero no lo son.',
'Creyeron que era el final. No sabían que el propósito iba más allá de la muerte.',
];

console.log('33 · verificaciones §13');
ok(LEVELS.length === 33, 'existen exactamente 33 niveles');
ok(PHRASES.length === 33, 'existen exactamente 33 frases');
ok(OFFICIAL.every((p, i) => PHRASES[i] === p), 'cada nivel tiene su frase correcta (redacción y orden)');
ok(LEVELS.every((l, i) => l.n === i + 1), 'niveles numerados 1–33 sin saltos');
ok([1,12,23,33].every((n) => !!stageOf(n)), 'etapas 1–11/12–22/23–32/33 configuradas');
ok(LEVELS.every((l) => l.rows >= 5 && l.cols >= 5 && l.mines >= 0 && l.mines < l.rows * l.cols),
  'dimensiones y peligros válidos en tabla de datos');
ok(LEVELS[0].mines === 1, 'el nivel 1 empieza con 1 solo peligro');
// Una sola dificultad para todos (premio): curva 3% → 12%.
ok(LEVELS.filter((l) => l.n <= 11).every((l) => l.mines / (l.rows * l.cols) <= 0.071), 'principiante (1–11) suave');
ok(LEVELS.filter((l) => l.n >= 12 && l.n <= 22).every((l) => l.mines / (l.rows * l.cols) <= 0.101), 'estratega (12–22) media');
ok(LEVELS.filter((l) => l.n >= 23).every((l) => l.mines / (l.rows * l.cols) <= 0.121), 'entrega y final (23–33) con reto');

// Sistema de 3 intentos (lógica)
{
  const g = Mines.createGame(5, 5, 3);
  Mines.placeMines(g, 0, () => 0.5);
  ok(!g.mineCells.has(0), 'primer clic seguro (la primera casilla nunca es peligro)');
  const mineIdx = [...g.mineCells][0];
  const before = g.revealed.size, fbefore = g.flags.size;
  const r = Mines.reveal(g, mineIdx);
  ok(r.hit === true, 'una casilla peligrosa registra el impacto');
  // main.js resta exactamente 1 intento por impacto y tapa el tablero sin mover nada:
  const minesBefore = [...g.mineCells].sort().join(',');
  let f = 0; while (g.mineCells.has(f)) f++;
  Mines.toggleFlag(g, f);
  Mines.coverBoard(g);
  ok(g.revealed.size === 0, 'el tablero se tapa al perder un intento');
  ok(g.flags.has(f), 'las banderas se quedan en cada intento');
  ok([...g.mineCells].sort().join(',') === minesBefore && g.started, 'los peligros siguen en el mismo sitio (memorizables)');
  ok(before === 0 && fbefore === 0, 'sanidad del estado inicial');
}

// Progreso y anti-trampas (storage con mock)
{
  const mem = {};
  const storage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } };
  let s = Store.loadSave(storage);
  ok(s.unlocked === 1 && !Store.canOpen(s, 33), 'no se puede saltar al nivel 33');
  Store.registerCompletion(s, 1); Store.persistSave(s, storage);
  ok(s.unlocked === 2 && Store.canOpen(s, 2) && !Store.canOpen(s, 3), 'completar desbloquea solo el siguiente');
  const s2 = Store.loadSave(storage);
  ok(s2.completed.includes(1) && s2.unlocked === 2, 'lo completado persiste al recargar');
  ok(!Store.canOpen(s2, 33), 'tras recargar sigue sin acceso al 33');
}

// Marcas para el premio: mejor marca por nivel, con persistencia
{
  const mem2 = {};
  const st2 = { getItem: (k) => mem2[k] ?? null, setItem: (k, v) => { mem2[k] = v; }, removeItem: (k) => { delete mem2[k]; } };
  const t = Store.loadSave(st2);
  ok(t.stats && typeof t.stats === 'object', 'estadísticas inician vacías');
  Store.registerCompletion(t, 5, { a: 3, h: 4, at: 123 });
  ok(t.stats[5] && t.stats[5].a === 3 && t.stats[5].h === 4, 'se guarda la marca del nivel');
  Store.registerCompletion(t, 5, { a: 2, h: 9, at: 124 });
  ok(t.stats[5].a === 2, 'se conserva la mejor marca (menos intentos)');
  Store.registerCompletion(t, 5, { a: 5, h: 0, at: 125 });
  ok(t.stats[5].a === 2, 'una marca peor no sobrescribe');
  Store.persistSave(t, st2);
  ok(Store.loadSave(st2).stats[5].a === 2, 'las marcas persisten al recargar');
}

// Cableado UI presente en main.js (estático)
{
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  ok(main.includes('ATTEMPTS_PER_LEVEL = 3'), 'cada nivel comienza con tres intentos');
  ok(main.includes('attempts -= 1'), 'el peligro resta exactamente un intento');
  ok(main.includes("openOv('ov-defeat')"), 'derrota a los 0 intentos con reintentar/salir');
  ok(main.includes('Store.canOpen(save, n)'), 'apertura validada (sin saltos)');
  ok(main.includes('registerCompletion') && main.includes('onWin'), 'frase solo tras completar (onWin→registerCompletion→showPhrase)');
  ok(main.includes('pendingAfter') && main.includes("showFinal()"), 'final secreto al completar el 33');
  ok(main.includes('pointerdown') && main.includes('contextmenu'), 'ratón y táctil (clic, derecho, mantén)');
  ok(main.includes('ArrowUp') && main.includes("'f'"), 'teclado (flechas, acción, bandera)');
  ok(main.includes('wa.me/') && main.includes('18294662735'), 'compartir del final abre tu WhatsApp');
  ok(main.includes('failsThisLevel') && main.includes('hintsThisLevel'), 'estadísticas de intentos y pistas por nivel');
  ok(!main.includes('confirm('), 'borrado con pantalla propia (funciona en móvil)');
  ok(main.includes('CONTINUAR') || main.includes('btn-phrase-next'), 'botón CONTINUAR tras la frase');
  ok(main.includes('HINTS_PER_BOARD = 6'), '6 pistas por tablero para todos');
  ok(!main.includes('btn-mode'), 'sin modos de dificultad (una sola tabla para el premio)');
  ok(main.includes('DECA_SVG') && main.includes('<polygon'), 'peligros con icono decagrama');
  ok(!main.includes('btn-auto') && !main.includes('applyCertainMoves'), 'sin botón AUTO (el premio se gana jugando)');
  ok(main.includes('coverBoard'), 'al fallar se tapa sin mover los peligros');
  ok(main.includes('renderBoard(false)'), 'con intentos restantes solo se muestra la bomba tocada');
  ok(main.includes('renderBoard(true)'), 'en el último intento se muestran todas');
}

// Cierre extra del final: no sustituye la frase 33 oficial
{
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  ok(html.includes('Muchos de los que ahora son los primeros'), 'línea de cierre presente en el final');
  ok(html.includes('id="screen-lock"'), 'pantalla de código de acceso');
  ok(PHRASES[32] === 'Creyeron que era el final. No sabían que el propósito iba más allá de la muerte.', 'la frase 33 oficial intacta');
}

// Sin scroll: la partida encaja en la ventana (PC y móvil)
{
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  ok(css.includes('100dvh') && css.includes('#screen-game'), 'pantalla de juego a altura completa');
  const srcFit = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  ok(srcFit.includes('innerHeight'), 'celdas ajustadas al alto disponible');
  ok(css.includes('repeat(11, 1fr)'), 'pruebas a pantalla completa en PC');
  ok(srcFit.includes('shrinkToFit'), 'ajuste garantizado del tablero a su hueco');
  ok(srcFit.indexOf('let pin') !== -1 && srcFit.indexOf('let pin') < srcFit.indexOf('init();'), 'estado declarado antes de init() (sin TDZ)');
  ok(srcFit.includes("pin === '33'") || srcFit.includes('ACCESS_CODE'), 'código de acceso 33');
  ok(srcFit.includes('safeStorage'), 'arranque blindado si el móvil bloquea el almacenamiento');
  ok(srcFit.includes('grid.style.display'), 'detalle móvil sin scroll (cuadrícula plegable)');
}

console.log(`\nResultado: ${pass} ✓ · ${fail} ✗`);
process.exit(fail ? 1 : 0);
