.PHONY: push

all:

push:
	@hg bookmark -f master
	@hg push ; true
	@hg push github ; true
