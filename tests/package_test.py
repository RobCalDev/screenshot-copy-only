# SPDX-License-Identifier: GPL-2.0-or-later
"""Verify the distribution archive is complete and contains no development data."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('package', ROOT / 'scripts/package.py')
package = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)


class PackageTest(unittest.TestCase):
    def test_archive_contents_and_reproducibility(self):
        with tempfile.TemporaryDirectory() as directory:
            original_root = package.ROOT
            package.ROOT = Path(directory)
            try:
                for name in package.FILES:
                    target = package.ROOT / name
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes((ROOT / name).read_bytes())
                package.main()
                bundle = next((package.ROOT / 'dist').glob('*.zip'))
                original = bundle.read_bytes()
                package.main()
                self.assertEqual(bundle.read_bytes(), original)
                with zipfile.ZipFile(bundle) as archive:
                    self.assertEqual(set(archive.namelist()), set(package.FILES))
                    metadata = json.loads(archive.read('metadata.json'))
                    self.assertEqual(metadata['uuid'], 'screenshot-copy-only@robcaldev.github.io')
                    self.assertEqual(metadata['shell-version'], ['51'])
                    self.assertIn('GPL-2.0-or-later', archive.read('NOTICE').decode())
                digest = hashlib.sha256(original).hexdigest()
                self.assertEqual(Path(f'{bundle}.sha256').read_text(), f'{digest}  {bundle.name}\n')
            finally:
                package.ROOT = original_root


if __name__ == '__main__':
    unittest.main()
