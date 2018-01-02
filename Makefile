SOURCES =	src/mm.js \
			src/promise.js \
			src/promise-addons.js \
			src/repo.js \
			src/item.js \
			src/map.js \
			src/keyboard.js \
			src/tip.js \
			src/action.js \
			src/clipboard.js \
			src/menu.js \
			src/command.js \
			src/command.edit.js \
			src/command.select.js \
			src/layout.js \
			src/layout.graph.js \
			src/layout.tree.js \
			src/layout.map.js \
			src/shape.js \
			src/shape.underline.js \
			src/shape.box.js \
			src/shape.ellipse.js \
			src/format.js \
			src/format.json.js \
			src/format.freemind.js \
			src/format.mma.js \
			src/format.mup.js \
			src/format.plaintext.js \
			src/backend.js \
			src/backend.local.js \
			src/backend.webdav.js \
			src/backend.image.js \
			src/backend.file.js \
			src/backend.firebase.js \
			src/backend.gdrive.js \
			src/ui.js \
			src/ui.layout.js \
			src/ui.shape.js \
			src/ui.value.js \
			src/ui.status.js \
			src/ui.color.js \
			src/ui.icon.js \
			src/ui.help.js \
			src/ui.io.js \
			src/ui.backend.js \
			src/ui.backend.file.js \
			src/ui.backend.webdav.js \
			src/ui.backend.image.js \
			src/ui.backend.local.js \
			src/ui.backend.firebase.js \
			src/ui.backend.gdrive.js \
			src/mouse.js \
			src/app.js

.PHONY: all push clean

all: my-mind.js

my-mind.js: $(SOURCES)
	@echo "/* My Mind web app: all source files combined. */" > $@
	@cat $^ >> $@

push:
	@hg bookmark -f master
	@hg push ; true
	@hg push github ; true

clean:
	@rm my-mind.js
