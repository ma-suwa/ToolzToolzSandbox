import { getFormattedDateTime } from "../../shared/datetime.js";

// 額縁(回転多角形)+花(円の融合)+中心飾りを入れ子にした、
// このバッジシリーズの技法を組み合わせる「詰め合わせ」構成。

const CANVAS_SIZE = 600;

export const defaultParams = {
    FrameSides: { value: 6, type: "number", min: 3, max: 12, step: 1, label: "FrameSides/額縁の角数" },
    FrameSize: { value: 240, type: "number", min: 60, max: 280, step: 1, label: "FrameSize/額縁の大きさ" },
    FrameRotation: { value: 0, type: "number", min: 0, max: 90, step: 1, label: "FrameRotation/額縁の回転" },

    PetalCount: { value: 5, type: "number", min: 3, max: 12, step: 1, label: "PetalCount/花弁の数", category: "Flower/内側の花" },
    PetalRadius: { value: 70, type: "number", min: 10, max: 160, step: 1, label: "PetalRadius/花弁1つの半径", category: "Flower/内側の花" },
    OrbitRadius: { value: 55, type: "number", min: 0, max: 140, step: 1, label: "OrbitRadius/花弁の配置半径", category: "Flower/内側の花" },

    CenterSides: { value: 1, type: "number", min: 0, max: 12, step: 1, label: "CenterSides/中心飾りの角数(0=非表示,1=円)", category: "Center/中心飾り" },
    CenterSize: { value: 14, type: "number", min: 2, max: 60, step: 1, label: "CenterSize/中心飾りの大きさ", category: "Center/中心飾り" },

    FrameColor: { value: "#c9a876", type: "color", label: "FrameColor/額縁の色", category: "Color/色" },
    PetalColor: { value: "#111111", type: "color", label: "PetalColor/花弁の色", category: "Color/色" },
    CenterColor: { value: "#f2b9ae", type: "color", label: "CenterColor/中心飾りの色", category: "Color/色" },
    BackgroundDisc: { value: "#1f5c3a", type: "color", label: "BackgroundDisc/バッジの地色", category: "Color/色" },
    Background: { value: "#e9e7e2", type: "color", label: "Background/背景", category: "Color/色" }
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

    const drawPolygon = (g, sides, radius, rotationDeg) => {
        const rotation = g.radians(rotationDeg);
        if (sides < 3) {
            g.ellipse(0, 0, radius * 2, radius * 2);
            return;
        }
        g.beginShape();
        for (let i = 0; i < sides; i++) {
            const a = rotation + (i / sides) * g.TWO_PI;
            g.vertex(Math.cos(a) * radius, Math.sin(a) * radius);
        }
        g.endShape(g.CLOSE);
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.noStroke();

        const cx = g.width / 2;
        const cy = g.height / 2;
        const badgeRadius = 280;

        g.push();
        g.translate(cx, cy);

        g.fill(currentParams.BackgroundDisc);
        g.ellipse(0, 0, badgeRadius * 2, badgeRadius * 2);

        // 額縁(回転した多角形)
        g.fill(currentParams.FrameColor);
        drawPolygon(g, currentParams.FrameSides, currentParams.FrameSize, currentParams.FrameRotation);

        // 内側の花(円の融合)
        g.fill(currentParams.PetalColor);
        const count = currentParams.PetalCount;
        const orbit = currentParams.OrbitRadius;
        const petalR = currentParams.PetalRadius;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * g.TWO_PI;
            const x = Math.cos(a) * orbit;
            const y = Math.sin(a) * orbit;
            g.ellipse(x, y, petalR * 2, petalR * 2);
        }

        // 中心飾り
        if (currentParams.CenterSides > 0) {
            g.fill(currentParams.CenterColor);
            drawPolygon(g, currentParams.CenterSides, currentParams.CenterSize, 0);
        }

        g.pop();
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
