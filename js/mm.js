var MM = {
	_subscribers: {},
	subscribe: function(event, subscriber) {
		if (!(event in this._subscribers)) {
			this._subscribers[event] = [];
		}
		this._subscribers[event].push(subscriber);
	},
	unsubscribe: function(event, subscriber) {
		var subscribers = this._subscribers[event];
		var index = subscribers.indexOf(subscriber);
		subscribers.splice(index, 1);
	},
	publish: function(event, publisher) {
		var subscribers = this._subscribers[event] || [];
		for (var i=0;i<subscribers.length;i++) {
			subscribers[i].event(event, publisher);
		}
	}
}
