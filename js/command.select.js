MM.Command.Select = Object.create(MM.Command, {
	label: {value: "Move selection"},
	keys: {value: [
		{keyCode: 38},
		{keyCode: 37},
		{keyCode: 40},
		{keyCode: 39}
	]} 
});
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

MM.Command.SelectRoot = Object.create(MM.Command, {
	label: {value: "Select root"},
	keys: {value: [{keyCode: 36}]}
});
MM.Command.SelectRoot.execute = function() {
	var item = MM.App.current;
	while (item.getParent()) { item = item.getParent(); }
	MM.App.select(item);
}

MM.Command.Pan = Object.create(MM.Command, {
	label: {value: "Pan the map"},
	keys: {value: [
		{keyCode: "W".charCodeAt(0), ctrlKey:false},
		{keyCode: "A".charCodeAt(0), ctrlKey:false},
		{keyCode: "S".charCodeAt(0), ctrlKey:false},
		{keyCode: "D".charCodeAt(0), ctrlKey:false}
	]},
	chars: {value: []}
});
MM.Command.Pan.execute = function(e) {
	var ch = String.fromCharCode(e.keyCode);
	var index = this.chars.indexOf(ch);
	if (index > -1) { return; }
	
	if (!this.chars.length) { 
		window.addEventListener("keyup", this);
		this.interval = setInterval(this._step.bind(this), 50);
	}
	
	this.chars.push(ch);
	this._step();
}

MM.Command.Pan._step = function() {	
	var dirs = {
		"W": [0, 1],
		"A": [1, 0],
		"S": [0, -1],
		"D": [-1, 0]
	}
	var offset = [0, 0];
	
	this.chars.forEach(function(ch) {
		offset[0] += dirs[ch][0];
		offset[1] += dirs[ch][1];
	});
	
	MM.App.map.moveBy(10*offset[0], 10*offset[1]);
}

MM.Command.Pan.handleEvent = function(e) {
	var ch = String.fromCharCode(e.keyCode);
	var index = this.chars.indexOf(ch);
	if (index > -1) {
		this.chars.splice(index, 1);
		if (!this.chars.length) {
			window.removeEventListener("keyup", this);
			clearInterval(this.interval);
		}
	}
}
