MM.Menu = {
	_dom: {},
	_port: null,
	
	open: function(x, y) {
		this._dom.node.style.display = "";
		var w = this._dom.node.offsetWidth;
		var h = this._dom.node.offsetHeight;

		var left = x;
		var top = y;

		if (left > this._port.offsetWidth / 2) { left -= w; }
		if (top > this._port.offsetHeight / 2) { top -= h; }

		this._dom.node.style.left = left+"px";
		this._dom.node.style.top = top+"px";
	},
	
	close: function() {
		this._dom.node.style.display = "none";
	},
	
	handleEvent: function(e) {
		if (e.currentTarget != this._dom.node) {
			this.close();
			return;
		}
		
		e.stopPropagation(); /* no dragdrop, no blur of activeElement */
		e.preventDefault(); /* we do not want to focus the button */
		
		var command = e.target.getAttribute("data-command");
		if (!command) { return; }

		command = MM.Command[command];
		if (!command.isValid()) { return; }

		command.execute();
		this.close();
	},
	
	init: function(port) {
		this._port = port;
		this._dom.node = document.querySelector("#menu");
		var buttons = this._dom.node.querySelectorAll("[data-command]");
		[].slice.call(buttons).forEach(function(button) {
			button.innerHTML = MM.Command[button.getAttribute("data-command")].label;
		});
		
		this._port.addEventListener("mousedown", this);
		this._dom.node.addEventListener("mousedown", this);
		
		this.close();
	}
}

