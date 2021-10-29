import Format, { nl2br, br2nl } from "./format.js";
import { Jsonified as JsonifiedMap } from "../map.js";
import { Jsonified as JsonifiedItem, Side } from "../item.js";


export default class Native extends Format {
	extension = "mup";

	constructor() { super("mup", "MindMup"); }

	to(data: JsonifiedMap) {
		var root = MMtoMup(data.root);
		return JSON.stringify(root, null, 2);
	}

	from(data: string) {
		var source = JSON.parse(data);
		var root = MupToMM(source);
		root.layout = "map";

		return { root } as JsonifiedMap;
	}
}


function MupToMM(item: any) { // fixme
	var json: JsonifiedItem = {
		text: nl2br(item.title),
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
			var child = MupToMM(item.ideas[key]);
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

		json.children = data.map(item => item.child);
	}

	return json;
}

function MMtoMup(item: JsonifiedItem, side?: Side) {
	var result: any = { // fixme
		id: item.id,
		title: br2nl(item.text),
		icon: item.icon,
		attr: {} as any
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

			result.ideas[key] = MMtoMup(child, childSide);
		}
	}

	return result;
}
