// defaultParams定義からTweakPaneのバインディングを自動生成する(Next.js版 app/libs/createTweakPane.js のバニラ移植)
export function createTweakPane(defaultParams, pane, param, updateUrl, p5Instance) {
    const folders = {};
    const bindings = {};

    Object.keys(defaultParams).forEach((key) => {
        const setting = defaultParams[key];

        if (!setting || setting.type === undefined) {
            console.warn(`Skipping invalid parameter setting for key: ${key}`, setting);
            return;
        }

        const categoryTitle = setting.category || "General";

        if (!folders[categoryTitle]) {
            folders[categoryTitle] = pane.addFolder({ title: categoryTitle, expanded: true });
        }

        const options = {
            label: setting.label || key,
        };

        if (setting.type === "number") {
            options.step = setting.step;
            options.min = setting.min;
            options.max = setting.max;
        }

        const binding = folders[categoryTitle].addBinding(param, key, options);
        bindings[key] = binding;

        binding.on("change", (ev) => {
            let valueToSet = ev.value;

            if (setting.type === "number") {
                const parsedValue = Number(ev.value);
                valueToSet = isNaN(parsedValue) ? defaultParams[key].value : parsedValue;
            } else if (setting.type === "boolean") {
                valueToSet = Boolean(ev.value);
            } else if (setting.type === "color") {
                valueToSet = ev.value;
            }

            param[key] = valueToSet;

            updateUrl();
            if (p5Instance && typeof p5Instance.updateParams === 'function') {
                p5Instance.updateParams({ ...param });
            }
        });
    });

    const resetFolder = pane.addFolder({ title: "Reset", expanded: true });
    resetFolder.addButton({ title: "Reset Parameters" }).on("click", () => {
        Object.keys(defaultParams).forEach((key) => {
            if (defaultParams[key] && defaultParams[key].value !== undefined) {
                param[key] = defaultParams[key].value;
                if (bindings[key]) {
                    bindings[key].value = defaultParams[key].value;
                }
            }
        });
        updateUrl();
        if (p5Instance && typeof p5Instance.updateParams === 'function') {
            p5Instance.updateParams({ ...param });
        }
    });

    return bindings;
}
