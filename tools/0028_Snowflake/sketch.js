import { getFormattedDateTime } from "../../shared/datetime.js";

const CANVAS_SIZE = 600;

export const defaultParams = {
    Size: { value: 200, type: "number", min: 10, max: 300, step: 1, label: "Size/サイズ" },
    MainBranchLength: { value: 80, type: "number", min: 0, max: 200, step: 1, label: "MainBranchLength/主枝の長さ" },
    SubBranchCount: { value: 3, type: "number", min: 0, max: 5, step: 1, label: "SubBranchCount/細かい枝の数" },
    SubBranchLength: { value: 30, type: "number", min: 0, max: 100, step: 1, label: "SubBranchLength/細かい枝の長さ" },
    SubBranchAngle: { value: 60, type: "number", min: -90, max: 90, step: 1, label: "SubBranchAngle/細かい枝の角度" },
    CenterShapeHexagon: { value: false, type: "boolean", label: "CenterShapeHexagon/中心の形状: 六角形", category: "Center/中心" },
    CenterSize: { value: 10, type: "number", min: 0, max: 300, step: 1, label: "CenterSize/中心のサイズ", category: "Center/中心" },
    CenterOffset: { value: 10, type: "number", min: 0, max: 300, step: 1, label: "CenterOffset/中心のオフセット", category: "Center/中心" },
    SubBranchPatternEven: { value: true, type: "boolean", label: "SubBranchPatternEven/細かい枝のパターン: 均等", category: "SubBranch/細かい枝" },
    SubBranchPatternTip: { value: false, type: "boolean", label: "SubBranchPatternTip/細かい枝のパターン: 先端寄り", category: "SubBranch/細かい枝" },
    SubBranchPatternCenter: { value: false, type: "boolean", label: "SubBranchPatternCenter/細かい枝のパターン: 中心寄り", category: "SubBranch/細かい枝" },
    SubBranchLengthVariation: { value: 0, type: "number", min: -3, max: 3, step: 0.1, label: "SubBranchLengthVariation/細かい枝の長さのバリエーション", category: "SubBranch/細かい枝" },
    Background: { value: "#08275c", type: "color", label: "Background/背景", category: "Color/色" },
    Stroke: { value: "#FFFFFF", type: "color", label: "Stroke/線", category: "Color/色" },
    StrokeWidth: { value: 5, type: "number", min: 0, max: 10, step: 0.1, label: "StrokeWidth/線幅", category: "Color/色" }
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

        const size = Number(currentParams.Size) || 100;
        const branchCount = 6; // 6で固定
        const mainBranchLength = Number(currentParams.MainBranchLength) || 80;
        const subBranchCount = Number(currentParams.SubBranchCount) || 3;
        const subBranchLength = Number(currentParams.SubBranchLength) || 30;
        const subBranchAngle = Number(currentParams.SubBranchAngle) || 45;

        const centerShapeHexagon = currentParams.CenterShapeHexagon === true ||
                                   currentParams.CenterShapeHexagon === "true" ||
                                   currentParams.CenterShapeHexagon === 1;

        const centerSize = Number(currentParams.CenterSize) || 10;
        const centerOffset = currentParams.CenterOffset !== undefined ? Number(currentParams.CenterOffset) : 10;

        let subBranchPattern = "even";
        const patternTip = currentParams.SubBranchPatternTip === true || currentParams.SubBranchPatternTip === "true";
        const patternCenter = currentParams.SubBranchPatternCenter === true || currentParams.SubBranchPatternCenter === "true";
        if (patternTip) {
            subBranchPattern = "tip";
        } else if (patternCenter) {
            subBranchPattern = "center";
        }

        const subBranchLengthVariation = Number(currentParams.SubBranchLengthVariation) || 0;

        const centerX = g.width / 2;
        const centerY = g.height / 2;

        const strokeWidth = Number(currentParams.StrokeWidth) || 1;
        const strokeColor = currentParams.Stroke || '#ffffff';

        const drawCenterShape = (g, centerSizeParam, strokeWidth, strokeColorParam, offsetParam) => {
            if (centerSizeParam <= 0) return;

            const angleStep = 60;
            const offset = offsetParam;

            for (let rotation = 0; rotation < 6; rotation++) {
                g.push();
                g.rotate(g.radians(rotation * angleStep));
                g.translate(0, offset);

                g.noFill();
                g.strokeWeight(strokeWidth);
                g.stroke(strokeColorParam);

                g.beginShape();
                for (let i = 0; i < 6; i++) {
                    const angle = g.radians(i * angleStep);
                    const radius = centerSizeParam;
                    const x = Math.sin(angle) * radius;
                    const y = -Math.cos(angle) * radius;
                    g.vertex(x, y);
                }
                g.endShape(g.CLOSE);

                g.pop();
            }
        };

        const calculateSubBranchPositions = (g, count, mainLength, pattern, seed) => {
            const positions = [];

            g.randomSeed(seed);

            if (pattern === "even") {
                const spacing = mainLength / (count + 1);
                for (let i = 1; i <= count; i++) {
                    positions.push(-spacing * i);
                }
            } else if (pattern === "tip") {
                const spacing = mainLength / (count + 1);
                for (let i = 1; i <= count; i++) {
                    positions.push(-spacing * i * 1.5);
                }
            } else if (pattern === "center") {
                const spacing = mainLength / (count + 1);
                for (let i = 1; i <= count; i++) {
                    positions.push(-spacing * i * 0.5);
                }
            }

            return positions;
        };

        g.strokeCap(g.SQUARE);

        g.push();
        g.translate(centerX, centerY);
        g.scale(size / 100);

        if (centerShapeHexagon && centerSize > 0) {
            drawCenterShape(g, centerSize, strokeWidth, strokeColor, centerOffset);
        }

        const angleStep = 60;

        for (let i = 0; i < branchCount; i++) {
            g.push();
            g.rotate(g.radians(i * angleStep));

            drawMainBranch(g, mainBranchLength, strokeWidth, strokeColor);

            if (subBranchCount > 0) {
                const positions = calculateSubBranchPositions(g, subBranchCount, mainBranchLength, subBranchPattern, currentSeed + i);

                for (let j = 0; j < positions.length; j++) {
                    const y = positions[j];
                    const positionRatio = Math.abs(y) / mainBranchLength;
                    const lengthMultiplier = 1 + (subBranchLengthVariation * (1 - positionRatio * 2));
                    const adjustedLength = subBranchLength * Math.max(0.1, lengthMultiplier);
                    drawSubBranch(g, y, adjustedLength, subBranchAngle, strokeWidth, strokeColor);
                }
            }

            g.pop();
        }

        g.pop();
    };

    const drawMainBranch = (g, length, strokeWidth, strokeColor) => {
        if (strokeWidth > 0) {
            g.push();
            g.noFill();
            g.strokeWeight(strokeWidth);
            g.stroke(strokeColor);
            g.line(0, 0, 0, -length);
            g.pop();
        }
    };

    const drawSubBranch = (g, y, length, angle, strokeWidth, strokeColor) => {
        g.push();
        g.translate(0, y);
        g.rotate(g.radians(angle));

        if (strokeWidth > 0) {
            g.push();
            g.noFill();
            g.strokeWeight(strokeWidth);
            g.stroke(strokeColor);
            g.line(0, 0, 0, -length);
            g.pop();
        }

        g.pop();

        g.push();
        g.translate(0, y);
        g.rotate(g.radians(-angle));

        if (strokeWidth > 0) {
            g.push();
            g.noFill();
            g.strokeWeight(strokeWidth);
            g.stroke(strokeColor);
            g.line(0, 0, 0, -length);
            g.pop();
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
