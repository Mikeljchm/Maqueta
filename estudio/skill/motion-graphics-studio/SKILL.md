---
name: "motion-graphics-studio"
description: "Úsala cuando Mikel pida videos de motion graphics, logos animados, lyric videos, comerciales, intros, animaciones, escenas 3D en Blender o videos para su canal de YouTube de true crime: prepara el estudio (HyperFrames, Blender, Whisper, voz, fuentes) y sigue su flujo de trabajo."
---

# Estudio de motion graphics de Mikel (Scenika Studio)

Mikel trabaja desde el teléfono y dirige; Claude produce en la computadora en la nube. Cada conversación nueva arranca con una máquina vacía (lo instalado se pierde al cerrar). Avisa en una línea que preparas el estudio y hazlo sin pedir permiso: Mikel ya lo autorizó. Instala solo lo que el pedido necesite.

**Antes de instalar, revisa qué ya existe** (a veces el entorno trae un script de arranque):
`cat /tmp/estudio-setup.log; which blender hyperframes; ls /opt/motion-kit/node_modules`

## 1. Instalar el estudio

```bash
# HyperFrames (HTML/GSAP -> MP4). Versión fija; Node 22+ y FFmpeg ya vienen.
npx -y hyperframes@0.8.227 init <proyecto> -e blank --non-interactive --skip-skills
export HYPERFRAMES_BROWSER_PATH=/usr/bin/google-chrome
# Librerías y fuentes locales (si no existe /opt/motion-kit):
npm install gsap three @fontsource/<familia> @lottiefiles/dotlottie-web@0.81.0 lottie-web
# Copia a assets/lib y assets/fonts. Nunca dependas de un CDN en la composición.

# Voz local (Kokoro). Única voz española: ef_dora (acento de España, no latino)
pip install --break-system-packages kokoro-onnx soundfile
npx hyperframes tts "texto" -v ef_dora -l es -s 1.0 -o assets/audio/voz.wav

# Transcripción palabra por palabra (para lyric videos y narración)
pip install --break-system-packages faster-whisper   # stable-ts NO compila aquí

# Blender: si no hay /usr/local/bin/blender (5.2 oficial), usa apt (4.0)
apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y blender
```

Herramientas opcionales probadas o recomendadas (instalar solo si hacen falta):
- `librosa`: tempo y golpes finos. `demucs`: separa la voz de la música (sincronía casi perfecta en lyric videos; pide PyTorch CPU).
- `rembg`: quita fondos. Depth Anything (Hugging Face): profundidad para fotos 2.5D.
- Real-ESRGAN (subir resolución) y RIFE (cuadros intermedios): renderizar Blender pequeño y a pocos fps, y luego escalar e interpolar.
- HDRIs y texturas de Poly Haven (`api.polyhaven.com` responde): realismo en Blender.

## 1b. Material visual: imágenes y videos libres (comprobado el 2 de noviembre de 2026)

**Regla de oro de Mikel: NUNCA material con marca de agua.** Se ve barato. Si una fuente solo da la versión con marca, se descarta.

Imágenes:
- **Canva IA (el conector de Canva de Mikel)**: `mcp__Canva__generate-image` (prompt en español, `aspectRatio` LANDSCAPE_16_9 o PORTRAIT_9_16) y luego `get-generate-image-job` hasta SUCCESS. Calidad alta, pero gasta los créditos de IA de su Canva y aquí solo llega una miniatura (≈200 px). Para el video: Mikel la baja de Canva y la manda, o se usa dentro de un diseño de Canva. Siempre incluye el enlace "Open generated image". Ideal para objetos y ambientes simbólicos (rosa marchita, anillo, carta, cuarto vacío).
- **Wikimedia Commons**: API `commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=...`. Exige cabecera `User-Agent` propia (sin ella da 429). Revisa la licencia de cada archivo y da crédito al autor. Sirve para lugares reales, juzgados y contexto de época.
- Generador local SD-Turbo (Hugging Face): posible, 20–60 s por imagen en CPU, calidad media. Solo para fondos y texturas.

