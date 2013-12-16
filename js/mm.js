var MM = {
	_subscribers: {},
	
	publish: function(message, publisher) {
		var subscribers = this._subscribers[message] || [];
		subscribers.forEach(function(subscriber) {
			subscriber.handle(message, publisher);
		});
	},
	
	subscribe: function(message, subscriber) {
		if (!(message in this._subscribers)) {
			this._subscribers[message] = [];
		}
		this._subscribers[message].push(subscriber);
	},
	
	unsubscribe: function(message, subscriber) {
		var index = this._subscribers[message].indexOf(subscriber);
		this._subscribers[message].splice(index, 1);
	}
};
