# Maintainer guide

## How the extension works

`extension.js` is the entry point. `enable()` obtains GNOME's existing screenshot
interface, adds the label, connects the UI signals and a settings-change signal,
and registers a shortcut only if the user has explicitly assigned one in
preferences. It uses GNOME's `InjectionManager` to wrap two methods on that one
UI instance. It does not edit GNOME's files on disk.

The shortcut requests copy-only mode and calls `open()`. The `open()` wrapper
consumes that request once; other callers, including normal Print and portal
requests, default to GNOME's usual behavior. The overlay's `closed` signal clears
the mode. The still-image button's state controls whether the label is visible.
Recording uses the original GNOME behavior and hides the label.

The `_saveScreenshot()` wrapper delegates to GNOME's original method for normal
captures. In copy-only mode it calls `copyScreenshot()` from `capture.js`.
That module reads the texture already displayed in the overlay, the selection
rectangle, monitor/window scale and optional pointer texture. It passes them to
`Shell.Screenshot.composite_to_stream()` using a `Gio.MemoryOutputStream`, then
puts the resulting PNG bytes into `St.Clipboard`. There is no file output API in
this path. Errors report failure without invoking GNOME's file-saving path.

`disable()` removes the shortcut, restores wrapped methods, disconnects signals,
destroys the label and releases references. Each activation owns a
`Gio.Cancellable`. Disable cancels it, and pending compositing results are
discarded before any clipboard write. Completion/error notifications also
check that activation’s cancellable; re-enabling creates a different one and
cannot revive work from the previous activation. All dynamic setup happens in
`enable()`, and each item has matching cleanup.

The schema stores an initially empty shortcut list. `prefs.js` runs in the
separate GTK/Adwaita preferences process, importing no Shell UI libraries. Its
key chooser writes only user-selected accelerator values. A changed-setting
signal in the Shell process registers or removes the binding immediately.
Closing preferences disconnects its settings-change handler. The stylesheet
styles only our label. The package script includes an explicit list of runtime files plus license notices;
it excludes development scripts, tests, Git history and local configuration.

## What needs attention on future GNOME releases

The extension uses private screenshot UI fields/methods, so version support
cannot be inferred from JavaScript syntax alone. Compare `open()`,
`_saveScreenshot()`, window selectors, geometry, scaling, cursor data and panel
layout with the new GNOME source. Test each capture mode before changing
`shell-version`. Do not claim untested versions.

## Verify a release

1. Run `make pack` and install its ZIP in a test session. Confirm no shortcut
   is registered initially. Open preferences, assign Ctrl + Print, change it,
   clear it and assign it again. Check Escape cancels the chooser and unmodified
   Print cannot replace the normal screenshot shortcut.
2. Check Ctrl + Print with Selection, Screen and Window. Paste each result and
   confirm no new file appears in the screenshot directory.
3. Test pointer on/off, fractional display scaling where available, Escape,
   and a normal Print capture after cancelling a copy-only capture.
4. Check normal Print still saves and copies. Check portal screenshots and
   recording retain their normal behavior.
5. Disable and re-enable the extension. Confirm shortcut and label cleanup,
   including while capture compositing or overlay opening is still pending.
   Confirm an old capture cannot write or notify after re-enabling.
6. Check with Blur My Shell enabled, since it also touches the overlay.

The original local UUID was `screenshot-copy-only@local`. Disable that copy before
testing the public UUID so the two copies do not compete for the same shortcut.
No release script automatically changes a user's active extensions.

## GitHub releases

Update `version-name` and CHANGELOG.md. Run `make pack`; compare the ZIP contents
against `scripts/package.py`. Tag the tested commit and publish the ZIP and its
SHA-256 checksum as GitHub release assets. CI also checks changes and builds an
artifact. Keep tokens and account configuration outside the repository.

## GNOME Extensions review

Read [the review guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html)
and [the maintainer guidance](https://gjs.guide/extensions/review-guidelines/best-practices.html).
This project was developed with AI assistance. GNOME expects the person submitting
it to understand the JavaScript and be able to maintain and explain it. The
entry-point, preferences and capture-module comments retain GNOME's requested AI notice until
the maintainer has reviewed the code and personally removes those notice lines.
Do not treat a successful GitHub release as GNOME review approval.

The listing text is in [GNOME-LISTING.md](GNOME-LISTING.md). Upload the runtime ZIP
at https://extensions.gnome.org/upload/ while signed into the intended GNOME
Extensions account. Respond to review feedback, rebuild and upload a revised
version when required. Keep the UUID fixed after the first public release.
