// グラデーション系ツール共通のカラー補間ヘルパー

// colors(hex文字列の配列)をtの位置(0-1)で線形補間したCSSカラー文字列を返す
export function multiLerpColor(g, colors, t) {
    const n = colors.length - 1;
    if (n <= 0) {
        return colors[0];
    }
    const clamped = Math.min(Math.max(t, 0), 1);
    const scaled = clamped * n;
    const i = Math.min(Math.floor(scaled), n - 1);
    const localT = scaled - i;
    return g.lerpColor(g.color(colors[i]), g.color(colors[i + 1]), localT).toString();
}

// 0-1の値をcycles回だけ0→1→0と往復させる(繰り返しグラデーション用の三角波)
export function triangleWave(t, cycles = 1) {
    const x = ((t * cycles) % 1 + 1) % 1;
    return x < 0.5 ? x * 2 : (1 - x) * 2;
}

// 原点中心・幅w×高さhの範囲に、style("linear"=帯状 / "radial"=同心楕円)で
// グラデーションを敷き詰める共通プリミティブ。呼び出し側で事前にpush/translate/rotate済みであること。
export function drawGradientPrimitive(g, w, h, style, colors, steps) {
    const count = Math.max(2, Math.round(steps));
    if (style === "radial") {
        for (let i = count - 1; i >= 0; i--) {
            const t = i / (count - 1);
            const rw = (w / 2) * (i + 1) / count;
            const rh = (h / 2) * (i + 1) / count;
            g.fill(multiLerpColor(g, colors, t));
            g.ellipse(0, 0, rw * 2, rh * 2);
        }
    } else {
        const bandH = h / count;
        for (let k = 0; k < count; k++) {
            const t = k / (count - 1);
            g.fill(multiLerpColor(g, colors, t));
            g.rect(-w / 2, -h / 2 + k * bandH, w, bandH + 1);
        }
    }
}
