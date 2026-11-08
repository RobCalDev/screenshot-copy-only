This release makes cleanup easier for static analysis. Screenshot behavior is
unchanged from 1.1.1, and the reviewed code has no personal-use notices.

Shexli 0.2.1 was run on the final ZIP. It reports **one error, no warnings and one
manual-review item**:

- Its hardcoded GNOME version ceiling is 50, so it flags our tested GNOME 51
  declaration as a future version. We kept the supported version accurate.
- Intentional clipboard access requires manual reviewer scrutiny. Access is
  declared, no clipboard content is read, and no shortcut is assigned by default.

The settings cleanup warning was resolved by clearing references separately.
See `docs/SHEXLI.md` for details. This is not a clean analyzer pass or a GNOME
Extensions approval.

Download the `.shell-extension.zip` for installation or submission. To install:

```sh
gnome-extensions install --force screenshot-copy-only@robcaldev.github.io.shell-extension.zip
```

Log out and back in after installing/updating, then enable and configure it:

```sh
gnome-extensions enable screenshot-copy-only@robcaldev.github.io
gnome-extensions prefs screenshot-copy-only@robcaldev.github.io
```

Choose a shortcut in preferences, such as Ctrl + Print Screen. If using the old
development copy, disable `screenshot-copy-only@local` before enabling this release.
