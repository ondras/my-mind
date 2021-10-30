import FreeMind from "./freemind.js";
import { nl2br, br2nl } from "./format.js";
import { Jsonified } from "../item.js";


export default class MMA extends FreeMind {
	extension = "mma";

	constructor() { super("mma", "Mind Map Architect"); }

	protected parseAttributes(node: Element, parent: Jsonified) {
		var json: Jsonified = {
			children: [],
			text: nl2br(node.getAttribute("title") || ""),
			shape: "box"
		};

		if (node.getAttribute("expand") == "false") { json.collapsed = 1; }

		var direction = node.getAttribute("direction");
		if (direction == "0") { json.side = "left"; }
		if (direction == "1") { json.side = "right"; }

		var color = node.getAttribute("color");
		if (color) {
			var re = color.match(/^#(....)(....)(....)$/);
			if (re) {
				let parts = re.slice(1)
								.map(str => parseInt(str, 16) >> 8)
								.map(num => Math.round(num/17))
								.map(num => num.toString(16));
				json.color = "#" + parts.join("");
			}
		}

		json.icon = node.getAttribute("icon") || "";

		return json;
	}

	protected serializeAttributes = function(doc: XMLDocument, json: Jsonified) {
		var elm = doc.createElement("node");
		elm.setAttribute("title", br2nl(json.text));
		elm.setAttribute("expand", json.collapsed ? "false" : "true");

		if (json.side) { elm.setAttribute("direction", json.side == "left" ? "0" : "1"); }
		if (json.color) {
			var parts = json.color.match(/^#(.)(.)(.)$/)!;
			var r = new Array(5).join(parts[1]);
			var g = new Array(5).join(parts[2]);
			var b = new Array(5).join(parts[3]);
			elm.setAttribute("color", "#" + [r,g,b].join(""));
		}
		if (json.icon) {
			elm.setAttribute("icon", json.icon);
		}

		return elm;
	}
}
