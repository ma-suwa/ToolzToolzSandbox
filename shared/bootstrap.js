import { Pane } from './vendor/tweakpane.js';
import { createTweakPane } from './createTweakPane.js';
import { getParamsFromUrl, createUrlUpdater } from './urlParams.js';

// 各ツールの sketch.js ({ defaultParams, setupP5 }) を受け取り、
// p5インスタンスの生成・TweakPaneの構築・URL同期・SVG/PNGダウンロードを配線する
export function init({ defaultParams, setupP5 }) {
    const canvasContainer = document.getElementById('canvas-container');
    const paneContainer = document.getElementById('pane-container');

    const params = getParamsFromUrl(defaultParams);

    const instance = new p5((p) => {
        setupP5(p, params, canvasContainer);
    });

    const pane = new Pane({ title: 'Parameters', container: paneContainer });
    const updateUrl = createUrlUpdater(params, pane.element);

    const exportFolder = pane.addFolder({ title: 'Download', expanded: true });
    exportFolder.addButton({ title: 'SVG Download' }).on('click', () => {
        instance.exportSVG?.();
    });
    exportFolder.addButton({ title: 'PNG Download' }).on('click', () => {
        instance.exportPNG?.();
    });

    createTweakPane(defaultParams, pane, params, updateUrl, instance);

    window.addEventListener('popstate', () => {
        const newParams = getParamsFromUrl(defaultParams);
        Object.assign(params, newParams);
        instance.updateParams?.(params);
        pane.refresh();
    });

    return { instance, pane, params };
}
