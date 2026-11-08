import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SourceTextModule, SyntheticModule} from 'node:vm';
import {test} from 'node:test';

// Load the real extension modules with desktop services replaced by observable
// fakes. This exercises routing/cleanup without capturing the user's desktop.
async function fixture({shortcut = ['<Control>Print']} = {}) {
    const calls = {saved: 0, copied: [], composites: [], notifications: [], streams: []};
    class Signals {
        handlers = new Map();
        connect(name, callback) {
            const id = this.handlers.size + 1;
            this.handlers.set(id, {name, callback});
            return id;
        }
        disconnect(id) { this.handlers.delete(id); }
        emit(name) {
            for (const handler of this.handlers.values()) {
                if (handler.name === name)
                    handler.callback();
            }
        }
    }
    const settings = Object.assign(new Signals(), {
        shortcut,
        get_strv() { return this.shortcut; },
        set_strv(_key, values) { this.shortcut = values; this.emit('changed::copy-only-shortcut'); },
    });
    const texture = name => ({get_texture: () => name});
    const ui = Object.assign(new Signals(), {
        visible: false, _openingCoroutineInProgress: false,
        screencast_in_progress: false,
        _selectionButton: {checked: true}, _screenButton: {checked: false},
        _windowButton: {checked: false},
        _shotButton: Object.assign(new Signals(), {checked: true}),
        _stageScreenshot: {get_content: () => texture('screen')},
        _getSelectedGeometry: () => [20, 40, 600, 400],
        _scale: 2, _cursorScale: 1.5,
        _cursor: {visible: true, content: texture('cursor'), x: 3, y: 4},
        _windowSelectors: [{windows: () => [{
            checked: true, windowContent: texture('window'), bufferScale: 1.25,
            getCursorTexture: () => texture('window-cursor'), cursorPoint: {x: 6, y: 8},
        }]}],
        _panel: {insert_child_at_index: hint => { calls.hint = hint; }},
        async open() {
            if (calls.openGate) await calls.openGate;
            if (calls.openError) throw new Error('Open failed');
            this.visible = true;
        },
        async _saveScreenshot() { calls.saved++; },
    });
    class InjectionManager {
        saved = [];
        overrideMethod(object, key, factory) {
            this.saved.push([object, key, object[key]]);
            object[key] = factory(object[key]);
        }
        clear() {
            for (const [object, key, value] of this.saved)
                object[key] = value;
        }
    }
    const main = {
        screenshotUI: ui,
        wm: {
            addKeybinding: (_name, _settings, _flags, _modes, handler) => {
                calls.bindingAttempts = (calls.bindingAttempts ?? 0) + 1;
                if (calls.bindingFailure) return 0;
                calls.shortcut = handler;
                return 1;
            },
            removeKeybinding: () => { calls.shortcut = null; },
        },
        notify: (...args) => calls.notifications.push(args),
        notifyError: (...args) => calls.notifications.push(args),
    };
    const mocks = {
        'gi://Clutter': {default: {ActorAlign: {CENTER: 2}}},
        'gi://Meta': {default: {KeyBindingFlags: {NONE: 0}, KeyBindingAction: {NONE: 0}}},
        'gi://Shell': {default: {
            ActionMode: {NORMAL: 1, OVERVIEW: 2},
            Screenshot: {composite_to_stream: async (...args) => {
                calls.composites.push(args);
                if (calls.compositeGate) await calls.compositeGate;
                if (calls.compositeError)
                    throw new Error('Compositor failed');
            }},
        }},
        'gi://Gio': {default: {Cancellable: class {
            cancelled = false;
            cancel() { this.cancelled = true; }
            is_cancelled() { return this.cancelled; }
        }, MemoryOutputStream: {new_resizable: () => {
            const stream = {
                closed: false, close() { this.closed = true; },
                is_closed() { return this.closed; }, steal_as_bytes: () => 'PNG bytes',
            };
            calls.streams.push(stream);
            return stream;
        }}}},
        'gi://St': {default: {
            Label: class {
                constructor(properties) { Object.assign(this, properties); }
                destroy() { this.destroyed = true; }
            },
            ClipboardType: {CLIPBOARD: 1},
            Clipboard: {get_default: () => ({set_content: (...args) => calls.copied.push(args)})},
        }},
        'resource:///org/gnome/shell/extensions/extension.js': {
            Extension: class { getSettings() { return settings; } }, InjectionManager,
        },
        'resource:///org/gnome/shell/ui/main.js': main,
    };
    const modules = new Map();
    async function load(specifier) {
        if (modules.has(specifier))
            return modules.get(specifier);
        let module;
        if (mocks[specifier]) {
            const exports = mocks[specifier];
            module = new SyntheticModule(Object.keys(exports), function () {
                for (const [key, value] of Object.entries(exports))
                    this.setExport(key, value);
            });
        } else {
            const filename = specifier === './capture.js' ? 'capture.js' : 'extension.js';
            module = new SourceTextModule(await readFile(new URL(`../${filename}`, import.meta.url), 'utf8'));
        }
        modules.set(specifier, module);
        await module.link(load);
        return module;
    }
    const module = await load('./extension.js');
    await module.evaluate();
    const extension = new module.namespace.default();
    return {extension, ui, calls, settings};
}

