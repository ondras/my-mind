MM.Command.Select = Object.create(MM.Command);
MM.Command.Select._keys = [
	{keyCode: 37},
	{keyCode: 38},
	{keyCode: 39},
	{keyCode: 40}
];
MM.Command.Select._name = "Move selection";
MM.Command.Select.execute = function(e) {
	var dirs = {
		37: "left",
		38: "top",
		39: "right",
		40: "bottom"
	}
	var dir = dirs[e.keyCode];

	var layout = MM.App.current.getLayout();
	var item = layout.pick(MM.App.current, dir);
	MM.App.select(item);
}

MM.Command.SelectRoot = Object.create(MM.Command);
MM.Command.SelectRoot._keys = [{keyCode: 36}];
MM.Command.SelectRoot._name = "Select root";
MM.Command.SelectRoot.execute = function() {
	var item = MM.App.current;
	while (item.getParent()) { item = item.getParent(); }
	MM.App.select(item);
}


/* FIXME vvv 
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
*/