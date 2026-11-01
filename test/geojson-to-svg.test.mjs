import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { geojsonToSvg, slug, makeProjection } from "../tools/geojson-to-svg.mjs";

const TOOL = join(dirname(fileURLToPath(import.meta.url)), "..", "tools", "geojson-to-svg.mjs");

const feature = (name, coordinates, type = "Polygon", extra = {}) => ({
  type: "Feature",
  properties: { name, ...extra },
  geometry: { type, coordinates },
});
const fc = (...features) => ({ type: "FeatureCollection", features });

// Dos áreas que comparten un borde ondulado (muchos puntos en zigzag chiquito).
function neighbours() {
  const border = [];
  for (let i = 0; i <= 40; i++) border.push([0, i * 0.025 * (1 + (i % 3) * 0.01)].map((v, k) => (k === 0 ? (i % 2) * 0.0004 : v)));
  const top = border[border.length - 1][1];
  const west = [[-1, 0], ...border, [-1, top], [-1, 0]];
  const east = [[1, 0], [1, top], ...border.slice().reverse(), [1, 0]];
  return fc(feature("Oeste", [west]), feature("Este", [east]));
}

function paths(svg) {
  const out = {};
  for (const m of svg.matchAll(/<path id="[^"]*-geo-([^"]+)" d="([^"]+)"/g)) out[m[1]] = m[2];
  return out;
}
const points = (d) => new Set(d.replace(/[MZ]/g, " ").replace(/L/g, " ").trim().split(/\s+/));

test("slug quita acentos y caracteres raros", () => {
  assert.equal(slug("Núñez"), "nunez");
  assert.equal(slug("  Villa Gral. Mitre "), "villa-gral-mitre");
  assert.equal(slug("São Paulo / SP"), "sao-paulo-sp");
});

test("mercator invierte y (norte arriba) y respeta el orden este-oeste", () => {
  const p = makeProjection("mercator");
  const [x1, y1] = p([-58, -34]);
  const [x2, y2] = p([-57, -35]);
  assert.ok(x2 > x1);
  assert.ok(y2 > y1, "más al sur => y mayor");
});

test("genera una estructura con capas, gradientes, filtros y script", () => {
  const svg = geojsonToSvg(neighbours(), { mapId: "test" });
  assert.match(svg, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(svg, /<\?xml-stylesheet type="text\/css" href="area-map.css"\?>/);
  assert.match(svg, /class="area-map" data-am-map="test"/);
  for (const id of ["am-grad-selected", "am-grad-hover", "am-shadow-area", "am-shadow-hover", "am-shadow-label"]) {
    assert.match(svg, new RegExp(`id="${id}"`));
  }
  for (const cls of ["am-area", "am-selected", "am-label", "am-hit", "am-hover", "am-hit-label", "am-target"]) {
    const body = svg.slice(0, svg.indexOf("<script")); // el JS menciona clases en comentarios
    assert.equal(body.split(`class="${cls}"`).length - 1, 2, cls);
  }
  assert.match(svg, /<script type="text\/javascript"><!\[CDATA\[/);
  const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "ids únicos");
});

test("los bordes compartidos quedan idénticos al simplificar", () => {
  const svg = geojsonToSvg(neighbours(), { width: 400, simplify: 2 });
  const { oeste, este } = paths(svg);
  const shared = [...points(oeste)].filter((p) => points(este).has(p));
  // Los extremos del borde común están en las dos áreas...
  assert.ok(shared.length >= 2);
  // ...y cada punto interior del borde del oeste (x cercano al centro) también
  // está en el del este: no hay huecos ni superposiciones.
  const middle = (d) => [...points(d)].filter((p) => Math.abs(Number(p.split(",")[0]) - 200) < 5);
  assert.deepEqual(middle(oeste).sort(), middle(este).sort());
  // y efectivamente simplificó
  const raw = paths(geojsonToSvg(neighbours(), { width: 400, simplify: 0 }));
  assert.ok(points(oeste).size < points(raw.oeste).size);
});

test("escapa nombres y desambigua ids repetidos", () => {
  const sq = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
  const sq2 = [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]];
  const svg = geojsonToSvg(fc(feature("A & <B>", sq), feature("A & B", sq2)));
  assert.match(svg, />A &amp; &lt;B&gt;<\/text>/);
  assert.match(svg, /aria-label="A &amp; &lt;B&gt;"/);
  assert.match(svg, /data-area="a-b"/);
  assert.match(svg, /data-area="a-b-2"/);
});

test("MultiPolygon, agujeros, Feature suelta y Geometry suelta", () => {
  const hole = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]], [[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]]];
  const multi = [hole, [[[5, 0], [6, 0], [6, 1], [5, 1], [5, 0]]]];
  const svg = geojsonToSvg(feature("Isla", multi, "MultiPolygon"));
  assert.equal((paths(svg).isla.match(/M/g) || []).length, 3);
  const geom = geojsonToSvg({ type: "Polygon", coordinates: hole });
  assert.match(geom, /aria-label="Área 1"/);
});

