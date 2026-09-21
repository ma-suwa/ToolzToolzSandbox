import { getFormattedDateTime } from "../../shared/datetime.js";
import { drawGradientPrimitive } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors, pickGradientStyle } from "../../shared/layout.js";

// 直線グラデーションの帯(リボン)を、フィロタキシス(ひまわりの種)配置という
// 一定のルールで複数個、それぞれ別々の大きさ・向きで動的に生成する。
// さらに、シェイプごとに「色の並び順」「線状/放射状というスタイル」も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 12, type: "number", min: 1, max: 60, step: 1, label: "ShapeCount/シェイプの数", category: "Layout/配置" },
    SpreadRadius: { value: 220, type: "number", min: 0, max: 290, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    SizeMin: { value: 60, type: "number", min: 10, max: 300, step: 1, label: "SizeMin/シェイプの最小幅", category: "Layout/配置" },
    SizeMax: { value: 180, type: "number", min: 10, max: 400, step: 1, label: "SizeMax/シェイプの最大幅", category: "Layout/配置" },
    AspectRatio: { value: 0.4, type: "number", min: 0.05, max: 1, step: 0.01, label: "AspectRatio/縦横比(高さ/幅)", category: "Layout/配置" },
    RotationJitter: { value: 0.6, type: "number", min: 0, max: 1, step: 0.01, label: "RotationJitter/向きのばらつき", category: "Layout/配置" },

    Angle: { value: 45, type: "number", min: 0, max: 360, step: 1, label: "Angle/基準角度" },
    BandCount: { value: 24, type: "number", min: 2, max: 100, step: 1, label: "BandCount/1シェイプ内の帯の枚数" },

    ColorA: { value: "#2b2d82", type: "color", label: "ColorA/開始色", category: "Color/色" },
    ColorB: { value: "#c33c78", type: "color", label: "ColorB/中間色", category: "Color/色" },
    ColorC: { value: "#f7c948", type: "color", label: "ColorC/終了色", category: "Color/色" },
    Background: { value: "#111111", type: "color", label: "Background/背景", category: "Color/色" }
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

        const baseColors = [currentParams.ColorA, currentParams.ColorB, currentParams.ColorC];
        const cx = g.width / 2;
        const cy = g.height / 2;
        const points = phyllotaxisPoints(currentParams.ShapeCount, currentParams.SpreadRadius, cx, cy);
        const baseAngle = g.radians(currentParams.Angle);

        points.forEach((pt) => {
            const size = hashRange(pt.index, currentParams.SizeMin, currentParams.SizeMax);
            const rotJitter = hashRange(pt.index + 1000, -180, 180) * currentParams.RotationJitter;
            const angleRad = baseAngle + g.radians(rotJitter);
            const instanceColors = shuffleColors(baseColors, pt.index);
            const style = pickGradientStyle(pt.index);

            g.push();
            g.translate(pt.x, pt.y);
            g.rotate(angleRad);
            drawGradientPrimitive(g, size, size * currentParams.AspectRatio, style, instanceColors, currentParams.BandCount);
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
