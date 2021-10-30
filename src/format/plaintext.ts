import Format from "./format.js";
import { Jsonified as JsonifiedMap } from "../map.js";
import { Jsonified as JsonifiedItem } from "../item.js";


export default class Plaintext extends Format {
	extension = "txt";
	mime = "application/vnd.mymind+txt";

	constructor() { super("plaintext", "Plain text"); }

	to(data: JsonifiedMap | JsonifiedItem) {
		return serializeItem("root" in data ? data.root : data);
	}

	from(data: string) {
		var lines = data.split("\n").filter(function(line) {
			return line.match(/\S/);
		});

		var items = parseItems(lines);
		let result: JsonifiedMap;

		if (items.length == 1) {
			result = {
				root: items[0]
			}
		} else {
			result = {
				root: {
					text: "",
					children: items
				}
			}
		}
		result.root.layout = "map";

		return result;
	}

}

function serializeItem(item: JsonifiedItem, depth=0): string {
	var lines = (item.children || []) .map(child => {
		return serializeItem(child, depth+1);
	});

	var prefix = new Array(depth+1).join("\t");
	lines.unshift(prefix + item.text.replace(/\n/g, ""));

	return lines.join("\n") + (depth ? "" : "\n");
}


function parseItems(lines: string[]) {
	let items: JsonifiedItem[] = [];
	if (!lines.length) { return items; }
	var firstPrefix = parsePrefix(lines[0]);

	let currentItem: JsonifiedItem | null = null;
	let childLines: string[] = [];

	/* finalize a block of sub-children by converting them to items and appending */
	var convertChildLinesToChildren = function() {
		if (!currentItem || !childLines.length) { return; }
		var children = parseItems(childLines);
		if (children.length) { currentItem.children = children; }
		childLines = [];
	}

	lines.forEach(line => {
		if (parsePrefix(line) == firstPrefix) { /* new top-level item! */
			convertChildLinesToChildren(); /* finalize previous item */
			currentItem = {text:line.match(/^\s*(.*)/)![1]};
			items.push(currentItem);
		} else { /* prepare as a future child */
			childLines.push(line);
		}
	});

	convertChildLinesToChildren();

	return items;
}

function parsePrefix(line: string) {
	return line.match(/^\s*/)![0];
}
