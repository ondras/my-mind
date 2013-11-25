MM.Command.Select = function() {
	MM.Command.call(this);
}
MM.Command.Select.prototype = Object.create(MM.Command.prototype);
MM.Command.Select.prototype._move = function(diff) {
	var item = MM.App.current;
	var parent = item.getParent();
	if (!parent) { return; }
	/* FIXME left/right */
	var children = parent.getChildren();
	var index = children.indexOf(item);
	index += diff;
	index = (index+children.length) % children.length;
	MM.App.select(children[index]);
}
MM.Command.Select.prototype._parent = function() {
	var item = MM.App.current;
	var parent = item.getParent();
	if (!parent) { return; }
	
	MM.App.select(parent);
}
MM.Command.Select.prototype._child = function() {
	var item = MM.App.current;
	var children = item.getChildren();
	if (!children.length) { return; }

	MM.App.select(children[0]);
}

MM.Command.SelectRoot = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 36});
}
MM.Command.SelectRoot.prototype = Object.create(MM.Command.prototype);
MM.Command.SelectRoot.prototype.execute = function() {
	var item = MM.App.current;
	while (item.getParent()) { item = item.getParent(); }
	MM.App.select(item);
}

MM.Command.SelectFirst = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 33});
}
MM.Command.SelectFirst.prototype = Object.create(MM.Command.prototype);
MM.Command.SelectFirst.prototype.execute = function() {
	var parent = MM.App.current.getParent();
	if (!parent) { return; }
	var children = parent.getChildren();
	MM.App.select(children[0]);
}

MM.Command.SelectLast = function() {
	MM.Command.call(this);
	this._keys.push({keyCode: 34});
}
MM.Command.SelectLast.prototype = Object.create(MM.Command.prototype);
MM.Command.SelectLast.prototype.execute = function() {
	var parent = MM.App.current.getParent();
	if (!parent) { return; }
	var children = parent.getChildren();
	MM.App.select(children[children.length-1]);
}

MM.Command.SelectLeft = function() {
	MM.Command.Select.call(this);
	this._keys.push({keyCode: 37});
}
MM.Command.SelectLeft.prototype = Object.create(MM.Command.Select.prototype);
MM.Command.SelectLeft.prototype.execute = function() {
	var item = MM.App.current;
	if (!item.getParent() || item.getSide() == "left") {
		this._child();
	} else {
		this._parent();
	}
}

MM.Command.SelectRight = function() {
	MM.Command.Select.call(this);
	this._keys.push({keyCode: 39});
}
MM.Command.SelectRight.prototype = Object.create(MM.Command.Select.prototype);
MM.Command.SelectRight.prototype.execute = function() {
	var item = MM.App.current;
	if (!item.getParent() || item.getSide() == "right") {
		this._child();
	} else {
		this._parent();
	}
}

MM.Command.SelectUp = function() {
	MM.Command.Select.call(this);
	this._keys.push({keyCode: 38});
}
MM.Command.SelectUp.prototype = Object.create(MM.Command.Select.prototype);
MM.Command.SelectUp.prototype.execute = function() {
	return this._move(-1);
};

MM.Command.SelectDown = function() {
	MM.Command.Select.call(this);
	this._keys.push({keyCode: 40});
}
MM.Command.SelectDown.prototype = Object.create(MM.Command.Select.prototype);
MM.Command.SelectDown.prototype.execute = function() {
	return this._move(+1);
};
