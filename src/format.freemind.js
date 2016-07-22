MM.Format.FreeMind = Object.create(MM.Format, {
	id: {value: "freemind"},
	label: {value: "FreeMind"},
	extension: {value: "mm"},
	mime: {value: "application/x-freemind"}
});

MM.Format.FreeMind.to = function(data) {
	var doc = document.implementation.createDocument("", "", null);
	var map = doc.createElement("map");

	map.setAttribute("version", "0.9.0");
	map.appendChild(this._serializeItem(doc, data.root));

	doc.appendChild(map);
	var serializer = new XMLSerializer();
	return serializer.serializeToString(doc);
}

MM.Format.FreeMind.from = function(data) {
	var parser = new DOMParser();
	var doc = parser.parseFromString(data, "application/xml");
	if (doc.documentElement.nodeName.toLowerCase() == "parsererror") { throw new Error(doc.documentElement.textContent); }

	var root = doc.documentElement.getElementsByTagName("node")[0];
	if (!root) { throw new Error("No root node found"); }

	var json = {
		root: this._parseNode(root, {shape:"underline"})
	};
	json.root.layout = "map";
	json.root.shape = "ellipse";

	return json;
}

MM.Format.FreeMind._serializeItem = function(doc, json) {
	var elm = this._serializeAttributes(doc, json);

	(json.children || []).forEach(function(child) {
		elm.appendChild(this._serializeItem(doc, child));
	}, this);

	return elm;
}

MM.Format.FreeMind._serializeAttributes = function(doc, json) {
	var elm = doc.createElement("node");
	elm.setAttribute("TEXT", MM.Format.br2nl(json.text));
	elm.setAttribute("ID", json.id);

	if (json.side) { elm.setAttribute("POSITION", json.side); }
	if (json.shape == "box") { elm.setAttribute("STYLE", "bubble"); }
	if (json.collapsed) { elm.setAttribute("FOLDED", "true"); }

	return elm;
}

MM.Format.FreeMind._parseNode = function(node, parent) {
	var json = this._parseAttributes(node, parent);

	for (var i=0;i<node.childNodes.length;i++) {
		var child = node.childNodes[i];
		if (child.nodeName.toLowerCase() == "node") {
			json.children.push(this._parseNode(child, json));
		}
	}

	return json;
}

MM.Format.FreeMind._parseAttributes = function(node, parent) {
	var json = {
		children: [],
		text: MM.Format.nl2br(node.getAttribute("TEXT") || ""),
		id: node.getAttribute("ID")
	};

	var position = node.getAttribute("POSITION");
	if (position) { json.side = position; }

	var style = node.getAttribute("STYLE");
	if (style == "bubble") {
		json.shape = "box";
	} else {
		json.shape = parent.shape;
	}

	if (node.getAttribute("FOLDED") == "true") { json.collapsed = 1; }

	var children = node.children;
	for (var i=0;i<children.length;i++) {
		var child = children[i];
		switch (child.nodeName.toLowerCase()) {
			case "richcontent":
				var body = child.querySelector("body > *");
				if (body) {
					var serializer = new XMLSerializer();
					json.text = serializer.serializeToString(body).trim();
				}
			break;

			case "font":
				if (child.getAttribute("ITALIC") == "true") { json.text = "<i>" + json.text + "</i>"; }
				if (child.getAttribute("BOLD") == "true") { json.text = "<b>" + json.text + "</b>"; }
			break;
		}
	}

	return json;
}
