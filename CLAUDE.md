# Catálogo de Activos — Ciclo Consultoría

> **Estructura del repositorio (monorepo):** `frontend/` (app React, ver
> `frontend/README.md`), `backend/` (API NestJS + TypeORM + PostgreSQL, ver
> `backend/README.md`), `reference/legacy-prototype.html` (prototipo original
> descrito abajo) y `docker-compose.yml` (PostgreSQL local). En el backend, los
> ítems tienen `type` `ASSET` | `NON_OBJECT` y el "—" del dataset se guarda como `NULL`.

Este documento captura todo el contexto de diseño y funcionalidad del prototipo
`index.html` (HTML/CSS/JS puro, sin build, sin dependencias externas) para
servir de referencia al reimplementar la herramienta como una app React.

El prototipo es un **catálogo de consulta de activos fijos** para inventario:
permite buscar, filtrar y navegar cientos de "especies" de activos (equipos,
maquinaria, muebles, etc.) y ver para cada una qué suplementos/datos hay que
capturar y dónde debe fijarse la placa de inventario. También incluye un
segundo modo de consulta para "bienes no objeto" (ítems que no llevan placa).

Idioma de la interfaz: **español** (`lang="es"`). Todo el copy debe mantenerse
en español al portar a React.

## 1. Datos

El prototipo embebe los datos directamente en el JS como dos constantes
globales. En React estos deberían vivir en un archivo de datos (JSON/TS) o
venir de una API, pero el **shape** debe preservarse.

### 1.1 `ASSETS` (catálogo de activos)

Array de 936 objetos con esta forma exacta:

```ts
interface Asset {
  categoria: string;    // ej. "MAQUINARIA Y EQUIPO"
  especie: string;      // ej. "ABASTONADORA" — nombre del activo
  suplementos: string;  // ej. "MCA/MOD/POTENCIA (PONER LA UNIDAD)/..." — lista de
                         // datos a capturar, separados por "/". Puede ser "—"
  fijacion: string;     // criterio de dónde fijar la placa. Puede ser "—"
}
```

Categorías presentes (20, usadas para el filtro "categoría" y el badge de
cada tarjeta):

```
ACTIVO BIOLOGICO, EDIFICACIONES, EDIFICIOS, EQUIPOS COMUNICACION,
EQUIPOS DE COMPUTO, EQUIPOS DE LABORATORIO, EQUIPOS DIVERSOS, GOODWILL,
INSTALACIONES, INTANGIBLES, MAQUINARIA Y EQUIPO, MUEBLES, MUEBLES Y ENSERES,
PATE.PROP. IND MANT VENT, SIN CATEGORÍA, SOFTWARE, TERRENOS,
UND DE REEMPLAZO, UNIDADES DE TRANSPORTE, VEHICULOS
```

