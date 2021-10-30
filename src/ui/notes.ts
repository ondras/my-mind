import Item from "../item.js";
import * as app from "../my-mind.js";
import * as pubsub from "../pubsub.js";


const node = document.querySelector<HTMLElement>("#notes")!;
const iframe = node.querySelector<HTMLIFrameElement>("iframe")!;

export function toggle() {
	node.hidden = !node.hidden;
}

export function close() {
	if (node.hidden) { return ; }
	node.hidden = true;
}

function onMessage(e: MessageEvent) {
	if (!e.data || !e.data.action) { return; }
	switch (e.data.action) {
		case "setContent":
			app.currentItem.notes = e.data.value.trim();
		break;

		case "closeEditor":
			close();
		break;
	}
}

export function init() {
	pubsub.subscribe("item-select", (_message: string, publisher: Item) => {
		iframe.contentWindow && iframe.contentWindow.postMessage({
			action: "setContent",
			value: publisher.notes
		}, "*");
	});

	window.addEventListener("message", onMessage);
}
