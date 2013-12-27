MM.Notification = function() {
	this._visible = false;
	this._node = document.createElement("div");
	this._node.className = "notification visible";
}
MM.Notification.DELAY = 3000;

MM.Notification.prototype.setText = function(text) {
	this._node.innerHTML = text;
	return this;
}

MM.Notification.prototype.show = function() {
	if (this._visible) { return; }
	this._visible = true;
	document.body.appendChild(this._node);
	
	setTimeout(this.hide.bind(this), this.constructor.DELAY);
	return this;
}

MM.Notification.prototype.hide = function() {
	if (!this._visible) { return; }
	this._visible = false;
	
	Promise.transition(this._node).then(function() {
		this._node.parentNode.removeChild(this._node);
	}.bind(this));
	
	this._node.classList.remove("visible");

	return this;
}
