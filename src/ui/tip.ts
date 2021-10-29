import * as pubsub from "../pubsub.js";


const node = document.querySelector<HTMLElement>("#tip")!;

export function init() {
	node.addEventListener("click", hide);
	pubsub.subscribe("command-child", hide);
	pubsub.subscribe("command-sibling", hide);
}

function hide() {
	pubsub.unsubscribe("command-child", hide);
	pubsub.unsubscribe("command-sibling", hide);

	node.removeEventListener("click", hide);
	node.hidden = true;
}
