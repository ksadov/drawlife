window.addEventListener('load', function(ev) {
    var canvas = document.getElementById('canvas');
    
    var clearB = document.getElementById('clearButton');   
    var conwayB = document.getElementById('conwayButton');
    var brushSize = document.getElementById('brushSize');
    var textureB0 = document.getElementById('texture0');
    var textureB1 = document.getElementById('texture1');
    var textureB2 = document.getElementById('texture2');
    var textureB3 = document.getElementById('texture3');
    var textureB4 = document.getElementById('texture4');
    var textureB5 = document.getElementById('texture5');
    var textureB6 = document.getElementById('texture6');
    var textureB7 = document.getElementById('texture7');
    var textureB8 = document.getElementById('texture8');
    
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.scale(zoom, zoom);
    ctx.fillStyle = 'white'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var data = (ctx.getImageData(0,
				     0,
				     canvas.width,
				 canvas.height)).data;
    
    var mouseDown = false;
    var zoom = 4;
    var conwayOn = false;
    var radius = brushSize.value;
    var prevPoint = null;
    var fillC = 0;
    var texture = function(i) { markPix(i); };
    
    //run conway loop in bg
    setInterval (function() { if (conwayOn) {step(ev);} }, 250);

    /**
     * @typedef {Object} Point
     * @property {number} x - x coordinate
     * @property {number} y - y coordinate
     */
    
    /** 
     * Marks a pixel in a specificed Uint8ClampedArray with a specified fill.
     * 
     * @param {Uint8ClampedArray} arr The array to mark.
     * @param {number} i The linear coordinate of the pixel to mark
     * @param {number} fill 0 if black, 255 if white
     */
    function mark(arr, i, fill) {
	arr[i*4] = fill;
	arr[i*4 + 1] = fill;
	arr[i*4 + 2] = fill;
    }
    
    /** 
     * Marks a pixel in data with 
     * 
     * @param {Uint8ClampedArray} arr The array to mark.
     * @param {number} i The linear coordinate of the pixel to mark
     * @param {number} fill 0 if black, 255 if white
     */
    function markPix(i) {
	mark(data, i, fillC);
    }

    /** 
     * Get the coordinates of the mouse on the canvas.
     * 
     * @return {Point} The 2d coordinates of the mouse. 
     */
    function mousePos(ev) {
	var rect = canvas.getBoundingClientRect();
	return {
	    x: Math.round((event.clientX - rect.left)/zoom),
	    y: Math.round((event.clientY - rect.top)/zoom)
	};
    }

    /** 
    * Get x y coordinates of a pixel on the canvas given by linear coordiates.
    * 
    * @param {number} The linear coordinate.
    * @return {Point} The 2d coordinates of the pixels. 
    */
    function cartesian(n) {
	return {
	    x: n % canvas.width,
	    y: Math.floor(n/canvas.width)
	};
    }
    
    /** 
    * Get linear coordinate of a pixel on the canvas.
    * 
    * @param {number} x x coordinate.
    * @param {number} y y coordinate.
    * @return {number} Linear coordinate.
    */
    function linear(x, y) {
	return(canvas.width * y + x);
    }
    
   /** 
    * Calculate the distance between two points.
    * 
    * @param {Point} The first point.
    * @param {Point} The second point.
    * @return {number} Distance rounded to the nearest int.
    */
    function distToPoint(p0, p1) {
	return Math.round(Math.sqrt( (p0.x - p1.x) ** 2 + (p0.y - p1.y) ** 2 ));
    }

   /** 
    * Calculate the distance between a point and a line given by two points.
    * 
    * @param {Point} p0 The point.
    * @param {Point} p1 The first point on the line.
    * @param {Point} p2 The second point on the line.
    * @return {number} Distance rounded to the nearest int.
    */
    function distToLine(p0, p1, p2) {
	var numerator = Math.abs((p2.y - p1.y)*p0.x -
                                      (p2.x - p1.x)*p0.y +
                                      p2.x*p1.y - p2.y*p1.x);
	var denominator = Math.sqrt(((p2.y - p1.y) ** 2 + (p2.x - p1.x) ** 2));
	if (denominator == 0) {
	    return distToPoint(p0, p1);
	}
	else {
	    return Math.round((numerator / denominator));
	}
    }

   /** 
    * Return the slope of a line given by two points.
    * 
    * @param {Point} p1 The first point.
    * @param {Point} p2 The second point.
    * @return {number} Slope.
    */    
    function lineCoefficients(p1, p2) {
	return {
	    m: (p2.y - p1.y)/(p2.x - p1.x),
	}
    }

   /** 
    * Returns true if a point falls within a stroke between two points.
    * 
    * @param {Point} p0 The point
    * @param {Point} p1 An endpoint of the stroke.
    * @param {Point} p2 An endpoint of the stroke.
    * @return {number} Distance rounded to the nearest int.
    */
    function inStroke(p0, p1,  p2) {
	var inRectangle = false;
	if (p1.y == p2.y) {
	    inRectangle = ((p0.x > p1.x && p0.x < p2.x) || (p0.x < p1.x && p0.x > p2.x));
	}
	else if (p1.x == p2.x) {
	    inRectangle = ((p0.y > p1.y && p0.y < p2.y) || (p0.y < p1.y && p0.y > p2.y));
	}
	else {
	    var lineEq = lineCoefficients(p1, p2);
	    var perp = -(1 / lineEq.m);
	    var b1 = p1.y + (-1*perp) * p1.x;
	    var b2 = p2.y + (-1*perp) * p2.x;
	    inRectangle =
		(p0.y < perp * p0.x + b1 && p0.y > perp * p0.x + b2) ||
		(p0.y > perp * p0.x + b1 && p0.y < perp * p0.x + b2);
	}
	return (
	    (distToLine(p0, p1, p2) < radius && inRectangle) ||
		distToPoint(p0, p1) < radius ||
		distToPoint(p0, p2) < radius);
    }
    
    function drawCircle(ev) {
	var pos = mousePos(ev);
	for (i = 0; i < canvas.width*canvas.height; i++) {
	    let icart = cartesian(i);
	    if (distToPoint(icart, pos) < radius) {
		texture(i);
	    }
	}
	ctx.putImageData(new ImageData(data, canvas.width), 0, 0);
    }

    function drawLine(ev, p1, p2) {
	for (i = 0; i < canvas.width*canvas.height; i++) {
	    let icart = cartesian(i);
	    if (inStroke(icart, p1, p2)) {
		texture(i);
	    }
	}
	ctx.putImageData(new ImageData(data, canvas.width), 0, 0);
    }
    
    function draw(ev) {
	if (mouseDown) {
	    var pos = mousePos(ev);
	    if (prevPoint == null) {
		drawCircle(ev);
	    }
	    else {
		drawLine(ev, prevPoint, pos);
	    }
	    prevPoint = {x: pos.x, y: pos.y};
	}
    }

    function disableConway(ev) {
	conwayOn = false;
	conwayB.textContent = "conway";
	
    }

    function enableConway(ev) {
	conwayOn = true;
	conwayB.textContent = "stop";	
    }
    
    function clear(ev) {
	disableConway(ev);
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	data = (ctx.getImageData(0, 0,canvas.width, canvas.height)).data;
	prevPoint = null;
    }

    function step(ev) {
	var newData = new Uint8ClampedArray(data);
	var alive;
	for (n = 0; n < canvas.width*canvas.height; n++) {
	    var count = 0;
	    var c = cartesian(n);
	    isDead = data[n*4] == 255;
	    for (i = -1; i < 2; i++) {
		for (j = -1; j < 2; j++) {
		    let neighborPos =
			(linear((c.x+i) % canvas.width, (c.y+j) % canvas.height) * 4);
		    if (data[neighborPos] == 0 && !(i == 0 && j == 0)) {
			count++ ;
		    };
		}
	    }
	    if (count < 2 || count > 3) {
		mark(newData, n, 255);
	    }
	    else if (isDead && count == 3) {
		mark(newData, n, 0);
	    }
/* //Pretty symmetries
	    else {mark(newData, n, 0)};
*/
	}
	ctx.putImageData(new ImageData(newData, canvas.width), 0, 0);
	data = newData;
    }
    
    canvas.addEventListener('mousemove', draw, false);
    
    canvas.addEventListener('mousedown', function(ev) {
	mouseDown = true;
	disableConway(ev);
    }, false );
    
    canvas.addEventListener('click', function(ev) {
	drawCircle(ev);
    }, false );
    
    canvas.addEventListener('mouseup', function(ev) {
	mouseDown = false;
	prevPoint = null;
    }, false );

    clearB.addEventListener('click', clear, false);

    conwayB.addEventListener('click', function(ev) {
	if (conwayOn) { disableConway(ev); }
	else { enableConway(ev); }
    } , false);
    
    textureB0.addEventListener('click', function(ev) {
	texture = function(i) {
	    markPix(i);
	};
    } , false);

    textureB1.addEventListener('click', function(ev) {
	texture = function(i) {
	    let c = cartesian(i);
	    if ((c.x + c.y)%2 == 0) {markPix(i);}
	};
    } , false);

    textureB2.addEventListener('click', function(ev) {
	texture = function(i) {
	    if (i%2 == 0) {markPix(i);}
	};
    } , false);

    textureB3.addEventListener('click', function(ev) {
	texture = function(i) {
	    let c = cartesian(i);
	    if ((c.x - c.y)%4 == 0) {markPix(i);}
	};
    } , false);

    textureB4.addEventListener('click', function(ev) {
	texture = function(i) {
	    let c = cartesian(i);
	    if ((c.x - c.y)%4 == 0 && (c.x + c.y)%4 == 0) {markPix(i);}
	};
    } , false);

     textureB5.addEventListener('click', function(ev) {
	 texture = function(i) {
	    let c = cartesian(i);
	    if  ((c.x - c.y)%4 == 0 || (c.x + c.y)%4 == 0) {markPix(i);}
	};
     } , false);

     textureB6.addEventListener('click', function(ev) {
	texture = function(i) {
	    let c = cartesian(i);
	    if  (c.y%2 == 0) {
		if (c.x%4 == 0)
		{markPix(i);}
	    }
	    else if  ((c.x + 2) % 4 == 0) {markPix(i);}
	};
     } , false);

     textureB7.addEventListener('click', function(ev) {
	texture = function(i) {
	    let c = cartesian(i);
	    if  (c.y % 2 == 0) {markPix(i);}
	};
     } , false);
    
    textureB8.addEventListener('click', function(ev) {
	texture = function(i) {
	    let c = cartesian(i);
	    if  ((c.x - c.y) % 4 == 0 || (c.x - c.y + 1) % 4 == 0)
	    {markPix(i);}
	};
    } , false);
    
    brushSize.addEventListener('input', function(ev) {
	radius = brushSize.value;
    } , false);
    
} ,false);
