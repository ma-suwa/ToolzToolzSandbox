import { getFormattedDateTime } from "../../shared/datetime.js";

// 散布した点同士を「直線」ではなく「弧(曲線)」で結ぶ有機的なネットワーク。
// 0026/0050のNetwork系ツールと骨格(点群+近傍接続)は近いが、
// つなぎ方を曲線にすることで蔓(つる)や血管のような曲線美を狙う。

const CANVAS_SIZE = 600;

export const defaultParams = {
    PointCount: { value: 60, type: "number", min: 5, max: 200, step: 1, label: "PointCount/点の数" },
    Margin: { value: 40, type: "number", min: 0, max: 200, step: 1, label: "Margin/外周の余白" },
    MaxDistance: { value: 320, type: "number", min: 10, max: 900, step: 1, label: "MaxDistance/最大接続距離" },
    Density: { value: 0.12, type: "number", min: 0, max: 1, step: 0.01, label: "Density/接続の密度" },
    CurveBulge: { value: 0.35, type: "number", min: 0, max: 1.2, step: 0.01, label: "CurveBulge/弧の膨らみ" },
    BulgeRandomness: { value: 0.5, type: "number", min: 0, max: 1, step: 0.01, label: "BulgeRandomness/膨らみのばらつき" },

    ShowPoints: { value: true, type: "boolean", label: "ShowPoints/点を表示", category: "Point/点" },
    PointSize: { value: 3, type: "number", min: 0, max: 12, step: 0.5, label: "PointSize/点のサイズ", category: "Point/点" },

    Stroke: { value: "#8bffa8", type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 1, type: "number", min: 0.2, max: 6, step: 0.1, label: "StrokeWidth/線幅", category: "Color/色" },
    StrokeAlpha: { value: 0.6, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/透明度", category: "Color/色" },
    Background: { value: "#04160f", type: "color", label: "Background/背景", category: "Color/色" },

    ColorByLength: { value: true, type: "boolean", label: "ColorByLength/線の長さで色相を決める", category: "RandomColor/色" },
    HueShort: { value: 140, type: "number", min: 0, max: 360, step: 1, label: "HueShort/短い線の色相", category: "RandomColor/色" },
    HueLong: { value: 40, type: "number", min: 0, max: 360, step: 1, label: "HueLong/長い線の色相", category: "RandomColor/色" },
    Saturation: { value: 70, type: "number", min: 0, max: 100, step: 1, label: "Saturation/彩度", category: "RandomColor/色" },
    Lightness: { value: 65, type: "number", min: 0, max: 100, step: 1, label: "Lightness/明度", category: "RandomColor/色" }
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

        const count = currentParams.PointCount;
        const margin = currentParams.Margin;
        const maxDistance = currentParams.MaxDistance;
        const density = currentParams.Density;
        const bulge = currentParams.CurveBulge;
        const bulgeRandomness = currentParams.BulgeRandomness;

        const points = [];
        for (let i = 0; i < count; i++) {
            points.push({
                x: g.random(margin, g.width - margin),
                y: g.random(margin, g.height - margin)
            });
        }

        g.strokeWeight(currentParams.StrokeWidth);

        for (let i = 0; i < points.length - 1; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const a = points[i];
                const b = points[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDistance && g.random() < density) {
                    const midX = (a.x + b.x) / 2;
                    const midY = (a.y + b.y) / 2;
                    const perpX = -dy / dist;
                    const perpY = dx / dist;
                    const jitter = 1 + g.random(-bulgeRandomness, bulgeRandomness);
                    const sign = g.random() < 0.5 ? 1 : -1;
                    const bulgeAmount = dist * bulge * jitter * sign;
                    const ctrlX = midX + perpX * bulgeAmount;
                    const ctrlY = midY + perpY * bulgeAmount;

                    if (currentParams.ColorByLength) {
                        const ratio = Math.min(1, dist / maxDistance);
                        const hue = g.map(ratio, 0, 1, currentParams.HueShort, currentParams.HueLong);
                        g.stroke(hue, currentParams.Saturation, currentParams.Lightness, currentParams.StrokeAlpha);
                    } else {
                        g.stroke(solidH, solidS, solidL, currentParams.StrokeAlpha);
                    }

                    // 中間制御点を1つだけ使い、単純な弧(2次ベジエ相当)を描く
                    g.bezier(a.x, a.y, ctrlX, ctrlY, ctrlX, ctrlY, b.x, b.y);
                }
            }
        }

        if (currentParams.ShowPoints && currentParams.PointSize > 0) {
            g.noStroke();
            g.fill(solidH, solidS, solidL, 1);
            for (const pt of points) {
                g.ellipse(pt.x, pt.y, currentParams.PointSize, currentParams.PointSize);
            }
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