test('normal Print delegates to stock saving; copy shortcut uses only memory/clipboard', async () => {
    const {extension, ui, calls} = await fixture();
    extension.enable();
    await ui.open();
    await ui._saveScreenshot();
    assert.equal(calls.saved, 1);
    assert.equal(calls.hint.visible, false);
    ui.visible = false;
    calls.shortcut();
    assert.equal(calls.hint.visible, true);
    await ui._saveScreenshot();
    assert.equal(calls.saved, 1);
    assert.deepEqual(calls.copied, [[1, 'image/png', 'PNG bytes']]);
    assert.deepEqual(calls.composites[0].slice(0, -1),
        ['screen', 20, 40, 600, 400, 2, 'cursor', 6, 8, 1.5]);
    assert.equal(calls.streams[0].closed, true);
    extension.disable();
});

test('window capture preserves fractional scale and cursor, fullscreen shares area path', async () => {
    const {extension, ui, calls} = await fixture();
    extension.enable();
    calls.shortcut();
    ui._selectionButton.checked = false;
    ui._windowButton.checked = true;
    await ui._saveScreenshot();
    assert.deepEqual(calls.composites[0].slice(0, -1),
        ['window', 0, 0, -1, -1, 1.25, 'window-cursor', 7.5, 10, 1.5]);
    ui._windowButton.checked = false;
    ui._screenButton.checked = true;
    ui._cursor.visible = false;
    await ui._saveScreenshot();
    assert.equal(calls.composites[1][6], null);
    assert.equal(calls.saved, 0);
    extension.disable();
});

test('cancel, normal reopen and portal reopen reset mode; recording hides indicator', async () => {
    const {extension, ui, calls} = await fixture();
    extension.enable();
    calls.shortcut();
    ui._shotButton.checked = false;
    ui._shotButton.emit('notify::checked');
    assert.equal(calls.hint.visible, false);
    ui._shotButton.checked = true;
    ui._shotButton.emit('notify::checked');
    assert.equal(calls.hint.visible, true);
    ui.emit('closed');
    assert.equal(calls.hint.visible, false);
    ui.visible = false;
    calls.shortcut();
    await ui.open(2); // GNOME's portal-only mode must retain its file contract.
    await ui._saveScreenshot();
    assert.equal(calls.saved, 1);
    await ui.open();
    assert.equal(calls.hint.visible, false);
    extension.disable();
});

test('capture errors never fall back to disk and close the memory stream', async () => {
    const {extension, ui, calls} = await fixture();
    extension.enable();
    calls.shortcut();
    calls.compositeError = true;
    await assert.rejects(ui._saveScreenshot(), /Compositor failed/);
    assert.equal(calls.saved, 0);
    assert.equal(calls.copied.length, 0);
    assert.equal(calls.streams[0].closed, true);
    ui._stageScreenshot.get_content = () => null;
    await assert.rejects(ui._saveScreenshot(), /preview is unavailable/);
    assert.equal(calls.saved, 0);
    extension.disable();
});

