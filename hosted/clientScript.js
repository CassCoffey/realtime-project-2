"use strict";

var loops = 0, ticks = 1000 / 30, maxFrameSkip = 10, nextGameTick = (new Date).getTime();

var canvas;
var ctx;

let socket;
let oldDraws = {};
let draws = {};
let pellets= [];
let lastUpdate = 0;

const user = `user${(Math.floor((Math.random()*1000))+1)}`;

var myKeys = {};
myKeys.KEYBOARD = Object.freeze({
	"KEY_SPACE": 32,
	"KEY_W": 87,
	"KEY_A": 65,
	"KEY_S": 83,
	"KEY_D": 68,
});
myKeys.keydown = [];

const connectSocket = (e) => {
	socket = io.connect();
	
	socket.on('connect', () => {
		console.log('connecting');
		socket.emit('join', null);
	});
	
	socket.on('draw', (data) => {
		handleMessage(data);
	});
};

const draw = (data) => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	for (let i = 0; i < pellets.length; i++)
	{
		let pellet = pellets[i];
		ctx.fillStyle = pellet.color;
		ctx.fillRect(pellet.x, pellet.y, pellet.width, pellet.height);
	}
	
	let keys = Object.keys(draws);
	
	for (let i = 0; i < keys.length; i++)
	{
		const drawCall = draws[keys[i]];
		const oldDrawCall = oldDraws[keys[i]];
		
		if (drawCall != null && oldDrawCall != null) {
			const time = new Date().getTime();
			
			let totalTime = drawCall.lastUpdate - oldDrawCall.lastUpdate;
			let currTime = time - lastUpdate;
			let percent = currTime / totalTime;
			
			if (percent > 1)
			{
				percent = 1;
			}
			
			let changeX = drawCall.x - oldDrawCall.x;
			let changeY = drawCall.y - oldDrawCall.y;
			let changeR = drawCall.radius - oldDrawCall.radius;
			
			ctx.fillStyle = drawCall.color;
			ctx.beginPath();
			ctx.arc(oldDrawCall.x + (changeX * percent), oldDrawCall.y + (changeY * percent),oldDrawCall.radius + (changeR * percent),0,2*Math.PI);
			ctx.fill();
		}
	}
}

const setup = () => {
	// event listeners
	window.addEventListener("keydown",function(e){
		myKeys.keydown[e.keyCode] = true;
		
		// pausing and resuming
		var char = String.fromCharCode(e.keyCode);
		if (char == "f" || char == "F"){
			cycleColor();
		}
	});
		
	window.addEventListener("keyup",function(e){
		myKeys.keydown[e.keyCode] = false;
	});
}

const cycleColor = () => {
	socket.emit('cycleColor', null);
}

const handleMessage = (data) => {
	lastUpdate = new Date().getTime();
	oldDraws = draws;
	draws = data.users;
	pellets = data.pellets;
}

const update = () => {
	checkKeys();
}

const checkKeys = () => {
	if (myKeys.keydown[myKeys.KEYBOARD.KEY_A])
	{
		socket.emit('move', { x: -3, y: 0});
	}
	if (myKeys.keydown[myKeys.KEYBOARD.KEY_D])
	{
		socket.emit('move', { x: 3, y: 0});
	}
	if (myKeys.keydown[myKeys.KEYBOARD.KEY_S])
	{
		socket.emit('move', { x: 0, y: 3});
	}
	if (myKeys.keydown[myKeys.KEYBOARD.KEY_W])
	{
		socket.emit('move', { x: 0, y: -3});
	}
}

const init = () => {
	canvas = document.getElementById("mainCanvas");
	ctx = canvas.getContext("2d");
	connectSocket();
	setup();
	setInterval(update, 1000 / 60);
	setInterval(draw, 1000 / 60);
};

window.onload = init;