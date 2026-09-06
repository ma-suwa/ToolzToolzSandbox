import { getFormattedDateTime } from "../../shared/datetime.js";

// 植物のツタ(蔓)をイメージしたジェネレーター。
// 1歩ずつ角度を少しずつ変えながら進む「ランダムウォーク」で主茎を伸ばし、
// 節ごとに枝分かれ(0028_Snowflakeの主枝+細かい枝の構造を参照)する。
// 枝はすべて直線の折れ線で構成し、抽象的な骨格そのものを見せる。

const CANVAS_SIZE = 600;

export const defaultParams = {
    Scale: { value: 0.2, type: "number", min: 0.2, max: 2, step: 0.05, label: "Scale/全体の大きさ" },
    Steps: { value: 12, type: "number", min: 3, max: 100, step: 1, label: "Steps/茎の長さ(歩数)" },
    StepLength: { value: 32, type: "number", min: 5, max: 80, step: 1, label: "StepLength/1歩の長さ" },
    GrowthAngle: { value: 270, type: "number", min: 0, max: 360, step: 1, label: "GrowthAngle/成長方向" },
    TurnPerStep: { value: 2, type: "number", min: -20, max: 20, step: 0.5, label: "TurnPerStep/1歩ごとの旋回角" },
    TurnJitter: { value: 25, type: "number", min: 0, max: 60, step: 0.5, label: "TurnJitter/旋回のばらつき" },
    StemWidth: { value: 8, type: "number", min: 1, max: 20, step: 0.5, label: "StemWidth/茎の太さ" },
    HandleLength: { value: 14, type: "number", min: 0, max: 200, step: 1, label: "HandleLength/曲線ハンドルの長さ" },
    HandleAsymmetry: { value: 0, type: "number", min: -1, max: 1, step: 0.01, label: "HandleAsymmetry/入口出口の長さの偏り" },
    HandleJitter: { value: 0, type: "number", min: 0, max: 1, step: 0.01, label: "HandleJitter/ハンドル長のばらつき" },

    BranchInterval: { value: 4, type: "number", min: 0.1, max: 20, step: 0.1, label: "BranchInterval/枝分かれの間隔", category: "Branch/枝分かれ" },
    BranchLengthRatio: { value: 0.5, type: "number", min: 0.1, max: 1, step: 0.01, label: "BranchLengthRatio/枝の長さ比率", category: "Branch/枝分かれ" },
    BranchAngleSpread: { value: 45, type: "number", min: 5, max: 100, step: 1, label: "BranchAngleSpread/分岐角度", category: "Branch/枝分かれ" },
    BranchAlternate: { value: true, type: "boolean", label: "BranchAlternate/左右交互に分岐", category: "Branch/枝分かれ" },
    BranchTurnJitter: { value: 0, type: "number", min: 0, max: 40, step: 0.5, label: "BranchTurnJitter/枝の旋回のばらつき", category: "Branch/枝分かれ" },

    Stroke: { value: "#4c7a3a", type: "color", label: "Stroke/茎の色", category: "Color/色" },
    StrokeAlpha: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/茎の透明度", category: "Color/色" },
    Background: { value: "#101c12", type: "color", label: "Background/背景", category: "Color/色" },

    RandomStrokeColor: { value: false, type: "boolean", label: "RandomStrokeColor/枝ごとに色をランダム化", category: "RandomColor/色のランダム化" },
    HueMin: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "HueMin/色相の最小値", category: "RandomColor/色のランダム化" },
    HueMax: { value: 360, type: "number", min: 0, max: 360, step: 1, label: "HueMax/色相の最大値", category: "RandomColor/色のランダム化" },
    RandomSaturation: { value: 55, type: "number", min: 0, max: 100, step: 1, label: "Saturation/彩度", category: "RandomColor/色のランダム化" },
    RandomLightness: { value: 50, type: "number", min: 0, max: 100, step: 1, label: "Lightness/明度", category: "RandomColor/色のランダム化" }
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

    // ランダムウォークで茎を1本伸ばし、通過点(座標+その場での進行角度)の配列を返す
    const growStem = (g, startX, startY, startAngle, steps, stepLength, turnPerStep, turnJitter) => {
        const points = [{ x: startX, y: startY, angle: startAngle }];
        let angle = startAngle;
        let x = startX;
        let y = startY;
        for (let i = 0; i < steps; i++) {
            angle += g.radians(turnPerStep) + g.random(g.radians(-turnJitter), g.radians(turnJitter));
            x += Math.cos(angle) * stepLength;
            y += Math.sin(angle) * stepLength;
            points.push({ x, y, angle });
        }
        return points;
    };

    const drawArt = (g, currentParams, currentSeed) => {
        g.randomSeed(currentSeed);
        g.background(currentParams.Background);
        g.colorMode(p.HSL);
        g.strokeCap(g.ROUND);

        const strokeC = g.color(currentParams.Stroke);
        const strokeH = g.hue(strokeC);
        const strokeS = g.saturation(strokeC);
        const strokeL = g.lightness(strokeC);

        const scale = currentParams.Scale;
        const stepLength = currentParams.StepLength * scale;
        const stemWidth = currentParams.StemWidth * scale;
        const handleLength = currentParams.HandleLength * scale;
        const handleAsymmetry = currentParams.HandleAsymmetry;
        const handleJitter = currentParams.HandleJitter;

        // 茎(main/branch共通)を、1本の連続したパスとしてcubic bezierで描画する。
        // 各点自身の進行角度(angle)をベースに、以下の2つでハンドルを細かく調整する:
        //   HandleAsymmetry … 入口側(h1)と出口側(h2)の長さの配分を偏らせ、雫型の曲線にする
        //   HandleJitter    … セグメントごとにハンドル長をランダムに揺らし、有機的な不揃いさを出す
        const drawStem = (points, baseWidth) => {
            let h = strokeH, s = strokeS, l = strokeL;
            if (currentParams.RandomStrokeColor) {
                h = g.random(currentParams.HueMin, currentParams.HueMax);
                s = currentParams.RandomSaturation;
                l = currentParams.RandomLightness;
            }
            g.strokeWeight(baseWidth);
            g.stroke(h, s, l, currentParams.StrokeAlpha);
            g.noFill();
            g.beginShape();
            g.vertex(points[0].x, points[0].y);
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];

                const h1Length = handleLength * (1 + handleAsymmetry) * (1 + g.random(-handleJitter, handleJitter));
                const h2Length = handleLength * (1 - handleAsymmetry) * (1 + g.random(-handleJitter, handleJitter));

                const h1x = p0.x + Math.cos(p0.angle) * h1Length;
                const h1y = p0.y + Math.sin(p0.angle) * h1Length;
                const h2x = p1.x - Math.cos(p1.angle) * h2Length;
                const h2y = p1.y - Math.sin(p1.angle) * h2Length;
                g.bezierVertex(h1x, h1y, h2x, h2y, p1.x, p1.y);
            }
            g.endShape();
        };

        // 主茎
        const startX = g.width / 2;
        const startY = g.height - 20;
        const mainPoints = growStem(
            g, startX, startY, g.radians(currentParams.GrowthAngle),
            currentParams.Steps, stepLength,
            currentParams.TurnPerStep, currentParams.TurnJitter
        );

        // BranchIntervalが1未満の場合は同じ点に複数回枝が生える(=より密な分岐)ことを許容する
        let branchSign = 1;
        let branchCursor = currentParams.BranchInterval;
        while (branchCursor < mainPoints.length) {
            const i = Math.min(mainPoints.length - 1, Math.max(1, Math.round(branchCursor)));
            const spawn = mainPoints[i];
            const side = currentParams.BranchAlternate ? branchSign : (g.random() < 0.5 ? 1 : -1);
            const branchStartAngle = spawn.angle + side * g.radians(currentParams.BranchAngleSpread);
            const remainingSteps = Math.max(4, Math.round((mainPoints.length - i) * currentParams.BranchLengthRatio));

            const branchPoints = growStem(
                g, spawn.x, spawn.y, branchStartAngle,
                remainingSteps, stepLength,
                currentParams.TurnPerStep, currentParams.BranchTurnJitter
            );

            drawStem(branchPoints, stemWidth);

            branchSign *= -1;
            branchCursor += currentParams.BranchInterval;
        }

        drawStem(mainPoints, stemWidth);
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
