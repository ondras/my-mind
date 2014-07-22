/**
 * Wait for all these promises to complete. One failed => this fails too.
 */
Promise.all = Promise.when = function(all) {
	var promise = new this();
	var counter = 0;
	var results = [];

	for (var i=0;i<all.length;i++) {
		counter++;
		all[i].then(function(index, result) {
			results[index] = result;
			counter--;
			if (!counter) { promise.fulfill(results); }
		}.bind(null, i), function(reason) {
			counter = 1/0;
			promise.reject(reason);
		});
	}

	return promise;
}

/**
 * Promise-based version of setTimeout
 */
Promise.setTimeout = function(ms) {
	var promise = new this();
	setTimeout(function() { promise.fulfill(); }, ms);
	return promise;
}

/**
 * Promise-based version of addEventListener
 */
Promise.event = function(element, event, capture) {
	var promise = new this();
	var cb = function(e) {
		element.removeEventListener(event, cb, capture);
		promise.fulfill(e);
	}
	element.addEventListener(event, cb, capture);
	return promise;
}

/**
 * Promise-based wait for CSS transition end
 */
Promise.transition = function(element) {
	if ("transition" in element.style) {
		return this.event(element, "transitionend", false);
	} else if ("webkitTransition" in element.style) {
		return this.event(element, "webkitTransitionEnd", false);
	} else {
		return new this().fulfill();
	}
}

/**
 * Promise-based version of XMLHttpRequest::send
 */
Promise.send = function(xhr, data) {
	var promise = new this();
	xhr.addEventListener("readystatechange", function(e) {
		if (e.target.readyState != 4) { return; }
		if (e.target.status.toString().charAt(0) == "2") {
			promise.fulfill(e.target);
		} else {
			promise.reject(e.target);
		}
	});
	xhr.send(data);
	return promise;
}

Promise.worker = function(url, message) {
	var promise = new this();
	var worker = new Worker(url);
	Promise.event(worker, "message").then(function(e) {
		promise.fulfill(e.data);
	});
	Promise.event(worker, "error").then(function(e) {
		promise.reject(e.message);
	});
	worker.postMessage(message);
	return promise;
}
