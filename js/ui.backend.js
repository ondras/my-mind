MM.UI.Backend = Object.create(MM.Repo);

MM.UI.Backend.init = function(select) {
	this._backend = MM.Backend.getById(this.id);
	this._mode = "";
	this._prefix = "mm.app." + this.id + ".";

	this._node = document.querySelector("#" + this.id);
	
	this._cancel = this._node.querySelector(".cancel");
	this._cancel.addEventListener("click", this);

	this._go = this._node.querySelector(".go");
	this._go.addEventListener("click", this);
	
	select.appendChild(this._backend.buildOption());
}

MM.UI.Backend.handleEvent = function(e) {
	switch (e.target) {
		case this._cancel:
			MM.App.ui._io.hide(); /* FIXME */
		break;

		case this._go:
			this._action();
		break;
	}
}

MM.UI.Backend.show = function(mode) {
	this._mode = mode;

	this._go.innerHTML = mode.charAt(0).toUpperCase() + mode.substring(1);

	var all = this._node.querySelectorAll("[data-for]");
	[].concat.apply([], all).forEach(function(node) { node.style.display = "none"; });

	var visible = this._node.querySelectorAll("[data-for~=" + mode + "]");
	[].concat.apply([], visible).forEach(function(node) { node.style.display = ""; });
	
	this._go.focus();
}

MM.UI.Backend._action = function() {
}

MM.UI.Backend._error = function(e) {
	alert(e.message);
}
