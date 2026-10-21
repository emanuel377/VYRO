# Inventario de cookies y almacenamiento

Auditoría de código local: 2026-10-21. Repetir con herramientas de navegador y alojamiento final antes del lanzamiento.

| Tecnología | Proveedor | Finalidad | Duración | Categoría | Origen | Necesaria | Consentimiento |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `nova_demo_cart_v1` (localStorage) | Propio | Conservar temporalmente el carrito **ficticio** entre páginas de NORTHLINE | Hasta que el navegador lo borre o se vacíe la bolsa | Funcional de la demo | Propia | Para persistencia de esa demo | Revisar si se incorpora a sitio público y jurisdicciones de destino; no se usa para seguimiento. |
| `nova_session` (cookie, solo si se habilita administración) | Propio | Sesión administrativa protegida | Máximo 30 minutos | Necesaria para acceso restringido | Propia | Sí para el panel | No se ofrece como opcional; evaluar en despliegue. |

No se instalaron herramientas de analítica, marketing, mapas, chat, videos embebidos ni fuentes externas. No hay banner de cookies porque **no existe una categoría opcional de seguimiento activa**. Rechazar cookies opcionales no debe bloquear el sitio si se agregan posteriormente. WhatsApp es un enlace externo que se abre solo por acción del visitante.

Fuente jurídica para revisar el deber de información y consentimiento sobre datos personales: [Ley 8968, art. 5](https://formatos.inamu.go.cr/SIDOC/DOCS/ley_8968.pdf). La conclusión específica sobre tecnologías de almacenamiento requiere revisión profesional al decidir despliegue y jurisdicciones.
