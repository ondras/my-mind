# My Mind

![Screenshot](screenshot.png)

My Mind is a web application for creating and managing Mind maps. It is free to use and you can fork its source code. It is distributed under the terms of the MIT license.

New to Mind maps? They are useful, aesthetic and cool! Read more about these special diagrams in [the Wikipedia article](https://en.wikipedia.org/wiki/Mind_map).

* [Official web page](https://my-mind.github.io/)
* [Sample mind map](https://my-mind.github.io/?map=examples/features.mymind) showcasing many features
* [News / Changelog](https://github.com/ondras/my-mind/wiki/News)
* [Documentation](https://github.com/ondras/my-mind/wiki)
* <a target="_blank" href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=3340079"><img src="https://www.paypal.com/en_GB/i/btn/btn_donate_LG.gif" alt="Donate" title="Donate to support further development" /></a>

## Installation
Note: there is also an online version, which can be found at [my-mind.github.io](https://my-mind.github.io/)

* Download the zip by clicking [here](https://github.com/ondras/my-mind/archive/refs/heads/master.zip) and extract the archive, or clone the repository using git
* Put the app somewhere where it is accessible via your local webserver
  * Open it using a `http://localhost` URL
  * ~~Open index.html in your webbrowser~~ currently not working
* Done! If need be, you can find the manual [here](https://github.com/ondras/my-mind/wiki)

# Docker

1. Clone this repo

2. Change the defaults in the Caddyfile to match your needs ie: the user and password - default: test and test, and the file name the .mymind will be saved as - default: My Mind Map.mymind

3. `docker build -t victim/caddymindmap .`

4. `docker run --name=caddymindmap --restart always -d -p 8000:80 -v /<Path to this repo>/:/srv -v caddy_data:/data victim/caddymindmap`

5. Go to http://(YOUR IP HERE):8000 and away you go


Provided CaddyHashDockerfile can be used to generate a password for the Caddyfile just change "test" to your new password and it will create a new hashed password for your use that you would then put in place of the default hash.

Like so: `docker build -f CaddyHashDockerfile -t caddyhash .` the hash will be part of the build output

## Docker server saving

In the "save as" select the webdav and for the save location input the address for the current server ex: if you chose `http://192.168.1.18:8000` above when you built the image

## Docker server loading

select the webdav and for the load location input the address for the current server ex: if you chose `http://192.168.1.18:8000/(filename you chose in caddyfile)` above when you built the image

## Contributing

Do you want to participate?

* Found a bug? [Open an issue.](https://github.com/ondras/my-mind/issues)
* Not sure how to do stuff? [Check the docs.](https://github.com/ondras/my-mind/wiki)
* Have a feature request? [Open an issue.](https://github.com/ondras/my-mind/issues)
* Have an improvement? [Submit a pull request.](https://github.com/ondras/my-mind/pulls)

## License
[MIT](LICENSE.txt)
