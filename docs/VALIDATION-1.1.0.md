# Release 1.1.0 validation

Validated on 2026-11-08 with Fedora Workstation 45, GNOME Shell 51.1 and Wayland.

## Automated checks

`make pack` passes syntax checks for all three JavaScript modules, twelve
behavior tests, strict schema validation, installer syntax validation and a
deterministic packaging/checksum test. The archive test additionally verifies
the shortcut default is empty, the description declares clipboard access and
the preferences module is included.

The behavior tests cover ordinary/copy-only capture routing, window geometry
and fractional scaling, cancellation/reset, error paths, setup rollback,
shortcut assignment/change/clear, unavailable shortcuts, signal cleanup,
disable during an unfinished capture, late compositor failure and late overlay
open failure. Re-enabling is tested to ensure it cannot revive old captures.

## Real GNOME and preferences checks

Testing used a disposable headless GNOME 51.1 session with separate runtime,
configuration, data and cache directories. A test-only helper allowed automation
in that session; it is not shipped in the repository or extension ZIP. The
user's running desktop and installed local extension were not modified.

- GNOME loaded version 1.1.0 as active with preferences available and no error.
- A fresh configuration had an empty shortcut setting and no registered binding.
- The real GTK/Adwaita preferences window displayed its choose and clear buttons.
- The chooser accepted Ctrl + Print, updated its displayed label, and the Shell
  registered the user-assigned shortcut immediately.
- Escape preserved the previous shortcut. A modifier alone and unmodified Print
  were rejected. Backspace and the clear button removed the setting. The Shell
  unregistered the cleared binding without restarting the extension.
- Copy-only screen capture produced a real PNG on the clipboard with signature
  `89 50 4e 47 0d 0a 1a 0a` and no file in the disposable screenshot directory.
- A subsequent ordinary capture saved one PNG; cancelling reset the copy-only
  mode and indicator.
- A real compositor operation was paused before its result was returned to the
  extension. Disabling and re-enabling, then releasing that result, preserved
  pre-existing clipboard sentinel text instead of overwriting it with the PNG.

The preferences test invoked its real GTK controller signal handlers; it did
not simulate physical keyboard input. Screenshot checks invoked the same
methods used by the native overlay. Window capture/fractional scaling remain
covered by the fake desktop-service tests and the manual checklist in
MAINTAINING.md, rather than this headless screen-capture check.

## Submission status

The identified technical review issues are addressed. The AI personal-use
notices remain until the maintainer has reviewed the code and personally removes
them, as described in GNOME's maintainer guidance. No GNOME Extensions approval
is claimed. The GitHub release can be installed independently of that review.
