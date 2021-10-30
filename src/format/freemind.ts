import Format, { nl2br, br2nl } from "./format.js";
import { Jsonified as JsonifiedMap } from "../map.js";
import { Jsonified as JsonifiedItem, Side } from "../item.js";


export default class Native extends Format {
	extension = "mm";
	mime = "application/x-freemind";

	constructor(id="freemind", label="FreeMind") { super(id, label); }

	to(data: JsonifiedMap) {
		var doc = document.implementation.createDocument(null, null, null);
		var map = doc.createElement("map");

		map.setAttribute("version", "1.0.1");
		map.appendChild(this.serializeItem(doc, data.root));

		doc.appendChild(map);
		var serializer = new XMLSerializer();
		return serializer.serializeToString(doc);
	}

	from(data: string): JsonifiedMap {
		var parser = new DOMParser();
		var doc = parser.parseFromString(data, "application/xml");
		if (doc.documentElement.nodeName.toLowerCase() == "parsererror") {
			throw new Error(doc.documentElement.textContent || "");
		}

		var root = doc.documentElement.getElementsByTagName("node")[0];
		if (!root) { throw new Error("No root node found"); }

		var json: JsonifiedMap = {
			root: this.parseNode(root, {shape:"underline"})
		};
		json.root.layout = "map";
		json.root.shape = "ellipse";

		return json;
	}

	protected serializeItem(doc: XMLDocument, json: JsonifiedItem) {
		var elm = this.serializeAttributes(doc, json);

		(json.children || []).forEach(child => {
			elm.appendChild(this.serializeItem(doc, child));
		});

		return elm;
	}

	protected serializeAttributes(doc: XMLDocument, json: JsonifiedItem) {
		var elm = doc.createElement("node");
		elm.setAttribute("TEXT", br2nl(json.text));
		json.id && elm.setAttribute("ID", json.id);

		if (json.side) { elm.setAttribute("POSITION", json.side); }
		if (json.shape == "box") { elm.setAttribute("STYLE", "bubble"); }
		if (json.collapsed) { elm.setAttribute("FOLDED", "true"); }

		if (json.notes) {
			var notesElm = doc.createElement("richcontent");
			notesElm.setAttribute("TYPE", "NOTE");
			// note: the freemind file format isn't very good.
			notesElm.appendChild(doc.createCDATASection('<html><head></head><body>' + json.notes + '</body></html>'));
			elm.appendChild(notesElm);
		}

		return elm;
	}

	protected parseNode(node: Element, parent: Partial<JsonifiedItem>) {
		var json = this.parseAttributes(node, parent);

		for (var i=0;i<node.childNodes.length;i++) {
			var child = node.childNodes[i];
			if (child instanceof Element && child.nodeName.toLowerCase() == "node") {
				json.children!.push(this.parseNode(child, json));
			}
		}

		return json;
	}

	protected parseAttributes(node: Element, parent: Partial<JsonifiedItem>) {
		var json: JsonifiedItem = {
			children: [],
			text: nl2br(node.getAttribute("TEXT") || ""),
			id: node.getAttribute("ID")!
		};

		var position = node.getAttribute("POSITION");
		if (position) { json.side = position as Side; }

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
					if (child.getAttribute("TYPE") == "NOTE") {
						var body = child.querySelector("body > *");
						if (body) {
							var serializer = new XMLSerializer();
							json.notes = serializer.serializeToString(body).trim();
						}
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
}
