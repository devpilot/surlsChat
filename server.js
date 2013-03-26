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

	randomHandeler(userAvailable, socket);
	socket.get('partner', function(err, partner) {console.log(socket.id +' - '+partner);});

	// receive and broadcast message
	socket.on('clientMessage', function(content) {
		socket.emit('serverMessage','You: '+ content);
		socket.get('partner', function(err, partner) {
			io.sockets.socket(partner).emit('serverMessage','Stranger ' + content);
		});
		// socket.broadcast.emit('serverMessage','Stranger ' + content);
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

function randomHandeler(userAvailable, socket){

	//send connecting...
	socket.emit('syscmd','connecting');

	// Selecting random partner
	function randPartner(queue, callback){
		if (queue.length > 1){
			var k = Math.round(Math.random() * (queue.length - 1));
			if(queue[k] == socket){
			  return randPartner(queue,callback);
	    	} else {
	    		clearTimeout(tO);
	    	   callback(queue[k]);
	    	}
	    } else {
	    	var tO = setTimeout(function(){
	    		return randPartner(queue,callback);
	    	},200);
	    }
	}

	// Assign partners to each
	randPartner(userAvailable,function(partner){
		socket.set('partner', partner, function(err) {
			if (err) { throw err; }
		});
		io.sockets.socket(partner).set('partner', socket.id, function(err) {
			if (err) { throw err; }
		});

		//send connected...
		socket.emit('syscmd','connected');
	});
}