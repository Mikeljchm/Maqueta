# Bajo Sospecha: animaciones de logo (2 de noviembre de 2026)

HyperFrames 0.8.227, 1920x1080, 30 fps, 10 s cada una.

- **pasional/**: un electrocardiograma late tres veces, "SOSPECHA" nace de la línea, "Bajo" se escribe con una punta de luz, golpe y brasas. Remate: último latido, la línea queda plana y la marca pierde el color.
- **cerradura/**: estamos detrás de una puerta; la luz de una TV parpadea por la cerradura y una sombra cruza. La cámara se aleja: la cerradura era la O de SOSPECHA. BAJO entra con cuatro clics de cerradura. Remate: la cámara entra en la cerradura, un ojo nos mira y se apaga todo con el golpe del cerrojo.

Para renderizar, copia a `assets/`: gsap.min.js, las fuentes (Playfair Display 700 italic, Inter Tight 300/500, DM Serif Display) y `eye.png` (foto de Pixabay 3805227, de AlexanderGrey, teñida y con los bordes difuminados). El sonido se arma con `mixer.py` a partir de efectos de Mixkit (licencia gratuita de Mixkit). Los archivos de audio no se suben al repo; los ids y tiempos están en este README:
- pasional: 2749, 1177 (ambiente), 490 ×3 y 498 (latidos), pitidos sintéticos a 980 Hz, 790 (riser), 1143 + 559 (golpe a 4.4 s), 677, y línea plana de 8.75 a 9.6 s.
- cerradura: 2749, 1177, 786, 2623 (sombra), 2842 (llave), 1143 + 559 (golpe a 3.65 s), 2858 ×4 (clics), 677, 790, 498 y 187 (cerrojo a 9.1 s).
