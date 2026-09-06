import { getFormattedDateTime } from "../../shared/datetime.js";

// "Humble Beings"(Sunjin Kim)風の紋章バッジ。
// 同じ不透明色の円をP個、中心の周りに等間隔で重ねて描くと、
// 実際にブーリアン演算をしなくても1つの融合した花/クローバー形に見える。
// これがこのシリーズ共通のコア技法。

const CANVAS_SIZE = 600;

export const defaultParams = {
    PetalCount: { value: 4, type: "number", min: 2, max: 16, step: 1, label: "PetalCount/花弁の数" },
    PetalRadius: { value: 130, type: "number", min: 20, max: 260, step: 1, label: "PetalRadius/花弁1つの半径" },
    OrbitRadius: { value: 90, type: "number", min: 0, max: 220, step: 1, label: "OrbitRadius/花弁中心の配置半径" },
    StartAngle: { value: 0, type: "number", min: 0, max: 360, step: 1, label: "StartAngle/開始角度" },

    ShowCrosshair: { value: true, type: "boolean", label: "ShowCrosshair/十字線を表示", category: "Crosshair/十字線" },
    CrosshairAngle: { value: 45, type: "number", min: 0, max: 90, step: 1, label: "CrosshairAngle/線の角度", category: "Crosshair/十字線" },
    CrosshairWidth: { value: 2, type: "number", min: 0.5, max: 8, step: 0.5, label: "CrosshairWidth/線の太さ", category: "Crosshair/十字線" },

    CenterSides: { value: 0, type: "number", min: 0, max: 12, step: 1, label: "CenterSides/中心飾りの角数(0=非表示,1=円)", category: "Center/中心飾り" },
    CenterSize: { value: 18, type: "number", min: 2, max: 60, step: 1, label: "CenterSize/中心飾りの大きさ", category: "Center/中心飾り" },

    PetalColor: { value: "#111111", type: "color", label: "PetalColor/花弁の色", category: "Color/色" },
    BackgroundDisc: { value: "#d8c93f", type: "color", label: "BackgroundDisc/バッジの地色", category: "Color/色" },
    CrosshairColor: { value: "#d8c93f", type: "color", label: "CrosshairColor/十字線の色", category: "Color/色" },
    CenterColor: { value: "#d8c93f", type: "color", label: "CenterColor/中心飾りの色", category: "Color/色" },
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

    // 中心が原点の正多角形(sides<3は円として扱う)
    const drawPolygon = (g, sides, radius, rotation) => {
        if (sides < 3) {
            g.ellipse(0, 0, radius * 2, radius * 2);
            return;
        }
        g.beginShape();
        for (let i = 0; i < sides; i++) {
            const a = rotation + (i / sides) * g.TWO_PI;
            g.vertex(Math.cos(a) * radius, Math.sin(a) * radius);
        }
        g.endShape(g.CLOSE);
    };

    const drawArt = (g, currentParams) => {
        g.background(currentParams.Background);
        g.noStroke();

        const cx = g.width / 2;
        const cy = g.height / 2;
        const badgeRadius = 280;

        g.push();
        g.translate(cx, cy);

        // バッジの地色(外側の円)
        g.fill(currentParams.BackgroundDisc);
        g.ellipse(0, 0, badgeRadius * 2, badgeRadius * 2);

        // 花弁の融合(同色の円を重ねるだけで1つの塊に見える)
        g.fill(currentParams.PetalColor);
        const count = currentParams.PetalCount;
        const orbit = currentParams.OrbitRadius;
        const petalR = currentParams.PetalRadius;
        const startAngle = g.radians(currentParams.StartAngle);
        for (let i = 0; i < count; i++) {
            const a = startAngle + (i / count) * g.TWO_PI;
            const x = Math.cos(a) * orbit;
            const y = Math.sin(a) * orbit;
            g.ellipse(x, y, petalR * 2, petalR * 2);
        }

        if (currentParams.ShowCrosshair) {
            g.stroke(currentParams.CrosshairColor);
            g.strokeWeight(currentParams.CrosshairWidth);
            const angle = g.radians(currentParams.CrosshairAngle);
            const len = badgeRadius * 0.85;
            g.line(-Math.cos(angle) * len, -Math.sin(angle) * len, Math.cos(angle) * len, Math.sin(angle) * len);
            g.line(-Math.cos(angle + g.HALF_PI) * len, -Math.sin(angle + g.HALF_PI) * len, Math.cos(angle + g.HALF_PI) * len, Math.sin(angle + g.HALF_PI) * len);
            g.noStroke();
        }

        if (currentParams.CenterSides > 0) {
            g.fill(currentParams.CenterColor);
            drawPolygon(g, currentParams.CenterSides, currentParams.CenterSize, 0);
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
