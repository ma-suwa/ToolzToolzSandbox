import { getFormattedDateTime } from "../../shared/datetime.js";
import { multiLerpColor } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors } from "../../shared/layout.js";

// 正弦波で波打つグラデーションのリボン群を、フィロタキシス配置という
// 一定のルールで複数パッチ、それぞれ別々の大きさ・位相で動的に生成する。
// さらに、シェイプごとに「色の並び順」と「傾き」も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 9, type: "number", min: 1, max: 40, step: 1, label: "ShapeCount/シェイプの数", category: "Layout/配置" },
    SpreadRadius: { value: 210, type: "number", min: 0, max: 290, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    SizeMin: { value: 80, type: "number", min: 20, max: 300, step: 1, label: "SizeMin/最小幅", category: "Layout/配置" },
    SizeMax: { value: 200, type: "number", min: 20, max: 400, step: 1, label: "SizeMax/最大幅", category: "Layout/配置" },
    AspectRatio: { value: 0.6, type: "number", min: 0.1, max: 1.5, step: 0.01, label: "AspectRatio/縦横比(高さ/幅)", category: "Layout/配置" },
    RotationJitter: { value: 0.4, type: "number", min: 0, max: 1, step: 0.01, label: "RotationJitter/傾きのばらつき", category: "Layout/配置" },

    RowCount: { value: 8, type: "number", min: 2, max: 30, step: 1, label: "RowCount/1シェイプ内の線の本数" },
    Amplitude: { value: 10, type: "number", min: 0, max: 60, step: 1, label: "Amplitude/波の振幅" },
    Frequency: { value: 2, type: "number", min: 0.2, max: 8, step: 0.1, label: "Frequency/波の周波数" },
    LineWeight: { value: 4, type: "number", min: 1, max: 16, step: 0.5, label: "LineWeight/線の太さ" },

    ColorTop: { value: "#00c9ff", type: "color", label: "ColorTop/上端の色", category: "Color/色" },
    ColorMid: { value: "#92fe9d", type: "color", label: "ColorMid/中間の色", category: "Color/色" },
    ColorBottom: { value: "#ff00cc", type: "color", label: "ColorBottom/下端の色", category: "Color/色" },
    Background: { value: "#0b0b12", type: "color", label: "Background/背景", category: "Color/色" }
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

    const drawWaveRibbonPatch = (g, w, h, phase, colors, currentParams) => {
        const rows = Math.max(2, Math.round(currentParams.RowCount));
        g.strokeWeight(currentParams.LineWeight);
        g.strokeCap(g.ROUND);
        g.noFill();

        for (let i = 0; i < rows; i++) {
            const t = i / (rows - 1);
            const baseY = -h / 2 + t * h;
            const rowPhase = phase + i * 0.6;
            g.stroke(multiLerpColor(g, colors, t));

            g.beginShape();
            for (let x = -w / 2; x <= w / 2; x += 6) {
                const y = baseY + Math.sin((x / w) * g.TWO_PI * currentParams.Frequency + rowPhase) * currentParams.Amplitude;
                g.vertex(x, y);
            }
            g.endShape();
        }
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);

        const baseColors = [currentParams.ColorTop, currentParams.ColorMid, currentParams.ColorBottom];
        const cx = g.width / 2;
        const cy = g.height / 2;
        const points = phyllotaxisPoints(currentParams.ShapeCount, currentParams.SpreadRadius, cx, cy);

        points.forEach((pt) => {
            const w = hashRange(pt.index, currentParams.SizeMin, currentParams.SizeMax);
            const h = w * currentParams.AspectRatio;
            const phase = hashRange(pt.index + 1000, 0, Math.PI * 2);
            const rotJitter = hashRange(pt.index + 2000, -180, 180) * currentParams.RotationJitter;
            const instanceColors = shuffleColors(baseColors, pt.index);

            g.push();
            g.translate(pt.x, pt.y);
            g.rotate(g.radians(rotJitter));
            drawWaveRibbonPatch(g, w, h, phase, instanceColors, currentParams);
            g.pop();
        });
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
