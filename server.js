#!/bin/env node
var io = require('socket.io').listen(4000);

var userCount = 0;
var userAvailable = new Array();

io.set('log level',1);

// client connected 
io.sockets.on('connection', function (socket) {

	userCount++; // increse client count
	socket.emit('userCount', userCount);
	socket.broadcast.emit('userCount', userCount);
	console.log(Date(Date.now()) + ' Connected User ' + userCount);

	userAvailable.push(socket.id); //storing available users

	// receive and broadcast message
	socket.on('clientMessage', function(content) {
		socket.emit('serverMessage','You: '+ content);
		socket.broadcast.emit('serverMessage','Stranger ' + content);
	});

	// user typing
	socket.on('typing',function(){
		socket.broadcast.emit('typing');
	});

	// client disconnected
	socket.on('disconnect', function () {
		userCount--; //decrese client count 
		socket.broadcast.emit('userCount', userCount);
		console.log(Date(Date.now()) + ' Connected User ' + userCount);
	});
});