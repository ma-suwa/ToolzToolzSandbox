import { getFormattedDateTime } from "../../shared/datetime.js";

// E.220のような「空・山・太陽」の風景紋章。
// 空(円)の上に、山(2つの円の重なりで作る丘の稜線)を重ね、
// 最後に太陽(円)を重ねるだけの、円の重なりだけで作る風景バッジ。

const CANVAS_SIZE = 600;

export const defaultParams = {
    HorizonY: { value: 40, type: "number", min: -200, max: 200, step: 1, label: "HorizonY/水平線の位置" },
    HillRadius: { value: 220, type: "number", min: 60, max: 320, step: 1, label: "HillRadius/山の丸みの半径" },
    HillSpread: { value: 160, type: "number", min: 0, max: 260, step: 1, label: "HillSpread/山の間隔" },
    SunSize: { value: 70, type: "number", min: 10, max: 160, step: 1, label: "SunSize/太陽の大きさ" },
    SunOffsetY: { value: -70, type: "number", min: -200, max: 100, step: 1, label: "SunOffsetY/太陽の高さ" },

    RingWidth: { value: 26, type: "number", min: 0, max: 80, step: 1, label: "RingWidth/外周リングの太さ", category: "Ring/外周リング" },

    SkyColor: { value: "#3f6fe0", type: "color", label: "SkyColor/空の色", category: "Color/色" },
    HillColor: { value: "#1f5c3a", type: "color", label: "HillColor/山の色", category: "Color/色" },
    SunColor: { value: "#e8352b", type: "color", label: "SunColor/太陽の色", category: "Color/色" },
    RingColor: { value: "#d8c93f", type: "color", label: "RingColor/外周リングの色", category: "Color/色" },
    Background: { value: "#e9e7e2", type: "color", label: "Background/背景", category: "Color/色" }
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

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.noStroke();

        const cx = g.width / 2;
        const cy = g.height / 2;
        const badgeRadius = 280;

        g.push();
        g.translate(cx, cy);

        // 空(バッジ全体を塗りつぶす円)
        g.fill(currentParams.SkyColor);
        g.ellipse(0, 0, badgeRadius * 2, badgeRadius * 2);

        // 山(2つの円の重なりで丘の稜線を作る)。地平線より下を大きめの四角で覆うことで、
        // 「空はそのまま丸のシルエット、山から下は山の色」という風景を表現する。
        // 四角形は外周ストロークでマスクされるため、円の外にはみ出しても問題ない。
        g.fill(currentParams.HillColor);
        const hillR = currentParams.HillRadius;
        const spread = currentParams.HillSpread;
        const horizonY = currentParams.HorizonY;
        g.ellipse(-spread, horizonY + hillR * 0.55, hillR * 2, hillR * 2);
        g.ellipse(spread, horizonY + hillR * 0.55, hillR * 2, hillR * 2);
        g.rect(-badgeRadius * 1.1, horizonY + hillR * 0.55, badgeRadius * 2.2, badgeRadius * 1.5);

        // 太陽
        g.fill(currentParams.SunColor);
        g.ellipse(0, currentParams.SunOffsetY, currentParams.SunSize * 2, currentParams.SunSize * 2);

        // 外周リング(太いストロークとして最後に重ね、はみ出しをきれいにマスクする)
        if (currentParams.RingWidth > 0) {
            g.noFill();
            g.stroke(currentParams.RingColor);
            g.strokeWeight(currentParams.RingWidth);
            const ringDiameter = (badgeRadius - currentParams.RingWidth / 2) * 2;
            g.ellipse(0, 0, ringDiameter, ringDiameter);
            g.noStroke();
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
