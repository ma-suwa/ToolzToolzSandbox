import { getFormattedDateTime } from "../../shared/datetime.js";
import { drawGradientPrimitive } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors, pickGradientStyle } from "../../shared/layout.js";

// 放射グラデーションの球体を、フィロタキシス配置という一定のルールで
// 複数個、それぞれ別々の大きさで動的に生成する。
// さらに、シェイプごとに「色の並び順」「向き・つぶれ具合」「線状/放射状というスタイル」も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 14, type: "number", min: 1, max: 60, step: 1, label: "ShapeCount/シェイプの数", category: "Layout/配置" },
    SpreadRadius: { value: 230, type: "number", min: 0, max: 290, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    SizeMin: { value: 30, type: "number", min: 5, max: 200, step: 1, label: "SizeMin/最小半径", category: "Layout/配置" },
    SizeMax: { value: 110, type: "number", min: 5, max: 280, step: 1, label: "SizeMax/最大半径", category: "Layout/配置" },
    SquashJitter: { value: 0.5, type: "number", min: 0, max: 0.9, step: 0.01, label: "SquashJitter/つぶれ具合のばらつき", category: "Layout/配置" },
    RotationJitter: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "RotationJitter/向きのばらつき", category: "Layout/配置" },

    RingCount: { value: 40, type: "number", min: 2, max: 120, step: 1, label: "RingCount/1シェイプ内の解像度" },

    ColorCenter: { value: "#fff3b0", type: "color", label: "ColorCenter/中心色", category: "Color/色" },
    ColorMid: { value: "#f2557d", type: "color", label: "ColorMid/中間色", category: "Color/色" },
    ColorOuter: { value: "#2a1a4d", type: "color", label: "ColorOuter/外周色", category: "Color/色" },
    Background: { value: "#0d0d14", type: "color", label: "Background/背景", category: "Color/色" }
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
        g.noStroke();

        const baseColors = [currentParams.ColorOuter, currentParams.ColorMid, currentParams.ColorCenter];
        const cx = g.width / 2;
        const cy = g.height / 2;
        const points = phyllotaxisPoints(currentParams.ShapeCount, currentParams.SpreadRadius, cx, cy);

        points.forEach((pt) => {
            const radius = hashRange(pt.index, currentParams.SizeMin, currentParams.SizeMax);
            const aspect = 1 - hashRange(pt.index + 500, 0, currentParams.SquashJitter);
            const rotJitter = hashRange(pt.index + 1000, 0, Math.PI * 2) * currentParams.RotationJitter;
            const instanceColors = shuffleColors(baseColors, pt.index);
            const style = pickGradientStyle(pt.index);

            g.push();
            g.translate(pt.x, pt.y);
            g.rotate(rotJitter);
            drawGradientPrimitive(g, radius * 2, radius * 2 * aspect, style, instanceColors, currentParams.RingCount);
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
