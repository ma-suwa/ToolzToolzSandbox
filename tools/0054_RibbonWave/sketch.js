import { getFormattedDateTime } from "../../shared/datetime.js";

// 水平方向に並走する、波打つ滑らかな曲線(リボン)の束を描くツール。
// 単一中心の回転反復ではなく、縦方向に積み重ねる並列配置が骨格。
// 各ストランドの波の位相をずらすことで、流れるような編み目模様になる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    StrandCount: { value: 28, type: "number", min: 2, max: 80, step: 1, label: "StrandCount/曲線の本数" },
    Segments: { value: 12, type: "number", min: 2, max: 40, step: 1, label: "Segments/波の分割数(滑らかさ)" },
    Amplitude: { value: 40, type: "number", min: 0, max: 150, step: 1, label: "Amplitude/波の高さ" },
    Frequency: { value: 2, type: "number", min: 0.2, max: 8, step: 0.1, label: "Frequency/波の周期数" },
    PhaseShiftPerStrand: { value: 18, type: "number", min: -90, max: 90, step: 1, label: "PhaseShift/隣との位相ずれ" },
    AmplitudeVariance: { value: 0.15, type: "number", min: 0, max: 1, step: 0.01, label: "AmplitudeVariance/振幅のばらつき" },

    Stroke: { value: "#ffb3e6", type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 1.5, type: "number", min: 0.2, max: 6, step: 0.1, label: "StrokeWidth/線幅", category: "Color/色" },
    StrokeAlpha: { value: 0.7, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/透明度", category: "Color/色" },
    Background: { value: "#12081c", type: "color", label: "Background/背景", category: "Color/色" },

    RainbowByIndex: { value: true, type: "boolean", label: "RainbowByIndex/本ごとに色相を変える", category: "RandomColor/色" },
    HueStart: { value: 280, type: "number", min: 0, max: 360, step: 1, label: "HueStart/開始色相", category: "RandomColor/色" },
    HueEnd: { value: 340, type: "number", min: 0, max: 360, step: 1, label: "HueEnd/終了色相", category: "RandomColor/色" },
    Saturation: { value: 80, type: "number", min: 0, max: 100, step: 1, label: "Saturation/彩度", category: "RandomColor/色" },
    Lightness: { value: 70, type: "number", min: 0, max: 100, step: 1, label: "Lightness/明度", category: "RandomColor/色" }
};

export const setupP5 = (p, params, container) => {
    let seed;

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

    const drawArt = (g, currentParams, currentSeed) => {
        g.randomSeed(currentSeed);
        g.background(currentParams.Background);
        g.colorMode(p.HSL);
        g.noFill();

        const solidStroke = g.color(currentParams.Stroke);
        const solidH = g.hue(solidStroke);
        const solidS = g.saturation(solidStroke);
        const solidL = g.lightness(solidStroke);

        const strandCount = currentParams.StrandCount;
        const segments = currentParams.Segments;
        const amplitude = currentParams.Amplitude;
        const frequency = currentParams.Frequency;
        const phaseShift = g.radians(currentParams.PhaseShiftPerStrand);
        const amplitudeVariance = currentParams.AmplitudeVariance;

        g.strokeWeight(currentParams.StrokeWidth);

        const spacing = g.height / (strandCount + 1);

        for (let s = 0; s < strandCount; s++) {
            const baseline = spacing * (s + 1);
            const phase = s * phaseShift;
            const ampJitter = 1 + g.random(-amplitudeVariance, amplitudeVariance);

            if (currentParams.RainbowByIndex) {
                const hue = g.map(s, 0, Math.max(1, strandCount - 1), currentParams.HueStart, currentParams.HueEnd);
                g.stroke(hue, currentParams.Saturation, currentParams.Lightness, currentParams.StrokeAlpha);
            } else {
                g.stroke(solidH, solidS, solidL, currentParams.StrokeAlpha);
            }

            g.beginShape();
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const x = t * g.width;
                const y = baseline + Math.sin(t * g.TWO_PI * frequency + phase) * amplitude * ampJitter;
                g.curveVertex(x, y);
                if (i === 0 || i === segments) {
                    // Catmull-Rom(curveVertex)は始点・終点を制御点として複製しないと端が欠けるため補完
                    g.curveVertex(x, y);
                }
            }
            g.endShape();
        }
    };

    p.draw = function () {
        seed = p.random(1000000);
        drawArt(p, params, seed);
    };

    p.updateParams = (newParams) => {
        Object.assign(params, newParams);
        p.redraw();
    };

    p.exportSVG = () => {
        const svgGraphics = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE, p.SVG);
        drawArt(svgGraphics, params, seed);
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
