(function() {
	var components;
	
	var pathStarted = false;

		
	function showCanvasCoords(e) {
		components.setCoords(e.offsetX, e.offsetY);
	}
	
	function showCanvasClickCoords(e) {		
		components.setClickCoords(e.offsetX, e.offsetY);
		
		var ctx = components.getMainCanvasContext();
		if (!pathStarted) {
			ctx.lineWidth = 3;
/*			ctx.strokeStyle = components.getSelectedLineColor();
			ctx.lineCap = components.getSelectedLineCap();
			ctx.lineJoin = components.getSelectedLineJoin();*/
			ctx.beginPath();
			ctx.moveTo(e.offsetX, e.offsetY);
			components.writeCodeMoveTo(e.offsetX, e.offsetY);
			pathStarted = true;
		} else {
			ctx.lineTo(e.offsetX, e.offsetY);
			ctx.stroke();
			components.writeCodeLineTo(e.offsetX, e.offsetY);
		}

	}
	
	function init() {
	
		var north;
		var northIdx;
		var south;
		var southIdx;
		var west;
		var westIdx;
		var east;
		var eastIdx;
		var index;
	
		components = function() {
			var mainCanvas = document.getElementById("mainCv")
			var mainCanvasContext = mainCanvas.getContext("2d");
			var lineTypeInput = document.getElementById('lineType');
			var coordsDiv = document.getElementById('coords');
			var clickCoordsDiv = document.getElementById('clickcoords');
			var lineWidthInput = document.getElementById("lineWidth");
			var borderWidthInput = document.getElementById("borderWidth");
			var lineCapInput = document.getElementById("lineCap");
			var lineJoinInput = document.getElementById("lineJoin");
			var lineColorInput = document.getElementById("lineColor");
			var borderColorInput = document.getElementById("lineBorder");
			var code = document.getElementById("code");
			var map = document.getElementById("map");
			
			function getSelectedValue(s) {
				return s.options[s.selectedIndex].value;
			}
			
			var components = {
				setClickCoords: function(x, y) {
					clickCoordsDiv.innerText = 'X=' + x + ' Y=' + y;
				},
				setCoords: function(x, y) {
					coordsDiv.innerText = 'X=' + x + ' Y=' + y;
				},
				getMainCanvas: function() {
					return mainCanvas;
				},
				getMainCanvasContext: function() {
					return mainCanvasContext;
				},
				getSelectedLineColor: function() {
					return getSelectedValue(lineColorInput);
				},
				getSelectedBorderColor: function() {
					return getSelectedValue(borderColorInput);
				},
				getSelectedLineWidth: function() {
					return getSelectedValue(lineWidthInput);
				},
				getSelectedLineWidth: function() {
					return getSelectedValue(lineWidthInput);
				},
				getSelectedBorderWidth: function() {
					return getSelectedValue(borderWidthInput);
				},
				getSelectedLineCap: function() {
					return getSelectedValue(lineCapInput);
				},
				writeCodeMoveTo: function(x, y) {
//					code.innerText += "context.moveTo(" + x + ", " + y + ");\n";
					map.innerText += 'name: "Saavedra",\n';
					map.innerText += "points: [\n";
					map.innerText += "\t{x: " + x + ", y:" + y + "},\n";
					south = north = y;
					east = west = x;
					northIdx = southIdx = westIdx = eastIdx = 0;
					index = 0;
				},
				writeCodeLineTo: function(x, y) {
//					code.innerText += "context.lineTo(" + x + ", " + y + ");\n";
					map.innerText += "\t{x: " + x + ", y:" + y + "},\n";
					index++;
					if (y < north) {
						north = y;
						northIdx = index;
					}
					if (y > south) {
						south = y;
						southIdx = index;
					}
					if (x < west) {
						west = x;
						westIdx = index;
					}
					if (x > east) {
						east = x;
						eastIdx = index;
					}
				},
				setCanvasBackground: function(src) {
					var bg = new Image();
					bg.onload = function () {
						mainCanvas.width = bg.width;
						mainCanvas.height = bg.height;
						mainCanvasContext.drawImage(bg, 0, 0);
					}
					bg.src = src;
				},
				getSelectedLineType: function() {
					return getSelectedValue(lineCapInput);
				},
				getSelectedLineJoin: function() {
					return getSelectedValue(lineJoinInput);
				}
			};
						
			return components;
		}();

		var cv = components.getMainCanvas();
		cv.addEventListener("click", showCanvasClickCoords, false);
		cv.addEventListener("mousemove", showCanvasCoords, false);				

		document.getElementById("finishDraw").addEventListener("click", function(){
			components.getMainCanvasContext().closePath();
			components.getMainCanvasContext().fill();
			pathStarted = false;

			map.innerText += "],\n";
			map.innerText += "north: " + north + ",\n";
			map.innerText += "east: " + east + ",\n";
			map.innerText += "south: " + south + ",\n";
			map.innerText += "west: " + west + ",\n";
						map.innerText += "}\n";
		}, false);

		components.setCanvasBackground("./aaa.png");		
	}

	window.addEventListener("load", init, false);
})();

