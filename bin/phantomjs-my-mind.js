/**
 * This is a PhantomJS script. It requests a my-mind webpage and injects the map data that it reads from <stdin>.
 * Synopsis: phantomjs phantomjs-my-mind.js url output.png [DATA]
 */
var system = require("system");

if (system.args.length < 3) {
	console.log("Wrong argument count. Call as 'phantomjs phantomjs-my-mind.js url output.png [DATA]'.");
	phantom.exit();
}

var url = system.args[1];
var output = system.args[2];
var dataSource = system.args[3];
var data = null;

if (dataSource) {
	try {
		if (dataSource == "-") {
			data = system.stdin.read();
		} else {
			data = require("fs").read(dataSource);
		}
	} catch (e) {
		console.log(e);
		phantom.exit();
	}
}

var page = require("webpage").create();
page.onAlert = function(msg) { console.log(msg); }
page.open(url, function() {
	page.evaluate(function(dataSource, data) {
		document.querySelector("link[media~=print]").media = "all"; /* switch to print mode */
		var port = document.querySelector("#port");
		port.style.width = port.style.height = "";

		var format = MM.Format.getByName(dataSource);
		var json = format.from(data);
		var map = MM.Map.fromJSON(json);
		MM.App.setMap(map);

		document.body.offsetWidth; /* to force reflow/repaint */
	}, dataSource, data);

	page.render(output);
	phantom.exit();
});
