# 33 THE LAST TEST · DECA DREAM

Buscaminas narrativo: 33 niveles, 3 intentos por nivel, 33 frases ocultas. Cada decisión te acerca al final.

## Jugar

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # genera dist/
npm run verify  # pruebas internas
```

## Estructura

```
src/
├── phrases.js      # 33 frases oficiales (no editar redacción/orden)
├── levels.js       # tabla de 33 niveles: rows × cols, mines, nombre, etapa
├── mines.js        # lógica pura del tablero
├── storage.js      # progreso en LocalStorage (deca33_save_v1)
├── main.js         # intentos/reinicios, pantallas, animaciones, input
├── audio.js        # WebAudio sin assets
├── competition.js  # reglas y stub fase 4
└── style.css       # identidad DECA
index.html          # pantallas A–F
```

## Reglas clave

- Entrar a un nivel = 3 intentos. Peligro = −1 intento + tablero tapado **sin mover nada** (ni peligros ni banderas)
- 0 intentos → derrota con REINTENTAR NIVEL (3 nuevos) y SALIR. Lo completado nunca se pierde
- La frase aparece solo tras ganar, con fundido + CONTINUAR. El nivel 33 tiene final cinematográfico
- Sin saltos: `canOpen()` bloquea niveles no desbloqueados
- Controles: clic/toque descubrir · clic derecho/mantén/modo bandera ⚑ · doble clic en número = acuerdo · teclado: flechas + Enter + F + C

## Competición (fase 4)

Informativa en v1: reglas visibles en COMPETICIÓN. La clasificación y la gorra DECA exigirán backend con validación en servidor; LocalStorage no es prueba válida.

## Deploy

```bash
vercel --prod
```

Framework detectado: Vite | Build: `vite build` | Output: `dist/`