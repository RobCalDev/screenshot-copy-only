# Release 1.0.0 validation

Validated on 2026-11-08 using Fedora Workstation 45, GNOME Shell 51.1 and Wayland.

## Automated checks

`make pack` passed JavaScript syntax checks, six behavior tests, strict schema
validation, installer syntax validation and the packaging test. The packaging
test checks archive contents and confirms repeated builds produce identical
bytes and matching SHA-256 checksums.

## Isolated GNOME session

The public UUID was loaded in a disposable headless GNOME 51.1 session with
separate configuration, runtime, cache and data directories. A test-only helper
enabled automation inside that disposable session. It is not included in the
repository or runtime archive, and the user's running session was not modified.

- GNOME reported the extension active, enabled and without an error.
- Opening copy-only mode showed the label in the native overlay.
- A real screen capture produced clipboard content of type `image/png` with the
  PNG signature `89 50 4e 47 0d 0a 1a 0a` and 20,553 bytes of image data.
- No screenshot file appeared in the disposable Pictures directory after the
  copy-only capture.
- A subsequent normal opening reset copy-only mode and saved exactly one PNG.
- Cancelling a new copy-only opening reset both the mode and indicator.
- The README screenshot was captured from this clean test session.

The isolated checks invoked the same shortcut handler and capture methods used
by the overlay; they did not simulate a physical keyboard shortcut. Window
capture, fractional scaling and error/disable paths are covered by the fake
desktop-service tests, not by this headless screen-capture check. The original
local UUID was also installed on the user's desktop and reported working in
interactive testing. Broader release checks remain in MAINTAINING.md.
