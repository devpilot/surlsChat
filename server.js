#!/bin/env node

var io = require('socket.io').listen(4000);
var mymod = require('./userhandeler');

var userCount = 0;

io.set('log level',1);

// client connected 
io.sockets.on('connection', function (socket) {

	userCount++; // increse client count
	socket.emit('userCount', userCount);
	socket.broadcast.emit('userCount', userCount);
	console.log(Date(Date.now()) + ' Connected User ' + userCount);

	mymod.addUser(socket.id);

	//send connecting...
	socket.emit('syscmd','connecting');

	// starting new chat
	mymod.makeChat(socket.id, function(partner){

		// Assign partners to each
		socket.set('partner', partner, function(err) {
			if (err) { throw err; }
		});
		io.sockets.socket(partner).set('partner', socket.id, function(err) {
			if (err) { throw err; }
		});

		//send connected...
		socket.emit('syscmd','connected');
		io.sockets.socket(partner).emit('syscmd','connected');
	});
	
	socket.get('partner', function(err, partner) {console.log(socket.id +' - '+partner);});

	// receive and forward message
	socket.on('clientMessage', function(content) {
		socket.emit('serverMessage','You: '+ content);
		socket.get('partner', function(err, partner) {
			io.sockets.socket(partner).emit('serverMessage','Stranger ' + content);
		});
	});

	// user typing
	socket.on('typing',function(){
		socket.get('partner', function(err, partner) {
			io.sockets.socket(partner).emit('typing');
		});
	});

	// client disconnected
	socket.on('disconnect', function () {
		userCount--; //decrese client count 
		socket.broadcast.emit('userCount', userCount);
		console.log(Date(Date.now()) + ' Connected User ' + userCount);
	});
});