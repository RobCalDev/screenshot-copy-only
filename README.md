# Screenshot Copy Only

Copy screenshots without saving a file, using GNOME’s native screenshot overlay.

Assign a copy-only shortcut in the extension’s preferences, then use it to choose
**Selection**, **Screen** or **Window**.
Press **Enter** or click the capture button. A small **Copy only** indicator
shows that the image will go straight to your clipboard. You can release the
shortcut keys after opening the overlay.

**Print Screen** keeps GNOME’s normal save-and-copy behavior. **Escape** cancels
and resets the mode. Screen recordings and portal screenshots retain their
normal behavior.

![Native GNOME screenshot overlay with the Copy only indicator](assets/screenshot-copy-only.png)

## Compatibility

Supports **GNOME Shell 51**. Tested with **GNOME Shell 51.1 on Wayland**. Other major GNOME releases
are not currently supported. Compatibility depends on GNOME Shell’s private
screenshot methods and must be checked for each new major release.

## Install

Download the `.shell-extension.zip` from the
[latest GitHub release](https://github.com/RobCalDev/screenshot-copy-only/releases/latest),
then run from the download directory:

```sh
gnome-extensions install screenshot-copy-only@robcaldev.github.io.shell-extension.zip
```

Log out and back in once, then enable it:

```sh
gnome-extensions enable screenshot-copy-only@robcaldev.github.io
```

Open preferences and assign a shortcut, such as **Ctrl + Print Screen**:

```sh
gnome-extensions prefs screenshot-copy-only@robcaldev.github.io
```

Click **Set shortcut…**, press your chosen combination, and the change takes
effect immediately. Escape cancels the chooser. Backspace or the clear button
removes the shortcut. No shortcut is assigned by default. Existing explicitly configured
shortcuts are preserved when updating.

GNOME on Wayland discovers new local extensions at login.

### Install from source

Clone this repository and run `bash install.sh`, then log out and back in once.
The source installer needs Python 3, PyGObject and `glib-compile-schemas` and
preserves your other enabled extensions. The ZIP installation needs no
Python or Node.js at runtime.

## Disable

```sh
gnome-extensions disable screenshot-copy-only@robcaldev.github.io
```

Disabling removes the shortcut and indicator, restores the original screenshot
methods, and prevents unfinished captures from writing to the clipboard or showing
notifications after disable. To remove the installed extension after disabling it:

```sh
gnome-extensions uninstall screenshot-copy-only@robcaldev.github.io
```

## What gets saved?

The copy-only capture path encodes the screenshot into a memory stream and puts
its PNG bytes into GNOME’s clipboard. It does not create a screenshot file or
save one and delete it afterward. It does not read existing clipboard contents or change GNOME’s global save policy.
Clipboard history software may independently retain copied images.

## Development

Run `make check` for JavaScript syntax checks, twelve behavior tests, schema
validation, installer syntax validation and a packaging test. Run `make pack`
to create a deterministic runtime ZIP and SHA-256 checksum in `dist/`.

Node.js 24, Python 3, Make and GLib’s `glib-compile-schemas` are needed for these
checks. No third-party JavaScript or Python packages are required. Automated
behavior tests use fake desktop services; manual capture checks are described
in the [maintainer guide](docs/MAINTAINING.md).

Please report bugs through
[GitHub Issues](https://github.com/RobCalDev/screenshot-copy-only/issues).
See [CONTRIBUTING.md](CONTRIBUTING.md) for useful details to include.

## License and attribution

[GPL-2.0-or-later](LICENSE). The capture geometry and memory compositing are
adapted from GNOME Shell’s screenshot implementation; see [NOTICE](NOTICE).
