#!/usr/bin/env node
/**
 * geojson-to-svg: convierte un GeoJSON de polígonos en un mapa SVG
 * seleccionable, que se estiliza con src/area-map.css.
 *
 * Uso:
 *   node tools/geojson-to-svg.mjs <entrada.geojson> [-o salida.svg] [opciones]
 *
 * Entrada: GeoJSON estándar (RFC 7946) con coordenadas [longitud, latitud]
 * en WGS 84. Acepta FeatureCollection, Feature, Geometry o
 * GeometryCollection; se usan los Polygon y MultiPolygon y se ignora el resto.
 * Cada Feature es un área seleccionable (barrio, provincia, país...).
 *
 * Opciones:
 *   -o, --output <archivo>   SVG de salida (por defecto, stdout)
 *   --name-prop <prop>       propiedad con el nombre visible. Si falta, se
 *                            prueba name, nombre, NAME, NOMBRE, NAME_ES, ADMIN...
 *   --id-prop <prop>         propiedad para el id del área (se convierte en
 *                            slug). Por defecto, el slug del nombre.
 *   --label-prop <prop>      propiedad con la posición del nombre: [lon, lat]
 *                            o {lon, lat}. Por defecto se calcula sola.
 *   --map-id <id>            id del mapa. Prefija los ids internos para poder
 *                            poner varios mapas en la misma página. Por
 *                            defecto, el nombre del archivo.
 *   --title <texto>          título accesible del mapa
 *   --desc <texto>           descripción o atribución de la fuente
 *   --width <px>             ancho del SVG (por defecto 800). El alto se
 *                            calcula para mantener la proporción.
 *   --padding <px>           margen interno (por defecto 20, deja lugar a
 *                            las sombras)
 *   --projection <nombre>    mercator (por defecto), equirectangular o
 *                            identity (coordenadas ya proyectadas, con y
 *                            creciendo hacia el norte)
 *   --simplify <px>          tolerancia de simplificación en píxeles (por
 *                            defecto 0.25; 0 la apaga). No abre huecos entre
 *                            áreas vecinas.
 *   --precision <n>          decimales de las coordenadas (por defecto 1)
 *   --min-island <px²>       descarta islas más chicas que eso (nunca el
 *                            polígono principal de un área). Por defecto 0.
 *   --bbox <o,s,e,n>         descarta polígonos cuyo centro cae fuera del
 *                            rectángulo [oeste, sur, este, norte], en grados
 *   --merge <origen=destino> une un área con otra (p. ej. islas que la fuente
 *                            trae como área aparte). Se puede repetir; los
 *                            ids son los del SVG generado.
 *   --rename <id=Nombre>     cambia el nombre visible de un área. Se puede repetir.
 *   --single                 selección única en vez de múltiple
 *   --css <href>             ruta al CSS desde el SVG (por defecto area-map.css)
 *   --no-css                 no enlazar ningún CSS
 *   --no-script              no incrustar el JS (cargá src/area-map.js aparte)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNTIME_PATH = join(HERE, "..", "src", "area-map.js");

const NAME_CANDIDATES = [
  "name", "nombre", "NAME", "Name", "NOMBRE", "Nombre", "name_es", "NAME_ES",
  "nam", "NAM", "ADMIN", "admin", "NAME_1", "NAME_2", "title", "label",
];

// Sombras del original en canvas: shadowBlur 10 equivale a stdDeviation 5.
const SHADOW = {
  area: { blur: 5, dx: 0, dy: 0 },
  hover: { blur: 5, dx: -5, dy: 5 },
  label: { blur: 2.5, dx: 0, dy: 0 },
};
// Espacio que necesita una sombra fuera del área: 3σ + desplazamiento.
const SHADOW_MARGIN = 3 * 5 + 5;

export const DEFAULTS = {
  width: 800,
  padding: 20,
  projection: "mercator",
  simplify: 0.25,
  precision: 1,
  minIsland: 0,
  bbox: null,
  single: false,
  css: "area-map.css",
  script: true,
  title: null,
  desc: null,
  mapId: "map",
  nameProp: null,
  idProp: null,
  labelProp: null,
  merge: {},
  rename: {},
  fontSize: 13,
};

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export function slug(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function num(n, precision) {
  const f = 10 ** precision;
  const r = Math.round(n * f) / f;
  return Object.is(r, -0) ? "0" : String(r);
}

function ringArea(ring) {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return sum / 2;
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInPolygon(x, y, polygon) {
  if (!pointInRing(x, y, polygon[0])) return false;
  for (let k = 1; k < polygon.length; k++) if (pointInRing(x, y, polygon[k])) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Lectura del GeoJSON                                                 */
