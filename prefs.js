// SPDX-License-Identifier: GPL-2.0-or-later
// Copyright 2026 RobCalDev
// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.

import Adw from 'gi://Adw?version=1';
import Gdk from 'gi://Gdk?version=4.0';
import Gtk from 'gi://Gtk?version=4.0';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const SHORTCUT = 'copy-only-shortcut';

export default class ScreenshotCopyOnlyPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage({title: 'Screenshot Copy Only', icon_name: 'camera-photo-symbolic'});
        const group = new Adw.PreferencesGroup({
            title: 'Copy-only shortcut',
            description: 'Choose a shortcut to open GNOME’s screenshot overlay in Copy only mode. No shortcut is assigned by default.',
        });
        const row = new Adw.ActionRow({title: 'Keyboard shortcut', subtitle: 'Print Screen keeps its normal save-and-copy behavior.'});
        const choose = new Gtk.Button({valign: Gtk.Align.CENTER});
        const clear = new Gtk.Button({
            icon_name: 'edit-clear-symbolic',
            tooltip_text: 'Clear shortcut',
            valign: Gtk.Align.CENTER,
        });
        const update = () => {
            const [accelerator] = settings.get_strv(SHORTCUT);
            const [, keyval, modifiers] = Gtk.accelerator_parse(accelerator ?? '');
            choose.label = keyval ? Gtk.accelerator_get_label(keyval, modifiers) : 'Set shortcut…';
            clear.sensitive = Boolean(accelerator);
        };
        choose.connect('clicked', () => this._chooseShortcut(window, settings));
        clear.connect('clicked', () => settings.set_strv(SHORTCUT, []));
        row.add_suffix(choose);
        row.add_suffix(clear);
        row.activatable_widget = choose;
        group.add(row);
        page.add(group);

        const privacy = new Adw.PreferencesGroup({
            title: 'Clipboard access',
            description: 'Captures write PNG images to the clipboard without creating a screenshot file. Existing clipboard contents are never read.',
        });
        page.add(privacy);
        window.add(page);
        update();
        let changedId = settings.connect(`changed::${SHORTCUT}`, update);
        window.connect('close-request', () => {
            if (changedId)
                settings.disconnect(changedId);
            changedId = 0;
            return false;
        });
    }

    _chooseShortcut(parent, settings) {
        const dialog = new Adw.Window({
            title: 'Set copy-only shortcut',
            transient_for: parent,
            modal: true,
            destroy_with_parent: true,
            default_width: 420,
            default_height: 180,
        });
        const content = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 16,
            margin_top: 24, margin_bottom: 24,
            margin_start: 24, margin_end: 24,
        });
        content.append(new Gtk.Label({label: 'Press your new shortcut', css_classes: ['title-2']}));
        const hint = new Gtk.Label({label: 'For example, Ctrl + Print Screen.\nEscape cancels. Backspace clears.', wrap: true});
        content.append(hint);
        dialog.content = content;

        const controller = new Gtk.EventControllerKey();
        controller.connect('key-pressed', (_controller, keyval, _keycode, state) => {
            if (keyval === Gdk.KEY_Escape) {
                dialog.close();
                return true;
            }
            if (keyval === Gdk.KEY_BackSpace || keyval === Gdk.KEY_Delete) {
                settings.set_strv(SHORTCUT, []);
                dialog.close();
                return true;
            }
            const modifiers = state & Gtk.accelerator_get_default_mod_mask();
            if (!modifiers || !Gtk.accelerator_valid(keyval, modifiers)) {
                hint.label = 'Use a modifier such as Ctrl, Alt or Super with a key.';
                return true;
            }
            settings.set_strv(SHORTCUT, [Gtk.accelerator_name(keyval, modifiers)]);
            dialog.close();
            return true;
        });
        dialog.add_controller(controller);
        dialog.present();
    }
}
