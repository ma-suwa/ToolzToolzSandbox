import { getFormattedDateTime } from "../../shared/datetime.js";

// 0060_PetalUnionBadgeの花弁融合の上に、回転させた多角形(ダイヤ型)を
// 重ねて中心部だけ覆うことで、E.214のように花弁の先端だけが
// 別の色で覗く「四分割に見える紋章」を作る(実際のブーリアン演算はしない)。

const CANVAS_SIZE = 600;

export const defaultParams = {
    PetalCount: { value: 4, type: "number", min: 3, max: 12, step: 1, label: "PetalCount/花弁の数" },
    PetalRadius: { value: 130, type: "number", min: 20, max: 220, step: 1, label: "PetalRadius/花弁1つの半径" },
    OrbitRadius: { value: 90, type: "number", min: 0, max: 200, step: 1, label: "OrbitRadius/花弁中心の配置半径" },

    DiamondSides: { value: 4, type: "number", min: 3, max: 12, step: 1, label: "DiamondSides/覆う多角形の角数", category: "Diamond/覆う多角形" },
    DiamondSize: { value: 175, type: "number", min: 20, max: 260, step: 1, label: "DiamondSize/覆う多角形の大きさ", category: "Diamond/覆う多角形" },
    DiamondRotation: { value: 45, type: "number", min: 0, max: 90, step: 1, label: "DiamondRotation/覆う多角形の回転", category: "Diamond/覆う多角形" },

    ShowCrosshair: { value: true, type: "boolean", label: "ShowCrosshair/十字線を表示", category: "Crosshair/十字線" },
    CrosshairWidth: { value: 2, type: "number", min: 0.5, max: 6, step: 0.5, label: "CrosshairWidth/十字線の太さ", category: "Crosshair/十字線" },

    FlowerColor: { value: "#e8352b", type: "color", label: "FlowerColor/花弁の色", category: "Color/色" },
    DiamondColor: { value: "#c9a876", type: "color", label: "DiamondColor/覆う多角形の色", category: "Color/色" },
    BackgroundDisc: { value: "#d8c93f", type: "color", label: "BackgroundDisc/バッジの地色", category: "Color/色" },
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

    const drawPolygon = (g, sides, radius, rotationDeg) => {
        const rotation = g.radians(rotationDeg);
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

        g.fill(currentParams.BackgroundDisc);
        g.ellipse(0, 0, badgeRadius * 2, badgeRadius * 2);

        // 花弁の融合(この上にダイヤを重ねて先端だけを覗かせる)
        g.fill(currentParams.FlowerColor);
        const count = currentParams.PetalCount;
        const orbit = currentParams.OrbitRadius;
        const petalR = currentParams.PetalRadius;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * g.TWO_PI;
            const x = Math.cos(a) * orbit;
            const y = Math.sin(a) * orbit;
            g.ellipse(x, y, petalR * 2, petalR * 2);
        }

        // 覆う多角形(花弁の中心部だけを隠し、先端を色として残す)
        g.fill(currentParams.DiamondColor);
        drawPolygon(g, currentParams.DiamondSides, currentParams.DiamondSize, currentParams.DiamondRotation);

        if (currentParams.ShowCrosshair) {
            g.stroke(currentParams.FlowerColor);
            g.strokeWeight(currentParams.CrosshairWidth);
            const angle = g.radians(currentParams.DiamondRotation);
            const len = badgeRadius * 0.7;
            g.line(-Math.cos(angle) * len, -Math.sin(angle) * len, Math.cos(angle) * len, Math.sin(angle) * len);
            g.line(-Math.cos(angle + g.HALF_PI) * len, -Math.sin(angle + g.HALF_PI) * len, Math.cos(angle + g.HALF_PI) * len, Math.sin(angle + g.HALF_PI) * len);
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
