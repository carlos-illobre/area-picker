# ADR 0001: Generate the SVG at build time instead of rendering GeoJSON in the browser

- **Status:** Accepted
- **Date:** 2026-11-01

## Context

area-picker turns GeoJSON polygons (neighbourhoods, provinces, countries...)
into a selectable map. There are two ways to do that:

1. **Build-time script**: `tools/geojson-to-svg.mjs` reads the GeoJSON once
   and writes a self-contained `.svg` (geometry, selection runtime, ARIA),
   styled by the shared `src/area-picker.css`.
2. **Runtime component**: a JavaScript component (plain JS, or React, Vue,
   Angular...) downloads the GeoJSON and renders the SVG in the browser.

Converting GeoJSON into a usable map means projecting coordinates, fitting
them to a viewport, simplifying shapes without opening gaps between
neighbours, and placing labels inside each area. That work has to happen
somewhere: once at build time, or on every page load.

A previous attempt went the component route (TypeScript packages for core,
React and Angular, plus third-party geo dependencies). It grew complex and
never reached a working state.

## Decision

Keep the **build-time script** as the primary way to produce maps.

Keep the conversion core (`geojsonToSvg()`) a pure function, free of
Node-only APIs where practical, so it can also run in the browser later.
A browser rendering entry point is **deferred** until a real use case needs
dynamic data.

## Rationale

### Payload size

The browser receives projected, simplified paths instead of raw GeoJSON:

| Map | GeoJSON | Generated SVG (runtime included) |
|---|---|---|
| Buenos Aires neighbourhoods | 740 KB | 101 KB |
| Provinces of Argentina | 615 KB | 128 KB |
| Countries of South America | 375 KB | 82 KB |

### No client-side computation

Projection, gap-free simplification and label placement run once. With
thousands of polygons (e.g. every municipality in a country) doing that on
every page load is noticeable on low-end phones.

### A portable artifact

A generated `.svg` works with any stack: plain HTML, a CMS, server-side
templates, `<object>`/`<iframe>`, or even `<img>` as a static picture. It can
be retouched in Inkscape or Illustrator and versioned in git. A component
requires client-side JavaScript and usually ties consumers to one framework.

### The data is mostly static

Administrative boundaries change over years, not per request. Compiling them
once matches how the data actually behaves.

### Simplicity

The script has no dependencies and is small enough to read in one sitting.
The earlier component-based attempt shows how quickly the other option grows.

## When a runtime component would be the better choice

- The GeoJSON is dynamic: served by an API, uploaded by users, or filtered on
  the fly.
- The map must change at runtime without regenerating files, e.g. drilling
  down from provinces to districts.
- The team works entirely inside a framework and prefers
  `<AreaPicker geojson={data} />` to a build step.

## Consequences

### Positive

- Small, fast, dependency-free maps that work almost everywhere, including
  without JavaScript as a static image.
- One stylesheet, one runtime and one checkbox-binding mechanism shared by
  every map.

### Negative

- Changing the data requires regenerating the SVG (`npm run build:examples`
  or a CLI call).
- Not suitable as-is for user-provided or frequently changing GeoJSON.

### Follow-up, when needed

- Remove the remaining Node-only calls from the core (`readFileSync` of the
  runtime and `process.emitWarning`) so `geojsonToSvg()` runs in the browser.
- Add `AreaPicker.render(geojson, container, options)` to the runtime. It
  would reuse the same core, CSS, API and checkbox binding.
- Framework wrappers, if ever needed, should be thin layers (a few dozen
  lines) on top of that function, not separate packages.
