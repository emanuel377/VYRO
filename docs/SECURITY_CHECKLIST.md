# Seguridad: controles y pendientes

| Control | Estado |
| --- | --- |
| Validación de servidor, tamaño máximo de 20 KB, tipos y campos mínimos | Implementado y probado |
| Protección frente a inyección SQL | Consultas preparadas de SQLite |
| Prevención de XSS en registros administrativos | Escape HTML antes de insertar texto de solicitudes |
| CSP, `nosniff`, `frame-ancestors`, `referrer-policy`, permisos deshabilitados | Implementado; validado visualmente después de mover fondos al CSS |
| Solicitudes de escritura desde el mismo origen y `application/json` | Implementado y probado; revisar proxy/HTTPS en producción |
| Límite de frecuencia en memoria | Implementado; para múltiples instancias se necesita almacén compartido |
| Administración sin credenciales fijas | Deshabilitada sin variables de entorno; hash scrypt, secreto de sesión, cookie HttpOnly y SameSite Strict |
| HTTPS | Pendiente de alojamiento de producción |
| Atributo Secure de cookie administrativa | Se añade cuando `NOVA_PUBLIC_ORIGIN` usa HTTPS; verificarlo en el despliegue final |
| Copias de seguridad cifradas y restauración | Pendiente |
| Política de retención/borrado y respuesta a incidentes | Pendiente |
| Revisión de dependencias | Sin dependencias externas de ejecución; revisar versión de Node antes de publicar |

**Bloqueo de lanzamiento:** la base local y los secretos necesitan alojamiento, permisos, respaldo, HTTPS y revisión técnica antes de recibir datos reales.