/* ------------------------------------------------------------------ */

function polygonsOf(geometry) {
  if (!geometry) return [];
  switch (geometry.type) {
    case "Polygon":
      return [geometry.coordinates];
    case "MultiPolygon":
      return geometry.coordinates;
    case "GeometryCollection":
      return geometry.geometries.flatMap(polygonsOf);
    default:
      return [];
  }
}

function featuresOf(geojson) {
  switch (geojson && geojson.type) {
    case "FeatureCollection":
      return geojson.features || [];
    case "Feature":
      return [geojson];
    case undefined:
    case null:
      throw new Error("La entrada no es GeoJSON (falta \"type\").");
    default:
      return [{ type: "Feature", properties: {}, geometry: geojson }];
  }
}

function pickName(feature, nameProp, index) {
  const props = feature.properties || {};
  if (nameProp) {
    if (props[nameProp] == null) throw new Error(`El área ${index + 1} no tiene la propiedad "${nameProp}".`);
    return String(props[nameProp]);
  }
  for (const key of NAME_CANDIDATES) {
    if (props[key] != null && String(props[key]).trim()) return String(props[key]).trim();
  }
  if (feature.id != null) return String(feature.id);
  return `Área ${index + 1}`;
}

function readLabelPoint(value) {
  if (Array.isArray(value) && value.length >= 2) return [Number(value[0]), Number(value[1])];
  if (value && typeof value === "object") {
    const lon = value.lon ?? value.lng ?? value.longitude;
    const lat = value.lat ?? value.latitude;
    if (lon != null && lat != null) return [Number(lon), Number(lat)];
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Proyección                                                          */
/* ------------------------------------------------------------------ */

const RAD = Math.PI / 180;
const MAX_LAT = 85.05112878;

export function makeProjection(name, centerLat = 0) {
  switch (name) {
    case "mercator":
      return ([lon, lat]) => {
        const phi = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * RAD;
        return [lon * RAD, -Math.log(Math.tan(Math.PI / 4 + phi / 2))];
      };
    case "equirectangular": {
      const k = Math.cos(centerLat * RAD);
      return ([lon, lat]) => [lon * RAD * k, -lat * RAD];
    }
    case "identity":
      return ([x, y]) => [x, -y];
    default:
      throw new Error(`Proyección desconocida: "${name}" (usá mercator, equirectangular o identity).`);
  }
}

/* ------------------------------------------------------------------ */
/* Simplificación sin huecos entre vecinos                             */
/* ------------------------------------------------------------------ */
/*
 * Los anillos se cortan en "nodos": los puntos donde se juntan bordes de
 * áreas distintas. Cada tramo entre nodos se simplifica con Douglas-Peucker
 * en un sentido canónico. Así, un borde que comparten dos áreas queda
 * idéntico en las dos y no aparecen huecos ni superposiciones.
 */

const key = (p) => p[0] + "," + p[1];

function comparePoints(a, b) {
  return a[0] - b[0] || a[1] - b[1];
}

function douglasPeucker(points, tolerance) {
  const n = points.length;
  if (n <= 2 || tolerance <= 0) return points.slice();
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  const tol2 = tolerance * tolerance;
  while (stack.length) {
    const [first, last] = stack.pop();
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let maxD = -1;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      let d;
      if (len2 === 0) {
        d = (px - ax) ** 2 + (py - ay) ** 2;
      } else {
        const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
        d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
      }
      if (d > maxD) {
        maxD = d;
        index = i;
      }
    }
    if (maxD > tol2) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// Simplifica un tramo siempre en el mismo sentido, sin importar el sentido
// en que lo recorra cada anillo.
function simplifyArc(arc, tolerance) {
  const a = arc[0];
  const b = arc[arc.length - 1];
  let c = comparePoints(a, b);
  if (c === 0 && arc.length > 2) c = comparePoints(arc[1], arc[arc.length - 2]);
  if (c > 0) return douglasPeucker(arc.slice().reverse(), tolerance).reverse();
  return douglasPeucker(arc, tolerance);
}

function findJunctions(rings) {
  const neighbors = new Map();
  const junctions = new Set();
  for (const ring of rings) {
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const k = key(ring[i]);
      const prev = key(ring[(i - 1 + n) % n]);
      const next = key(ring[(i + 1) % n]);
      const pair = prev < next ? prev + "|" + next : next + "|" + prev;
      const seen = neighbors.get(k);
      if (seen === undefined) neighbors.set(k, pair);
      else if (seen !== pair) junctions.add(k);
    }
  }
  return junctions;
}

function simplifyRing(ring, junctions, tolerance) {
  const n = ring.length;
  let starts = [];
  for (let i = 0; i < n; i++) if (junctions.has(key(ring[i]))) starts.push(i);

  if (starts.length === 0) {
    // Anillo sin vecinos (o compartido entero, como un enclave): se arranca
    // del punto menor y se corta en el más lejano, así el resultado no
    // depende del punto de inicio ni del sentido.
    let m = 0;
    for (let i = 1; i < n; i++) if (comparePoints(ring[i], ring[m]) < 0) m = i;
    let far = m;
    let best = -1;
    for (let i = 0; i < n; i++) {
      const d = (ring[i][0] - ring[m][0]) ** 2 + (ring[i][1] - ring[m][1]) ** 2;
      if (d > best || (d === best && comparePoints(ring[i], ring[far]) < 0)) {
        best = d;
        far = i;
      }
    }
    starts = m === far ? [m] : [Math.min(m, far), Math.max(m, far)];
  }

  const out = [];
  for (let s = 0; s < starts.length; s++) {
    const from = starts[s];
    const to = starts[(s + 1) % starts.length];
    const arc = [];
    let i = from;
    do {
      arc.push(ring[i]);
      i = (i + 1) % n;
    } while (i !== to);
    arc.push(ring[to]);
    const simplified = simplifyArc(arc, tolerance);
    simplified.pop(); // el último punto es el inicio del tramo siguiente
    out.push(...simplified);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Posición del nombre                                                 */
/* ------------------------------------------------------------------ */

// Centroide del polígono más grande. Si cae afuera (áreas cóncavas), se usa
// el centro del tramo interior más ancho entre varias líneas horizontales.
function labelPoint(polygons) {
  let main = polygons[0];
  let mainArea = 0;
  for (const p of polygons) {
    const a = Math.abs(ringArea(p[0]));
    if (a > mainArea) {
      mainArea = a;
      main = p;
    }
  }
  const ring = main[0];
  let cx = 0;
  let cy = 0;
  let a2 = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    cx += (ring[j][0] + ring[i][0]) * f;
    cy += (ring[j][1] + ring[i][1]) * f;
    a2 += f;
  }
  if (a2 !== 0) {
    cx /= 3 * a2;
    cy /= 3 * a2;
    if (pointInPolygon(cx, cy, main)) return [cx, cy];
  }

  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of ring) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  let best = null;
  const lines = 15;
  for (let l = 1; l <= lines; l++) {
    const y = minY + ((maxY - minY) * l) / (lines + 1);
    const xs = [];
    for (const r of main) {
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i];
        const [xj, yj] = r[j];
        if (yi > y !== yj > y) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const w = xs[k + 1] - xs[k];
      // Entre segmentos igual de anchos, preferir el más cercano al centroide.
      const score = w - Math.abs(y - cy) * 0.25;
      if (!best || score > best.score) best = { score, x: (xs[k] + xs[k + 1]) / 2, y };
    }
  }
  return best ? [best.x, best.y] : [cx, cy];
}

/* ------------------------------------------------------------------ */
/* Conversión                                                          */
/* ------------------------------------------------------------------ */

export function geojsonToSvg(geojson, options = {}) {
  const opt = { ...DEFAULTS, ...options };
  const precision = Math.max(0, Math.min(6, Number(opt.precision)));
  const grid = 10 ** precision;

  // 1. Áreas con sus polígonos en grados.
  const areas = [];
  const usedIds = new Set();
  featuresOf(geojson).forEach((feature, index) => {
    if (!feature || feature.type !== "Feature") return;
    let polygons = polygonsOf(feature.geometry).filter((p) => p && p.length && p[0].length >= 3);
    if (opt.bbox) {
      const [w, s, e, n] = opt.bbox;
      polygons = polygons.filter((p) => {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const [x, y] of p[0]) {
          x0 = Math.min(x0, x); x1 = Math.max(x1, x);
          y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        return cx >= w && cx <= e && cy >= s && cy <= n;
      });
    }
    if (!polygons.length) return;
    const props = feature.properties || {};
    const name = pickName(feature, opt.nameProp, index);
    let base = slug(opt.idProp ? props[opt.idProp] ?? "" : name) || `area-${index + 1}`;
    if (/^[0-9]/.test(base)) base = "a-" + base;
    let id = base;
    for (let k = 2; usedIds.has(id); k++) id = `${base}-${k}`;
    usedIds.add(id);
    const label = opt.labelProp ? readLabelPoint(props[opt.labelProp]) : null;
    areas.push({ id, name, polygons, label });
  });
  if (!areas.length) throw new Error("El GeoJSON no tiene polígonos (Polygon o MultiPolygon).");

  const byId = new Map(areas.map((a) => [a.id, a]));
  for (const [from, to] of Object.entries(opt.merge || {})) {
    const src = byId.get(from);
    const dst = byId.get(to);
    if (!src || !dst) throw new Error(`--merge: no existe el área "${!src ? from : to}".`);
    dst.polygons.push(...src.polygons);
    areas.splice(areas.indexOf(src), 1);
    byId.delete(from);
  }
  for (const [id, name] of Object.entries(opt.rename || {})) {
    if (!byId.has(id)) throw new Error(`--rename: no existe el área "${id}".`);
    byId.get(id).name = String(name);
  }

  // 2. Proyección y encuadre.
  let lat0 = Infinity;
  let lat1 = -Infinity;
  for (const a of areas) for (const p of a.polygons) for (const [, lat] of p[0]) {
    lat0 = Math.min(lat0, lat);
    lat1 = Math.max(lat1, lat);
  }
  const project = makeProjection(opt.projection, (lat0 + lat1) / 2);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const a of areas) {
    a.projected = a.polygons.map((p) => p.map((ring) => ring.map((c) => {
      const q = project(c);
      if (q[0] < minX) minX = q[0];
      if (q[0] > maxX) maxX = q[0];
      if (q[1] < minY) minY = q[1];
      if (q[1] > maxY) maxY = q[1];
      return q;
    })));
  }
  const width = Number(opt.width);
  const padding = Number(opt.padding);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = (width - 2 * padding) / spanX;
  const height = Math.ceil(spanY * scale + 2 * padding);
  const toPixel = ([x, y]) => [
    Math.round(((x - minX) * scale + padding) * grid) / grid,
    Math.round(((y - minY) * scale + padding) * grid) / grid,
  ];

  // 3. Pasar a píxeles, sacar puntos repetidos y anillos degenerados.
  const allRings = [];
  for (const a of areas) {
    a.pixel = a.projected.map((p) => p.map((ring) => {
      const out = [];
      for (const c of ring) {
        const q = toPixel(c);
        const last = out[out.length - 1];
        if (!last || last[0] !== q[0] || last[1] !== q[1]) out.push(q);
      }
      if (out.length > 1 && key(out[0]) === key(out[out.length - 1])) out.pop();
      return out;
    }).filter((ring) => ring.length >= 3));
    a.pixel = a.pixel.filter((p) => p.length);
    for (const p of a.pixel) allRings.push(...p);
    delete a.projected;
  }

  // 4. Simplificación que respeta los bordes compartidos.
  const tolerance = Number(opt.simplify) || 0;
  if (tolerance > 0) {
    const junctions = findJunctions(allRings);
    for (const a of areas) {
      a.pixel = a.pixel.map((p) => p.map((ring) => {
        const s = simplifyRing(ring, junctions, tolerance);
        return s.length >= 3 && Math.abs(ringArea(s)) > 0 ? s : null;
      }));
      // Si se pierde el borde exterior, el polígono entero desaparece.
      a.pixel = a.pixel.filter((p) => p[0]).map((p) => p.filter(Boolean));
    }
  }

  // 5. Islas diminutas.
  const minIsland = Number(opt.minIsland) || 0;
  for (const a of areas) {
    if (minIsland > 0 && a.pixel.length > 1) {
      const sizes = a.pixel.map((p) => Math.abs(ringArea(p[0])));
      const biggest = Math.max(...sizes);
      a.pixel = a.pixel.filter((_, i) => sizes[i] === biggest || sizes[i] >= minIsland);
    }
  }
  const visible = areas.filter((a) => a.pixel.length);
  for (const a of areas) {
    if (!a.pixel.length) process.emitWarning(`"${a.name}" quedó vacía al simplificar; probá con --simplify más chico o un --width mayor.`);
  }

  // 6. Paths, cajas y posición de los nombres.
  const charWidth = opt.fontSize * 0.62;
  for (const a of visible) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    a.d = a.pixel.map((p) => p.map((ring) => {
      for (const [x, y] of ring) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
        y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      const pts = ring.map(([x, y]) => num(x, precision) + "," + num(y, precision));
      return "M" + pts[0] + "L" + pts.slice(1).join(" ") + "Z";
    }).join("")).join("");
    a.box = { x0, y0, x1, y1 };

    let lp = a.label ? toPixel(project(a.label)) : labelPoint(a.pixel);
    const half = (a.name.length * charWidth) / 2 + 2;
    if (half * 2 < width) lp = [Math.max(half, Math.min(width - half, lp[0])), lp[1]];
    a.labelAt = lp;
  }

  // 7. Armado del SVG.
  const mapId = slug(opt.mapId) || "map";
  const p = (s) => `${mapId}-${s}`;
  const runtime = opt.script ? readFileSync(RUNTIME_PATH, "utf8") : "";
  if (runtime.includes("]]>")) throw new Error("El runtime no puede contener ']]>'.");

  // Sombras: un filtro compartido relativo a la caja de cada área sirve
  // cuando el área es grande. Las chicas usan uno propio en coordenadas
  // absolutas, para que la sombra no quede cortada.
  const sharedRegion = 'x="-50%" y="-50%" width="200%" height="200%"';
  const filter = (id, kind, region) => {
    const s = SHADOW[kind];
    return (
      `<filter id="${id}" ${region} color-interpolation-filters="sRGB">` +
      `<feGaussianBlur in="SourceAlpha" stdDeviation="${s.blur}"/>` +
      `<feOffset dx="${s.dx}" dy="${s.dy}" result="am-blur"/>` +
      `<feFlood class="am-flood-${kind}" flood-color="#000000" flood-opacity="1"/>` +
      `<feComposite in2="am-blur" operator="in"/>` +
      `<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>` +
      `</filter>`
    );
  };
  const ownFilters = [];
  for (const a of visible) {
    const { x0, y0, x1, y1 } = a.box;
    if (Math.min(x1 - x0, y1 - y0) >= 2 * SHADOW_MARGIN) {
      a.fArea = "am-shadow-area";
      a.fHover = "am-shadow-hover";
    } else {
      const m = SHADOW_MARGIN;
      const region =
        `filterUnits="userSpaceOnUse" x="${num(x0 - m, 1)}" y="${num(y0 - m, 1)}" ` +
        `width="${num(x1 - x0 + 2 * m, 1)}" height="${num(y1 - y0 + 2 * m, 1)}"`;
      a.fArea = p(`shadow-area-${a.id}`);
      a.fHover = p(`shadow-hover-${a.id}`);
      ownFilters.push(filter(a.fArea, "area", region), filter(a.fHover, "hover", region));
    }
  }

  const title = opt.title || mapId;
  const out = [];
  out.push('<?xml version="1.0" encoding="UTF-8"?>');
  if (opt.css) out.push(`<?xml-stylesheet type="text/css" href="${escapeXml(opt.css)}"?>`);
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `version="1.1" class="area-map" data-am-map="${escapeXml(mapId)}"` +
    (opt.single ? ' data-am-mode="single"' : "") +
    ` width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
    `role="group" aria-labelledby="${p("title")}">`
  );
  out.push(`<title id="${p("title")}">${escapeXml(title)}</title>`);
  if (opt.desc) out.push(`<desc>${escapeXml(opt.desc)}</desc>`);

  out.push("<defs>");
  out.push(
    '<linearGradient id="am-grad-selected" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" class="am-stop-selected-start" stop-color="#faf100"/>' +
    '<stop offset="1" class="am-stop-selected-end" stop-color="#ffc821"/>' +
    "</linearGradient>"
  );
  out.push(
    '<linearGradient id="am-grad-hover" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" class="am-stop-hover-start" stop-color="#ff0000"/>' +
    '<stop offset="1" class="am-stop-hover-end" stop-color="#bf0000"/>' +
    "</linearGradient>"
  );
  out.push(filter("am-shadow-area", "area", sharedRegion));
  out.push(filter("am-shadow-hover", "hover", sharedRegion));
  out.push(filter("am-shadow-label", "label", 'x="-25%" y="-100%" width="150%" height="300%"'));
  out.push(...ownFilters);
  for (const a of visible) out.push(`<path id="${p("geo-" + a.id)}" d="${a.d}"/>`);
  out.push("</defs>");

  const href = (a) => `xlink:href="#${p("geo-" + a.id)}"`;
  const text = (a, cls) =>
    `<text class="${cls}" data-area="${a.id}" x="${num(a.labelAt[0], 1)}" y="${num(a.labelAt[1], 1)}" ` +
    `dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="${opt.fontSize}" ` +
    `font-weight="bold" fill="#ffffff" stroke="#000000" stroke-width="1" ` +
    `filter="url(#am-shadow-label)" visibility="hidden">${escapeXml(a.name)}</text>`;

  out.push('<g class="am-areas">');
  for (const a of visible) {
    out.push(
      `<use class="am-area" data-area="${a.id}" ${href(a)} fill="#ffffff" stroke="#000000" ` +
      `stroke-width="1" fill-rule="evenodd" filter="url(#${a.fArea})"/>`
    );
  }
  out.push("</g>");

  out.push('<g class="am-selection">');
  for (const a of visible) {
    out.push(
      `<use class="am-selected" data-area="${a.id}" data-selected="false" ${href(a)} ` +
      `fill="url(#am-grad-selected)" stroke="#800000" stroke-width="2" fill-rule="evenodd" visibility="hidden"/>`
    );
  }
  out.push("</g>");

  out.push('<g class="am-labels">');
  for (const a of visible) out.push(text(a, "am-label"));
  out.push("</g>");

  out.push('<g class="am-hits">');
  for (const a of visible) {
    out.push(
      `<g class="am-hit" data-area="${a.id}" role="checkbox" aria-checked="false" ` +
      `aria-label="${escapeXml(a.name)}" tabindex="0">` +
      `<use class="am-hover" ${href(a)} fill="url(#am-grad-hover)" fill-rule="evenodd" ` +
      `filter="url(#${a.fHover})" visibility="hidden"/>` +
      text(a, "am-hit-label") +
      `<use class="am-target" ${href(a)} fill="#000000" fill-opacity="0" fill-rule="evenodd" pointer-events="all"/>` +
      "</g>"
    );
  }
  out.push("</g>");

  if (runtime) out.push(`<script type="text/javascript"><![CDATA[\n${runtime}]]></script>`);
  out.push("</svg>");
  return out.join("\n") + "\n";
}

/* ------------------------------------------------------------------ */
/* Línea de comandos                                                   */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const opt = {};
  let input = null;
  let output = null;
  const value = (i, flag) => {
    if (i >= argv.length) throw new Error(`Falta el valor de ${flag}.`);
    return argv[i];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "-o": case "--output": output = value(++i, a); break;
      case "--name-prop": opt.nameProp = value(++i, a); break;
      case "--id-prop": opt.idProp = value(++i, a); break;
      case "--label-prop": opt.labelProp = value(++i, a); break;
      case "--map-id": opt.mapId = value(++i, a); break;
      case "--title": opt.title = value(++i, a); break;
      case "--desc": opt.desc = value(++i, a); break;
      case "--width": opt.width = Number(value(++i, a)); break;
      case "--padding": opt.padding = Number(value(++i, a)); break;
      case "--projection": opt.projection = value(++i, a); break;
      case "--simplify": opt.simplify = Number(value(++i, a)); break;
      case "--precision": opt.precision = Number(value(++i, a)); break;
      case "--min-island": opt.minIsland = Number(value(++i, a)); break;
      case "--bbox": {
        const b = value(++i, a).split(",").map(Number);
        if (b.length !== 4 || b.some(Number.isNaN)) throw new Error("--bbox espera oeste,sur,este,norte");
        opt.bbox = b;
        break;
      }
      case "--merge":
      case "--rename": {
        const v = value(++i, a);
        const eq = v.indexOf("=");
        if (eq < 1) throw new Error(`${a} espera id=valor`);
        const k = a.slice(2);
        opt[k] = { ...(opt[k] || {}), [v.slice(0, eq)]: v.slice(eq + 1) };
        break;
      }
      case "--single": opt.single = true; break;
      case "--css": opt.css = value(++i, a); break;
      case "--no-css": opt.css = null; break;
      case "--no-script": opt.script = false; break;
      case "-h": case "--help": return { help: true };
      default:
        if (a.startsWith("-")) throw new Error(`Opción desconocida: ${a}`);
        if (input) throw new Error(`Sobra el argumento: ${a}`);
        input = a;
    }
  }
  for (const k of ["width", "padding", "simplify", "precision", "minIsland"]) {
    if (k in opt && !(opt[k] >= 0)) throw new Error(`Valor inválido para --${k}.`);
  }
  if ("width" in opt && opt.width <= 2 * (opt.padding ?? DEFAULTS.padding)) throw new Error("--width tiene que ser mayor que el doble del padding.");
  return { input, output, opt };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  if (args.help || !args.input) {
    const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
    console.log(src.slice(src.indexOf("/**") + 3, src.indexOf("*/")).replace(/^ \* ?/gm, ""));
    process.exit(args.help ? 0 : 2);
  }
  const { input, output, opt } = args;
  if (!opt.mapId) opt.mapId = basename(output || input, extname(output || input));
  try {
    const svg = geojsonToSvg(JSON.parse(readFileSync(input, "utf8")), opt);
    if (output) writeFileSync(output, svg);
    else process.stdout.write(svg);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
