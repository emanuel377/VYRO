# Progreso

## 2026-10-21 — implementación local

- El proyecto comenzó sin código existente. `goal` no estaba instalada; se registró el objetivo con la herramienta disponible.
- Se usaron las skills locales Sites, frontend-design e imagegen. Image to Code requería una única referencia seleccionada para reproducción fiel; las seis capturas se trataron como inspiración de un sistema original. Taste Skill, Awesome Design MD y Web Design Guidelines no estaban instaladas como skills locales; se consultaron sus fuentes públicas. Tres enlaces de Pinterest no fueron accesibles, por lo que se usaron las capturas suministradas.
- El registro de paquetes devolvió `EACCES`. La preferencia por Next.js/React/TypeScript se sustituyó por HTML/CSS/JS sin dependencias y Node 24 con SQLite incorporado. Playwright sí estaba incluido en el entorno de Codex y se ejecutó junto con Chrome local, incluida una captura mediante su CLI.
- Se generaron siete imágenes originales base, convertidas en 29 JPG optimizados. No se copiaron capturas ni archivos de Pinterest. Origen y alcance de derechos en `docs/ASSET_LICENSES.md`.
- Agencia terminada: portada, servicios, cuatro demos, proceso, soluciones, estudio, FAQ, contacto, WhatsApp y enlaces legales. BRASA, BLACK CROWN, SONRISA y NORTHLINE tienen identidades y funciones distintas.
- Solicitud de cotización con validación en navegador y servidor; autorización de privacidad necesaria y lectura de términos opcional, con casillas independientes. SQLite guarda solicitud, evento UTC, finalidad, versión/hash documental y retirada por código. Administración protegida y deshabilitada sin secretos externos.
- Cuatro borradores legales versionados. Se investigaron Ley 8968, Ley 7472, reforma de comercio electrónico y fuentes PRODHAB/Hacienda; el informe `docs/LEGAL_COMPLIANCE.md` marca límites y decisiones pendientes.
- Inventario de cookies y almacenamiento terminado. El carrito ficticio usa `localStorage` por interacción del usuario; no se activó analítica, publicidad ni cookies opcionales de seguimiento.
- Pruebas de servidor: 4/4. Pruebas Playwright: 9/9 grupos. Sin desbordamiento horizontal en cinco portadas a 320, 390, 768, 1024 y 1440 px. Se guardaron diez capturas y una captura CLI. Se corrigió el desbordamiento de la cabecera de servicios de barbería y se endureció el servidor para rutas inválidas.
- Documentación entregada: instalación, diseño, fuentes/derechos, privacidad, consentimientos, seguridad, pruebas y lanzamiento. No se publicaron cambios ni se efectuaron gastos.

## Bloqueos externos y límites

- La revisión jurídica final y la identidad legal requieren información y decisión del titular.
- No se configuró proveedor de correo, alojamiento ni pagos. La cotización queda en SQLite local y WhatsApp abre un enlace que el visitante decide usar.
- Faltan auditoría WCAG completa, pruebas en navegadores/dispositivos reales y evaluación de infraestructura de producción.
- No hay dominio autorizado; `robots.txt` impide indexación y el sitemap permanece como plantilla.

## 2026-10-21 — refinamiento visual solicitado

- Se revisaron los tres enlaces únicos nuevos de Pinterest en el navegador; el cuarto era un duplicado. Mostraban una composición de producto naranja, una portada de café y una portada de cosmética. También se analizaron las dos nuevas capturas de ropa. Se tomaron jerarquía, protagonismo del producto y claridad de opciones como principios, sin reproducir diseños ni copiar recursos.
- NORTHLINE ahora incluye una sección editorial propia y una ficha con vistas frontal, posterior y de detalle, miniaturas, ampliación, información en acordeones y cuatro productos relacionados. Se generó una nueva imagen de tres vistas a partir del abrigo conceptual existente; se publicaron tres recortes optimizados.
- Se comprobó la ficha a 320, 390, 768, 1024 y 1440 px; las doce fichas, checkout y cuatro rutas legales a 390 px; y las cinco portadas a cinco anchos. No se encontró desbordamiento horizontal. Las pruebas de navegador terminaron 11/11 grupos y las del servidor 4/4.
- Se guardaron capturas de antes/después de la ficha y recortes del nuevo bloque editorial para comparación visual. Las capturas automáticas cargan las imágenes diferidas antes de tomarse.

## 2026-10-21 — hero animado

- Se adaptó la idea de vidrio fluido al hero de NOVA con una lente translúcida propia, brillo animado y desplazamiento suave de la escultura existente. En escritorio la lente sigue el cursor dentro de la ilustración; en móvil conserva una animación pequeña sin seguimiento táctil.
- Se usaron CSS y JavaScript del proyecto, sin añadir paquetes ni una escena WebGL. La preferencia de movimiento reducido oculta la lente y detiene la animación.
- Se compararon capturas del hero a 1440 y 390 px. Playwright comprobó seguimiento, estado móvil y movimiento reducido; las pruebas de navegador terminaron 12/12 grupos, sin desbordamiento horizontal en las rutas y tamaños ya cubiertos.
