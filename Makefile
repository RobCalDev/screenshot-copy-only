.PHONY: check pack

check:
	node --check --input-type=module < extension.js
	node --check --input-type=module < capture.js
	node --check --input-type=module < prefs.js
	node --experimental-vm-modules tests/extension.test.mjs
	glib-compile-schemas --strict --dry-run schemas
	bash -n install.sh
	python3 tests/package_test.py

pack: check
	python3 scripts/package.py
