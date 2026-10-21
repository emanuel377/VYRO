# Informe de pruebas — 2026-10-21

## Resultados ejecutados

| Prueba | Resultado | Evidencia |
| --- | --- | --- |
| Sintaxis del servidor y frontend | Aprobada | `node --check server/index.mjs`, `node --check public/app.js` |
| Servidor y base de datos | 4/4 aprobadas | `node --test tests/server.test.mjs`: rutas, origen/validación, persistencia/versiones/retirada/admin, archivos privados y tamaño de solicitudes |
| Navegador Playwright con Chrome local | 12/12 grupos aprobados | `node tests/browser.mjs`: agencia, hero animado, cotización, cuatro demos, galería y ampliación, rutas internas, legal, accesibilidad básica, almacenamiento y responsive |
| Desbordamiento horizontal | Sin hallazgos | Cinco portadas y ficha destacada a 320, 390, 768, 1024 y 1440 px; doce fichas, checkout y cuatro páginas legales a 390 px |
| Capturas | 21 archivos en `qa/` | Portadas a 390 y 1440 px, ficha antes/después, editorial y hero animado a dos anchos, captura CLI y vista previa |
| Playwright CLI | Ejecutado | `qa/agencia-cli-1440.png`; comparación con captura API de 1440 px: mismas dimensiones y diferencia media RGB 0 |

Las pruebas del formulario usan `qa@example.test` y un nombre de prueba en bases temporales. No se enviaron correos, reservas, pedidos ni pagos. La interacción manual previa confirmó menús, filtros, FAQ, selección de servicio, carrito, checkout de muestra y estados iniciales de las dos casillas.

## Revisión visual

Se compararon las capturas de portada con las seis imágenes proporcionadas por el usuario. NOVA conserva jerarquía tipográfica amplia, fondo oscuro y acento violeta, con una escultura original y contenido propio. BRASA usa fotografía culinaria dominante y serif cálida; BLACK CROWN usa carbón, oro y servicio editorial; SONRISA usa luz, azul y lectura clara; NORTHLINE usa composición de moda minimalista con catálogo. No se buscó coincidencia exacta ni se reutilizaron imágenes de las referencias.

Las dos referencias de ropa posteriores y tres enlaces únicos de Pinterest se usaron para ajustar la presentación de NORTHLINE. Se compararon capturas anteriores y posteriores de su ficha a 390 y 1440 px. La nueva galería, la ampliación y los acordeones se probaron de forma interactiva. Las capturas automáticas cargan las imágenes diferidas antes de guardarse.

Para el hero de NOVA se revisaron `qa/hero-glass-1440.png`, `qa/hero-glass-hover-1440.png` y `qa/hero-glass-390.png`. La prueba de navegador confirmó el seguimiento del cursor en escritorio, una lente pequeña en móvil y la presentación estática con movimiento reducido.

## Límites de la verificación

- La comprobación de accesibilidad automatizada cubre encabezado principal único, texto alternativo, nombres de botones, etiquetas de campos, errores de JavaScript y almacenamiento inicial. **No equivale** a una auditoría WCAG completa, revisión con lector de pantalla ni prueba de contraste de cada estado.
- Los ensayos se realizaron en Chrome local y servidor de desarrollo. Faltan Safari, Firefox, dispositivos físicos, pruebas de carga, despliegue final y proveedores externos.
- El entorno no instaló dependencias desde el registro (`EACCES`). Se utilizó el paquete Playwright ya incluido en Codex y Chrome local; la aplicación no depende de ese paquete para funcionar.
- No se realizaron análisis de penetración ni verificación jurídica definitiva.
