# Sistema visual — NOVA WEB STUDIO

## Dirección

Una agencia nueva debe demostrar criterio a través de producto real, sin cifras, logotipos de clientes ni testimonios inventados. La portada contrasta tipografía amplia y superficies oscuras con una sola escultura digital original. El portafolio muestra cuatro lenguajes visuales propios que se pueden visitar e interactuar.

| Sitio | Base | Acento | Tipografía y composición |
| --- | --- | --- | --- |
| Agencia | `#080b17`, `#11172a` | `#7d63ff`, `#4f91ff` | sans geométrica, hero de dos columnas, amplitud y líneas finas |
| BRASA | `#12100e`, `#f3eadc` | `#b98157` | serif editorial, fotografía culinaria, ritmo asimétrico |
| BLACK CROWN | `#0c0c0b`, `#24211c` | `#c5a16a` | sans condensada, contraste fuerte, módulos horizontales |
| SONRISA | `#f6fbff`, `#102b4a` | `#2e9db2` | sans amable, espacios amplios, información clara |
| NORTHLINE | `#f6f4f0`, `#1a1917` | `#8c857a` | serif editorial y sans discreta, catálogo con aire |

## Reglas

- Escala de espacios: 4, 8, 12, 16, 24, 32, 48, 64, 96 px; contenedor máximo 1240 px.
- Tipografía del sistema sin descargas externas: Arial/Helvetica para interfaces; Georgia en enfoques editoriales.
- Foco visible de al menos 2 px; mínimo 16 px de texto corrido; botones de al menos 44 px de alto.
- Movimiento limitado a cambios de opacidad y transformación, con alternativa `prefers-reduced-motion`.
- Fotografía original generada para este proyecto. Los ejemplos se declaran ficticios. Los recursos deben revisarse antes de uso comercial público.
- Ninguna captura de Pinterest se utiliza como archivo del sitio. Se toman principios de jerarquía, composición y contraste sin clonar las pantallas.

## Refinamiento de NORTHLINE

Las referencias adicionales mostraban tres maneras de dar protagonismo a un producto: un abrigo sobre color saturado, una ficha con fotos y opciones claras, y una portada cosmética de producto central. También se revisó una portada de café con tipografía dominante. NORTHLINE conserva su identidad marfil, piedra y negro: un bloque editorial de texto serif y fotografía propia, seguido de una ficha de tres columnas en escritorio y una secuencia vertical en móvil. Las miniaturas pasan debajo de la foto principal en pantallas estrechas; talla, color y botón mantienen objetivos táctiles amplios.

No se copiaron composiciones completas, imágenes, nombres ni textos de las referencias. Los enlaces revisados fueron [producto naranja](https://www.pinterest.com/pin/1093671090781192414/), [café](https://www.pinterest.com/pin/1114922451537812186/) y [cosmética](https://www.pinterest.com/pin/463800461647405738/).

## Movimiento en la portada NOVA

La escultura de vidrio conserva la composición original. Una lente circular con reflejos y desenfoque ligero añade profundidad sin tapar el titular ni los botones. La imagen flota lentamente; en escritorio la lente y la imagen responden al cursor con desplazamientos limitados. En móvil la lente es más pequeña y no persigue el tacto. Si el sistema solicita reducir movimiento, se presenta la imagen estática. El efecto está hecho con CSS y eventos de puntero; no introduce dependencias ni una escena 3D.

## Referencias consultadas

Las capturas aportadas muestran: un hero de agencia oscuro con forma 3D y tarjetas; otra agencia tipográfica con acento violeta; restaurante nocturno con serif y fotografía dominante; barbería carbón y dorado; clínica con azul y bloques informativos; moda editorial con catálogo limpio. Las páginas de Pinterest no son fuente de imágenes del producto.

Awesome Design MD se consultó como estructura para registrar tokens, reglas y componentes: https://github.com/VoltAgent/awesome-design-md. Taste Skill y Web Design Guidelines no estaban instaladas localmente; se revisaron sus fuentes públicas sin ejecutar sus scripts. La revisión de las [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) llevó a añadir dimensiones a imágenes, carga prioritaria para las portadas, etiquetas y nombres accesibles, foco visible y pruebas de desbordamiento a cinco tamaños.
