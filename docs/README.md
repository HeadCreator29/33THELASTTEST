# 33 THE LAST TEST · DECA DREAM

Buscaminas narrativo: 33 niveles, 3 intentos por nivel, 33 frases ocultas. Cada decisión te acerca al final.

## Jugar
- `npm install` · `npm run dev` → http://localhost:5173
- `npm run build` → `dist/` · `npm run verify` → pruebas §13 del mandato

## Estructura (código separado por responsabilidad)
- `src/phrases.js` — las 33 frases oficiales (no editar redacción/orden).
- `src/levels.js` — tabla de 33 niveles: `rows × cols`, `mines`, nombre y etapa. Ajusta dificultad aquí.
- `src/mines.js` — lógica pura del tablero (primer clic seguro, expansión, banderas, acuerdo, victoria).
- `src/storage.js` — progreso individual en LocalStorage (`deca33_save_v1`): completados, desbloqueo, frases vistas.
- `src/main.js` — intentos/reinicios, pantallas, animaciones, teclado/ratón/táctil.
- `src/audio.js` — WebAudio sin assets. `src/competition.js` — reglas y stub fase 4.
- `index.html` + `src/style.css` — pantallas A–F e identidad DECA.

## Reglas clave
- Entrar a un nivel = 3 intentos. Peligro = −1 intento + tablero tapado SIN mover nada: ni peligros ni banderas (memoriza dónde estaba la bomba).
- 0 intentos → derrota sobria con REINTENTAR NIVEL (3 nuevos) y SALIR. Lo completado nunca se pierde.
- La frase aparece solo después de ganar, con fundido + CONTINUAR. El 33 tiene final cinematográfico (oscuridad→luz) con compartir y volver a jugar.
- Sin saltos: `canOpen()` bloquea niveles no desbloqueados; no hay atajos por URL.
- Controles: clic/toque descubrir · clic derecho/mantén/modo bandera para ⚑ · doble clic en número = acuerdo · teclado: flechas + Enter + F + C.

## Competición (fase 4)
Informativa en v1: reglas visibles en COMPETICIÓN. La clasificación y la gorra DECA exigirán backend con validación en servidor; LocalStorage no es prueba válida.
