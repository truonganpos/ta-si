// Tên file: account-tab.js
(function () {
    function getBridge() {
        return window.webNewAppBridge || {};
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getNormalizedUser() {
        const bridge = getBridge();
        const user = bridge.getCurrentUser ? bridge.getCurrentUser() : null;
        if (!user || !bridge.normalizeUserData) return user;
        const normalized = bridge.normalizeUserData(user);
        if (bridge.setCurrentUser) bridge.setCurrentUser(normalized);
        return normalized;
    }

    function getSafeOrders(user) {
        return Array.isArray(user && user.orders) ? user.orders : [];
    }

    function getSafeWishlistIds(user) {
        const bridge = getBridge();
        const localWishlist = bridge.getWishlistData ? bridge.getWishlistData() : [];
        return Array.from(new Set([]
            .concat(Array.isArray(localWishlist) ? localWishlist : [])
            .concat(Array.isArray(user && user.favoriteProducts) ? user.favoriteProducts : [])
            .map((item) => String(item || '').trim())
            .filter(Boolean)));
    }

    const ACCOUNT_FEATURE_SHELL_IDS = [
        'account-settings-page',
        'orders-page',
        'wishlist-page',
        'address-book-modal',
        'address-form-modal',
        'settings-editor-panel'
    ];

    function getUploadEndpoint(bridge) {
        const endpoint = String((bridge && bridge.uploadEndpoint) || window.WEB_NEW_UPLOAD_ENDPOINT || 'upload-avatar.php').trim();
        return endpoint || 'upload-avatar.php';
    }

    function renderProductImageMarkup(raw, size, className, options) {
        const imageClass = String(className || '').trim();
        const config = Object.assign({ alt: 'Ảnh sản phẩm đang cập nhật', loading: 'lazy', decoding: 'async' }, options || {});
        if (typeof window.renderResponsiveImageHtml === 'function') {
            return window.renderResponsiveImageHtml(raw, size, imageClass, config);
        }
        const bridge = getBridge();
        const imageUrl = bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(raw, size) : String(raw || '').trim();
        if (!imageUrl) {
            return `<div class="product-image-missing ${escapeHtml(imageClass)}" role="img" aria-label="${escapeHtml(config.alt)}"><div class="product-image-missing__inner"><span class="product-image-missing__icon" aria-hidden="true"><i class="fa-solid fa-store"></i></span><span class="product-image-missing__brand">Trường An Store</span><span class="product-image-missing__label">Đang cập nhật</span></div></div>`;
        }
        return `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(config.alt)}" loading="${escapeHtml(config.loading)}" decoding="${escapeHtml(config.decoding)}" class="${escapeHtml(imageClass)}"/>`;
    }

    function canCancelOrder(order) {
        return Number(order && order.rawStatus || 0) === 1;
    }

    function canDeleteOrder(order) {
        return Number(order && order.rawStatus || 0) === 1;
    }

    let orderSearchKeyword = '';
    let orderStatusFilter = 'all';
    let authKeyboardBound = false;

    function openAccountModal(overlayId) {
        const safeId = String(overlayId || '').trim();
        if (!safeId) return;
        const bridge = getBridge();
        if (bridge.openModalShell) {
            bridge.openModalShell(safeId);
            return;
        }
        const shell = document.getElementById(safeId);
        if (!shell) return;
        shell.style.display = '';
        shell.classList.add('is-open');
        shell.removeAttribute('aria-hidden');
    }

    function closeAccountModal(overlayId) {
        const safeId = String(overlayId || '').trim();
        if (!safeId) return;
        const bridge = getBridge();
        if (bridge.closeModalShell) {
            bridge.closeModalShell(safeId);
            return;
        }
        const shell = document.getElementById(safeId);
        if (!shell) return;
        shell.classList.remove('is-open');
        shell.setAttribute('aria-hidden', 'true');
        window.setTimeout(function () {
            if (!shell.classList.contains('is-open')) shell.style.display = 'none';
        }, 220);
    }

    function normalizeAccountModalShells(root) {
        ACCOUNT_FEATURE_SHELL_IDS.forEach(function (id) {
            const shell = (root && root.querySelector && root.querySelector(`[id="${id}"]`))
                || document.getElementById(id);
            if (!shell || shell.classList.contains('is-open')) return;
            shell.style.display = 'none';
            shell.setAttribute('aria-hidden', 'true');
        });
    }

    const ORDER_STATUS_FILTERS = [
        { key: 'all', label: 'Tất cả', icon: 'fa-layer-group', color: 'text-gray-500' },
        { key: 'pending', label: 'Chờ xác nhận', icon: 'fa-wallet', color: 'text-orange-500' },
        { key: 'shipping', label: 'Đang giao', icon: 'fa-truck-fast', color: 'text-sky-500' },
        { key: 'completed', label: 'Hoàn tất', icon: 'fa-circle-check', color: 'text-emerald-500' },
        { key: 'cancelled', label: 'Đã hủy', icon: 'fa-file-circle-xmark', color: 'text-red-500' }
    ];

    function focusAuthField(tab) {
        const targetId = tab === 'register' ? 'reg-name' : 'login-email';
        window.requestAnimationFrame(() => {
            const input = document.getElementById(targetId);
            if (!input || input.disabled) return;
            try {
                input.focus({ preventScroll: true });
            } catch (error) {
                input.focus();
            }
            if (tab === 'login' && typeof input.select === 'function' && String(input.value || '').trim()) input.select();
        });
    }

    function handleAuthKeydown(event) {
        if (!event || event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
        const target = event.target;
        if (!target || String(target.tagName || '').toUpperCase() === 'TEXTAREA') return;
        const form = typeof target.closest === 'function' ? target.closest('form') : null;
        if (!form || form.classList.contains('hidden')) return;
        if (form.id !== 'auth-login-form' && form.id !== 'auth-register-form') return;
        event.preventDefault();
        if (form.id === 'auth-register-form') {
            window.handleRegister();
            return;
        }
        window.handleLogin();
    }

    function ensureAuthKeyboardSupport() {
        if (authKeyboardBound) return;
        const authPage = document.getElementById('auth-page');
        if (!authPage) return;
        authPage.addEventListener('keydown', handleAuthKeydown);
        authKeyboardBound = true;
    }

    function normalizeOrderKeyword(value) {
        const bridge = getBridge();
        if (bridge.normalizeKeyword) return bridge.normalizeKeyword(value || '');
        return String(value || '').trim().toLowerCase();
    }

    function resolveOrderStatusFilterKey(value) {
        const safeValue = normalizeOrderKeyword(value || 'all');
        const aliasMap = {
            all: 'all',
            'tat ca': 'all',
            pending: 'pending',
            'cho xac nhan': 'pending',
            'xac nhan': 'pending',
            shipping: 'shipping',
            'dang giao': 'shipping',
            'van chuyen': 'shipping',
            completed: 'completed',
            'hoan tat': 'completed',
            'da giao': 'completed',
            cancelled: 'cancelled',
            canceled: 'cancelled',
            'da huy': 'cancelled',
            huy: 'cancelled'
        };
        return aliasMap[safeValue] || 'all';
    }

    function getOrderStatusFilterMeta(filterKey) {
        const resolvedKey = resolveOrderStatusFilterKey(filterKey);
        return ORDER_STATUS_FILTERS.find((item) => item.key === resolvedKey) || ORDER_STATUS_FILTERS[0];
    }

    function matchesOrderStatusFilter(order, filterKey) {
        const resolvedKey = resolveOrderStatusFilterKey(filterKey);
        if (resolvedKey === 'all') return true;
        const rawStatus = Number(order && order.rawStatus || 0) || 0;
        const statusText = normalizeOrderKeyword(order && order.status);
        if (resolvedKey === 'pending') {
            return rawStatus === 1
                || statusText.includes('xac nhan')
                || statusText.includes('cho duyet')
                || statusText.includes('pending');
        }
        if (resolvedKey === 'shipping') {
            return rawStatus === 2
                || rawStatus === 3
                || statusText.includes('dang giao')
                || statusText.includes('giao hang')
                || statusText.includes('van chuyen')
                || statusText.includes('shipping');
        }
        if (resolvedKey === 'completed') {
            return rawStatus === 4
                || statusText.includes('hoan')
                || statusText.includes('da giao')
                || statusText.includes('thanh cong')
                || statusText.includes('completed');
        }
        if (resolvedKey === 'cancelled') {
            return rawStatus === 5
                || statusText.includes('huy')
                || statusText.includes('cancel');
        }
        return true;
    }

    function filterOrdersByStatus(orders, filterKey) {
        const resolvedKey = resolveOrderStatusFilterKey(filterKey == null ? orderStatusFilter : filterKey);
        const safeOrders = Array.isArray(orders) ? orders : [];
        if (resolvedKey === 'all') return safeOrders.slice();
        return safeOrders.filter((order) => matchesOrderStatusFilter(order, resolvedKey));
    }

    function getOrderStatusCount(orders, filterKey) {
        return filterOrdersByStatus(orders, filterKey).length;
    }

    async function syncCustomerProfileNow(bridge) {
        if (bridge && typeof bridge.waitForRetailFirebaseReady === 'function') {
            await bridge.waitForRetailFirebaseReady();
        }
        let result = null;
        if (bridge && typeof bridge.syncCurrentUserToCloud === 'function') {
            result = await bridge.syncCurrentUserToCloud();
        }
        if (!result && window.retailFirebase && typeof window.retailFirebase.updateCurrentCustomerProfile === 'function') {
            try {
                const baseUser = bridge && typeof bridge.getCurrentUser === 'function' ? bridge.getCurrentUser() : null;
                result = await window.retailFirebase.updateCurrentCustomerProfile(baseUser || {});
                if (result && bridge) {
                    const mergedUser = bridge.normalizeUserData
                        ? bridge.normalizeUserData({
                            ...(typeof bridge.getCurrentUser === 'function' ? (bridge.getCurrentUser() || {}) : {}),
                            ...result
                        })
                        : result;
                    if (bridge.setCurrentUser) bridge.setCurrentUser(mergedUser);
                    if (bridge.saveState) bridge.saveState();
                }
            } catch (error) {
                console.warn('Khong dong bo duoc thong tin khach hang len Firebase:', error);
            }
        }
        if (!result && bridge && bridge.showToast) {
            bridge.showToast('Đã lưu trên web nhưng cloud chưa đồng bộ kịp. Vui lòng thử lại sau vài giây.', 'warning');
            return false;
        }
        return true;
    }

    function getOrderSearchSignal(order) {
        const bridge = getBridge();
        const normalize = bridge.normalizeKeyword || function (value) {
            return String(value || '').toLowerCase();
        };
        const items = Array.isArray(order && order.items) ? order.items : [];
        const itemText = items.map((item) => {
            return [
                item && item.name,
                item && item.variantInfo,
                item && item.id,
                item && item.rootId
            ].filter(Boolean).join(' ');
        }).join(' ');
        return normalize([
            order && order.id,
            order && order.status,
            order && order.customerName,
            order && order.phone,
            order && order.note,
            itemText
        ].filter(Boolean).join(' '));
    }

    function filterOrdersByKeyword(orders) {
        const bridge = getBridge();
        const normalize = bridge.normalizeKeyword || function (value) {
            return String(value || '').toLowerCase();
        };
        const keyword = normalize(orderSearchKeyword || '');
        if (!keyword) return Array.isArray(orders) ? orders.slice() : [];
        return (Array.isArray(orders) ? orders : []).filter((order) => getOrderSearchSignal(order).includes(keyword));
    }

    function getOrderSortValue(order) {
        const directSortTs = Number(order && order.sortTs || 0) || 0;
        if (directSortTs) return directSortTs;

        const rawDate = String(order && order.date || '').trim();
        const match = rawDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*)?(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (!match) return 0;

        const day = Number(match[1] || 0) || 0;
        const month = (Number(match[2] || 0) || 1) - 1;
        const year = Number(match[3] || 0) || 0;
        const hour = Number(match[4] || 0) || 0;
        const minute = Number(match[5] || 0) || 0;
        const second = Number(match[6] || 0) || 0;
        return new Date(year, month, day, hour, minute, second).getTime();
    }

    function sortOrdersNewestFirst(orders) {
        return (Array.isArray(orders) ? orders.slice() : []).sort(function (a, b) {
            return getOrderSortValue(b) - getOrderSortValue(a);
        });
    }

    function ensureOrdersSearchShell(container) {
        if (!container) return null;
        let input = document.getElementById('orders-search-input');
        let filterRow = document.getElementById('orders-status-filter-row');
        let summary = document.getElementById('orders-search-summary');
        let list = document.getElementById('orders-list-container');
        if (input && filterRow && summary && list) {
            return { input: input, filterRow: filterRow, summary: summary, list: list };
        }

        container.innerHTML = `
            <div class="mb-5 max-w-xl mx-auto">
                <div class="relative">
                    <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input id="orders-search-input" class="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Mã đơn, tên sản phẩm..." type="text" value="${escapeHtml(orderSearchKeyword)}"/>
                </div>
                <div class="mt-3 flex flex-wrap items-center justify-center gap-2" id="orders-status-filter-row"></div>
                <div id="orders-search-summary"></div>
            </div>
            <div class="space-y-4" id="orders-list-container"></div>
        `;
        input = document.getElementById('orders-search-input');
        filterRow = document.getElementById('orders-status-filter-row');
        summary = document.getElementById('orders-search-summary');
        list = document.getElementById('orders-list-container');
        if (input) {
            input.addEventListener('input', function () {
                window.handleOrderSearch(this.value);
            });
        }
        return { input: input, filterRow: filterRow, summary: summary, list: list };
    }

    function isInactiveCustomer(user) {
        const safeStatus = String((user && (user.status || user.customerStatus)) || '').trim().toLowerCase();
        return safeStatus === 'offline'
            || safeStatus === 'inactive'
            || safeStatus === 'disabled'
            || safeStatus === 'blocked'
            || safeStatus === 'lock'
            || safeStatus === 'locked'
            || safeStatus.indexOf('ngung') >= 0
            || safeStatus.indexOf('ngừng') >= 0;
    }

    function mapAccountError(error, mode) {
        const code = String((error && error.code) || '').trim().toLowerCase();
        const message = String((error && error.message) || '').trim().toLowerCase();
        const raw = code + ' ' + message;

        if (raw.indexOf('missing-register-fields') >= 0) return 'Vui lòng nhập họ tên, số điện thoại và mật khẩu. Email có thể để trống.';
        if (raw.indexOf('missing-password-fields') >= 0) return 'Vui lòng nhập đầy đủ thông tin mật khẩu.';
        if (raw.indexOf('email-already-in-use') >= 0) return 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.';
        if (raw.indexOf('invalid-email') >= 0) return 'Email chưa đúng định dạng.';
        if (raw.indexOf('weak-password') >= 0) return 'Mật khẩu cần tối thiểu 6 ký tự.';
        if (raw.indexOf('requires-recent-login') >= 0) return 'Vui lòng đăng nhập lại rồi đổi mật khẩu để đảm bảo an toàn.';
        if (raw.indexOf('too-many-requests') >= 0) return 'Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.';
        if (raw.indexOf('popup-closed-by-user') >= 0) return 'Bạn đã đóng cửa sổ đăng nhập Gmail trước khi hoàn tất.';
        if (raw.indexOf('popup-blocked') >= 0) return 'Trình duyệt đang chặn popup đăng nhập Gmail. Hãy cho phép popup rồi thử lại.';
        if (raw.indexOf('google-provider-unavailable') >= 0) return 'Firebase chưa bật nhà cung cấp Gmail/Google.';
        if (raw.indexOf('account-exists-with-different-credential') >= 0) return 'Email này đã tồn tại bằng phương thức đăng nhập khác. Hãy đăng nhập bằng cách cũ trước.';
        if (raw.indexOf('missing-shipping-info') >= 0) return 'Khách vãng lai cần nhập số điện thoại và địa chỉ giao hàng để đặt đơn.';
        if (raw.indexOf('user-not-found') >= 0 || raw.indexOf('wrong-password') >= 0 || raw.indexOf('invalid-credential') >= 0) {
            return 'Thông tin đăng nhập chưa đúng. Vui lòng kiểm tra lại email hoặc mật khẩu.';
        }
        if (raw.indexOf('permission') >= 0 || raw.indexOf('denied') >= 0) {
            return mode === 'register'
                ? 'Tài khoản đã tạo nhưng hồ sơ khách chưa đồng bộ được. Hãy đăng nhập lại để hoàn tất.'
                : 'Đăng nhập được nhưng hồ sơ khách chưa đồng bộ xong. Vui lòng thử lại sau vài giây.';
        }
        return mode === 'register'
            ? 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin rồi thử lại.'
            : 'Đăng nhập thất bại. Nếu bạn dùng số điện thoại, hãy thử email đã đăng ký.';
    }

    function getDefaultAddress(user) {
        if (!user || !Array.isArray(user.addresses)) return null;
        return user.addresses.find((address) => address && address.isDefault) || user.addresses[0] || null;
    }

    function getAddressLine(address) {
        return String((address && address.text) || '').trim();
    }

    function getAddressPhone(address, user) {
        return String((address && address.phone) || (user && user.shippingPhone) || '').trim();
    }

    function parseListValue(value) {
        const rawList = Array.isArray(value) ? value : String(value || '').split(/[,;|\n]+/);
        return rawList
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .filter((item, index, array) => array.indexOf(item) === index);
    }

    function formatListValue(value) {
        return parseListValue(value).join(', ');
    }

    const ACCOUNT_INLINE_STYLE_ID = 'account-tab-inline-styles';
    const ACCOUNT_FEATURE_ROOT_ID = 'account-feature-root';

    function ensureAccountInlineStyles() {
        if (document.getElementById(ACCOUNT_INLINE_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = ACCOUNT_INLINE_STYLE_ID;
        style.textContent = [
            /* Centered Modal Animations */
            '.modal-shell { opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }',
            '.modal-shell.is-open { opacity: 1; pointer-events: auto; backdrop-filter: blur(2px); }',
            '.modal-panel { transform: scale(0.95); transition: transform 0.3s ease; }',
            '.is-open > .modal-panel, .is-open .modal-panel { transform: scale(1); }',
            
            /* Status Badges */
            '.status-active { background-color: #ecfdf5 !important; color: #059669 !important; border: 1px solid #d1fae5; }',
            '.status-inactive { background-color: #fef2f2 !important; color: #dc2626 !important; border: 1px solid #fee2e2; }',
            'body.dark-mode .status-active { background-color: rgba(16, 185, 129, 0.15) !important; color: #34d399 !important; border-color: rgba(52, 211, 153, 0.2) !important; }',
            'body.dark-mode .status-inactive { background-color: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; border-color: rgba(248, 113, 113, 0.2) !important; }',

            /* Shopee Menu Row */
            '.shopee-menu-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #f1f5f9; transition: background 0.2s; cursor: pointer; }',
            '.shopee-menu-row:last-child { border-bottom: none; }',
            '.shopee-menu-row:active { background: #f8fafc; }',
            
            /* Settings Rows */
            '.settings-detail-row{width:100%;background:#fff;padding:1rem;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:1rem;transition:background-color .2s ease; border-bottom: 1px dashed #f1f5f9;}',
            '.settings-detail-row:last-child{border-bottom: none;}',
            '.settings-detail-row:hover{background:#f8fafc;}',
            '.settings-detail-row--static{cursor:default;}',
            '.settings-detail-row--static:hover{background:#fff;}',
            '.settings-detail-row__label{color:#4b5563;flex-shrink:0;font-size:14px;}',
            '.settings-detail-row__value{font-weight:700;color:#1f2937;display:flex;align-items:center;justify-content:flex-end;gap:.5rem;flex:1;min-width:0;margin-left:1rem;}',
            '.settings-detail-row__stack{display:flex;flex-direction:column;align-items:flex-end;min-width:0;max-width:100%;}',
            '.settings-detail-row__text{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;}',
            '.settings-detail-row__hint{margin-top:2px;font-size:11px;line-height:1.4;color:#94a3b8;white-space:normal;text-align:right;}',
            '.settings-detail-row__chevron{color:#d1d5db;flex-shrink:0;font-size:12px;}',
            '.settings-detail-row__value--accent{color:#ff8fab;}',
            
            /* Custom Scrollbar */
            '.custom-scroll::-webkit-scrollbar { width: 6px; }',
            '.custom-scroll::-webkit-scrollbar-track { background: transparent; }',
            '.custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }',
            '.custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }',

            /* Dark Mode */
            'body.dark-mode .modal-panel, body.dark-mode .bg-white { background-color: #1f2937 !important; border-color: #374151 !important; color: #f3f4f6; }',
            'body.dark-mode .bg-gray-50 { background-color: #111827 !important; border-color: #374151 !important; }',
            'body.dark-mode .text-gray-800, body.dark-mode h1, body.dark-mode h2, body.dark-mode h3 { color: #f9fafb !important; }',
            'body.dark-mode .text-gray-700, body.dark-mode .text-gray-600 { color: #d1d5db !important; }',
            'body.dark-mode .text-gray-500, body.dark-mode .text-gray-400 { color: #9ca3af !important; }',
            'body.dark-mode .border-gray-100, body.dark-mode .border-gray-200 { border-color: #374151 !important; }',
            'body.dark-mode .shopee-menu-row { border-bottom-color: #374151; }',
            'body.dark-mode .shopee-menu-row:active { background: #374151; }',
            'body.dark-mode .settings-detail-row { background: #1f2937; border-bottom-color: #374151; }',
            'body.dark-mode .settings-detail-row:hover { background: #111827; }',
            'body.dark-mode .settings-detail-row__value { color: #f8fafc; }',
            'body.dark-mode .settings-detail-row__label { color: #cbd5e1; }',
            
            /* Select Style */
            'select.clay-input { appearance: none; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em; padding-right: 2.5rem; }'
        ].join('');
        document.head.appendChild(style);
    }

    function calculateAgeFromBirthday(value) {
        const safeValue = String(value || '').trim();
        if (!safeValue) return 0;
        const parts = safeValue.split('-').map((part) => Number(part || 0) || 0);
        if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return 0;
        const now = new Date();
        let age = now.getFullYear() - parts[0];
        const monthDelta = (now.getMonth() + 1) - parts[1];
        if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < parts[2])) age -= 1;
        return Math.max(age, 0);
    }

    function getUserAgeLabel(user) {
        const age = calculateAgeFromBirthday(user && user.birthday);
        if (age > 0) return `${age} tuổi`;
        const legacyValue = String((user && user.age) || '').trim();
        if (!legacyValue) return 'Chưa cập nhật';
        return /tuổi/i.test(legacyValue) ? legacyValue : `${legacyValue} tuổi`;
    }

    function renderSettingsActionRow(label, value, onclick, options) {
        const config = Object.assign({ accent: false, hint: '' }, options || {});
        return `
            <button class="settings-detail-row" onclick="${onclick}">
                <span class="settings-detail-row__label">${label}</span>
                <span class="settings-detail-row__value ${config.accent ? 'settings-detail-row__value--accent' : ''}">
                    <span class="settings-detail-row__stack">
                        <span class="settings-detail-row__text">${escapeHtml(value)}</span>
                        ${config.hint ? `<span class="settings-detail-row__hint">${escapeHtml(config.hint)}</span>` : ''}
                    </span>
                    <i class="fa-solid fa-angle-right settings-detail-row__chevron"></i>
                </span>
            </button>
        `;
    }

    function renderSettingsStaticRow(label, value, options) {
        const config = Object.assign({ accent: false, hint: '' }, options || {});
        return `
            <div class="settings-detail-row settings-detail-row--static">
                <span class="settings-detail-row__label">${label}</span>
                <span class="settings-detail-row__value ${config.accent ? 'settings-detail-row__value--accent' : ''}">
                    <span class="settings-detail-row__stack">
                        <span class="settings-detail-row__text">${escapeHtml(value)}</span>
                        ${config.hint ? `<span class="settings-detail-row__hint">${escapeHtml(config.hint)}</span>` : ''}
                    </span>
                </span>
            </div>
        `;
    }

    function getBirthdayDisplay(user, bridge) {
        if (bridge && typeof bridge.formatBirthdayDisplay === 'function') {
            return bridge.formatBirthdayDisplay(user && user.birthday);
        }
        return String((user && user.birthday) || '').trim() || 'Chưa cập nhật';
    }

    function renderAccountOverviewCard(item) {
        const tagName = item && item.onclick ? 'button' : 'div';
        const accentClass = item && item.accent ? 'text-babyPink' : 'text-gray-800';
        const cardClass = [
            'rounded-[24px] bg-gray-50 px-4 py-4 border border-gray-100 text-left min-w-0',
            item && item.onclick ? 'hover:bg-pink-50 hover:border-pink-100 transition cursor-pointer' : '',
            item && item.wide ? 'sm:col-span-2' : ''
        ].join(' ').trim();
        return `
            <${tagName} class="${cardClass}" ${item && item.onclick ? `onclick="${item.onclick}"` : ''}>
                <div class="flex items-start justify-between gap-3 min-w-0">
                    <div class="min-w-0 flex-1">
                        <p class="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">${escapeHtml(item.label)}</p>
                        <p class="mt-2 text-sm font-bold leading-6 break-words ${accentClass}">${escapeHtml(item.value)}</p>
                        ${item && item.hint ? `<p class="mt-1 text-xs text-gray-400 leading-5 break-words">${escapeHtml(item.hint)}</p>` : ''}
                    </div>
                </div>
            </${tagName}>
        `;
    }

    function renderAccountOverviewGrid(user, bridge) {
        const items = [
            { label: 'Họ tên', value: user.name || bridge.defaultGuestName || 'Khách Lẻ Web' },
            { label: 'Giới tính', value: user.gender || 'Chưa cập nhật' },
            { label: 'Ngày sinh', value: getBirthdayDisplay(user, bridge) },
            { label: 'Tuổi', value: getUserAgeLabel(user), hint: user && user.birthday ? 'Tự tính từ ngày sinh' : 'Cập nhật ngày sinh để tự tính' },
            { label: 'Cá nhân', value: user.personalInfo || 'Thiết lập ngay', accent: true },
            { label: 'Hôn nhân', value: user.maritalStatus || 'Chưa cập nhật' },
            { label: 'Sở thích', value: formatListValue(user.interests) || 'Chưa cập nhật', wide: true },
            { label: 'Quan tâm', value: formatListValue(user.concerns) || 'Chưa cập nhật', wide: true }
        ];
        return items.map(renderAccountOverviewCard).join('');
    }

    function generateAddressCardHtml(address, isPC = false) {
        return `
            <div class="bg-white border ${address.isDefault ? 'border-babyPink shadow-sm' : 'border-gray-200'} rounded-2xl p-4 relative text-left min-w-0 transition hover:border-pink-100 group">
                ${address.isDefault ? '<div class="absolute top-3 right-3 text-[10px] font-bold uppercase bg-pink-50 text-babyPink border border-pink-100 px-2 py-0.5 rounded">Mặc định</div>' : ''}
                <div class="pr-16">
                    <p class="text-[15px] text-gray-800 font-bold leading-relaxed break-words mb-1.5">${escapeHtml(address.text)}</p>
                    <p class="text-sm text-gray-500 font-semibold truncate"><i class="fa-solid fa-phone text-xs mr-1.5 opacity-60"></i>${escapeHtml(address.phone) || 'Chưa có SĐT'}</p>
                </div>
                <div class="flex gap-4 mt-4 pt-3 border-t border-gray-50">
                    ${!address.isDefault ? `<button onclick="setAddressDefault('${address.id}')" class="text-xs text-sky-500 font-bold hover:text-sky-600 transition">Đặt mặc định</button>` : ''}
                    <button onclick="openAddressFormModal('${address.id}')" class="text-xs text-gray-500 font-bold hover:text-gray-800 transition ${address.isDefault ? 'ml-auto' : 'ml-auto'} shrink-0"><i class="fa-solid fa-pen mr-1"></i> Sửa</button>
                    <button onclick="deleteAddress('${address.id}')" class="text-xs text-red-400 font-bold hover:text-red-600 transition shrink-0"><i class="fa-solid fa-trash mr-1"></i> Xóa</button>
                </div>
            </div>
        `;
    }

    function buildAccountShellMarkup() {
        return `
            <div class='fixed inset-0 z-[85] bg-black/50 modal-shell flex items-center justify-center p-4' id='account-settings-page' data-close-action='closeSettings' onclick='if(event.target === this) closeSettings()'>
                <div class='modal-panel bg-gray-50 w-full max-w-4xl max-h-[90vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden' onclick='event.stopPropagation()'>
                    <header class='bg-white z-10 px-6 py-4 flex items-center justify-between sticky top-0 border-b border-gray-100 shadow-sm'>
                        <h1 class='font-bold text-lg text-gray-800' id="settings-main-title">Hồ sơ cá nhân</h1>
                        <button class='w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition' onclick='closeSettings()'><i class='fa-solid fa-xmark'></i></button>
                    </header>
                    <main class='flex-1 overflow-y-auto custom-scroll w-full p-4 md:p-6' id='settings-content'></main>
                </div>
            </div>

            <div class='fixed inset-0 z-[90] bg-black/50 modal-shell flex items-center justify-center p-4' id='address-book-modal' data-close-action='closeAddressBookModal' onclick='if(event.target === this) closeAddressBookModal()'>
                <div class='modal-panel bg-gray-50 w-full max-w-2xl max-h-[90vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden' onclick='event.stopPropagation()'>
                    <header class='bg-white z-10 px-6 py-4 flex items-center justify-between sticky top-0 border-b border-gray-100 shadow-sm'>
                        <h1 class='font-bold text-lg text-gray-800'>Sổ địa chỉ</h1>
                        <button class='w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition' onclick='closeAddressBookModal()'><i class='fa-solid fa-xmark'></i></button>
                    </header>
                    <main class='flex-1 overflow-y-auto custom-scroll w-full p-4' id='address-book-content'></main>
                </div>
            </div>

            <div class='fixed inset-0 z-[100] bg-black/50 modal-shell flex items-center justify-center p-4' id='address-form-modal' data-close-action='closeAddressFormModal' onclick='if(event.target === this) closeAddressFormModal()'>
                <div class='modal-panel bg-white w-full max-w-lg max-h-[90vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden' onclick='event.stopPropagation()'>
                    <div class="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                        <h3 id="address-form-title" class="font-bold text-lg text-gray-800">Thêm địa chỉ mới</h3>
                        <button class="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 transition" onclick="closeAddressFormModal()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="p-6 space-y-4 custom-scroll overflow-y-auto max-h-[75vh]">
                        <input type="hidden" id="address-form-editing-id" value="">
                        
                        <div class="flex justify-between items-center mb-2">
                            <label class="text-[11px] font-bold text-gray-400 block uppercase tracking-widest">Phương thức nhập</label>
                            <button onclick="toggleAddressMode()" id="addr-mode-btn" class="text-xs text-babyPink font-bold hover:underline">Nhập địa chỉ thủ công</button>
                        </div>

                        <div id="addr-form-api" class="space-y-4 hidden">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="col-span-2">
                                    <div class="relative">
                                        <i class="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                        <input id="addr-form-phone-api" type="tel" class="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold focus:outline-babyPink focus:bg-white transition shadow-sm" placeholder="Số điện thoại nhận hàng"/>
                                    </div>
                                </div>
                                <div class="col-span-2">
                                    <select id="addr-province" onchange="loadAddressWards(this.value)" class="clay-input w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-babyPink focus:bg-white transition shadow-sm">
                                        <option value="">Tỉnh / Thành phố</option>
                                    </select>
                                </div>
                                <div class="col-span-2">
                                    <select id="addr-ward" class="clay-input w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-babyPink focus:bg-white transition shadow-sm disabled:opacity-50" disabled>
                                        <option value="">Phường / Xã (theo địa giới 2026)</option>
                                    </select>
                                </div>
                                <div class="col-span-2">
                                    <input id="addr-street" type="text" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-babyPink focus:bg-white transition shadow-sm" placeholder="Số nhà, Tên đường..."/>
                                </div>
                            </div>
                        </div>

                        <div id="addr-form-manual" class="space-y-4">
                            <div>
                                <div class="relative">
                                    <i class="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    <input id="addr-form-phone-manual" type="tel" class="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold focus:outline-babyPink focus:bg-white transition shadow-sm" placeholder="Số điện thoại nhận hàng"/>
                                </div>
                            </div>
                            <div>
                                <div class="relative">
                                    <i class="fa-solid fa-location-dot absolute left-4 top-3.5 text-gray-400"></i>
                                    <textarea id="address-form-text" class="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-babyPink focus:bg-white transition h-28 resize-none shadow-sm leading-relaxed" placeholder="Địa chỉ chi tiết đầy đủ (Tỉnh, Huyện, Xã, Số nhà)..."></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center justify-between py-3 mt-2 border-t border-gray-50">
                            <span class="text-[15px] text-gray-700 font-bold">Đặt làm địa chỉ mặc định</span>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="address-form-default" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-babyPink"></div>
                            </label>
                        </div>

                        <div class="flex gap-3 pt-2">
                            <button onclick="closeAddressFormModal()" class="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition">Hủy</button>
                            <button onclick="saveAddressForm()" class="flex-1 bg-babyPink text-white py-3.5 rounded-2xl font-bold hover:bg-pink-500 transition shadow-sm">Lưu địa chỉ</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class='fixed inset-0 bg-black/50 z-[70] modal-shell flex items-center justify-center p-4' id='orders-page' data-close-action='closeOrders' onclick='if(event.target === this) closeOrders()'>
                <div class='modal-panel bg-gray-50 w-full max-w-4xl max-h-[90vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden' onclick='event.stopPropagation()'>
                    <header class='sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm'>
                        <h1 class='font-bold text-lg text-gray-800'>Lịch sử đơn hàng</h1>
                        <button class='w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition' onclick='closeOrders()'><i class='fa-solid fa-xmark'></i></button>
                    </header>
                    <main class='flex-1 overflow-y-auto custom-scroll w-full p-4 md:p-6' id='orders-content'></main>
                </div>
            </div>

            <div class='fixed inset-0 bg-black/50 z-[70] modal-shell flex items-center justify-center p-4' id='wishlist-page' data-close-action='closeWishlist' onclick='if(event.target === this) closeWishlist()'>
                <div class='modal-panel bg-gray-50 w-full max-w-5xl max-h-[90vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden' onclick='event.stopPropagation()'>
                    <header class='sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm'>
                        <h1 class='font-bold text-lg text-gray-800'>Sản phẩm yêu thích</h1>
                        <button class='w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 transition' onclick='closeWishlist()'><i class='fa-solid fa-xmark'></i></button>
                    </header>
                    <main class='flex-1 overflow-y-auto custom-scroll w-full p-4 md:p-6'>
                        <div class='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' id='wishlist-content'></div>
                    </main>
                </div>
            </div>
            
            <div id="settings-editor-panel" class="fixed inset-0 z-[120] bg-black/50 modal-shell flex items-center justify-center p-4 lg:hidden" data-close-action="closeProfileFieldEditor" onclick="if(event.target === this) closeProfileFieldEditor()">
                <div class="modal-panel bg-white w-full max-w-md max-h-[90vh] rounded-[28px] p-6 shadow-2xl" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-extrabold text-lg text-gray-800" id="settings-editor-title">Chỉnh sửa</h3>
                        <button class="text-gray-400 hover:text-gray-600 w-8 h-8 flex justify-center items-center rounded-full bg-gray-50 transition" onclick="closeProfileFieldEditor()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div id="settings-editor-body" class="min-w-0 mb-4 overflow-y-auto custom-scroll max-h-[60vh]"></div>
                    <div class="flex gap-3">
                        <button onclick="closeProfileFieldEditor()" class="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition">Hủy</button>
                        <button onclick="saveProfileFieldMobile()" class="flex-1 bg-babyPink text-white py-3 rounded-2xl font-bold hover:bg-pink-500 transition shadow-sm">Lưu</button>
                    </div>
                </div>
            </div>
        `;
    }

    function ensureAccountFeatureShell() {
        let root = document.getElementById(ACCOUNT_FEATURE_ROOT_ID);
        if (!root) {
            root = document.createElement('div');
            root.id = ACCOUNT_FEATURE_ROOT_ID;
            root.setAttribute('data-feature-root', 'account-tab');
            document.body.appendChild(root);
        }
        const hasAllShells = ACCOUNT_FEATURE_SHELL_IDS.every(function (id) {
            return !!root.querySelector(`[id="${id}"]`);
        });
        if (!hasAllShells) {
            ACCOUNT_FEATURE_SHELL_IDS.forEach(function (id) {
                document.querySelectorAll(`[id="${id}"]`).forEach(function (node) {
                    if (!root.contains(node)) node.remove();
                });
            });
            root.innerHTML = buildAccountShellMarkup();
            normalizeAccountModalShells(root);
        }
        return root;
    }

    function renderSupportMenu(menuId) {
        return `
            <div class='flex items-center justify-between gap-2' id='${menuId}'>
                <button class='bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 py-3 px-1 flex flex-col items-center justify-center hover:bg-green-50 transition-colors group' onclick='openStoreZalo()'>
                    <div class='text-green-600 mb-1.5 text-lg group-hover:scale-110 transition-transform'><i class='fa-solid fa-comment-dots'></i></div>
                    <span class='font-bold text-[10px] md:text-[11px] text-gray-500'>Zalo</span>
                </button>
                <button class='bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 py-3 px-1 flex flex-col items-center justify-center hover:bg-sky-50 transition-colors group' onclick='openStoreFacebook()'>
                    <div class='text-sky-600 mb-1.5 text-lg group-hover:scale-110 transition-transform'><i class='fa-brands fa-facebook-f'></i></div>
                    <span class='font-bold text-[10px] md:text-[11px] text-gray-500'>Facebook</span>
                </button>
                <button class='bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 py-3 px-1 flex flex-col items-center justify-center hover:bg-amber-50 transition-colors group' onclick='openStoreEmail()'>
                    <div class='text-amber-500 mb-1.5 text-lg group-hover:scale-110 transition-transform'><i class='fa-regular fa-envelope'></i></div>
                    <span class='font-bold text-[10px] md:text-[11px] text-gray-500'>Email</span>
                </button>
                <button class='bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 py-3 px-1 flex flex-col items-center justify-center hover:bg-purple-50 transition-colors group' onclick='openStoreZaloGroup()'>
                    <div class='text-purple-600 mb-1.5 text-lg group-hover:scale-110 transition-transform'><i class='fa-solid fa-user-group'></i></div>
                    <span class='font-bold text-[10px] md:text-[11px] text-gray-500'>Nhóm</span>
                </button>
            </div>
        `;
    }

    function openPage(pageId) {
        openAccountModal(pageId);
    }
    
    function closePage(pageId) {
        closeAccountModal(pageId);
    }

    window.updateHeaderUserBadge = function () {
        const badge = document.getElementById('header-user-badge');
        if (!badge) return;
        let nameToDisplay = '';
        const user = getNormalizedUser(); 
        if (user && user.name) {
            nameToDisplay = user.name;
            localStorage.setItem('ta_cached_name', nameToDisplay); 
        } else {
            nameToDisplay = localStorage.getItem('ta_cached_name') || '';
        }
        if (nameToDisplay) {
            const shortName = nameToDisplay.split(' ').pop();
            badge.innerHTML = `<i class='fa-solid fa-user-check'></i> ${escapeHtml(shortName)}`;
        } else {
            badge.innerHTML = `<i class='fa-regular fa-user'></i> Đăng nhập`;
        }
    };

    window.renderAccountTab = function () {
        const bridge = getBridge();
        const area = document.getElementById('account-render-area');
        if (!area) return;
        ensureAccountInlineStyles();
        ensureAccountFeatureShell();
        window.updateHeaderUserBadge();

        const user = getNormalizedUser();
        if (!user) {
            area.innerHTML = `
                <div class='max-w-3xl mx-auto space-y-6 py-6'>
                    <section class='bg-white rounded-[32px] p-8 text-center shadow-sm border border-gray-100'>
                        <div class='w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-babyPink text-4xl mb-5 mx-auto'>
                            <i class='fa-solid fa-user-lock'></i>
                        </div>
                        <h2 class='font-bold text-2xl text-gray-800'>Chào mừng bạn</h2>
                        <p class='text-sm text-gray-500 mt-3 max-w-lg mx-auto'>Đăng nhập để lưu lịch sử mua hàng, sửa hồ sơ nhanh và đồng bộ dữ liệu.</p>
                        <div class='flex justify-center mt-6'>
                            <button onclick='openAuth()' class='bg-babyPink text-white px-8 py-3 rounded-2xl font-bold shadow-sm hover:bg-pink-500 transition'>Đăng nhập / Đăng ký</button>
                        </div>
                        <p class='text-xs text-gray-400 mt-5'>Khách chưa đăng nhập vẫn có thể đặt hàng. Hệ thống sẽ tự động ghi nhận theo SĐT và Địa chỉ bạn cung cấp.</p>
                    </section>
                    <section class='bg-white rounded-[32px] p-6 text-center md:text-left shadow-sm border border-gray-100'>
                        <div class='mb-4'>
                            <p class='text-xs uppercase tracking-[0.18em] text-gray-400 font-bold'>Hỗ trợ nhanh</p>
                            <h3 class='font-bold text-lg text-gray-800 mt-1'>Liên hệ shop</h3>
                        </div>
                        ${renderSupportMenu('guest-account-support')}
                    </section>
                </div>
            `;
            return;
        }

        const orders = getSafeOrders(user);
        const wishlistData = getSafeWishlistIds(user);
        const defaultAddress = getDefaultAddress(user);
        const defaultAddressLine = getAddressLine(defaultAddress);
        const defaultAddressPhone = getAddressPhone(defaultAddress, user);
        const inactiveUser = isInactiveCustomer(user);
        
        const statusCards = ORDER_STATUS_FILTERS
            .filter((item) => item.key !== 'all')
            .map((item) => ({
                key: item.key,
                label: item.label,
                icon: item.icon,
                color: item.color,
                count: getOrderStatusCount(orders, item.key)
            }));
        
        const avatarImg = user.avatar ? (bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(user.avatar, 'w300') : user.avatar) : '';
        const userName = user.name || bridge.defaultGuestName || 'Khách Lẻ Web';

        // PC Addresses Array rendering
        let pcAddressesHtml = '<p class="text-sm text-gray-400 text-center py-6 col-span-full">Bạn chưa lưu địa chỉ nào.</p>';
        if (Array.isArray(user.addresses) && user.addresses.length > 0) {
            pcAddressesHtml = user.addresses.map(addr => generateAddressCardHtml(addr, true)).join('');
        }

        // --- GIAO DIỆN MOBILE ---
        const mobileLayout = `
            <div class="lg:hidden w-full bg-gray-50 min-h-screen pb-24">
                <div class="shopee-header bg-white border-b border-gray-100 shadow-sm pt-8 pb-14 px-5 rounded-b-[32px] flex items-center justify-between relative">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-pink-50 border-2 border-white overflow-hidden flex items-center justify-center text-babyPink text-2xl shadow-sm">
                            ${avatarImg ? `<img src="${avatarImg}" class="w-full h-full object-cover"/>` : `<i class="fa-regular fa-user"></i>`}
                        </div>
                        <div>
                            <h2 class="font-bold text-lg text-gray-800">${userName}</h2>
                            <div class="flex gap-2 mt-1.5">
                                <span class="bg-pink-50 text-babyPink border border-pink-100 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm">${user.group || 'Khách web'}</span>
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${inactiveUser ? 'status-inactive' : 'status-active'}">${inactiveUser ? 'Không hoạt động' : 'Hoạt động'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${inactiveUser ? `
                    <div class="mx-5 -mt-4 mb-4 relative z-10 bg-amber-50 border border-amber-200 text-amber-600 px-4 py-3 rounded-2xl text-xs font-bold shadow-sm flex items-center gap-2">
                        <i class="fa-solid fa-triangle-exclamation"></i> Dữ liệu bán hàng và sản phẩm đang tạm khóa.
                    </div>
                ` : ''}

                <div class="bg-white mx-5 ${inactiveUser ? '' : '-mt-6'} p-0 rounded-[24px] shadow-sm border border-gray-100 relative z-10">
                    <div class="flex justify-between items-center px-4 py-3 border-b border-gray-50">
                        <h3 class="font-bold text-sm text-gray-800">Đơn mua của tôi</h3>
                        <button onclick="openOrders('all')" class="text-xs font-bold text-gray-400 flex items-center gap-1 hover:text-babyPink">Lịch sử <i class="fa-solid fa-angle-right"></i></button>
                    </div>
                    <div class="flex justify-between items-center py-4 px-2">
                        ${statusCards.map(item => `
                            <button class="flex-1 flex flex-col items-center gap-2 relative" onclick="openOrders('${item.key}')">
                                <div class="text-2xl ${item.color} relative">
                                    <i class="fa-solid ${item.icon}"></i>
                                    ${item.count ? `<span class="absolute -top-1 -right-2 bg-babyPink text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-white">${item.count}</span>` : ''}
                                </div>
                                <span class="text-[10px] font-semibold text-gray-600 leading-tight">${item.label}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-white mx-5 mt-5 p-0 rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <button class="shopee-menu-row w-full text-left" onclick="openWishlist()">
                        <div class="flex items-center gap-3">
                            <div class="text-babyPink text-lg w-6 text-center"><i class="fa-solid fa-heart"></i></div>
                            <span class="text-sm font-bold text-gray-700">Đồ chơi yêu thích</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-gray-400">${wishlistData.length}</span>
                            <i class="fa-solid fa-angle-right text-gray-300"></i>
                        </div>
                    </button>
                    
                    <button class="shopee-menu-row w-full text-left flex-col items-start gap-2" onclick="openAddressBookModal()">
                        <div class="flex items-center justify-between w-full">
                            <div class="flex items-center gap-3">
                                <div class="text-sky-500 text-lg w-6 text-center"><i class="fa-solid fa-location-dot"></i></div>
                                <span class="text-sm font-bold text-gray-700">Sổ địa chỉ</span>
                            </div>
                            <i class="fa-solid fa-angle-right text-gray-300"></i>
                        </div>
                    </button>

                    <button class="shopee-menu-row w-full text-left" onclick="openSettings()">
                        <div class="flex items-center gap-3">
                            <div class="text-purple-500 text-lg w-6 text-center"><i class="fa-solid fa-user-pen"></i></div>
                            <span class="text-sm font-bold text-gray-700">Hồ sơ cá nhân & Bảo mật</span>
                        </div>
                        <i class="fa-solid fa-angle-right text-gray-300"></i>
                    </button>
                    <div class="px-4 pt-4 pb-2 border-b border-gray-100 bg-gray-50">
                        <span class="text-xs font-bold text-gray-400 uppercase">Hỗ trợ nhanh</span>
                    </div>
                    <div class="px-3 pt-2 pb-4 bg-gray-50">
                        ${renderSupportMenu('mobile-account-support')}
                    </div>
                    <button class="shopee-menu-row w-full text-left border-t border-gray-100" onclick="processLogout()">
                        <div class="flex items-center gap-3">
                            <div class="text-gray-400 text-lg w-6 text-center"><i class="fa-solid fa-arrow-right-from-bracket"></i></div>
                            <span class="text-sm font-bold text-gray-600">Đăng xuất</span>
                        </div>
                    </button>
                </div>
                
                <div class="bg-white mx-5 mt-5 p-5 rounded-[24px] shadow-sm border border-gray-100 min-w-0">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-base text-gray-800">Sổ địa chỉ của tôi</h3>
                        <button onclick="openAddressBookModal()" class="bg-pink-50 text-babyPink px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-pink-100 transition">Quản lý</button>
                    </div>
                    <div class='rounded-2xl bg-gray-50 border border-gray-100 p-4 text-center'>
                        <i class="fa-solid fa-location-dot text-2xl text-gray-300 mb-2"></i>
                        <p class='text-sm text-gray-700 font-semibold leading-relaxed break-words line-clamp-2'>${defaultAddressLine || 'Chưa thiết lập địa chỉ.'}</p>
                        <p class='text-sm font-bold text-babyPink mt-1 truncate'>${defaultAddressPhone || ''}</p>
                    </div>
                </div>
            </div>
        `;

        // --- GIAO DIỆN PC (DASHBOARD) ---
        const pcLayout = `
            <div class='hidden lg:grid grid-cols-[340px,minmax(0,1fr)] gap-6 max-w-7xl mx-auto py-6'>
                <section class='bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 flex flex-col items-start min-w-0 h-fit'>
                    <div class='flex gap-4 items-center w-full mb-6 pb-6 border-b border-gray-100'>
                        <div class='w-16 h-16 shrink-0 rounded-full bg-pink-50 border-2 border-white overflow-hidden flex items-center justify-center text-babyPink text-2xl shadow-sm'>
                            ${avatarImg ? `<img src="${avatarImg}" class='w-full h-full object-cover'/>` : `<i class='fa-regular fa-user'></i>`}
                        </div>
                        <div class='min-w-0 flex-1'>
                            <h2 class='font-bold text-lg text-gray-800 truncate'>${userName}</h2>
                            <div class="flex gap-2 mt-1.5">
                                <span class='bg-pink-50 text-babyPink border border-pink-100 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase inline-block shadow-sm'>${user.group || 'Thành viên'}</span>
                                <span class='px-2.5 py-0.5 rounded text-[10px] font-bold uppercase inline-block shadow-sm ${inactiveUser ? 'status-inactive' : 'status-active'}'>${inactiveUser ? 'Không hoạt động' : 'Hoạt động'}</span>
                            </div>
                        </div>
                    </div>
                    ${inactiveUser ? `<div class='w-full bg-amber-50 text-amber-700 border border-amber-200 rounded-xl p-3 mb-4 text-xs font-bold'>Dữ liệu bán hàng tạm khóa.</div>` : ''}
                    
                    <button class='flex items-center justify-between w-full py-3 px-2 rounded-xl hover:bg-gray-50 group transition' onclick='openOrders("all")'>
                        <span class='font-bold text-gray-700 group-hover:text-babyPink transition'><i class="fa-solid fa-box-open w-6 text-gray-400"></i> Đơn mua của tôi</span>
                        <span class='bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold'>${orders.length}</span>
                    </button>
                    <button class='flex items-center justify-between w-full py-3 px-2 rounded-xl hover:bg-gray-50 group transition' onclick='openWishlist()'>
                        <span class='font-bold text-gray-700 group-hover:text-babyPink transition'><i class="fa-solid fa-heart w-6 text-gray-400"></i> Yêu thích</span>
                        <span class='bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold'>${wishlistData.length}</span>
                    </button>
                    <button class='flex items-center justify-between w-full py-3 px-2 rounded-xl hover:bg-gray-50 group transition text-babyPink' onclick='openSettings()'>
                        <span class='font-bold'><i class="fa-solid fa-user-pen w-6"></i> Quản lý hồ sơ</span>
                    </button>

                    <div class='w-full mt-6 pt-6 border-t border-gray-100'>
                        <p class='text-xs uppercase tracking-wider text-gray-400 font-bold mb-3'>Hỗ trợ nhanh</p>
                        ${renderSupportMenu('pc-account-support')}
                    </div>
                    
                    <div class="mt-auto w-full pt-6">
                        <button onclick='processLogout()' class='w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50 transition shadow-sm'>Đăng xuất</button>
                    </div>
                </section>

                <div class='space-y-6 min-w-0'>
                    <section class='bg-white rounded-[32px] border border-gray-100 shadow-sm p-6'>
                        <div class='flex flex-wrap items-center justify-between gap-4 mb-5'>
                            <h3 class='font-bold text-xl text-gray-800'>Tổng quan đơn hàng</h3>
                            <button onclick='openOrders("all")' class="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition border border-gray-200">Xem tất cả</button>
                        </div>
                        <div class='grid grid-cols-4 gap-3'>
                            ${statusCards.map(item => `
                                <button class='bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col items-center justify-center gap-2 hover:border-pink-200 hover:bg-pink-50 transition group' onclick='openOrders("${item.key}")'>
                                    <i class='fa-solid ${item.icon} ${item.color} text-xl group-hover:scale-110 transition'></i>
                                    <p class='text-[11px] font-bold text-gray-500'>${item.label}</p>
                                    <p class='text-base font-bold text-gray-800'>${item.count}</p>
                                </button>
                            `).join('')}
                        </div>
                    </section>

                    <section class='grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0'>
                        <div class='bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 flex flex-col min-w-0'>
                            <div class="flex justify-between items-center mb-5">
                                <h3 class='font-bold text-lg text-gray-800'>Hồ sơ cá nhân</h3>
                                <button onclick='openSettings()' class="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-gray-100 transition border border-gray-200 flex gap-2 items-center"><i class="fa-solid fa-pen"></i> Sửa</button>
                            </div>
                            <div class='grid grid-cols-1 gap-3 flex-1 min-w-0'>
                                ${renderAccountOverviewGrid(user, bridge)}
                            </div>
                        </div>

                        <div class='bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 flex flex-col min-w-0'>
                            <div class="flex justify-between items-center mb-5">
                                <h3 class='font-bold text-lg text-gray-800'>Sổ địa chỉ của tôi</h3>
                                <button onclick='openAddressFormModal()' class="bg-pink-50 text-babyPink px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-pink-100 transition border border-pink-100 flex gap-2 items-center"><i class="fa-solid fa-plus"></i> Thêm mới</button>
                            </div>
                            <div class='grid grid-cols-1 gap-4 flex-1 min-w-0 max-h-[360px] overflow-y-auto custom-scroll pr-2'>
                                ${pcAddressesHtml}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;

        area.innerHTML = mobileLayout + pcLayout;
    };

    window.openAuth = function () {
        ensureAuthKeyboardSupport();
        const bridge = getBridge();
        if (bridge.openModalShell) bridge.openModalShell('auth-page');
        else {
            const page = document.getElementById('auth-page');
            if (page) page.classList.add('is-open');
        }
        focusAuthField('login');
    };

    window.closeAuth = function () {
        const bridge = getBridge();
        if (bridge.closeModalShell) bridge.closeModalShell('auth-page');
        else {
            const page = document.getElementById('auth-page');
            if (page) page.classList.remove('is-open');
        }
    };

    window.switchAuthTab = function (tab) {
        if (tab === 'login') {
            document.getElementById('auth-login-form').classList.replace('hidden', 'flex');
            document.getElementById('auth-register-form').classList.replace('flex', 'hidden');
            document.getElementById('tab-login-btn').className = 'flex-1 py-2 font-bold text-babyPink border-b-2 border-babyPink';
            document.getElementById('tab-register-btn').className = 'flex-1 py-2 font-bold text-gray-400 border-b-2 border-transparent';
        } else {
            document.getElementById('auth-login-form').classList.replace('flex', 'hidden');
            document.getElementById('auth-register-form').classList.replace('hidden', 'flex');
            document.getElementById('tab-register-btn').className = 'flex-1 py-2 font-bold text-babyPink border-b-2 border-babyPink';
            document.getElementById('tab-login-btn').className = 'flex-1 py-2 font-bold text-gray-400 border-b-2 border-transparent';
        }
        focusAuthField(tab);
    };

    window.togglePasswordVisibility = function (inputId, toggleId) {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);
        if (!input || !toggle) return;
        const showing = input.getAttribute('type') === 'text';
        input.setAttribute('type', showing ? 'password' : 'text');
        toggle.innerHTML = showing ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    };

    window.handleRegister = async function () { 
        const bridge = getBridge();
        const name = String((document.getElementById('reg-name') || {}).value || '').trim();
        const email = String((document.getElementById('reg-email') || {}).value || '').trim();
        const phone = String((document.getElementById('reg-phone') || {}).value || '').trim();
        const address = String((document.getElementById('reg-address') || {}).value || '').trim();
        const password = String((document.getElementById('reg-pass') || {}).value || '').trim();

        if (!name || !phone || !password) return bridge.showToast && bridge.showToast('Vui lòng nhập đủ họ tên, số điện thoại và mật khẩu.', 'warning');
        if (password.length < 6) return bridge.showToast && bridge.showToast('Mật khẩu cần tối thiểu 6 ký tự.', 'warning');
        await (bridge.waitForRetailFirebaseReady ? bridge.waitForRetailFirebaseReady() : Promise.resolve());
        if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase())) return bridge.showToast && bridge.showToast('Firebase chưa sẵn sàng.', 'warning');

        try {
            const result = await window.retailFirebase.registerCustomer({ name, email, phone, address, password });
            const normalizedProfile = bridge.normalizeUserData ? bridge.normalizeUserData({
                ...(bridge.getCurrentUser ? bridge.getCurrentUser() : {}),
                ...(result.profile || {}),
                authUid: result.authUser ? result.authUser.uid : '',
                email: (result.profile && result.profile.email) || email,
                phone: (result.profile && result.profile.phone) || phone,
                shippingPhone: (result.profile && result.profile.shippingPhone) || phone,
                address: (result.profile && result.profile.address) || address
            }) : null;
            if (bridge.setCurrentUser && bridge.normalizeUserData) bridge.setCurrentUser(normalizedProfile);
            if (bridge.saveState) bridge.saveState();
            if (typeof window.requestCatalogSyncAfterAuth === 'function') window.requestCatalogSyncAfterAuth();
            if (window.homeTabModule && typeof window.homeTabModule.renderGuestCta === 'function') window.homeTabModule.renderGuestCta();
            window.closeAuth();
            window.renderAccountTab();
            bridge.showToast && bridge.showToast('Đã đăng ký thành công!', 'success');
        } catch (error) {
            bridge.showToast && bridge.showToast(mapAccountError(error, 'register'), 'error');
        }
    };

    window.handleLogin = async function () { 
        const bridge = getBridge();
        const loginId = String((document.getElementById('login-email') || {}).value || '').trim();
        const password = String((document.getElementById('login-pass') || {}).value || '').trim();

        if (!loginId || !password) return bridge.showToast && bridge.showToast('Nhập email/số điện thoại và mật khẩu!', 'warning');
        await (bridge.waitForRetailFirebaseReady ? bridge.waitForRetailFirebaseReady() : Promise.resolve());
        if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase())) return bridge.showToast && bridge.showToast('Firebase chưa sẵn sàng.', 'warning');

        try {
            const result = await window.retailFirebase.loginCustomer(loginId, password);
            const normalizedProfile = bridge.normalizeUserData ? bridge.normalizeUserData({
                ...(bridge.getCurrentUser ? bridge.getCurrentUser() : {}),
                ...(result.profile || {}),
                authUid: result.authUser ? result.authUser.uid : '',
                email: (result.profile && result.profile.email) || (result.authUser && result.authUser.email) || '',
                phone: (result.profile && result.profile.phone) || (loginId.indexOf('@') > -1 ? '' : loginId.replace(/\D/g, '')),
                shippingPhone: (result.profile && result.profile.shippingPhone) || ((result.profile && result.profile.phone) || (loginId.indexOf('@') > -1 ? '' : loginId.replace(/\D/g, '')))
            }) : null;
            if (bridge.setCurrentUser && bridge.normalizeUserData) bridge.setCurrentUser(normalizedProfile);
            if (bridge.syncOrdersFromFirebase) await bridge.syncOrdersFromFirebase({ force: true });
            if (bridge.saveState) bridge.saveState();
            if (typeof window.requestCatalogSyncAfterAuth === 'function') window.requestCatalogSyncAfterAuth();
            if (window.homeTabModule && typeof window.homeTabModule.renderGuestCta === 'function') window.homeTabModule.renderGuestCta();
            window.closeAuth();
            window.renderAccountTab();
            if (bridge.showToast) bridge.showToast('Đăng nhập thành công!', 'success');
        } catch (error) {
            bridge.showToast && bridge.showToast(mapAccountError(error, 'login'), 'error');
        }
    };

    window.handleGoogleAuth = async function (mode) { 
        const bridge = getBridge();
        await (bridge.waitForRetailFirebaseReady ? bridge.waitForRetailFirebaseReady() : Promise.resolve());
        if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase())) return bridge.showToast && bridge.showToast('Firebase chưa sẵn sàng.', 'warning');

        try {
            const result = await window.retailFirebase.loginWithGoogle();
            const profile = result && result.profile ? result.profile : {};
            const authUser = result && result.authUser ? result.authUser : null;
            const normalizedProfile = bridge.normalizeUserData ? bridge.normalizeUserData({
                ...(bridge.getCurrentUser ? bridge.getCurrentUser() : {}),
                ...profile,
                authUid: authUser ? authUser.uid : '',
                email: (profile && profile.email) || (authUser && authUser.email) || '',
                name: (profile && profile.name) || (authUser && authUser.displayName) || '',
                phone: (profile && profile.phone) || '',
                shippingPhone: (profile && profile.shippingPhone) || (profile && profile.phone) || ''
            }) : null;
            if (bridge.setCurrentUser && bridge.normalizeUserData) bridge.setCurrentUser(normalizedProfile);
            if (bridge.syncOrdersFromFirebase && authUser && authUser.uid) await bridge.syncOrdersFromFirebase({ force: true });
            if (bridge.saveState) bridge.saveState();
            if (typeof window.requestCatalogSyncAfterAuth === 'function') window.requestCatalogSyncAfterAuth();
            if (window.homeTabModule && typeof window.homeTabModule.renderGuestCta === 'function') window.homeTabModule.renderGuestCta();
            window.closeAuth();
            window.renderAccountTab();
            if (bridge.showToast) bridge.showToast('Đăng nhập Gmail thành công!', 'success');
        } catch (error) {
            bridge.showToast && bridge.showToast(mapAccountError(error, mode === 'register' ? 'register' : 'login'), 'error');
        }
    };

    window.handleForgotPassword = async function () { 
        const bridge = getBridge();
        const identifier = String((document.getElementById('login-email') || {}).value || '').trim();
        if (!identifier) return bridge.showToast && bridge.showToast('Nhập email hoặc số điện thoại để lấy lại mật khẩu.', 'warning');
        await (bridge.waitForRetailFirebaseReady ? bridge.waitForRetailFirebaseReady() : Promise.resolve());
        if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase())) return bridge.showToast && bridge.showToast('Firebase chưa sẵn sàng.', 'warning');

        try {
            const result = await window.retailFirebase.requestPasswordReset(identifier);
            if (result && result.mode === 'zalo') {
                if (typeof window.openPasswordResetSupport === 'function') window.openPasswordResetSupport(identifier);
                bridge.showToast && bridge.showToast('Shop sẽ hỗ trợ cấp lại mật khẩu qua Zalo.', 'info');
                return;
            }
            bridge.showToast && bridge.showToast('Đã gửi email đặt lại mật khẩu.', 'success');
        } catch (error) {
            bridge.showToast && bridge.showToast(mapAccountError(error, 'login'), 'error');
        }
    };

    window.processLogout = function () {
        const bridge = getBridge();
        if (!bridge.openConfirmModal) return;
        bridge.openConfirmModal('Bạn muốn đăng xuất?', () => {
            Promise.resolve(window.retailFirebase && typeof window.retailFirebase.logout === 'function' ? window.retailFirebase.logout() : null)
            .finally(() => {
                if (bridge.setCurrentUser) bridge.setCurrentUser(null);
                if (bridge.saveState) bridge.saveState();
                localStorage.removeItem('ta_cached_name');
                
                // Bắt buộc update lại Badge về Đăng nhập ngay lập tức
                window.updateHeaderUserBadge();
                
                if (typeof window.requestCatalogSyncAfterAuth === 'function') window.requestCatalogSyncAfterAuth();
                if (window.homeTabModule && typeof window.homeTabModule.renderGuestCta === 'function') window.homeTabModule.renderGuestCta();
                window.renderAccountTab();
                bridge.showToast && bridge.showToast('Đã đăng xuất.', 'success');
            });
        });
    };

    window.openSettings = function () {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;
        ensureAccountInlineStyles();
        ensureAccountFeatureShell();

        // Layout cho Mobile (Menu quản lý mở Modal Popup)
        const mobileSettingsHtml = `
            <div class="lg:hidden space-y-4 min-w-0 pb-6">
                <section class="bg-white rounded-[24px] border border-gray-100 shadow-sm p-1 min-w-0">
                    <div class="px-4 py-3 border-b border-gray-50"><h3 class="font-bold text-gray-800 text-sm">Hồ sơ cá nhân</h3></div>
                    <div class="flex flex-col min-w-0 px-2">
                        ${renderSettingsActionRow('Ảnh đại diện', 'Đổi ảnh', "openProfileFieldEditor('avatar')")}
                        ${renderSettingsActionRow('Họ tên', user.name || 'Khách Lẻ Web', "openProfileFieldEditor('name')")}
                        ${renderSettingsActionRow('Tiểu sử', user.bio || 'Chưa cập nhật', "openProfileFieldEditor('bio')")}
                        ${renderSettingsActionRow('Giới tính', user.gender || 'Chưa cập nhật', "openProfileFieldEditor('gender')")}
                        ${renderSettingsActionRow('Ngày sinh', bridge.formatBirthdayDisplay ? bridge.formatBirthdayDisplay(user.birthday) : (user.birthday || 'Thiết lập ngay'), "openProfileFieldEditor('birthday')")}
                        ${renderSettingsActionRow('Cá nhân', user.personalInfo || 'Thiết lập ngay', "openProfileFieldEditor('personalInfo')", { accent: true })}
                        ${renderSettingsActionRow('Hôn nhân', user.maritalStatus || 'Chưa cập nhật', "openProfileFieldEditor('maritalStatus')")}
                        ${renderSettingsActionRow('Sở thích', formatListValue(user.interests) || 'Chưa cập nhật', "openProfileFieldEditor('interests')")}
                    </div>
                </section>
                <section class="bg-white rounded-[24px] border border-gray-100 shadow-sm p-1 min-w-0">
                    <div class="px-4 py-3 border-b border-gray-50"><h3 class="font-bold text-gray-800 text-sm">Bảo mật</h3></div>
                    <div class="flex flex-col min-w-0 px-2">
                        ${renderSettingsStaticRow('SĐT', user.phone || 'Chưa cập nhật')}
                        ${renderSettingsStaticRow('Email', user.email || 'Chưa cập nhật')}
                        <button onclick="openChangePasswordModal()" class="w-full bg-gray-50 text-gray-600 font-bold rounded-xl py-2.5 text-sm my-3 border border-gray-200">Đổi mật khẩu</button>
                    </div>
                </section>
            </div>
        `;

        // Layout PC Inline Cài Đặt (Đã gộp thành 1 khung duy nhất)
        const pcSettingsHtml = `
            <div class="hidden lg:grid grid-cols-[280px,minmax(0,1fr)] gap-8 bg-white rounded-[28px] p-8 border border-gray-100 shadow-sm w-full mb-6">
                
                <div class="flex flex-col gap-8 border-r border-gray-100 pr-8">
                    <div class="flex flex-col items-center">
                        <div class="w-28 h-28 rounded-full bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center text-babyPink text-4xl mb-4 shadow-sm">
                            ${user.avatar ? `<img src="${bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(user.avatar, 'w300') : user.avatar}" loading="lazy" decoding="async" class="w-full h-full object-cover"/>` : `<i class="fa-regular fa-user"></i>`}
                        </div>
                        <input id="pc-input-avatar" value="${user.avatar || ''}" class="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-full text-xs text-center mb-2 focus:outline-babyPink" placeholder="Dán URL ảnh..." type="text"/>
                        <p class="text-[10px] text-gray-400 font-bold mb-2">- HOẶC -</p>
                        <input id="pc-file-avatar" class="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-babyPink hover:file:bg-pink-100 cursor-pointer w-full overflow-hidden" type="file" accept="image/*"/>
                    </div>

                    <div class="w-full pt-6 border-t border-gray-50">
                        <h3 class="font-bold text-base text-gray-800 mb-4">Bảo mật tài khoản</h3>
                        <div class="space-y-4 mb-5">
                            <div>
                                <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Số điện thoại</label>
                                <div class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 font-bold cursor-not-allowed">${user.phone || 'Chưa cập nhật'}</div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                                <div class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 font-bold cursor-not-allowed">${user.email || 'Chưa cập nhật'}</div>
                            </div>
                        </div>
                        <button onclick="openChangePasswordModal()" class="w-full bg-gray-50 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-bold hover:bg-gray-100 transition"><i class="fa-solid fa-key mr-2"></i> Đổi mật khẩu</button>
                    </div>
                </div>
                
                <div class="flex flex-col h-full">
                    <div class="grid grid-cols-2 gap-x-6 gap-y-5 flex-1">
                        <div class="col-span-2 sm:col-span-1">
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Họ tên</label>
                            <input id="pc-input-name" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-babyPink shadow-sm" value="${user.name || ''}" placeholder="Nhập họ tên"/>
                        </div>
                        <div class="col-span-2 sm:col-span-1">
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Ngày sinh</label>
                            <input id="pc-input-birthday" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-babyPink shadow-sm" type="date" value="${user.birthday || ''}"/>
                        </div>
                        <div class="col-span-2 sm:col-span-1">
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Giới tính</label>
                            <select id="pc-input-gender" class="clay-input w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-babyPink shadow-sm">
                                <option ${user.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                                <option ${user.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                                <option ${user.gender === 'Khác' ? 'selected' : ''}>Khác</option>
                                <option ${user.gender === 'Chưa cập nhật' ? 'selected' : ''}>Chưa cập nhật</option>
                            </select>
                        </div>
                        <div class="col-span-2 sm:col-span-1">
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Hôn nhân</label>
                            <select id="pc-input-maritalStatus" class="clay-input w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-babyPink shadow-sm">
                                <option ${user.maritalStatus === 'Chưa cập nhật' ? 'selected' : ''}>Chưa cập nhật</option>
                                <option ${user.maritalStatus === 'Độc thân' ? 'selected' : ''}>Độc thân</option>
                                <option ${user.maritalStatus === 'Đã kết hôn' ? 'selected' : ''}>Đã kết hôn</option>
                                <option ${user.maritalStatus === 'Có con nhỏ' ? 'selected' : ''}>Có con nhỏ</option>
                            </select>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tiểu sử</label>
                            <textarea id="pc-input-bio" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-babyPink shadow-sm h-20 resize-none">${user.bio || ''}</textarea>
                        </div>
                        <div class="col-span-2 sm:col-span-1">
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Sở thích</label>
                            <textarea id="pc-input-interests" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-babyPink shadow-sm h-20 resize-none" placeholder="Vd: Đồ chơi gỗ...">${formatListValue(user.interests)}</textarea>
                        </div>
                        <div class="col-span-2 sm:col-span-1">
                            <label class="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Đặc điểm</label>
                            <textarea id="pc-input-personalInfo" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-babyPink shadow-sm h-20 resize-none" placeholder="Vd: Mẹ bỉm sữa...">${user.personalInfo === 'Thiết lập ngay' ? '' : (user.personalInfo || '')}</textarea>
                        </div>
                    </div>

                    <div class="flex justify-end mt-6 pt-6 border-t border-gray-50">
                        <button onclick="saveAllSettingsPC()" class="bg-babyPink text-white px-10 py-3.5 rounded-2xl font-bold shadow-sm hover:bg-pink-500 transition"><i class="fa-solid fa-floppy-disk mr-2"></i> Lưu thay đổi hồ sơ</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('settings-content').innerHTML = `
            <div id="settings-view" class="w-full">
                ${mobileSettingsHtml}
                ${pcSettingsHtml}
            </div>
        `;

        openAccountModal('account-settings-page');
    };

    window.closeSettings = function () {
        closeAccountModal('account-settings-page');
    };

    // --- API ĐỊA GIỚI HÀNH CHÍNH VIỆT NAM (V2: Tỉnh/Thành -> Phường/Xã) ---
    let useAddressApi = true;
    function syncAddressModeUi() {
        const apiBlock = document.getElementById('addr-form-api');
        const manualBlock = document.getElementById('addr-form-manual');
        if(apiBlock) apiBlock.classList.toggle('hidden', !useAddressApi);
        if(manualBlock) manualBlock.classList.toggle('hidden', useAddressApi);
        const btn = document.getElementById('addr-mode-btn');
        if(btn) btn.innerText = useAddressApi ? 'Nhập địa chỉ thủ công' : 'Điền địa chỉ từ API';
    }

    function copyAddressPhoneValue(sourceId, targetId) {
        const sourceEl = document.getElementById(sourceId);
        const targetEl = document.getElementById(targetId);
        if (!sourceEl || !targetEl) return;
        const sourceValue = String(sourceEl.value || '').trim();
        if (!sourceValue || String(targetEl.value || '').trim()) return;
        targetEl.value = sourceValue;
    }

    window.toggleAddressMode = async function() {
        if (useAddressApi) {
            copyAddressPhoneValue('addr-form-phone-api', 'addr-form-phone-manual');
            useAddressApi = false;
            syncAddressModeUi();
            return;
        }
        copyAddressPhoneValue('addr-form-phone-manual', 'addr-form-phone-api');
        await window.initAddressForm({ preservePhone: true });
    };

    window.initAddressForm = async function(options) {
        const opts = options || {};
        useAddressApi = true;
        syncAddressModeUi();
        const apiPhoneEl = document.getElementById('addr-form-phone-api');
        const manualPhoneValue = String((document.getElementById('addr-form-phone-manual') || {}).value || '').trim();
        const streetEl = document.getElementById('addr-street');
        const provSelect = document.getElementById('addr-province');
        const wardSelect = document.getElementById('addr-ward');
        if (!opts.preserveLocation) {
            if (streetEl) streetEl.value = '';
            if (provSelect) provSelect.value = '';
            if (wardSelect) {
                wardSelect.innerHTML = '<option value="">Chọn Phường/Xã (theo địa giới 2026)</option>';
                wardSelect.disabled = true;
            }
        }

        try {
            const res = await fetch('https://provinces.open-api.vn/api/v2/p/');
            if(!res.ok) throw new Error('API failed');
            const data = await res.json();
            if(provSelect) provSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>' + data.map(p => `<option value="${p.code}" data-name="${p.name}">${p.name}</option>`).join('');
            if (apiPhoneEl && !String(apiPhoneEl.value || '').trim() && manualPhoneValue) apiPhoneEl.value = manualPhoneValue;
            return true;
        } catch(e) {
            useAddressApi = false;
            syncAddressModeUi();
            copyAddressPhoneValue('addr-form-phone-api', 'addr-form-phone-manual');
            return false;
        }
    };

    window.loadAddressDistricts = async function(provCode) {
        return window.loadAddressWards(provCode);
    };

    window.loadAddressWards = async function(provCode) {
        const wardSelect = document.getElementById('addr-ward');
        if(!wardSelect) return;
        if(!provCode) {
            wardSelect.innerHTML = '<option value="">Chọn Phường/Xã (theo địa giới 2026)</option>';
            wardSelect.disabled = true;
            return;
        }
        
        wardSelect.innerHTML = '<option value="">Đang tải...</option>';
        wardSelect.disabled = true;
        try {
            const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${provCode}?depth=2`);
            if(!res.ok) throw new Error('API failed');
            const data = await res.json();
            wardSelect.innerHTML = '<option value="">Chọn Phường/Xã (theo địa giới 2026)</option>' + (data.wards || []).map(w => `<option value="${w.code}" data-name="${w.name}">${w.name}</option>`).join('');
            wardSelect.disabled = false;
        } catch(e) { console.error(e); }
    };


    // --- MỞ MODAL SỔ ĐỊA CHỈ (HIỂN THỊ DANH SÁCH CHO MOBILE) ---
    window.openAddressBookModal = function () {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;
        ensureAccountInlineStyles();
        ensureAccountFeatureShell();

        let addressesHtml = '<p class="text-sm text-gray-400 text-center py-8 col-span-full font-medium">Bạn chưa lưu địa chỉ nào.</p>';
        if (Array.isArray(user.addresses) && user.addresses.length > 0) {
            addressesHtml = user.addresses.map(addr => generateAddressCardHtml(addr, false)).join('');
        }

        const listViewHtml = `
            <div id="address-list-view" class="w-full h-full flex flex-col">
                <div class="flex justify-between items-center mb-5">
                    <h3 class="font-bold text-gray-800 text-base">Danh sách của bạn</h3>
                    <button onclick="openAddressFormModal()" class="bg-pink-50 text-babyPink font-bold px-4 py-2 rounded-xl text-xs">+ Thêm mới</button>
                </div>
                <div class="space-y-4 pb-10">
                    ${addressesHtml}
                </div>
            </div>
        `;

        document.getElementById('address-book-content').innerHTML = listViewHtml;
        openAccountModal('address-book-modal');
    };

    window.closeAddressBookModal = function () {
        closeAccountModal('address-book-modal');
    };

    // --- MODAL FORM NHẬP LIỆU ĐỊA CHỈ (DÙNG CHUNG PC & MOBILE) ---
    window.openAddressFormModal = function (addressId = null) {
        const user = getNormalizedUser();
        if (!user) return;

        let editAddress = null;
        if (addressId && Array.isArray(user.addresses)) {
            editAddress = user.addresses.find(a => a.id === addressId);
        }

        document.getElementById('address-form-title').innerText = editAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới';
        document.getElementById('address-form-editing-id').value = editAddress ? addressId : '';
        document.getElementById('address-form-default').checked = editAddress ? !!editAddress.isDefault : false;
        
        // Luôn cho phép gõ tay hoặc chọn list. Mặc định là API trừ khi đang edit
        if (editAddress && editAddress.text) {
            useAddressApi = false;
            syncAddressModeUi();
            document.getElementById('address-form-text').value = editAddress.text || '';
            document.getElementById('addr-form-phone-manual').value = editAddress.phone || '';
        } else {
            document.getElementById('addr-form-phone-api').value = '';
            document.getElementById('addr-street').value = '';
            const wEl = document.getElementById('addr-ward');
            if(wEl) { wEl.innerHTML = '<option value="">Chọn Phường/Xã (theo địa giới 2026)</option>'; wEl.disabled = true; }
            syncAddressModeUi();
            initAddressForm();
        }

        openAccountModal('address-form-modal');
    };

    window.closeAddressFormModal = function () {
        closeAccountModal('address-form-modal');
    };

    window.saveAddressForm = async function () {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;

        let text = "";
        let phone = "";
        
        if (useAddressApi) {
            const provEl = document.getElementById('addr-province');
            const wardEl = document.getElementById('addr-ward');
            const street = String(document.getElementById('addr-street').value || '').trim();
            phone = String(document.getElementById('addr-form-phone-api').value || '').trim();
            
            const pName = provEl.options[provEl.selectedIndex]?.getAttribute('data-name') || '';
            const wName = wardEl.options[wardEl.selectedIndex]?.getAttribute('data-name') || '';

            if (!pName || !wName || !street) {
                 return bridge.showToast && bridge.showToast('Vui lòng chọn tỉnh/thành, phường/xã và số nhà!', 'warning');
            }
            text = [street, wName, pName].join(', ');
        } else {
            text = String(document.getElementById('address-form-text').value || '').trim();
            phone = String(document.getElementById('addr-form-phone-manual').value || '').trim();
            if (!text) return bridge.showToast && bridge.showToast('Vui lòng nhập địa chỉ nhận hàng!', 'warning');
        }

        const isDefault = !!document.getElementById('address-form-default').checked;
        const editingId = document.getElementById('address-form-editing-id').value;

        if (!phone) return bridge.showToast && bridge.showToast('Vui lòng nhập số điện thoại!', 'warning');
        
        if (!Array.isArray(user.addresses)) user.addresses = [];

        if (isDefault || user.addresses.length === 0 || (editingId && user.addresses.length === 1)) {
            user.addresses.forEach((a) => { a.isDefault = false; });
        }
        const nextIsDefault = isDefault || user.addresses.length === 0;

        if (editingId) {
            const addressIndex = user.addresses.findIndex(a => a.id === editingId);
            if (addressIndex > -1) {
                user.addresses[addressIndex].text = text;
                user.addresses[addressIndex].phone = phone;
                user.addresses[addressIndex].isDefault = nextIsDefault;
            }
        } else {
            user.addresses.push({ id: `addr_${Date.now()}`, text, phone, isDefault: nextIsDefault });
        }

        if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) user.addresses[0].isDefault = true;

        const defaultAddress = getDefaultAddress(user);
        if (defaultAddress) {
            user.address = defaultAddress.text;
            user.shippingPhone = defaultAddress.phone || user.shippingPhone || '';
        }

        if (bridge.setCurrentUser) bridge.setCurrentUser(user);
        if (bridge.saveState) bridge.saveState();
        await syncCustomerProfileNow(bridge);
        
        closeAddressFormModal();
        
        if (document.getElementById('address-book-modal') && document.getElementById('address-book-modal').classList.contains('is-open')) {
            openAddressBookModal();
        }
        window.renderAccountTab();
        
        bridge.showToast && bridge.showToast(editingId ? 'Đã cập nhật địa chỉ.' : 'Đã lưu địa chỉ giao hàng.', 'success');
    };

    window.saveAllSettingsPC = async function () {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;

        const name = String(document.getElementById('pc-input-name').value || '').trim();
        if (!name) return bridge.showToast && bridge.showToast('Họ tên không được để trống.', 'warning');

        let avatarUrl = String(document.getElementById('pc-input-avatar').value || '').trim();
        const fileInput = document.getElementById('pc-file-avatar');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const uploadEndpoint = getUploadEndpoint(bridge);
            try {
                const formData = new FormData();
                formData.append('avatar', fileInput.files[0]);
                const response = await fetch(uploadEndpoint, { method: 'POST', body: formData });
                const result = await response.json();
                if (!response.ok || !result.url) throw new Error('UPLOAD_FAILED');
                avatarUrl = result.url;
            } catch (error) {
                return bridge.showToast && bridge.showToast(`Upload ảnh thất bại. Kiểm tra endpoint ${uploadEndpoint}.`, 'warning');
            }
        }

        user.avatar = avatarUrl;
        user.name = name;
        user.birthday = document.getElementById('pc-input-birthday').value;
        user.gender = document.getElementById('pc-input-gender').value;
        user.maritalStatus = document.getElementById('pc-input-maritalStatus').value;
        user.bio = document.getElementById('pc-input-bio').value;
        user.personalInfo = document.getElementById('pc-input-personalInfo').value || 'Thiết lập ngay';
        user.interests = parseListValue(document.getElementById('pc-input-interests').value);
        
        const age = calculateAgeFromBirthday(user.birthday);
        user.age = age > 0 ? String(age) : '';

        if (bridge.setCurrentUser) bridge.setCurrentUser(user);
        if (bridge.saveState) bridge.saveState();
        await syncCustomerProfileNow(bridge);
        window.closeSettings();
        window.renderAccountTab();
        bridge.showToast && bridge.showToast('Lưu hồ sơ thành công!', 'success');
    };

    window.openProfileFieldEditor = function (field) {
        if (window.innerWidth >= 1024 && field !== 'passwordChange' && field !== 'avatar') return;
        
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;
        if (bridge.setActiveProfileField) bridge.setActiveProfileField(field);

        const panel = document.getElementById('settings-editor-panel');
        const title = document.getElementById('settings-editor-title');
        const body = document.getElementById('settings-editor-body');
        if (!panel || !title || !body) return;

        const templates = {
            avatar: { title: 'Ảnh đại diện', html: `<input id="mobile-field-input" value="${user.avatar || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Dán URL ảnh" type="text"/><p class="my-2 text-center text-xs font-bold text-gray-400">HOẶC TẢI LÊN</p><input id="mobile-avatar-file" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-2 text-sm shadow-sm" type="file" accept="image/*"/>` },
            name: { title: 'Tên hiển thị', html: `<input id="mobile-field-input" value="${user.name || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-base font-bold focus:outline-babyPink shadow-sm" type="text"/>` },
            bio: { title: 'Tiểu sử', html: `<textarea id="mobile-field-input" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm h-24 resize-none focus:outline-babyPink shadow-sm">${user.bio || ''}</textarea>` },
            gender: { title: 'Giới tính', html: `<select id="mobile-field-input" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm font-bold focus:outline-babyPink shadow-sm"><option ${user.gender === 'Nam' ? 'selected' : ''}>Nam</option><option ${user.gender === 'Nữ' ? 'selected' : ''}>Nữ</option><option ${user.gender === 'Khác' ? 'selected' : ''}>Khác</option><option ${user.gender === 'Chưa cập nhật' ? 'selected' : ''}>Chưa cập nhật</option></select>` },
            birthday: { title: 'Ngày sinh', html: `<input id="mobile-field-input" value="${user.birthday || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm font-bold focus:outline-babyPink shadow-sm" type="date"/>` },
            personalInfo: { title: 'Đặc điểm cá nhân', html: `<input id="mobile-field-input" value="${user.personalInfo === 'Thiết lập ngay' ? '' : (user.personalInfo || '')}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Vd: Mẹ bỉm sữa..."/>` },
            maritalStatus: { title: 'Tình trạng gia đình', html: `<select id="mobile-field-input" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm font-bold focus:outline-babyPink shadow-sm"><option ${user.maritalStatus === 'Chưa cập nhật' ? 'selected' : ''}>Chưa cập nhật</option><option ${user.maritalStatus === 'Độc thân' ? 'selected' : ''}>Độc thân</option><option ${user.maritalStatus === 'Đã kết hôn' ? 'selected' : ''}>Đã kết hôn</option><option ${user.maritalStatus === 'Có con nhỏ' ? 'selected' : ''}>Có con nhỏ</option></select>` },
            interests: { title: 'Sở thích đồ chơi', html: `<textarea id="mobile-field-input" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm h-24 resize-none focus:outline-babyPink shadow-sm">${formatListValue(user.interests)}</textarea>` },
            passwordChange: {
                title: 'Đổi mật khẩu',
                html: `
                    <div class="space-y-3">
                        <div class="relative"><input id="mobile-current-pass" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 pr-10 text-sm focus:outline-babyPink shadow-sm" placeholder="Mật khẩu hiện tại" type="password"/><button class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-babyPink" onclick="togglePasswordVisibility('mobile-current-pass', 'mobile-current-pass-toggle')" id="mobile-current-pass-toggle" type="button"><i class="fa-regular fa-eye"></i></button></div>
                        <div class="relative"><input id="mobile-new-pass" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 pr-10 text-sm focus:outline-babyPink shadow-sm" placeholder="Mật khẩu mới" type="password"/><button class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-babyPink" onclick="togglePasswordVisibility('mobile-new-pass', 'mobile-new-pass-toggle')" id="mobile-new-pass-toggle" type="button"><i class="fa-regular fa-eye"></i></button></div>
                        <div class="relative"><input id="mobile-confirm-pass" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 pr-10 text-sm focus:outline-babyPink shadow-sm" placeholder="Nhập lại mật khẩu mới" type="password"/><button class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-babyPink" onclick="togglePasswordVisibility('mobile-confirm-pass', 'mobile-confirm-pass-toggle')" id="mobile-confirm-pass-toggle" type="button"><i class="fa-regular fa-eye"></i></button></div>
                    </div>
                `
            }
        };

        const template = templates[field];
        if (!template) return;
        title.innerText = template.title;
        body.innerHTML = template.html;
        
        panel.classList.remove('lg:hidden');
        openAccountModal('settings-editor-panel');
    };

    window.closeProfileFieldEditor = function () {
        const bridge = getBridge();
        if (bridge.setActiveProfileField) bridge.setActiveProfileField('');
        const panel = document.getElementById('settings-editor-panel');
        if (panel) {
            closeAccountModal('settings-editor-panel');
            setTimeout(() => panel.classList.add('lg:hidden'), 300); 
        }
    };

    window.openChangePasswordModal = function () {
        window.openProfileFieldEditor('passwordChange');
    };

    window.saveProfileFieldMobile = async function () {
        const bridge = getBridge();
        const user = getNormalizedUser();
        const activeField = bridge.getActiveProfileField ? bridge.getActiveProfileField() : '';
        const input = document.getElementById('mobile-field-input');
        if (!activeField || !user) return;

        if (activeField === 'passwordChange') {
            const currentPassword = String((document.getElementById('mobile-current-pass') || {}).value || '').trim();
            const newPassword = String((document.getElementById('mobile-new-pass') || {}).value || '').trim();
            const confirmPassword = String((document.getElementById('mobile-confirm-pass') || {}).value || '').trim();
            if (!currentPassword || !newPassword || !confirmPassword) return bridge.showToast && bridge.showToast('Vui lòng nhập đủ thông tin đổi mật khẩu.', 'warning');
            if (newPassword.length < 6) return bridge.showToast && bridge.showToast('Mật khẩu mới cần tối thiểu 6 ký tự.', 'warning');
            if (newPassword !== confirmPassword) return bridge.showToast && bridge.showToast('Mật khẩu xác nhận chưa khớp.', 'warning');
            try {
                await window.retailFirebase.changePassword(currentPassword, newPassword);
                window.closeProfileFieldEditor();
                bridge.showToast && bridge.showToast('Đổi mật khẩu thành công.', 'success');
            } catch (error) {
                bridge.showToast && bridge.showToast(mapAccountError(error, 'login'), 'error');
            }
            return;
        }

        if (!input) return;

        let value = String(input.value || '').trim();
        if (activeField === 'name' && !value) return bridge.showToast && bridge.showToast('Tên hiển thị không được để trống.', 'warning');
        
        if (activeField === 'avatar') {
            const fileInput = document.getElementById('mobile-avatar-file');
            if (fileInput && fileInput.files && fileInput.files[0]) {
                const uploadEndpoint = getUploadEndpoint(bridge);
                try {
                    const formData = new FormData();
                    formData.append('avatar', fileInput.files[0]);
                    const response = await fetch(uploadEndpoint, { method: 'POST', body: formData });
                    const result = await response.json();
                    if (!response.ok || !result.url) throw new Error('UPLOAD_FAILED');
                    value = result.url;
                } catch (error) {
                    return bridge.showToast && bridge.showToast(`Upload ảnh thất bại. Kiểm tra endpoint ${uploadEndpoint}.`, 'warning');
                }
            }
        }

        if (activeField === 'personalInfo') user.personalInfo = value || 'Thiết lập ngay';
        else if (activeField === 'interests' || activeField === 'concerns') user[activeField] = parseListValue(value);
        else user[activeField] = value;

        if (activeField === 'birthday') {
            const age = calculateAgeFromBirthday(user.birthday);
            user.age = age > 0 ? String(age) : '';
        }

        if (bridge.setCurrentUser) bridge.setCurrentUser(user);
        if (bridge.saveState) bridge.saveState();
        await syncCustomerProfileNow(bridge);
        window.closeProfileFieldEditor();
        window.openSettings(); 
        window.renderAccountTab();
        bridge.showToast && bridge.showToast('Hồ sơ đã được cập nhật.', 'success');
    };

    window.setAddressDefault = async function (addressId) {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user || !Array.isArray(user.addresses)) return;

        user.addresses.forEach((address) => { address.isDefault = address.id === addressId; });
        const defaultAddress = getDefaultAddress(user);
        if (defaultAddress) {
            user.address = defaultAddress.text;
            user.shippingPhone = defaultAddress.phone || user.shippingPhone || '';
        }
        if (bridge.setCurrentUser) bridge.setCurrentUser(user);
        if (bridge.saveState) bridge.saveState();
        await syncCustomerProfileNow(bridge);
        
        if (document.getElementById('address-book-modal') && document.getElementById('address-book-modal').classList.contains('is-open')) {
            window.openAddressBookModal();
        }
        window.renderAccountTab();
        bridge.showToast && bridge.showToast('Đã cập nhật địa chỉ mặc định.', 'success');
    };

    window.deleteAddress = function (addressId) {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user || !Array.isArray(user.addresses) || !bridge.openConfirmModal) return;

        bridge.openConfirmModal('Bạn có chắc muốn xóa địa chỉ này?', async () => {
            user.addresses = user.addresses.filter((address) => address.id !== addressId);
            if (user.addresses.length > 0 && !user.addresses.find((address) => address.isDefault)) user.addresses[0].isDefault = true;
            const defaultAddress = getDefaultAddress(user);
            user.address = defaultAddress ? defaultAddress.text : '';
            user.shippingPhone = defaultAddress ? (defaultAddress.phone || '') : '';
            if (bridge.setCurrentUser) bridge.setCurrentUser(user);
            if (bridge.saveState) bridge.saveState();
            await syncCustomerProfileNow(bridge);
            
            if (document.getElementById('address-book-modal') && document.getElementById('address-book-modal').classList.contains('is-open')) {
                window.openAddressBookModal();
            }
            window.renderAccountTab();
            bridge.showToast && bridge.showToast('Đã xóa địa chỉ.', 'success');
        });
    };

    window.openWishlist = function () {
        ensureAccountFeatureShell();
        window.renderWishlistUI();
        openPage('wishlist-page');
    };
    window.closeWishlist = function () { closePage('wishlist-page'); };

    window.renderWishlistUI = function () {
        const bridge = getBridge();
        const container = document.getElementById('wishlist-content');
        const user = getNormalizedUser();
        const wishlistData = getSafeWishlistIds(user);
        const products = bridge.getShopProducts ? bridge.getShopProducts() : [];
        if (!container) return;

        if (!wishlistData.length) {
            container.innerHTML = `<div class='col-span-full flex flex-col items-center justify-center py-20 text-gray-400'><div class='w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-4'><i class='fa-regular fa-heart text-4xl text-babyPink opacity-60'></i></div><p class='font-bold text-base text-gray-500'>Danh sách yêu thích trống.</p></div>`;
            return;
        }

        const productMap = new Map((Array.isArray(products) ? products : []).map((product) => [String((product && product.id) || '').trim(), product]));
        container.innerHTML = wishlistData.map((productId) => {
            const safeProductId = String(productId || '').trim();
            const product = productMap.get(safeProductId) || null;
            if (!product) {
                return `
            <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-200 relative group flex flex-col h-full">
                <button onclick="toggleWishlist(event, '${escapeHtml(safeProductId)}')" class="absolute top-4 right-4 z-10 w-8 h-8 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500 hover:scale-110 transition"><i class="fa-solid fa-heart-crack"></i></button>
                <div class="rounded-xl border border-dashed border-gray-200 bg-gray-50 min-h-[128px] md:min-h-[192px] flex items-center justify-center text-center px-4">
                    <div class="space-y-2">
                        <div class="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 mx-auto">
                            <i class="fa-solid fa-box-archive"></i>
                        </div>
                        <p class="text-xs font-bold uppercase tracking-[0.18em] text-red-400">Sản phẩm ngừng bán</p>
                    </div>
                </div>
                <div class="flex-1 flex flex-col pt-3">
                    <h4 class="text-sm font-bold text-gray-700 leading-snug mb-2">Sản phẩm đã ngừng bán</h4>
                    <p class="text-xs text-gray-400 leading-relaxed">Mục yêu thích này không còn trong danh mục hiện tại. Bạn có thể xóa nó khỏi danh sách.</p>
                    <div class="mt-auto pt-3">
                        <button onclick="toggleWishlist(event, '${escapeHtml(safeProductId)}')" class="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition">Xóa khỏi yêu thích</button>
                    </div>
                </div>
            </div>
        `;
            }
            const productName = bridge.getProductDisplayName ? bridge.getProductDisplayName(product) : product.name;
            const imageHtml = renderProductImageMarkup(product.img, 'w600', 'w-full h-32 md:h-48 object-cover group-hover:scale-105 transition duration-500', {
                alt: productName,
                pictureClass: 'block'
            });
            return `
            <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative group flex flex-col h-full hover:border-pink-200 transition">
                ${bridge.renderProductBadges ? bridge.renderProductBadges(product) : ''}
                <button onclick="toggleWishlist(event, '${escapeHtml(product.id)}')" class="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-babyPink hover:scale-110 transition"><i class="fa-solid fa-heart"></i></button>
                <div onclick="openProductDetail('${escapeHtml(product.id)}')" class="cursor-pointer flex-1 flex flex-col">
                    <div class="rounded-xl overflow-hidden mb-3">
                        ${imageHtml}
                    </div>
                    <h4 class="text-sm font-bold text-gray-800 line-clamp-2 leading-snug mb-2 group-hover:text-babyPink transition">${productName}</h4>
                    <div class="mt-auto pt-2 flex justify-between items-end">
                        <span class="text-babyPink font-bold text-base">${product.price}</span>
                        <button onclick="event.stopPropagation(); ${bridge.isProductInStock && bridge.isProductInStock(product) ? `openPopup('${escapeHtml(product.id)}')` : `showToast('Sản phẩm hiện đã hết hàng.', 'warning')`}" class="${bridge.isProductInStock && bridge.isProductInStock(product) ? 'bg-babyPink text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm hover:bg-pink-500 transition' : 'bg-gray-200 text-gray-400 w-8 h-8 rounded-full shadow-sm flex items-center justify-center opacity-60 cursor-not-allowed'}" ${bridge.isProductInStock && bridge.isProductInStock(product) ? '' : 'disabled'}><i class="fa-solid fa-cart-plus text-xs"></i></button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    };

    window.openOrders = function (filterKey) {
        const bridge = getBridge();
        orderStatusFilter = arguments.length ? resolveOrderStatusFilterKey(filterKey) : 'all';
        ensureAccountFeatureShell();
        window.renderOrdersUI();
        openPage('orders-page');
        if (bridge.syncOrdersFromFirebase) {
            Promise.resolve(bridge.syncOrdersFromFirebase({ force: true }))
                .then(function () {
                    if (typeof window.renderOrdersUI === 'function') window.renderOrdersUI();
                    if (typeof window.renderAccountTab === 'function') window.renderAccountTab();
                })
                .catch(function (error) {
                    console.warn('Khong dong bo duoc danh sach don hang:', error);
                });
        }
    };
    window.closeOrders = function () {
        closePage('orders-page');
        const bridge = getBridge();
        if (bridge.closeModalShell) bridge.closeModalShell('order-detail-overlay');
    };
    window.handleOrderSearch = function (keyword) {
        orderSearchKeyword = String(keyword || '').trim();
        if (typeof window.renderOrdersUI === 'function') window.renderOrdersUI();
    };
    window.setOrderStatusFilter = function (filterKey) {
        orderStatusFilter = resolveOrderStatusFilterKey(filterKey);
        if (typeof window.renderOrdersUI === 'function') window.renderOrdersUI();
    };
    window.closeOrderDetail = function () {
        const bridge = getBridge();
        if (bridge.closeModalShell) bridge.closeModalShell('order-detail-overlay');
    };
    window.cancelCustomerOrder = function (orderId) {
        const bridge = getBridge();
        const user = getNormalizedUser();
        const order = getSafeOrders(user).find((item) => String((item && item.id) || '') === String(orderId || ''));
        if (!order || !canCancelOrder(order)) return bridge.showToast && bridge.showToast('Chỉ có thể hủy đơn ở trạng thái chờ xác nhận.', 'warning');

        const executeCancel = async function () {
            try {
                await (bridge.waitForRetailFirebaseReady ? bridge.waitForRetailFirebaseReady() : Promise.resolve());
                if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase()) || !window.retailFirebase || typeof window.retailFirebase.cancelOrder !== 'function') throw new Error('firebase-unavailable');
                await window.retailFirebase.cancelOrder(orderId);
                if (bridge.syncOrdersFromFirebase) await bridge.syncOrdersFromFirebase({ force: true });
                if (bridge.saveState) bridge.saveState();
                if (typeof window.renderOrdersUI === 'function') window.renderOrdersUI();
                if (typeof window.renderAccountTab === 'function') window.renderAccountTab();
                if (typeof window.openOrderDetail === 'function') await window.openOrderDetail(orderId);
                else window.closeOrderDetail();
                if (bridge.sendTelegramEvent) {
                    const cancelAddress = typeof order.shippingInfo === 'string'
                        ? order.shippingInfo
                        : String((order.shippingInfo && (order.shippingInfo.address || order.shippingInfo.text || order.shippingInfo.fullAddress)) || '').trim();
                    const notifyCancel = function () {
                        bridge.sendTelegramEvent('order-cancel', {
                            orderId: order.id,
                            customerName: order.customerName,
                            phone: order.phone,
                            address: cancelAddress,
                            status: 'Da huy boi khach'
                        });
                    };
                    if (bridge.scheduleIdleTask) bridge.scheduleIdleTask(notifyCancel);
                    else notifyCancel();
                }
                if (bridge.showToast) bridge.showToast('Đã hủy đơn hàng.', 'success');
            } catch (error) {
                if (bridge.showToast) bridge.showToast('Không thể hủy đơn hàng này. Vui lòng thử lại.', 'error');
            }
        };

        if (bridge.openConfirmModal) return bridge.openConfirmModal('Bạn có chắc muốn hủy đơn hàng này?', executeCancel);
        executeCancel();
    };
    window.deleteCustomerOrder = function (orderId) { window.cancelCustomerOrder(orderId); };

    window.openOrderDetail = async function (orderId) {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;
        ensureAccountFeatureShell();

        if (bridge.syncOrderDetailFromFirebase) await bridge.syncOrderDetailFromFirebase(orderId);
        const refreshedUser = getNormalizedUser();
        const order = getSafeOrders(refreshedUser).find((item) => item.id === orderId);
        if (!order) return;

        const totals = bridge.getOrderTotals ? bridge.getOrderTotals(order) : { finalAmount: 0 };
        const canCancel = canCancelOrder(order);
        const canDelete = canDeleteOrder(order);
        document.getElementById('order-detail-title').innerText = `Chi tiết Đơn ${order.id}`;
        document.getElementById('order-detail-body').innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Trạng thái</p>
                        <span class="inline-block text-sm font-bold ${canCancel ? 'text-orange-500' : (Number(order && order.rawStatus || 0) === 5 ? 'text-red-500' : 'text-emerald-600')}">${order.status}</span>
                    </div>
                    <div class="text-right">
                        <p class="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Tổng thanh toán</p>
                        <p class="text-xl font-bold text-babyPink">${bridge.formatMoney ? bridge.formatMoney(totals.finalAmount) : totals.finalAmount}</p>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-dashed border-gray-100">
                    <p class="text-[11px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-1">Thời gian đặt hàng</p>
                    <p class="text-sm font-bold text-gray-700">${escapeHtml(order.date || 'Chưa cập nhật')}</p>
                </div>
                ${canDelete || canCancel ? `
                    <div class="mt-4 pt-4 border-t border-dashed border-gray-100">
                        <button class="w-full bg-red-50 text-red-600 border border-red-100 py-2.5 rounded-xl font-bold hover:bg-red-100 transition" onclick="deleteCustomerOrder('${order.id}')">
                            Hủy đơn hàng này
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="space-y-3">
                <h4 class="font-bold text-sm text-gray-800 mb-2">Sản phẩm đã đặt</h4>
                ${(order.items || []).map((item) => {
                    const itemName = bridge.getProductDisplayName ? bridge.getProductDisplayName(item) : item.name;
                    const itemImage = renderProductImageMarkup(item.img, 'w400', 'w-full h-full object-cover', {
                        alt: itemName,
                        pictureClass: 'block w-full h-full'
                    });
                    return `
                    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex gap-3">
                        <div class="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-50">
                            ${itemImage}
                        </div>
                        <div class="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 class="font-bold text-sm text-gray-800 line-clamp-2">${itemName}</h4>
                            ${item.variantInfo ? `<p class="text-xs text-gray-400 mt-1">${item.variantInfo}</p>` : ''}
                            <div class="flex justify-between items-center mt-auto pt-2">
                                <span class="text-xs text-gray-500 font-bold">SL: x${item.quantity}</span>
                                <span class="font-bold text-sm text-babyPink">${item.price}</span>
                            </div>
                        </div>
                    </div>
                `;
                }).join('')}
            </div>
        `;
        if (bridge.openModalShell) bridge.openModalShell('order-detail-overlay');
    };

    window.renderOrdersUI = function () {
        const bridge = getBridge();
        const container = document.getElementById('orders-content');
        const user = getNormalizedUser();
        if (!container) return;

        const orders = getSafeOrders(user);
        if (!orders.length) {
            container.innerHTML = `<div class='flex flex-col items-center justify-center py-20 text-gray-400'><div class='w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4'><i class='fa-solid fa-box-open text-4xl opacity-40'></i></div><p class='font-bold text-base text-gray-500'>Bạn chưa có đơn hàng nào.</p><button onclick='closeOrders(); goToTab("tab-home");' class='mt-4 border border-babyPink text-babyPink bg-pink-50 px-5 py-2 rounded-xl text-sm font-bold'>Mua sắm ngay</button></div>`;
            return;
        }

        const sortedOrders = sortOrdersNewestFirst(orders);
        const activeStatusFilter = getOrderStatusFilterMeta(orderStatusFilter);
        const statusFilteredOrders = filterOrdersByStatus(sortedOrders, orderStatusFilter);
        const filteredOrders = filterOrdersByKeyword(statusFilteredOrders);
        const summaryPills = [];
        if (activeStatusFilter.key !== 'all') {
            summaryPills.push(`<span class="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-babyPink">${escapeHtml(activeStatusFilter.label)}</span>`);
        }
        if (orderSearchKeyword) {
            summaryPills.push(`<span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-500">Từ khóa: ${escapeHtml(orderSearchKeyword)}</span>`);
        }
        summaryPills.push(`<span class="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1 text-gray-500">${orderSearchKeyword ? `Tìm thấy ${filteredOrders.length}/${statusFilteredOrders.length} đơn` : `Hiển thị ${filteredOrders.length} đơn`}</span>`);
        const searchSummary = `<div class="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">${summaryPills.join('')}</div>`;
        const emptySearchState = `<div class='flex flex-col items-center justify-center py-16 text-center text-gray-400'><i class='fa-solid fa-magnifying-glass text-4xl mb-3 opacity-30'></i><p class='text-sm font-bold text-gray-600'>Không tìm thấy kết quả.</p></div>`;
        const shell = ensureOrdersSearchShell(container);
        if (!shell) return;

        if (shell.input && document.activeElement !== shell.input && shell.input.value !== orderSearchKeyword) {
            shell.input.value = orderSearchKeyword;
        }
        if (shell.filterRow) {
            shell.filterRow.innerHTML = ORDER_STATUS_FILTERS.map((filterItem) => {
                const isActive = filterItem.key === activeStatusFilter.key;
                const count = filterItem.key === 'all' ? sortedOrders.length : getOrderStatusCount(sortedOrders, filterItem.key);
                return `
                    <button
                        type="button"
                        onclick="setOrderStatusFilter('${filterItem.key}')"
                        class="${isActive ? 'bg-babyPink text-white border-babyPink shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-pink-200 hover:text-babyPink'} inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition"
                    >
                        <i class="fa-solid ${filterItem.icon}"></i>
                        <span>${escapeHtml(filterItem.label)}</span>
                        <span class="${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'} min-w-[22px] rounded-full px-1.5 py-0.5 text-[10px] text-center">${count}</span>
                    </button>
                `;
            }).join('');
        }
        if (shell.summary) {
            shell.summary.innerHTML = searchSummary;
        }
        if (shell.list) {
            shell.list.innerHTML = filteredOrders.length ? filteredOrders.map((order) => {
            const totals = bridge.getOrderTotals ? bridge.getOrderTotals(order) : { finalAmount: 0 };
            const rawStatus = Number(order && order.rawStatus || 0) || 0;
            const statusTone = rawStatus === 5
                ? 'text-red-500 bg-red-50 border-red-100'
                : (rawStatus === 4
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                    : ((rawStatus === 2 || rawStatus === 3)
                        ? 'text-sky-600 bg-sky-50 border-sky-100'
                        : 'text-orange-500 bg-orange-50 border-orange-100'));
            return `
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-pink-200 transition cursor-pointer" onclick="openOrderDetail('${order.id}')">
                    <div class="flex justify-between items-center border-b border-gray-50 border-dashed pb-3 mb-3">
                        <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Mã: ${order.id}</span>
                        <span class="text-xs font-bold px-2 py-1 rounded-lg border ${statusTone}">${order.status}</span>
                    </div>
                    <div class="flex justify-between items-end">
                        <div>
                            <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Thời gian</p>
                            <span class="block text-xs text-gray-500 font-bold mb-2">${escapeHtml(order.date || 'Chưa cập nhật')}</span>
                            <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Sản phẩm</p>
                            <span class="text-sm text-gray-700 font-bold">${Number(order.itemsCount || (order.items || []).length || 0)} món đồ chơi</span>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Thành tiền</p>
                            <span class="text-lg font-bold text-babyPink">${bridge.formatMoney ? bridge.formatMoney(totals.finalAmount) : totals.finalAmount}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('') : emptySearchState;
        }
    };

    function mountAccountFeature() {
        ensureAccountInlineStyles();
        window.updateHeaderUserBadge();
    }

    function destroyAccountFeature() {
        const root = document.getElementById(ACCOUNT_FEATURE_ROOT_ID);
        if (root) root.innerHTML = '';
    }

    window.accountTabFeature = {
        ensureStyles: ensureAccountInlineStyles,
        ensureShell: ensureAccountFeatureShell,
        mount: mountAccountFeature,
        render: window.renderAccountTab,
        destroy: destroyAccountFeature
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountAccountFeature);
    } else {
        mountAccountFeature();
    }

    window.accountTabModule = {
        render: window.renderAccountTab,
        renderOrders: window.renderOrdersUI,
        renderWishlist: window.renderWishlistUI
    };

    window.dispatchEvent(new Event('web-new-account-tab-ready'));
})();
