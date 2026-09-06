import color from "../../shared/color.js";
import { getFormattedDateTime } from "../../shared/datetime.js";

const CANVAS_SIZE = 600;

export const defaultParams = {
    GridSize: { value: 20, type: "number", min: 2, max: 50, step: 1, label: "GridSize/グリッド数", category: "Layout/配置" },
    ControlX: { value: 300, type: "number", min: 0, max: 600, step: 1, label: "ControlX/制御点X", category: "Layout/配置" },
    ControlY: { value: 300, type: "number", min: 0, max: 600, step: 1, label: "ControlY/制御点Y", category: "Layout/配置" },
    SizeVariation: { value: true, type: "boolean", label: "SizeVariation/サイズの変動", category: "Variation/変動" },
    SizeMin: { value: 5, type: "number", min: 2, max: 200, step: 1, label: "SizeMin/サイズ最小", category: "Variation/変動" },
    SizeMax: { value: 48, type: "number", min: 10, max: 300, step: 1, label: "SizeMax/サイズ最大", category: "Variation/変動" },
    ScaleRatio: { value: 1, type: "number", min: 0.2, max: 3, step: 0.01, label: "ScaleRatio/形の比率(縦/横)", category: "Variation/変動" },
    DistanceWidth: { value: 300, type: "number", min: 50, max: 600, step: 1, label: "DistanceWidth/距離の幅", category: "Variation/変動" },
    DistanceHeight: { value: 300, type: "number", min: 50, max: 600, step: 1, label: "DistanceHeight/距離の高さ", category: "Variation/変動" },
    RotationVariation: { value: true, type: "boolean", label: "RotationVariation/回転の変動", category: "Variation/変動" },
    Fill: { value: color.orange, type: "color", label: "Fill/塗り", category: "Color/色" },
    Stroke: { value: color.black, type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 0, type: "number", min: 0, max: 10, step: 1, label: "StrokeWidth/線幅", category: "Color/色" },
    Background: { value: color.black, type: "color", label: "Background/背景", category: "Color/色" }
};

export const setupP5 = (p, params, container) => {
    let seed;

    p.setup = function () {
        const canvas = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
        if (container) canvas.parent(container);
        canvas.elt.style.width = '100%';
        canvas.elt.style.height = 'auto';
        p.noLoop();
        setTimeout(() => p.redraw(), 0);
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background || 0);
        g.rectMode(g.CENTER);

        const numOfSquares = Math.max(2, Math.min(50, Math.round(Number(currentParams.GridSize) || 20)));
        const squareSize = CANVAS_SIZE / numOfSquares;
        const controlX = Math.max(0, Math.min(CANVAS_SIZE, Number(currentParams.ControlX) ?? 300));
        const controlY = Math.max(0, Math.min(CANVAS_SIZE, Number(currentParams.ControlY) ?? 300));
        const sizeVariation = !!currentParams.SizeVariation;
        const rotationVariation = !!currentParams.RotationVariation;
        const sizeMin = Math.max(2, Math.min(200, Number(currentParams.SizeMin) ?? 10));
        const sizeMax = Math.max(sizeMin, Math.min(300, Number(currentParams.SizeMax) ?? 50));
        const scaleRatio = Math.max(0.2, Math.min(3, Number(currentParams.ScaleRatio) ?? 1));
        const distW = Math.max(50, Number(currentParams.DistanceWidth) ?? 300);
        const distH = Math.max(50, Number(currentParams.DistanceHeight) ?? 300);
        const corners = [[0, 0], [CANVAS_SIZE, 0], [0, CANVAS_SIZE], [CANVAS_SIZE, CANVAS_SIZE]];
        let maxDistance = Math.max(...corners.map(([x, y]) =>
            Math.sqrt(((x - controlX) / distW) ** 2 + ((y - controlY) / distH) ** 2)
        ));
        if (maxDistance < 1e-6) maxDistance = 1;

        g.fill(currentParams.Fill || '#0a26ab');
        if (currentParams.StrokeWidth > 0) {
            g.strokeWeight(currentParams.StrokeWidth);
            g.stroke(currentParams.Stroke);
        } else {
            g.noStroke();
        }

        for (let j = 0; j < numOfSquares; j++) {
            for (let i = 0; i < numOfSquares; i++) {
                const transX = i * squareSize + squareSize / 2;
                const transY = j * squareSize + squareSize / 2;

                const dx = (transX - controlX) / distW;
                const dy = (transY - controlY) / distH;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const scaleValue = sizeVariation
                    ? g.map(distance, 0, maxDistance, sizeMin, sizeMax)
                    : (sizeMin + sizeMax) / 2;
                const rectW = scaleValue;
                const rectH = scaleValue * scaleRatio;

                const rotateValue = rotationVariation
                    ? g.atan2(controlY - transY, controlX - transX)
                    : 0;

                g.push();
                g.translate(transX, transY);
                g.rotate(rotateValue);
                g.rect(0, 0, rectW, rectH);
                g.pop();
            }
        }
    };

    p.draw = function () {
        seed = p.random(1000000);
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
        image.save(getFormattedDateTime(), 'png');
    };

    p.windowResized = () => {
        if (p.canvas?.elt?.style) {
            p.canvas.elt.style.width = '100%';
            p.canvas.elt.style.height = 'auto';
        }
    };
};
