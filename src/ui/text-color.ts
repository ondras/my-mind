import * as actions from "../action.js";
import * as app from "../my-mind.js";


const node = document.querySelector<HTMLElement>("#text-color")!;

export function init() {
	node.addEventListener("click", onClick);

	[...node.querySelectorAll<HTMLElement>("[data-color]")].forEach(item => {
		item.style.backgroundColor = item.dataset.color!;
	});
}

function onClick(e: MouseEvent) {
	e.preventDefault();

	let color = (e.target as HTMLElement).dataset.color || "";
	let action = new actions.SetTextColor(app.currentItem, color);
	app.action(action);
}
