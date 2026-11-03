# Módulos del kit de Bajo Sospecha

- **tablero/**: tablero de corcho en perspectiva 3D con luz de lámpara. Fichas mecanografiadas (Special Elite), polaroids y notas a marcador (Permanent Marker), chinchetas, hilo rojo que se dibuja y círculo de marcador. Textos de 54 a 88 px en el tablero, pensados para leerse en el celular en los acercamientos. Cámara: `cam(x, y, escala)` en coordenadas del tablero.
- **capitulo/**: tarjeta de capítulo (número, título en DM Serif y fecha). Suena con la firma corta del tema.
- **glitch.py**: transición de cartucho dañado (12 cuadros: congelado, colores corridos, franjas desplazadas, bloques corruptos, rayas, barrido). `python3 glitch.py A.mp4 B.mp4 salida.mp4 [audio.wav]`
- **mixer.py**: mezcla de una sola pista para todo el episodio. El audio no se corta entre partes.

Demo (3 de noviembre de 2026): tablero 12 s → glitch → capítulo 4.5 s. Efectos de Mixkit: 1530, 1384, 2386, 2369, 2380, 1486, 786, 2951, 1457, 1031.
**Ojo con el caso Haeger:** Jaime Anguita fue absuelto en 2017. En el episodio no se le puede marcar como culpable (nada de círculo rojo sobre "esposo" como en el demo).

- **ficha/**: ficha de persona con datos (`python3 build.py viviana.json` → index.html). Campos: dur, rol, nombre, filas [[etiqueta, valor]], sello y crédito. La foto va en `assets/foto.jpg` (en blanco y negro cálido, 560x686).
- **hora/**: última señal de vida / hora de la muerte. Campos: título, desde, hasta (el reloj corre), fecha, lugar, latidos (s), plana (s) y corte (s).
- Regla de fotos: confirmar quién aparece leyendo el pie de foto antes de usarla (la foto de ATON del veredicto no deja claro si es Anguita o Pérez).
- **mapa/**: mapa propio con datos de OpenStreetMap (Overpass, servidor maps.mail.ru) y Natural Earth. `prep.py` proyecta los datos a km → `mapdata.json`. `python3 build.py viviana.json mapdata.json`. Campos: tomas [t, cx, cy, escala px/km, duración, curva], etiquetas (lugar o p en km, visible entre dos escalas, marca dot/tri), objetivo, ruta [inicio, duración], marca y tarjeta. Crédito obligatorio: "© OpenStreetMap contributors · Natural Earth".
- **registro/**: hoja de registro de llamadas impresa fila por fila (IBM Plex Mono, efecto de impresora de matriz). Campos: título, subtítulo, tiempos [inicio, paso, impresión], filas [hora, contacto, detalle, "alerta" opcional]. La última fila hace zoom, se marca en rojo y falla. Efectos: 1371 (impresora), 2871 (tono de error), 2548, 498. Ojo: el guion no da la hora exacta de la llamada a Emy (dice "justo después" de las 09:36); confirmar antes del episodio.
- **cita/**: frase en pantalla palabra por palabra sobre una onda de voz. Campos: etiqueta, frase, inicio, finFrase, tiempos opcionales por palabra (salen de Whisper), atribución y fin ("LLAMADA CORTADA"). Sonido: clic de colgado (1384) y tono de ocupado sintético de 425 Hz.
- **contadores/**: cifras que caen una tras otra con flash, golpe (565 + 559) y temblor, y cierran todas juntas (2908). Campos: inicio, paso, items [cifra, etiqueta] y etiquetas cortas.
- **casa/**: corte transversal a medida del caso Haeger (se hace uno distinto por caso). Foto real → plano dibujado línea por línea → zoom al entretecho, la puertecita y el pestillo. Siempre con el sello "RECREACIÓN · NO A ESCALA". La foto exterior la envió Mikel (falta confirmar la fuente para el crédito).
- Duraciones: en el episodio, cada módulo toma sus tiempos de la transcripción del audio (Whisper), así que los demos solo muestran el aspecto.
- **documento/**: documento recreado (letra ilegible generada, sin inventar el texto real), luz rasante que lo recorre, lámpara UV forense con contador "HUELLAS" y sello "SIN HUELLAS".
- **comentario/**: comentario del narrador. La imagen se congela con flash, pasa a blanco y negro, entra una banda roja y la frase sarcástica a marcador. La ironía va contra las excusas o los errores (aquí, la revisión policial), nunca contra la víctima.
- **final/**: pantalla final de 15 s con logo, eslogan, dos espacios para los videos sugeridos de YouTube y el círculo de suscripción. Suena el tema del canal.
- **foto25d/depth25d.py**: foto en 2.5D con profundidad estimada por IA (Depth Anything V2 Small, en CPU): parallax y zoom suaves. `python3 depth25d.py foto.jpg salida.mp4 6 90 1.10`. Después: corrección de color con ffmpeg (eq, vignette, noise). Requiere torch (CPU), transformers y opencv-python-headless.
