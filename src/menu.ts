let node: HTMLElement;
let port: HTMLElement;

export function init(port_: HTMLElement) {
	port = port_;
	node = document.querySelector("#menu");

	[...node.querySelectorAll("[data-command]")].forEach((button: HTMLElement) => {
		let commandName = button.dataset.command;
		button.textContent = MM.Command[commandName].label;
	});

	port.addEventListener("mousedown", handleEvent);
	node.addEventListener("mousedown", handleEvent);

	close();
}

export function open(point: number[]) {
	node.hidden = false;
	let w = node.offsetWidth;
	let h = node.offsetHeight;

	let left = point[0];
	let top = point[1];

	if (left > port.offsetWidth/2) { left -= w; }
	if (top > port.offsetHeight/2) { top -= h; }

	node.style.left = `${left}px`;
	node.style.top = `${top}px`;
}

function handleEvent(e: MouseEvent) {
	if (e.currentTarget != node) {
		close();
		return;
	}

	e.stopPropagation(); // no dragdrop, no blur of activeElement
	e.preventDefault(); // we do not want to focus the button

	let commandName = (e.target as HTMLElement).dataset.command;
	if (!commandName) { return; }

	let command = MM.Command[commandName];
	if (!command.isValid()) { return; }

	command.execute();
	close();
}

function close() {
	node.hidden = true;
}

