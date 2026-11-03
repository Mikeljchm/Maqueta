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
