import color from "../../shared/color.js";
import { getFormattedDateTime } from "../../shared/datetime.js";

// 0015_CircleonCircumference の「円周上に要素を並べる」配置ロジックと、
// 0002_OneFlower の花びら(ベジエ多角形)描画ロジックを組み合わせたツール

const CANVAS_SIZE = 600;

export const defaultParams = {
    // --- 円周上への配置 (0015_CircleonCircumferenceより) ---
    NumbersOfShapes: { value: 16, type: "number", min: 1, max: 60, step: 1, label: "NumbersOfShapes/花の数", category: "Layout/配置" },
    Radius: { value: 200, type: "number", min: 0, max: 300, step: 1, label: "Radius/円周の半径", category: "Layout/配置" },
    StartAngle: { value: 0, type: "number", min: 0, max: 360, step: 1, category: "Layout/配置" },
    EndAngle: { value: 360, type: "number", min: 0, max: 360, step: 1, category: "Layout/配置" },
    Density: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "Density/密度", category: "Layout/配置" },
    RadiusAlternation: { value: 1, type: "number", min: 0, max: 2, step: 0.1, label: "RadiusAlternation/交互に半径を変える", category: "Layout/配置" },
    RotateOutward: { value: false, type: "boolean", label: "RotateOutward/外向きに回転", category: "Layout/配置" },

    RandomLayout: { value: false, type: "boolean", label: "RandomLayout/ランダムな配置", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMinScale: { value: 0.5, type: "number", min: 0, max: 1, step: 0.01, label: "MinScale/最小スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMaxScale: { value: 1.5, type: "number", min: 1, max: 3, step: 0.01, label: "MaxScale/最大スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomOffset: { value: 20, type: "number", min: 0, max: 100, step: 1, label: "Offset/オフセット", category: "RandomPositionScale/ランダムな位置とサイズ" },

    // --- 花の形 (0002_OneFlowerより) ---
    Numbers: { value: 12, type: "number", min: 3, max: 60, step: 1, label: "Numbers/花びらの数", category: "Flower/花の形" },
    Width: { value: 60, type: "number", min: 0, max: 300, step: 1, label: "Width/幅", category: "Flower/花の形" },
    ForceX: { value: 1, type: "number", min: -200, max: 200, step: 1, category: "Flower/花の形" },
    ForceY: { value: 1, type: "number", min: -200, max: 200, step: 1, category: "Flower/花の形" },

    PuckerBloat: { value: 2, type: "number", min: -3, max: 3, step: 0.01, label: "PuckerBloat/パンク膨張", category: "PuckerBloat/パンク膨張" },
    Alternation: { value: 1, type: "number", min: 0, max: 2, step: 0.01, label: "Alternating/交互に値を変える", category: "PuckerBloat/パンク膨張" },

    RandomHue: { value: true, type: "boolean", label: "Hue/色相", category: "RandomColor/ランダムな色" },
    HueMin: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "Min/最小値", category: "RandomColor/ランダムな色" },
    HueMax: { value: 360, type: "number", min: 0, max: 360, step: 1, label: "Max/最大値", category: "RandomColor/ランダムな色" },
    RandomSaturation: { value: true, type: "boolean", label: "Saturation/彩度", category: "RandomColor/ランダムな色" },
    SaturationMin: { value: 60, type: "number", min: 0, max: 100, step: 1, label: "Min/最小値", category: "RandomColor/ランダムな色" },
    SaturationMax: { value: 100, type: "number", min: 0, max: 100, step: 1, label: "Max/最大値", category: "RandomColor/ランダムな色" },
    RandomLightness: { value: true, type: "boolean", label: "Lightness/明度", category: "RandomColor/ランダムな色" },
    LightnessMin: { value: 40, type: "number", min: 0, max: 100, step: 1, label: "Min/最小値", category: "RandomColor/ランダムな色" },
    LightnessMax: { value: 70, type: "number", min: 0, max: 100, step: 1, label: "Max/最大値", category: "RandomColor/ランダムな色" },

    Stroke: { value: color.black, type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 0, type: "number", min: 0, max: 10, step: 1, label: "StrokeWidth/線幅", category: "Color/色" },
    Background: { value: color.white, type: "color", label: "Background/背景", category: "Color/色" }
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

    // 0002_OneFlowerの花びら描画ロジック(ローカル座標系版)+ 0005_FlowerGarden方式のランダム色
    const drawFlower = (g, currentParams, scaleFactor) => {
        let baseFillColorP5 = g.color(0);
        let h = g.hue(baseFillColorP5);
        let s = g.saturation(baseFillColorP5);
        let l = g.lightness(baseFillColorP5);

        if (currentParams.RandomHue) {
            h = g.random(currentParams.HueMin, currentParams.HueMax);
        }
        if (currentParams.RandomSaturation) {
            s = g.random(currentParams.SaturationMin, currentParams.SaturationMax);
        }
        if (currentParams.RandomLightness) {
            l = g.random(currentParams.LightnessMin, currentParams.LightnessMax);
        }

        g.fill(h, s, l);
        if (currentParams.StrokeWidth === 0) {
            g.noStroke();
        } else {
            g.strokeWeight(currentParams.StrokeWidth);
            g.stroke(currentParams.Stroke);
        }

        const width = currentParams.Width * scaleFactor;
        const sideNum = currentParams.Numbers;
        const angle = g.TWO_PI / sideNum;
        const controlDistance = width * currentParams.PuckerBloat;

        const anchorPoints = [];
        const controlPoints = [];

        for (let j = 0; j < sideNum; j++) {
            const angleJ = j * angle;
            const alt = (j % 2 === 0) ? 1 : currentParams.Alternation;
            anchorPoints.push(g.createVector(
                currentParams.ForceX + g.cos(angleJ) * width * alt,
                currentParams.ForceY + g.sin(angleJ) * width * alt
            ));
            controlPoints.push(g.createVector(
                g.cos(angleJ) * controlDistance * alt,
                g.sin(angleJ) * controlDistance * alt
            ));
        }

        if (sideNum === 1) {
            if (anchorPoints[0]) {
                g.point(anchorPoints[0].x, anchorPoints[0].y);
            }
            return;
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

    // 0015_CircleonCircumferenceの円周配置ロジック
    const drawArt = (g, currentParams, currentSeed) => {
        g.randomSeed(currentSeed);
        g.background(currentParams.Background);
        g.colorMode(p.HSL);

        if (!currentParams.RandomLayout) {
            currentParams.RandomMinScale = 1;
            currentParams.RandomMaxScale = 1;
            currentParams.RandomOffset = 0;
            currentParams.Density = 1;
        }

        g.push();
        g.translate(g.width / 2, g.height / 2);

        const numShapes = currentParams.NumbersOfShapes;
        const radius = currentParams.Radius;
        const startAngle = g.radians(currentParams.StartAngle);
        const endAngle = g.radians(currentParams.EndAngle);
        const angleRange = endAngle - startAngle;

        for (let i = 0; i < numShapes; i++) {
            const angle = startAngle + (angleRange / numShapes) * i;
            const x = radius * g.cos(angle);
            const y = radius * g.sin(angle);

            if (g.random() < currentParams.Density) {
                g.push();

                if (i % 2 === 0) {
                    g.translate(
                        x * currentParams.RadiusAlternation + g.random(-currentParams.RandomOffset, currentParams.RandomOffset),
                        y * currentParams.RadiusAlternation + g.random(-currentParams.RandomOffset, currentParams.RandomOffset)
                    );
                } else {
                    g.translate(
                        x + g.random(-currentParams.RandomOffset, currentParams.RandomOffset),
                        y + g.random(-currentParams.RandomOffset, currentParams.RandomOffset)
                    );
                }

                if (currentParams.RotateOutward) {
                    g.rotate(angle);
                }

                const scaleFactor = g.random(currentParams.RandomMinScale, currentParams.RandomMaxScale);
                drawFlower(g, currentParams, scaleFactor);

                g.pop();
            }
        }
        g.pop();
    };

    p.draw = function () {
        seed = p.random(1000000);
        drawArt(p, params, seed);
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
