// SPDX-License-Identifier: GPL-2.0-or-later
// Copyright 2026 RobCalDev
// Capture geometry and compositing adapted from GNOME Shell's js/ui/screenshot.js.
// Copyright the GNOME Shell contributors; see NOTICE for source and attribution.

import Gio from 'gi://Gio';
import Shell from 'gi://Shell';
import St from 'gi://St';

// These are the same textures, geometry and cursor coordinates used by
// ScreenshotUI._saveScreenshot() in GNOME 51. No new screen grab is taken.
export function getCaptureParameters(ui) {
    if (ui._selectionButton.checked || ui._screenButton.checked) {
        const content = ui._stageScreenshot.get_content();
        if (!content)
            throw new Error('The screenshot preview is unavailable');

        return {
            texture: content.get_texture(),
            geometry: ui._getSelectedGeometry(true),
            scale: ui._scale,
            cursor: {
                texture: ui._cursor.visible
                    ? ui._cursor.content?.get_texture() ?? null : null,
                x: ui._cursor.x * ui._scale,
                y: ui._cursor.y * ui._scale,
                scale: ui._cursorScale,
            },
        };
    }

    if (ui._windowButton.checked) {
        const window = ui._windowSelectors.flatMap(selector => selector.windows())
            .find(win => win.checked);
        if (!window?.windowContent)
            throw new Error('The selected window preview is unavailable');

        return {
            texture: window.windowContent.get_texture(),
            geometry: null,
            scale: window.bufferScale,
            cursor: {
                texture: ui._cursor.visible
                    ? window.getCursorTexture()?.get_texture() ?? null : null,
                x: window.cursorPoint.x * window.bufferScale,
                y: window.cursorPoint.y * window.bufferScale,
                scale: ui._cursorScale,
            },
        };
    }

    throw new Error('No screenshot target is selected');
}

export async function copyScreenshot(ui, cancellable) {
    if (cancellable.is_cancelled())
        return false;
    // Snapshot all parameters before the asynchronous compositor operation.
    const {texture, geometry, scale, cursor} = getCaptureParameters(ui);
    const [x, y, width, height] = geometry ?? [0, 0, -1, -1];
    const stream = Gio.MemoryOutputStream.new_resizable();
    try {
        await Shell.Screenshot.composite_to_stream(
            texture, x, y, width, height, scale,
            cursor.texture, cursor.x, cursor.y, cursor.scale, stream);
        // Compositing itself is not cancellable. Discard its result if the
        // extension was disabled while awaiting it, before touching the clipboard.
        if (cancellable.is_cancelled())
            return false;
        stream.close(null);
        const bytes = stream.steal_as_bytes();
        St.Clipboard.get_default().set_content(
            St.ClipboardType.CLIPBOARD, 'image/png', bytes);
        return true;
    } finally {
        if (!stream.is_closed())
            stream.close(null);
    }
}
