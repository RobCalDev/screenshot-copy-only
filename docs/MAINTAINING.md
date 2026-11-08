# Maintainer guide

## Architecture

`extension.js` adds a copy-only label and a user-configured shortcut to GNOME’s
existing screenshot interface. `InjectionManager` wraps `open()` and
`_saveScreenshot()` on `Main.screenshotUI` and restores them when disabled.
Normal captures delegate to GNOME’s original methods.

`capture.js` reads the preview texture, selection geometry, scale and optional
cursor data. It composites a PNG into a `Gio.MemoryOutputStream` and writes the
bytes to `St.Clipboard`. It does not create a screenshot file or read existing
clipboard content.

Each activation owns a `Gio.Cancellable`. Disabling cancels that activation so
unfinished compositor results cannot change the clipboard or show notifications.
Re-enabling creates a new cancellable. Signals, shortcut registration, the label
and method wrappers are cleaned up in `disable()`.

`prefs.js` runs in the separate GTK/Adwaita preferences process. It lets users
choose or clear a shortcut. A settings-change signal updates the Shell binding
immediately. The schema’s default shortcut list is empty.

## Compatibility

The extension targets GNOME Shell 51 and uses private screenshot methods. Before
adding support for another major version, compare its screenshot code with
`open()`, `_saveScreenshot()`, window selectors, geometry, scaling, cursor data
and panel layout. Test each capture mode before updating `shell-version`.

## Checks

Run `make check` for syntax, behavior, schema, installer and packaging checks.
For manual testing:

1. Enable the extension with fresh settings and confirm no shortcut is registered.
2. Assign, change and clear a shortcut in preferences. Confirm changes apply
   immediately and Escape cancels the chooser.
3. Capture a selection, screen and window. Paste each image and confirm no
   screenshot file is created.
4. Test pointer on/off, fractional display scaling and cancellation.
5. Confirm ordinary Print Screen still saves and copies.
6. Check portal screenshots and screen recording.
7. Disable and re-enable while a capture is pending. Confirm the old capture
   cannot overwrite the clipboard or show notifications.
8. Check compatibility with Blur My Shell.

Optional static analysis:

```sh
shexli dist/screenshot-copy-only@robcaldev.github.io.shell-extension.zip
```

Shexli 0.2.1 has a hardcoded maximum GNOME major version of 50, so it flags this
extension’s GNOME 51 declaration. It also requests manual review of clipboard
access. Keep supported versions accurate when interpreting analyzer findings.

## Releases

Update `version-name` and CHANGELOG.md, then run `make pack`. The archive includes
only the runtime modules, metadata, CSS, schema XML, LICENSE and NOTICE.

Publish the ZIP and SHA-256 checksum with a tag for the tested commit. Keep
release notes focused on changes users need to know about. Preserve licensing
and upstream attribution.

GNOME Extensions submissions use the same ZIP. Follow the
[review guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html)
when preparing an upload.
