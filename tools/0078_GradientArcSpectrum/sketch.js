import { getFormattedDateTime } from "../../shared/datetime.js";
import { multiLerpColor } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors } from "../../shared/layout.js";

// 虹のスペクトルのような弧(アーク)の束を、フィロタキシス配置という
// 一定のルールで複数個、それぞれ別々の大きさ・向きで動的に生成する。
// さらに、シェイプごとに4色の並び順(スペクトルの始点)も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 9, type: "number", min: 1, max: 40, step: 1, label: "ShapeCount/シェイプの数", category: "Layout/配置" },
    SpreadRadius: { value: 220, type: "number", min: 0, max: 290, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    SizeMin: { value: 40, type: "number", min: 10, max: 200, step: 1, label: "SizeMin/最小外半径", category: "Layout/配置" },
    SizeMax: { value: 110, type: "number", min: 10, max: 280, step: 1, label: "SizeMax/最大外半径", category: "Layout/配置" },
    RotationJitter: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "RotationJitter/向きのばらつき", category: "Layout/配置" },

    ArcCount: { value: 40, type: "number", min: 4, max: 150, step: 1, label: "ArcCount/1シェイプ内の弧の本数" },
    InnerRatio: { value: 0.3, type: "number", min: 0, max: 0.9, step: 0.01, label: "InnerRatio/内半径の比率" },
    SweepAngle: { value: 140, type: "number", min: 10, max: 360, step: 1, label: "SweepAngle/掃引角度" },
    ArcThickness: { value: 3, type: "number", min: 0.5, max: 15, step: 0.5, label: "ArcThickness/弧の太さ" },

    ColorA: { value: "#ff0059", type: "color", label: "ColorA", category: "Color/色" },
    ColorB: { value: "#ff9d00", type: "color", label: "ColorB", category: "Color/色" },
    ColorC: { value: "#00e0ff", type: "color", label: "ColorC", category: "Color/色" },
    ColorD: { value: "#7000ff", type: "color", label: "ColorD", category: "Color/色" },
    Background: { value: "#0a0a12", type: "color", label: "Background/背景", category: "Color/色" }
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

    const drawArcFan = (g, outer, inner, startAngle, sweep, colors, arcCount, thickness) => {
        const count = Math.max(2, arcCount);
        g.strokeWeight(thickness);
        g.strokeCap(g.SQUARE);
        g.noFill();

        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const radius = g.lerp(inner, outer, t);
            g.stroke(multiLerpColor(g, colors, t));
            g.arc(0, 0, radius * 2, radius * 2, startAngle, startAngle + sweep);
        }
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);

        const baseColors = [currentParams.ColorA, currentParams.ColorB, currentParams.ColorC, currentParams.ColorD];
        const cx = g.width / 2;
        const cy = g.height / 2;
        const points = phyllotaxisPoints(currentParams.ShapeCount, currentParams.SpreadRadius, cx, cy);
        const sweep = g.radians(currentParams.SweepAngle);

        points.forEach((pt) => {
            const outer = hashRange(pt.index, currentParams.SizeMin, currentParams.SizeMax);
            const inner = outer * currentParams.InnerRatio;
            const startAngle = hashRange(pt.index + 1000, 0, g.TWO_PI) * currentParams.RotationJitter;
            const instanceColors = shuffleColors(baseColors, pt.index);

            g.push();
            g.translate(pt.x, pt.y);
            drawArcFan(g, outer, inner, startAngle, sweep, instanceColors, currentParams.ArcCount, currentParams.ArcThickness);
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
