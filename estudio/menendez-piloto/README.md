# Piloto true crime: "La noche de Elm Drive" (hermanos Menéndez), 16:9, ~4 min
- `guion.json`: narración por escenas (Kokoro ef_dora, velocidad 0.92).
- `plan.py`: línea de tiempo (inicio de cada narración, capítulos, llamada, cierre).
- `music.py`: música de suspenso y efectos (zumbido, latidos, golpes, estática, tic-tac) con la música bajando bajo la voz.
- `fetch.py` + `stock.json`: videos de ambiente de Pixabay (sin marca de agua). Las imágenes verdes se recortan con `colorkey`.
- `build.py`: genera `menendez-video/index.html` (glitch, fichas, mapa, recibo, contadores, llamada al 911, periódico, nota de Vera).
- Salida final: video a 6 Mbps más `loudnorm=I=-15` (el grano dispara el peso: a CRF 22 pesó 970 MB).
- Datos verificados en Wikipedia ("Lyle and Erik Menendez"). Llamada: frases cortas de la transcripción de CNN (2003). El audio real no se pudo descargar.
