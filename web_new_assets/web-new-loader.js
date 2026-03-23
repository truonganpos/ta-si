(function () {
    var scriptStatus = window.__webNewScriptStatus = window.__webNewScriptStatus || {};
    var currentScript = document.currentScript;
    var currentSrc = currentScript && currentScript.src ? String(currentScript.src) : '';
    var queryIndex = currentSrc.indexOf('?');
    var hashIndex = currentSrc.indexOf('#');
    var cutIndex = currentSrc.length;

    if (queryIndex >= 0) cutIndex = Math.min(cutIndex, queryIndex);
    if (hashIndex >= 0) cutIndex = Math.min(cutIndex, hashIndex);

    var cleanSrc = currentSrc.slice(0, cutIndex);
    var baseUrl = cleanSrc.replace(/\/[^\/]+$/, '');
    var suffix = '';
    var assetVersion = String(window.WEB_NEW_ASSET_VERSION || '').trim();

    if (queryIndex >= 0) {
        var hashCut = hashIndex >= 0 ? hashIndex : currentSrc.length;
        suffix = currentSrc.slice(queryIndex, hashCut);
    } else if (assetVersion) {
        suffix = '?v=' + encodeURIComponent(assetVersion);
    }

    if (!baseUrl) return;

    window.WEB_NEW_ASSET_BASE_URL = window.WEB_NEW_ASSET_BASE_URL || baseUrl;

    var scriptMap = [
        { key: 'firebase', file: 'firebase.js' },
        { key: 'ui-pc', file: 'ui-pc.js' },
        { key: 'auth-product-gate', file: 'auth-product-gate.js', optional: true },
        { key: 'app-core', file: 'app-core.js' },
        { key: 'cart-logic', file: 'cart-logic.js' },
        { key: 'home-tab', file: 'home-tab.js' },
        { key: 'products-tab', file: 'products-tab.js' },
        { key: 'sale-tab', file: 'sale-tab.js' },
        { key: 'account-tab', file: 'account-tab.js' },
        { key: 'intro-experience', file: 'intro-experience.js' }
    ];

    function loadScriptSequentially(index) {
        if (index >= scriptMap.length) return;

        var entry = scriptMap[index];
        if (!entry || !entry.file || !entry.key) {
            loadScriptSequentially(index + 1);
            return;
        }

        if (scriptStatus[entry.key] === 'loaded') {
            loadScriptSequentially(index + 1);
            return;
        }

        var scriptUrl = baseUrl + '/' + entry.file + suffix;
        var existingScript = document.querySelector('script[data-web-new-src="' + scriptUrl + '"]');
        if (existingScript) {
            if (scriptStatus[entry.key] === 'failed') return;
            if (scriptStatus[entry.key] === 'loaded') {
                loadScriptSequentially(index + 1);
                return;
            }
            existingScript.addEventListener('load', function handleLoad() {
                existingScript.removeEventListener('load', handleLoad);
                loadScriptSequentially(index + 1);
            });
            existingScript.addEventListener('error', function handleError() {
                existingScript.removeEventListener('error', handleError);
            });
            return;
        }

        scriptStatus[entry.key] = 'loading';

        var script = document.createElement('script');
        script.src = scriptUrl;
        script.async = false;
        script.defer = false;
        script.charset = 'UTF-8';
        script.setAttribute('data-web-new-src', scriptUrl);
        script.setAttribute('data-web-new-key', entry.key);
        script.onload = function () {
            scriptStatus[entry.key] = 'loaded';
            loadScriptSequentially(index + 1);
        };
        script.onerror = function () {
            scriptStatus[entry.key] = entry.optional ? 'skipped' : 'failed';
            if (!entry.optional) {
                console.warn('Khong tai duoc file:', scriptUrl);
                return;
            }
            loadScriptSequentially(index + 1);
        };
        document.head.appendChild(script);
    }

    loadScriptSequentially(0);
})();
