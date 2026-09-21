// 複数シェイプを「一定のルール」で配置・バリエーションさせるための共通ヘルパー

// 黄金角(約137.5度)によるフィロタキシス(ひまわりの種)配置。
// count個の点を中心から均等な密度で螺旋状に並べる決定的なルール。
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function phyllotaxisPoints(count, maxRadius, centerX, centerY) {
    const points = [];
    const n = Math.max(count, 1);
    for (let i = 0; i < n; i++) {
        const t = n <= 1 ? 0 : i / (n - 1);
        const radius = Math.sqrt(i / Math.max(n - 1, 1)) * maxRadius;
        const angle = i * GOLDEN_ANGLE;
        points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            t,
            index: i,
            angle
        });
    }
    return points;
}

// インデックスから0-1の疑似乱数を返す純粋関数(シード管理不要で常に同じ結果になる)
export function hash01(n) {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453123;
    return x - Math.floor(x);
}

// hash01をmin-maxの範囲にマッピングする
export function hashRange(n, min, max) {
    return min + hash01(n) * (max - min);
}

// インデックスに応じて色配列を回転+反転させ、シェイプごとに色の並び順を変える
// (同じ配色でも「どの色から始まりどの色で終わるか」がシェイプ間で変化する)
export function shuffleColors(colors, index) {
    const n = colors.length;
    if (n <= 1) return colors;
    const offset = Math.floor(hash01(index * 3.17 + 11) * n);
    const rotated = colors.map((_, i) => colors[(i + offset) % n]);
    return hash01(index * 5.73 + 29) < 0.5 ? rotated.slice().reverse() : rotated;
}

// インデックスに応じて "linear"(線状) か "radial"(放射状) をランダムに選ぶ
export function pickGradientStyle(index) {
    return hash01(index * 9.41 + 47) < 0.5 ? "linear" : "radial";
}
