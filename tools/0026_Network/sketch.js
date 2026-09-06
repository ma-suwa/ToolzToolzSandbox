import color from "../../shared/color.js";
import { getFormattedDateTime } from "../../shared/datetime.js";

const CANVAS_SIZE = 600;

export const defaultParams = {
    Numbers: { value: 10, type: "number", min: 5, max: 20, step: 1, label: "Numbers/数" },
    MaxDistance: { value: 100, type: "number", min: 10, max: 200, step: 1, label: "MaxDistance/最大接続距離" },
    RandomOffset: { value: 100, type: "number", min: -300, max: 300, step: 1, label: "RandomOffset/ランダムオフセット" },
    Density: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "Density/密度" },
    TriangleProbability: { value: 0.25, type: "number", min: 0, max: 1, step: 0.01, label: "TriangleDensity/塗りの三角形の密度" },

    Stroke: { value: color.white, type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 1, type: "number", min: 0, max: 10, step: 1, label: "StrokeWidth/線幅", category: "Color/色" },
    StrokeAlpha: { value: 0.3, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/線の透明度", category: "Color/色" },
    Background: { value: "#020729", type: "color", label: "Background/背景", category: "Color/色" },

    ShowBalls: { value: true, type: "boolean", label: "ShowBalls/円を表示", category: "Ball/円" },
    BallSize: { value: 4, type: "number", min: 1, max: 10, step: 1, label: "BallSize/円のサイズ", category: "Ball/円" },
    BallAlpha: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "BallAlpha/円の透明度", category: "Ball/円" },
    BallFill: { value: color.white, type: "color", label: "BallFill/円の塗りの色", category: "Ball/円" },
    BallStroke: { value: color.white, type: "color", label: "BallStroke/円の線の色", category: "Ball/円" },
    BallStrokeWidth: { value: 0, type: "number", min: 0, max: 10, step: 1, label: "BallStrokeWidth/円の線の太さ", category: "Ball/円" },
    RandomBallScale: { value: false, type: "boolean", category: "RandomBallScale/ランダムな円のスケール" },
    BallScaleMin: { value: 0.5, type: "number", min: 0.1, max: 2, step: 0.1, category: "RandomBallScale/ランダムな円のスケール" },
    BallScaleMax: { value: 1.5, type: "number", min: 0.1, max: 2, step: 0.1, category: "RandomBallScale/ランダムな円のスケール" },
    TriangleFill: { value: "#8a00ff", type: "color", label: "TriangleFill/三角形の色", category: "TriangleColor/三角形の色" },
    RandomTriangleAlpha: { value: true, type: "boolean", category: "TriangleColor/三角形の色" },
    TriangleAlphaMin: { value: 0.1, type: "number", min: 0, max: 1, step: 0.01, category: "TriangleColor/三角形の色" },
    TriangleAlphaMax: { value: 0.4, type: "number", min: 0, max: 1, step: 0.01, category: "TriangleColor/三角形の色" }
};

