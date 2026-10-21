# Tratamiento de datos previsto

| Flujo | Datos | Finalidad | Destino | Conservación |
| --- | --- | --- | --- | --- |
| Cotización | Nombre, correo **o** WhatsApp, tipo y descripción; negocio/presupuesto opcionales | Responder la solicitud | SQLite local; panel autenticado si se configura | Pendiente de fijar antes de publicación |
| Evidencia de autorización | ID interno, UTC, propósito, versión y hash documental, texto aceptado, ruta y método | Demostrar acción afirmativa y retirada | SQLite local, exportación administrativa | Pendiente de valoración jurídica |
| Demo restaurante/barbería/clínica | Fecha/hora/servicio de muestra | Simular interacción en navegador | No se envía ni guarda | Solo durante la sesión visual |
| Demo tienda | ID de producto, talla, color y cantidad ficticios | Mantener carrito de ejemplo | localStorage del navegador | Hasta vaciar o borrar almacenamiento |

No se solicita información sensible, documento de identidad, dirección ni tarjeta. El servidor no registra IP completa en la base; conserva direcciones de conexión solo en memoria para limitar frecuencia temporalmente. Logs de infraestructura futura deben auditarse aparte. No hay venta, distribución o difusión de la base de cotizaciones. Identidad del responsable, proveedores, transferencias, procedimiento de derechos y plazos de borrado son pendientes de lanzamiento.
