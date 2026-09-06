import { getFormattedDateTime } from "../../shared/datetime.js";

// 0060_PetalUnionBadgeの技法を、花弁の数を増やし外周寄りに配置することで
// 密な菊紋(chrysanthemum crest)風のスカラップ形にしたもの。
// さらに中心から放射状の細いスポーク線を重ねられる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    SpikeCount: { value: 16, type: "number", min: 6, max: 40, step: 1, label: "SpikeCount/花弁の数" },
    SpikeRadius: { value: 70, type: "number", min: 10, max: 160, step: 1, label: "SpikeRadius/花弁1つの半径" },
    OrbitRadius: { value: 190, type: "number", min: 40, max: 240, step: 1, label: "OrbitRadius/花弁中心の配置半径" },

    ShowSpokes: { value: true, type: "boolean", label: "ShowSpokes/放射スポークを表示", category: "Spoke/スポーク" },
    SpokeWidth: { value: 1.5, type: "number", min: 0.5, max: 6, step: 0.5, label: "SpokeWidth/スポークの太さ", category: "Spoke/スポーク" },
    SpokeInnerRadius: { value: 20, type: "number", min: 0, max: 100, step: 1, label: "SpokeInnerRadius/中心の空白半径", category: "Spoke/スポーク" },

    CenterSize: { value: 20, type: "number", min: 0, max: 60, step: 1, label: "CenterSize/中心飾りの大きさ(0で非表示)", category: "Center/中心飾り" },

    PetalColor: { value: "#0d0d0d", type: "color", label: "PetalColor/花弁の色", category: "Color/色" },
    BackgroundDisc: { value: "#3f6fe0", type: "color", label: "BackgroundDisc/バッジの地色", category: "Color/色" },
    SpokeColor: { value: "#3f6fe0", type: "color", label: "SpokeColor/スポークの色", category: "Color/色" },
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

        const count = currentParams.SpikeCount;
        const orbit = currentParams.OrbitRadius;
        const spikeR = currentParams.SpikeRadius;

        g.fill(currentParams.PetalColor);
        for (let i = 0; i < count; i++) {
            const a = (i / count) * g.TWO_PI;
            const x = Math.cos(a) * orbit;
            const y = Math.sin(a) * orbit;
            g.ellipse(x, y, spikeR * 2, spikeR * 2);
        }

        if (currentParams.ShowSpokes) {
            g.stroke(currentParams.SpokeColor);
            g.strokeWeight(currentParams.SpokeWidth);
            const inner = currentParams.SpokeInnerRadius;
            const outer = orbit + spikeR * 0.9;
            for (let i = 0; i < count; i++) {
                const a = (i / count) * g.TWO_PI;
                g.line(Math.cos(a) * inner, Math.sin(a) * inner, Math.cos(a) * outer, Math.sin(a) * outer);
            }
            g.noStroke();
        }

        if (currentParams.CenterSize > 0) {
            g.fill(currentParams.CenterColor);
            g.ellipse(0, 0, currentParams.CenterSize * 2, currentParams.CenterSize * 2);
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
