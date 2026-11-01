#!/usr/bin/env node
/**
 * Regenera los SVG de examples/ y la página de demo examples/index.html.
 *   node tools/build-examples.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { geojsonToSvg } from "./geojson-to-svg.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EX = join(ROOT, "examples");

const MAPS = [
  {
    mapId: "caba-barrios",
    input: "data/caba-barrios.geojson",
    nameProp: "nombre",
    title: "Barrios de la Ciudad de Buenos Aires",
    desc: "Fuente: Buenos Aires Data (GCBA), dataset Barrios.",
  },
  {
    mapId: "argentina-provincias",
    input: "data/argentina-provincias.geojson",
    nameProp: "nombre",
    title: "Provincias de Argentina",
    desc: "Fuente: Georef AR / Instituto Geográfico Nacional. Sin el sector antártico.",
    width: 500,
    bbox: [-75, -56, -53, -21],
    minIsland: 4,
    rename: {
      "ciudad-autonoma-de-buenos-aires": "CABA",
      "tierra-del-fuego-antartida-e-islas-del-atlantico-sur": "Tierra del Fuego",
    },
  },
  {
    mapId: "sudamerica-paises",
    input: "data/sudamerica-paises.geojson",
    title: "Países de América del Sur",
    desc: "Fuente: Natural Earth (dominio público).",
    width: 600,
    bbox: [-82, -56, -34, 13],
    minIsland: 4,
    single: true,
    // Natural Earth trae las Malvinas como área aparte: se unen a Argentina.
    merge: { "falkland-is": "argentina" },
    rename: {
      brazil: "Brasil", peru: "Perú", suriname: "Surinam",
      // De Francia solo queda la Guayana Francesa, por el --bbox.
      france: "Guayana Francesa",
    },
  },
];

const svgs = {};
for (const m of MAPS) {
  const geojson = JSON.parse(readFileSync(join(EX, m.input), "utf8"));
  const svg = geojsonToSvg(geojson, { ...m, css: "../src/area-map.css" });
  writeFileSync(join(EX, `${m.mapId}.svg`), svg);
  // Versión para pegar dentro del HTML: sin prólogo XML (el CSS lo enlaza la página).
  svgs[m.mapId] = svg.replace(/^<\?xml[^>]*\?>\n/gm, "");
  console.log(`examples/${m.mapId}.svg  ${(svg.length / 1024).toFixed(0)} KB`);
}

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>area-map: ejemplos</title>
<link rel="stylesheet" href="../src/area-map.css">
<style>
  body { font-family: sans-serif; margin: 16px; color: #222; background: #fff; }
  section { margin-bottom: 48px; }
  .row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
  .row > .map { flex: 1 1 420px; max-width: 800px; }
  .row > .side { flex: 0 1 260px; }
  .checks label { display: block; font-size: 14px; }
  object { width: 100%; max-width: 500px; height: auto; aspect-ratio: 500 / 900; border: 0; }
  code { background: #f2f2f2; padding: 1px 4px; }
</style>
</head>
<body>
<h1>area-map</h1>
<p>Mapas generados con <code>tools/geojson-to-svg.mjs</code>. Todos usan el mismo
<code>src/area-map.css</code>.</p>

<section>
  <h2>1. SVG inline + checkboxes sincronizados</h2>
  <div class="row">
    <div class="map">
${svgs["caba-barrios"]}
    </div>
    <form class="side checks" id="barrios"></form>
  </div>
</section>

<section>
  <h2>2. SVG con &lt;object&gt; (se comunica por postMessage)</h2>
  <div class="row">
    <div class="map"><object id="provincias" type="image/svg+xml" data="argentina-provincias.svg">Provincias de Argentina</object></div>
    <div class="side">
      <p>Seleccionadas: <span id="provincias-out">ninguna</span></p>
      <button type="button" id="provincias-clear">Limpiar</button>
    </div>
  </div>
</section>

<section>
  <h2>3. Selección única (generado con <code>--single</code>)</h2>
  <div class="row">
    <div class="map">
${svgs["sudamerica-paises"]}
    </div>
    <p class="side">País: <strong id="pais">ninguno</strong></p>
  </div>
</section>

<script>
(function () {
  // 1. Checkboxes <-> mapa inline
  var map = document.querySelector('svg[data-am-map="caba-barrios"]');
  var form = document.getElementById("barrios");
  var areas = map.areaMap.areas().sort(function (a, b) { return a.name.localeCompare(b.name, "es"); });
  areas.forEach(function (a) {
    var label = document.createElement("label");
    var box = document.createElement("input");
    box.type = "checkbox";
    box.name = "barrio";
    box.value = a.id;
    box.addEventListener("change", function () { map.areaMap.select(a.id, box.checked); });
    label.appendChild(box);
    label.appendChild(document.createTextNode(" " + a.name));
    form.appendChild(label);
  });
  map.addEventListener("areachange", function (e) {
    form.querySelector('input[value="' + e.detail.id + '"]').checked = e.detail.selected;
  });

  // 2. <object>: mensajes del SVG
  var obj = document.getElementById("provincias");
  var out = document.getElementById("provincias-out");
  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "area-map:change" || e.data.map !== "argentina-provincias") return;
    out.textContent = e.data.selection.length ? e.data.selection.join(", ") : "ninguna";
  });
  document.getElementById("provincias-clear").addEventListener("click", function () {
    obj.contentWindow.postMessage({ type: "area-map:select", map: "argentina-provincias", ids: [] }, "*");
    out.textContent = "ninguna";
  });

  // 3. Selección única
  var paises = document.querySelector('svg[data-am-map="sudamerica-paises"]');
  paises.addEventListener("areachange", function (e) {
    document.getElementById("pais").textContent = e.detail.selected ? e.detail.name : "ninguno";
  });
})();
</script>
</body>
</html>
`;
writeFileSync(join(EX, "index.html"), html);
console.log("examples/index.html");
