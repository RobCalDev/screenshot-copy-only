This release adds user-configured shortcuts and fixes unfinished capture cleanup.

- **No copy-only shortcut is assigned by default.** Open the extension’s
  preferences and assign your own, such as Ctrl + Print Screen. You can change
  or clear it at any time; changes apply immediately.
- Disabling the extension now prevents an unfinished capture from writing to
  the clipboard or showing a late notification. Re-enabling cannot revive it.
- The description explicitly declares clipboard access. Captures write PNG
  images to the clipboard; the extension never reads existing clipboard content.
- Ordinary Print Screen keeps GNOME’s normal save-and-copy behavior.

Supports **GNOME Shell 51**. Existing explicitly configured shortcuts are
preserved; users relying on the previous default must choose a shortcut once.

Validation: twelve behavior tests and packaging checks pass. The preferences
chooser, live shortcut registration/clearing, real PNG clipboard capture,
normal saving and disable/re-enable cancellation were also checked in an
isolated GNOME 51.1 session. See `docs/VALIDATION-1.1.0.md` in the repository.

Download the ZIP and install it:

```sh
gnome-extensions install --force screenshot-copy-only@robcaldev.github.io.shell-extension.zip
```

Log out and back in after installing/updating, then enable and configure it:

```sh
gnome-extensions enable screenshot-copy-only@robcaldev.github.io
gnome-extensions prefs screenshot-copy-only@robcaldev.github.io
```

If you used the original development copy, disable `screenshot-copy-only@local`
before enabling the public release so the two copies do not compete.

The source is GPL-2.0-or-later with attribution to GNOME Shell. This GitHub
release is not a GNOME Extensions approval. Maintainer review of the AI-assisted
code is still required before submitting it to the GNOME directory.
