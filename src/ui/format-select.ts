import Native from "../format/native.js";
import FreeMind from "../format/freemind.js";
import MMA from "../format/mma.js";
import MUP from "../format/mup.js";
import Plaintext from "../format/plaintext.js";


let all = [Native, FreeMind, MMA, MUP, Plaintext].map(ctor => new ctor());

export function fill(select: HTMLSelectElement) {
	let nodes = all.map(bui => bui.option);
	select.append(...nodes);
}
