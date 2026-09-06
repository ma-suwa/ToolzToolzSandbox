import color from "../../shared/color.js";
import { getFormattedDateTime } from "../../shared/datetime.js";

const CANVAS_SIZE = 600;

export const defaultParams = {
    NumbersOfShapes: { value: 30, type: "number", min: 2, max: 500, step: 1, label: "NumbersOfShapes/形の数" },
    Density: { value: 0.75, type: "number", min: 0, max: 1, step: 0.01 },
    Background: { value: color.black, type: "color", label: "Background/背景", category: "Color/色" },
    Random: { value: false, type: "boolean", label: "RandomLayout/ランダムな配置", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMinScale: { value: 0.01, type: "number", min: 0, max: 1, step: 0.01, label: "MinScale/最小スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMaxScale: { value: 1, type: "number", min: 1, max: 10, step: 0.01, label: "MaxScale/最大スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomOffset: { value: 0, type: "number", min: 0, max: 600, step: 1, label: "Offset/オフセット", category: "RandomPositionScale/ランダムな位置とサイズ" },

    RandomHue: { value: true, type: "boolean", label: "Hue/色相", category: "RandomColor/ランダムな色" },
    HueMin: { value: 210, type: "number", min: 0, max: 360, step: 1, label: "Min/最小値", category: "RandomColor/ランダムな色" },
    HueMax: { value: 240, type: "number", min: 0, max: 360, step: 1, label: "Max/最大値", category: "RandomColor/ランダムな色" },
    RandomSaturation: { value: true, type: "boolean", label: "Saturation/彩度", category: "RandomColor/ランダムな色" },
    SaturationMin: { value: 50, type: "number", min: 0, max: 100, step: 1, label: "Min/最小値", category: "RandomColor/ランダムな色" },
    SaturationMax: { value: 100, type: "number", min: 0, max: 100, step: 1, label: "Max/最大値", category: "RandomColor/ランダムな色" },
    RandomLightness: { value: true, type: "boolean", label: "Lightness/明度", category: "RandomColor/ランダムな色" },
    LightnessMin: { value: 50, type: "number", min: 0, max: 100, step: 1, label: "Min/最小値", category: "RandomColor/ランダムな色" },
    LightnessMax: { value: 100, type: "number", min: 0, max: 100, step: 1, label: "Max/最大値", category: "RandomColor/ランダムな色" }
};

export const setupP5 = (p, params, container) => {
    let shapeSeed;
    let colorSeed;

    const SHAPE_PARAMS = [
        'NumbersOfShapes', 'Density', 'Random',
        'RandomMinScale', 'RandomMaxScale', 'RandomOffset'
    ];

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

    const drawArt = (g, currentParams, currentShapeSeed, currentColorSeed) => {
        g.randomSeed(currentShapeSeed);
        g.colorMode(p.HSL);
        g.background(currentParams.Background);

        const gridSize = currentParams.NumbersOfShapes;
        const cellWidth = g.width / gridSize;

        if (!currentParams.Random) {
            currentParams.RandomMinScale = 1;
            currentParams.RandomMaxScale = 1;
            currentParams.RandomOffset = 0;
            currentParams.Density = 1;
        }

        for (let j = 0; j < gridSize; j++) {
            if (g.random() < currentParams.Density) {
                g.push();
                g.translate(
                    j * cellWidth + cellWidth / 2 + g.random(-currentParams.RandomOffset, currentParams.RandomOffset),
                    g.height / 2
                );

                const originalWidth = currentParams.Width;
                const originalHeight = currentParams.Height;

                currentParams.Width = cellWidth * g.random(currentParams.RandomMinScale, currentParams.RandomMaxScale);
                currentParams.Height = g.height;

                drawRect(g, currentParams);

                currentParams.Width = originalWidth;
                currentParams.Height = originalHeight;
                g.pop();
            }
        }
    };

    p.draw = function () {
        drawArt(p, params, shapeSeed, colorSeed);
    };

    const drawRect = (g, currentParams) => {
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

        g.noStroke();

        g.rectMode(g.CENTER);
        g.rect(0, 0, currentParams.Width, currentParams.Height);
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
