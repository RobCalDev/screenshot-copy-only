Screenshot Copy Only adds a clipboard-only shortcut to GNOME's native screenshot
overlay, keeping the familiar Selection, Screen and Window controls.

- **Ctrl + Print Screen:** copy only, with a small indicator in the overlay.
- **Print Screen:** GNOME's usual save-and-copy behavior.
- **Escape:** cancel and reset the capture mode.

Supported: **GNOME Shell 51**. Locally tested on Fedora Workstation 45,
GNOME Shell 51.1, Wayland. Other GNOME versions are not supported in this release.

Download the `.shell-extension.zip` asset and run:

```sh
gnome-extensions install screenshot-copy-only@robcaldev.github.io.shell-extension.zip
```

Log out and back in, then enable it:

```sh
gnome-extensions enable screenshot-copy-only@robcaldev.github.io
```

If you used the original development copy, disable `screenshot-copy-only@local`
before enabling this release. The two copies use the same shortcut.

The source is GPL-2.0-or-later, with attribution to GNOME Shell for the adapted
capture logic. This release is distributed through GitHub; a GNOME Extensions
listing has not yet been approved.
