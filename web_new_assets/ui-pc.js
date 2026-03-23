// T?n file: ui-pc.js
(function () {
    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function defaultBuildArgument(value) {
        return "'" + String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    }

    function renderSidebarMenu(options) {
        var settings = options || {};
        var container = document.getElementById(settings.containerId || "");
        var counter = document.getElementById(settings.counterId || "");
        var categories = Array.isArray(settings.categories) ? settings.categories : [];
        var activeCategory = String(settings.activeCategory || "").trim();
        var allLabel = String(settings.allLabel || "Tất cả");
        var selectHandler = String(settings.selectHandler || "").trim();
        var buildArgument = typeof settings.buildArgument === "function" ? settings.buildArgument : defaultBuildArgument;

        if (!container || !selectHandler) return;

        if (counter) {
            counter.innerText = categories.filter(function (item) {
                return item && !item.isChild && String(item.name || "") !== allLabel;
            }).length + " nhóm";
        }

        container.innerHTML = categories.map(function (item) {
            var isAll = String(item && item.name || "") === allLabel;
            var activeGroup = (!activeCategory && isAll) || activeCategory === String(item && item.name || "");
            var clickValue = buildArgument(isAll ? "" : item.name);
            var children = Array.isArray(item && item.children) ? item.children : [];
            var hasChildren = children.length > 0;
            var isGroupActive = activeGroup || children.some(function(c) { return activeCategory === String(c && c.name || ""); });

            if (isAll) {
                return [
                    "<div class=\"mb-3\">",
                    "<button class=\"w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold border transition ",
                    activeGroup ? "border-babyPink bg-pink-50 text-babyPink shadow-sm" : "border-gray-200 bg-gray-50 text-gray-700 hover:border-babyPink hover:text-babyPink",
                    "\" onclick=\"", selectHandler, "(", clickValue, ")\">",
                    "<i class=\"fa-solid fa-border-all w-5 text-center\"></i>", escapeHtml(item.name),
                    "</button>",
                    "</div>"
                ].join("");
            }

            return [
                "<div class=\"mb-1 relative group\">",
                "<button class=\"w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition ",
                isGroupActive ? "bg-pink-50 text-babyPink shadow-sm" : "bg-transparent text-gray-700 hover:bg-gray-50 hover:text-babyPink",
                "\" onclick=\"", selectHandler, "(", clickValue, ")\">",
                "<div class=\"flex items-center gap-3\">",
                "<span class=\"w-5 text-center ", isGroupActive ? "text-babyPink" : "text-gray-400 group-hover:text-babyPink transition", "\"><i class=\"fa-solid ", escapeHtml(item.icon || 'fa-folder'), "\"></i></span>",
                escapeHtml(item.name),
                "</div>",
                hasChildren ? "<i class=\"fa-solid fa-angle-down text-xs text-gray-400 group-hover:text-babyPink transition\"></i>" : "",
                "</button>",
                hasChildren ? [
                    "<div class=\"absolute left-0 top-full mt-1 w-full bg-white border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.1)] rounded-2xl p-2 hidden group-hover:block z-[60]\">",
                    "<div class=\"text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2 px-2 pt-1\">" + escapeHtml(item.name) + "</div>",
                    "<button class=\"w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition ",
                    activeGroup ? "text-babyPink bg-pink-50" : "text-gray-600 hover:text-babyPink hover:bg-pink-50",
                    "\" onclick=\"", selectHandler, "(", clickValue, ")\">Tất cả ", escapeHtml(item.name), "</button>",
                    children.map(function (child) {
                        var childActive = activeCategory === String(child && child.name || "");
                        return [
                            "<button class=\"w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition ",
                            childActive ? "text-babyPink bg-pink-50" : "text-gray-600 hover:text-babyPink hover:bg-pink-50",
                            "\" onclick=\"", selectHandler, "(", buildArgument(child && child.name || ""), ")\">",
                            escapeHtml(child && child.name || ""),
                            "</button>"
                        ].join("");
                    }).join(""),
                    "</div>"
                ].join("") : "",
                "</div>"
            ].join("");
        }).join("");
    }

    function fillWelcomePopup(content) {
        var body = document.getElementById("welcome-popup-body");
        var primaryBtn = document.getElementById("welcome-popup-primary");
        var secondaryBtn = document.getElementById("welcome-popup-secondary");
        var safeContent = Object.assign({
            badge: "Popup chào mừng",
            title: "Chào mừng bạn",
            subtitle: "",
            lines: [],
            primaryLabel: "Đăng ký / Đăng nhập",
            secondaryLabel: "Để sau"
        }, content || {});

        if (!body) return;

        body.innerHTML = [
            "<div class=\"rounded-2xl bg-pink-50 border border-pink-100 px-4 py-3 text-left\">",
            "<p class=\"text-[11px] uppercase tracking-[0.2em] text-babyPink font-black mb-2\">", escapeHtml(safeContent.badge), "</p>",
            "<h3 class=\"font-extrabold text-xl text-gray-800 leading-tight\">", escapeHtml(safeContent.title), "</h3>",
            "<p class=\"text-sm text-gray-500 leading-6 mt-3\">", escapeHtml(safeContent.subtitle), "</p>",
            "</div>",
            Array.isArray(safeContent.lines) && safeContent.lines.length ? [
                "<div class=\"space-y-3 mt-4\">",
                safeContent.lines.map(function (line) {
                    return [
                        "<div class=\"flex items-start gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3\">",
                        "<span class=\"w-8 h-8 rounded-full bg-pink-100 text-babyPink flex items-center justify-center shrink-0\"><i class=\"fa-solid fa-check\"></i></span>",
                        "<p class=\"text-sm text-gray-600 leading-6\">", escapeHtml(line), "</p>",
                        "</div>"
                    ].join("");
                }).join(""),
                "</div>"
            ].join("") : ""
        ].join("");

        if (primaryBtn) primaryBtn.innerText = safeContent.primaryLabel;
        if (secondaryBtn) secondaryBtn.innerText = safeContent.secondaryLabel;
    }

    function maybeAutoOpenWelcomePopup(options) {
        var settings = options || {};
        var storageKey = String(settings.storageKey || "ta_welcome_popup_seen_v1");
        var delay = Math.max(Number(settings.delay || 600) || 600, 0);

        try {
            if (sessionStorage.getItem(storageKey)) return false;
            sessionStorage.setItem(storageKey, String(Date.now()));
        } catch (error) {}

        setTimeout(function () {
            if (typeof window.openWelcomePopup === "function") window.openWelcomePopup();
        }, delay);
        return true;
    }

    window.uiPc = Object.assign(window.uiPc || {}, {
        renderSidebarMenu: renderSidebarMenu,
        fillWelcomePopup: fillWelcomePopup,
        maybeAutoOpenWelcomePopup: maybeAutoOpenWelcomePopup
    });
})();
