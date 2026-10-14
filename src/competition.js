// FASE 4 — Estructura preparada para la competición de la comunidad.
// En la v1 el modo individual funciona sin cuentas y guarda en LocalStorage.
// La clasificación pública y el premio (gorra exclusiva DECA) llegan en fase 2
// con backend y validación en servidor. NUNCA declarar ganador solo con LocalStorage.

export const COMPETITION = {
  status: 'proximamente', // proximamente | activa | cerrada
  prize: 'Gorra exclusiva DECA',
  rules: [
    'Una sola tabla para todos: mismos 33 niveles, 3 intentos y 6 pistas por tablero. Sin modos ni ventajas.',
    'Gana quien complete los 33 niveles y descubra las 33 frases.',
    'Cada peligro resta exactamente 1 intento; al fallar, el tablero se tapa sin mover peligros ni banderas.',
    'El botón del final envía tu logro al WhatsApp del organizador con tus estadísticas (intentos, pistas y fecha) como constancia.',
    'Desempate: menos intentos usados en total; si empatan, menos pistas; si empatan, aviso de WhatsApp más temprano.',
    'El resultado válido para el premio se verificará en un servidor (fase 2): los datos locales no bastan para ganar.',
    'Sin cuentas y sin datos personales innecesarios para participar.',
  ],
  // Antifraude v1: el cliente solo informa; la validación real será servidor.
  // future: async submitRun({ levels, attemptsUsed, clientHash }) -> validación servidor.
};
