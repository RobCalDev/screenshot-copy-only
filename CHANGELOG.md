# Changelog

## 1.1.1

- Removed personal-use submission notices after the maintainer confirmed code review.
- Removed unnecessary metadata from the demonstration PNG without changing pixels.
- Audited public history, release archives and publishing metadata for personal
  or machine-specific information; retained the public RobCalDev project identity.
- No runtime behavior changes from 1.1.0.

## 1.1.0

- No copy-only keyboard shortcut is assigned by default.
- New preferences let users assign or clear their own shortcut, such as Ctrl + Print.
- Shortcut changes take effect immediately without restarting the extension.
- The description explicitly declares that captured PNGs are written to the clipboard
  and existing clipboard contents are never read.
- Disabling cancels pending copy-only results and suppresses late notifications,
  including after re-enabling the extension.
- Updated packaging includes the GTK/Adwaita preferences module.

## 1.0.0

- Ctrl + Print Screen opens GNOME's native screenshot overlay in copy-only mode.
- A small indicator identifies copy-only captures.
- Selection, screen and window captures go straight to the clipboard without a file.
- Ordinary Print Screen retains the normal save-and-copy behavior.
- Cancelling resets the mode; disabling restores the original screenshot methods.
- Initial support: GNOME Shell 51, tested locally on Fedora Workstation 45 with GNOME 51.1 and Wayland.