test("detecta la propiedad del nombre y respeta --name-prop / --id-prop", () => {
  const sq = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
  const f = { type: "Feature", properties: { nombre: "Córdoba", iso: "AR-X" }, geometry: { type: "Polygon", coordinates: sq } };
  assert.match(geojsonToSvg(f), /aria-label="Córdoba"/);
  assert.match(geojsonToSvg(f, { idProp: "iso" }), /data-area="ar-x"/);
  assert.throws(() => geojsonToSvg(f, { nameProp: "falta" }), /no tiene la propiedad "falta"/);
});

test("--bbox y --min-island descartan polígonos", () => {
  const big = [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]];
  const tiny = [[[20, 0], [20.01, 0], [20.01, 0.01], [20, 0.01], [20, 0]]];
  const far = [[[100, 50], [101, 50], [101, 51], [100, 51], [100, 50]]];
  const geo = feature("País", [big, tiny, far], "MultiPolygon");
  const svg = geojsonToSvg(geo, { bbox: [-1, -1, 30, 30], minIsland: 4 });
  assert.equal((paths(svg).pais.match(/M/g) || []).length, 1);
});

test("--single marca el modo de selección", () => {
  const sq = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
  assert.match(geojsonToSvg(feature("A", sq), { single: true }), /data-am-mode="single"/);
});

test("errores claros con entradas inválidas", () => {
  assert.throws(() => geojsonToSvg({}), /no es GeoJSON/);
  assert.throws(() => geojsonToSvg(fc(feature("L", [[0, 0], [1, 1]], "LineString"))), /no tiene polígonos/);
  assert.throws(() => geojsonToSvg(neighbours(), { projection: "x" }), /Proyección desconocida/);
});

test("la línea de comandos escribe el SVG", () => {
  const dir = mkdtempSync(join(tmpdir(), "am-"));
  const input = join(dir, "zonas.geojson");
  const output = join(dir, "zonas.svg");
  writeFileSync(input, JSON.stringify(neighbours()));
  execFileSync(process.execPath, [TOOL, input, "-o", output, "--title", "Zonas", "--no-script", "--css", "x.css"]);
  const svg = readFileSync(output, "utf8");
  assert.match(svg, /data-am-map="zonas"/);
  assert.match(svg, /<title id="zonas-title">Zonas<\/title>/);
  assert.match(svg, /href="x.css"/);
  assert.doesNotMatch(svg, /<script/);
});

test("--merge une áreas y --rename cambia nombres", () => {
  const a = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
  const b = [[[3, 0], [4, 0], [4, 1], [3, 1], [3, 0]]];
  const svg = geojsonToSvg(fc(feature("Argentina", a), feature("Falkland Is.", b)), {
    merge: { "falkland-is": "argentina" },
    rename: { argentina: "República Argentina" },
  });
  assert.doesNotMatch(svg, /falkland/);
  assert.equal((paths(svg).argentina.match(/M/g) || []).length, 2);
  assert.match(svg, /aria-label="República Argentina"/);
  assert.throws(() => geojsonToSvg(fc(feature("A", a)), { merge: { x: "a" } }), /no existe el área "x"/);
});
