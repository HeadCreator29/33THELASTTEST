// Lógica pura del tablero (sin DOM). Probada en scripts/verify.mjs.
// Estados: covered → revealed | flag. Ganas al revelar todas las seguras.

export function neighbors(rows, cols, idx) {
  const r = Math.floor(idx / cols), c = idx % cols;
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
    }
  }
  return out;
}

export function createGame(rows, cols, mines) {
  return {
    rows, cols, mines,
    started: false,   // false hasta el primer descubrimiento (primer clic seguro)
    over: false, won: false,
    mineCells: new Set(),
    revealed: new Set(),
    flags: new Set(),
  };
}

// Coloca los peligros evitando la casilla del primer clic y sus vecinas.
// Reintenta hasta lograr una apertura en cero (o agota intentos).
export function placeMines(game, safeIdx, rand = Math.random) {
  const total = game.rows * game.cols;
  const forbidden = new Set([safeIdx, ...neighbors(game.rows, game.cols, safeIdx)]);
  const freeCount = total - forbidden.size;
  if (game.mines > freeCount) {
    // Tablero diminuto: excluye solo la casilla del clic.
    forbidden.clear(); forbidden.add(safeIdx);
  }
  let best = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const pool = [];
    for (let i = 0; i < total; i++) if (!forbidden.has(i)) pool.push(i);
    // Fisher–Yates parcial
    for (let i = 0; i < game.mines; i++) {
      const j = i + Math.floor(rand() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const cells = new Set(pool.slice(0, game.mines));
    best = cells;
    if (countAdjacent(game, cells, safeIdx) === 0) break;
  }
  game.mineCells = best;
  game.started = true;
}

export function countAdjacent(game, cells, idx) {
  let n = 0;
  for (const nb of neighbors(game.rows, game.cols, idx)) if (cells.has(nb)) n++;
  return n;
}

export function numberAt(game, idx) {
  return countAdjacent(game, game.mineCells, idx);
}

// Revela una casilla. Retorna { hit, opened[] }.
// hit=true si era peligro. opened = casillas recién descubiertas (con expansión en ceros).
export function reveal(game, idx) {
  if (game.over || game.revealed.has(idx) || game.flags.has(idx)) return { hit: false, opened: [] };
  if (!game.started) placeMines(game, idx);
  if (game.mineCells.has(idx)) return { hit: true, opened: [] };
  const opened = [];
  const stack = [idx];
  while (stack.length) {
    const cur = stack.pop();
    if (game.revealed.has(cur) || game.flags.has(cur) || game.mineCells.has(cur)) continue;
    game.revealed.add(cur);
    opened.push(cur);
    if (numberAt(game, cur) === 0) {
      for (const nb of neighbors(game.rows, game.cols, cur)) {
        if (!game.revealed.has(nb) && !game.flags.has(nb)) stack.push(nb);
      }
    }
  }
  if (isWin(game)) { game.won = true; game.over = true; }
  return { hit: false, opened };
}

export function toggleFlag(game, idx) {
  if (game.over || game.revealed.has(idx)) return false;
  if (game.flags.has(idx)) game.flags.delete(idx);
  else game.flags.add(idx);
  return true;
}

// Acuerdo (chord): sobre un número revelado, si tiene tantas banderas
// vecinas como su valor, descubre el resto de vecinas.
// Retorna { hit, opened[] } o null si no aplica.
export function chord(game, idx) {
  if (game.over || !game.revealed.has(idx)) return null;
  const value = numberAt(game, idx);
  if (value === 0) return null;
  const nbs = neighbors(game.rows, game.cols, idx).filter((i) => !game.revealed.has(i));
  const flagged = nbs.filter((i) => game.flags.has(i)).length;
  if (flagged !== value) return null;
  let hit = false;
  let opened = [];
  for (const nb of nbs) {
    if (game.flags.has(nb)) continue;
    const r = reveal(game, nb);
    opened = opened.concat(r.opened);
    if (r.hit) { hit = true; break; }
  }
  return { hit, opened };
}

export function isWin(game) {
  return game.revealed.size === game.rows * game.cols - game.mines;
}

// Reintento memorizable (al fallar un intento): tapa el tablero pero los
// peligros SE QUEDAN en el mismo sitio y las banderas TAMBIÉN se quedan,
// para que el jugador recuerde dónde estaba la bomba que falló.
// started se conserva para no recolocar. Las banderas erróneas las quita
// el jugador tocándolas de nuevo.
export function coverBoard(game) {
  game.over = false; game.won = false;
  game.revealed = new Set();
  // game.flags y game.mineCells se conservan a propósito.
}
