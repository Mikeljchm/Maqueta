# Siluetas por rotoscopia (demo)
1. Video de Pixabay con personas reales (pareja discutiendo, id 50311; puerta, id 203363).
2. `ffmpeg -vf fps=30 fr/%04d.png` y luego rembg `u2net_human_seg` con `only_mask=True` por cuadro (~0.9 s/cuadro en CPU; el modelo baja de las releases de GitHub).
3. `comp.py`: mediana temporal de 3 máscaras (quita el parpadeo), cámara que sigue el centro de la pareja (promedio de 31 cuadros), contraluz rojo que parpadea, persianas, luz de policía, niebla delante y detrás, lluvia, borde de luz (máscara menos erosión, desenfocada), viñeta, grano y empuje de cámara.
4. Intro con la puerta teñida de rojo (`colorchannelmixer`), unida con `xfade fadeblack`.
