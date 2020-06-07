var zoom =
    (canvas.getBoundingClientRect().height/canvas.height)

window.addEventListener('resize', function() {
	zoom = (canvas.getBoundingClientRect().height/canvas.height);
    } , false);

window.addEventListener('load', function(ev) {
    var canvas = document.getElementById('canvas');
    var body =  document.getElementById('body');
    var clearB = document.getElementById('clearButton');   
    var conwayB = document.getElementById('conwayButton');
    var generationText = document.getElementById('generation');
    var generation = 0;
    var birthForm =  document.getElementById('birth');
    var birth = parseRule(birthForm.value);
    var survivalForm =  document.getElementById('survival');
    var survival = parseRule(survivalForm.value);
    var eraserB = document.getElementById('eraserButton');
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

    var urlB =  document.getElementById('urlButton');
    var link =  document.getElementById('link');

    var GB = document.getElementById("rleGButton");
    var DB = document.getElementById("rleDButton");
    var RLEbox = document.getElementById("RLE");
    
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.scale(zoom, zoom);
    ctx.fillStyle = 'white'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var data = (ctx.getImageData(0, 0, canvas.width, canvas.height)).data;
    
    var mouseDown = false;
    var conwayOn = false;
    var radius = brushSize.value;
    var prevPoint = null;
    var fillC = 0;
    var texture = function(i) { markPix(i); };

    
    //run conway loop in bg
    setInterval (function() { if (conwayOn) {step(ev);} }, 250);

    assignUrl();

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
     * Marks a pixel in data with fillC.
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
     * Get the coordinates of the touch on the canvas.
     * 
     * @return {Point} The 2d coordinates of the touch. 
     */
    function touchPos(ev) {
	var rect = canvas.getBoundingClientRect();
	return{
	    x: Math.round(
		(ev.targetTouches[0].pageX - rect.left)/zoom),
	    y: Math.round(
		(ev.targetTouches[0].pageY - rect.top)/zoom)
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
    * Encode data in url-safe RLE format.
    * 
    * @return {string} a string representing the encoded data.
    */
    function encodeData() {
	var encoding = "";
	var count = 0;
	var status = "b";
	for (var z = 0; z < canvas.width*canvas.height; z++)  {
	    count = 1;
	    if (data[z*4] == 0) { status = "o"; }
	    else { status = "b"; }
	    while (data[z*4] == data[(z+1)*4]) {
		count++;
		z ++;
	    }
	    if (count == 1) { encoding += status; }
	    else { encoding += (count + status); }
	}
	return encoding;
    }

    /** 
    * Generate a url.
    * 
    * @return {string} url.
    */
    function makeUrl() {
	return (
	    "https://ksadov.github.io/drawlife/?b=" + birth.join("") +
		"&s=" + survival.join("") + "&d=" + encodeData());		
    }

    /** 
    * Assign the decoded contents of a url-safe run-length-encoding to data.
    * 
    * @param {rle} The RLE to decode.
    */
    function decodeRLE(rle) {
	var count = "";
	var idx = 0;
	for (var z = 0; z < rle.length; z++)  {
	    if (!(isNaN(parseInt(rle[z], 10)))) {
		count += rle[z];
	    }
	    else if (z > 0 && (isNaN(parseInt(rle[z-1], 10))) || (z == 0)) {
		if (rle[z] == 'o') {
		    markPix(idx);
		}
		idx++;
	    }
	    else {
		if (rle[z] == 'o') {
		    for (var y = idx; y < idx + parseInt(count); y++) {
			markPix(y);
		    }
		}
		idx += parseInt(count);
		count = "";
	    }
	}
	ctx.putImageData(new ImageData(data, canvas.width), 0, 0);	
    }

    /** 
    * Assign values based on the url.
    */
    function assignUrl() {
	let params = new URLSearchParams(window.location.search.substring(1));
	/*
	let url = new URL(
	    'https://ksadov.github.io/drawlife/?b=1&s=2&d=150b50o150b50o150b50o150b50o150b50o150b50o150b50o150b50o150b50o151b49o151b49o151b49o151b49o151b49o152b48o152b48o152b48o153b47o153b47o153b47o154b46o154b46o155b45o155b45o156b44o156b44o157b43o157b43o158b42o159b41o159b41o160b40o161b39o162b38o163b37o164b36o164b36o166b34o167b33o168b32o169b31o170b30o172b28o173b27o175b25o177b23o179b21o181b19o184b16o187b13o192b8o19800b');
	let params = new URLSearchParams(url.search);
*/
	if (params.toString().length > 0) {
	    let birthV = params.get("b");
	    birthForm.value = birthV;
	    birth = parseRule(birthV);
	    let survivalV = params.get("s");
	    survivalForm.value = survivalV;
	    survival = parseRule(survivalV);
	    let rle = params.get("d");
	    decodeRLE(rle);
	}
    }

// drawing functions
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

   /** 
    * Draws a circle on the canvas at a given position..
    */    
    function drawCircle(pos) {
	for (i = 0; i < canvas.width*canvas.height; i++) {
	    let icart = cartesian(i);
	    if (distToPoint(icart, pos) < radius) {
		texture(i);
	    }
	}
	ctx.putImageData(new ImageData(data, canvas.width), 0, 0);
    }

   /** 
    * Draws a stroke with rounded ends on the canvas between two points.
    * 
    * @param {Point} p1 An endpoint of the stroke.
    * @param {Point} p2 An endpoint of the stroke.
    */
    function drawLine(p1, p2) {
	for (i = 0; i < canvas.width*canvas.height; i++) {
	    let icart = cartesian(i);
	    if (inStroke(icart, p1, p2)) {
		texture(i);
	    }
	}
	ctx.putImageData(new ImageData(data, canvas.width), 0, 0);
    }

   /** 
    * Draws on the canvas at a given position.
    */
    function draw(pos) {
	if (mouseDown) {
	    if (prevPoint == null) {
		drawCircle(pos);
	    }
	    else {
		drawLine(prevPoint, pos);
	    }
	    prevPoint = {x: pos.x, y: pos.y};
	}
    }

   /** 
    * Clears the canvas.
    */
    function clear() {
	disableConway();
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	data = (ctx.getImageData(0, 0,canvas.width, canvas.height)).data;
	prevPoint = null;
	updateGeneration(0);
    }

// cellular automata functions
   /** 
    * Turns off cellular automate stepping.
    */
    function disableConway() {
	conwayOn = false;
	conwayB.textContent = "run";
	birthForm.disabled = false;
	survivalForm.disabled = false;
	urlB.disabled = false;
    }
    
   /** 
    * Turns on cellular automata stepping.
    */
    function enableConway() {
	conwayOn = true;
	conwayB.textContent = "stop";
	birthForm.disabled = true;
	survivalForm.disabled = true;
	urlB.disabled = true;
    }
    
   /** 
    * Advances the cellular automata on the canvas by one step.
    */
    function step() {
	function nicemod(n, m) {
	    return ((n % m) + m) % m;
	}
	var newData = new Uint8ClampedArray(data);
	var alive;
	for (n = 0; n < canvas.width*canvas.height; n++) {
	    var count = 0;
	    var c = cartesian(n);
	    isDead = data[n*4] == 255;
	    for (i = -1; i < 2; i++) {
		for (j = -1; j < 2; j++) {
		    let neighborPos =
			4 * linear
		    (nicemod((c.x+i), canvas.width),
		     nicemod ((c.y+j), canvas.height));
		    if (data[neighborPos] == 0 && !(i == 0 && j == 0)) {
			count++ ;
		    };
		}
	    }
	    if (!(isDead) && survival.includes(count)) {
	    }
	    else if (isDead && birth.includes(count)) {
		mark(newData, n, 0);
	    }
	    else {
		mark(newData, n, 255);
	    }
	}
	ctx.putImageData(new ImageData(newData, canvas.width), 0, 0);
	data = newData;
	updateGeneration(generation + 1);
    }
    
   /** 
    * Update text description of generation.
    *
    * @param {number} n The new generation.
    */
    function updateGeneration(n) {
	generation = n;
	generationText.textContent = "generation: " + n;
	
    }
    
   /** 
    * Converts a birth or survival rule into a list of digits.
    *
    * @param {number} n The unparsed rule.
    *
    * @return {number array} The digits.
    */
    function parseRule(n) {
	var digits = n.toString().split('')
	return (digits.map(Number))
    }

 //// WIP

    /** 
    * Encode data in standard RLE format.
    * 
    * @return {string} a string representing the encoded data.
    */

    function encodeDataStandard() {
	var encoding = "";
	var count = 0;
	var status = "b";
	var lineacc = 0;
	for (var z = 0; z < canvas.width*canvas.height; z++)  {
	    count = 1;
	    if (data[z*4] == 0) { status = "o"; }
	    else { status = "b"; }
	    while (data[z*4] == data[(z+1)*4] && lineacc < canvas.width - 1) {
		count++;
		lineacc++;
		z ++;
	    }
	    if (count == 1) { encoding += status; }
	    else { encoding += (count + status); }
	    if (lineacc == canvas.width - 1) {encoding += "$"; lineacc = 0};
	}
	return encoding;
    }
 
    /** 
    * Returns the number of cells in a RLE line.
    *
    * @param {string} a representation of a line in RLE.
    * @return {number} the number of cells in a RLE line.
    */
    function lineLength(l) {
	var acc = "";
	var count = 0;
	for (var i = 0; i < l.length; i++) { 
	    if (!(isNaN(parseInt(l[i], 10)))) {
		acc += l[i];
	    }
	    else if (!(i==0) && isNaN(parseInt(l[i-1], 10))|| (i == 0)) {
		count++;
	    }
	    else { count += parseInt(acc); acc = ""; }
	    
	}
	return count;
    }

    /** 
    * Determines whether a stadard RLE line end with a numbers.
    * 
    * @return {number} The number at the end of the RLE line, 1 if no number
    * detected.
    */
    function lineEndNumber(line){
	var count = "";
	for (var i = line.length - 1; !isNaN(parseInt(line[i])); i--) {
	    count = line[i] + count;
	}
	if (count == "") { return 1; }
	else { return (parseInt(count)) }
    }

    /** 
    * Assign the decoded contents of a standard run-length-encoding to data.
    * 
    * @param {rle} The standard RLE to decode.
    */
    function decodeDataStandard(rle) {
	clear();
	if (rle[rle.length - 1] == "!") {
	    rle = rle.slice(0, -1);
	}
	rle = rle.replace(/(\r\n|\n|\r)/gm, "");
	var lines = rle.split("$");
	var yOffset = Math.floor((canvas.height - lines.length)/2) - 1;
	let lineLengths = lines.map(x => lineLength(x));
	var longestLength = lineLengths.reduce((x, y) => Math.max(x, y));
	var xOffset = Math.floor((canvas.width - longestLength)/2);
	var urlSafe = (yOffset * canvas.width) + "b";
	var tailLength = 0;
	var lineDup = 0;
	var line = "";
	for (var  lineIndex =  0; lineIndex < lines.length; lineIndex++)
	{
	    line = lines[lineIndex];
	    tailLength = canvas.width - (lineLengths[lineIndex] + xOffset);
	    lineDup = lineEndNumber(line);
	    if (lineDup > 1) { line = line.slice(0, -1); }
	    urlSafe += xOffset + "b" + line + tailLength + "b";
	    for (var i = 0; i < lineDup - 1; i++) {
		urlSafe += canvas.width + "b";
		console.log(urlSafe);
	    }
	}
	decodeRLE(urlSafe);
    }

	
    /** 
    * Converts the current configuration to a standard RLE.
    *
    *
    * @return {string} The RLE.
    */
    /*
    function getStandardRLE() {
	annotated = encodeDataStandard();
	return (
	    "#C Generated by https://ksadov.github.io/drawlife/\n" +
		"x = " + canvas.width + 
		", y = " + canvas.height +
		" , rule = B" + birth.join("") + "/S" + survival.join("") +
		"\n" + annotated)
    }
*/

    
// callbacks
    canvas.addEventListener('mousemove',  function(ev) {
	draw(mousePos(ev));
    }, false);
    
    canvas.addEventListener('mousedown', function() {
	mouseDown = true;
	disableConway();
	updateGeneration(0);
    }, false );
    
    canvas.addEventListener('click', function(ev) {
	drawCircle(mousePos(ev));
    }, false );
    
    canvas.addEventListener('mouseup', function() {
	mouseDown = false;
	prevPoint = null;
    }, false );

    //touchscreen event listeners
    canvas.addEventListener("touchstart",  function(ev) {
	ev.preventDefault();
	disableConway();
	updateGeneration(0);
	mouseDown = true;
	draw(touchPos(ev));
    },{ passive: false } );
    
    canvas.addEventListener("touchend",  function(ev) {
	//ev.preventDefault();
	prevPoint = null;
	mouseDown = false;
    }, { passive: false } );
    
    canvas.addEventListener("touchmove",  function(ev) {
	ev.preventDefault();
	draw(touchPos(ev));
    }, { passive: false });

    //buttons
    clearB.addEventListener('click', clear, false);

    conwayB.addEventListener('click', function() {
	if (conwayOn) { disableConway(); }
	else { enableConway(); }
    } , false);

    eraserB.addEventListener('click', function() {
	if (fillC == 0) {
	    fillC = 255;
	    eraserB.textContent="brush";
	}
	else if (fillC == 255) {
	    fillC = 0;
	    eraserB.textContent="eraser";
	}
    } , false);
    
    brushSize.addEventListener('input', function() {
	radius = brushSize.value;
    } , false);

    birthForm.addEventListener('input', function() {
	updateGeneration(0);
	birth = parseRule(birthForm.value);
    } , false);

    survivalForm.addEventListener('input', function() {
	updateGeneration(0);
	survival = parseRule(survivalForm.value);
    } , false);

    // toggle textures
    textureB0.addEventListener('click', function() {
	texture = function(i) {
	    markPix(i);
	};
    } , false);

    textureB1.addEventListener('click', function() {
	texture = function(i) {
	    let c = cartesian(i);
	    if ((c.x + c.y)%2 == 0) {markPix(i);}
	};
    } , false);

    textureB2.addEventListener('click', function() {
	texture = function(i) {
	    if (i%2 == 0) {markPix(i);}
	};
    } , false);

    textureB3.addEventListener('click', function() {
	texture = function(i) {
	    let c = cartesian(i);
	    if ((c.x - c.y)%4 == 0) {markPix(i);}
	};
    } , false);

    textureB4.addEventListener('click', function() {
	texture = function(i) {
	    let c = cartesian(i);
	    if ((c.x - c.y)%4 == 0 && (c.x + c.y)%4 == 0) {markPix(i);}
	};
    } , false);

     textureB5.addEventListener('click', function() {
	 texture = function(i) {
	    let c = cartesian(i);
	    if  ((c.x - c.y)%4 == 0 || (c.x + c.y)%4 == 0) {markPix(i);}
	};
     } , false);

     textureB6.addEventListener('click', function() {
	texture = function(i) {
	    let c = cartesian(i);
	    if  (c.y%2 == 0) {
		if (c.x%4 == 0)
		{markPix(i);}
	    }
	    else if  ((c.x + 2) % 4 == 0) {markPix(i);}
	};
     } , false);

     textureB7.addEventListener('click', function() {
	texture = function(i) {
	    let c = cartesian(i);
	    if  (c.y % 2 == 0) {markPix(i);}
	};
     } , false);
    
    textureB8.addEventListener('click', function() {
	texture = function(i) {
	    let c = cartesian(i);
	    if  ((c.x - c.y) % 4 == 0 || (c.x - c.y + 1) % 4 == 0)
	    {markPix(i);}
	};
    } , false);

    urlB.addEventListener('click', function() {
	link.value = makeUrl();
    } , false);
    
    GB.addEventListener('click', function() {
	RLEbox.value = "WIP";
    } , false);

    DB.addEventListener('click', function() {
	clear();
	disableConway();
	decodeDataStandard(RLEbox.value);
    } , false);
    
} ,false);
