/**
 * Prototype for all things categorizable: shapes, layouts, commands, formats, backends...
 */
MM.Repo = {
	id: "", /* internal ID */
	label: "", /* human-readable label */
	getByProperty: function(property, value) {
		for (var p in this) {
			var val = this[p];
			if (val && property in val && val[property] == value) { return val; }
		}
		return null;
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
