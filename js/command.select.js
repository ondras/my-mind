MM.Command.Select = function() {
	MM.Command.call(this);
}
MM.Command.Select.prototype = Object.create(MM.Command.prototype);
MM.Command.Select.prototype._move = function(diff) {
	var item = MM.App.current;
	var parent = item.getParent();
	var children = parent.getChildren(item.getSide());
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
MM.Command.Select.prototype._child = function(side) {
	var item = MM.App.current;
	var children = item.getChildren(side);
	if (!children.length) { return; }

	MM.App.select(children[0]);
}

MM.Command.SelectLeft = function() {
	MM.Command.Select.call(this);
	this._keys.push({keyCode: 37, type:"keydown"});
}
MM.Command.SelectLeft.prototype = Object.create(MM.Command.Select.prototype);
MM.Command.SelectLeft.prototype.isValid = function() {
	/* FIXME */return true;
};
MM.Command.SelectLeft.prototype.execute = function() {
	var item = MM.App.current;
	if (item.getRoot() == item || item.getSide() == "left") {
		this._child("left");
	} else {
		this._parent();
	}
}

MM.Command.SelectRight = function() {
	MM.Command.Select.call(this);
	this._keys.push({keyCode: 39, type:"keydown"});
}
MM.Command.SelectRight.prototype = Object.create(MM.Command.Select.prototype);
MM.Command.SelectRight.prototype.isValid = function() {
	/* FIXME */return true;
};
MM.Command.SelectRight.prototype.execute = function() {
	var item = MM.App.current;
	if (item.getRoot() == item || item.getSide() == "right") {
		this._child("right");
	} else {
		this._parent();
	}
}

MM.Command.SelectUp = function() {
	MM.Command.Select.call(this);
	this._keys.push({keyCode: 38, type:"keydown"});
}
MM.Command.SelectUp.prototype = Object.create(MM.Command.Select.prototype);
MM.Command.SelectUp.prototype.execute = function() {
	return this._move(-1);
};

MM.Command.SelectDown = function() {
	MM.Command.Select.call(this);
	this._keys.push({keyCode: 40, type:"keydown"});
}
MM.Command.SelectDown.prototype = Object.create(MM.Command.Select.prototype);
MM.Command.SelectDown.prototype.execute = function() {
	return this._move(+1);
};