Videos (sin marca de agua):
- **Mixkit** (licencia gratuita, sin registro): busca en `https://mixkit.co/free-stock-video/<tema>/` y saca los enlaces `https://assets.mixkit.co/videos/<id>/<id>-720.mp4` del HTML. El 720p baja desde aquí; el 1080p da 403 (Mikel puede bajarlo desde el navegador). Probado: lluvia, 48 s, limpio.
- **Pixabay (PRINCIPAL, probado)**: clave en la variable de entorno `PIXABAY_API_KEY` (nunca la escribas en el repo). Videos: `https://pixabay.com/api/videos/?key=$PIXABAY_API_KEY&q=...&per_page=20&safesearch=true` devuelve `videos.large/medium/small/tiny` (hasta 3840x2160). Fotos: `https://pixabay.com/api/?key=...&q=...&image_type=photo` (`largeImageURL` ≈1280 px). Las descargas necesitan `User-Agent` (sin él da 403). Sin marca de agua, uso comercial libre. Ojo: hay contenido hecho con IA (estilo anime o demasiado perfecto); escoge material real para true crime.
- **Pexels**: Mikel no pudo sacar la clave (dice que las APIs están "pasadas"). Pixabay basta.
- **Internet Archive** (`archive.org/advancedsearch.php?...&output=json`): metraje antiguo (noticieros de los años 40–60, películas caseras). Muchos son de dominio público, pero **verifica la licencia de cada uno**. Bueno para atmósfera vintage en true crime.
- **Coverr**: responde, gratis.
- Calidad mínima: 1080p para planos principales. El 720p sirve para fondos desenfocados, texturas o superposiciones (o escálalo con Real-ESRGAN).
- **yt-dlp** (`pip install yt-dlp`, `--js-runtimes node`): lee la información de YouTube, pero la descarga da 403 desde la nube. Para referencias, Mikel baja el video y lo manda. Solo como referencia de estilo, nunca como material del video.

## 2. Red y máquina (comprobado el 2 de noviembre de 2026)

- La red está más abierta que antes: responden npm, pip, apt, git (GitHub), **Hugging Face**, `api.polyhaven.com`, `download.pytorch.org` y sitios web normales. Las páginas de *releases* de GitHub dan 403. Antes de depender de un servicio, compruébalo con `curl -s -o /dev/null -w '%{http_code}'`.
- 4 CPU, sin GPU. Unos 22 GB libres de disco.
- **Los procesos lanzados con `&` dentro de un comando mueren al terminar ese comando** (`render_cancelled_parent_exited`). Para renders largos usa la opción de segundo plano de la herramienta, nunca `&`.
- Hora: Mikel está en Caracas (`TZ=America/Caracas date`).

## 3. Trampas de HyperFrames (resueltas)

- Ocultar y mostrar en el tiempo: **no uses `tl.set(el, {visibility})`**, porque el render en frío lo ignora. Usa opacidad con `tl.fromTo(el, {opacity:0}, {opacity:1, duration:0.02, immediateRender:false}, t)`.
- Varias `fromTo` sobre la misma propiedad (estática, flashes): ponles `immediateRender:false`, o se quedan pegadas en el estado inicial (pantalla gris).
- Un contenedor al que le animas `transform` debe tener `position:absolute; inset:0`; si no, sus hijos absolutos miden 0 de alto y desaparecen.
- No animes `filter: brightness()` en contenedores grandes (se queda pegado). Usa una capa blanca con opacidad.
- `letterSpacing` animado da error de lint: usa `scaleX`. Las curvas `rough` y otras de EasePack no vienen en `gsap.min.js`.
- Dibujo en canvas (visualizadores): `tl.to(obj, {t:DUR, duration:DUR, ease:"none", onUpdate:()=>draw(tl.time())}, 0)`. Funciona y es determinista.
- DOM creado por JS a partir de datos (letras, celdas) funciona bien. Nada de `Math.random` sin semilla.
- Velocidad de render (1080x1920, 30 fps): composición ligera ~10 cuadros/s; pesada (144 textos con degradado `background-clip`) ~3 cuadros/s. Canción de 4 min = 15–40 min.
- Antes de renderizar: `npx hyperframes lint`, `check --json` y `snapshot --at ...` (mira la hoja de contactos). Después: duración con ffprobe, cuadros del MP4 final y volumen con volumedetect. Di que el audio fue **medido, no escuchado**.

## 4. Blender (5.2 oficial en `/usr/local/bin`)

