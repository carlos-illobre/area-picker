#!/usr/bin/env node
/**
 * Rebuilds the example maps in examples/ and the demo page (index.html at the
 * repository root, served by GitHub Pages).
 *
 *   node tools/build-examples.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { geojsonToSvg, geojsonToInputs } from "./geojson-to-svg.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EX = join(ROOT, "examples");

const MAPS = [
  {
    mapId: "caba-barrios",
    input: "data/caba-barrios.geojson",
    nameProp: "nombre",
    title: "Neighbourhoods of Buenos Aires",
    desc: "Source: Buenos Aires Data (GCBA), Barrios dataset.",
    // The source drops accents from some names.
    rename: {
      agronomia: "Agronomía", constitucion: "Constitución", nunez: "Núñez",
      "san-cristobal": "San Cristóbal", "san-nicolas": "San Nicolás",
      "velez-sarsfield": "Vélez Sarsfield", "villa-del-parque": "Villa del Parque",
      "villa-ortuzar": "Villa Ortúzar", "villa-pueyrredon": "Villa Pueyrredón",
    },
  },
  {
    mapId: "argentina-provincias",
    input: "data/argentina-provincias.geojson",
    nameProp: "nombre",
    title: "Provinces of Argentina",
    desc: "Source: Georef AR / Instituto Geográfico Nacional. Antarctic sector not included.",
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
    title: "Countries of South America",
    desc: "Source: Natural Earth (public domain). The Malvinas Islands are shown as part of Argentina.",
    width: 600,
    bbox: [-82, -56, -34, 13],
    minIsland: 4,
    single: true,
    // Natural Earth lists the Malvinas Islands separately: merge them into Argentina.
    merge: { "falkland-is": "argentina" },
    rename: {
      brazil: "Brasil", peru: "Perú", suriname: "Surinam",
      // Only French Guiana is left of France after --bbox.
      france: "Guayana Francesa",
    },
  },
];

const parts = {};
for (const m of MAPS) {
  const geojson = JSON.parse(readFileSync(join(EX, m.input), "utf8"));
  const svg = geojsonToSvg(geojson, { ...m, css: "../src/area-picker.css" });
  writeFileSync(join(EX, `${m.mapId}.svg`), svg);
  // Inline version: no XML prolog (the page links the stylesheet).
  parts[`${m.mapId}.svg`] = svg.replace(/^<\?xml[^>]*\?>\n/gm, "");
  parts[`${m.mapId}.inputs`] = geojsonToInputs(geojson, m);
  console.log(`examples/${m.mapId}.svg  ${(svg.length / 1024).toFixed(0)} KB`);
}

const template = readFileSync(join(ROOT, "tools", "demo.template.html"), "utf8");
const html = template.replace(/\{\{([\w.-]+)\}\}/g, (_, k) => {
  if (!(k in parts)) throw new Error(`Unknown placeholder {{${k}}}`);
  return parts[k];
});
writeFileSync(join(ROOT, "index.html"), html);
console.log("index.html");
