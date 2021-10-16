MAKEOPTS = "-r"

BIN := $(shell npm bin)
TSC := $(BIN)/tsc
LESSC := $(BIN)/lessc
ESBUILD := $(BIN)/esbuild
GCC := $(BIN)/google-closure-compiler

JS := .js
FLAG := $(JS)/.tsflag
APP := my-mind.js

all: $(APP)

$(APP): $(FLAG)
	$(ESBUILD) --bundle $(JS)/$(APP) > $@

$(FLAG): $(shell find src -type f)
	$(TSC)
	touch $@

clean:
	rm -rf $(JS) $(APP)

.PHONY: all clean
