/**
 * Prototype for all things categorizable: shapes, layouts, commands, formats, backends...
 */
MM.Repo = {
	id: "", /* internal ID */
	label: "", /* human-readable label */
	getAll: function() {
		var all = [];
		for (var p in this) {
			var val = this[p];
			if (this.isPrototypeOf(val)) { all.push(val); }
		}
		return all;
	},
	getByProperty: function(property, value) {
		return this.getAll().filter(function(item) {
			return item[property] == value;
		})[0] || null;
	},
	getById: function(id) {
		return this.getByProperty("id", id);
	},
	buildOption: function() {
		var o = document.createElement("option");
		o.value = this.id;
		o.innerHTML = this.label;
		return o;
	}
}
