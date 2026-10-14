// Tabla de datos de los 33 niveles: dimensiones y peligros.
// UNA SOLA DIFICULTAD para todos (juego limpio: habrá premio).
// Curva progresiva: ~3% de peligros al inicio, 12% en el final.
// Cada tablero trae 6 PISTAS (💡) que descubren una casilla segura.
export const STAGES = [
  { from: 1, to: 11, name: 'EL COMIENZO' },
  { from: 12, to: 22, name: 'LA PRUEBA' },
  { from: 23, to: 32, name: 'LA ENTREGA' },
  { from: 33, to: 33, name: 'LA REVELACIÓN' },
];

export function stageOf(n) {
  return STAGES.find((s) => n >= s.from && n <= s.to);
}

// rows x cols = cuadrícula · mines = peligros.
export const LEVELS = [
  { n: 1,  name: 'La Decisión',        rows: 5,  cols: 5,  mines: 1  },
  { n: 2,  name: 'El Propósito',       rows: 5,  cols: 6,  mines: 1  },
  { n: 3,  name: 'El Silencio',        rows: 6,  cols: 6,  mines: 1  },
  { n: 4,  name: 'El Dominio',         rows: 6,  cols: 6,  mines: 1  },
  { n: 5,  name: 'El Deseo',           rows: 6,  cols: 7,  mines: 2  },
  { n: 6,  name: 'La Fuerza Interior', rows: 7,  cols: 7,  mines: 2  },
  { n: 7,  name: 'Lo Poco',            rows: 7,  cols: 7,  mines: 2  },
  { n: 8,  name: 'La Primera Página',  rows: 7,  cols: 8,  mines: 3  },
  { n: 9,  name: 'El Camino Difícil',  rows: 8,  cols: 8,  mines: 3  },
  { n: 10, name: 'Seguir Adelante',    rows: 8,  cols: 8,  mines: 4  },
  { n: 11, name: 'Las Acciones',       rows: 8,  cols: 9,  mines: 4  },
  { n: 12, name: 'El Poder',           rows: 8,  cols: 9,  mines: 4  },
  { n: 13, name: 'La Tentación',       rows: 9,  cols: 9,  mines: 5  },
  { n: 14, name: 'El No',              rows: 9,  cols: 9,  mines: 5  },
  { n: 15, name: 'Las Apariencias',    rows: 9,  cols: 10, mines: 6  },
  { n: 16, name: 'Los Que Caminan',    rows: 9,  cols: 10, mines: 6  },
  { n: 17, name: 'La Humildad',        rows: 10, cols: 10, mines: 8  },
  { n: 18, name: 'Ayudar',             rows: 10, cols: 10, mines: 8  },
  { n: 19, name: 'El Rechazado',       rows: 10, cols: 11, mines: 9  },
  { n: 20, name: 'La Aprobación',      rows: 10, cols: 11, mines: 9  },
  { n: 21, name: 'El Malentendido',    rows: 10, cols: 12, mines: 10 },
  { n: 22, name: 'La Fidelidad',       rows: 11, cols: 12, mines: 12 },
  { n: 23, name: 'El Amigo',           rows: 11, cols: 12, mines: 12 },
  { n: 24, name: 'La Valentía',        rows: 12, cols: 12, mines: 14 },
  { n: 25, name: 'Servir',             rows: 12, cols: 13, mines: 15 },
  { n: 26, name: 'El Miedo',           rows: 12, cols: 13, mines: 16 },
  { n: 27, name: 'Bajo Presión',       rows: 12, cols: 14, mines: 17 },
  { n: 28, name: 'El Precio',          rows: 13, cols: 14, mines: 19 },
  { n: 29, name: 'La Hora Difícil',    rows: 13, cols: 14, mines: 20 },
  { n: 30, name: 'La Ausencia',        rows: 13, cols: 15, mines: 22 },
  { n: 31, name: 'El Amor Verdadero',  rows: 14, cols: 15, mines: 24 },
  { n: 32, name: 'El Final Aparente',  rows: 14, cols: 15, mines: 25 },
  { n: 33, name: 'Más Allá',           rows: 14, cols: 16, mines: 27 },
];
