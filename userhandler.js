function userHandler(){

	var userAvailable = [];
	var self = this;
	
	// storing available users
	this.addUser = function(id){
		self.removeSelf(id); //remove same user if already exist
		userAvailable.push(id);
	};

	// remove partner from queue
	var removePartner = function(id){
		userAvailable.splice(id,1);
	};

	// remove self from queue
	this.removeSelf = function(id){
		for(key in userAvailable){
			if(userAvailable[key] === id)
				userAvailable.splice(key,1);
		}
	};
	
	// Selecting random partner
	var selectPartner = function(socketId, fn){
		var queue = userAvailable;
		if (queue.length > 1){
			var key = Math.round(Math.random() * (queue.length - 1));
			if(queue[key] == socketId){
			  return selectPartner(socketId,fn);
	    	} else {
	    	   fn(queue[key],key);
	    	}
	    }
	};
	this.makeChat = function(socketId,fn){
		selectPartner(socketId, function(partner,pid){
			removePartner(pid);
			self.removeSelf(socketId);
			fn(partner);
		});
	};
}
module.exports = new userHandler;