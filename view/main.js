if (!window["WebSocket"]) {
	document.getElementById("view").innerHTML = "<b>Your browser does not support WebSockets.</b>";
}


// conn = new WebSocket("ws://"+location.host+"/view-ws");
conn = new WebSocket("ws://localhost:8090/view-ws");
conn.onclose = function (evt) {
	console.log("WebSocket closed. Reloading...");
	window.location.reload();
};
fetch('http://localhost:8090/peek').then(r => r.json()).then(state => {
	for (var i = 0; i < state.length; i++) {
		$("#v" + i + " span")[0].innerText = state[i];
	}
});

function setViews(n) {
	for (var i = 0; i < 6; i++) {
		var d = $("#v" + i);
		if (i < n) d.show();
		else d.hide();
		if (n < 4) d.removeClass("h50").addClass("h100");
		else d.removeClass("h100").addClass("h50");
		if (n == 1 || n == 2 || n == 4) d.removeClass("w1-3").addClass("w1-2");
		else d.removeClass("w1-2").addClass("w1-3");
	}
}

let numEditors = 3;
let $numEditors = $('#numEditors');
$numEditors.change(function (e) {
	numEditors = $numEditors.val();
	console.log(numEditors);
	setViews(numEditors);
});
setViews(3);

$(document).keydown(function (e) {
	if (e.keyCode == 27) { // Esc
		$('#menu').toggle();
	}
});


let flock;

function addBird() {
	let side = Math.floor(Math.random()*4);
	let x, y;
	if (side===0) { // top
		x = Math.random() * window.innerWidth;
		y = -20;
	} else if (side===1) { // right
		x = window.innerWidth + 20;
		y = Math.random() * window.innerHeight;
	} else if (side===2) { // bottom
		x = Math.random() * window.innerWidth;
		y = window.innerHeight + 20;
	} else if (side===3) { // left
		x = -20;
		y = Math.random() * window.innerHeight;
	}
	flock.addBoid(new Boid(createVector(x, y), createVector(0,0)))
}

let growInt;
function growFlock(trueFalse) {
	clearInterval(growInt);
	if (trueFalse) {
		growInt = setInterval(() => {
			addBird()
		}, 900);
	}
}

window.phase = 0;

conn.onmessage = function (evt) {
	let item = $("#v" + (parseInt(evt.data[1])-1) + " span");
	if(evt.data[0] == 'c')
		item[0].innerText = evt.data.slice(2);
	else if(evt.data[0] == 'f') {
		item.removeClass('flash');
		setTimeout(() => { item.addClass('flash') }, 30);
		let content = item[0].innerText;
		if(content.toLowerCase().startsWith('set phase')) {
			if(content.indexOf('0') >= 0) {
				window.phase = 0;
				growFlock(false);
				flock = new Flock();
			} else if(content.indexOf('1') >= 0) {
				window.phase = 1;
				flock = new Flock();
				growFlock(true);
			} else if(content.indexOf('2') >= 0) {
				window.phase = 2;
			} else if(content.indexOf('3') >= 0) {
				window.phase = 3;
				growFlock(false);
			}
		}
	}
};


function setup() {
	createCanvas(window.innerWidth, window.innerHeight);
	flock = new Flock();
  for (let i = 0; i < 120; i++) {
    let boid = new Boid(createVector(width *Math.random(), height *Math.random()), createVector(0,0));
    // let boid = new Boid(createVector(width / 2, height / 2), createVector(0,0));
    flock.addBoid(boid);
  }
}

function draw() {
	background(200, 225, 255);
	flock.run();
}

function mouseDragged() {
	flock.addBoid(new Boid(createVector(mouseX, mouseY), createVector(0, 0)));
}