# GNOME Extensions listing draft

Name: Screenshot Copy Only

Website: https://github.com/RobCalDev/screenshot-copy-only

Supported GNOME Shell version: 51

## Description

Copy screenshots without saving a file, using GNOME's native screenshot overlay.

Press Ctrl + Print Screen to open the familiar Selection / Screen / Window
interface in Copy only mode. A small indicator shows the mode. Press Enter or
click the capture button to copy the PNG to the clipboard, ready to paste.

Press Print Screen for GNOME's usual save-and-copy behavior. Escape cancels and
clears copy-only mode. Screen recording keeps its normal behavior.

Tested on Fedora Workstation 45 with GNOME Shell 51.1 on Wayland. This extension
uses GNOME Shell's internal screenshot interface and currently supports GNOME 51.

Report issues or read the source at the project website.

## Reviewer notes

The extension wraps `open()` and `_saveScreenshot()` on `Main.screenshotUI` with
`InjectionManager`. Copy-only captures use the preview's existing texture and
geometry, `Shell.Screenshot.composite_to_stream()`, a memory output stream and
`St.Clipboard`. The normal capture and portal paths call GNOME's original method.
It adds one label, connects two signals and registers one GSettings keybinding.
Disable removes these resources and restores the original methods.

The runtime bundle includes only metadata, the two JavaScript modules, CSS,
schema XML, LICENSE and NOTICE. Development scripts and tests stay in the source
repository. No network calls, subprocesses, telemetry or global policy changes
are used by the extension at runtime.

Submission is pending maintainer code review and GNOME Extensions account access.
