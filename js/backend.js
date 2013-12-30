MM.Backend = Object.create(MM.Repo);

/**
 * Backends are allowed to have some internal state. 
 * This method notifies them that "their" map is no longer used 
 * (was either replaced by a new one or saved using other backend).
 */ 
MM.Backend.reset = function() {
}

MM.Backend.save = function(data, name) {
}

MM.Backend.load = function(name) {
}
