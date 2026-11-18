# Panel de gestión + catálogo para perfumería

App web instalable en el celular (PWA). No necesita servidor ni base de datos para funcionar.

**Diseño:** el panel usa el tema "Índigo", con tipografía Plus Jakarta Sans, violeta índigo como color principal y superficies limpias. Tiene modo claro, oscuro o automático (Ajustes → Apariencia). El catálogo público (`catalogo.html`) usa el mismo diseño y se pone en modo oscuro solo cuando el celular del cliente está en modo oscuro.

## Qué incluye

| Módulo | Funciones |
|---|---|
| **Balance** | Ventas, gastos y balance por día, 7 días, mes, año o todo. Ganancia bruta (ventas − costo), ticket promedio, lo que te deben y lo que debés. Gráfico de ventas contra gastos. Avisos de stock bajo. |
| **Ventas** | Se eligen productos del inventario o se hace una venta libre. Lleva cantidades, descuento, cliente, medio de pago y fecha. Puede quedar pagada o fiada, con pago inicial. Descuenta el stock solo. |
| **Gastos** | Categorías (mercadería, insumos, envíos, publicidad…), proveedor, pagado o adeudado. Una compra de mercadería puede **sumar stock**. |
| **Recibos** | Comprobante numerado. Se envía por WhatsApp o se imprime (formato ticket de 80 mm). |
| **Inventario** | Productos con foto, categoría, familia olfativa (color), notas, precio, costo, margen, stock y stock mínimo. Muestra el valor del inventario a costo y a precio de venta. Exporta a CSV. |
| **Deudas** | Lo que te deben y lo que debés, agrupado por contacto. Registro de abonos y recordatorio por WhatsApp con el monto. |
| **Contactos** | Clientes y proveedores, con historial y saldo de cada uno. |
| **Reportes** | Productos más vendidos (con ganancia), ventas por medio de pago, mejores clientes y gastos por categoría. Exporta ventas y gastos a CSV (Excel o Google Sheets). |
| **Catálogo** (`catalogo.html`) | Tienda pública con el estilo de la web de Fluir. Filtra por categoría, tiene buscador y marca los productos agotados. Arma el pedido y lo **manda por WhatsApp** al negocio. |
| **Ajustes** | Nombre, frase, WhatsApp, moneda (USD, ARS, COP, MXN, PYG…), mensaje de los recibos, PIN de acceso, respaldo y restauración de datos. |

## Cómo usarla

1. Publicar la carpeta `gestion/` en cualquier hosting estático gratis (Netlify, Vercel, GitHub Pages o Cloudflare Pages).
2. El dueño abre `index.html` en el celular y elige **"Agregar a pantalla de inicio"**. Queda instalada como una app y funciona sin internet.
3. En **Ajustes**: poner el nombre del negocio y el WhatsApp. Después **"Borrar todos los datos"** para sacar los datos de ejemplo.
4. Para que los clientes vean el catálogo: **Ajustes → Generar archivo del catálogo**, y subir ese `catalogo.json` a la misma carpeta publicada. El enlace para compartir es `.../catalogo.html`.

## Limitaciones de esta versión (importante)

- **Los datos viven en un solo dispositivo** (el almacenamiento del navegador). Si se borran los datos del navegador o se pierde el celular, se pierde la información. Hay que **descargar un respaldo** seguido (Ajustes → Respaldo).
- **El catálogo no se actualiza solo.** Cada vez que cambian precios o stock hay que generar y subir de nuevo `catalogo.json`.
- **No hace factura electrónica legal** (DIAN, SAT, AFIP/ARCA, SET…). Para eso hace falta integrarse con un proveedor autorizado de cada país.
- El PIN evita que alguien mire el panel por casualidad. No es una protección fuerte.

**Siguiente paso recomendado:** conectar la capa de datos (`js/store.js`) a una base en la nube, por ejemplo Supabase, que tiene un plan gratis. Con eso se suman inicio de sesión real, uso desde varios dispositivos y un catálogo que se actualiza al instante. Toda la app lee y escribe solamente a través de `store.js`, así que el cambio queda aislado ahí.
