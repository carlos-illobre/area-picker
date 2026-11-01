import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { geojsonToSvg, geojsonToInputs, slug, makeProjection } from "../tools/geojson-to-svg.mjs";

const TOOL = join(dirname(fileURLToPath(import.meta.url)), "..", "tools", "geojson-to-svg.mjs");

const feature = (name, coordinates, type = "Polygon", extra = {}) => ({
  type: "Feature",
  properties: { name, ...extra },
  geometry: { type, coordinates },
});
const fc = (...features) => ({ type: "FeatureCollection", features });

// Two areas sharing a wiggly border (many points in a tiny zigzag).
function neighbours() {
  const border = [];
  for (let i = 0; i <= 40; i++) border.push([0, i * 0.025 * (1 + (i % 3) * 0.01)].map((v, k) => (k === 0 ? (i % 2) * 0.0004 : v)));
  const top = border[border.length - 1][1];
  const west = [[-1, 0], ...border, [-1, top], [-1, 0]];
  const east = [[1, 0], [1, top], ...border.slice().reverse(), [1, 0]];
  return fc(feature("West", [west]), feature("East", [east]));
}

function paths(svg) {
  const out = {};
  for (const m of svg.matchAll(/<path id="[^"]*-geo-([^"]+)" d="([^"]+)"/g)) out[m[1]] = m[2];
  return out;
}
const points = (d) => new Set(d.replace(/[MZ]/g, " ").replace(/L/g, " ").trim().split(/\s+/));

test("slug strips accents and odd characters", () => {
  assert.equal(slug("Núñez"), "nunez");
  assert.equal(slug("  Villa Gral. Mitre "), "villa-gral-mitre");
  assert.equal(slug("São Paulo / SP"), "sao-paulo-sp");
});

test("mercator flips y (north up) and keeps west-east order", () => {
  const p = makeProjection("mercator");
  const [x1, y1] = p([-58, -34]);
  const [x2, y2] = p([-57, -35]);
  assert.ok(x2 > x1);
  assert.ok(y2 > y1, "further south => larger y");
});

test("builds layers, gradients, filters and the script", () => {
  const svg = geojsonToSvg(neighbours(), { mapId: "test" });
  assert.match(svg, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(svg, /<\?xml-stylesheet type="text\/css" href="area-map.css"\?>/);
  assert.match(svg, /class="area-map" data-am-map="test"/);
  for (const id of ["am-grad-selected", "am-grad-hover", "am-shadow-area", "am-shadow-hover", "am-shadow-label"]) {
    assert.match(svg, new RegExp(`id="${id}"`));
  }
  for (const cls of ["am-area", "am-selected", "am-label", "am-hit", "am-hover", "am-hit-label", "am-target"]) {
    const body = svg.slice(0, svg.indexOf("<script")); // the JS mentions class names in comments
    assert.equal(body.split(`class="${cls}"`).length - 1, 2, cls);
  }
  assert.match(svg, /<script type="text\/javascript"><!\[CDATA\[/);
  const ids = [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "unique ids");
});

test("shared borders stay identical after simplification", () => {
  const svg = geojsonToSvg(neighbours(), { width: 400, simplify: 2 });
  const { west, east } = paths(svg);
  const shared = [...points(west)].filter((p) => points(east).has(p));
  // Both ends of the shared border belong to both areas...
  assert.ok(shared.length >= 2);
  // ...and every inner point of the west border (x near the middle) is also
  // in the east one: no gaps, no overlaps.
  const middle = (d) => [...points(d)].filter((p) => Math.abs(Number(p.split(",")[0]) - 200) < 5);
  assert.deepEqual(middle(west).sort(), middle(east).sort());
  // and it did simplify
  const raw = paths(geojsonToSvg(neighbours(), { width: 400, simplify: 0 }));
  assert.ok(points(west).size < points(raw.west).size);
});

test("escapes names and de-duplicates ids", () => {
  const sq = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
  const sq2 = [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]];
  const svg = geojsonToSvg(fc(feature("A & <B>", sq), feature("A & B", sq2)));
  assert.match(svg, />A &amp; &lt;B&gt;<\/text>/);
  assert.match(svg, /aria-label="A &amp; &lt;B&gt;"/);
  assert.match(svg, /data-area="a-b"/);
  assert.match(svg, /data-area="a-b-2"/);
});

test("MultiPolygon, holes, bare Feature and bare Geometry", () => {
  const hole = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]], [[1, 1], [1, 3], [3, 3], [3, 1], [1, 1]]];
  const multi = [hole, [[[5, 0], [6, 0], [6, 1], [5, 1], [5, 0]]]];
  const svg = geojsonToSvg(feature("Island", multi, "MultiPolygon"));
  assert.equal((paths(svg).island.match(/M/g) || []).length, 3);
  const geom = geojsonToSvg({ type: "Polygon", coordinates: hole });
  assert.match(geom, /aria-label="Area 1"/);
});

