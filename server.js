#!/bin/env node

var io = require('socket.io').listen(4000);
var uh = require('./userhandler');

var userCount = 0;

io.set('log level',1);

// client connected 
io.sockets.on('connection', function (socket){

	userCount++; // increse client count
	socket.emit('userCount', userCount);
	socket.broadcast.emit('userCount', userCount);
	console.log(Date(Date.now()) + ' Connected User ' + userCount);
	
	//socket.get('partner', function(err, partner) {console.log(socket.id +' - '+partner);});

	// receive and forward message
	socket.on('clientMessage', function(content){
		socket.emit('serverMessage','<span class="you">*&#9829;*&#9829;**Me**&#9829;*&#9829;*</span> '+ content);
		socket.get('partner', function(err, partner) {
			io.sockets.socket(partner).emit('serverMessage','<span class="stranger">*&#9829;*Stranger*&#9829;*</span> ' + content);
		});
	});

	// user typing
	socket.on('typing',function(){
		socket.get('partner', function(err, partner){
			io.sockets.socket(partner).emit('typing');
		});
	});

	// client disconnected
	socket.on('disconnect', function(){

		uh.removeSelf(socket.id); // remove self when not in a active chat

		// getting partner id and sending disconnect
		socket.get('partner', function(err, partner){
			io.sockets.socket(partner).emit('syscmd','end');
		});

		userCount--; //decrese client count 
		socket.broadcast.emit('userCount', userCount);
		console.log(Date(Date.now()) + ' Connected User ' + userCount);
	});

	//user interaction
	socket.on('syscmd', function(cmd){
        switch (cmd){
            case 'end':
            	socket.emit('syscmd','end');
            	socket.get('partner', function(err, partner){
            		io.sockets.socket(partner).emit('syscmd','end');
            	});                
                break;
            case 'new':
            	uh.addUser(socket.id);
            	//send connecting...
				socket.emit('syscmd','connecting');
            	startChat();
                break;
            default:
        };
    });

    function startChat(){
    	uh.makeChat(socket.id, function(partner){
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
    };
});