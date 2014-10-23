if (!Function.prototype.bind) {
	Function.prototype.bind = function(thisObj) {
		var fn = this;
		var args = Array.prototype.slice.call(arguments, 1);
		return function() {
			return fn.apply(thisObj, args.concat(Array.prototype.slice.call(arguments)));
		}
	}
};

var MM = {
	_subscribers: {},
	
	publish: function(message, publisher, data) {
		var subscribers = this._subscribers[message] || [];
		subscribers.forEach(function(subscriber) {
			subscriber.handleMessage(message, publisher, data);
		});
	},
	
	subscribe: function(message, subscriber) {
		if (!(message in this._subscribers)) {
			this._subscribers[message] = [];
		}
		var index = this._subscribers[message].indexOf(subscriber);
		if (index == -1) { this._subscribers[message].push(subscriber); }
	},
	
	unsubscribe: function(message, subscriber) {
		var index = this._subscribers[message].indexOf(subscriber);
		if (index > -1) { this._subscribers[message].splice(index, 1); }
	},
	
	generateId: function() {
		var str = "";
		for (var i=0;i<8;i++) {
			var code = Math.floor(Math.random()*26);
			str += String.fromCharCode("a".charCodeAt(0) + code);
		}
		return str;
	}
};
