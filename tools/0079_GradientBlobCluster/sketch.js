import { getFormattedDateTime } from "../../shared/datetime.js";
import { multiLerpColor } from "../../shared/gradient.js";
import { phyllotaxisPoints, hashRange, shuffleColors } from "../../shared/layout.js";

// 半透明ブロブの小クラスターを、フィロタキシス配置という一定のルールで
// 複数個、それぞれ別々の大きさ・色相位置で動的に生成する。
// ブロブの内部配置もインデックスから決定的に計算するためシード管理は不要。
// さらに、クラスターごとに「色の並び順」と「色相の開始角度」も独立して変化させる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    ShapeCount: { value: 7, type: "number", min: 1, max: 30, step: 1, label: "ShapeCount/クラスターの数", category: "Layout/配置" },
    SpreadRadius: { value: 200, type: "number", min: 0, max: 280, step: 1, label: "SpreadRadius/配置の広がり半径", category: "Layout/配置" },
    ClusterSizeMin: { value: 40, type: "number", min: 10, max: 200, step: 1, label: "ClusterSizeMin/最小クラスター半径", category: "Layout/配置" },
    ClusterSizeMax: { value: 100, type: "number", min: 10, max: 260, step: 1, label: "ClusterSizeMax/最大クラスター半径", category: "Layout/配置" },

    BlobsPerCluster: { value: 8, type: "number", min: 1, max: 30, step: 1, label: "BlobsPerCluster/クラスター内のブロブ数" },
    BlobSizeMin: { value: 10, type: "number", min: 2, max: 100, step: 1, label: "BlobSizeMin/最小ブロブサイズ" },
    BlobSizeMax: { value: 60, type: "number", min: 2, max: 160, step: 1, label: "BlobSizeMax/最大ブロブサイズ" },
    Alpha: { value: 160, type: "number", min: 10, max: 255, step: 1, label: "Alpha/不透明度" },

    ColorA: { value: "#ff6ec4", type: "color", label: "ColorA", category: "Color/色" },
    ColorB: { value: "#7873f5", type: "color", label: "ColorB", category: "Color/色" },
    ColorC: { value: "#4adede", type: "color", label: "ColorC", category: "Color/色" },
    Background: { value: "#0c0c14", type: "color", label: "Background/背景", category: "Color/色" }
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

    // clusterIndexごとに独立した(決定的な)ブロブ配置を持つクラスターを描く
    const drawCluster = (g, clusterRadius, colors, hueOffset, currentParams, clusterIndex) => {
        const count = Math.max(1, Math.round(currentParams.BlobsPerCluster));

        for (let i = 0; i < count; i++) {
            const cellIndex = clusterIndex * 10000 + i;
            const angle = hashRange(cellIndex * 3, 0, Math.PI * 2);
            const radius = Math.sqrt(hashRange(cellIndex * 3 + 1, 0, 1)) * clusterRadius;
            const size = hashRange(cellIndex * 3 + 2, currentParams.BlobSizeMin, currentParams.BlobSizeMax);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const t = (((angle + hueOffset) / (Math.PI * 2)) % 1 + 1) % 1;
            const baseColor = g.color(multiLerpColor(g, colors, t));
            g.fill(g.red(baseColor), g.green(baseColor), g.blue(baseColor), currentParams.Alpha);
            g.ellipse(x, y, size, size);
        }
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.noStroke();

        const baseColors = [currentParams.ColorA, currentParams.ColorB, currentParams.ColorC];
        const cx = g.width / 2;
        const cy = g.height / 2;
        const points = phyllotaxisPoints(currentParams.ShapeCount, currentParams.SpreadRadius, cx, cy);

        points.forEach((pt) => {
            const clusterRadius = hashRange(pt.index, currentParams.ClusterSizeMin, currentParams.ClusterSizeMax);
            // 最後に先頭色へ戻し、角度が一周した時に色がつながるようにする
            const shuffled = shuffleColors(baseColors, pt.index);
            const instanceColors = [...shuffled, shuffled[0]];
            const hueOffset = hashRange(pt.index + 1000, 0, Math.PI * 2);

            g.push();
            g.translate(pt.x, pt.y);
            drawCluster(g, clusterRadius, instanceColors, hueOffset, currentParams, pt.index);
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
