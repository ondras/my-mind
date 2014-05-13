MM.Menu = {
	_dom: {},
	_port: null,
	
	open: function(x, y) {
		this._dom.node.style.left = x+"px";
		this._dom.node.style.top = y+"px";
		this._dom.node.style.display = "";
	},
	
	close: function() {
		this._dom.node.style.display = "none";
	},
	
	handleEvent: function(e) {
		if (e.currentTarget != this._dom.node) {
			this.close();
			return;
		}
		
		e.stopPropagation();
		
		var command = e.target.getAttribute("data-command");
		if (!command) { return; }
		MM.Command[command].execute();
	},
	
	init: function(port) {
		this._port = port;
		this._dom.node = document.querySelector("#menu");
		this._port.appendChild(this._dom.node);
		var buttons = this._dom.node.querySelectorAll("[data-command]");
		[].slice.call(buttons).forEach(function(button) {
			button.innerHTML = MM.Command[button.getAttribute("data-command")].label;
		});
		
		this._port.addEventListener("mousedown", this);
		this._dom.node.addEventListener("mousedown", this);
		
		this.close();
	}
}

