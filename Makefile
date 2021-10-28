MAKEOPTS := "-r"
BIN := $(shell npm bin)
TSC := $(BIN)/tsc
LESSC := $(BIN)/lessc
ESBUILD := $(BIN)/esbuild

JS := .js
FLAG := $(JS)/.tsflag
APP := my-mind.js
STYLE := my-mind.css map.css

all: $(APP) $(STYLE)

%.css: css/*.less
	$(LESSC) css/$*.less > $@

$(APP): $(FLAG)
	$(ESBUILD) --bundle $(JS)/$(APP) > $@

$(FLAG): $(shell find src -type f)
	$(TSC) -p src
	touch $@

watch: all
	while inotifywait -e MODIFY -r src css ; do $(MAKE) $^ ; done

clean:
	rm -rf $(JS) $(APP) $(STYLE)

.PHONY: all clean watch
