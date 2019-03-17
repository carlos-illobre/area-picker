var ar;
if (!ar) ar = {};
if (!ar.com) ar.com = {};
if (!ar.com.propinmueble) ar.com.propinmueble = {};
if (!ar.com.propinmueble.geomap) ar.com.propinmueble.geomap = {};


(function() {
    var GEOMAP_BORDER_COLOR = "black";
    var GEOMAP_SHADOW_COLOR = "white";
    var GEOMAP_SHADOW_BLUR = 10;
    var FONT = "bold 13px sans-serif";
    var FONT_COLOR = "white"
    var FONT_BORDER_COLOR = "black";
    var SHADOW_BLUR = 10;
    var MOUSE_OVER_AREA_GRADIENT_COLOR_1 = "#d40000";
    var MOUSE_OVER_AREA_GRADIENT_COLOR_2 = "red";
    var MOUSE_OVER_AREA_SHADOW_OFFSET_X = -5;
    var MOUSE_OVER_AREA_SHADOW_OFFSET_Y = 5;
    var TEXT_SHADOW_OFFSET_X = 0;
    var TEXT_SHADOW_OFFSET_Y = 0;
    var SELECTED_AREA_GRADIENT_COLOR_1 = "#ffc821";
    var SELECTED_AREA_GRADIENT_COLOR_2 = "#faf100";
    var SELECTED_AREA_BORDER_COLOR = "maroon";
    var SELECTED_AREA_BORDER_WIDTH = 2;
    
    var that = ar.com.propinmueble.geomap;


    function cleanCanvas(context) {
        context.canvas.width = context.canvas.width;
    }
        

    /*
     * Crea el path del area
     */
    function drawPath(context, area) {
        var i=0;
        var point = area.points[i];
        context.beginPath();    
        context.moveTo(point.x, point.y);
        for (i=1; i<area.points.length; i++) {
            point = area.points[i];
            context.lineTo(point.x, point.y);
        }
        point = area.points[0];
        context.lineTo(point.x, point.y);
        context.closePath();
    }


    function drawUnselectedArea(context, area) {
        drawPath(context, area);
        context.save();
        context.shadowColor = GEOMAP_SHADOW_COLOR;
        context.shadowBlur = GEOMAP_SHADOW_BLUR;
        context.fill();
        context.strokeStyle = GEOMAP_BORDER_COLOR;
        context.stroke();
        context.restore();
    }
        
    
    function drawText(context, area) {
        context.save();
        context.shadowColor = GEOMAP_BORDER_COLOR;
        context.shadowOffsetX = TEXT_SHADOW_OFFSET_X;
        context.shadowOffsetY = TEXT_SHADOW_OFFSET_Y;
        context.shadowBlur = SHADOW_BLUR;
        var fontX = (area.east + area.west - context.measureText(area.name).width)/2;
        fontX = fontX < 0 ? SHADOW_BLUR/2 : fontX;
        var fontY = (area.south + area.north)/2;
        context.font = FONT;
        context.strokeStyle = FONT_BORDER_COLOR;
        context.strokeText(area.name, fontX, fontY);
        context.fillStyle = FONT_COLOR;
        context.fillText(area.name, fontX, fontY);
        context.restore();
    }
        
    
    /**
     * ar.com.propinmueble.geomap.drawMouseOverArea: Dibuja un area de un mapa en un canvas.
     *  @param area: Region que se quieren dibujar.
     *  @param context: Contexto 2D del canvas donde se quiere dibujar.
     *                          Debe estar inicializado y listo para que se le
     *                          haga un beginPath.
     */
    function drawMouseOverArea(context, area) {
        drawPath(context, area);
        context.save();
        context.shadowColor = GEOMAP_BORDER_COLOR;
        context.shadowBlur = SHADOW_BLUR;
        context.shadowOffsetX = MOUSE_OVER_AREA_SHADOW_OFFSET_X;
        context.shadowOffsetY = MOUSE_OVER_AREA_SHADOW_OFFSET_Y;
        var gr = context.createLinearGradient(0, area.north, 0, area.south);
        gr.addColorStop(0, MOUSE_OVER_AREA_GRADIENT_COLOR_1);
        gr.addColorStop(1, MOUSE_OVER_AREA_GRADIENT_COLOR_2);
        context.fillStyle = gr;
        context.fill();
        drawText(context, area);
        context.restore();
    }
    
    
    function drawSelectedArea(context, area) {
        drawPath(context, area);
        context.save();
        var gr = context.createLinearGradient(0, area.north, 0, area.south);
        gr.addColorStop(0, SELECTED_AREA_GRADIENT_COLOR_1);
        gr.addColorStop(1, SELECTED_AREA_GRADIENT_COLOR_2);
        context.fillStyle = gr;
        context.fill();
        context.lineWidth = SELECTED_AREA_BORDER_WIDTH;
        context.strokeStyle = SELECTED_AREA_BORDER_COLOR;
        context.stroke();
        context.restore();
    }
    

    function drawGeomap(context, geomap) {
        var selectedAreas = [];
        var j;
        for (j=0; j<geomap.areas.length; j++) {
            var area = geomap.areas[j];
            drawUnselectedArea(context, area);
            if (area.selected) selectedAreas.push(area);
        }
        for (j=0; j<selectedAreas.length; j++) {
            drawSelectedArea(context, selectedAreas[j]);
        }
        for (j=0; j<selectedAreas.length; j++) {
            drawText(context, selectedAreas[j]);
        }
    };
    
        
    /**
     * ar.com.propinmueble.geomap.drawGeomap: Dibuja un mapa en un canvas.
     *  @param geomap: Mapa que se quiere dibujar.
     *  @param context: Contexto 2D del canvas donde se quiere dibujar.
     *                          Debe estar inicializado y listo para que se le
     *                          haga un beginPath.
     */
    that.draw = function(context, geomap, selectedArea) {
        cleanCanvas(context);
        drawGeomap(context, geomap);
        if (selectedArea) drawMouseOverArea(context, selectedArea);
    }

    
}());
