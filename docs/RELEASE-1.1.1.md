Documentation and packaging updates.

Supported: **GNOME Shell 51**.

Download the `.shell-extension.zip` and install it:

```sh
gnome-extensions install --force screenshot-copy-only@robcaldev.github.io.shell-extension.zip
```

Log out and back in after installing or updating, then enable it:

```sh
gnome-extensions enable screenshot-copy-only@robcaldev.github.io
```

Open preferences and choose a copy-only shortcut, such as Ctrl + Print Screen:

```sh
gnome-extensions prefs screenshot-copy-only@robcaldev.github.io
```

No shortcut is assigned by default. Ordinary Print Screen keeps GNOME’s normal
save-and-copy behavior.
