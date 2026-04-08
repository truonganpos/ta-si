(function () {
    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderSidebarMenu(options) {
        if (window.productsTabUi && typeof window.productsTabUi.renderTreeMenu === 'function') {
            window.productsTabUi.renderTreeMenu({
                container: options && options.containerId,
                counter: options && options.counterId,
                categories: options && options.categories,
                activeCategory: options && options.activeCategory,
                allLabel: 'Tất cả sản phẩm',
                selectHandler: options && options.selectHandler,
                buildArgument: options && options.buildArgument,
                variant: 'desktop'
            });
        }
    }

    function fillWelcomePopup(content) {
        var body = document.getElementById('welcome-popup-body');
        var primaryBtn = document.getElementById('welcome-popup-primary');
        var secondaryBtn = document.getElementById('welcome-popup-secondary');
        var safeContent = Object.assign({
            badge: 'Popup chào mừng',
            title: 'Chào mừng bạn',
            subtitle: '',
            lines: [],
            primaryLabel: 'Đăng ký / Đăng nhập',
            secondaryLabel: 'Để sau'
        }, content || {});

        if (!body) return;

        body.innerHTML = [
            "<div class='rounded-2xl bg-pink-50 border border-pink-100 px-4 py-3 text-left'>",
            "<p class='text-[11px] uppercase tracking-[0.2em] text-babyPink font-black mb-2'>", escapeHtml(safeContent.badge), "</p>",
            "<h3 class='font-extrabold text-xl text-gray-800 leading-tight tracking-tight'>", escapeHtml(safeContent.title), "</h3>",
            "<p class='text-sm text-gray-500 leading-relaxed mt-3'>", escapeHtml(safeContent.subtitle), "</p>",
            "</div>",
            Array.isArray(safeContent.lines) && safeContent.lines.length ? [
                "<div class='space-y-3 mt-4'>",
                safeContent.lines.map(function (line) {
                    return [
                        "<div class='flex items-start gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3'>",
                        "<span class='w-8 h-8 rounded-full bg-pink-100 text-babyPink flex items-center justify-center shrink-0'><i class='fa-solid fa-check'></i></span>",
                        "<p class='text-sm text-gray-600 leading-relaxed'>", escapeHtml(line), "</p>",
                        "</div>"
                    ].join('');
                }).join(''),
                "</div>"
            ].join('') : ''
        ].join('');

        if (primaryBtn) primaryBtn.innerText = safeContent.primaryLabel;
        if (secondaryBtn) secondaryBtn.innerText = safeContent.secondaryLabel;
    }

    function maybeAutoOpenWelcomePopup(options) {
        var settings = options || {};
        var storageKey = String(settings.storageKey || 'ta_welcome_popup_seen_v1');
        var delay = Math.max(Number(settings.delay || 600) || 600, 0);

        try {
            if (sessionStorage.getItem(storageKey)) return false;
            sessionStorage.setItem(storageKey, String(Date.now()));
        } catch (error) {}

        setTimeout(function () {
            if (typeof window.openWelcomePopup === 'function') window.openWelcomePopup();
        }, delay);
        return true;
    }

    window.uiPc = Object.assign(window.uiPc || {}, {
        renderSidebarMenu: renderSidebarMenu,
        fillWelcomePopup: fillWelcomePopup,
        maybeAutoOpenWelcomePopup: maybeAutoOpenWelcomePopup
    });
})();