export const setupP5 = (p, params, container) => {
    let shapeSeed;
    let colorSeed;

    const SHAPE_PARAMS = [
        'Numbers', 'MaxDistance', 'RandomOffset', 'Density',
        'TriangleProbability', 'ShowBalls', 'BallSize',
        'RandomBallScale', 'BallScaleMin', 'BallScaleMax'
    ];

    class Ball {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    class Connection {
        constructor(ball0, ball1, distance) {
            this.ball0 = ball0;
            this.ball1 = ball1;
            this.distance = distance;
        }
    }

    const drawLine = (g, strokeWidth, strokeColor, strokeAlpha, beginX, beginY, endX, endY) => {
        if (strokeWidth === 0) {
            g.noStroke();
        } else {
            g.strokeWeight(strokeWidth);
            const r = g.red(strokeColor);
            const gr = g.green(strokeColor);
            const b = g.blue(strokeColor);
            g.stroke(r, gr, b, strokeAlpha * 255);
        }
        g.line(beginX, beginY, endX, endY);
    };

    const drawTriangle = (g, colorValue, x1, y1, x2, y2, x3, y3) => {
        g.fill(colorValue);
        g.noStroke();
        g.triangle(x1, y1, x2, y2, x3, y3);
    };

    const drawBall = (g, x, y, size, alpha, fillColor, strokeColor, strokeWidth) => {
        g.push();

        const fillR = g.red(fillColor);
        const fillG = g.green(fillColor);
        const fillB = g.blue(fillColor);
        g.fill(fillR, fillG, fillB, alpha * 255);

        if (strokeWidth === 0) {
            g.noStroke();
        } else {
            const strokeR = g.red(strokeColor);
            const strokeG = g.green(strokeColor);
            const strokeB = g.blue(strokeColor);
            g.strokeWeight(strokeWidth);
            g.stroke(strokeR, strokeG, strokeB, alpha * 255);
        }

        g.ellipse(x, y, size, size);
        g.pop();
    };

    const createConnectionMap = (connections) => {
        const map = new Map();
        for (const conn of connections) {
            const key1 = `${conn.ball0.x},${conn.ball0.y}`;
            const key2 = `${conn.ball1.x},${conn.ball1.y}`;
            if (!map.has(key1)) map.set(key1, new Set());
            if (!map.has(key2)) map.set(key2, new Set());
            map.get(key1).add(key2);
            map.get(key2).add(key1);
        }
        return map;
    };

    const getBallKey = (ball) => `${ball.x},${ball.y}`;

    const getNumberParam = (params, key, defaultValue = 0) => {
        return Number(params[key]) !== undefined ? Number(params[key]) : defaultValue;
    };

    const getBooleanParam = (params, key, defaultValue = false) => {
        return params[key] !== undefined ? params[key] : defaultValue;
    };

    const getColorParam = (params, key, defaultValue) => {
        return params[key] || defaultValue;
    };

    const generateBalls = (g, currentParams) => {
        const tempBalls = [];
        const gridSize = getNumberParam(currentParams, 'Numbers', 10);
        const randomOffset = getNumberParam(currentParams, 'RandomOffset', 0);
        const density = currentParams.Density || 1;
        const stageWidth = g.width;
        const stageHeight = g.height;
        const cellWidth = stageWidth / gridSize;
        const cellHeight = stageHeight / gridSize;

        for (let i = 0; i < gridSize + 4; i++) {
            for (let j = 0; j < gridSize + 4; j++) {
                if (g.random() < density) {
                    const baseX = i * cellWidth + cellWidth / 2 - cellWidth * 2;
                    const baseY = j * cellHeight + cellHeight / 2 - cellHeight * 2;
                    const nX = baseX + g.random(-randomOffset, randomOffset);
                    const nY = baseY + g.random(-randomOffset, randomOffset);
                    tempBalls.push(new Ball(nX, nY));
                }
            }
        }
        return tempBalls;
    };

    const calculateConnections = (tempBalls, maxDistance) => {
        const tempConnections = [];
        const distanceLimit = maxDistance * maxDistance;

        for (let i = 0; i < tempBalls.length - 1; i++) {
            const ball0 = tempBalls[i];
            for (let j = i + 1; j < tempBalls.length; j++) {
                const ball1 = tempBalls[j];
                const dx = ball1.x - ball0.x;
                const dy = ball1.y - ball0.y;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared < distanceLimit) {
                    const distance = Math.sqrt(distanceSquared);
                    tempConnections.push(new Connection(ball0, ball1, distance));
                }
            }
        }
        return tempConnections;
    };

    const detectTriangles = (g, tempBalls, tempConnections, connectionMap, triangleProbability) => {
        const ballMap = new Map();
        for (const ball of tempBalls) {
            ballMap.set(getBallKey(ball), ball);
        }

        const triangleSet = new Set();
        const triangles = [];

        for (const conn1 of tempConnections) {
            const ball0 = conn1.ball0;
            const ball1 = conn1.ball1;
            const key0 = getBallKey(ball0);
            const key1 = getBallKey(ball1);
            const neighbors0 = connectionMap.get(key0);
            const neighbors1 = connectionMap.get(key1);

            if (neighbors0 && neighbors1) {
                for (const neighborKey of neighbors0) {
                    if (neighbors1.has(neighborKey) && neighborKey !== key0 && neighborKey !== key1) {
                        const keys = [key0, key1, neighborKey].sort();
                        const triangleKey = keys.join('|');

                        if (!triangleSet.has(triangleKey)) {
                            triangleSet.add(triangleKey);
                            const ball2 = ballMap.get(neighborKey);
                            if (ball2 && g.random() < triangleProbability) {
                                triangles.push([ball0, ball1, ball2]);
                            }
                        }
                    }
                }
            }
        }
        return triangles;
    };

    const drawArt = (g, currentParams, currentShapeSeed, currentColorSeed) => {
        g.randomSeed(currentShapeSeed);

        const tempBalls = generateBalls(g, currentParams);

        const maxDistance = getNumberParam(currentParams, 'MaxDistance', 50);
        const tempConnections = calculateConnections(tempBalls, maxDistance);

        const connectionMap = createConnectionMap(tempConnections);

        g.background(currentParams.Background);

        const triangleProbability = getNumberParam(currentParams, 'TriangleProbability', 0.1);
        if (triangleProbability > 0) {
            const triangles = detectTriangles(g, tempBalls, tempConnections, connectionMap, triangleProbability);

            const triangleFill = getColorParam(currentParams, 'TriangleFill', p.color(255, 0, 255));
            const randomTriangleAlpha = getBooleanParam(currentParams, 'RandomTriangleAlpha', false);
            const triangleAlphaMin = getNumberParam(currentParams, 'TriangleAlphaMin', 0);
            const triangleAlphaMax = getNumberParam(currentParams, 'TriangleAlphaMax', 1);

            for (const [b0, b1, b2] of triangles) {
                const triangleAlpha = randomTriangleAlpha
                    ? g.random(triangleAlphaMin, triangleAlphaMax)
                    : (triangleAlphaMin + triangleAlphaMax) / 2;

                const r = g.red(triangleFill);
                const gr = g.green(triangleFill);
                const b = g.blue(triangleFill);
                const triangleColor = g.color(r, gr, b, triangleAlpha * 255);

                drawTriangle(g, triangleColor, b0.x, b0.y, b1.x, b1.y, b2.x, b2.y);
            }
        }

        g.noFill();
        const strokeWidth = getNumberParam(currentParams, 'StrokeWidth', 1);
        const strokeColor = getColorParam(currentParams, 'Stroke', p.color(255));
        const strokeAlpha = getNumberParam(currentParams, 'StrokeAlpha', 1);

        for (const connection of tempConnections) {
            drawLine(
                g,
                strokeWidth,
                strokeColor,
                strokeAlpha,
                connection.ball0.x,
                connection.ball0.y,
                connection.ball1.x,
                connection.ball1.y
            );
        }

        const showBalls = getBooleanParam(currentParams, 'ShowBalls', true);
        if (showBalls) {
            const ballSize = getNumberParam(currentParams, 'BallSize', 1);
            const ballAlpha = getNumberParam(currentParams, 'BallAlpha', 1);
            const randomBallScale = getBooleanParam(currentParams, 'RandomBallScale', false);
            const ballScaleMin = getNumberParam(currentParams, 'BallScaleMin', 0.5);
            const ballScaleMax = getNumberParam(currentParams, 'BallScaleMax', 1.5);
            const ballFill = getColorParam(currentParams, 'BallFill', p.color(255));
            const ballStroke = getColorParam(currentParams, 'BallStroke', p.color(255));
            const ballStrokeWidth = getNumberParam(currentParams, 'BallStrokeWidth', 0);

            for (const ball of tempBalls) {
                const scale = randomBallScale ? g.random(ballScaleMin, ballScaleMax) : 1;
                const currentBallSize = ballSize * scale;
                drawBall(g, ball.x, ball.y, currentBallSize, ballAlpha, ballFill, ballStroke, ballStrokeWidth);
            }
        }
    };

    p.setup = function () {
        const canvas = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
        if (container) {
            canvas.parent(container);
        }
        canvas.elt.style.width = '100%';
        canvas.elt.style.height = 'auto';
        shapeSeed = p.random(1000000);
        colorSeed = p.random(1000000);
        p.noLoop();
        setTimeout(() => {
            p.redraw();
        }, 0);
    };

    p.draw = function () {
        drawArt(p, params, shapeSeed, colorSeed);
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
        if (p.canvas && p.canvas.elt && p.canvas.elt.style) {
            p.canvas.elt.style.width = '100%';
            p.canvas.elt.style.height = 'auto';
        }
    };
};
