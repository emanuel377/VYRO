# NOVA WEB STUDIO

Sitio local de agencia web en Costa Rica con cuatro demostraciones interactivas. **No está publicado ni aprobado para producción.** El nombre comercial es provisional y los documentos legales son borradores.

## Ejecutar

Requiere Node.js 24 o posterior, que incluye `node:sqlite`. No requiere instalar paquetes.

```powershell
cd C:\Users\Usuario\Documents\Codex\2026-10-21\modo-de-ejecuci-n-aut-noma-15\outputs\nova-web-studio
node server/index.mjs
```

Abrí `http://127.0.0.1:4173/`. Para otro puerto, establecé `PORT` en el entorno antes de ejecutar. `NOVA_DATA_DIR` permite elegir el directorio de la base SQLite. La ruta `data/` se crea automáticamente y está excluida de Git. En un futuro despliegue, `NOVA_PUBLIC_ORIGIN` debe contener el origen HTTPS exacto para validar solicitudes y marcar la cookie administrativa como `Secure`.

## Configuración

- Nombre, WhatsApp y correo: `server/config.mjs`. Cambiarlos allí actualiza las páginas y enlaces de contacto.
- Textos legales: `public/legal.json`. Al iniciar, el servidor registra una copia inmutable por tipo y versión junto con su hash SHA-256. **Aumentá la versión** si cambiás un documento publicado.
- Demos y productos: `public/app.js`. Estilos: `public/styles.css`. Imágenes: `public/assets/`.
- Para añadir un proyecto al portafolio, agregá su ficha al arreglo `demos` en `public/app.js`, su ruta y su componente/página; incorporá una imagen propia con derechos documentados y una prueba de la nueva ruta.
- Base de datos: SQLite local, tablas `LegalDocument`, `ContactRequest`, `ConsentEvent` y `AuditEvent`.

## Administración

La ruta `/admin` está deshabilitada hasta que se establezcan `NOVA_ADMIN_USER`, `NOVA_ADMIN_PASSWORD_HASH` y `NOVA_SESSION_SECRET`. Generá un hash y secreto con `node server/create-admin-hash.mjs` y guardalos en variables de entorno privadas; **no los agregués al repositorio**. La sesión expira a los 30 minutos. Para producción faltan revisión de despliegue, HTTPS, copias de seguridad y políticas operativas.

La exportación de evidencia en `/api/admin/export` solo responde a una sesión administrativa válida. Las solicitudes y consentimientos no tienen ruta pública de lectura.

## Pruebas

```powershell
node --check server/index.mjs
node --check public/app.js
node --test tests/*.test.mjs
node tests/browser.mjs
```

Las pruebas usan datos ficticios y una base aislada. Las de navegador requieren Chrome local y la copia de Playwright incluida en este entorno; en otro equipo se puede indicar su módulo con `NOVA_PLAYWRIGHT_MODULE` y el navegador con `NOVA_CHROME`. El informe y las capturas están en `docs/TEST_REPORT.md` y `qa/`. También se ejecutó Playwright CLI desde el paquete incluido.

## Publicación futura

Elegir alojamiento con HTTPS y copias de seguridad; completar identidad legal, domicilio, proveedores, conservación y revisión jurídica; revisar recursos visuales para uso comercial; cambiar `robots.txt` y generar el sitemap desde `docs/sitemap.template.xml` con el dominio aprobado; obtener autorización expresa del propietario para publicar. Consultá `docs/LAUNCH_CHECKLIST.md`.

Para un despliegue posterior autorizado: usar Node 24 y un directorio persistente privado para `NOVA_DATA_DIR`; configurar `NOVA_PUBLIC_ORIGIN=https://dominio-aprobado`, secretos administrativos fuera del código y un proxy HTTPS; iniciar `node server/index.mjs` como servicio, verificar el origen y la cookie `Secure`, programar copias cifradas y probar su restauración. Actualizar información legal y SEO antes de permitir indexación. Estos pasos **no se ejecutaron** en el entorno local.
