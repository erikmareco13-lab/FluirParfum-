# FLUIR PARFUM — Identidad visual "Marea Nocturna"

Concepto: **el perfume como algo líquido, que fluye**. La paleta va de la profundidad del agua de noche (azul noche → petróleo) a una bruma clara (blanco hueso → lavanda). El borgoña aparece como el pulso, el acento de acción.

**Regla de marca:** sin dorado, champagne, brillos metálicos, negro puro (#000) ni blanco puro (#FFF).

## Paleta

| Rol | Color | HEX | Uso |
|---|---|---|---|
| Marca | Azul petróleo | `#1E4A52` | Botones primarios, degradado firma, eyebrows |
| Tinta | Azul noche | `#141B2B` | Texto principal, secciones oscuras, footer |
| Fondo | Blanco hueso | `#F1ECE3` | Fondo base de toda la web |
| Acción / acento | Borgoña | `#6B2333` | Hover de botones, palabras en cursiva, badges |
| Emoción | Lavanda apagada | `#A99CBC` / `#D6CEE0` | Brumas, tarjetas destacadas, detalles sobre oscuro |
| Soporte | Gris grafito | `#3A3F47` | Texto secundario, tapas de frascos |
| Soporte | Gris perla | `#CBCDD0` | Bordes y separadores |
| Puntual | Verde oliva oscuro | `#4E5538` | Solo para la familia "Verdes" |

Proporción aproximada: 60% hueso/bruma · 25% noche/petróleo · 10% lavanda · 5% borgoña.

## Degradados firma
- **Marea**: noche → petróleo → petróleo claro (hero, ritual).
- **Bruma**: hueso → lavanda (fondos claros, newsletter).
- **Vino**: borgoña → azul noche (piezas editoriales).

## Color por familia olfativa
Cada familia tiene su propio tono, así un producto se reconoce de un vistazo:
Acuáticas: petróleo · Amaderadas: grafito · Orientales: borgoña · Florales: lavanda · Verdes: oliva · Nocturnas: azul noche.

## Tipografía
- **Fraunces** (serif display, peso 300, cursiva en borgoña o lavanda): títulos y frases editoriales.
- **Manrope** (sans): textos, botones y etiquetas en mayúsculas con tracking amplio.

## Recursos gráficos
- Textura de grano sutil sobre toda la página y los paneles de color.
- Formas "blob" desenfocadas que se mueven lentamente (el fluir).
- Vidrio esmerilado (glassmorphism) en etiquetas, badges y pasos.
- Arco como forma recurrente (hero) y frascos ilustrados en CSS con líquido animado.
- Logo del footer en contorno a gran escala.

## Movimiento
Easing `cubic-bezier(.22,.8,.2,1)`. Las secciones aparecen al hacer scroll, los botones hacen un barrido borgoña al pasar el cursor y la marquesina es continua. Se respeta `prefers-reduced-motion`.
