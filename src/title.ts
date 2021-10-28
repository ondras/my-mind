import * as pubsub from "./pubsub.js";
import { currentMap } from "./my-mind.js";


function onItemChange(_message: string, publisher: any) {
	if (publisher.isRoot && publisher.map == currentMap) {
		document.title = currentMap.name + " :: My Mind";
	}
}

export function init() {
	pubsub.subscribe("item-change", onItemChange);
}
