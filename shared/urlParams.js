// URLクエリパラメータ ⇔ パラメータオブジェクトの相互変換(Next.jsのrouter依存を排除したバニラ版)

export function getParamsFromUrl(defaultParams) {
    const searchParams = new URLSearchParams(window.location.search);
    const params = {};
    Object.keys(defaultParams).forEach((key) => {
        const setting = defaultParams[key];
        const value = searchParams.get(key);
        if (value === null) {
            params[key] = setting.value;
            return;
        }
        if (setting.type === "number") {
            const parsed = parseFloat(value);
            params[key] = isNaN(parsed) ? setting.value : parsed;
        } else if (setting.type === "boolean") {
            params[key] = value === "true";
        } else if (setting.type === "color") {
            params[key] = value;
        } else {
            try {
                params[key] = JSON.parse(value);
            } catch (e) {
                params[key] = value;
            }
        }
    });
    return params;
}

export function writeParamsToUrl(params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            query.set(key, JSON.stringify(value));
        } else if (typeof value === 'number') {
            query.set(key, parseFloat(value.toFixed(3)));
        } else {
            query.set(key, value);
        }
    });
    history.replaceState(null, "", `?${query.toString()}`);
}

// ドラッグ操作中はURL更新を保留し、離した瞬間にまとめて反映するデバウンサー
export function createUrlUpdater(params, paneElement) {
    let debounceTimer = null;
    let isInteracting = false;
    let hasPendingChanges = false;

    const flush = () => {
        writeParamsToUrl(params);
        hasPendingChanges = false;
    };

    const updateUrl = () => {
        hasPendingChanges = true;
        if (isInteracting) {
            if (debounceTimer) clearTimeout(debounceTimer);
            return;
        }
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(flush, 300);
    };

    const handleStart = () => {
        isInteracting = true;
        if (debounceTimer) clearTimeout(debounceTimer);
    };

    const handleEnd = () => {
        isInteracting = false;
        if (hasPendingChanges) flush();
    };

    paneElement.addEventListener('mousedown', handleStart);
    paneElement.addEventListener('touchstart', handleStart);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return updateUrl;
}
