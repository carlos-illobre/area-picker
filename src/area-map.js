/*!
 * area-map runtime: lógica de selección de los SVG generados por
 * tools/geojson-to-svg.mjs.
 *
 * El generador mete este archivo dentro de cada SVG, así que el mapa funciona
 * solo. Si incrustás el SVG con innerHTML o desde un framework (en ese caso el
 * navegador no ejecuta los <script> internos), incluí este mismo archivo con
 * <script src="area-map.js"></script> o llamá a AreaMap.init(svgElement).
 *
 * Está escrito en ES5 a propósito, para que ande en la mayor cantidad posible
 * de navegadores y visores de SVG.
 *
 * API (en cada <svg class="area-map">, propiedad .areaMap):
 *   svg.areaMap.select(id, true|false)   selecciona o deselecciona un área
 *   svg.areaMap.toggle(id)                alterna un área
 *   svg.areaMap.clear()                   deselecciona todo
 *   svg.areaMap.selected()                ids seleccionados (array)
 *   svg.areaMap.areas()                   [{id, name}] de todas las áreas
 *
 * Evento: "areachange" (burbujea), con
 *   event.detail = {id, name, selected, selection: [ids]}
 *
 * Si el SVG se carga con <object> o <iframe>, también avisa al padre con
 *   postMessage({type: "area-map:change", map, id, name, selected, selection})
 * y acepta
 *   postMessage({type: "area-map:select", map?, ids: [...]})
 * para fijar la selección desde afuera.
 */
(function (global) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  function hasClass(el, name) {
    var c = el && el.getAttribute && el.getAttribute("class");
    return !!c && (" " + c + " ").indexOf(" " + name + " ") !== -1;
  }

  // Sube desde el target del evento hasta el <g class="am-hit">.
  // correspondingUseElement cubre navegadores viejos que devuelven
  // SVGElementInstance como target dentro de un <use>.
  function findHit(node, root) {
    while (node && node !== root) {
      if (node.correspondingUseElement) node = node.correspondingUseElement;
      if (hasClass(node, "am-hit")) return node;
      node = node.parentNode;
    }
    return null;
  }

  function makeEvent(name, detail) {
    var ev;
    try {
      ev = new CustomEvent(name, { bubbles: true, detail: detail });
    } catch (e) {
      ev = document.createEvent("CustomEvent");
      ev.initCustomEvent(name, true, false, detail);
    }
    return ev;
  }

  function init(svg) {
    if (!svg || svg.areaMap || !hasClass(svg, "area-map")) return svg && svg.areaMap;

    var single = svg.getAttribute("data-am-mode") === "single";
    var mapId = svg.getAttribute("data-am-map") || "";
    var hits = {};
    var order = [];
    var all = svg.getElementsByTagName("*");
    var i, el, id;

    // Índice id -> elementos que muestran el estado de esa área.
    var parts = {};
    for (i = 0; i < all.length; i++) {
      el = all[i];
      id = el.getAttribute("data-area");
      if (!id) continue;
      (parts[id] = parts[id] || []).push(el);
      if (hasClass(el, "am-hit")) {
        hits[id] = el;
        order.push(id);
      }
    }

    function isSelected(id) {
      return !!hits[id] && hits[id].getAttribute("aria-checked") === "true";
    }

    function paint(id, on) {
      var list = parts[id] || [];
      for (var j = 0; j < list.length; j++) {
        list[j].setAttribute("data-selected", on ? "true" : "false");
      }
      hits[id].setAttribute("aria-checked", on ? "true" : "false");
    }

    function selection() {
      var out = [];
      for (var j = 0; j < order.length; j++) if (isSelected(order[j])) out.push(order[j]);
      return out;
    }

    function nameOf(id) {
      return hits[id] ? hits[id].getAttribute("aria-label") : null;
    }

    function notify(id) {
      var detail = { id: id, name: nameOf(id), selected: isSelected(id), selection: selection() };
      svg.dispatchEvent(makeEvent("areachange", detail));
      if (svg === document.documentElement && global.parent && global.parent !== global) {
        try {
          global.parent.postMessage({
            type: "area-map:change", map: mapId, id: detail.id, name: detail.name,
            selected: detail.selected, selection: detail.selection
          }, "*");
        } catch (e) { /* sin padre accesible */ }
      }
    }

    function select(id, on, silent) {
      if (!hits[id]) return false;
      on = !!on;
      if (single && on) {
        for (var j = 0; j < order.length; j++) {
          if (order[j] !== id && isSelected(order[j])) paint(order[j], false);
        }
      }
      if (isSelected(id) === on) return true;
      paint(id, on);
      if (!silent) notify(id);
      return true;
    }

    function toggle(id) {
      return select(id, !isSelected(id));
    }

    svg.addEventListener("click", function (e) {
      var hit = findHit(e.target, svg);
      if (hit) toggle(hit.getAttribute("data-area"));
    }, false);

    svg.addEventListener("keydown", function (e) {
      var key = e.key || e.keyCode;
      if (key !== "Enter" && key !== " " && key !== "Spacebar" && key !== 13 && key !== 32) return;
      var hit = findHit(e.target, svg);
      if (!hit) return;
      if (e.preventDefault) e.preventDefault();
      toggle(hit.getAttribute("data-area"));
    }, false);

    if (svg === document.documentElement && global.addEventListener) {
      global.addEventListener("message", function (e) {
        var msg = e.data;
        if (!msg || msg.type !== "area-map:select" || !msg.ids) return;
        if (msg.map && msg.map !== mapId) return;
        var wanted = {};
        for (var j = 0; j < msg.ids.length; j++) wanted[msg.ids[j]] = true;
        for (j = 0; j < order.length; j++) select(order[j], !!wanted[order[j]], true);
      }, false);
    }

    svg.areaMap = {
      select: function (id, on) { return select(id, on === undefined ? true : on); },
      toggle: toggle,
      clear: function () {
        for (var j = 0; j < order.length; j++) select(order[j], false);
      },
      selected: selection,
      areas: function () {
        var out = [];
        for (var j = 0; j < order.length; j++) out.push({ id: order[j], name: nameOf(order[j]) });
        return out;
      }
    };
    return svg.areaMap;
  }

  function initAll(root) {
    var list = (root || document).getElementsByTagNameNS(SVG_NS, "svg");
    for (var i = 0; i < list.length; i++) init(list[i]);
  }

  if (!global.AreaMap) global.AreaMap = { init: init, initAll: initAll };

  // Dentro del SVG generado este script va al final, así que los elementos ya
  // existen. Incluido desde una página HTML, espera a que cargue el DOM.
  var current = document.currentScript;
  if (current && current.ownerSVGElement) init(current.ownerSVGElement);
  if (document.readyState === "loading" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", function () { initAll(); }, false);
  } else {
    initAll();
  }
})(typeof window !== "undefined" ? window : this);
