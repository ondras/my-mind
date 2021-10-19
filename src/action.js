MM.Action = function() {}
MM.Action.prototype.perform = function() {}
MM.Action.prototype.undo = function() {}

MM.Action.Multi = function(actions) {
	this._actions = actions;
}
MM.Action.Multi.prototype = Object.create(MM.Action.prototype);
MM.Action.Multi.prototype.perform = function() {
	this._actions.forEach(function(action) {
		action.perform();
	});
}
MM.Action.Multi.prototype.undo = function() {
	this._actions.slice().reverse().forEach(function(action) {
		action.undo();
	});
}

MM.Action.InsertNewItem = function(parent, index) {
	this._parent = parent;
	this._index = index;
	this._item = new MM.Item();
}
MM.Action.InsertNewItem.prototype = Object.create(MM.Action.prototype);
MM.Action.InsertNewItem.prototype.perform = function() {
	this._parent.expand(); /* FIXME remember? */
	this._parent.insertChild(this._item, this._index);
	MM.App.select(this._item);
}
MM.Action.InsertNewItem.prototype.undo = function() {
	this._parent.removeChild(this._item);
	MM.App.select(this._parent);
}

MM.Action.AppendItem = function(parent, item) {
	this._parent = parent;
	this._item = item;
}
MM.Action.AppendItem.prototype = Object.create(MM.Action.prototype);
MM.Action.AppendItem.prototype.perform = function() {
	this._parent.insertChild(this._item);
	MM.App.select(this._item);
}
MM.Action.AppendItem.prototype.undo = function() {
	this._parent.removeChild(this._item);
	MM.App.select(this._parent);
}

MM.Action.RemoveItem = function(item) {
	this._item = item;
	this._parent = item.parent;
	this._index = this._parent.children.indexOf(this._item);
}
MM.Action.RemoveItem.prototype = Object.create(MM.Action.prototype);
MM.Action.RemoveItem.prototype.perform = function() {
	this._parent.removeChild(this._item);
	MM.App.select(this._parent);
}
MM.Action.RemoveItem.prototype.undo = function() {
	this._parent.insertChild(this._item, this._index);
	MM.App.select(this._item);
}

MM.Action.MoveItem = function(item, newParent, newIndex, newSide) {
	this._item = item;
	this._newParent = newParent;
	this._newIndex = (arguments.length < 3 ? null : newIndex);
	this._newSide = newSide || "";
	this._oldParent = item.parent;
	this._oldIndex = this._oldParent.children.indexOf(item);
	this._oldSide = item.side;
}
MM.Action.MoveItem.prototype = Object.create(MM.Action.prototype);
MM.Action.MoveItem.prototype.perform = function() {
	this._item.side = this._newSide;
	if (this._newIndex === null) {
		this._newParent.insertChild(this._item);
	} else {
		this._newParent.insertChild(this._item, this._newIndex);
	}
	MM.App.select(this._item);
}
MM.Action.MoveItem.prototype.undo = function() {
	this._item.side = this._oldSide;
	this._oldParent.insertChild(this._item, this._oldIndex);
	MM.App.select(this._newParent);
}

MM.Action.Swap = function(item, diff) {
	this._item = item;
	this._parent = item.parent;

	var children = this._parent.children;
	var sibling = this._parent.resolvedLayout.pickSibling(this._item, diff);

	this._sourceIndex = children.indexOf(this._item);
	this._targetIndex = children.indexOf(sibling);
}
MM.Action.Swap.prototype = Object.create(MM.Action.prototype);
MM.Action.Swap.prototype.perform = function() {
	this._parent.insertChild(this._item, this._targetIndex);
}
MM.Action.Swap.prototype.undo = function() {
	this._parent.insertChild(this._item, this._sourceIndex);
}

MM.Action.SetLayout = function(item, layout) {
	this._item = item;
	this._layout = layout;
	this._oldLayout = item.layout;
}
MM.Action.SetLayout.prototype = Object.create(MM.Action.prototype);
MM.Action.SetLayout.prototype.perform = function() {
	this._item.layout = this._layout;
}
MM.Action.SetLayout.prototype.undo = function() {
	this._item.layout = this._oldLayout;
}

MM.Action.SetShape = function(item, shape) {
	this._item = item;
	this._shape = shape;
	this._oldShape = item.shape;
}
MM.Action.SetShape.prototype = Object.create(MM.Action.prototype);
MM.Action.SetShape.prototype.perform = function() {
	this._item.shape = this._shape;
}
MM.Action.SetShape.prototype.undo = function() {
	this._item.shape = this._oldShape;
}

MM.Action.SetColor = function(item, color) {
	this._item = item;
	this._color = color;
	this._oldColor = item.color;
}
MM.Action.SetColor.prototype = Object.create(MM.Action.prototype);
MM.Action.SetColor.prototype.perform = function() {
	this._item.color = this._color;
}
MM.Action.SetColor.prototype.undo = function() {
	this._item.color = this._oldColor;
}

MM.Action.SetText = function(item, text) {
	this._item = item;
	this._text = text;
	this._oldText = item.text;
	this._oldValue = item.value; /* adjusting text can also modify value! FIXME why/when?*/
}
MM.Action.SetText.prototype = Object.create(MM.Action.prototype);
MM.Action.SetText.prototype.perform = function() {
	this._item.text = this._text;
	var numText = Number(this._text);
	if (numText == this._text) { this._item.value = numText; }
}
MM.Action.SetText.prototype.undo = function() {
	this._item.text = this._oldText;
	this._item.value = this._oldValue;
}

MM.Action.SetValue = function(item, value) {
	this._item = item;
	this._value = value;
	this._oldValue = item.value;
}
MM.Action.SetValue.prototype = Object.create(MM.Action.prototype);
MM.Action.SetValue.prototype.perform = function() {
	this._item.value = this._value;
}
MM.Action.SetValue.prototype.undo = function() {
	this._item.value = this._oldValue;
}

MM.Action.SetStatus = function(item, status) {
	this._item = item;
	this._status = status;
	this._oldStatus = item.status;
}
MM.Action.SetStatus.prototype = Object.create(MM.Action.prototype);
MM.Action.SetStatus.prototype.perform = function() {
	this._item.status = this._status;
}
MM.Action.SetStatus.prototype.undo = function() {
	this._item.status = this._oldStatus;
}

MM.Action.SetIcon = function(item, icon) {
	this._item = item;
	this._icon = icon;
	this._oldIcon = item.icon;
}
MM.Action.SetIcon.prototype = Object.create(MM.Action.prototype);
MM.Action.SetIcon.prototype.perform = function() {
	this._item.icon = this._icon;
}
MM.Action.SetIcon.prototype.undo = function() {
	this._item.icon = this._oldIcon;
}

MM.Action.SetSide = function(item, side) {
	this._item = item;
	this._side = side;
	this._oldSide = item.side;
}
MM.Action.SetSide.prototype = Object.create(MM.Action.prototype);
MM.Action.SetSide.prototype.perform = function() {
	this._item.side = this._side;
	this._item.map.update();
}
MM.Action.SetSide.prototype.undo = function() {
	this._item.side = this._oldSide;
	this._item.map.update();
}
