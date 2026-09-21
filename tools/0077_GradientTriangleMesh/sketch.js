import { getFormattedDateTime } from "../../shared/datetime.js";
import { multiLerpColor } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors, pickGradientStyle } from "../../shared/layout.js";

// 格子点をずらして三角形分割した「ローポリ」グラデーションパッチを、
// フィロタキシス配置という一定のルールで複数個、動的に生成する。
// ずらし量はインデックスから決定的に計算するため、シード管理は不要。
// さらに、シェイプごとに「色の並び順」「グラデーション角度」
// 「線状(平行投影)/放射状(中心からの距離)というスタイル」も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 8, type: "number", min: 1, max: 30, step: 1, label: "ShapeCount/シェイプの数", category: "Layout/配置" },
    SpreadRadius: { value: 210, type: "number", min: 0, max: 290, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    SizeMin: { value: 80, type: "number", min: 20, max: 300, step: 1, label: "SizeMin/最小サイズ", category: "Layout/配置" },
    SizeMax: { value: 190, type: "number", min: 20, max: 400, step: 1, label: "SizeMax/最大サイズ", category: "Layout/配置" },
    RotationJitter: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "RotationJitter/角度のばらつき", category: "Layout/配置" },

    Columns: { value: 4, type: "number", min: 1, max: 12, step: 1, label: "Columns/1シェイプ内の列数" },
    Rows: { value: 4, type: "number", min: 1, max: 12, step: 1, label: "Rows/1シェイプ内の行数" },
    Jitter: { value: 0.35, type: "number", min: 0, max: 0.5, step: 0.01, label: "Jitter/格子点のゆらぎ" },
    Angle: { value: 45, type: "number", min: 0, max: 180, step: 1, label: "Angle/グラデーション基準角度" },

    ColorA: { value: "#ff9a9e", type: "color", label: "ColorA", category: "Color/色" },
    ColorB: { value: "#fad0c4", type: "color", label: "ColorB", category: "Color/色" },
    ColorC: { value: "#a18cd1", type: "color", label: "ColorC", category: "Color/色" },
    Background: { value: "#1a1a1a", type: "color", label: "Background/背景", category: "Color/色" }
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

    // インスタンス番号shapeIndexごとに独立した格子点ゆらぎを持つメッシュを構築する
    const buildGrid = (size, cols, rows, jitter, shapeIndex) => {
        const cellW = size / cols;
        const cellH = size / rows;
        const points = [];
        for (let j = 0; j <= rows; j++) {
            const row = [];
            for (let i = 0; i <= cols; i++) {
                const onEdge = i === 0 || i === cols || j === 0 || j === rows;
                const jitterAmt = onEdge ? 0 : jitter;
                const cellIndex = shapeIndex * 10000 + j * 100 + i;
                const jx = (hashRange(cellIndex * 2, -1, 1)) * jitterAmt * cellW;
                const jy = (hashRange(cellIndex * 2 + 1, -1, 1)) * jitterAmt * cellH;
                row.push({ x: -size / 2 + i * cellW + jx, y: -size / 2 + j * cellH + jy });
            }
            points.push(row);
        }
        return points;
    };

    const drawMeshPatch = (g, size, angleRad, colors, style, currentParams, shapeIndex) => {
        const cols = Math.max(1, Math.round(currentParams.Columns));
        const rows = Math.max(1, Math.round(currentParams.Rows));
        const points = buildGrid(size, cols, rows, currentParams.Jitter, shapeIndex);
        const dirX = Math.cos(angleRad);
        const dirY = Math.sin(angleRad);
        const diag = size * Math.SQRT2;

        const gradientT = (x, y) => {
            if (style === "radial") {
                return Math.min(Math.hypot(x, y) / (size * 0.7), 1);
            }
            const projected = x * dirX + y * dirY;
            return Math.min(Math.max(projected / diag + 0.5, 0), 1);
        };

        const triFill = (a, b, c) => {
            const cx = (a.x + b.x + c.x) / 3;
            const cy = (a.y + b.y + c.y) / 3;
            g.fill(multiLerpColor(g, colors, gradientT(cx, cy)));
            g.triangle(a.x, a.y, b.x, b.y, c.x, c.y);
        };

        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const p00 = points[j][i];
                const p10 = points[j][i + 1];
                const p01 = points[j + 1][i];
                const p11 = points[j + 1][i + 1];
                triFill(p00, p10, p01);
                triFill(p10, p11, p01);
            }
        }
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
            drawMeshPatch(g, size, angleRad, instanceColors, style, currentParams, pt.index);
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
