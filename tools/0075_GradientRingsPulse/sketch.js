import { getFormattedDateTime } from "../../shared/datetime.js";
import { multiLerpColor, triangleWave } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors } from "../../shared/layout.js";

// 同心円のパルス(リング)クラスターを、フィロタキシス配置という
// 一定のルールで複数個、それぞれ別々の大きさで動的に生成する。
// さらに、シェイプごとに「色の並び順」と「往復回数(パルスのリズム)」も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 10, type: "number", min: 1, max: 40, step: 1, label: "ShapeCount/シェイプの数", category: "Layout/配置" },
    SpreadRadius: { value: 220, type: "number", min: 0, max: 290, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    SizeMin: { value: 30, type: "number", min: 5, max: 150, step: 1, label: "SizeMin/最小半径", category: "Layout/配置" },
    SizeMax: { value: 90, type: "number", min: 5, max: 250, step: 1, label: "SizeMax/最大半径", category: "Layout/配置" },

    RingsPerShape: { value: 14, type: "number", min: 2, max: 60, step: 1, label: "RingsPerShape/1シェイプ内のリング数" },
    SpacingEase: { value: 1, type: "number", min: 0.3, max: 3, step: 0.05, label: "SpacingEase/間隔のカーブ(1=均等)" },
    PulseCycles: { value: 3, type: "number", min: 1, max: 10, step: 1, label: "PulseCycles/往復回数(最大, シェイプごとに変動)" },
    StrokeMax: { value: 5, type: "number", min: 0.5, max: 20, step: 0.5, label: "StrokeMax/外側の線幅" },
    StrokeMin: { value: 0.5, type: "number", min: 0.2, max: 15, step: 0.5, label: "StrokeMin/中心の線幅" },

    ColorA: { value: "#00fff0", type: "color", label: "ColorA", category: "Color/色" },
    ColorB: { value: "#7b2ff7", type: "color", label: "ColorB", category: "Color/色" },
    Background: { value: "#050510", type: "color", label: "Background/背景", category: "Color/色" }
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

    const drawPulseCluster = (g, x, y, maxRadius, colors, cycles, currentParams) => {
        const count = Math.max(2, Math.round(currentParams.RingsPerShape));
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const eased = Math.pow(t, currentParams.SpacingEase);
            const radius = eased * maxRadius;
            const pulse = triangleWave(t, cycles);
            g.stroke(multiLerpColor(g, colors, pulse));
            g.strokeWeight(g.lerp(currentParams.StrokeMin, currentParams.StrokeMax, t));
            g.ellipse(x, y, radius * 2, radius * 2);
        }
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.noFill();

        const baseColors = [currentParams.ColorA, currentParams.ColorB];
        const cx = g.width / 2;
        const cy = g.height / 2;
        const points = phyllotaxisPoints(currentParams.ShapeCount, currentParams.SpreadRadius, cx, cy);

        points.forEach((pt) => {
            const maxRadius = hashRange(pt.index, currentParams.SizeMin, currentParams.SizeMax);
            const instanceColors = shuffleColors(baseColors, pt.index);
            const cycles = Math.max(1, Math.round(hashRange(pt.index + 1000, 1, currentParams.PulseCycles + 1)));
            drawPulseCluster(g, pt.x, pt.y, maxRadius, instanceColors, cycles, currentParams);
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
