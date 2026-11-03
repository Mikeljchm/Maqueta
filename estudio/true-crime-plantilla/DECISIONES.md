# Plantilla PRO de true crime: decisiones (2 de noviembre de 2026)

## Confirmado
| Tema | Decisión |
|---|---|
| Formato | Episodios de 15 a 40 min, sin duración fija. La plantilla trabaja por **capítulos de ~5 min** que se unen al final, así da igual cuánto dure el episodio. De cada uno salen 2 o 3 Shorts. |
| Estilo visual | **Mezcla de docuserie de Netflix y TV clásica (Discovery ID).** La base es la de Netflix: fotos en 2.5D, documentos con luz rasante, mapas reales y silencios. De la TV se toman los acentos: rótulos fuertes, ritmo de noticiero en las revelaciones y recreaciones con siluetas de Pixabay. |
| Material real | Se mantiene la regla del 2 de noviembre (está en la skill, sección 10). El audio del 911 lo baja Mikel. |
| Música | Biblioteca con licencia (Pixabay Music o YouTube Audio Library), bajada por Mikel. Nada de música generada. |

## Pendiente
- **Nombre del canal.** La plantilla se arma con la marca como variable (`marca.json`: nombre, logo, colores, fuentes), así que cambiar el nombre después es un cambio de un archivo. Propuestas: "Hasta que la muerte", "Expediente Corazón", "Las notas de Vera".
- **Voz.** Mikel propone ElevenReader o Google AI Studio.
  - **ElevenReader: descartada.** La ayuda oficial de ElevenLabs dice que su audio es solo para uso personal dentro de la app y que no se puede exportar ni usar comercialmente. En un canal monetizado es un riesgo real.
  - **Google AI Studio (TTS de Gemini): candidata.** Es gratis y tiene buena expresividad. Las condiciones de la API la describen para uso profesional, pero Google no ha confirmado oficialmente que el audio del plan gratis sirva para YouTube monetizado. Hay que leer las condiciones vigentes antes de publicar.
  - Plan B con licencia clara: ElevenLabs de pago (el producto principal, no ElevenReader).
  - Próximo paso: hacer una prueba ciega con el mismo párrafo del guion en 2 o 3 voces.

## Voz: pruebas del 2 de noviembre de 2026 (Gemini TTS, clave en la variable GEMINI_API_KEY, nunca en el repo)
- La clave está en el **plan gratis** (lo confirman los errores 429 "free_tier"). Límite: **unas 10 peticiones al día por modelo** de voz. Hay 4 modelos de voz con cupo propio: 3.8-flash, 3.8-flash-lite, 3.1-flash-preview y 2.5-flash-preview.
- Imágenes con Gemini: **cupo gratis 0**. Hace falta facturación.
- Favoritas de la ronda 1: **C = Enceladus** y **F = Sulafat**. Ronda 2 (G a L) enviada. Correspondencia de letras y voces en `voz/mapa.txt`.
- Contra el "efecto frasco" (la voz se degrada en audios largos): generar **por bloques de 25 a 45 s** con las mismas notas de dirección (`voz/notas.txt`) y unirlos con pausas de 0.9 s (`voz/largo.py`).
- Las notas de dirección van con el formato `# AUDIO PROFILE / ### DIRECTOR'S NOTES / #### TRANSCRIPT`. Si no, lee las instrucciones en voz alta.

## Voz elegida: ElevenReader (decisión de Mikel, 2 de noviembre de 2026)
- Mikel graba el audio interno del teléfono en ElevenReader a **velocidad 1.0** y manda MP3 + texto. Pasará a ElevenLabs de pago (misma voz) antes de entrar al Programa de Socios de YouTube.
- Prueba: limpia (ruido -91 dB, sin saturación, sin efecto frasco). Se había grabado a 1.3x por error.
- **Lección:** al alargar pausas, cortar solo en silencios reales (mínimo de energía medido, no el punto medio entre palabras de Whisper) y con fundidos de 10 a 20 ms. Mikel notó cortes malos en la versión "con respiros".
- Google Gemini TTS queda de respaldo para parches.

## Identidad (2 de noviembre de 2026)
- **Narrador mordaz:** juzga con ironía y sarcasmo, nunca de frente ("Sí, claro, ¿para qué denunciar si puedes matar?"). La ironía va contra los agresores y las excusas, **nunca contra las víctimas**. Casos sin sentencia firme: ironía sobre los hechos, con "presuntamente".
- **Contenido:** 90 % crímenes de pareja (infidelidad, obsesión, celos) y 10 % otros casos llamativos. El nombre debe abarcar las dos cosas.
- **Orden:** nombre → varias opciones de logo → color (el color sale del logo). Vino/carmesí y negro/ámbar siguen en la mesa.
- **Música:** YouTube Audio Library como base (la descarga Mikel). Pixabay Music con cuidado (tiene reclamos de Content ID de terceros). Epidemic Sound cuando el canal monetice.

## Nombre: BAJO SOSPECHA (elegido por Mikel, 2 de noviembre de 2026)
- No se encontró ningún canal ni podcast de true crime con ese nombre. Sí existe la serie de Antena 3 "Bajo sospecha" (2015–2016): al buscar el nombre aparecerá primero la serie. Revisar si el nombre de usuario @bajosospecha está libre en YouTube.
- Seis conceptos de logo en `marca/` (logos.html + shot.js; fuentes de @fontsource en node_modules): 01 Pasional, 02 Expediente, 03 Cerradura, 04 Huella, 05 Censura, 06 Vigilancia.
