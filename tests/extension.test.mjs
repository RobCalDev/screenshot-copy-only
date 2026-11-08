import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SourceTextModule, SyntheticModule} from 'node:vm';
import {test} from 'node:test';

// Load the real extension modules with desktop services replaced by observable
// fakes. This exercises routing/cleanup without capturing the user's desktop.
async function fixture() {
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
        async open() { this.visible = true; },
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
                calls.shortcut = handler;
                return calls.bindingFailure ? 0 : 1;
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
                if (calls.compositeError)
                    throw new Error('Compositor failed');
            }},
        }},
        'gi://Gio': {default: {MemoryOutputStream: {new_resizable: () => {
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
            Extension: class { getSettings() { return {}; } }, InjectionManager,
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
    return {extension, ui, calls};
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

test('shortcut registration failure rolls back all modifications', async () => {
    const {extension, ui, calls} = await fixture();
    const originalSave = ui._saveScreenshot;
    calls.bindingFailure = true;
    assert.throws(() => extension.enable(), /register Ctrl/);
    assert.equal(ui._saveScreenshot, originalSave);
    assert.equal(calls.hint.destroyed, true);
    assert.equal(ui.handlers.size, 0);
});
