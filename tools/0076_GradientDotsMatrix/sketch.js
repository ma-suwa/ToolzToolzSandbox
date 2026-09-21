import { getFormattedDateTime } from "../../shared/datetime.js";
import { multiLerpColor } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors } from "../../shared/layout.js";

// 中心からの距離で色とサイズが変化するドット格子(ハーフトーン)クラスターを、
// フィロタキシス配置という一定のルールで複数個、別々の大きさで動的に生成する。
// さらに、シェイプごとに「色の並び順(近い/遠いのどちらが明るいか)」と
// 「グラデーションの焦点位置」も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 8, type: "number", min: 1, max: 30, step: 1, label: "ShapeCount/シェイプの数", category: "Layout/配置" },
    SpreadRadius: { value: 210, type: "number", min: 0, max: 290, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    SizeMin: { value: 70, type: "number", min: 20, max: 300, step: 1, label: "SizeMin/最小サイズ", category: "Layout/配置" },
    SizeMax: { value: 160, type: "number", min: 20, max: 400, step: 1, label: "SizeMax/最大サイズ", category: "Layout/配置" },

    FocalJitter: { value: 0.6, type: "number", min: 0, max: 1, step: 0.01, label: "FocalJitter/焦点位置のばらつき", category: "Layout/配置" },

    Columns: { value: 7, type: "number", min: 2, max: 20, step: 1, label: "Columns/1シェイプ内の列数" },
    Rows: { value: 7, type: "number", min: 2, max: 20, step: 1, label: "Rows/1シェイプ内の行数" },
    DotSizeMax: { value: 16, type: "number", min: 2, max: 40, step: 0.5, label: "DotSizeMax/最大ドット径" },
    DotSizeMin: { value: 1, type: "number", min: 0, max: 30, step: 0.5, label: "DotSizeMin/最小ドット径" },
    SizeByGradient: { value: true, type: "boolean", label: "SizeByGradient/サイズも変化させる" },

    ColorNear: { value: "#ffe45e", type: "color", label: "ColorNear/中心付近の色", category: "Color/色" },
    ColorFar: { value: "#2d0b4e", type: "color", label: "ColorFar/周辺の色", category: "Color/色" },
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

    const drawDotCluster = (g, size, colors, focalX, focalY, currentParams) => {
        const cols = Math.max(2, Math.round(currentParams.Columns));
        const rows = Math.max(2, Math.round(currentParams.Rows));
        const cellW = size / cols;
        const cellH = size / rows;
        const maxDist = Math.hypot(size, size);

        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = -size / 2 + (i + 0.5) * cellW;
                const y = -size / 2 + (j + 0.5) * cellH;
                const t = Math.min(Math.hypot(x - focalX, y - focalY) / maxDist, 1);

                g.fill(multiLerpColor(g, colors, t));
                const dotSize = currentParams.SizeByGradient
                    ? g.lerp(currentParams.DotSizeMax, currentParams.DotSizeMin, t)
                    : currentParams.DotSizeMax;
                g.ellipse(x, y, dotSize, dotSize);
            }
        }
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.noStroke();

        const baseColors = [currentParams.ColorNear, currentParams.ColorFar];
        const cx = g.width / 2;
        const cy = g.height / 2;
        const points = phyllotaxisPoints(currentParams.ShapeCount, currentParams.SpreadRadius, cx, cy);

        points.forEach((pt) => {
            const size = hashRange(pt.index, currentParams.SizeMin, currentParams.SizeMax);
            const instanceColors = shuffleColors(baseColors, pt.index);
            const focalX = hashRange(pt.index + 1000, -size / 2, size / 2) * currentParams.FocalJitter;
            const focalY = hashRange(pt.index + 2000, -size / 2, size / 2) * currentParams.FocalJitter;
            g.push();
            g.translate(pt.x, pt.y);
            drawDotCluster(g, size, instanceColors, focalX, focalY, currentParams);
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
