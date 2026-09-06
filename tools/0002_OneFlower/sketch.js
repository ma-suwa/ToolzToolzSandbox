import color from "../../shared/color.js";
import { getFormattedDateTime } from "../../shared/datetime.js";

const CANVAS_SIZE = 600;

export const defaultParams = {
    Numbers: { value: 12, type: "number", min: 3, max: 100, step: 1, label: "Numbers/数" },
    Width: { value: 100, type: "number", min: 0, max: 300, step: 1, label: "Width/幅" },
    ForceX: { value: 1, type: "number", min: -200, max: 200, step: 1 },
    ForceY: { value: 1, type: "number", min: -200, max: 200, step: 1 },
    PuckerBloat: { value: 2, type: "number", min: -3, max: 3, step: 0.01, label: "PuckerBloat/パンク膨張", category: "PuckerBloat/パンク膨張" },
    Alternation: { value: 1, type: "number", min: 0, max: 2, step: 0.01, label: "Alternating/交互に値を変える", category: "PuckerBloat/パンク膨張" },
    Fill: { value: color.red, type: "color", label: "Fill/塗り", category: "Color/色" },
    Stroke: { value: color.black, type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 0, type: "number", min: 0, max: 10, step: 1, label: "StrokeWidth/線幅", category: "Color/色" },
    Background: { value: color.white, type: "color", label: "Background/背景", category: "Color/色" },
    Random: { value: false, type: "boolean", category: "Random/ランダム" },
    Effects2: { value: 1, type: "number", min: 0, max: 2, step: 0.01, category: "Random/ランダム" },
    Effects3: { value: 1, type: "number", min: 0, max: 2, step: 0.01, category: "Random/ランダム" },
    Effects4: { value: 1, type: "number", min: 0, max: 2, step: 0.01, category: "Random/ランダム" },
    Effects5: { value: 1, type: "number", min: 0, max: 2, step: 0.01, category: "Random/ランダム" }
};

export const setupP5 = (p, params, container) => {
    let seed;

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

    const drawArt = (g, currentParams, currentSeed) => {
        g.randomSeed(currentSeed);

        g.background(currentParams.Background);
        g.fill(currentParams.Fill);

        if (currentParams.StrokeWidth === 0) {
            g.noStroke();
        } else {
            g.strokeWeight(currentParams.StrokeWidth);
            g.stroke(currentParams.Stroke);
        }
        drawPolygon(g, currentParams);
    };

    p.draw = function () {
        seed = p.random(1000000);
        drawArt(p, params, seed);
    };

    const drawPolygon = (g, currentParams) => {
        const centerX = g.width / 2;
        const centerY = g.height / 2;

        const sideNum = currentParams.Numbers;
        const angle = g.TWO_PI / sideNum;
        const controlDistance = currentParams.Width * currentParams.PuckerBloat;

        const randomFactors = currentParams.Random ? [
            g.random(-currentParams.Effects2, currentParams.Effects2),
            g.random(-currentParams.Effects3, currentParams.Effects3),
            g.random(-currentParams.Effects4, currentParams.Effects4),
            g.random(-currentParams.Effects5, currentParams.Effects5)
        ] : [1, 1, 1, 1];

        const anchorPoints = [];
        const controlPoints = [];

        for (let j = 0; j < sideNum; j++) {
            if (j % 2 == 0) {
                const angleJ = j * angle;
                anchorPoints.push(g.createVector(
                    centerX + currentParams.ForceX + g.cos(angleJ) * currentParams.Width * randomFactors[0],
                    centerY + currentParams.ForceY + g.sin(angleJ) * currentParams.Width * randomFactors[1]
                ));
                controlPoints.push(g.createVector(
                    centerX + g.cos(angleJ) * controlDistance * randomFactors[2],
                    centerY + g.sin(angleJ) * controlDistance * randomFactors[3]
                ));
            } else {
                const angleJ = j * angle;
                anchorPoints.push(g.createVector(
                    centerX + currentParams.ForceX + g.cos(angleJ) * currentParams.Width * randomFactors[0] * currentParams.Alternation,
                    centerY + currentParams.ForceY + g.sin(angleJ) * currentParams.Width * randomFactors[1] * currentParams.Alternation
                ));
                controlPoints.push(g.createVector(
                    centerX + g.cos(angleJ) * controlDistance * randomFactors[2] * currentParams.Alternation,
                    centerY + g.sin(angleJ) * controlDistance * randomFactors[3] * currentParams.Alternation
                ));
            }
        }

        if (sideNum === 1) {
            if (anchorPoints[0]) {
                g.point(anchorPoints[0].x, anchorPoints[0].y);
            }
            return;
        }
        g.beginShape();
        if (anchorPoints.length > 0) {
            g.vertex(anchorPoints[0].x, anchorPoints[0].y);
        }

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
        Object.assign(params, newParams);
        p.redraw();
    };

    p.exportSVG = () => {
        const svgGraphics = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE, p.SVG);
        drawArt(svgGraphics, params, seed);
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