- Ejecuta siempre así: `env -i PATH=/usr/local/bin:/usr/bin:/bin HOME=/root blender -b --factory-startup --python script.py -- args`
- En la 5.2 **sí funciona el denoiser** (`cycles.use_denoising=True`, OpenImageDenoise) y **sí funciona Mantaflow** (agua, humo, fuego).
- Mantaflow: haz el *bake* (`bpy.ops.fluid.bake_all()`), **guarda el .blend** (`wm.save_as_mainfile`) y renderiza abriendo ese .blend (`blender -b archivo.blend --python render.py`). Si recreas la escena en otro script, no carga la caché y sale el dominio como un cubo. Resolución 150 con 77 cuadros: ~3 min de bake y ~540 MB de caché.
- Física de cuerpos rígidos: un objeto animado (kinematic) **no conserva la velocidad** al soltarlo. Para darle impulso, usa una rampa fuera de cuadro. Si el objeto es kinematic todo el tiempo, empuja con masa infinita y lanza todo fuera de cuadro.
- Texto 3D legible: `text_add`, `convert(target='MESH')`, rotar X 90°, `transform_apply`, `origin_set(BOUNDS)` y colocarlo sobre el piso con `dimensions.z/2`.
- Tiempos (CPU, 540x960 escalado después a 1080x1920 con `ffmpeg -vf scale=1080:1920:flags=lanczos`): objetos opacos con 16 muestras ~10 s/cuadro; agua transparente con 48 muestras ~25 s/cuadro. Planos estrella de 3 a 5 s, en segundo plano.
- Colores: con AgX los tonos se lavan; usa colores muy saturados o el look "Very High Contrast".

## 5. Lyric videos (proceso probado)

1. Convierte a mp3 y a wav mono de 16 kHz. Pásale a faster-whisper **un arreglo de numpy** leído con soundfile (abrir el mp3 directo falla por la versión de `av`).
2. Transcribe con `small.en` y `medium.en`, en trozos de 30 s, con la letra como `initial_prompt` y `word_timestamps=True`. Los tramos que se pierdan, retranscríbelos aparte (ventanas de 6–12 s).
3. Cruza con la letra **por secciones** (coro, verso, puente), cada una en su ventana de tiempo, con `difflib.SequenceMatcher`. El cruce global falla con coros repetidos. Promedia los dos modelos cuando coinciden (±0.3 s) y calcula por interpolación las palabras sin coincidencia.
4. Coros muy repetitivos (tipo "gimme gimme more"): Whisper inventa ("Thanks for watching!"). Pégalos a una cuadrícula de compases con `npx hyperframes beats`, pero el error se acumula: mejor separar la voz con Demucs.
5. Revisa si la canción tiene partes que no están en la letra que mandó Mikel (pasó con un coro extra).
6. Primero propón 3–4 conceptos sacados **de lo que dice la letra** y recomienda uno. Estilos ya hechos: galaxia índigo/rojo/cielo; "La diva en tu TV" (cada sección es un canal: noticiero, deportes, concurso, cielo, neón); "La fiesta que se derrite" (arco de rosa a tormenta azul); "Más y más" (muro de palabras que se duplica).
7. Texto: frase completa tenue (16 %) y cada palabra se enciende al cantarse. Así se disimula cualquier desfase y la frase no se corre de lado.
8. Las canciones con derechos **no se suben al repo** (se publicaría la música). Solo se guardan el código y la sincronización. Para TikTok: video sin audio y el sonido se agrega desde la biblioteca de la app (cuenta personal, no de empresa).

## 6. Otras recetas que funcionaron

- Visualizador audio-reactivo: FFT de numpy por cuadro (48 bandas log, sube rápido y baja lento), golpes por *onset* de bajos, y dibujo en canvas: orbe, anillo de barras, ondas y partículas en cada golpe.
- Personaje que habla: el RMS de la voz por cuadro abre la boca (alto y ancho de una elipse). Agrega parpadeos, respiración, aplastar y estirar, anticipación antes del salto, y globo con frases repartidas por las pausas (`silencedetect`).
- Capturar una web: `hyperframes capture` más Playwright propio para quitar popups (buscar el texto del popup y borrar su ancestro).
- Música sin derechos generada con numpy (bombo, caja, hats, bajo, acordes, subidas y golpes en los cortes) cuando no hay pista.

