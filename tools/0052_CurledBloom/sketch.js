import { getFormattedDateTime } from "../../shared/datetime.js";

// 0028_Snowflakeの「同じ形を回転させて反復させる」構造を踏襲しつつ、
// 直線の枝の代わりにベジエ曲線の"渦"を使う花/唐草模様風のジェネレーター。
// 主要な曲線(花弁)をBranchCount個、360度を等分して回転配置する。
// さらに各花弁の曲線上にも、同じ曲線形状を縮小した小さな渦(SubCurl)を対で生やす
// (Snowflakeの主枝+細かい枝の構造をそのまま曲線バージョンに置き換えたもの)。

const CANVAS_SIZE = 600;

export const defaultParams = {
    BranchCount: { value: 8, type: "number", min: 3, max: 24, step: 1, label: "BranchCount/花弁(枝)の数" },
    Rotation: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "Rotation/全体回転" },
    Length: { value: 180, type: "number", min: 20, max: 280, step: 1, label: "Length/枝の長さ" },
    Curviness: { value: 70, type: "number", min: -150, max: 150, step: 1, label: "Curviness/曲線の膨らみ" },
    ControlRatio1: { value: 0.3, type: "number", min: 0.05, max: 0.95, step: 0.01, label: "ControlRatio1/制御点1の位置" },
    ControlRatio2: { value: 0.75, type: "number", min: 0.05, max: 2, step: 0.01, label: "ControlRatio2/制御点2の位置" },
    CurveSymmetry: { value: false, type: "boolean", label: "CurveSymmetry/C字カーブにする(オフはS字)" },
    Mirror: { value: true, type: "boolean", label: "Mirror/左右対称にして花弁にする" },
    FillPetal: { value: true, type: "boolean", label: "FillPetal/花弁を塗りつぶす" },

    SubCurlCount: { value: 2, type: "number", min: 0, max: 24, step: 1, label: "SubCurlCount/小さな渦の数", category: "SubCurl/枝に付く小さな渦" },
    SubCurlScale: { value: 0.45, type: "number", min: 0.1, max: 0.9, step: 0.01, label: "SubCurlScale/渦の大きさ比率", category: "SubCurl/枝に付く小さな渦" },
    SubCurlAngle: { value: 45, type: "number", min: -90, max: 90, step: 1, label: "SubCurlAngle/渦の角度", category: "SubCurl/枝に付く小さな渦" },

    CenterSize: { value: 0, type: "number", min: 0, max: 150, step: 1, label: "CenterSize/中心の飾りサイズ", category: "Center/中心" },

    Stroke: { value: "#ffffff", type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 2, type: "number", min: 0, max: 10, step: 0.5, label: "StrokeWidth/線幅", category: "Color/色" },
    StrokeAlpha: { value: 1, type: "number", min: 0, max: 1, step: 0.01, label: "StrokeAlpha/線の透明度", category: "Color/色" },
    Fill: { value: "#ff6fae", type: "color", label: "Fill/塗り", category: "Color/色" },
    FillAlpha: { value: 0.6, type: "number", min: 0, max: 1, step: 0.01, label: "FillAlpha/塗りの透明度", category: "Color/色" },
    Background: { value: "#101018", type: "color", label: "Background/背景", category: "Color/色" },

    RainbowByIndex: { value: true, type: "boolean", label: "RainbowByIndex/枝ごとに色相を変える", category: "RandomColor/枝ごとの色" },
    HueStart: { value: 300, type: "number", min: 0, max: 360, step: 1, label: "HueStart/開始色相", category: "RandomColor/枝ごとの色" },
    HueEnd: { value: 20, type: "number", min: 0, max: 360, step: 1, label: "HueEnd/終了色相", category: "RandomColor/枝ごとの色" },
    Saturation: { value: 80, type: "number", min: 0, max: 100, step: 1, label: "Saturation/彩度", category: "RandomColor/枝ごとの色" },
    Lightness: { value: 65, type: "number", min: 0, max: 100, step: 1, label: "Lightness/明度", category: "RandomColor/枝ごとの色" }
};

