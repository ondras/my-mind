import "../layout/graph.js";
import "../layout/tree.js";
import "../layout/map.js";

import * as actions from "../action.js";
import * as app from "../my-mind.js";
import { repo } from "../layout/layout.js";


const select = document.querySelector<HTMLSelectElement>("#layout")!;

export function init() {
	let layout = repo.get("map")!;
	select.append(layout.option);

	let label = buildGroup("Graph");
	let graphOptions = ["right", "left", "bottom", "top"].map(name => {
		return repo.get(`graph-${name}`)!.option;
	});
	label.append(...graphOptions);

	label = buildGroup("Tree");
	let treeOptions = ["right", "left"].map(name => {
		return repo.get(`tree-${name}`)!.option;
	});
	label.append(...treeOptions);

	select.addEventListener("change", onChange);
}

export function update() {
	var value = "";
	var layout = app.currentItem.layout;
	if (layout) { value = layout.id; }
	select.value = value;

	getOption("").disabled = app.currentItem.isRoot;
	getOption("map").disabled = !app.currentItem.isRoot;
}

function onChange() {
	let layout = repo.get(select.value)!;
	var action = new actions.SetLayout(app.currentItem, layout);
	app.action(action);
}

function getOption(value: string) {
	return select.querySelector<HTMLOptionElement>(`option[value="${value}"]`)!;
}

function buildGroup(label: string) {
	let node = document.createElement("optgroup");
	node.label = label;
	select.append(node);
	return node;
}
