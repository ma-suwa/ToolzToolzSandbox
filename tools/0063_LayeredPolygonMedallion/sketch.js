import { getFormattedDateTime } from "../../shared/datetime.js";

// 大きさ・回転角・色の異なる正多角形を3枚重ねて、
// 同心円状のメダリオン(E.217/E.219のような層構造の紋章)を作る。

const CANVAS_SIZE = 600;

export const defaultParams = {
    Layer1Sides: { value: 4, type: "number", min: 3, max: 12, step: 1, label: "Layer1Sides/1層目の角数", category: "Layer1/外側の層" },
    Layer1Size: { value: 250, type: "number", min: 40, max: 280, step: 1, label: "Layer1Size/1層目の大きさ", category: "Layer1/外側の層" },
    Layer1Rotation: { value: 45, type: "number", min: 0, max: 90, step: 1, label: "Layer1Rotation/1層目の回転", category: "Layer1/外側の層" },

    Layer2Sides: { value: 8, type: "number", min: 3, max: 12, step: 1, label: "Layer2Sides/2層目の角数", category: "Layer2/中間の層" },
    Layer2Size: { value: 190, type: "number", min: 30, max: 260, step: 1, label: "Layer2Size/2層目の大きさ", category: "Layer2/中間の層" },
    Layer2Rotation: { value: 0, type: "number", min: 0, max: 90, step: 1, label: "Layer2Rotation/2層目の回転", category: "Layer2/中間の層" },

    Layer3Sides: { value: 4, type: "number", min: 3, max: 12, step: 1, label: "Layer3Sides/3層目の角数", category: "Layer3/内側の層" },
    Layer3Size: { value: 130, type: "number", min: 20, max: 220, step: 1, label: "Layer3Size/3層目の大きさ", category: "Layer3/内側の層" },
    Layer3Rotation: { value: 45, type: "number", min: 0, max: 90, step: 1, label: "Layer3Rotation/3層目の回転", category: "Layer3/内側の層" },

    CenterSides: { value: 4, type: "number", min: 0, max: 12, step: 1, label: "CenterSides/中心飾りの角数(0=非表示,1=円)", category: "Center/中心飾り" },
    CenterSize: { value: 14, type: "number", min: 2, max: 60, step: 1, label: "CenterSize/中心飾りの大きさ", category: "Center/中心飾り" },
    ShowCrosshair: { value: true, type: "boolean", label: "ShowCrosshair/十字線を表示", category: "Center/中心飾り" },
    CrosshairWidth: { value: 2, type: "number", min: 0.5, max: 6, step: 0.5, label: "CrosshairWidth/十字線の太さ", category: "Center/中心飾り" },

    Layer1Color: { value: "#f2b9ae", type: "color", label: "Layer1Color/1層目の色", category: "Color/色" },
    Layer2Color: { value: "#c9a876", type: "color", label: "Layer2Color/2層目の色", category: "Color/色" },
    Layer3Color: { value: "#1f5c3a", type: "color", label: "Layer3Color/3層目の色", category: "Color/色" },
    CenterColor: { value: "#111111", type: "color", label: "CenterColor/中心飾り・十字線の色", category: "Color/色" },
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

        g.push();
        g.translate(cx, cy);

        g.fill(currentParams.Layer1Color);
        drawPolygon(g, currentParams.Layer1Sides, currentParams.Layer1Size, currentParams.Layer1Rotation);

        g.fill(currentParams.Layer2Color);
        drawPolygon(g, currentParams.Layer2Sides, currentParams.Layer2Size, currentParams.Layer2Rotation);

        g.fill(currentParams.Layer3Color);
        drawPolygon(g, currentParams.Layer3Sides, currentParams.Layer3Size, currentParams.Layer3Rotation);

        if (currentParams.ShowCrosshair) {
            g.stroke(currentParams.CenterColor);
            g.strokeWeight(currentParams.CrosshairWidth);
            const len = currentParams.Layer3Size;
            g.line(-len, 0, len, 0);
            g.line(0, -len, 0, len);
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
