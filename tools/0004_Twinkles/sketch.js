import color from "../../shared/color.js";
import { getFormattedDateTime } from "../../shared/datetime.js";

const CANVAS_SIZE = 600;

export const defaultParams = {
    NumbersOfShapes: { value: 18, type: "number", min: 0, max: 100, step: 1, label: "NumbersOfShapes/形の数" },
    Numbers: { value: 4, type: "number", min: 3, max: 100, step: 1, label: "Numbers/数" },
    PositionX: { value: 0, type: "number", min: -600, max: 600, step: 1, label: "PositionX/位置X" },
    PositionY: { value: 0, type: "number", min: -600, max: 600, step: 1, label: "PositionY/位置Y" },
    Width: { value: 20, type: "number", min: 0, max: 300, step: 1, label: "Width/幅" },
    Density: { value: 0.5, type: "number", min: 0, max: 1, step: 0.01, label: "Density/密度" },
    PuckerBloat: { value: 0, type: "number", min: -3, max: 3, step: 0.01, label: "PuckerBloat/パンク膨張", category: "PuckerBloat/パンク膨張" },
    Fill: { value: color.white, type: "color", label: "Fill/塗り", category: "Color/色" },
    Stroke: { value: color.black, type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 0, type: "number", min: 0, max: 10, step: 1, label: "StrokeWidth/線幅", category: "Color/色" },
    Background: { value: color.black, type: "color", label: "Background/背景", category: "Color/色" },
    Random: { value: true, type: "boolean", label: "RandomLayout/ランダムな配置", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMinScale: { value: 0.25, type: "number", min: 0, max: 1, step: 0.01, label: "MinScale/最小スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMaxScale: { value: 1.5, type: "number", min: 1, max: 3, step: 0.01, label: "MaxScale/最大スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomOffset: { value: 300, type: "number", min: 0, max: 600, step: 1, label: "Offset/オフセット", category: "RandomPositionScale/ランダムな位置とサイズ" }
};

export const setupP5 = (p, params, container) => {
    let shapeSeed;
    let colorSeed;

    const SHAPE_PARAMS = [
        'NumbersOfShapes', 'PositionX', 'PositionY',
        'Width', 'Density', 'Random',
        'RandomMinScale', 'RandomMaxScale', 'RandomOffset'
    ];

    p.setup = function () {
        const actualCanvasSize = Math.min(CANVAS_SIZE, p.windowWidth);
        const canvas = p.createCanvas(actualCanvasSize, actualCanvasSize);
        if (container) {
            canvas.parent(container);
        }
        shapeSeed = p.random(1000000);
        colorSeed = p.random(1000000);
        p.noLoop();
        setTimeout(() => {
            p.redraw();
        }, 0);
    };

    const drawArt = (g, currentParams, currentShapeSeed, currentColorSeed) => {
        g.randomSeed(currentShapeSeed);

        g.background(currentParams.Background);
        g.fill(currentParams.Fill);

        if (currentParams.StrokeWidth === 0) {
            g.noStroke();
        } else {
            g.strokeWeight(currentParams.StrokeWidth);
            g.stroke(currentParams.Stroke);
        }

        const gridSize = currentParams.NumbersOfShapes;
        const cellWidth = g.width / gridSize;
        const cellHeight = g.height / gridSize;

        if (!currentParams.Random) {
            currentParams.RandomMinScale = 1;
            currentParams.RandomMaxScale = 1;
            currentParams.RandomOffset = 0;
            currentParams.Density = 1;
        }

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (g.random() < currentParams.Density) {
                    g.push();
                    g.translate(
                        i * cellWidth + cellWidth / 2 + g.random(-currentParams.RandomOffset, currentParams.RandomOffset),
                        j * cellHeight + cellHeight / 2 + g.random(-currentParams.RandomOffset, currentParams.RandomOffset)
                    );

                    const originalWidth = currentParams.Width;
                    currentParams.Width *= g.random(currentParams.RandomMinScale, currentParams.RandomMaxScale);

                    drawPolygon(g, currentParams);

                    currentParams.Width = originalWidth;
                    g.pop();
                }
            }
        }
    };

    p.draw = function () {
        drawArt(p, params, shapeSeed, colorSeed);
    };

    const drawPolygon = (g, currentParams) => {
        const centerX = 0;
        const centerY = 0;

        const sideNum = currentParams.Numbers;
        const angle = g.TWO_PI / sideNum;
        const controlDistance = currentParams.Width * currentParams.PuckerBloat;

        const anchorPoints = [];
        const controlPoints = [];

        for (let j = 0; j < sideNum; j++) {
            const angleJ = j * angle;
            anchorPoints.push(g.createVector(
                centerX + g.cos(angleJ) * currentParams.Width + currentParams.PositionX,
                centerY + g.sin(angleJ) * currentParams.Width + currentParams.PositionY
            ));
            controlPoints.push(g.createVector(
                centerX + g.cos(angleJ) * controlDistance + currentParams.PositionX,
                centerY + g.sin(angleJ) * controlDistance + currentParams.PositionY
            ));
        }

        g.beginShape();
        g.vertex(anchorPoints[0].x, anchorPoints[0].y);

        for (let j = 0; j < sideNum; j++) {
            const nextIndex = (j + 1) % sideNum;
            g.bezierVertex(
                controlPoints[j].x, controlPoints[j].y,
                controlPoints[nextIndex].x, controlPoints[nextIndex].y,
                anchorPoints[nextIndex].x, anchorPoints[nextIndex].y
            );
        }
        g.endShape(g.CLOSE);
    };

    p.updateParams = (newParams) => {
        const oldParams = { ...params };
        Object.assign(params, newParams);

        const shapeParamsChanged = SHAPE_PARAMS.some(key =>
            oldParams[key] !== newParams[key]
        );

        if (shapeParamsChanged) {
            shapeSeed = p.random(1000000);
        }

        p.redraw();
    };

    p.exportSVG = () => {
        const svgGraphics = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE, p.SVG);
        drawArt(svgGraphics, params, shapeSeed, colorSeed);
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
        const actualCanvasSize = Math.min(CANVAS_SIZE, p.windowWidth);
        p.resizeCanvas(actualCanvasSize, actualCanvasSize);
        p.redraw();
    };
};
