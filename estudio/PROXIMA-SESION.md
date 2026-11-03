# Traspaso: Bajo Sospecha (actualizado el 3 de noviembre de 2026)

## Estado
- Canal: **BAJO SOSPECHA**. Logo oficial: **Cerradura** (la O de SOSPECHA es una cerradura con luz roja). Eslogan: "TODOS LO ESTÁN". Paleta: vino, carmesí y crema. Fuentes: DM Serif Display, Inter Tight, Special Elite, IBM Plex Mono, Permanent Marker y Playfair Display (logo Pasional).
- **Tema musical aprobado**: `estudio/true-crime-plantilla/marca/tema/tema.py` (re menor, 64 BPM, re–fa–mi–do sostenido). No va sobre la intro.
- Voz: ElevenReader a velocidad 1.0 (Mikel graba el audio interno del teléfono y lo manda junto con el texto). Antes de monetizar pasará a ElevenLabs de pago con la misma voz.
- Guion e investigación: el otro chat de Mikel. **Aquí solo se produce.** Los guiones del caso Haeger dicen "Relaciones Peligrosas": hay que cambiarlo a Bajo Sospecha antes de grabar.
- Reglas, flujo y criterios: `estudio/true-crime-plantilla/MANUAL-PRODUCCION.md` y `DECISIONES.md`.

## Kit (todo en `estudio/true-crime-plantilla/modulos/`, ver su README)
Parte 1: intro Cerradura (`marca/animaciones/cerradura`), electro Pasional, tablero de corcho, glitch (`glitch.py`), tarjeta de capítulo, ficha de persona, última señal, mapa OSM, registro de llamadas, cita, contadores, corte de la casa, foto 2.5D (`depth25d.py`), documento UV, comentario del narrador y pantalla final.
Parte 2: línea de tiempo, cuatro análisis forenses, veredicto, dos versiones, cadena, bolsas de evidencia, recreación con siluetas (Pixabay 279615 y 88883 con chroma key) y televisor de la cárcel.
La mezcla de audio va en una sola pista por episodio (`mixer.py`, efectos de Mixkit; ids en los README). Los efectos no se suben al repo.

## Página para ver los avances
https://claude.ai/artifact/7ARwCxGduPhpEbcoMyxe4v (privada; publicar el mismo archivo para actualizarla; máximo unos 15 MB por video). Google Drive está conectado en la cuenta, pero no cargó en la sesión anterior: probarlo primero para entregar episodios completos.

## Próximo paso: producir el episodio de Viviana Haeger
1. Mikel manda el audio de ElevenReader (parte 1 y parte 2) con el texto corregido.
2. Transcribir con Whisper (tiempos por palabra) → escaleta (`episodios/01-viviana-haeger/escaleta.md`) → `planos.json`.
3. **Hoja de planos** para que Mikel apruebe antes de renderizar.
4. Fotos reales con crédito → `fuentes.csv`. Nada de las hijas (pidieron privacidad), del cuerpo ni de personas privadas (solo íconos o siluetas). Confirmar quién aparece en cada foto antes de usarla.
5. Render por capítulos → mezcla única → unión → entrega.

## Pendientes para el chat de guiones
- Cambiar el nombre del canal en los dos guiones.
- Hora exacta de la llamada a Emy Guzmán (el guion dice "justo después" de las 09:36).
- "Tres análisis forenses" en el arranque frente a las cuatro conclusiones de la parte 2.
- Fuente de las fotos de la casa (para el crédito).

## Técnicas que funcionaron
- Módulos con datos: `template.tpl` + `build.py datos.json` → index.html. Nunca dos HTML raíz en el mismo proyecto.
- Python 3.13: no usar `-(x)**2` en JS dentro del template; usar `Math.pow`.
- Renders largos en segundo plano. Para la página, comprimir a ~2,5–3 Mbps si pasa de 15 MB.
- Para usar menos cupo: trabajar en tandas de 3 módulos con una sola revisión de miniaturas.
