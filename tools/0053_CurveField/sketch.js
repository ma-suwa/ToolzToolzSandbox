import { getFormattedDateTime } from "../../shared/datetime.js";

// グリッド状に配置した短い曲線ストロークが、緩やかな「流れ場」の向きに沿って
// 並ぶことで、風や水流のような曲線美のテクスチャを作るツール。
// 0052_CurledBloomのような単一中心の回転反復ではなく、格子状の分散配置が骨格。

const CANVAS_SIZE = 600;

export const defaultParams = {
    Columns: { value: 20, type: "number", min: 3, max: 50, step: 1, label: "Columns/列数" },
    Rows: { value: 20, type: "number", min: 3, max: 50, step: 1, label: "Rows/行数" },
    CurveLength: { value: 0.8, type: "number", min: 0.1, max: 1.8, step: 0.05, label: "CurveLength/セル比のストローク長" },
    Curviness: { value: 8, type: "number", min: 0, max: 40, step: 1, label: "Curviness/曲線の曲がり具合" },
    SCurve: { value: true, type: "boolean", label: "SCurve/S字にする(オフはC字)" },

    FieldFrequencyX: { value: 3, type: "number", min: 0, max: 12, step: 0.1, label: "FrequencyX/流れ場のX周波数", category: "Field/流れ場" },
    FieldFrequencyY: { value: 3, type: "number", min: 0, max: 12, step: 0.1, label: "FrequencyY/流れ場のY周波数", category: "Field/流れ場" },
    FieldAngleOffset: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "AngleOffset/全体の向き", category: "Field/流れ場" },
    JitterPosition: { value: 0.2, type: "number", min: 0, max: 1, step: 0.01, label: "JitterPosition/位置のばらつき", category: "Field/流れ場" },
    JitterAngle: { value: 10, type: "number", min: 0, max: 90, step: 1, label: "JitterAngle/角度のばらつき", category: "Field/流れ場" },

    Stroke: { value: "#8fd9ff", type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 1.5, type: "number", min: 0.2, max: 6, step: 0.1, label: "StrokeWidth/線幅", category: "Color/色" },
    StrokeAlpha: { value: 0.85, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/透明度", category: "Color/色" },
    Background: { value: "#0a0e1a", type: "color", label: "Background/背景", category: "Color/色" },

    ColorByAngle: { value: true, type: "boolean", label: "ColorByAngle/流れの向きで色相を決める", category: "RandomColor/色" },
    HueStart: { value: 190, type: "number", min: 0, max: 360, step: 1, label: "HueStart/開始色相", category: "RandomColor/色" },
    HueEnd: { value: 320, type: "number", min: 0, max: 360, step: 1, label: "HueEnd/終了色相", category: "RandomColor/色" },
    Saturation: { value: 75, type: "number", min: 0, max: 100, step: 1, label: "Saturation/彩度", category: "RandomColor/色" },
    Lightness: { value: 65, type: "number", min: 0, max: 100, step: 1, label: "Lightness/明度", category: "RandomColor/色" }
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
        g.colorMode(p.HSL);
        g.noFill();

        const solidStroke = g.color(currentParams.Stroke);
        const solidH = g.hue(solidStroke);
        const solidS = g.saturation(solidStroke);
        const solidL = g.lightness(solidStroke);

        const cols = currentParams.Columns;
        const rows = currentParams.Rows;
        const cellW = g.width / cols;
        const cellH = g.height / rows;
        const curveLen = currentParams.CurveLength * Math.min(cellW, cellH);
        const curviness = currentParams.Curviness;
        const angleOffset = g.radians(currentParams.FieldAngleOffset);
        const fx = currentParams.FieldFrequencyX;
        const fy = currentParams.FieldFrequencyY;
        const jitterPos = currentParams.JitterPosition;
        const jitterAngle = g.radians(currentParams.JitterAngle);

        g.strokeWeight(currentParams.StrokeWidth);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cx = col * cellW + cellW / 2 + g.random(-jitterPos, jitterPos) * cellW;
                const cy = row * cellH + cellH / 2 + g.random(-jitterPos, jitterPos) * cellH;

                const u = col / cols;
                const v = row / rows;
                const fieldAngle = angleOffset + Math.sin(u * Math.PI * 2 * fx) * Math.PI * 0.5
                    + Math.cos(v * Math.PI * 2 * fy) * Math.PI * 0.5
                    + g.random(-jitterAngle, jitterAngle);

                const dirX = Math.cos(fieldAngle);
                const dirY = Math.sin(fieldAngle);
                const perpX = -dirY;
                const perpY = dirX;

                const p0x = cx - dirX * curveLen / 2;
                const p0y = cy - dirY * curveLen / 2;
                const p3x = cx + dirX * curveLen / 2;
                const p3y = cy + dirY * curveLen / 2;

                const p1x = p0x + dirX * curveLen * 0.33 + perpX * curviness;
                const p1y = p0y + dirY * curveLen * 0.33 + perpY * curviness;
                const bulge2 = currentParams.SCurve ? -curviness : curviness;
                const p2x = p0x + dirX * curveLen * 0.66 + perpX * bulge2;
                const p2y = p0y + dirY * curveLen * 0.66 + perpY * bulge2;

                if (currentParams.ColorByAngle) {
                    const normalizedAngle = ((fieldAngle % g.TWO_PI) + g.TWO_PI) / g.TWO_PI;
                    const hue = g.map(normalizedAngle, 0, 1, currentParams.HueStart, currentParams.HueEnd);
                    g.stroke(hue, currentParams.Saturation, currentParams.Lightness, currentParams.StrokeAlpha);
                } else {
                    g.stroke(solidH, solidS, solidL, currentParams.StrokeAlpha);
                }

                g.bezier(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y);
            }
        }
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
