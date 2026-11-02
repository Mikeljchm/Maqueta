# Estudio de motion graphics: archivos de trabajo

Aquí está el código para rehacer o ajustar los videos sin empezar desde cero.
**No incluye la canción de SAWADIKA** (tiene derechos de autor): hay que volver a subir el MP3.

## sawadika/ — lyric video de "SAWADIKA" (LISA), vertical 1080x1920
- `sync/lyrics.txt`: la letra, un renglón por frase (76 renglones).
- `sync/timing2.json`: **sincronización final** palabra por palabra (es la que usa la versión TV).
  `timing.json` es la primera versión (solo el modelo small).
- `sync/words*.json`: lo que oyó Whisper (small, tramos perdidos y medium). `beats_raw.json`: 420 golpes a 140 BPM.
- `sync/align2.py` y `sync/merge.py`: cruzan Whisper con la letra por secciones y mezclan los dos modelos.
- `v1-galaxia/build.py`: versión 1 (índigo, rojo y cielo). `v2-tv/build_tv.py`: versión 2, "La diva en tu TV".
- Para corregir una frase: edita los tiempos `s` y `e` de esas palabras en `timing2.json` y vuelve a generar.

### Rehacer la versión TV en una sesión nueva
1. `npx -y hyperframes@0.8.227 init sawadika-tv -e blank --non-interactive --skip-skills` dentro del scratchpad.
2. Copiar en `assets/`: `lib/gsap.min.js`, las fuentes de `/opt/motion-kit/node_modules/@fontsource`
   (syne 800, playfair-display italic 700 y 900, oswald 700, russo-one, barlow-condensed 800 italic, bebas-neue, inter-tight 500),
   `DejaVuSansMono-Bold.ttf`, `img/noise.png` (ruido 270x480) y `audio/song.mp3` (la canción).
3. Ajustar la variable `D` al inicio de `build_tv.py` (ruta del scratchpad) y ejecutar `python3 build_tv.py ruta/a/timing2.json`.
4. `npx hyperframes render -o salida.mp4` (unos 25 min para 3:07).

## untd-promo/ — promo de 20 s de untdkicks.com
`index.html` (composición), `shot.js` (captura de la web sin el popup) y `beat.py` (genera la música a 120 BPM).
Las imágenes se vuelven a sacar con `hyperframes capture` y `shot.js`.

## liquido/ — prueba de líquido en Blender
`liquido.py`: `blender -b --factory-startup --python liquido.py -- 48` (cuadros) y después se unen con ffmpeg.
