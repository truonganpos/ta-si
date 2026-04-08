(function () {
    var scriptStatus = window.__webNewScriptStatus = window.__webNewScriptStatus || {};
    var bundleStatus = window.__webNewBundleStatus = window.__webNewBundleStatus || {};
    var scriptPromises = window.__webNewScriptPromises = window.__webNewScriptPromises || {};
    var bundlePromises = window.__webNewBundlePromises = window.__webNewBundlePromises || {};
    var preloadState = window.__webNewPreloadState = window.__webNewPreloadState || {
        started: false,
        completed: false,
        promise: null
    };
    var currentScript = document.currentScript;
    var currentSrc = currentScript && currentScript.src ? String(currentScript.src) : "";
    var queryIndex = currentSrc.indexOf("?");
    var hashIndex = currentSrc.indexOf("#");
    var cutIndex = currentSrc.length;
    var loadQueue = window.__webNewLoadQueuePromise || Promise.resolve();

    if (queryIndex >= 0) cutIndex = Math.min(cutIndex, queryIndex);
    if (hashIndex >= 0) cutIndex = Math.min(cutIndex, hashIndex);

    var cleanSrc = currentSrc.slice(0, cutIndex);
    var baseUrl = cleanSrc.replace(/\/[^\/]+$/, "");
    var suffix = "";
    var assetVersion = String(window.WEB_NEW_ASSET_VERSION || "").trim();

    if (queryIndex >= 0) {
        var hashCut = hashIndex >= 0 ? hashIndex : currentSrc.length;
        suffix = currentSrc.slice(queryIndex, hashCut);
    } else if (assetVersion) {
        suffix = "?v=" + encodeURIComponent(assetVersion);
    }

    if (!baseUrl) return;

    window.WEB_NEW_ASSET_BASE_URL = window.WEB_NEW_ASSET_BASE_URL || baseUrl;

    var scriptRegistry = {
        firebase: { key: "firebase", file: "firebase.js" },
        "ui-pc": { key: "ui-pc", file: "ui-pc.js" },
        "auth-product-gate": { key: "auth-product-gate", file: "auth-product-gate.js", optional: true },
        "app-core-foundation": { key: "app-core-foundation", file: "app-core-foundation.js" },
        "app-core-runtime": { key: "app-core-runtime", file: "app-core-runtime.js" },
        "app-core-ui": { key: "app-core-ui", file: "app-core-ui.js" },
        "cart-logic": { key: "cart-logic", file: "cart-logic.js" },
        "category-menu-feature": { key: "category-menu-feature", file: "category-menu.feature.js" },
        "home-tab-feature": { key: "home-tab-feature", file: "home-tab.feature.js" },
        "products-tab-feature": { key: "products-tab-feature", file: "products-tab.feature.js" },
        "sale-tab-feature": { key: "sale-tab-feature", file: "sale-tab.feature.js" },
        "account-tab": { key: "account-tab", file: "account-tab.js" },
        "google-auth-runtime-fixes": { key: "google-auth-runtime-fixes", file: "google-auth-runtime-fixes.js" },
        "intro-tab-feature": { key: "intro-tab-feature", file: "intro-tab.feature.js" },
        "intro-experience": { key: "intro-experience", file: "intro-experience.js" }
    };

    var bundleRegistry = {
        core: [
            "firebase",
            "ui-pc",
            "auth-product-gate",
            "app-core-foundation",
            "app-core-runtime",
            "app-core-ui",
            "cart-logic"
        ],
        category: ["category-menu-feature"],
        home: ["category-menu-feature", "home-tab-feature"],
        products: ["category-menu-feature", "products-tab-feature"],
        sale: ["sale-tab-feature"],
        account: ["account-tab", "google-auth-runtime-fixes"],
        intro: ["intro-tab-feature", "intro-experience"]
    };

    var bundleAliasMap = {
        "tab-home": "home",
        "tab-products": "products",
        "tab-sale": "sale",
        "tab-account": "account",
        "tab-intro": "intro",
        "category-menu": "category"
    };

    function uniqueList(values) {
        var seen = {};
        return (Array.isArray(values) ? values : []).reduce(function (list, value) {
            var safeValue = String(value || "").trim();
            if (!safeValue || seen[safeValue]) return list;
            seen[safeValue] = true;
            list.push(safeValue);
            return list;
        }, []);
    }

    function resolveScriptEntry(input) {
        if (!input) return null;
        if (typeof input === "object" && input.key && input.file) return input;
        return scriptRegistry[String(input || "").trim()] || null;
    }

    function buildScriptUrl(fileName) {
        return baseUrl + "/" + String(fileName || "").trim() + suffix;
    }

    function normalizeBundleKey(bundleKey) {
        var safeKey = String(bundleKey || "").trim();
        return bundleAliasMap[safeKey] || safeKey;
    }

    function getInitialBundleKey() {
        var rawTarget = "";
        try {
            var rawHash = String(window.location.hash || "").replace(/^#/, "").trim();
            var firstHashSegment = rawHash ? rawHash.split("/").filter(Boolean)[0] : "";
            rawTarget = firstHashSegment || "";
            if (!rawTarget) {
                var url = new URL(window.location.href);
                rawTarget = String(url.searchParams.get("tab") || "").trim();
            }
        } catch (error) {}

        var normalized = String(rawTarget || "").trim().toLowerCase().replace(/^#/, "").replace(/^tab-/, "");
        if (normalized === "products") return "products";
        if (normalized === "sale") return "sale";
        if (normalized === "account") return "account";
        if (normalized === "intro") return "intro";
        return "home";
    }

    function getSequentialBundleOrder() {
        var initialBundle = normalizeBundleKey(getInitialBundleKey());
        return uniqueList([
            initialBundle,
            "intro",
            "home",
            "products",
            "sale",
            "account"
        ]).filter(function (bundleKey) {
            return bundleKey && bundleKey !== "core" && Array.isArray(bundleRegistry[bundleKey]);
        });
    }

    function enqueue(task) {
        var runPromise = loadQueue.then(task, task);
        loadQueue = runPromise.catch(function () { return null; });
        window.__webNewLoadQueuePromise = loadQueue;
        return runPromise;
    }

    function dispatchBundleReady(bundleKey) {
        try {
            window.dispatchEvent(new CustomEvent("web-new-bundle-ready", { detail: { bundle: bundleKey } }));
        } catch (error) {}
    }

    function pause(ms) {
        return new Promise(function (resolve) {
            window.setTimeout(resolve, Math.max(Number(ms) || 0, 0));
        });
    }

    function ensureScript(entryInput) {
        var entry = resolveScriptEntry(entryInput);
        if (!entry) return Promise.resolve(false);
        if (scriptStatus[entry.key] === "loaded" || scriptStatus[entry.key] === "skipped") {
            return Promise.resolve(scriptStatus[entry.key]);
        }
        if (scriptPromises[entry.key]) return scriptPromises[entry.key];

        scriptPromises[entry.key] = enqueue(function () {
            if (scriptStatus[entry.key] === "loaded" || scriptStatus[entry.key] === "skipped") {
                return scriptStatus[entry.key];
            }

            var scriptUrl = buildScriptUrl(entry.file);

            return new Promise(function (resolve, reject) {
                var existingScript = document.querySelector('script[data-web-new-key="' + entry.key + '"]')
                    || document.querySelector('script[data-web-new-src="' + scriptUrl + '"]');
                var script = existingScript || document.createElement("script");

                function cleanup() {
                    script.removeEventListener("load", handleLoad);
                    script.removeEventListener("error", handleError);
                }

                function handleLoad() {
                    cleanup();
                    scriptStatus[entry.key] = "loaded";
                    script.setAttribute("data-web-new-loaded", "1");
                    resolve("loaded");
                }

                function handleError() {
                    cleanup();
                    if (entry.optional) {
                        scriptStatus[entry.key] = "skipped";
                        console.warn("Bo qua file tuy chon:", scriptUrl);
                        resolve("skipped");
                        return;
                    }
                    scriptStatus[entry.key] = "failed";
                    reject(new Error("Khong tai duoc file: " + scriptUrl));
                }

                if (existingScript && existingScript.getAttribute("data-web-new-loaded") === "1") {
                    scriptStatus[entry.key] = "loaded";
                    resolve("loaded");
                    return;
                }

                scriptStatus[entry.key] = "loading";
                script.addEventListener("load", handleLoad, { once: true });
                script.addEventListener("error", handleError, { once: true });

                if (!existingScript) {
                    script.src = scriptUrl;
                    script.async = false;
                    script.defer = false;
                    script.charset = "UTF-8";
                    script.setAttribute("data-web-new-src", scriptUrl);
                    script.setAttribute("data-web-new-key", entry.key);
                    document.head.appendChild(script);
                }
            }).finally(function () {
                delete scriptPromises[entry.key];
            });
        });

        return scriptPromises[entry.key];
    }

    function ensureBundle(bundleKey) {
        var safeBundleKey = normalizeBundleKey(bundleKey);
        var bundleEntries = bundleRegistry[safeBundleKey];

        if (!safeBundleKey || !bundleEntries || !bundleEntries.length) {
            return Promise.resolve(false);
        }
        if (bundleStatus[safeBundleKey] === "loaded") return Promise.resolve(true);
        if (bundlePromises[safeBundleKey]) return bundlePromises[safeBundleKey];

        bundleStatus[safeBundleKey] = "loading";
        bundlePromises[safeBundleKey] = bundleEntries.reduce(function (promise, scriptKey) {
            return promise.then(function () {
                return ensureScript(scriptKey);
            });
        }, Promise.resolve()).then(function () {
            bundleStatus[safeBundleKey] = "loaded";
            dispatchBundleReady(safeBundleKey);
            return true;
        }).catch(function (error) {
            bundleStatus[safeBundleKey] = "failed";
            console.warn("Khong tai duoc bundle:", safeBundleKey, error);
            throw error;
        }).finally(function () {
            if (bundleStatus[safeBundleKey] !== "loaded") delete bundlePromises[safeBundleKey];
        });

        return bundlePromises[safeBundleKey];
    }

    function ensureBundleForTab(tabId) {
        return ensureBundle(normalizeBundleKey(tabId));
    }

    function preloadBundlesSequentially(options) {
        var settings = options || {};
        var force = !!settings.force;

        if (preloadState.started && !force && preloadState.promise) {
            return preloadState.promise;
        }

        var bundleOrder = uniqueList(settings.sequence || getSequentialBundleOrder());
        preloadState.started = true;
        preloadState.completed = false;
        preloadState.promise = bundleOrder.reduce(function (promise, bundleKey, index) {
            return promise.then(function () {
                var safeBundleKey = normalizeBundleKey(bundleKey);
                if (!safeBundleKey || safeBundleKey === "core" || !bundleRegistry[safeBundleKey]) {
                    return pause(12);
                }
                return ensureBundle(safeBundleKey)
                    .catch(function (error) {
                        console.warn("Khong preload duoc bundle:", safeBundleKey, error);
                        return false;
                    })
                    .then(function () {
                        return pause(index === 0 ? 18 : 30);
                    });
            });
        }, Promise.resolve()).then(function () {
            preloadState.completed = true;
            return true;
        });

        return preloadState.promise;
    }

    window.webNewLoader = window.webNewLoader || {};
    window.webNewLoader.baseUrl = baseUrl;
    window.webNewLoader.suffix = suffix;
    window.webNewLoader.ensureScript = ensureScript;
    window.webNewLoader.ensureBundle = ensureBundle;
    window.webNewLoader.ensureBundleForTab = ensureBundleForTab;
    window.webNewLoader.preloadBundlesSequentially = preloadBundlesSequentially;
    window.webNewLoader.getPreloadSequence = getSequentialBundleOrder;
    window.webNewLoader.getScriptStatus = function (key) {
        return scriptStatus[String(key || "").trim()] || "";
    };
    window.webNewLoader.getBundleStatus = function (key) {
        return bundleStatus[normalizeBundleKey(key)] || "";
    };
    window.webNewLoader.isBundleLoaded = function (key) {
        return bundleStatus[normalizeBundleKey(key)] === "loaded";
    };

    ensureBundle("core")
        .then(function () {
            return pause(16);
        })
        .then(function () {
            return preloadBundlesSequentially();
        })
        .catch(function (error) {
            console.warn("Khong tai duoc core bundle:", error);
        });
})();
