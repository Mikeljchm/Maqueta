# Siluetas por rotoscopia (demo)
1. Video de Pixabay con personas reales (pareja discutiendo, id 50311; puerta, id 203363).
2. `ffmpeg -vf fps=30 fr/%04d.png` y luego rembg `u2net_human_seg` con `only_mask=True` por cuadro (~0.9 s/cuadro en CPU; el modelo baja de las releases de GitHub).
3. `comp.py`: mediana temporal de 3 máscaras (quita el parpadeo), cámara que sigue el centro de la pareja (promedio de 31 cuadros), contraluz rojo que parpadea, persianas, luz de policía, niebla delante y detrás, lluvia, borde de luz (máscara menos erosión, desenfocada), viñeta, grano y empuje de cámara.
4. Intro con la puerta teñida de rojo (`colorchannelmixer`), unida con `xfade fadeblack`.

## Versión PRO (RVM): mejor que rembg
- Modelo **Robust Video Matting** en ONNX (`rvm_resnet50_fp32.onnx`, de las releases de GitHub de PeterL1n/RobustVideoMatting), ejecutado con onnxruntime. **No ejecutes el código Python del repo** (el sistema de seguridad lo bloquea); el ONNX basta.
- Entradas: `src` (1,3,H,W en 0–1), `r1i`..`r4i` (empiezan en ceros [1,1,1,1] y se pasan de cuadro a cuadro: es la memoria) y `downsample_ratio`=0.4 para 720p. ~0.34 s/cuadro en CPU.
- Limpieza: mediana de 3 cuadros, quitar componentes < 0.4 % del cuadro, `binary_closing` + `binary_fill_holes`, y borde suave conservado (smoothstep de 0.25 a 0.75). Saltos bruscos de área: de 19 a 11; sin falsos positivos en la baranda.
- `comp3.py`: el mismo compositor que lee `mk3/`.
