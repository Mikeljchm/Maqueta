# Silueta por marioneta articulada (rig por recorte)
- `poseA.jpg` y `poseB.jpg`: siluetas generadas por Mikel en Google Flow (fondo liso, negro puro).
- `rig.py`: corta la silueta en piezas con polígonos en coordenadas de la imagen original y anima por jerarquía.
  - Trabaja al doble de resolución; las regiones usan `S > 0.01` para llevarse el borde suave (si no, quedan contornos fantasma).
  - Cada pieza se dilata 5 px (`dil`) para tapar la unión; el cuerpo de base es `S * (1 - unión)` (sin erosionar).
  - Los contornos escondidos (cadera bajo el brazo, espalda bajo el pelo) se dibujan como polilíneas (`tc`, `tr`, `back`).
  - Piernas de la pose caminando: componentes conectados por debajo de la entrepierna, cortados en muslo y pierna en la rodilla.
  - Pelo: deformación tipo tela con `map_coordinates` (el desplazamiento crece hacia las puntas).
- `render.py`: plano 1 (parada: respira, baja y sube la cabeza, levanta la pistola) + destello con glitch + plano 2 (camina cruzando), con el mismo escenario de la rotoscopia y tacones sincronizados con cada paso.
