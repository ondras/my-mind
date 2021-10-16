MM.Format.Mup = Object.create(MM.Format, {
	id: {value: "mup"},
	label: {value: "MindMup"},
	extension: {value: "mup"}
});

MM.Format.Mup.to = function(data) {
	var root = this._MMtoMup(data.root);
	return JSON.stringify(root, null, 2);
}

MM.Format.Mup.from = function(data) {
	var source = JSON.parse(data);
	var root = this._MupToMM(source);
	root.layout = "map";

	var map = {
		root: root
	}

	return map;
}

MM.Format.Mup._MupToMM = function(item) {
	var json = {
		text: MM.Format.nl2br(item.title),
		id: item.id,
		shape: "box",
		icon: item.icon
	}

	if (item.attr && item.attr.style && item.attr.style.background) {
		json.color = item.attr.style.background;
	}

	if (item.attr && item.attr.collapsed) {
		json.collapsed = 1;
	}

	if (item.ideas) {
		var data = [];
		for (var key in item.ideas) {
			var child = this._MupToMM(item.ideas[key]);
			var num = parseFloat(key);
			child.side = (num < 0 ? "left" : "right");
			data.push({
				child: child,
				num: num
			});
		}

		data.sort(function(a, b) {
			return a.num-b.num;
		});

		json.children = data.map(function(item) { return item.child; });
	}

	return json;
}

MM.Format.Mup._MMtoMup = function(item, side) {
	var result = {
		id: item.id,
		title: MM.Format.br2nl(item.text),
		icon: item.icon,
		attr: {}
	}
	if (item.color) {
		result.attr.style = {background:item.color};
	}
	if (item.collapsed) {
		result.attr.collapsed = true;
	}

	if (item.children) {
		result.ideas = {};

		for (var i=0;i<item.children.length;i++) {
			var child = item.children[i];
			var childSide = side || child.side;

			var key = i+1;
			if (childSide == "left") { key *= -1; }

			result.ideas[key] = this._MMtoMup(child, childSide);
		}
	}

	return result;
}
