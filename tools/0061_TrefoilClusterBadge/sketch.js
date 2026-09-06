import { getFormattedDateTime } from "../../shared/datetime.js";

// 0060_PetalUnionBadgeと同じ「同色円の重なり融合」技法を使うが、
// 花のように中心対称に配置するのではなく、円をひとかたまりの
// クラスター(三つ葉/ミッキーの耳のような形)として寄せて配置する。

const CANVAS_SIZE = 600;

export const defaultParams = {
    CircleCount: { value: 3, type: "number", min: 2, max: 8, step: 1, label: "CircleCount/円の数" },
    CircleRadius: { value: 110, type: "number", min: 20, max: 220, step: 1, label: "CircleRadius/円1つの半径" },
    ClusterSpread: { value: 85, type: "number", min: 0, max: 200, step: 1, label: "ClusterSpread/円同士の間隔" },
    ClusterOffsetX: { value: 0, type: "number", min: -150, max: 150, step: 1, label: "ClusterOffsetX/クラスターの横位置" },
    ClusterOffsetY: { value: 40, type: "number", min: -150, max: 150, step: 1, label: "ClusterOffsetY/クラスターの縦位置" },
    StartAngle: { value: -90, type: "number", min: 0, max: 360, step: 1, label: "StartAngle/開始角度" },

    ClusterColor: { value: "#f4b7ae", type: "color", label: "ClusterColor/クラスターの色", category: "Color/色" },
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

        g.fill(currentParams.ClusterColor);
        const count = currentParams.CircleCount;
        const spread = currentParams.ClusterSpread;
        const r = currentParams.CircleRadius;
        const startAngle = g.radians(currentParams.StartAngle);
        const ox = currentParams.ClusterOffsetX;
        const oy = currentParams.ClusterOffsetY;
        for (let i = 0; i < count; i++) {
            const a = startAngle + (i / count) * g.TWO_PI;
            const x = ox + Math.cos(a) * spread;
            const y = oy + Math.sin(a) * spread;
            g.ellipse(x, y, r * 2, r * 2);
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
