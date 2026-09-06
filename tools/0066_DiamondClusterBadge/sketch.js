import { getFormattedDateTime } from "../../shared/datetime.js";

// 0060_PetalUnionBadgeと同じ融合技法だが、花弁の単位を円ではなく
// 回転した正多角形(ダイヤ/四角)にすることで、角ばった星形のシルエットになる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    PetalCount: { value: 4, type: "number", min: 3, max: 16, step: 1, label: "PetalCount/花弁の数" },
    PetalSides: { value: 4, type: "number", min: 3, max: 10, step: 1, label: "PetalSides/花弁の角数" },
    PetalSize: { value: 130, type: "number", min: 20, max: 240, step: 1, label: "PetalSize/花弁1つの大きさ" },
    PetalRotation: { value: 45, type: "number", min: 0, max: 90, step: 1, label: "PetalRotation/花弁自身の回転" },
    OrbitRadius: { value: 90, type: "number", min: 0, max: 200, step: 1, label: "OrbitRadius/花弁中心の配置半径" },
    StartAngle: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "StartAngle/開始角度" },

    CenterSides: { value: 1, type: "number", min: 0, max: 12, step: 1, label: "CenterSides/中心飾りの角数(0=非表示,1=円)", category: "Center/中心飾り" },
    CenterSize: { value: 16, type: "number", min: 2, max: 60, step: 1, label: "CenterSize/中心飾りの大きさ", category: "Center/中心飾り" },

    PetalColor: { value: "#111111", type: "color", label: "PetalColor/花弁の色", category: "Color/色" },
    BackgroundDisc: { value: "#e8352b", type: "color", label: "BackgroundDisc/バッジの地色", category: "Color/色" },
    CenterColor: { value: "#e8352b", type: "color", label: "CenterColor/中心飾りの色", category: "Color/色" },
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

    const drawPolygon = (g, sides, radius, rotation) => {
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

        g.fill(currentParams.PetalColor);
        const count = currentParams.PetalCount;
        const orbit = currentParams.OrbitRadius;
        const petalSize = currentParams.PetalSize;
        const petalRotation = g.radians(currentParams.PetalRotation);
        const startAngle = g.radians(currentParams.StartAngle);
        for (let i = 0; i < count; i++) {
            const a = startAngle + (i / count) * g.TWO_PI;
            const x = Math.cos(a) * orbit;
            const y = Math.sin(a) * orbit;
            g.push();
            g.translate(x, y);
            drawPolygon(g, currentParams.PetalSides, petalSize, petalRotation);
            g.pop();
        }

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
