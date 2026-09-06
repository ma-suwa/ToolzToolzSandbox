import { getFormattedDateTime } from "../../shared/datetime.js";

// 0052_CurledBloomの「花弁曲線」を単一中心の回転反復ではなく、
// キャンバス全体にランダムに散りばめる、分布主導のツール。
// 中心を持たない、草むらや落ち葉のような全面的な曲線美を狙う。

const CANVAS_SIZE = 600;

export const defaultParams = {
    PetalCount: { value: 90, type: "number", min: 5, max: 400, step: 1, label: "PetalCount/花弁の数" },
    Margin: { value: 10, type: "number", min: 0, max: 200, step: 1, label: "Margin/外周の余白" },
    SizeMin: { value: 20, type: "number", min: 5, max: 200, step: 1, label: "SizeMin/最小サイズ" },
    SizeMax: { value: 70, type: "number", min: 5, max: 250, step: 1, label: "SizeMax/最大サイズ" },
    Curviness: { value: 0.5, type: "number", min: 0, max: 1.5, step: 0.01, label: "Curviness/曲線の膨らみ比率" },
    RandomizeCurveStyle: { value: true, type: "boolean", label: "RandomizeCurveStyle/C字とS字を混ぜる" },
    RotationJitter: { value: 360, type: "number", min: 0, max: 360, step: 1, label: "RotationJitter/回転のばらつき" },

    Fill: { value: "#ffffff", type: "color", label: "Fill/塗り", category: "Color/色" },
    FillAlpha: { value: 0.5, type: "number", min: 0, max: 1, step: 0.01, label: "FillAlpha/塗りの透明度", category: "Color/色" },
    Stroke: { value: "#ffffff", type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 1, type: "number", min: 0, max: 6, step: 0.1, label: "StrokeWidth/線幅", category: "Color/色" },
    StrokeAlpha: { value: 0.8, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/線の透明度", category: "Color/色" },
    Background: { value: "#182b1e", type: "color", label: "Background/背景", category: "Color/色" },

    ColorByPosition: { value: true, type: "boolean", label: "ColorByPosition/横位置で色相を変える", category: "RandomColor/色" },
    HueLeft: { value: 90, type: "number", min: 0, max: 360, step: 1, label: "HueLeft/左端の色相", category: "RandomColor/色" },
    HueRight: { value: 200, type: "number", min: 0, max: 360, step: 1, label: "HueRight/右端の色相", category: "RandomColor/色" },
    Saturation: { value: 60, type: "number", min: 0, max: 100, step: 1, label: "Saturation/彩度", category: "RandomColor/色" },
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

    // 中心(0,0)から(0,-length)へ伸びる左右対称の花弁曲線(0052_CurledBloomのdrawCurlと同系統)
    const drawPetal = (g, length, curvinessRatio, symmetric) => {
        const curviness = length * curvinessRatio;
        const c1x = curviness;
        const c1y = -length * 0.3;
        const c2x = symmetric ? curviness : -curviness;
        const c2y = -length * 0.75;

        g.beginShape();
        g.vertex(0, 0);
        g.bezierVertex(c1x, c1y, c2x, c2y, 0, -length);
        g.bezierVertex(-c2x, c2y, -c1x, c1y, 0, 0);
        g.endShape(g.CLOSE);
    };

    const drawArt = (g, currentParams, currentSeed) => {
        g.randomSeed(currentSeed);
        g.background(currentParams.Background);
        g.colorMode(p.HSL);

        const solidFill = g.color(currentParams.Fill);
        const solidFillHSL = { h: g.hue(solidFill), s: g.saturation(solidFill), l: g.lightness(solidFill) };
        const solidStroke = g.color(currentParams.Stroke);
        const solidStrokeHSL = { h: g.hue(solidStroke), s: g.saturation(solidStroke), l: g.lightness(solidStroke) };

        const count = currentParams.PetalCount;
        const margin = currentParams.Margin;
        const sizeMin = currentParams.SizeMin;
        const sizeMax = Math.max(sizeMin, currentParams.SizeMax);
        const curviness = currentParams.Curviness;
        const rotationJitter = currentParams.RotationJitter;

        for (let i = 0; i < count; i++) {
            const x = g.random(margin, g.width - margin);
            const y = g.random(margin, g.height - margin);
            const size = g.random(sizeMin, sizeMax);
            const angle = g.random(-rotationJitter / 2, rotationJitter / 2);
            const symmetric = currentParams.RandomizeCurveStyle ? g.random() < 0.5 : true;

            let fillH = solidFillHSL.h, fillS = solidFillHSL.s, fillL = solidFillHSL.l;
            let strokeH = solidStrokeHSL.h, strokeS = solidStrokeHSL.s, strokeL = solidStrokeHSL.l;

            if (currentParams.ColorByPosition) {
                const ratio = x / g.width;
                fillH = g.map(ratio, 0, 1, currentParams.HueLeft, currentParams.HueRight);
                fillS = currentParams.Saturation;
                fillL = currentParams.Lightness;
                strokeH = fillH;
                strokeS = fillS;
                strokeL = Math.min(100, fillL + 15);
            }

            g.push();
            g.translate(x, y);
            g.rotate(g.radians(angle));

            if (currentParams.StrokeWidth > 0) {
                g.strokeWeight(currentParams.StrokeWidth);
                g.stroke(strokeH, strokeS, strokeL, currentParams.StrokeAlpha);
            } else {
                g.noStroke();
            }
            g.fill(fillH, fillS, fillL, currentParams.FillAlpha);

            drawPetal(g, size, curviness, symmetric);

            g.pop();
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
