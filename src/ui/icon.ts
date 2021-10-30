import * as actions from "../action.js";
import * as app from "../my-mind.js";


const select = document.querySelector<HTMLSelectElement>("#icons")!;

export function init() {
    select.addEventListener("change", onChange);
}

export function update() {
    select.value = (app.currentItem.icon || "");
}

function onChange() {
    let action = new actions.SetIcon(app.currentItem, select.value);
    app.action(action);
}
