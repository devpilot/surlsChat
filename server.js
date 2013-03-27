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

function randomHandeler(userAvailable, socket){

	//send connecting...
	socket.emit('syscmd','connecting');

	// Selecting random partner
	function randPartner(queue, callback){
		if (queue.length > 1){
			var k = Math.round(Math.random() * (queue.length - 1));
			if(queue[k] == socket.id){
			  return randPartner(queue,callback);
	    	} else {
	    		//clearTimeout(tO);
	    	   callback(queue[k]);
	    	}
	    } else {
	    	// var tO = setTimeout(function(){
	    	// 	console.log("user waiting...");
	    	// 	return randPartner(queue,callback);
	    	// },200);
	    }
	}

	randPartner(userAvailable,function(partner,pid){

		// remove users from userAvailable
		userAvailable.splice(pid,1);
		for(key in userAvailable){
			if(userAvailable[key] === socket.id)
				userAvailable.splice(key,1);
		}
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
}