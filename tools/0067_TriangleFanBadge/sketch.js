import { getFormattedDateTime } from "../../shared/datetime.js";

// 同色の三角形を中心から放射状に重ねて配置し、風車/歯車のような
// シルエットに融合させる(0060と同じ「同色の重なり」技法の三角形版)。

const CANVAS_SIZE = 600;

export const defaultParams = {
    BladeCount: { value: 8, type: "number", min: 3, max: 24, step: 1, label: "BladeCount/羽根の数" },
    BladeLength: { value: 230, type: "number", min: 40, max: 280, step: 1, label: "BladeLength/羽根の長さ" },
    BladeWidth: { value: 90, type: "number", min: 10, max: 200, step: 1, label: "BladeWidth/羽根の付け根の幅" },
    Twist: { value: 18, type: "number", min: -60, max: 60, step: 1, label: "Twist/羽根のねじれ角" },

    CenterSides: { value: 1, type: "number", min: 0, max: 12, step: 1, label: "CenterSides/中心飾りの角数(0=非表示,1=円)", category: "Center/中心飾り" },
    CenterSize: { value: 24, type: "number", min: 2, max: 80, step: 1, label: "CenterSize/中心飾りの大きさ", category: "Center/中心飾り" },

    BladeColor: { value: "#111111", type: "color", label: "BladeColor/羽根の色", category: "Color/色" },
    BackgroundDisc: { value: "#3f6fe0", type: "color", label: "BackgroundDisc/バッジの地色", category: "Color/色" },
    CenterColor: { value: "#3f6fe0", type: "color", label: "CenterColor/中心飾りの色", category: "Color/色" },
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

        g.fill(currentParams.BladeColor);
        const count = currentParams.BladeCount;
        const length = currentParams.BladeLength;
        const width = currentParams.BladeWidth;
        const twist = g.radians(currentParams.Twist);
        for (let i = 0; i < count; i++) {
            const a = (i / count) * g.TWO_PI;
            g.push();
            g.rotate(a);
            // 羽根: 中心付近を頂点にした二等辺三角形。先端方向にTwist分だけずらして「ねじれ」を作る
            g.beginShape();
            g.vertex(0, 0);
            g.vertex(-width / 2, -length * 0.15);
            const tipX = length * Math.cos(twist);
            const tipY = -length * Math.sin(twist);
            g.vertex(tipX, tipY - length * 0.85);
            g.vertex(width / 2, -length * 0.15);
            g.endShape(g.CLOSE);
            g.pop();
        }

        if (currentParams.CenterSides > 0) {
            g.fill(currentParams.CenterColor);
            if (currentParams.CenterSides < 3) {
                g.ellipse(0, 0, currentParams.CenterSize * 2, currentParams.CenterSize * 2);
            } else {
                g.beginShape();
                for (let i = 0; i < currentParams.CenterSides; i++) {
                    const a = (i / currentParams.CenterSides) * g.TWO_PI;
                    g.vertex(Math.cos(a) * currentParams.CenterSize, Math.sin(a) * currentParams.CenterSize);
                }
                g.endShape(g.CLOSE);
            }
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