export const setupP5 = (p, params, container) => {
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

    // 中心(0,0)から(0,-length)へ伸びる1本のベジエ曲線を描く。
    // mirrorがtrueなら反対側にも同じ曲線を鏡写しし、fillPetalがtrueなら閉じた花弁として塗りつぶす。
    const drawCurl = (g, opts) => {
        const { length, curviness, cr1, cr2, symmetric, mirror, fillPetal, strokeSet, fillSet } = opts;

        const c1x = curviness;
        const c1y = -length * cr1;
        const c2x = symmetric ? curviness : -curviness;
        const c2y = -length * cr2;
        const tipX = 0;
        const tipY = -length;

        if (strokeSet) {
            g.strokeWeight(strokeSet.weight);
            g.stroke(strokeSet.h, strokeSet.s, strokeSet.l, strokeSet.a);
        } else {
            g.noStroke();
        }

        if (mirror && fillPetal) {
            g.fill(fillSet.h, fillSet.s, fillSet.l, fillSet.a);
            g.beginShape();
            g.vertex(0, 0);
            g.bezierVertex(c1x, c1y, c2x, c2y, tipX, tipY);
            g.bezierVertex(-c2x, c2y, -c1x, c1y, 0, 0);
            g.endShape(g.CLOSE);
        } else if (mirror) {
            g.noFill();
            g.beginShape();
            g.vertex(0, 0);
            g.bezierVertex(c1x, c1y, c2x, c2y, tipX, tipY);
            g.endShape();
            g.beginShape();
            g.vertex(0, 0);
            g.bezierVertex(-c1x, c1y, -c2x, c2y, tipX, tipY);
            g.endShape();
        } else {
            g.noFill();
            g.beginShape();
            g.vertex(0, 0);
            g.bezierVertex(c1x, c1y, c2x, c2y, tipX, tipY);
            g.endShape();
        }

        return { c1x, c1y, c2x, c2y, tipX, tipY };
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.colorMode(p.HSL);
        g.strokeCap(g.ROUND);

        const solidStroke = g.color(currentParams.Stroke);
        const solidStrokeHSL = { h: g.hue(solidStroke), s: g.saturation(solidStroke), l: g.lightness(solidStroke) };
        const solidFill = g.color(currentParams.Fill);
        const solidFillHSL = { h: g.hue(solidFill), s: g.saturation(solidFill), l: g.lightness(solidFill) };

        const branchCount = currentParams.BranchCount;
        const length = currentParams.Length;
        const curviness = currentParams.Curviness;
        const cr1 = currentParams.ControlRatio1;
        const cr2 = currentParams.ControlRatio2;
        const symmetric = currentParams.CurveSymmetry;
        const mirror = currentParams.Mirror;
        const fillPetal = currentParams.FillPetal;

        const subCurlCount = currentParams.SubCurlCount;
        const subCurlScale = currentParams.SubCurlScale;
        const subCurlAngle = currentParams.SubCurlAngle;

        g.push();
        g.translate(g.width / 2, g.height / 2);
        g.rotate(g.radians(currentParams.Rotation));

        // 中心の飾り: 花弁と同じ曲線をBranchCount個、縮小して中心に重ねる
        if (currentParams.CenterSize > 0) {
            const centerScale = currentParams.CenterSize / length;
            for (let i = 0; i < branchCount; i++) {
                g.push();
                g.rotate((i / branchCount) * g.TWO_PI);
                g.scale(centerScale);
                drawCurl(g, {
                    length, curviness, cr1, cr2, symmetric,
                    mirror: true, fillPetal,
                    strokeSet: { weight: currentParams.StrokeWidth / centerScale, ...solidStrokeHSL, a: currentParams.StrokeAlpha },
                    fillSet: { ...solidFillHSL, a: currentParams.FillAlpha }
                });
                g.pop();
            }
        }

        for (let i = 0; i < branchCount; i++) {
            let h = solidFillHSL.h, s = solidFillHSL.s, l = solidFillHSL.l;
            let strokeH = solidStrokeHSL.h, strokeS = solidStrokeHSL.s, strokeL = solidStrokeHSL.l;
            if (currentParams.RainbowByIndex) {
                h = g.map(i, 0, Math.max(1, branchCount - 1), currentParams.HueStart, currentParams.HueEnd);
                s = currentParams.Saturation;
                l = currentParams.Lightness;
                strokeH = h; strokeS = s; strokeL = Math.min(100, l + 20);
            }

            g.push();
            g.rotate((i / branchCount) * g.TWO_PI);

            const strokeSet = { weight: currentParams.StrokeWidth, h: strokeH, s: strokeS, l: strokeL, a: currentParams.StrokeAlpha };
            const fillSet = { h, s, l, a: currentParams.FillAlpha };

            const curve = drawCurl(g, { length, curviness, cr1, cr2, symmetric, mirror, fillPetal, strokeSet, fillSet });

            // 主枝の曲線上にSubCurl個の小さな渦を、接線方向に沿って左右対で生やす
            if (subCurlCount > 0) {
                for (let j = 1; j <= subCurlCount; j++) {
                    const t = (j / (subCurlCount + 1)) * 0.85 + 0.1; // 中心寄り0.1〜先端寄り0.95の範囲に均等配置
                    const px = g.bezierPoint(0, curve.c1x, curve.c2x, curve.tipX, t);
                    const py = g.bezierPoint(0, curve.c1y, curve.c2y, curve.tipY, t);
                    const tx = g.bezierTangent(0, curve.c1x, curve.c2x, curve.tipX, t);
                    const ty = g.bezierTangent(0, curve.c1y, curve.c2y, curve.tipY, t);
                    const tangentAngle = Math.atan2(ty, tx) + g.HALF_PI;

                    [1, -1].forEach((sign) => {
                        g.push();
                        g.translate(px, py);
                        g.rotate(tangentAngle + g.radians(subCurlAngle * sign));
                        g.scale(subCurlScale);
                        drawCurl(g, {
                            length, curviness, cr1, cr2, symmetric,
                            mirror: true, fillPetal,
                            strokeSet: { weight: strokeSet.weight / subCurlScale, h: strokeH, s: strokeS, l: strokeL, a: currentParams.StrokeAlpha },
                            fillSet: { h, s, l, a: currentParams.FillAlpha }
                        });
                        g.pop();
                    });
                }
            }

            g.pop();
        }

        g.pop();
    };

    p.draw = function () {
        drawArt(p, params);
    };

    p.updateParams = (newParams) => {
        Object.assign(params, newParams);
        p.redraw();
    };

    p.exportSVG = () => {
        const svgGraphics = p.createGraphics(CANVAS_SIZE, CANVAS_SIZE, p.SVG);
        drawArt(svgGraphics, params);
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
