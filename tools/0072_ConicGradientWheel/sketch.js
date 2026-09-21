import { getFormattedDateTime } from "../../shared/datetime.js";
import { multiLerpColor } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors } from "../../shared/layout.js";

// 360度をめぐる円錐グラデーションの車輪を、フィロタキシス配置という
// 一定のルールで複数個、それぞれ別々の大きさ・回転で動的に生成する。
// さらに、シェイプごとに4色の並び順(どの色から始まるか)も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 10, type: "number", min: 1, max: 60, step: 1, label: "ShapeCount/シェイプの数", category: "Layout/配置" },
    SpreadRadius: { value: 220, type: "number", min: 0, max: 290, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    SizeMin: { value: 30, type: "number", min: 5, max: 200, step: 1, label: "SizeMin/最小外半径", category: "Layout/配置" },
    SizeMax: { value: 100, type: "number", min: 5, max: 280, step: 1, label: "SizeMax/最大外半径", category: "Layout/配置" },
    RotationJitter: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "RotationJitter/回転のばらつき", category: "Layout/配置" },

    WedgeCount: { value: 90, type: "number", min: 6, max: 300, step: 1, label: "WedgeCount/1シェイプ内の扇形分割数" },
    InnerRatio: { value: 0.35, type: "number", min: 0, max: 0.9, step: 0.01, label: "InnerRatio/内半径の比率(0=円)" },
    Rotation: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "Rotation/基準回転" },

    ColorA: { value: "#ff5f6d", type: "color", label: "ColorA", category: "Color/色" },
    ColorB: { value: "#ffc371", type: "color", label: "ColorB", category: "Color/色" },
    ColorC: { value: "#47cf73", type: "color", label: "ColorC", category: "Color/色" },
    ColorD: { value: "#4287f5", type: "color", label: "ColorD", category: "Color/色" },
    Background: { value: "#101018", type: "color", label: "Background/背景", category: "Color/色" }
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

    const drawWheel = (g, outer, inner, rotation, colors, wedgeCount) => {
        const count = Math.max(3, wedgeCount);
        g.push();
        g.rotate(rotation);
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const a0 = t * g.TWO_PI;
            const a1 = ((i + 1) / count) * g.TWO_PI;
            g.fill(multiLerpColor(g, colors, t));

            g.beginShape();
            g.vertex(Math.cos(a0) * outer, Math.sin(a0) * outer);
            g.vertex(Math.cos(a1) * outer, Math.sin(a1) * outer);
            if (inner > 0) {
                g.vertex(Math.cos(a1) * inner, Math.sin(a1) * inner);
                g.vertex(Math.cos(a0) * inner, Math.sin(a0) * inner);
            } else {
                g.vertex(0, 0);
            }
            g.endShape(g.CLOSE);
        }
        g.pop();
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.noStroke();

        const baseColors = [currentParams.ColorA, currentParams.ColorB, currentParams.ColorC, currentParams.ColorD];
        const cx = g.width / 2;
        const cy = g.height / 2;
        const points = phyllotaxisPoints(currentParams.ShapeCount, currentParams.SpreadRadius, cx, cy);
        const baseRotation = g.radians(currentParams.Rotation);

        points.forEach((pt) => {
            const outer = hashRange(pt.index, currentParams.SizeMin, currentParams.SizeMax);
            const inner = outer * currentParams.InnerRatio;
            const rotJitter = hashRange(pt.index + 1000, 0, g.TWO_PI) * currentParams.RotationJitter;
            // シェイプごとに色の並び順を変え、最後に先頭色へ戻して一周をつなげる
            const shuffled = shuffleColors(baseColors, pt.index);
            const instanceColors = [...shuffled, shuffled[0]];

            g.push();
            g.translate(pt.x, pt.y);
            drawWheel(g, outer, inner, baseRotation + rotJitter, instanceColors, currentParams.WedgeCount);
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
