# area-map

Generador de mapas SVG para seleccionar zonas geográficas: barrios, comunas,
provincias, países, o cualquier región que se pueda describir con polígonos.

- **Entrada estándar**: GeoJSON ([RFC 7946](https://datatracker.ietf.org/doc/html/rfc7946)),
  el formato en que publican sus datos casi todos los portales de datos abiertos
  y herramientas GIS (QGIS, Natural Earth, OpenStreetMap, IGN, etc.).
- **Salida**: un único `.svg` autocontenido. Trae la geometría, la lógica de
  selección (JS embebido, ES5) y accesibilidad (teclado y lectores de pantalla).
- **Estilos aparte**: un solo `src/area-map.css` sirve para todos los mapas
  generados. Se puede modificar sin tocar los SVG.

Ejemplos: [`examples/index.html`](examples/index.html). La versión original en
canvas, de 2013, quedó en [`old/`](old/)
([demo](https://carlos-illobre.github.io/area-picker/old/)).

## Uso

Requiere Node.js 18 o superior. No tiene dependencias.

```bash
node tools/geojson-to-svg.mjs barrios.geojson -o barrios.svg --title "Barrios"
```

Copiá `src/area-map.css` al lado del SVG, o indicá su ruta con `--css`.

### Opciones

| Opción | Qué hace |
|---|---|
| `-o, --output <archivo>` | SVG de salida (por defecto, stdout) |
| `--name-prop <prop>` | propiedad con el nombre visible. Si falta, se prueba `name`, `nombre`, `NAME`, `NOMBRE`, `NAME_ES`, `ADMIN`... |
| `--id-prop <prop>` | propiedad para el id de cada área (se convierte en slug). Por defecto, el slug del nombre |
| `--label-prop <prop>` | propiedad con la posición del nombre, `[lon, lat]` o `{lon, lat}`. Por defecto se calcula sola |
| `--map-id <id>` | id del mapa. Prefija los ids internos para poder poner varios mapas en una misma página. Por defecto, el nombre del archivo |
| `--title`, `--desc` | título accesible y descripción o atribución |
| `--width <px>` | ancho (800). El alto se calcula para mantener la proporción |
| `--padding <px>` | margen interno (20), deja lugar a las sombras |
| `--projection` | `mercator` (por defecto), `equirectangular` o `identity` (datos ya proyectados) |
| `--simplify <px>` | tolerancia de simplificación (0.25; 0 la apaga). Los bordes compartidos se simplifican igual en las dos áreas, así no aparecen huecos |
| `--precision <n>` | decimales de las coordenadas (1) |
| `--min-island <px²>` | descarta islas más chicas que eso (nunca el polígono principal) |
| `--bbox <o,s,e,n>` | descarta polígonos cuyo centro cae fuera del rectángulo, en grados |
| `--merge <origen=destino>` | une un área con otra. Se puede repetir |
| `--rename <id=Nombre>` | cambia el nombre visible de un área (el id no cambia). Se puede repetir |
| `--single` | selección única en vez de múltiple |
| `--css <href>` / `--no-css` | ruta al CSS desde el SVG (`area-map.css`) / sin CSS |
| `--no-script` | no embeber el JS (cargá `src/area-map.js` aparte) |

Ejemplo con datos reales (ver `tools/build-examples.mjs`). Natural Earth trae
las Malvinas como área aparte; acá se unen a Argentina:

```bash
node tools/geojson-to-svg.mjs examples/data/sudamerica-paises.geojson -o paises.svg --bbox -82,-56,-34,13 --min-island 4 --merge falkland-is=argentina --rename brazil=Brasil --single
```

## Cómo usar el SVG en un proyecto

| Forma | CSS | Interacción |
|---|---|---|
| `<svg>` pegado inline en el HTML | `<link rel="stylesheet" href="area-map.css">` en la página | Sí. El mapa comparte el DOM con la página |
| `<object data="mapa.svg">` o `<iframe>` | lo enlaza el propio SVG (`<?xml-stylesheet?>`) | Sí. Se comunica con la página por `postMessage` |
| Abrir el `.svg` directo | lo enlaza el propio SVG | Sí |
| `<img src="mapa.svg">` o `background-image` | no (el navegador no carga recursos externos) | No: imagen estática |

Al pegarlo inline, sacá las primeras líneas (`<?xml ...?>`). Si lo insertás con
`innerHTML` o desde un framework, el navegador no ejecuta el `<script>` de
adentro. En ese caso cargá `src/area-map.js` en la página, que inicializa solo
los `svg.area-map`, o llamá a `AreaMap.init(svg)`.

### API JS

```js
const svg = document.querySelector('svg.area-map');
svg.areaMap.select('palermo');        // o select(id, false)
svg.areaMap.toggle('palermo');
svg.areaMap.clear();
svg.areaMap.selected();               // ['palermo', ...]
svg.areaMap.areas();                  // [{id, name}, ...]

svg.addEventListener('areachange', (e) => {
  // e.detail = {id, name, selected, selection}
});
```

Con `<object>` o `<iframe>`, el SVG envía
`{type: 'area-map:change', map, id, name, selected, selection}` a la página, y
acepta `{type: 'area-map:select', map, ids: [...]}` para fijar la selección.
Con acceso al mismo origen también podés usar
`object.contentDocument.documentElement.areaMap`.

## Estilos

`src/area-map.css` reproduce el diseño original:

- áreas blancas con borde negro y sombra;
- selección con degradado amarillo y borde bordó;
- hover con degradado rojo y sombra desplazada;
- nombres en sans-serif bold 13px, blancos con borde y sombra negros;
- transiciones suaves que se desactivan con `prefers-reduced-motion`.

Para personalizar, redefiní variables o reglas en tu propia hoja:

```css
.area-map {
  --am-selected-start: #9be15d;
  --am-selected-end: #00b09b;
  --am-font-family: Georgia, serif;
}
#mi-mapa .am-area { filter: none; }   /* sin sombras en ese mapa */
```

Todas las variables están documentadas al principio del CSS. Los degradados y
las sombras se definen en el SVG con `<linearGradient>` y `<filter>`, la forma
más compatible. Sus colores salen del CSS, y desde el CSS se pueden reemplazar
(`fill: ...`) o quitar (`filter: none`).

Estructura que genera el SVG, por si querés escribir tus propias reglas:

```
svg.area-map[data-am-map][data-am-mode="single"?]
├── g.am-areas      > use.am-area[data-area]                       base
├── g.am-selection  > use.am-selected[data-area][data-selected]    seleccionadas
├── g.am-labels     > text.am-label[data-area][data-selected]      nombres de las seleccionadas
└── g.am-hits       > g.am-hit[data-area][aria-checked]            mouse / teclado
                      ├── use.am-hover
                      ├── text.am-hit-label
                      └── use.am-target                            zona de click transparente
```

## Compatibilidad

El SVG evita las funciones más nuevas para que ande en la mayor cantidad posible
de navegadores y visores:

- SVG 1.1 con `xlink:href`;
- filtros SVG en lugar de `drop-shadow()` de CSS;
- atributos de presentación como respaldo, así que sin CSS se ve un mapa blanco
  y negro legible;
- valores fijos antes de cada `var()`;
- JS en ES5.

## Limitaciones

- Los polígonos que cruzan el antimeridiano (±180°, por ejemplo Rusia o Fiyi)
  no se cortan; recortalos antes o usá `--bbox`.
- Para evitar que un nombre se salga del mapa, su ancho se estima. Si cambiás
  mucho la fuente en el CSS, un nombre muy cerca del borde puede quedar cortado.
- Varios mapas inline en una misma página comparten los ids de los degradados y
  filtros comunes (`am-grad-*`, `am-shadow-*`). Son idénticos en todos los
  mapas, así que no hay conflicto; la geometría sí lleva el prefijo de cada mapa.

## Desarrollo

```bash
npm test
```

```bash
npm run build:examples
```

`npm test` corre los tests (`node --test`); `npm run build:examples` regenera
`examples/` desde `examples/data/`.

Datos de ejemplo: barrios de CABA (Buenos Aires Data, GCBA), provincias de
Argentina (Georef AR / IGN) y países de América del Sur (Natural Earth, dominio
público).