Valores posibles de `fijacion` (7, usados para el filtro "fijación de
placa"):

```
A CERCA DE LA PLACA DEL FABRICANTE
A CERCA DE LA PLACA DEL FABRICANTE O FICTÍCIO
ESTRUCTURA
FICTICIO
FICTICIO/LA PLACA DEL FABRICANTE
SUPERIOR DERECHA
—
```

Las listas de categorías y fijaciones para los `<select>` **no están
hardcodeadas**: se derivan dinámicamente de `ASSETS` (únicas + orden
alfabético `localeCompare` con locale `'es'`). Conservar ese comportamiento
data-driven en React (`useMemo` sobre el dataset).

### 1.2 `NON_OBJECT` (bienes no objeto)

Array simple de 72 strings, ej.:

```
"ALFOMBRA - BIEN NO OBJETO", "ANTORCHA MARCA VICTOR", "ESPECIMETRO", ...
```

Son ítems que no requieren placa de inventario; se muestran en un modo de
consulta separado (pestaña "Bien no objeto"), sin categoría, suplementos ni
fijación asociados — solo el nombre.

## 2. Estructura de la página / layout

De arriba hacia abajo:

1. **Topbar** (header sticky, `top:0`, altura 92px)
   - Logo (imagen embebida en base64 en el prototipo — extraer como asset
     real `logo.jpg`/`.png` en React) + separador vertical + título
     "Catálogo Maestro de Activos" + subtítulo "Consulta visual para
     inventario, clasificación e identificación física".
   - A la derecha, un badge dorado con "Ciclo Consultoría · Parceria de
     Verdade".

2. **Hero** (grid de 2 columnas: contenido principal + panel de stats)
   - **Hero principal**: fondo degradado azul oscuro→azul, texto blanco,
     decoración circular con borde dorado semitransparente (pseudo-elemento
     `::after`). Contiene eyebrow "HERRAMIENTA DE CONSULTA", título
     "Encuentre la especie correcta en segundos." y descripción de uso.
   - **Panel de stats**: grid 2×2 de tarjetas con contadores:
     - Especies de activos (`ASSETS.length`)
     - Categorías (cantidad de categorías únicas)
     - Criterios de fijación (cantidad de fijaciones únicas)
     - Bienes no objeto (`NON_OBJECT.length`)
     - Los números se formatean con `toLocaleString('es-PE')`.

3. **Toolbar** (sticky debajo del header, `top:106px`, fondo blanco,
   sombreado)
   - **Tabs**: "Catálogo de activos" (default activo) / "Bien no objeto" —
     cambian el modo de consulta completo (dataset, filtros visibles,
     acciones de vista).
   - **Filtros de modo "assets"** (grid: buscador ancho + 2 selects +
     botón limpiar):
     - Buscador con ícono de lupa (SVG inline), placeholder "Buscar
       especie, categoría, suplemento o fijación...".
     - Select "Todas las categorías".
     - Select "Toda fijación de placa".
     - Botón "Limpiar filtros".
   - **Filtros de modo "non"** (ocultos por defecto, mismo patrón pero solo
     buscador + botón limpiar): placeholder "Buscar bien no objeto...".
   - **Barra alfabética**: botones "Todos" + A–Z para filtrar por letra
     inicial de la especie (o del nombre del bien no objeto). El botón
     activo se resalta en dorado.

4. **Summary row**: contador de resultados (ej. "**936** especies
   encontradas") a la izquierda + selector de vista (▦ Tarjetas / ☰ Lista)
   a la derecha — este selector solo aplica al modo "assets" y se oculta en
   modo "non".

5. **Resultados** — dos vistas posibles para el modo "assets":
   - **Grid de tarjetas** (`.grid`, 4 columnas en desktop): cada tarjeta
     tiene badge de categoría, nombre de especie (con `<mark>` resaltando
     coincidencias de búsqueda), fila "Suplementos" y fila "Placa" (con
     color dorado oscuro especial `.plate`). Click abre el modal de
     detalle.
   - **Lista** (`.list`): tabla-like con header (Especie / Categoría /
     Suplementos / Fijación de placa) y filas clicables. En mobile
     (`max-width:900px`) se ocultan las columnas 3 y 4.
   - Modo "non": grid de 5 columnas (`.non-grid`) de tarjetas simples con
     borde izquierdo dorado, solo texto (sin click/modal).
   - Estado vacío: mensaje "No se encontraron especies/bienes con los
     filtros/búsqueda seleccionados." (borde punteado).

6. **Paginación**: 28 resultados por página en modo "assets", 40 por
   página en modo "non". Botones ‹ › + números con elipsis (`…`) cuando hay
   muchas páginas (muestra siempre 1, 2, página-1, página, página+1,
   penúltima, última). Al cambiar de página hace scroll suave hasta la
   summary row.

7. **Footer**: "Base integrada desde el catálogo proporcionado por Ciclo
   Consultoría." + "Consulta local · funciona sin conexión a internet".

8. **Modal de detalle** (solo modo "assets"): overlay oscuro, caja blanca
   centrada. Header con degradado azul (categoría en dorado claro + nombre
   grande) y botón cerrar (×). Cuerpo con dos bloques tipo "detail card":
   "Otros suplementos / datos a capturar" y "Fijación de la placa". Cierra
   con click en backdrop, botón × o tecla `Escape`.

## 3. Design tokens (paleta y estilo)

```css
--azul:          #356579
--azul-oscuro:   #244b5c
--azul-profundo: #173945
--oro:           #b89136
--oro-claro:     #d4b76f
--fondo:         #f4f7f8
--blanco:        #ffffff
--texto:         #18303b
--muted:         #6c7c84
--linea:         #dfe7ea
--sombra:        0 12px 30px rgba(28,65,80,.10)
--radius:        16px
```

- Tipografía: `Inter, Segoe UI, Arial, sans-serif`.
- Identidad visual: azul institucional profundo + acentos dorados
  (elegante/corporativo, "consultoría"). Bordes redondeados generosos
  (12–20px), sombras suaves, mucho whitespace.
- Badges de categoría: fondo azul muy claro (`#eaf1f3`), texto azul
  profundo, pill shape, uppercase, letter-spacing.
- Resaltado de búsqueda: `<mark>` con fondo amarillo pálido (`#f4df9a`).
- El "meeting-badge" del header usa tonos dorados (`#f7f1e2` fondo, `#7a5a12`
  texto).

## 4. Breakpoints responsive

- `max-width: 1200px`: grid de tarjetas pasa a 3 columnas, hero a
  `1fr 370px`, non-grid a 4 columnas.
- `max-width: 900px`: topbar sin sticky y compacta (logo más chico, se
  oculta el meeting-badge), toolbar deja de ser sticky, filtros a 2
  columnas, grid de tarjetas a 2 columnas, lista muestra solo 2 columnas
  (oculta categoría/suplementos... en realidad oculta columnas 3 y 4 vía
  `nth-child(n+3)`), non-grid a 2 columnas.

## 5. Lógica funcional (a portar como estado/hooks en React)

Estado global equivalente necesario:

```ts
mode: 'assets' | 'non'        // pestaña activa
view: 'grid' | 'list'         // solo aplica a 'assets'
page: number                  // 1-indexed, se resetea a 1 en cada cambio de filtro
activeLetter: string          // '' = todos, o una letra 'A'..'Z'
search: string                // input de búsqueda (uno por modo, en el prototipo
                               // son inputs separados #search / #searchNon)
category: string               // filtro de categoría (solo assets)
fixation: string                // filtro de fijación (solo assets)
```

Constantes:
- `PAGE_SIZE_ASSETS = 28`
- `PAGE_SIZE_NON = 40`

Reglas clave a preservar:

- **Normalización de texto** para búsqueda/orden/alfabeto: quitar acentos
  (`normalize('NFD')` + strip diacríticos) y pasar a mayúsculas antes de
  comparar. Esto permite que "acondicionador" encuentre "ACONDICIONADOR" y
  que buscar sin tilde encuentre términos con tilde.
- **Filtro combinado de assets**: coincide con TODOS estos a la vez
  (AND): texto de búsqueda (busca en `especie + categoria + suplementos +
  fijacion` concatenados), categoría exacta (si seleccionada), fijación
  exacta (si seleccionada), letra inicial de `especie` (si seleccionada).
- **Filtro de non-object**: texto de búsqueda (contains) + letra inicial,
  sin categoría/fijación (no aplican).
- **Cambiar de pestaña** (`setMode`) resetea `page=1` y `activeLetter=''`,
  y alterna la visibilidad de los bloques de filtros/acciones de vista
  correspondientes.
- **Cambiar cualquier filtro** (search/category/fixation/letra) resetea
  `page=1`.
- **Orden**: los datos originales no están pre-ordenados por especie en el
  array `ASSETS` (el orden de inserción del prototipo es alfabético en la
  práctica, pero no hay un `.sort()` explícito antes de renderizar) — no
  asumir orden garantizado; si se requiere orden alfabético explícito,
  agregarlo.
- **Highlight de coincidencias**: en vista grid, el texto de "especie" (y
  en teoría suplementos/fijación) se envuelve con `<mark>` alrededor de las
  coincidencias exactas (case-insensitive, escapando regex) del término de
  búsqueda actual. Al portar a React, usar un componente `Highlight` que
  divida el string en partes en vez de `dangerouslySetInnerHTML`.
- **Escape de HTML**: el prototipo escapa manualmente `& < > " '` al
  inyectar vía `innerHTML`. En React esto es gratis (JSX escapa por
  defecto) — solo se necesita cuidado si se reintroduce HTML crudo para el
  highlight.
- **Paginación**: recalcular `maxPage` en cada render; si `page > maxPage`
  clampear a `maxPage`. Botones ‹ › + rango de páginas con elipsis cuando
  `maxPage > 7`, mostrando siempre primera, segunda, vecinas de la actual,
  penúltima y última.
- **Modal**: se abre pasando el índice del asset dentro del array
  filtrado/`ASSETS` original (el prototipo usa `ASSETS.indexOf(x)`, mejor
  en React pasar el objeto completo o un id estable). Muestra categoría,
  nombre, suplementos y fijación. Cierra con click en backdrop, botón × o
  `Escape`.
- El modo "non" **no tiene modal ni vista lista/grid** — es una sola
  cuadrícula fija de tarjetas de solo texto.

## 6. Componentes sugeridos para la migración a React

- `Topbar` (logo + título + badge)
- `HeroSection` (mensaje + `StatsPanel`)
- `Toolbar` → `Tabs`, `AssetFilters` (search + 2 selects + clear),
  `NonObjectFilters` (search + clear), `AlphabetNav`
- `ResultsSummary` (contador + `ViewToggle`)
- `AssetGrid` / `AssetList` (con `AssetCard` / `AssetRow` + `Highlight`)
- `NonObjectGrid` (`NonObjectCard`)
- `Pagination`
- `AssetDetailModal`
- `EmptyState`

Estado a nivel de página (o via context/URL query params si se quiere
deep-linking): `mode`, `view`, `page`, `activeLetter`, `search`,
`category`, `fixation`.

## 7. Assets a extraer

- El logo del header está embebido como imagen `data:image/jpeg;base64,...`
  dentro del HTML (línea larga en `index.html`). Extraerlo a un archivo de
  imagen real (`/public/logo.jpg` o similar) para la app React en vez de
  mantenerlo inline.

## 8. Notas de accesibilidad / UX a conservar

- Buscar con `Escape` cierra el modal.
- El botón activo de alfabeto/tab/select de vista debe tener estado visual
  claro (clases `.active`).
- Los `<select>` deben tener opción "Todas las categorías" / "Toda
  fijación de placa" como valor vacío que anula el filtro.
- El botón "Limpiar filtros" resetea búsqueda, categoría, fijación y letra
  activa (y en modo non, solo búsqueda y letra).
