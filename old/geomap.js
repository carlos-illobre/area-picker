/**
 * ar.com.propinmueble.geomap: Contiene los metodos para manipular los datos del mapa
 */
var ar;
if (!ar) ar = {};
if (!ar.com) ar.com = {};
if (!ar.com.propinmueble) ar.com.propinmueble = {};
if (!ar.com.propinmueble.geomap) ar.com.propinmueble.geomap = {};


(function() {
    var geomap = ar.com.propinmueble.geomap;
    var _mapdata;
    
    
    function isInSquareArea(x, y, area) {
        return y <= area.south && y > area.north && x <= area.east && x > area.west;
    };
    
        
    function isInArea(x, y, area) {
        if (!isInSquareArea(x, y, area)) return false;
        var points = area.points;
        var inArea = false; 
        var j = points.length-1;                
        var i;  
        for(i=0; i < points.length; i++) {  
            var p1 = points[i];
            var p2 = points[j];
            if (p1.x < x && p2.x >= x || p2.x < x && p1.x >= x)  {  
                if (p1.y + (x - p1.x) / (p2.x - p1.x) * (p2.y - p1.y) < y) {  
                    inArea = !inArea;  
                }  
            }  
            j = i;  
        }  
        return inArea;  
    }
    
    
    geomap.getArea = function(x, y) {
        var j;
        for (j=0; j<_mapdata.areas.length; j++) {
            if (isInArea(x, y, _mapdata.areas[j])) return _mapdata.areas[j];
        }
        return null;
    }
    
    
    geomap.setMapdata = function(mapdata) {
        _mapdata = mapdata;
    };

    
}());
