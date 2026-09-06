import color from "../../shared/color.js";
import { getFormattedDateTime } from "../../shared/datetime.js";

const CANVAS_SIZE = 600;

export const defaultParams = {
    NumberOfCircles: { value: 30, type: "number", min: 1, max: 200, step: 1, label: "NumbersOfShapes/形の数" },
    Radius: { value: 150, type: "number", min: 0, max: 300, step: 1, label: "Radius/円が配置される円周の半径" },
    CircleSize: { value: 20, type: "number", min: 1, max: 100, step: 1, label: "Width/幅" },
    Density: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "Density/密度" },
    Alternation: { value: 1, type: "number", min: 0, max: 2, step: 0.1, label: "Alternating/交互に幅を変える" },
    StartAngle: { value: 0, type: "number", min: 0, max: 360, step: 1 },
    EndAngle: { value: 360, type: "number", min: 0, max: 360, step: 1 },

    Fill: { value: "#bbecdb", type: "color", label: "Fill/塗り", category: "Color/色" },
    Stroke: { value: color.black, type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 0, type: "number", min: 0, max: 10, step: 1, label: "StrokeWidth/線幅", category: "Color/色" },
    Background: { value: color.green, type: "color", label: "Background/背景", category: "Color/色" },

    Random: { value: false, type: "boolean", label: "RandomLayout/ランダムな配置", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMinScale: { value: 0.5, type: "number", min: 0, max: 1, step: 0.01, label: "MinScale/最小スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMaxScale: { value: 1.5, type: "number", min: 1, max: 3, step: 0.01, label: "MaxScale/最大スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomOffset: { value: 20, type: "number", min: 0, max: 100, step: 1, label: "Offset/オフセット", category: "RandomPositionScale/ランダムな位置とサイズ" }
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

        if (!currentParams.Random) {
            currentParams.RandomMinScale = 1;
            currentParams.RandomMaxScale = 1;
            currentParams.RandomOffset = 0;
            currentParams.Density = 1;
        }

        g.push();
        g.translate(g.width / 2, g.height / 2);

        const numCircles = currentParams.NumberOfCircles;
        const radius = currentParams.Radius;
        const circleSize = currentParams.CircleSize;

        const startAngle = g.radians(currentParams.StartAngle);
        const endAngle = g.radians(currentParams.EndAngle);
        const angleRange = endAngle - startAngle;

        for (let i = 0; i < numCircles; i++) {
            const angle = startAngle + (angleRange / numCircles) * i;

            const x = radius * g.cos(angle);
            const y = radius * g.sin(angle);

            if (g.random() < currentParams.Density) {
                g.push();

                if (i % 2 === 0) {
                    g.translate(
                        x * currentParams.Alternation + g.random(-currentParams.RandomOffset, currentParams.RandomOffset),
                        y * currentParams.Alternation + g.random(-currentParams.RandomOffset, currentParams.RandomOffset)
                    );
                } else {
                    g.translate(
                        x + g.random(-currentParams.RandomOffset, currentParams.RandomOffset),
                        y + g.random(-currentParams.RandomOffset, currentParams.RandomOffset)
                    );
                }

                let r = g.random(currentParams.RandomMinScale, currentParams.RandomMaxScale);
                let scaledCircleSize = circleSize * r;

                drawCircle(g, currentParams, scaledCircleSize);

                g.pop();
            }
        }
        g.pop();
    };

    p.draw = function () {
        seed = p.random(1000000);
        drawArt(p, params, seed);
    };

    const drawCircle = (g, currentParams, size) => {
        g.fill(currentParams.Fill);

        if (currentParams.StrokeWidth === 0) {
            g.noStroke();
        } else {
            g.strokeWeight(currentParams.StrokeWidth);
            g.stroke(currentParams.Stroke);
        }

        g.ellipseMode(g.RADIUS);
        g.ellipse(0, 0, size / 2, size / 2);
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
