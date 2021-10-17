import * as pubsub from "./pubsub.js";


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

		pubsub.subscribe("command-child", this);
		pubsub.subscribe("command-sibling", this);
	},

	_hide: function() {
		pubsub.unsubscribe("command-child", this);
		pubsub.unsubscribe("command-sibling", this);

		this._node.removeEventListener("click", this);
		this._node.classList.add("hidden");
		this._node = null;
	}
}
