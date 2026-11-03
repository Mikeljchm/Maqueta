# Bajo Sospecha: manual de producción (borrador, 3 de noviembre de 2026)

## Reparto
- Guion e investigación: el otro chat de Mikel. El guion llega limpio y las marcas de producción las pone el editor (Claude).
- Voz: Mikel en ElevenReader, a velocidad 1.0.
- Producción y edición completas: Claude.

## Flujo
1. Guion → **escaleta** (bloques y módulos).
2. **Hoja de planos** por capítulo: cada frase con la miniatura de lo que se verá. Mikel aprueba o pide cambios **antes de renderizar**.
3. Audio → sincronía por palabra (Whisper) → render por capítulos → unión → **una sola mezcla de audio para todo el episodio** (la música nunca se corta entre partes).
4. Entrega en 1080p como mínimo (probar 1440p para YouTube).

## Imagen
- Orden de preferencia: material real del caso → gráficos a medida → archivo o Flow solo si pasa el filtro (lugar, época, clima, hora y objetos coherentes con el guion).
- **Si nada encaja, va un gráfico, nunca relleno.**
- Nunca: menores, cuerpos, escenas con sangre, caras inventadas de personas reales, marcas de agua.
- **Tablero de detective de corcho**, columna vertebral del episodio: crece con cada persona o pista y se recapitula al final de cada capítulo. **Textos grandes, legibles en el celular.**

## Glitch
- Es una **transición violenta y rápida** (6 a 12 cuadros): pantalla que se congela, rayas de colores, bloques desplazados, colores corridos, como un cartucho viejo fallando. Lleva su ruido digital.
- Se usa para pasar de una escena a otra, sobre todo en saltos de tiempo y cambios de capítulo. No en cada corte, para que siga golpeando.

## Sonido
- **Tema propio del canal: APROBADO por Mikel (3 de noviembre de 2026).** Re menor, 64 BPM. Motivo de piano re–fa–mi–do sostenido (la última nota queda sin resolver), drone, latido, cello y tic de reloj. Versión completa de 57 s y firma corta de 11 s (`marca/tema/tema.py`). Va en las tarjetas de capítulo, en el cierre y como fondo; **no sobre la intro de la cerradura**, que se queda con su propio sonido. Pulirlo más adelante con un piano muestreado de verdad.
- Fondos de suspenso (drones y pads como los de los logos) bajo la narración.
- **Efectos literales sincronizados con la palabra:** "le disparó" → disparo, negro y zumbido de oídos; puerta, teléfono, máquina de escribir, obturador en las fotos. Con buen gusto: nada de gritos ni sonidos de violencia gráfica.
- Silencio total en los golpes narrativos ("Era Viviana.").

## Entregas
- Piezas de menos de 15 MB: página privada de claude.ai (solo para ver; la descarga desde ahí falla).
- Episodios: Google Drive. Está conectado en la cuenta de Mikel, pero no cargó en esta sesión: revisar en una sesión nueva.

## Referencias de estilo
- Discovery ID (recreaciones, rótulos fuertes, golpes y destellos) + documental de Netflix (2.5D, silencios, archivo, ritmo pausado). Mikel decidió no mandar clips (gastan mucho contexto). Netflix para contar, Discovery ID para golpear: 80 % calma y 20 % impacto.

## La plantilla-guía: de guion + audio a episodio
El episodio de Viviana Haeger es el **piloto de la plantilla**: todo lo que se construya para él queda reutilizable.

Carpeta por episodio: `episodios/<nn-caso>/` con `guion.txt`, `audio.mp3`, `escaleta.md`, `planos.json`, `fuentes.csv` y `render/`.

1. **Transcribir** el audio (Whisper, tiempo por palabra).
2. **Escaleta y planos**: bloques del guion → módulos con sus datos (`planos.json`).
3. **Hoja de planos** (página HTML con miniaturas) → aprobación de Mikel.
4. **Material**: fotos reales (prensa como uso justo), mapas y archivo → `fuentes.csv`.
5. **Render por capítulos**: cada módulo se alimenta con datos (nombre, fecha, foto, texto), sin tocar el código.
6. **Mezcla única** (voz, tema, fondos y efectos) → unión → entrega.

Módulos con datos: tablero, ficha de persona, capítulo, glitch, hora de la muerte, mapa, registro de llamadas, corte de la casa (a medida por caso), cita, documento, contadores, foto 2.5D, comentario del narrador y cierre.

## Criterio sobre sospechosos absueltos (decisión de Mikel)
Se cuenta la historia tal cual fue: si alguien fue sospechoso, detenido o procesado, se muestra como sospechoso, y el veredicto se cuenta también. Las sospechas van atribuidas a quien las tuvo (fiscalía, familia, policía) y no se agregan acusaciones que no estén en el expediente ni en la prensa.
