/**
 * Presenter de la pagina para seleccionar zonas geograficas.
 */
window.addEventListener("load", function() {
    var geomapCanvas = document.getElementById("geomap");
    var geomapCanvasContext;
    if (geomapCanvas) geomapCanvasContext = geomapCanvas.getContext("2d");
    var geomapSelecctionForm = document.getElementById("geomapSelecction");
    var checkboxes = {};

    
    function setCanvasBackground(src) {
        var bg = new Image();
        bg.onload = function () {
            geomapCanvas.width = bg.width;
            geomapCanvas.height = bg.height;
            geomapCanvasContext.drawImage(bg, 0, 0);
        }
        bg.src = src;
    }


    function createCheckboxes(mapdata) {
        var aux = [];
        var i;
        var checkbox;
        for (i=0; i<mapdata.areas.length; i++) {
            var area = mapdata.areas[i];
            checkbox = document.createElement("input");
            checkbox.id = area.name;
            checkbox.type = "checkbox";
            checkbox.area = area;
            checkbox.addEventListener("click", function() {
                this.area.selected = this.checked;
                geomap.draw(geomapCanvasContext, capitalfederal);
            }, false);
            checkboxes[checkbox.id] = checkbox;
            aux.push(checkbox);
        }
        aux.sort(function(u,v) {
            a = u.id.toLowerCase();
            b = v.id.toLowerCase();
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });
        for (i=0; i<aux.length; i++) {
            checkbox    = aux[i];
            var label = document.createElement("label")
            label.htmlFor = checkbox.id;
            label.innerText = checkbox.id;
            geomapSelecctionForm.appendChild(checkbox);
            geomapSelecctionForm.appendChild(label);
        }
    }


    var geomap = ar.com.propinmueble.geomap;
    var capitalfederal = geomap.data.ar.capitalfederal;
    geomapCanvas.width = capitalfederal.width;
    geomapCanvas.height = capitalfederal.height;
    geomap.setMapdata(capitalfederal);
    geomap.draw(geomapCanvasContext, capitalfederal);
    createCheckboxes(capitalfederal);

    geomapCanvas.addEventListener("click", function(e) {
        var area = geomap.getArea(e.offsetX, e.offsetY);
        if (area) {
            checkboxes[area.name].click();
        }
    }, false);
    
    var f = (function() {
        var _area;
        return function(e) {
            var area = geomap.getArea(e.offsetX, e.offsetY);
            if (area) {
                if (!_area || _area.name != area.name) {
                    geomap.draw(geomapCanvasContext, capitalfederal, area);
                    _area = area;
                }
            } else if (_area) {
                geomap.draw(geomapCanvasContext, capitalfederal);
                _area = area;
            }
        }
    }());
    geomapCanvas.addEventListener("mousemove", f, false);
    
    geomapCanvas.addEventListener("mouseout", function(e) {
                geomap.draw(geomapCanvasContext, capitalfederal);
    }, false);  

}, false);