## 7. Flujo por capas

1. Imágenes y clips realistas: los hace Mikel en Flow o Kling (ZIP con nombres numerados).
2. Planos 3D estrella: Blender + Cycles. 3. Movimiento, textos, montaje: HyperFrames + GSAP.
4. Música y efectos: los manda Mikel (Pixabay) o se generan. Sincroniza con `npx hyperframes beats`.
5. Voz: la de Mikel (ElevenReader) o Kokoro ef_dora. Con narración, **la voz es el reloj** (Whisper o silencedetect). Baja la música bajo la voz.

## 8. Canal de YouTube de true crime (crímenes de pareja; nombre por decidir)

- Producir por **capítulos de ~5 min** (renderizar por separado y unir con ffmpeg), pero **publicar el episodio completo** (20–40 min). De cada episodio, 2–3 Shorts.
- Antes del primer episodio: construir el **kit del canal** (intro, tarjeta de capítulo, cartelera de evidencias con hilo rojo, línea de tiempo, mapa, rótulos, "Las notas de Vera", pantalla final). Luego un piloto de 8–10 min.
- Visuales: 70 % atmosférico y barato (zoom lento, mapas, documentos, línea de tiempo, clips de Mikel) y 30 % momentos de motion graphics.
- Estilo ya probado: vino y rojo carmesí, serif cursiva más sans, corazón de neón que se parte, Polaroids, sellos, notas rojas firmadas "— V.".
- Reglas: nada de morbo gráfico. Datos de fuentes públicas o judiciales; "presuntamente" si el caso no está cerrado. Mikel verifica los datos. YouTube desmonetiza el contenido en serie sin aporte propio: la voz y la opinión de Mikel son la clave.

### Fotos reales de los casos (Mikel decidió usarlas, 2 de noviembre de 2026)
Buscar con WebSearch/WebFetch en artículos, archivos y registros públicos, descargar y montar en el video, **en este orden de preferencia**:
1. **Libres o de dominio público**: Wikimedia Commons, obras de gobiernos (las del gobierno federal de EE. UU. son de dominio público), documentos judiciales públicos y fichas policiales publicadas oficialmente. Comprueba la licencia de cada una.
2. **Fotos de prensa (con derechos)**: solo como **uso justo con comentario**, nunca como relleno decorativo. Reglas:
   - Que ilustren algo concreto que Mikel está narrando o analizando, no fondos largos.
   - **Transformarlas**: recorte, tamaño menor que la pantalla, dentro del estilo del canal (Polaroid, cartelera de evidencias, marco, anotaciones de Vera) y en pantalla pocos segundos.
   - Crédito visible pequeño ("Foto: AP / Los Angeles Times") y fuente en la descripción.
   - **Evita las agencias que reclaman más agresivamente** (Getty, AP, Reuters, fotos con su logo o marca) cuando haya alternativa.
3. **Nunca**: fotos del cuerpo de las víctimas, de escenas del crimen con sangre, ni de menores. Nunca material con marca de agua.
- Por cada episodio, guarda **`fuentes.csv`** (archivo, URL, dueño, licencia, minuto donde se usa). Sirve para la descripción y para defenderse si llega un reclamo.
- Recuérdale a Mikel una sola vez por episodio que las fotos de prensa pueden traer reclamos de derechos (3 avisos = canal eliminado). La decisión es suya.

## 9. Guardar y entregar

- Los MP4 se envían con SendUserFile. Los archivos de trabajo (código, sincronización, scripts; **sin música con derechos**) se guardan en `estudio/<proyecto>/` del repo Maqueta, en la rama de trabajo, con un README.
- Explica escena por escena, sencillo y con estilo caraqueño. Termina con fecha y hora de Caracas.

## 10. Límites que hay que decirle claro

- No animar logos ni marcas de terceros sin permiso (UNTD Kicks: el dueño lo autorizó como prueba). No usar la imagen de artistas reales: solo tipografía y gráficos.
- Personajes complejos (dedos, ropa con pliegues, estilo Pixar) no quedan bien con código: propón estilo plano.
- Los renders casi no gastan el límite (los hace la máquina). Lo que gasta son las rondas de "prueba, mira, corrige" y las conversaciones muy largas: pide toda la información y las correcciones juntas.
