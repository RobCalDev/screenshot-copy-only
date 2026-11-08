This is the reviewed submission package. Runtime behavior is unchanged from 1.1.0.

- Removed the personal-use notices after the maintainer confirmed code review.
- Audited public source history, releases and upload archive for personal and
  machine-specific information.
- Removed ancillary metadata from the clean-session demonstration screenshot.
- Retained the public RobCalDev project identity, GPL licensing and attribution.

No keyboard shortcut is assigned by default. Configure your own in extension
preferences, such as Ctrl + Print Screen. Ordinary Print Screen retains GNOME's
normal save-and-copy behavior. Supports GNOME Shell 51.

Download the `.shell-extension.zip` for installation or GNOME Extensions upload.
The accompanying SHA-256 file lets you verify the downloaded archive.

```sh
gnome-extensions install --force screenshot-copy-only@robcaldev.github.io.shell-extension.zip
```

After installing/updating, log out and back in, then enable and configure it:

```sh
gnome-extensions enable screenshot-copy-only@robcaldev.github.io
gnome-extensions prefs screenshot-copy-only@robcaldev.github.io
```

If the original development copy is installed, disable `screenshot-copy-only@local`
before enabling this version. GNOME Extensions submission/reviewer approval is
separate from this GitHub release.
