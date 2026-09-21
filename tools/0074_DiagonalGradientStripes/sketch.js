import { getFormattedDateTime } from "../../shared/datetime.js";
import { multiLerpColor, triangleWave } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors, pickGradientStyle } from "../../shared/layout.js";

// 斜めに繰り返す縞グラデーションのパッチを、フィロタキシス配置という
// 一定のルールで複数個、それぞれ別々の大きさ・角度で動的に生成する。
// さらに、シェイプごとに「色の並び順」「線状(縞)/放射状(同心円の縞)というスタイル」も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 10, type: "number", min: 1, max: 50, step: 1, label: "ShapeCount/シェイプの数", category: "Layout/配置" },
    SpreadRadius: { value: 220, type: "number", min: 0, max: 290, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    SizeMin: { value: 70, type: "number", min: 20, max: 300, step: 1, label: "SizeMin/最小幅", category: "Layout/配置" },
    SizeMax: { value: 170, type: "number", min: 20, max: 400, step: 1, label: "SizeMax/最大幅", category: "Layout/配置" },
    AspectRatio: { value: 0.7, type: "number", min: 0.1, max: 1.5, step: 0.01, label: "AspectRatio/縦横比(高さ/幅)", category: "Layout/配置" },
    RotationJitter: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "RotationJitter/角度のばらつき", category: "Layout/配置" },

    Angle: { value: 45, type: "number", min: 0, max: 360, step: 1, label: "Angle/基準角度" },
    StripeWidth: { value: 24, type: "number", min: 4, max: 100, step: 1, label: "StripeWidth/縞の幅" },
    Resolution: { value: 80, type: "number", min: 10, max: 300, step: 1, label: "Resolution/1シェイプ内の描画解像度" },

    ColorA: { value: "#141e30", type: "color", label: "ColorA", category: "Color/色" },
    ColorB: { value: "#00b4db", type: "color", label: "ColorB", category: "Color/色" },
    Background: { value: "#141e30", type: "color", label: "Background/背景", category: "Color/色" }
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

    // 中心原点・幅w×高さhの矩形の中に、角度angleRadの繰り返し縞(直線状)を敷き詰める
    const drawLinearStripes = (g, w, h, angleRad, colors, resolution, stripeWidth) => {
        const count = Math.max(4, resolution);
        const bandH = h / count;
        const cycles = h / Math.max(1, stripeWidth * 2);

        g.push();
        g.rotate(angleRad);
        for (let k = 0; k < count; k++) {
            const posT = k / count;
            const t = triangleWave(posT, cycles);
            g.fill(multiLerpColor(g, colors, t));
            g.rect(-w / 2, -h / 2 + k * bandH, w, bandH + 1);
        }
        g.pop();
    };

    // 中心原点・幅w×高さhの範囲に、同心円状に繰り返す縞(放射状)を敷き詰める
    const drawRadialStripes = (g, w, h, colors, resolution, stripeWidth) => {
        const count = Math.max(4, resolution);
        const maxRadius = Math.max(w, h) / 2;
        const cycles = maxRadius / Math.max(1, stripeWidth * 2);

        for (let i = count - 1; i >= 0; i--) {
            const posT = i / count;
            const t = triangleWave(posT, cycles);
            const rw = (w / 2) * (i + 1) / count;
            const rh = (h / 2) * (i + 1) / count;
            g.fill(multiLerpColor(g, colors, t));
            g.ellipse(0, 0, rw * 2, rh * 2);
        }
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.noStroke();

        const baseColors = [currentParams.ColorA, currentParams.ColorB];
        const cx = g.width / 2;
        const cy = g.height / 2;
        const points = phyllotaxisPoints(currentParams.ShapeCount, currentParams.SpreadRadius, cx, cy);
        const baseAngle = g.radians(currentParams.Angle);

        points.forEach((pt) => {
            const w = hashRange(pt.index, currentParams.SizeMin, currentParams.SizeMax);
            const h = w * currentParams.AspectRatio;
            const rotJitter = hashRange(pt.index + 1000, -180, 180) * currentParams.RotationJitter;
            const angleRad = baseAngle + g.radians(rotJitter);
            const instanceColors = shuffleColors(baseColors, pt.index);
            const style = pickGradientStyle(pt.index);

            g.push();
            g.translate(pt.x, pt.y);
            if (style === "radial") {
                g.rotate(angleRad);
                drawRadialStripes(g, w, h, instanceColors, currentParams.Resolution, currentParams.StripeWidth);
            } else {
                drawLinearStripes(g, w, h, angleRad, instanceColors, currentParams.Resolution, currentParams.StripeWidth);
            }
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
