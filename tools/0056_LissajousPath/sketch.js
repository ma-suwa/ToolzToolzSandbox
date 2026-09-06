import { getFormattedDateTime } from "../../shared/datetime.js";

// たった1本の連続した曲線軌跡(リサージュ曲線)を描くツール。
// 回転反復でも格子配置でもなく、パラメトリック方程式が生む
// 単一の流れるような曲線美そのものを主役にする。

const CANVAS_SIZE = 600;

export const defaultParams = {
    FreqA: { value: 3, type: "number", min: 0.2, max: 12, step: 0.1, label: "FreqA/X方向の周波数" },
    FreqB: { value: 4, type: "number", min: 0.2, max: 12, step: 0.1, label: "FreqB/Y方向の周波数" },
    PhaseDelta: { value: 90, type: "number", min: 0, max: 360, step: 1, label: "PhaseDelta/位相差" },
    AmplitudeX: { value: 240, type: "number", min: 10, max: 280, step: 1, label: "AmplitudeX/横方向の広がり" },
    AmplitudeY: { value: 240, type: "number", min: 10, max: 280, step: 1, label: "AmplitudeY/縦方向の広がり" },
    Loops: { value: 1, type: "number", min: 1, max: 20, step: 1, label: "Loops/周回数" },
    Resolution: { value: 900, type: "number", min: 50, max: 3000, step: 10, label: "Resolution/解像度(滑らかさ)" },

    Stroke: { value: "#ffe08a", type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 1.5, type: "number", min: 0.2, max: 6, step: 0.1, label: "StrokeWidth/線幅", category: "Color/色" },
    StrokeAlpha: { value: 0.9, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/透明度", category: "Color/色" },
    Background: { value: "#050510", type: "color", label: "Background/背景", category: "Color/色" },

    RainbowAlongPath: { value: true, type: "boolean", label: "RainbowAlongPath/軌跡に沿って色を変える", category: "RandomColor/色" },
    HueStart: { value: 20, type: "number", min: 0, max: 360, step: 1, label: "HueStart/始点の色相", category: "RandomColor/色" },
    HueEnd: { value: 280, type: "number", min: 0, max: 360, step: 1, label: "HueEnd/終点の色相", category: "RandomColor/色" },
    Saturation: { value: 85, type: "number", min: 0, max: 100, step: 1, label: "Saturation/彩度", category: "RandomColor/色" },
    Lightness: { value: 65, type: "number", min: 0, max: 100, step: 1, label: "Lightness/明度", category: "RandomColor/色" }
};

export const setupP5 = (p, params, container) => {
    p.setup = function () {
        const canvas = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
        if (container) {
            canvas.parent(container);
        }
        canvas.elt.style.width = '100%';
        canvas.elt.style.height = 'auto';
        p.noLoop();
        setTimeout(() => {
            p.redraw();
        }, 0);
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.colorMode(p.HSL);
        g.noFill();

        const solidStroke = g.color(currentParams.Stroke);
        const solidH = g.hue(solidStroke);
        const solidS = g.saturation(solidStroke);
        const solidL = g.lightness(solidStroke);

        const cx = g.width / 2;
        const cy = g.height / 2;
        const freqA = currentParams.FreqA;
        const freqB = currentParams.FreqB;
        const phase = g.radians(currentParams.PhaseDelta);
        const ampX = currentParams.AmplitudeX;
        const ampY = currentParams.AmplitudeY;
        const loops = currentParams.Loops;
        const resolution = Math.max(2, Math.round(currentParams.Resolution));

        g.strokeWeight(currentParams.StrokeWidth);

        let prevX = null;
        let prevY = null;

        for (let i = 0; i <= resolution; i++) {
            const t = (i / resolution) * g.TWO_PI * loops;
            const x = cx + ampX * Math.sin(freqA * t + phase);
            const y = cy + ampY * Math.sin(freqB * t);

            if (prevX !== null) {
                if (currentParams.RainbowAlongPath) {
                    const hue = g.map(i, 0, resolution, currentParams.HueStart, currentParams.HueEnd);
                    g.stroke(hue, currentParams.Saturation, currentParams.Lightness, currentParams.StrokeAlpha);
                } else {
                    g.stroke(solidH, solidS, solidL, currentParams.StrokeAlpha);
                }
                g.line(prevX, prevY, x, y);
            }

            prevX = x;
            prevY = y;
        }
    };

    p.draw = function () {
        drawArt(p, params);
    };

    p.updateParams = (newParams) => {
        Object.assign(params, newParams);
        p.redraw();
    };

    p.exportSVG = () => {
        const svgGraphics = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE, p.SVG);
        drawArt(svgGraphics, params);
        const filename = getFormattedDateTime();
        svgGraphics.save(`${filename}.svg`);
        try { svgGraphics.remove(); } catch (e) { /* p5-svgのcreateGraphics後始末で例外が出る既知の挙動を無視 */ }
    };

    p.exportPNG = () => {
        const image = p.get();
        const filename = getFormattedDateTime();
        image.save(filename, 'png');
    };

    p.windowResized = () => {
        if (p.canvas && p.canvas.elt && p.canvas.elt.style) {
            p.canvas.elt.style.width = '100%';
            p.canvas.elt.style.height = 'auto';
        }
    };
};
