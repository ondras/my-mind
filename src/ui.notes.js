MM.UI.Notes = function() {
	this._node = document.querySelector("#notes");
}

MM.UI.Notes.prototype.save = function() {
	MM.App.current._notes = document.getElementById('notes-editor').value;
	var notesContentElement = document.getElementById('notes-content');
	notesContentElement.innerHTML = MM.App.current._notes;
}

MM.UI.Notes.prototype.toggle = function() {
	this._node.classList.toggle("visible");
}
