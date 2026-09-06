import { getFormattedDateTime } from "../../shared/datetime.js";

// 交互色の同心円(ターゲット/的)+中心飾りのシンプルなバッジ。
// 大きい円から小さい円へ、2色を交互に塗り重ねるだけで同心リングになる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    RingCount: { value: 5, type: "number", min: 2, max: 12, step: 1, label: "RingCount/リングの数" },
    OuterRadius: { value: 280, type: "number", min: 60, max: 280, step: 1, label: "OuterRadius/最外周の半径" },
    InnerRadius: { value: 20, type: "number", min: 0, max: 200, step: 1, label: "InnerRadius/最内周の半径" },

    CenterSides: { value: 4, type: "number", min: 0, max: 12, step: 1, label: "CenterSides/中心飾りの角数(0=非表示,1=円)", category: "Center/中心飾り" },
    CenterSize: { value: 22, type: "number", min: 2, max: 80, step: 1, label: "CenterSize/中心飾りの大きさ", category: "Center/中心飾り" },
    CenterRotation: { value: 45, type: "number", min: 0, max: 90, step: 1, label: "CenterRotation/中心飾りの回転", category: "Center/中心飾り" },

    ColorA: { value: "#111111", type: "color", label: "ColorA/色A(最外周)", category: "Color/色" },
    ColorB: { value: "#e8352b", type: "color", label: "ColorB/色B", category: "Color/色" },
    CenterColor: { value: "#d8c93f", type: "color", label: "CenterColor/中心飾りの色", category: "Color/色" },
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

        g.push();
        g.translate(cx, cy);

        const count = currentParams.RingCount;
        const outer = currentParams.OuterRadius;
        const inner = currentParams.InnerRadius;
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1 || 1);
            const r = outer + (inner - outer) * t;
            g.fill(i % 2 === 0 ? currentParams.ColorA : currentParams.ColorB);
            g.ellipse(0, 0, r * 2, r * 2);
        }

        if (currentParams.CenterSides > 0) {
            g.fill(currentParams.CenterColor);
            const rotation = g.radians(currentParams.CenterRotation);
            if (currentParams.CenterSides < 3) {
                g.ellipse(0, 0, currentParams.CenterSize * 2, currentParams.CenterSize * 2);
            } else {
                g.beginShape();
                for (let i = 0; i < currentParams.CenterSides; i++) {
                    const a = rotation + (i / currentParams.CenterSides) * g.TWO_PI;
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
