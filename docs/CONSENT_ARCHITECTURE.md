# Arquitectura de consentimiento

- `LegalDocument`: copia JSON inmutable por tipo y versión, fecha prevista y SHA-256. Una actualización requiere nueva versión; la fila anterior se conserva.
- `ContactRequest`: datos mínimos de cotización y estado. Incluye hash SHA-256 de un código de retirada entregado solo al solicitante.
- `ConsentEvent`: evento añadido con UTC del servidor, finalidad, estado, versión y hash del documento, texto de la casilla, formulario, ruta y método. Privacidad se exige; reconocimiento de términos es independiente y opcional porque pedir cotización no crea contrato.
- `AuditEvent`: creación, inicio de sesión, exportación y retirada.
- `POST /api/consent/withdraw`: valida ID/código, añade evento `retirado` y marca solicitud para revisión; no borra automáticamente evidencias.
- `GET /api/admin/export`: exportación JSON de evidencia solo tras autenticación. Nunca se entrega por rutas públicas.

La aplicación no ofrece marketing; si se añade, debe tener casilla opcional propia, finalidad y evento separados. Falta una política formal de retención, gestión de derechos y respaldo antes de uso real. El código de retirada se muestra una vez al enviar; la pérdida del código puede resolverse por correo con verificación proporcional de identidad.
