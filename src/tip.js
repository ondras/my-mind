MM.Tip = {
	_node: null,

	handleEvent: function() {
		this._hide();
	},

	handleMessage: function() {
		this._hide();
	},

	init: function() {
		this._node = document.querySelector("#tip");
		this._node.addEventListener("click", this);

		MM.subscribe("command-child", this);
		MM.subscribe("command-sibling", this);
	},

	_hide: function() {
		MM.unsubscribe("command-child", this);
		MM.unsubscribe("command-sibling", this);

		this._node.removeEventListener("click", this);
		this._node.classList.add("hidden");
		this._node = null;
	}
}
