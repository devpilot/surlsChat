var io = require('socket.io').listen(4000);

// client connected 
io.sockets.on('connection', function (socket) {

	socket.on('clientMessage', function(content) {
		socket.emit('serverMessage','You: '+ content);
		socket.broadcast.emit('serverMessage',socket.id + content);
		
	});
});