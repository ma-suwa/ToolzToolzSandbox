import { getFormattedDateTime } from "../../shared/datetime.js";

// 0015_CircleonCircumferenceの円周配置ロジックをベースに、
// 円の中身ではなく「円同士の共通接線」をペアごとにすべて描画するツール。
// 2円の半径差・和から外接線/内接線を幾何学的に求め、直線でつなぐ。

const CANVAS_SIZE = 600;

export const defaultParams = {
    NumberOfCircles: { value: 10, type: "number", min: 2, max: 40, step: 1, label: "NumberOfCircles/円の数" },
    PlacementRadius: { value: 200, type: "number", min: 0, max: 300, step: 1, label: "PlacementRadius/円が並ぶ半径" },
    CircleRadius: { value: 45, type: "number", min: 5, max: 150, step: 1, label: "CircleRadius/各円の半径" },
    StartAngle: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "StartAngle/開始角度" },
    EndAngle: { value: 360, type: "number", min: 0, max: 360, step: 1, label: "EndAngle/終了角度" },

    RandomLayout: { value: false, type: "boolean", label: "RandomLayout/ランダムな配置", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMinScale: { value: 0.6, type: "number", min: 0.1, max: 1, step: 0.01, label: "MinScale/最小スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomMaxScale: { value: 1.4, type: "number", min: 1, max: 3, step: 0.01, label: "MaxScale/最大スケール", category: "RandomPositionScale/ランダムな位置とサイズ" },
    RandomOffset: { value: 0, type: "number", min: 0, max: 150, step: 1, label: "Offset/オフセット", category: "RandomPositionScale/ランダムな位置とサイズ" },

    ShowCircles: { value: true, type: "boolean", label: "ShowCircles/円を表示", category: "Circle/円" },
    Fill: { value: "#101820", type: "color", label: "Fill/塗り", category: "Circle/円" },
    FillAlpha: { value: 0.15, type: "number", min: 0, max: 1, step: 0.01, label: "FillAlpha/塗りの透明度", category: "Circle/円" },
    Stroke: { value: "#ffffff", type: "color", label: "Stroke/円の線", category: "Circle/円" },
    StrokeWidth: { value: 1, type: "number", min: 0, max: 6, step: 0.1, label: "StrokeWidth/円の線幅", category: "Circle/円" },
    StrokeAlpha: { value: 0.8, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/円の線の透明度", category: "Circle/円" },

    ShowExternalTangents: { value: true, type: "boolean", label: "ShowExternalTangents/外接線を表示", category: "Tangent/接線" },
    ShowInternalTangents: { value: true, type: "boolean", label: "ShowInternalTangents/内接線を表示", category: "Tangent/接線" },
    MaxConnectionDistance: { value: 900, type: "number", min: 10, max: 900, step: 1, label: "MaxDistance/最大接続距離", category: "Tangent/接線" },
    Density: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "Density/接続の密度", category: "Tangent/接線" },
    TangentStrokeWidth: { value: 0.6, type: "number", min: 0.1, max: 4, step: 0.1, label: "TangentWidth/接線の太さ", category: "Tangent/接線" },
    TangentAlpha: { value: 0.5, type: "number", min: 0, max: 1, step: 0.01, label: "TangentAlpha/接線の透明度", category: "Tangent/接線" },
    ExternalColor: { value: "#8fd9ff", type: "color", label: "ExternalColor/外接線の色", category: "Tangent/接線" },
    InternalColor: { value: "#ff8fd9", type: "color", label: "InternalColor/内接線の色", category: "Tangent/接線" },

    Background: { value: "#05070a", type: "color", label: "Background/背景", category: "Color/色" }
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

    // 2円(c1,r1)と(c2,r2)の共通接線を求める。
    // 外接線: 半径が同じ向きを向く(円の外側どうしを結ぶ、交差しない)
    // 内接線: 半径が逆向きを向く(2円の間を横切る)
    const computeTangentLines = (c1, r1, c2, r2, includeExternal, includeInternal) => {
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1e-6) return [];

        const baseAngle = Math.atan2(dy, dx);
        const lines = [];

        if (includeExternal) {
            const val = (r1 - r2) / d;
            if (Math.abs(val) <= 1) {
                const alpha = Math.acos(val);
                for (const s of [1, -1]) {
                    const a = baseAngle + s * alpha;
                    const p1 = { x: c1.x + r1 * Math.cos(a), y: c1.y + r1 * Math.sin(a) };
                    const p2 = { x: c2.x + r2 * Math.cos(a), y: c2.y + r2 * Math.sin(a) };
                    lines.push({ p1, p2, type: 'external' });
                }
            }
        }

        if (includeInternal) {
            const val = (r1 + r2) / d;
            if (Math.abs(val) <= 1) {
                const beta = Math.acos(val);
                for (const s of [1, -1]) {
                    const a = baseAngle + s * beta;
                    const p1 = { x: c1.x + r1 * Math.cos(a), y: c1.y + r1 * Math.sin(a) };
                    const p2 = { x: c2.x - r2 * Math.cos(a), y: c2.y - r2 * Math.sin(a) };
                    lines.push({ p1, p2, type: 'internal' });
                }
            }
        }

        return lines;
    };

    const drawArt = (g, currentParams, currentSeed) => {
        g.randomSeed(currentSeed);
        g.background(currentParams.Background);

        const fillC = g.color(currentParams.Fill);
        const strokeC = g.color(currentParams.Stroke);
        const externalC = g.color(currentParams.ExternalColor);
        const internalC = g.color(currentParams.InternalColor);

        const count = currentParams.NumberOfCircles;
        const placementRadius = currentParams.PlacementRadius;
        const baseCircleRadius = currentParams.CircleRadius;
        const startAngle = g.radians(currentParams.StartAngle);
        const endAngle = g.radians(currentParams.EndAngle);
        const angleRange = endAngle - startAngle;

        const randomLayout = currentParams.RandomLayout;
        const minScale = randomLayout ? currentParams.RandomMinScale : 1;
        const maxScale = randomLayout ? currentParams.RandomMaxScale : 1;
        const offset = randomLayout ? currentParams.RandomOffset : 0;

        const centerX = g.width / 2;
        const centerY = g.height / 2;

        const circles = [];
        for (let i = 0; i < count; i++) {
            const angle = startAngle + (angleRange / count) * i;
            const bx = centerX + placementRadius * Math.cos(angle);
            const by = centerY + placementRadius * Math.sin(angle);
            const scale = g.random(minScale, maxScale);
            const x = bx + g.random(-offset, offset);
            const y = by + g.random(-offset, offset);
            circles.push({ x, y, r: baseCircleRadius * scale });
        }

        if (currentParams.ShowCircles) {
            g.fill(g.red(fillC), g.green(fillC), g.blue(fillC), currentParams.FillAlpha * 255);
            if (currentParams.StrokeWidth > 0) {
                g.strokeWeight(currentParams.StrokeWidth);
                g.stroke(g.red(strokeC), g.green(strokeC), g.blue(strokeC), currentParams.StrokeAlpha * 255);
            } else {
                g.noStroke();
            }
            for (const c of circles) {
                g.ellipse(c.x, c.y, c.r * 2, c.r * 2);
            }
        }

        g.strokeWeight(currentParams.TangentStrokeWidth);
        const maxDist = currentParams.MaxConnectionDistance;
        const density = currentParams.Density;

        for (let i = 0; i < circles.length - 1; i++) {
            for (let j = i + 1; j < circles.length; j++) {
                const c1 = circles[i];
                const c2 = circles[j];
                const dx = c2.x - c1.x;
                const dy = c2.y - c1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > maxDist || g.random() >= density) continue;

                const lines = computeTangentLines(
                    c1, c1.r, c2, c2.r,
                    currentParams.ShowExternalTangents,
                    currentParams.ShowInternalTangents
                );

                for (const line of lines) {
                    const col = line.type === 'external' ? externalC : internalC;
                    g.stroke(g.red(col), g.green(col), g.blue(col), currentParams.TangentAlpha * 255);
                    g.line(line.p1.x, line.p1.y, line.p2.x, line.p2.y);
                }
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