test("detects the name property and honours --name-prop / --id-prop", () => {
  const sq = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
  const f = { type: "Feature", properties: { nombre: "Córdoba", iso: "AR-X" }, geometry: { type: "Polygon", coordinates: sq } };
  assert.match(geojsonToSvg(f), /aria-label="Córdoba"/);
  assert.match(geojsonToSvg(f, { idProp: "iso" }), /data-area="ar-x"/);
  assert.throws(() => geojsonToSvg(f, { nameProp: "missing" }), /has no "missing" property/);
});

test("--bbox and --min-island drop polygons", () => {
  const big = [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]];
  const tiny = [[[20, 0], [20.01, 0], [20.01, 0.01], [20, 0.01], [20, 0]]];
  const far = [[[100, 50], [101, 50], [101, 51], [100, 51], [100, 50]]];
  const geo = feature("Country", [big, tiny, far], "MultiPolygon");
  const svg = geojsonToSvg(geo, { bbox: [-1, -1, 30, 30], minIsland: 4 });
  assert.equal((paths(svg).country.match(/M/g) || []).length, 1);
});

test("--single sets the selection mode", () => {
  const sq = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
  assert.match(geojsonToSvg(feature("A", sq), { single: true }), /data-am-mode="single"/);
});

test("clear errors for invalid input", () => {
  assert.throws(() => geojsonToSvg({}), /not GeoJSON/);
  assert.throws(() => geojsonToSvg(fc(feature("L", [[0, 0], [1, 1]], "LineString"))), /has no polygons/);
  assert.throws(() => geojsonToSvg(neighbours(), { projection: "x" }), /Unknown projection/);
});

test("the command line writes the SVG and the inputs fragment", () => {
  const dir = mkdtempSync(join(tmpdir(), "am-"));
  const input = join(dir, "zones.geojson");
  const output = join(dir, "zones.svg");
  writeFileSync(input, JSON.stringify(neighbours()));
  execFileSync(process.execPath, [TOOL, input, "-o", output, "--title", "Zones", "--inputs", join(dir, "zones.html"), "--no-script", "--css", "x.css"]);
  const svg = readFileSync(output, "utf8");
  assert.match(svg, /data-am-map="zones"/);
  assert.match(svg, /<title id="zones-title">Zones<\/title>/);
  assert.match(svg, /href="x.css"/);
  assert.doesNotMatch(svg, /<script/);
  const html = readFileSync(join(dir, "zones.html"), "utf8");
  assert.match(html, /<input type="checkbox" name="zones" value="east" data-area-map="zones"> East<\/label>/);
  assert.ok(html.indexOf("East") < html.indexOf("West"), "sorted by name");
});

test("geojsonToInputs uses radio buttons in single mode", () => {
  const html = geojsonToInputs(neighbours(), { mapId: "m", single: true });
  assert.equal((html.match(/type="radio"/g) || []).length, 2);
  assert.match(html, /data-area-map="m"/);
});

test("--merge joins areas and --rename changes names", () => {
  const a = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
  const b = [[[3, 0], [4, 0], [4, 1], [3, 1], [3, 0]]];
  const svg = geojsonToSvg(fc(feature("Argentina", a), feature("Falkland Is.", b)), {
    merge: { "falkland-is": "argentina" },
    rename: { argentina: "República Argentina" },
  });
  assert.doesNotMatch(svg, /falkland/);
  assert.equal((paths(svg).argentina.match(/M/g) || []).length, 2);
  assert.match(svg, /aria-label="República Argentina"/);
  assert.throws(() => geojsonToSvg(fc(feature("A", a)), { merge: { x: "a" } }), /there is no area "x"/);
});
