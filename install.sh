#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-2.0-or-later
set -euo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
extension_uuid="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["uuid"])' "$project_dir/metadata.json")"
extension_dir="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions/$extension_uuid"
if [[ "$(gnome-shell --version)" != 'GNOME Shell 51.'* ]]; then
    echo 'This extension targets GNOME Shell 51.' >&2
    exit 1
fi
mkdir -p "$extension_dir/schemas"
for file in metadata.json extension.js capture.js stylesheet.css LICENSE NOTICE; do
    install -m 644 "$project_dir/$file" "$extension_dir/$file"
done
install -m 644 "$project_dir/schemas/org.gnome.shell.extensions.screenshot-copy-only.gschema.xml" "$extension_dir/schemas/"
glib-compile-schemas --strict "$extension_dir/schemas"
# Preserve the user's other enabled extensions. Shell discovers new local
# extensions at login; enabling the UUID now schedules activation then.
python3 - "$extension_uuid" <<'PY'
import sys
from gi.repository import Gio
settings = Gio.Settings.new('org.gnome.shell')
uuid = sys.argv[1]
enabled = settings.get_strv('enabled-extensions')
disabled = settings.get_strv('disabled-extensions')
if uuid in disabled:
    settings.set_strv('disabled-extensions', [item for item in disabled if item != uuid])
if uuid not in enabled:
    settings.set_strv('enabled-extensions', enabled + [uuid])
Gio.Settings.sync()
PY
echo "Installed: $extension_dir"
if gnome-extensions info "$extension_uuid" >/dev/null 2>&1; then
    gnome-extensions enable "$extension_uuid"
    gnome-extensions info "$extension_uuid"
else
    echo 'Log out and back in once to activate the new extension.'
fi
