#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-2.0-or-later
"""Create a deterministic, allowlisted GNOME extension ZIP and checksum."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent
FILES = (
    'metadata.json', 'extension.js', 'capture.js', 'stylesheet.css',
    'schemas/org.gnome.shell.extensions.screenshot-copy-only.gschema.xml',
    'LICENSE', 'NOTICE',
)


def main():
    metadata = json.loads((ROOT / 'metadata.json').read_text())
    destination = ROOT / 'dist'
    destination.mkdir(exist_ok=True)
    bundle = destination / f'{metadata["uuid"]}.shell-extension.zip'
    with zipfile.ZipFile(bundle, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name in sorted(FILES):
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, (ROOT / name).read_bytes())
    digest = hashlib.sha256(bundle.read_bytes()).hexdigest()
    checksum = destination / f'{bundle.name}.sha256'
    checksum.write_text(f'{digest}  {bundle.name}\n')
    print(bundle)
    print(checksum)


if __name__ == '__main__':
    main()
