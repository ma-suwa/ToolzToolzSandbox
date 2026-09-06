import color from "../../shared/color.js";
import { getFormattedDateTime } from "../../shared/datetime.js";

// 線織面(ruled surface)のジェネレーター。
// 円A・円Bの対応点(i番目の点同士)を直線で結び、その本数分を重ねることで
// 直線の集合が曲面(双曲面のような輪郭)を描き出す様子を再現する。
// Twist(捩れ角)で円Bの対応点をずらすほど、直線群が中心に「くびれ」を作る。

const CANVAS_SIZE = 600;

export const defaultParams = {
    NumLines: { value: 120, type: "number", min: 3, max: 720, step: 1, label: "NumLines/線の本数" },
    RadiusA: { value: 220, type: "number", min: 0, max: 300, step: 1, label: "RadiusA/円Aの半径" },
    RadiusB: { value: 220, type: "number", min: 0, max: 300, step: 1, label: "RadiusB/円Bの半径" },
    Twist: { value: 150, type: "number", min: -360, max: 360, step: 1, label: "Twist/対応点の捩れ角" },
    Rotation: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "Rotation/全体回転" },
    Density: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "Density/線の密度" },

    WaveFrequencyA: { value: 6, type: "number", min: 0, max: 48, step: 1, label: "FrequencyA/円Aの波の数", category: "WaveDeform/円周の波状変形" },
    WaveAmplitudeA: { value: 0, type: "number", min: 0, max: 150, step: 1, label: "AmplitudeA/円Aの振幅", category: "WaveDeform/円周の波状変形" },
    WaveFrequencyB: { value: 6, type: "number", min: 0, max: 48, step: 1, label: "FrequencyB/円Bの波の数", category: "WaveDeform/円周の波状変形" },
    WaveAmplitudeB: { value: 30, type: "number", min: 0, max: 150, step: 1, label: "AmplitudeB/円Bの振幅", category: "WaveDeform/円周の波状変形" },
    WavePhaseOffset: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "PhaseOffset/AとBの位相差", category: "WaveDeform/円周の波状変形" },

    WaveFrequency2A: { value: 17, type: "number", min: 0, max: 96, step: 1, label: "Frequency2A/円Aの副波の数", category: "WaveDeform2/第2波の重ね合わせ" },
    WaveAmplitude2A: { value: 0, type: "number", min: 0, max: 80, step: 1, label: "Amplitude2A/円Aの副振幅", category: "WaveDeform2/第2波の重ね合わせ" },
    WaveFrequency2B: { value: 17, type: "number", min: 0, max: 96, step: 1, label: "Frequency2B/円Bの副波の数", category: "WaveDeform2/第2波の重ね合わせ" },
    WaveAmplitude2B: { value: 15, type: "number", min: 0, max: 80, step: 1, label: "Amplitude2B/円Bの副振幅", category: "WaveDeform2/第2波の重ね合わせ" },

    SquareNess: { value: 2, type: "number", min: 0.4, max: 8, step: 0.1, label: "SquareNess/真円⇔多角形・星形", category: "BaseShape/基本形状" },

    Turns: { value: 1, type: "number", min: 1, max: 12, step: 1, label: "Turns/円Aの周回数", category: "IndexWarp/つなぎ方の歪み" },
    IndexMultiplierB: { value: 1, type: "number", min: 0.1, max: 12, step: 0.1, label: "IndexMultiplierB/円Bのつなぎ先倍率", category: "IndexWarp/つなぎ方の歪み" },

    Stroke: { value: "#5fd0ff", type: "color", label: "Stroke/線の色", category: "Color/色" },
    StrokeWidth: { value: 1, type: "number", min: 0.1, max: 5, step: 0.1, label: "StrokeWidth/線幅", category: "Color/色" },
    StrokeAlpha: { value: 0.5, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/線の透明度", category: "Color/色" },
    Background: { value: "#05040a", type: "color", label: "Background/背景", category: "Color/色" },

    RainbowByIndex: { value: true, type: "boolean", label: "RainbowByIndex/線ごとに色相を変える", category: "RandomColor/線ごとの色" },
    HueStart: { value: 190, type: "number", min: 0, max: 360, step: 1, label: "HueStart/開始色相", category: "RandomColor/線ごとの色" },
    HueEnd: { value: 320, type: "number", min: 0, max: 360, step: 1, label: "HueEnd/終了色相", category: "RandomColor/線ごとの色" },
    Saturation: { value: 80, type: "number", min: 0, max: 100, step: 1, label: "Saturation/彩度", category: "RandomColor/線ごとの色" },
    Lightness: { value: 60, type: "number", min: 0, max: 100, step: 1, label: "Lightness/明度", category: "RandomColor/線ごとの色" }
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

        // 静的な線色(レインボー無効時)をHSL成分に変換しておく
        const solidColor = g.color(currentParams.Stroke);
        const solidH = g.hue(solidColor);
        const solidS = g.saturation(solidColor);
        const solidL = g.lightness(solidColor);

        g.push();
        g.translate(g.width / 2, g.height / 2);
        g.rotate(g.radians(currentParams.Rotation));
        g.strokeWeight(currentParams.StrokeWidth);

        const numLines = currentParams.NumLines;
        const radiusA = currentParams.RadiusA;
        const radiusB = currentParams.RadiusB;
        const twist = g.radians(currentParams.Twist);
        const phaseOffset = g.radians(currentParams.WavePhaseOffset);

        // 真円(n=2)⇔星形(n<2)⇔角丸四角形(n>2)を連続的に変化させる超楕円(superellipse)の極座標半径係数
        const superShape = (theta, n) => {
            const c = Math.abs(Math.cos(theta));
            const s = Math.abs(Math.sin(theta));
            return 1 / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n);
        };

        for (let i = 0; i < numLines; i++) {
            if (g.random() >= currentParams.Density) continue;

            const fraction = i / numLines;
            // Turnsで円Aの点が周回する回数を、IndexMultiplierBで円B側のつなぎ先を独立に制御する
            const angleA = fraction * g.TWO_PI * currentParams.Turns;
            const angleB = fraction * g.TWO_PI * currentParams.Turns * currentParams.IndexMultiplierB + twist;

            // 円周上のラインを主波+副波(2つのsin波の重ね合わせ)で変調し、真円から複雑な輪郭に変形する
            const waveA = currentParams.WaveAmplitudeA * Math.sin(currentParams.WaveFrequencyA * angleA)
                + currentParams.WaveAmplitude2A * Math.sin(currentParams.WaveFrequency2A * angleA);
            const waveB = currentParams.WaveAmplitudeB * Math.sin(currentParams.WaveFrequencyB * angleB + phaseOffset)
                + currentParams.WaveAmplitude2B * Math.sin(currentParams.WaveFrequency2B * angleB + phaseOffset);

            const rA = (radiusA + waveA) * superShape(angleA, currentParams.SquareNess);
            const rB = (radiusB + waveB) * superShape(angleB, currentParams.SquareNess);

            const xA = rA * g.cos(angleA);
            const yA = rA * g.sin(angleA);
            const xB = rB * g.cos(angleB);
            const yB = rB * g.sin(angleB);

            if (currentParams.RainbowByIndex) {
                const hue = g.map(i, 0, Math.max(1, numLines - 1), currentParams.HueStart, currentParams.HueEnd);
                g.stroke(hue, currentParams.Saturation, currentParams.Lightness, currentParams.StrokeAlpha);
            } else {
                g.stroke(solidH, solidS, solidL, currentParams.StrokeAlpha);
            }

            g.line(xA, yA, xB, yB);
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
