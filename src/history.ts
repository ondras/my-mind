import Action from "./action.js";


let index = 0; // points to the last undoed action
let actions: Action[] = [];

export function reset() {
	index = 0;
	actions = [];
}

export function push(action: Action) {
	if (index < actions.length) { // remove undoed actions
		actions.splice(index, actions.length-index);
	}

	actions.push(action);
	index++;
}

export function back() {
	actions[--index].undo();
}

export function forward() {
	actions[index++].do();
}

export function canBack() {
	return !!index;
}

export function canForward() {
	return (index != actions.length)
}
