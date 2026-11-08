// SPDX-License-Identifier: GPL-2.0-or-later
// Copyright 2026 RobCalDev
// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {copyScreenshot} from './capture.js';

const SHORTCUT = 'copy-only-shortcut';

export default class ScreenshotCopyOnly extends Extension {
    enable() {
        this._ui = Main.screenshotUI;
        const ui = this._ui;
        this._copyOnly = false;
        this._nextOpenCopyOnly = false;
        this._injections = new InjectionManager();
        this._cancellable = new Gio.Cancellable();
        const cancellable = this._cancellable;
        try {
            this._hint = new St.Label({
                text: 'Copy only',
                style_class: 'screenshot-copy-only-hint',
                x_align: Clutter.ActorAlign.CENTER,
                visible: false,
                reactive: false,
            });
            ui._panel.insert_child_at_index(this._hint, 0);
            this._closedId = ui.connect('closed', () => this._setCopyOnly(false));
            this._shotId = ui._shotButton.connect('notify::checked', () => this._syncHint());

            const extension = this;
            this._injections.overrideMethod(ui, 'open', original => function (...args) {
                // Every opening, including portal requests and the stock shortcut,
                // defaults to normal behavior unless our shortcut requested it.
                const copyOnly = extension._nextOpenCopyOnly;
                extension._nextOpenCopyOnly = false;
                extension._setCopyOnly(copyOnly);
                return original.apply(this, args);
            });
            this._injections.overrideMethod(ui, '_saveScreenshot', original => function (...args) {
                if (!extension._copyOnly)
                    return original.apply(this, args);
                // Never fall back to saving when a copy-only capture fails.
                return copyScreenshot(this, cancellable).then(copied => {
                    if (copied && !cancellable.is_cancelled())
                        Main.notify('Screenshot copied', 'You can paste the image from the clipboard.');
                }).catch(error => {
                    if (cancellable.is_cancelled())
                        return;
                    Main.notifyError('Could not copy screenshot', error.message);
                    throw error;
                });
            });

            this._settings = this.getSettings();
            this._shortcutId = this._settings.connect(`changed::${SHORTCUT}`, () => this._syncShortcut());
            this._syncShortcut();
        } catch (error) {
            this.disable();
            throw error;
        }
    }

    disable() {
        this._cancellable?.cancel();
        this._cancellable = null;
        if (this._bindingAdded)
            Main.wm.removeKeybinding(SHORTCUT);
        this._bindingAdded = false;
        if (this._shortcutId)
            this._settings.disconnect(this._shortcutId);
        this._shortcutId = 0;
        this._injections?.clear();
        this._injections = null;
        if (this._closedId)
            this._ui.disconnect(this._closedId);
        if (this._shotId)
            this._ui._shotButton.disconnect(this._shotId);
        this._closedId = this._shotId = 0;
        this._hint?.destroy();
        this._hint = null;
        this._copyOnly = this._nextOpenCopyOnly = false;
        this._settings = this._ui = null;
    }

    _syncShortcut() {
        if (this._bindingAdded)
            Main.wm.removeKeybinding(SHORTCUT);
        this._bindingAdded = false;
        if (this._settings.get_strv(SHORTCUT).length === 0)
            return;

        const action = Main.wm.addKeybinding(
            SHORTCUT, this._settings, Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => this._openCopyOnly());
        this._bindingAdded = action !== Meta.KeyBindingAction.NONE;
        if (!this._bindingAdded)
            Main.notifyError('Shortcut unavailable', 'Choose another shortcut in Screenshot Copy Only preferences.');
    }

    _openCopyOnly() {
        const ui = this._ui;
        if (ui.visible || ui._openingCoroutineInProgress || ui.screencast_in_progress)
            return;

        this._nextOpenCopyOnly = true;
        const cancellable = this._cancellable;
        ui.open().catch(error => {
            if (cancellable.is_cancelled())
                return;
            this._setCopyOnly(false);
            Main.notifyError('Could not open screenshot tool', error.message);
        });
    }

    _setCopyOnly(copyOnly) {
        this._copyOnly = copyOnly;
        this._syncHint();
    }

    _syncHint() {
        if (this._hint)
            this._hint.visible = this._copyOnly && this._ui._shotButton.checked;
    }
}
