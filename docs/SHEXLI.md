# Shexli analysis

Analyzer: **Shexli 0.2.1**, installed from PyPI with its normal dependencies.

Run against the final release ZIP:

```sh
shexli dist/screenshot-copy-only@robcaldev.github.io.shell-extension.zip
```

Version 1.1.2 reports **two findings: one error, no warnings, and one manual-review
item**. This is not a clean analyzer pass.

## EGO-M-004: GNOME version ceiling

Shexli 0.2.1's `shexli/analyzer/rules/metadata.py` treats every version with
`major > 50` as a future release. Our metadata declares GNOME 51, which is the
version actually used for development and testing. The package has passed live
checks on GNOME Shell 51.1. Changing the declaration to 50 would claim untested
compatibility and make the package unavailable on its intended version.

The analyzer was not modified, and this error was not suppressed. It should be
reviewed against the GNOME release information available when submitting.

## EGO-A-005: clipboard access

`St.Clipboard.get_default()` is marked for manual reviewer scrutiny. The
extension intentionally writes a screenshot PNG to the clipboard after an
explicitly user-configured shortcut and capture action. It does not read
existing clipboard data or transmit it. Clipboard access is declared in
metadata and preferences, and the shortcut has no default assignment.

## Resolved EGO-L-005 warning

The earlier chained assignment clearing `_settings` and `_ui` was not recognized
as releasing the settings reference. Version 1.1.2 assigns `null` to each field
separately. The warning no longer appears. This changes no runtime behavior.

Shexli results supplement the behavior tests and live-session checks; GNOME's
reviewers make the final approval decision.