test('disable restores methods, removes shortcut, indicator and signal handlers', async () => {
    const {extension, ui, calls} = await fixture();
    const originalOpen = ui.open;
    const originalSave = ui._saveScreenshot;
    extension.enable();
    calls.shortcut();
    extension.disable();
    assert.equal(ui.open, originalOpen);
    assert.equal(ui._saveScreenshot, originalSave);
    assert.equal(calls.shortcut, null);
    assert.equal(calls.hint.destroyed, true);
    assert.equal(ui.handlers.size, 0);
    assert.equal(ui._shotButton.handlers.size, 0);
    extension.enable();
    assert.equal(calls.hint.visible, false);
    extension.disable();
});

test('setup failure rolls back all modifications', async () => {
    const {extension, ui, calls} = await fixture();
    const originalSave = ui._saveScreenshot;
    ui._panel.insert_child_at_index = () => { throw new Error('Panel failed'); };
    assert.throws(() => extension.enable(), /Panel failed/);
    assert.equal(ui._saveScreenshot, originalSave);
    assert.equal(extension._hint, null);
    assert.equal(ui.handlers.size, 0);
});

test('no default shortcut is registered; assigning, changing and clearing apply immediately', async () => {
    const {extension, calls, settings} = await fixture({shortcut: []});
    extension.enable();
    assert.equal(calls.shortcut, undefined);
    assert.equal(calls.bindingAttempts, undefined);
    assert.equal(calls.notifications.length, 0);
    settings.set_strv('copy-only-shortcut', ['<Control>Print']);
    assert.equal(typeof calls.shortcut, 'function');
    settings.set_strv('copy-only-shortcut', ['<Super>Print']);
    assert.equal(calls.bindingAttempts, 2);
    settings.set_strv('copy-only-shortcut', []);
    assert.equal(calls.shortcut, null);
    extension.disable();
    assert.equal(settings.handlers.size, 0);
});

test('unavailable shortcut reports the problem and remains recoverable in preferences', async () => {
    const {extension, calls, settings} = await fixture();
    calls.bindingFailure = true;
    extension.enable();
    assert.equal(calls.notifications[0][0], 'Shortcut unavailable');
    calls.bindingFailure = false;
    settings.set_strv('copy-only-shortcut', ['<Super>Print']);
    assert.equal(typeof calls.shortcut, 'function');
    extension.disable();
});

test('disable during compositing prevents clipboard writes and notifications and closes stream', async () => {
    const {extension, ui, calls} = await fixture();
    extension.enable();
    calls.shortcut();
    let finish;
    calls.compositeGate = new Promise(resolve => { finish = resolve; });
    const capture = ui._saveScreenshot();
    extension.disable();
    finish();
    await capture;
    assert.equal(calls.copied.length, 0);
    assert.equal(calls.notifications.length, 0);
    assert.equal(calls.saved, 0);
    assert.equal(calls.streams[0].closed, true);
});

test('re-enabling cannot revive a capture from the previous activation', async () => {
    const {extension, ui, calls} = await fixture();
    extension.enable();
    calls.shortcut();
    let finish;
    calls.compositeGate = new Promise(resolve => { finish = resolve; });
    const oldCapture = ui._saveScreenshot();
    extension.disable();
    extension.enable();
    finish();
    await oldCapture;
    assert.equal(calls.copied.length, 0);
    assert.equal(calls.notifications.length, 0);
    ui.visible = false;
    calls.shortcut();
    await ui._saveScreenshot();
    assert.equal(calls.copied.length, 1);
    assert.equal(calls.notifications.length, 1);
    extension.disable();
});

test('a compositor rejection after disable is silent and still closes the stream', async () => {
    const {extension, ui, calls} = await fixture();
    extension.enable();
    calls.shortcut();
    let reject;
    calls.compositeGate = new Promise((_resolve, fail) => { reject = fail; });
    const capture = ui._saveScreenshot();
    extension.disable();
    reject(new Error('Late compositor failure'));
    await capture;
    assert.equal(calls.copied.length, 0);
    assert.equal(calls.notifications.length, 0);
    assert.equal(calls.streams[0].closed, true);
});

test('a pending open failure after disable has no extension callbacks or notifications', async () => {
    const {extension, calls} = await fixture();
    extension.enable();
    let finish;
    calls.openGate = new Promise(resolve => { finish = resolve; });
    calls.openError = true;
    calls.shortcut();
    extension.disable();
    finish();
    await new Promise(setImmediate);
    assert.equal(calls.notifications.length, 0);
    assert.equal(extension._copyOnly, false);
});
