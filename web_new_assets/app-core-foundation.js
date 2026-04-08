// STATE TOÀN CỤC & LOCALSTORAGE
    const createDefaultProductFilters = () => ({
        minPrice: '',
        maxPrice: '',
        sort: 'popular',
        bestSeller: false,
        featured: false,
        multiImage: false,
        hasVariant: false
    });
    let cartData = [];
    let wishlistData = [];
    let currentUser = null; 
    let currentViewingProduct = null;
    let shopProducts = []; 
    let filterCategory = '';
    let currentTheme = 'light';
    let productFilters = createDefaultProductFilters();
    let activeProfileField = '';
    let homeBannerIndex = 0;
    let homeBannerTimer = null;

    // TRẠNG THÁI MỚI
    let fsContextList = []; 
    let fsCurrentIndex = 0; 
    let fsCurrentImageIndex = 0; 
    let selectedVariants = {};
    let confirmCallback = null;
    let activeOrderDetailId = null;
    let checkoutInfoResolver = null;
    let checkoutInfoState = null;
    let deferredInstallPromptEvent = null;
    let shortcutPromptTimer = null;

    const formatMoney = (num) => num.toLocaleString('vi-VN') + 'đ';
    const parseMoney = (str) => {
        if(!str) return 0;
        return parseInt(str.toString().replace(/[^0-9]/g, '')) || 0;
    };
    const escapeHtml = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char] || char));
    window.escapeHtml = window.escapeHtml || escapeHtml;
// Đổi 1 lần tại đây để cập nhật số liên hệ, Zalo, kho và link hỗ trợ toàn web.
    const STORE_CONTACT_PHONE = window.STORE_CONTACT_PHONE || '0971388340';
    const STORE_ZALO_PHONE = window.STORE_ZALO_PHONE || STORE_CONTACT_PHONE;
    const ORDER_SUPPORT_ZALO_PHONE = window.ORDER_SUPPORT_ZALO_PHONE || STORE_ZALO_PHONE;
    const PASSWORD_RESET_ZALO_PHONE = window.PASSWORD_RESET_ZALO_PHONE || STORE_ZALO_PHONE;
    const STORE_FACEBOOK_URL = window.STORE_FACEBOOK_URL || 'https://www.facebook.com/';
    const STORE_ZALO_GROUP_URL = window.STORE_ZALO_GROUP_URL || 'https://zalo.me/g/bceitz651';
    const STORE_EMAIL_ADDRESS = window.STORE_EMAIL_ADDRESS || 'truonganstore@gmail.com';
    const STORE_MAP_URL = window.STORE_MAP_URL || 'https://maps.app.goo.gl/uvE9CiNHheZyWP55A';
    const STORE_WAREHOUSE_LABEL = window.STORE_WAREHOUSE_LABEL || 'Dị Nậu - Xã Tây Phương - TP. Hà Nội';
    const DEFAULT_WEB_CUSTOMER_GROUP = String(window.DEFAULT_WEB_CUSTOMER_GROUP || 'Khách sỉ từ web').trim() || 'Khách sỉ từ web';
    const DEFAULT_GUEST_NAME = 'Khách Sỉ Web';
const SHORTCUT_PROMPT_DELAY_MS = Number(window.SHORTCUT_PROMPT_DELAY_MS || 1800);
const SHORTCUT_PROMPT_AFTER_LOGIN_MS = Number(window.SHORTCUT_PROMPT_AFTER_LOGIN_MS || 2200);
const SHORTCUT_PROMPT_COOLDOWN_MS = Number(window.SHORTCUT_PROMPT_COOLDOWN_MS || (3 * 24 * 60 * 60 * 1000));
const SHORTCUT_PROMPT_STORAGE_KEY = 'ta_shortcut_prompt_dismissed_at';
const SHORTCUT_PROMPT_SESSION_KEY = 'ta_shortcut_prompt_seen_session_v1';
const SHORTCUT_INSTALLED_STORAGE_KEY = 'ta_shortcut_installed';
const SHORTCUT_PROMPT_MODE = (() => {
    const rawMode = String(window.WEB_NEW_SHORTCUT_PROMPT_MODE || 'session').trim().toLowerCase();
    if(rawMode === 'manual') return 'manual';
    if(rawMode === 'auto') return 'auto';
    return 'session';
})();
const SHORTCUT_STRATEGY = (() => {
    const rawStrategy = String(window.WEB_NEW_SHORTCUT_STRATEGY || '').trim().toLowerCase();
    if(rawStrategy === 'blogger-safe') return 'blogger-safe';
    return /(^|\.)blogspot\.com$/i.test(String(window.location.hostname || '')) ? 'blogger-safe' : 'default';
})();
const PWA_SW_URL = String(window.WEB_NEW_PWA_SW_URL || '').trim();
const PWA_SW_SCOPE = String(window.WEB_NEW_PWA_SCOPE || './').trim() || './';
    const TELEGRAM_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby5el0pzwvokeXVLpdl6b7n4K68moCxhOYZk8chcppgcjv_Ih2dwTeePI3Ts8Tl0_iB/exec';
    // Huong dan webhook Telegram:
    // 1. Mo file telegram_bot.gs va deploy thanh Web App tren Apps Script.
    // 2. Copy URL Web App vao TELEGRAM_WEBHOOK_URL de web gui thong bao dang ky va don hang.
    const CATEGORY_ICON_RULES = [
        { icon: 'fa-baby-carriage', color: 'bg-pink-100 text-babyPink dark:bg-pink-500/15 dark:text-pink-200', keywords: ['me va be', 'me & be', 'me be', 'so sinh', 'bim', 'ta', 'binh sua', 'ti gia', 'tre em', 'baby'] },
        { icon: 'fa-puzzle-piece', color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-200', keywords: ['do choi', 'toy', 'lego', 'lap rap', 'ghep hinh', 'montessori', 'tri tue'] },
        { icon: 'fa-truck-monster', color: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-200', keywords: ['xe', 'o to', 'may bay', 'tau hoa', 'robot', 'dieu khien'] },
        { icon: 'fa-book-open-reader', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200', keywords: ['sach', 'truyen', 'tap viet', 'hoc tap', 'giao duc'] },
        { icon: 'fa-shirt', color: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200', keywords: ['thoi trang', 'quan ao', 'vay', 'ao', 'quan', 'mu', 'giay', 'dep'] },
        { icon: 'fa-cookie-bite', color: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-200', keywords: ['an dam', 'banh', 'keo', 'snack', 'thuc pham', 'dinh duong'] },
        { icon: 'fa-bottle-droplet', color: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-200', keywords: ['sua', 'sua tam', 'tam goi', 've sinh', 'cham soc', 'kem', 'dau goi'] },
        { icon: 'fa-cubes-stacked', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200', keywords: ['combo', 'set', 'khay', 'hop', 'qua tang', 'sale', 'hot', 'new'] },
        { icon: 'fa-mask-face', color: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-200', keywords: ['phu kien', 'trang diem', 'lam dep', 'phu trang'] },
        { icon: 'fa-gamepad', color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-200', keywords: ['game', 'video', 'giai tri', 'console'] }
    ];
    const POS_CACHE_KEYS = {
        appCatalog: 'ta_catalog_cache_v6'
    };
    const LOCAL_IMAGE_CACHE_NAME = 'ta-image-prefetch-v1';
    const warmedImageUrls = new Set();
    const tabRenderState = { home: false, products: false, sale: false, account: false, intro: false };
    const syncState = { lastCatalogVersion: '', posSchema: null };
    const productFeedState = { loading: false, hasMore: true, initialSynced: false, observerReady: false, endNoticeShown: false, error: '' };
    const remoteState = { accountSyncing: false, ordersSyncing: false, sessionBooted: false };
    const scheduleIdleTask = (fn, timeout = 160) => {
        if(typeof window.requestIdleCallback === 'function') return window.requestIdleCallback(() => fn(), { timeout });
        return setTimeout(fn, timeout);
    };
    const getCatalogGate = () => window.webNewCatalogGate || null;
    const isCatalogLoadBlocked = () => {
        const gate = getCatalogGate();
        return !!(gate && gate.enabled !== false && typeof gate.shouldBlockCatalog === 'function' && gate.shouldBlockCatalog(currentUser));
    };
    const getCatalogBlockedMessage = () => {
        const gate = getCatalogGate();
        if(gate && typeof gate.getBlockedMessage === 'function') return gate.getBlockedMessage();
        return 'Vui lòng đăng nhập để xem danh sách sản phẩm.';
    };
    const sanitizeQtyValue = (value, fallback = 1) => {
        const nextValue = parseInt(String(value || '').replace(/[^\d]/g, ''), 10);
        return Math.max(1, Number(nextValue || fallback) || 1);
    };
    window.sanitizeQtyInput = (inputId, fallback = 1) => {
        const input = document.getElementById(inputId);
        if(!input) return sanitizeQtyValue(fallback, 1);
        const safeValue = sanitizeQtyValue(input.value, fallback);
        input.value = safeValue;
        return safeValue;
    };
    const openStoreZalo = (message = '', phone = STORE_ZALO_PHONE) => {
        const text = String(message || '').trim();
        const safePhone = String(phone || STORE_ZALO_PHONE).trim();
        const url = text ? `https://zalo.me/${safePhone}?text=${encodeURIComponent(text)}` : `https://zalo.me/${safePhone}`;
        window.open(url, '_blank');
    };
    const openExternalUrl = (url, fallback) => {
        const safeUrl = String(url || '').trim();
        if(safeUrl) {
            window.open(safeUrl, '_blank');
            return;
        }
        if(typeof fallback === 'function') fallback();
    };
    window.openStoreFacebook = () => openExternalUrl(STORE_FACEBOOK_URL, () => openStoreZalo());
    window.openStoreZaloGroup = () => openExternalUrl(STORE_ZALO_GROUP_URL, () => openStoreZalo('', ORDER_SUPPORT_ZALO_PHONE));
    window.openStoreMap = () => openExternalUrl(STORE_MAP_URL, () => openStoreZalo('', ORDER_SUPPORT_ZALO_PHONE));
    window.openStoreEmail = () => {
        const safeEmail = String(STORE_EMAIL_ADDRESS || '').trim();
        if(safeEmail) {
            window.location.href = `mailto:${safeEmail}`;
            return;
        }
        openStoreZalo();
    };
    window.openPasswordResetSupport = (identifier = '') => {
        const safeIdentifier = String(identifier || '').trim();
        const message = safeIdentifier
            ? `Shop ơi, em cần cấp lại mật khẩu cho tài khoản ${safeIdentifier}.`
            : 'Shop ơi, em cần hỗ trợ cấp lại mật khẩu tài khoản.';
        openStoreZalo(message, PASSWORD_RESET_ZALO_PHONE);
    };
    const isMobileDevice = () => /android|iphone|ipad|ipod/i.test(String(navigator.userAgent || ''));
    const isIosDevice = () => /iphone|ipad|ipod/i.test(String(navigator.userAgent || ''));
    const isBloggerShortcutMode = () => SHORTCUT_STRATEGY === 'blogger-safe';
    const isAppInstalledMode = () => {
        try {
            return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
                || window.navigator.standalone === true
                || localStorage.getItem(SHORTCUT_INSTALLED_STORAGE_KEY) === '1';
        } catch(error) {
            return false;
        }
    };
    const markShortcutPromptDismissed = () => {
        try {
            localStorage.setItem(SHORTCUT_PROMPT_STORAGE_KEY, String(Date.now()));
        } catch(error) {}
    };
    const markShortcutPromptSeenThisSession = () => {
        try {
            sessionStorage.setItem(SHORTCUT_PROMPT_SESSION_KEY, '1');
        } catch(error) {}
    };
    const hasShortcutPromptSeenThisSession = () => {
        try {
            return sessionStorage.getItem(SHORTCUT_PROMPT_SESSION_KEY) === '1';
        } catch(error) {
            return false;
        }
    };
    const hasShortcutPromptCooldown = () => {
        try {
            const lastDismissedAt = Number(localStorage.getItem(SHORTCUT_PROMPT_STORAGE_KEY) || 0) || 0;
            return !!lastDismissedAt && (Date.now() - lastDismissedAt) < SHORTCUT_PROMPT_COOLDOWN_MS;
        } catch(error) {
            return false;
        }
    };
    const getShortcutPromptCopy = () => {
        if (deferredInstallPromptEvent && !isBloggerShortcutMode()) {
            return {
                title: 'Tạo lối tắt ra màn hình chính',
                desc: 'Bạn muốn ghim web này ra màn hình chính để mở nhanh như ứng dụng không?',
                hint: 'Bấm nút bên dưới để trình duyệt mở hộp cài lối tắt.',
                actionLabel: 'Tạo lối tắt ngay'
            };
        }
        if (isIosDevice()) {
            return {
                title: 'Thêm web ra màn hình chính',
                desc: 'Trên Blogger, cách ổn định nhất là thêm lối tắt thủ công từ Safari.',
                hint: 'Safari trên iPhone/iPad: bấm Chia sẻ -> kéo xuống -> chọn "Thêm vào Màn hình chính" -> bấm Thêm.',
                actionLabel: 'Đã hiểu'
            };
        }
        if (!isMobileDevice()) {
            return {
                title: 'Cài app trên điện thoại',
                desc: 'Nút này phù hợp nhất khi mở web bằng điện thoại để tạo lối tắt ra màn hình chính.',
                hint: 'Nếu đang ở máy tính, bạn có thể mở link này trên điện thoại rồi bấm lại nút Cài app.',
                actionLabel: 'Mở trên điện thoại'
            };
        }
        if (isBloggerShortcutMode()) {
            return {
                title: 'Tạo lối tắt ra màn hình chính',
                desc: 'Với Blogger, cách an toàn nhất là thêm lối tắt thủ công để mở web nhanh như ứng dụng.',
                hint: 'Android/Cốc Cốc/Chrome: bấm menu trình duyệt (⋮ hoặc biểu tượng chia sẻ) -> chọn "Thêm vào màn hình chính" hoặc "Cài đặt ứng dụng" nếu có.',
                actionLabel: 'Đã hiểu'
            };
        }
        return {
            title: 'Thêm lối tắt web',
            desc: 'Bạn có thể ghim web này ra màn hình chính để vào nhanh hơn.',
            hint: 'Trên Android: mở menu trình duyệt rồi chọn "Thêm vào màn hình chính" hoặc "Cài đặt ứng dụng".',
            actionLabel: 'Xem cách thêm'
        };
    };
    const canUseNativeShortcutPrompt = () => isMobileDevice() && !isBloggerShortcutMode() && !!deferredInstallPromptEvent;
    const syncShortcutInstallCtas = () => {
        const shouldShow = isMobileDevice() && !isAppInstalledMode();
        document.querySelectorAll('[data-shortcut-install-cta]').forEach((node) => {
            node.classList.toggle('hidden', !shouldShow);
            node.classList.toggle('flex', shouldShow);
        });
    };
    const canRegisterPwaServiceWorker = () => {
        if(isBloggerShortcutMode()) return false;
        if(!PWA_SW_URL || !('serviceWorker' in navigator)) return false;
        if(!(window.isSecureContext || /^(localhost|127\.0\.0\.1)$/i.test(String(window.location.hostname || '')))) return false;
        try {
            const swUrl = new URL(PWA_SW_URL, window.location.href);
            return swUrl.origin === window.location.origin;
        } catch(error) {
            return false;
        }
    };
    const registerWebNewPwa = () => {
        if(window.__webNewPwaRegisterStarted) return;
        window.__webNewPwaRegisterStarted = true;
        if(!canRegisterPwaServiceWorker()) return;
        let swUrl = '';
        try {
            swUrl = new URL(PWA_SW_URL, window.location.href).href;
        } catch(error) {
            return;
        }
        navigator.serviceWorker.register(swUrl, { scope: PWA_SW_SCOPE }).catch(() => null);
    };
    const canPromptForShortcut = (options = {}) => {
        const forceOpen = options === true || !!(options && options.force === true);
        if (isAppInstalledMode()) return false;
        if (!forceOpen && !isMobileDevice()) return false;
        if (forceOpen) return true;
        if (hasShortcutPromptSeenThisSession()) return false;
        if (SHORTCUT_PROMPT_MODE === 'auto' && hasShortcutPromptCooldown()) return false;
        return true;
    };
    window.closeShortcutInstallPrompt = (options = {}) => {
        if (SHORTCUT_PROMPT_MODE === 'auto' && options.remindLater !== true) markShortcutPromptDismissed();
        closeModalShell('shortcut-install-overlay');
    };
    window.openShortcutInstallPrompt = (options = {}) => {
        const forceOpen = options === true || !!(options && options.force === true);
        if (!canPromptForShortcut({ force: forceOpen })) return;
        markShortcutPromptSeenThisSession();
        const titleEl = document.getElementById('shortcut-install-title');
        const descEl = document.getElementById('shortcut-install-desc');
        const hintEl = document.getElementById('shortcut-install-hint');
        const actionBtn = document.getElementById('shortcut-install-action-btn');
        const copy = getShortcutPromptCopy();
        if (titleEl) titleEl.innerText = copy.title;
        if (descEl) descEl.innerText = copy.desc;
        if (hintEl) hintEl.innerText = copy.hint;
        if (actionBtn) actionBtn.innerText = copy.actionLabel || (deferredInstallPromptEvent ? 'Tạo lối tắt ngay' : (isMobileDevice() ? 'Xem cách thêm' : 'Mở trên điện thoại'));
        openModalShell('shortcut-install-overlay');
    };
    window.openInstallApp = () => window.openShortcutInstallPrompt({ force: true });
    window.syncShortcutInstallCtas = syncShortcutInstallCtas;
    window.triggerShortcutInstallPrompt = async () => {
        if (!canUseNativeShortcutPrompt()) {
            closeModalShell('shortcut-install-overlay');
            if (SHORTCUT_PROMPT_MODE === 'auto') markShortcutPromptDismissed();
            showToast(isIosDevice()
                ? 'Safari: bấm Chia sẻ rồi chọn "Thêm vào Màn hình chính".'
                : 'Mở menu trình duyệt rồi chọn "Thêm vào màn hình chính" để tạo lối tắt.', 'info');
            return;
        }
        if (deferredInstallPromptEvent) {
            const promptEvent = deferredInstallPromptEvent;
            deferredInstallPromptEvent = null;
            try {
                await promptEvent.prompt();
                const choice = await promptEvent.userChoice;
                if (choice && choice.outcome === 'accepted') {
                    try {
                        localStorage.setItem(SHORTCUT_INSTALLED_STORAGE_KEY, '1');
                    } catch(error) {}
                    syncShortcutInstallCtas();
                    closeModalShell('shortcut-install-overlay');
                    showToast('Đã gửi yêu cầu tạo lối tắt ra màn hình chính.', 'success');
                    return;
                }
            } catch(error) {}
        }
        closeModalShell('shortcut-install-overlay');
        if (SHORTCUT_PROMPT_MODE === 'auto') markShortcutPromptDismissed();
        showToast(isIosDevice()
            ? 'Mở nút Chia sẻ của trình duyệt rồi chọn "Thêm vào Màn hình chính".'
            : 'Mở menu trình duyệt rồi chọn "Thêm vào màn hình chính" để tạo lối tắt.', 'info');
    };
    const scheduleShortcutPrompt = (delayMs) => {
        if (shortcutPromptTimer) clearTimeout(shortcutPromptTimer);
        if (SHORTCUT_PROMPT_MODE === 'manual') return;
        if (!canPromptForShortcut()) return;
        shortcutPromptTimer = setTimeout(() => {
            shortcutPromptTimer = null;
            window.openShortcutInstallPrompt();
        }, Math.max(Number(delayMs || 0) || 0, 1000));
    };
    window.scheduleShortcutPromptAfterLogin = () => {
        scheduleShortcutPrompt(SHORTCUT_PROMPT_AFTER_LOGIN_MS);
    };
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPromptEvent = event;
        syncShortcutInstallCtas();
    });
    window.addEventListener('appinstalled', () => {
        try {
            localStorage.setItem(SHORTCUT_INSTALLED_STORAGE_KEY, '1');
        } catch(error) {}
        syncShortcutInstallCtas();
        closeModalShell('shortcut-install-overlay');
    });
    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            syncShortcutInstallCtas();
            registerWebNewPwa();
        }, { once: true });
    } else {
        syncShortcutInstallCtas();
        registerWebNewPwa();
    }
    const ensureLoaderBundle = (bundleName) => {
        const safeBundleName = String(bundleName || '').trim();
        if(!safeBundleName || !window.webNewLoader || typeof window.webNewLoader.ensureBundle !== 'function') {
            return Promise.resolve(false);
        }
        return window.webNewLoader.ensureBundle(safeBundleName).catch((error) => {
            console.warn('Khong tai duoc bundle tu foundation:', safeBundleName, error);
            return false;
        });
    };
    const installLazyActionProxy = (globalName, bundleName) => {
        if(typeof window[globalName] === 'function') return;
        const proxy = function () {
            const args = Array.prototype.slice.call(arguments);
            return ensureLoaderBundle(bundleName).then(() => {
                const actual = window[globalName];
                if(typeof actual === 'function' && actual !== proxy) {
                    return actual.apply(window, args);
                }
                return false;
            });
        };
        window[globalName] = proxy;
    };
    window.ensureAccountUiReady = () => ensureLoaderBundle('account');
    ['openAuth', 'switchAuthTab', 'openSettings', 'openWishlist', 'openOrders', 'openOrderDetail'].forEach((actionName) => {
        installLazyActionProxy(actionName, 'account');
    });
    window.ensureCategoryUiReady = () => ensureLoaderBundle('products');
    ['openProductCategoryPopup', 'closeProductCategoryPopup', 'renderCategoryGroupsView', 'renderCategoryTagsView', 'selectProductCategory', 'renderDesktopCategoryMenu'].forEach((actionName) => {
        installLazyActionProxy(actionName, 'products');
    });
    ['renderHomeCategories', 'renderHomeDesktopCategoryMenu', 'filterHomeByCategory'].forEach((actionName) => {
        installLazyActionProxy(actionName, 'home');
    });
    window.togglePcFloatingActions = (forceClose) => {
        const container = document.getElementById('pc-floating-links');
        const toggleButton = document.getElementById('pc-floating-toggle');
        if(!container || !toggleButton) return;
        
        const isCurrentlyOpen = !container.classList.contains('opacity-0');
        // Nếu truyền tham số forceClose = true -> Bắt buộc đóng. Nếu không thì đảo ngược trạng thái hiện tại.
        const opening = forceClose === true ? false : !isCurrentlyOpen;

        container.classList.toggle('opacity-0', !opening);
        container.classList.toggle('pointer-events-none', !opening);
        container.classList.toggle('translate-y-2', !opening);
        toggleButton.innerHTML = opening
            ? '<i class="fa-solid fa-xmark text-base"></i>'
            : '<i class="fa-solid fa-headset text-base"></i>';
    };

    // Tự động đóng menu floating khi click ra vùng trống
    document.addEventListener('click', (e) => {
        const floatingActions = document.getElementById('pc-floating-actions');
        // Nếu click không nằm trong khu vực nút bấm -> Gọi lệnh forceClose = true
        if (floatingActions && !floatingActions.contains(e.target)) {
            const container = document.getElementById('pc-floating-links');
            if (container && !container.classList.contains('opacity-0')) {
                window.togglePcFloatingActions(true);
            }
        }
    });

    // Tự động đóng menu floating khi click ra ngoài
    document.addEventListener('click', (e) => {
        const floatingActions = document.getElementById('pc-floating-actions');
        if (floatingActions && !floatingActions.contains(e.target)) {
            const container = document.getElementById('pc-floating-links');
            if (container && !container.classList.contains('opacity-0')) {
                window.togglePcFloatingActions(true);
            }
        }
    });
    window.toggleCollapsiblePanel = (panelId, toggleButtonId) => {
        const panel = document.getElementById(panelId);
        const toggleButton = document.getElementById(toggleButtonId);
        if(!panel || !toggleButton) return;
        const opening = panel.classList.contains('hidden');
        panel.classList.toggle('hidden', !opening);
        const icon = toggleButton.querySelector('.collapse-arrow');
        if(icon) {
            icon.className = opening
                ? 'fa-solid fa-angle-up text-sm'
                : 'fa-solid fa-angle-down text-sm';
        }
    };
    const extractDriveId = (raw) => {
        const value = String(raw || '').trim();
        if(!value) return '';
        if(value.startsWith('data:image')) return value;
        if(/^https?:\/\//i.test(value) && !value.includes('drive.google.com') && !value.includes('docs.google.com')) return value;
        const match = value.match(/[-\w]{25,}/);
        return match ? match[0] : value;
    };
    const normalizeDriveImageInput = (rawInput) => {
        const raw = String(rawInput || '').replace(/\r/g, '').trim();
        if(!raw) return [];
        const tokens = [];
        const urlStartRegex = /(https?:\/\/|data:image\/)/ig;
        const urlStarts = [];
        let match;
        while((match = urlStartRegex.exec(raw))) urlStarts.push(match.index);
        const pushSimpleParts = (segment) => {
            String(segment || '')
                .split(/[,\n]+/)
                .map(item => String(item || '').trim())
                .filter(Boolean)
                .forEach(item => tokens.push(item));
        };
        if(!urlStarts.length) pushSimpleParts(raw);
        else {
            if(urlStarts[0] > 0) pushSimpleParts(raw.slice(0, urlStarts[0]));
            urlStarts.forEach((startIndex, index) => {
                const endIndex = index + 1 < urlStarts.length ? urlStarts[index + 1] : raw.length;
                let segment = raw.slice(startIndex, endIndex).trim();
                segment = segment.replace(/[\s,]+$/, '').trim();
                if(segment) tokens.push(segment);
            });
        }
        const seen = new Set();
        return tokens
            .map(item => extractDriveId(item))
            .map(item => String(item || '').trim().replace(/#(?:.*?&)?tasmeta=[^&]+.*$/i, '').replace(/#$/, ''))
            .filter(Boolean)
            .filter(item => {
                if(seen.has(item)) return false;
                seen.add(item);
                return true;
            });
    };
    const decodeHostedImageMeta = (rawUrl = '') => {
        const value = String(rawUrl || '').trim();
        if(!value) return null;
        const match = value.match(/#(?:.*?&)?tasmeta=([^&]+)/i);
        if(!match || !match[1]) return null;
        try {
            let encoded = String(match[1] || '').trim().replace(/-/g, '+').replace(/_/g, '/');
            while(encoded.length % 4) encoded += '=';
            return JSON.parse(decodeURIComponent(escape(atob(encoded))));
        } catch(error) {
            return null;
        }
    };
    const getPrimaryHostedImageMeta = (images = []) => {
        for(const image of (Array.isArray(images) ? images : [])) {
            const meta = decodeHostedImageMeta(image);
            if(meta && typeof meta === 'object') return meta;
        }
        return null;
    };
    const warmImageLocalCache = (url = '') => {
        const safeUrl = String(url || '').trim();
        if(!/^https?:\/\//i.test(safeUrl) || safeUrl.includes('via.placeholder.com') || warmedImageUrls.has(safeUrl)) return safeUrl;
        warmedImageUrls.add(safeUrl);
        scheduleIdleTask(() => {
            try {
                const image = new Image();
                image.decoding = 'async';
                image.referrerPolicy = 'no-referrer';
                image.src = safeUrl;
            } catch(error) {}
            if(typeof window.caches === 'undefined' || typeof fetch !== 'function') return;
            window.caches.open(LOCAL_IMAGE_CACHE_NAME).then((cache) => {
                return cache.match(safeUrl).then((matched) => {
                    if(matched) return matched;
                    return fetch(safeUrl, {
                        mode: 'no-cors',
                        credentials: 'omit',
                        cache: 'force-cache'
                    }).then((response) => {
                        if(response) return cache.put(safeUrl, response.clone()).catch(() => null);
                        return null;
                    }).catch(() => null);
                });
            }).catch(() => null);
        }, 180);
        return safeUrl;
    };
    const isMissingImageValue = (raw = '') => {
        const safeValue = String(raw || '').trim();
        if(!safeValue) return true;
        return /via\.placeholder\.com/i.test(safeValue);
    };
    const renderMissingImageHtml = (className = '', options = {}) => {
        const wrapperClass = ['product-image-missing', className].filter(Boolean).join(' ');
        const altText = escapeHtml(String(options.alt || 'Ảnh sản phẩm đang cập nhật').trim() || 'Ảnh sản phẩm đang cập nhật');
        const idAttr = options.id ? ` id="${escapeHtml(String(options.id).trim())}"` : '';
        return `<div${idAttr} class="${escapeHtml(wrapperClass)}" role="img" aria-label="${altText}"><div class="product-image-missing__inner"><span class="product-image-missing__icon" aria-hidden="true"><i class="fa-solid fa-store"></i></span><span class="product-image-missing__brand">Trường An Store</span><span class="product-image-missing__label">Đang cập nhật</span></div></div>`;
    };
    const finalizeOptimizedImageUrl = (url = '') => {
        const safeUrl = String(url || '').trim();
        if(safeUrl) warmImageLocalCache(safeUrl);
        return safeUrl;
    };
    const CLOUDINARY_TRANSFORM_PREFIXES = new Set(['a', 'ac', 'af', 'ar', 'b', 'bo', 'br', 'c', 'co', 'd', 'dl', 'dn', 'dpr', 'e', 'f', 'fl', 'fn', 'fps', 'g', 'h', 'ki', 'l', 'o', 'p', 'pg', 'q', 'r', 'so', 'sp', 't', 'u', 'vc', 'w', 'x', 'y', 'z']);
    const isCloudinaryTransformSegment = (segment = '') => {
        const safeSegment = String(segment || '').trim().replace(/^\/+|\/+$/g, '');
        if(!safeSegment || safeSegment.includes('.')) return false;
        return safeSegment.split(',').every((token) => {
            const safeToken = String(token || '').trim();
            const prefixMatch = safeToken.match(/^([a-z]{1,4})_/i);
            return !!(prefixMatch && CLOUDINARY_TRANSFORM_PREFIXES.has(String(prefixMatch[1] || '').toLowerCase()));
        });
    };
    const buildCloudinaryImageUrl = (raw, size = 'w800', options = {}) => {
        const value = String(raw || '').trim();
        if(!/^https?:\/\/res\.cloudinary\.com\//i.test(value) || !value.includes('/image/upload/')) return '';
        const uploadMarker = '/image/upload/';
        const markerIndex = value.indexOf(uploadMarker);
        if(markerIndex < 0) return '';
        const prefix = value.slice(0, markerIndex + uploadMarker.length);
        const suffix = value.slice(markerIndex + uploadMarker.length);
        const firstSlashIndex = suffix.indexOf('/');
        const firstSegment = firstSlashIndex >= 0 ? suffix.slice(0, firstSlashIndex) : suffix;
        const assetPath = isCloudinaryTransformSegment(firstSegment)
            ? suffix.slice(firstSlashIndex + 1)
            : suffix;
        const widthMatch = String(size || '').match(/w(\d+)/i);
        const width = widthMatch && widthMatch[1] ? Number(widthMatch[1]) || 0 : 0;
        const transforms = [options.webp ? 'f_webp' : 'f_auto', 'q_auto'];
        if(width > 0) transforms.push(`w_${width}`, 'c_limit');
        return finalizeOptimizedImageUrl(`${prefix}${transforms.join(',')}/${String(assetPath || '').replace(/^\/+/, '')}`);
    };
    const getExplicitWebpImageUrl = (raw, size = 'w800') => buildCloudinaryImageUrl(raw, size, { webp: true });
    const getOptimizedImageUrl = (raw, size = 'w800') => {
        const value = String(raw || '').trim();
        if(isMissingImageValue(value)) return '';
        if(value.startsWith('data:image')) return value;
        if(/^https?:\/\/res\.cloudinary\.com\//i.test(value) && value.includes('/image/upload/')) return buildCloudinaryImageUrl(value, size);
        if(/^https?:\/\//i.test(value) && !value.includes('drive.google.com') && !value.includes('docs.google.com')) return finalizeOptimizedImageUrl(value);
        const driveId = extractDriveId(value);
        if(/^https?:\/\//i.test(driveId)) return finalizeOptimizedImageUrl(driveId);
        return finalizeOptimizedImageUrl(`https://drive.google.com/thumbnail?id=${driveId}&sz=${size}`);
    };
    const renderResponsiveImageHtml = (raw, size = 'w800', className = '', options = {}) => {
        if(isMissingImageValue(raw)) return renderMissingImageHtml(className, options);
        const src = getOptimizedImageUrl(raw, size);
        const webpSrc = getExplicitWebpImageUrl(raw, size);
        const pictureClass = escapeHtml(String(options.pictureClass || 'block').trim());
        const imgClass = escapeHtml(String(className || '').trim());
        const altText = escapeHtml(String(options.alt || '').trim());
        const loadingAttr = escapeHtml(String(options.loading || 'lazy').trim() || 'lazy');
        const decodingAttr = escapeHtml(String(options.decoding || 'async').trim() || 'async');
        const sizesAttr = options.sizes ? ` sizes="${escapeHtml(options.sizes)}"` : '';
        const idAttr = options.id ? ` id="${escapeHtml(options.id)}"` : '';
        const fetchPriorityAttr = options.fetchPriority ? ` fetchpriority="${escapeHtml(options.fetchPriority)}"` : '';
        if(!src) return renderMissingImageHtml(className, options);
        const imgHtml = `<img${idAttr} src="${escapeHtml(src)}" alt="${altText}" loading="${loadingAttr}" decoding="${decodingAttr}"${sizesAttr}${fetchPriorityAttr} class="${imgClass}"/>`;
        if(!webpSrc || webpSrc === src) return imgHtml;
        return `<picture class="${pictureClass}"><source type="image/webp" srcset="${escapeHtml(webpSrc)}"${sizesAttr}/>${imgHtml}</picture>`;
    };
    window.renderResponsiveImageHtml = renderResponsiveImageHtml;
    const getOrderSuccessStatusText = (payload = {}) => {
        if(payload.pendingSync) return 'Đang đồng bộ đơn';
        return payload.persisted === false ? 'Đã ghi nhận trên web' : 'Đã tạo trên hệ thống';
    };
    const getOrderSuccessMessage = (payload = {}) => {
        const isUpdatedOrder = !!payload.updatedExistingOrder;
        if(payload.pendingSync) {
            return isUpdatedOrder
                ? 'Yêu cầu cập nhật đơn đang được gửi lên hệ thống. Bạn có thể tiếp tục dùng web trong lúc đồng bộ chạy ngầm.'
                : 'Đơn hàng đang được gửi lên hệ thống. Bạn có thể tiếp tục dùng web trong lúc đồng bộ chạy ngầm.';
        }
        return isUpdatedOrder
            ? (payload.persisted === false
                ? 'Yêu cầu cập nhật đơn hàng đã được ghi nhận trên web. Bạn có thể mở Zalo để shop xác nhận nhanh hơn.'
                : 'Đơn hàng của bạn đã được cập nhật thành công trên hệ thống.')
            : (payload.persisted === false
                ? 'Đơn hàng đã được ghi nhận trên web. Bạn có thể mở Zalo để shop xác nhận nhanh hơn.'
                : 'Đơn hàng của bạn đã được tạo thành công trên hệ thống.');
    };
    const getOrderSuccessDismissKey = (payload = {}) => String(payload.submissionKey || payload.orderId || '').trim();
    const normalizeKeyword = (value = '') => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isAllCategory = (value = '') => normalizeKeyword(value) === 'tat ca';
    const getProductCode = (product) => String((product && (product.code || product.sku || product.id)) || '').trim();
    const parseCategoryList = (value) => {
        const queue = [];
        const pushValue = (item) => {
            if (Array.isArray(item)) {
                item.forEach(pushValue);
                return;
            }
            if (item && typeof item === 'object') {
                Object.keys(item).forEach((key) => pushValue(item[key]));
                return;
            }
            queue.push(item);
        };

        pushValue(value);

        const seen = new Set();
        return queue
            .flatMap((item) => String(item || '').split(/[,;|\n]+/))
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .filter((item) => {
                const key = normalizeKeyword(item);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    };
    const getProductGroupNames = (product) => {
        const groups = parseCategoryList([
            ...(Array.isArray(product && product.groups) ? product.groups : []),
            ...(Array.isArray(product && product.group) ? product.group : [product && product.group]),
            ...(Array.isArray(product && product.groupList) ? product.groupList : [product && product.groupList]),
            ...(Array.isArray(product && product.categoryGroups) ? product.categoryGroups : [product && product.categoryGroups])
        ].flat());
        return groups;
    };
    const getProductGroupName = (product) => String(getProductGroupNames(product)[0] || '').trim();
    const getProductExplicitTags = (product) => {
        const groupKeys = new Set(getProductGroupNames(product).map((item) => normalizeKeyword(item)));
        return parseCategoryList([
            product && product.tags,
            product && product.tagList,
            product && product.childTags,
            product && product.subTags
        ]).filter((tag) => !groupKeys.has(normalizeKeyword(tag)));
    };
    const getProductDisplayName = (product) => {
        const code = getProductCode(product);
        const name = String((product && product.name) || '').trim();
        if(code && name && normalizeKeyword(name).startsWith(normalizeKeyword(code))) return name;
        if(code && name) return `${code} ${name}`;
        return name || code || 'Sản phẩm';
    };
    const getProductUnit = (product) => String((product && (product.unit || product.dvt || product.don_vi || product.don_vi_tinh)) || '').trim();
    const getProductMinQty = (product) => {
        const rawValue = product && (product.minQty || product.si_tu || product.su || product.min_qty || product.min_quantity || 1);
        return Math.max(Number(rawValue || 1) || 1, 1);
    };
    const getProductSalePercent = (product) => {
        const rawValue = Number(product && (
            product.salePercent
            ?? product.discountPercent
            ?? product.discount_percent
            ?? product.km_phan_tram
            ?? product["Sale (%)"]
            ?? product["Khuyến Mãi (%)"]
            ?? product.Discount
            ?? product.discount
            ?? 0
        )) || 0;
        if (rawValue > 0) return Math.max(0, Math.min(99, Math.round(rawValue)));
        const currentValue = Number(product && product.priceValue) || parseMoney(product && product.price);
        const originalValue = Number(product && product.originalPriceValue) || parseMoney(product && product.originalPrice);
        if (originalValue > currentValue && currentValue > 0) {
            return Math.max(0, Math.min(99, Math.round((1 - (currentValue / originalValue)) * 100)));
        }
        return 0;
    };
    const getProductPricingMeta = (product) => {
        const unit = getProductUnit(product);
        const currentValue = Number(product && product.priceValue) || parseMoney(product && product.price);
        const currentBaseText = String((product && product.price) || (currentValue ? formatMoney(currentValue) : '')).trim();
        const salePercent = getProductSalePercent(product);
        let originalValue = Number(product && product.originalPriceValue) || parseMoney(product && product.originalPrice);
        if(!originalValue && salePercent > 0 && currentValue > 0) {
            originalValue = Math.round((currentValue * 100) / Math.max(100 - salePercent, 1));
        }
        const originalBaseText = salePercent > 0 && originalValue > currentValue ? formatMoney(originalValue) : '';
        const hasSale = salePercent > 0 && !!originalBaseText;
        return {
            salePercent,
            hasSale,
            currentValue,
            originalValue,
            currentBaseText,
            originalBaseText,
            currentText: currentBaseText ? (unit ? `${currentBaseText} / ${unit}` : currentBaseText) : (unit || ''),
            originalText: hasSale ? (unit ? `${originalBaseText} / ${unit}` : originalBaseText) : ''
        };
    };
    const formatProductPriceLabel = (product) => {
        return getProductPricingMeta(product).currentText;
    };
    const getProductVisibleTags = (product) => {
        return getProductExplicitTags(product);
    };
    const isProductUncategorized = (product) => {
        return getProductGroupNames(product).length === 0 && getProductExplicitTags(product).length === 0;
    };
    const getProductTagText = (product) => {
        const tags = getProductVisibleTags(product);
        if(tags.length) return `Tag: ${tags.slice(0, 2).join(' • ')}`;
        const groups = getProductGroupNames(product);
        if(groups.length) return `Nhóm: ${groups.slice(0, 2).join(' • ')}`;
        return 'Tag: Sản phẩm';
    };
    const buildProductMetaDesc = (rawDesc, group, tags) => {
        const groupNames = parseCategoryList(group);
        const safeGroupLabel = groupNames.length ? groupNames.join(' • ').toLocaleUpperCase('vi-VN') : '';
        const parts = [];
        if(safeGroupLabel) parts.push(`Nhóm: ${safeGroupLabel}`);
        parts.push(`Kho: ${STORE_WAREHOUSE_LABEL}`);
        const fallbackDesc = parts.join(' | ');
        const safeDesc = String(rawDesc || '').trim();
        if(!safeDesc) return fallbackDesc;
        if(safeDesc.indexOf(fallbackDesc) === 0) return safeDesc;
        return `${fallbackDesc}\n${safeDesc}`;
    };
    const getProductVariantSummary = (product) => {
        const variants = Array.isArray(product && product.variants) ? product.variants : [];
        if(!variants.length) return '';
        return variants.map((variant) => {
            const options = Array.isArray(variant.options) ? variant.options.filter(Boolean) : [];
            return options.length ? `${variant.name}: ${options.join(', ')}` : String(variant.name || '').trim();
        }).filter(Boolean).join(' • ');
    };
    const getProductSearchText = (product) => {
        const parts = [
            getProductCode(product),
            product && product.name,
            ...getProductGroupNames(product),
            ...getProductExplicitTags(product),
            product && product.desc
        ];
        return normalizeKeyword(parts.filter(Boolean).join(' '));
    };
    const parseProfileList = (value) => {
        const rawValues = Array.isArray(value)
            ? value
            : String(value || '').split(/[,;|\n]+/);
        return [...new Set(rawValues
            .map((item) => String(item || '').trim())
            .filter(Boolean))];
    };
    const getProductSignalText = (product) => normalizeKeyword([
        getProductCode(product),
        product && product.name,
        ...getProductGroupNames(product),
        product && product.cat,
        product && product.desc,
        ...getProductExplicitTags(product)
    ].filter(Boolean).join(' '));
    const getRecommendedProductsForUser = (products, user) => {
        const safeProducts = Array.isArray(products) ? products.slice() : [];
        const safeUser = normalizeUserData(user);
        if (!safeUser || !safeProducts.length) return safeProducts;

        const interests = parseProfileList(safeUser.interests);
        const concerns = parseProfileList(safeUser.concerns);
        const favorites = new Set(parseProfileList(safeUser.favoriteProducts).concat(Array.isArray(wishlistData) ? wishlistData : []));
        const maritalStatus = normalizeKeyword(safeUser.maritalStatus || '');
        const personalSignals = parseProfileList([
            safeUser.personalInfo,
            safeUser.bio,
            interests.join(','),
            concerns.join(','),
            safeUser.gender
        ].join(','));
        const scoredProducts = safeProducts.map((product, index) => {
            const signalText = getProductSignalText(product);
            let score = 0;

            if (favorites.has(String(product && product.id || '').trim())) score += 40;
            interests.forEach((keyword) => {
                if (signalText.includes(normalizeKeyword(keyword))) score += 14;
            });
            concerns.forEach((keyword) => {
                if (signalText.includes(normalizeKeyword(keyword))) score += 11;
            });
            personalSignals.forEach((keyword) => {
                if (signalText.includes(normalizeKeyword(keyword))) score += 6;
            });

            if (maritalStatus) {
                if ((maritalStatus.includes('da ket hon') || maritalStatus.includes('co con') || maritalStatus.includes('me bim'))
                    && /me va be|so sinh|tre em|do choi|sua|bim/.test(signalText)) {
                    score += 12;
                }
                if (maritalStatus.includes('doc than') && /thoi trang|lam dep|phu kien|giai tri/.test(signalText)) {
                    score += 6;
                }
            }

            const age = Math.max(Number(safeUser.age || 0) || 0, 0);
            if (age > 0) {
                if (age <= 25 && /hot|new|thoi trang|giai tri/.test(signalText)) score += 4;
                if (age >= 26 && /gia dinh|me va be|do choi|hoc tap/.test(signalText)) score += 4;
            }

            return {
                product: product,
                score: score,
                index: index
            };
        });

        const hasMeaningfulScore = scoredProducts.some((entry) => entry.score > 0);
        if (!hasMeaningfulScore) return safeProducts;

        return scoredProducts
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.index - b.index;
            })
            .map((entry) => entry.product);
    };
    const getProductCategoryNames = (product) => {
        const groups = getProductGroupNames(product);
        const tags = getProductExplicitTags(product);
        const values = [...groups, ...tags]
            .map(item => String(item || '').trim())
            .filter(Boolean);
        return [...new Set(values)];
    };
    let categoryVisualCacheKey = '';
    let categoryVisualCache = Object.create(null);
    const getRelatedProductsForCategory = (name = '') => {
        if(!name || isAllCategory(name)) return shopProducts || [];
        return (shopProducts || []).filter(product => getProductCategoryNames(product).includes(name));
    };
    const getCategoryVisual = (name = '') => {
        const safeName = String(name || '').trim();
        const visualSignature = productCategoryIndexCacheKey || productCategoryOptionsCacheKey || '';
        if(categoryVisualCacheKey !== visualSignature) {
            categoryVisualCacheKey = visualSignature;
            categoryVisualCache = Object.create(null);
        }
        if(categoryVisualCache[safeName]) return categoryVisualCache[safeName];
        const relatedProducts = typeof getProductsForCategory === 'function'
            ? getProductsForCategory(safeName, shopProducts)
            : getRelatedProductsForCategory(safeName);
        const signal = normalizeKeyword([
            safeName,
            ...relatedProducts.flatMap((product) => [
                ...getProductGroupNames(product),
                product && product.name,
                product && product.desc,
                ...getProductExplicitTags(product)
            ])
        ].filter(Boolean).join(' '));
        let bestRule = CATEGORY_ICON_RULES[0];
        let bestScore = 0;
        CATEGORY_ICON_RULES.forEach((rule) => {
            const score = rule.keywords.reduce((sum, keyword) => sum + (signal.includes(keyword) ? 1 : 0), 0);
            if(score > bestScore) {
                bestRule = rule;
                bestScore = score;
            }
        });
        categoryVisualCache[safeName] = bestScore > 0
            ? { icon: bestRule.icon, color: bestRule.color }
            : { icon: 'fa-box-open', color: 'bg-slate-100 text-slate-500' };
        return categoryVisualCache[safeName];
    };
    const productMatchesCategory = (product, categoryName) => {
        if(!categoryName || isAllCategory(categoryName)) return true;
        return getProductCategoryNames(product).includes(categoryName);
    };
    const getDynamicCategoryNames = () => {
        const groups = [...new Set((shopProducts || []).flatMap(product => getProductGroupNames(product)).filter(Boolean))];
        const groupKeys = new Set(groups.map((item) => normalizeKeyword(item)));
        const tags = [...new Set((shopProducts || []).flatMap(product => {
            return getProductExplicitTags(product);
        }).filter(name => !groupKeys.has(normalizeKeyword(name))))];
        return ['Tất cả', ...groups, ...tags];
    };
    const mapPosBadges = (posProduct) => {
        const values = [
            String(posProduct.status || posProduct.Status || '').trim(),
            ...String(posProduct.tags || posProduct.Tags || '').split(',').map(item => item.trim())
        ].filter(Boolean);
        const badges = [];
        values.forEach(value => {
            const upper = value.toUpperCase();
            if((upper.includes('NEW') || upper.includes('MỚI')) && !badges.includes('NEW')) badges.push('NEW');
            if((upper.includes('HOT') || upper.includes('NỔI')) && !badges.includes('HOT')) badges.push('HOT');
            if((upper.includes('SALE') || upper.includes('KHUYẾN') || upper.includes('GIẢM')) && !badges.includes('SALE')) badges.push('SALE');
        });
        if((Number(
            posProduct.km_phan_tram
            ?? posProduct.salePercent
            ?? posProduct.discountPercent
            ?? posProduct.discount_percent
            ?? posProduct["Sale (%)"]
            ?? posProduct["Khuyến Mãi (%)"]
            ?? posProduct.Discount
            ?? posProduct.discount
            ?? 0
        ) || 0) > 0 && !badges.includes('SALE')) badges.push('SALE');
        return badges;
    };
    const mapPosVariants = (posProduct) => {
        const source = Array.isArray(posProduct.variants)
            ? posProduct.variants
            : (Array.isArray(posProduct.variantOptions) ? posProduct.variantOptions : []);
        if(!source.length) return [];
        return source.map((variant) => {
            const optionSource = Array.isArray(variant && variant.options)
                ? variant.options
                : (Array.isArray(variant && variant.values)
                    ? variant.values
                    : String((variant && (variant.options || variant.values || variant.value)) || '').split(/[,;|\n]+/));
            const options = optionSource.map((item) => String(item || '').trim()).filter(Boolean);
            const variantImage = String((variant && (variant.image || variant.link_anh || variant.img)) || '').trim();
            return {
                name: variant.name || variant.label || 'Phân loại',
                options,
                image: variantImage
            };
        }).filter((variant) => variant.options.length > 0);
    };
    const mapPosProductToAppProduct = (posProduct, index = 0) => {
        const images = normalizeDriveImageInput(posProduct.link_anh || posProduct.Image || posProduct.image || posProduct.img || '');
        const primaryImageMeta = getPrimaryHostedImageMeta(images);
        const wholesalePrice = parseMoney(posProduct.gia_si || posProduct.WholesalePrice || 0);
        const retailPrice = parseMoney(posProduct.gia_ban_le || posProduct.Price || posProduct.price || 0);
        const basePrice = wholesalePrice || retailPrice || 0;
        const discountPercent = Number(
            posProduct.km_phan_tram
            ?? posProduct.salePercent
            ?? posProduct.discountPercent
            ?? posProduct.discount_percent
            ?? posProduct["Sale (%)"]
            ?? posProduct["Khuyến Mãi (%)"]
            ?? posProduct.Discount
            ?? posProduct.discount
            ?? 0
        ) || 0;
        const finalPrice = discountPercent > 0 ? Math.max(0, Math.round(basePrice * (100 - discountPercent) / 100)) : basePrice;
        const stock = Number(posProduct.ton_kho || posProduct.Stock || posProduct.stock || 0) || 0;
        const pendingStock = Number(posProduct.dang_dat || posProduct.dd || posProduct.pending_stock || 0) || 0;
        const availableStock = Math.max(stock - pendingStock, 0);
        const sold = Number(posProduct.total_buy || posProduct.sold || 0) || 0;
        const groups = parseCategoryList([posProduct.group, posProduct.Group, posProduct.groups, posProduct.Groups].flat());
        const group = String(groups[0] || posProduct.group || posProduct.Group || '').trim();
        const code = String(posProduct.ma_sp || posProduct.code || posProduct.Code || posProduct.sku || posProduct.SKU || posProduct.id || posProduct.ID || `POS_${index + 1}`).trim();
        const updatedTs = Number(posProduct.updated_ts || posProduct.updatedAt || posProduct.UpdatedTs || 0) || 0;
        const firstImage = images[0] ? getOptimizedImageUrl(images[0], 'w800') : '';
        const variants = mapPosVariants(posProduct);
        const unit = String(posProduct.dvt || posProduct.unit || posProduct.don_vi || posProduct.don_vi_tinh || posProduct['Don vi tinh'] || posProduct['Đơn vị tính'] || '').trim();
        const groupKeys = new Set(groups.map((item) => normalizeKeyword(item)));
        const tags = [...new Set([
            ...parseCategoryList(posProduct.tags || posProduct.Tags || ''),
            ...(Array.isArray(primaryImageMeta && primaryImageMeta.t) ? primaryImageMeta.t : [])
        ].filter((item) => item && !groupKeys.has(normalizeKeyword(item))))];
        const primaryCategory = group || tags[0] || 'Sản phẩm';
        return {
            id: String(posProduct.id || posProduct.ID || code || `POS_${index + 1}`),
            code,
            group,
            groups,
            unit,
            cat: primaryCategory,
            tags,
            name: String(posProduct.name || posProduct.Name || `Sản phẩm ${index + 1}`),
            price: formatMoney(finalPrice || basePrice || 0),
            priceValue: finalPrice || basePrice || 0,
            originalPrice: discountPercent > 0 ? formatMoney(basePrice || 0) : '',
            originalPriceValue: basePrice || 0,
            salePercent: discountPercent,
            discountPercent,
            sold,
            images: images.length ? images.map(item => getOptimizedImageUrl(item, 'w1200')) : [firstImage],
            img: firstImage,
            desc: buildProductMetaDesc(posProduct.mo_ta || posProduct.description || posProduct.desc || (primaryImageMeta && primaryImageMeta.d) || '', group || primaryCategory, tags),
            variants,
            inStock: availableStock > 0,
            badges: mapPosBadges(posProduct),
            stock,
            updatedTs
        };
    };
    const loadCachedCatalogFromApp = () => {
        if(isCatalogLoadBlocked()) {
            shopProducts = [];
            productFeedState.hasMore = false;
            productFeedState.loading = false;
            productFeedState.error = getCatalogBlockedMessage();
            return false;
        }
        try {
            const cached = window.retailFirebase && typeof window.retailFirebase.getCachedCatalog === 'function'
                ? window.retailFirebase.getCachedCatalog()
                : JSON.parse(localStorage.getItem(POS_CACHE_KEYS.appCatalog) || 'null');
            if(cached && Array.isArray(cached.products) && cached.products.length > 0) {
                shopProducts = cached.products;
                syncState.lastCatalogVersion = String(cached.lastDeltaTs || cached.savedAt || cached.version || '');
                productFeedState.hasMore = cached.hasMore !== false;
                if(productFeedState.hasMore) productFeedState.endNoticeShown = false;
                productFeedState.error = '';
                return true;
            }
        } catch(error) {
            console.warn('Không đọc được cache catalog app:', error);
        }
        return false;
    };
    const persistMappedCatalog = (products, version) => {
        try {
            if(window.retailFirebase && typeof window.retailFirebase.setCatalogCache === 'function') {
                window.retailFirebase.setCatalogCache(products, {
                    version,
                    schema: syncState.posSchema
                });
            }
        } catch(error) {
            console.warn('Không lưu được cache catalog app:', error);
        }
    };
    const applyCatalogBlockedState = () => {
        shopProducts = [];
        productFeedState.hasMore = false;
        productFeedState.loading = false;
        productFeedState.error = getCatalogBlockedMessage();
        refreshCatalogViews();
        return false;
    };
    const refreshCatalogViews = () => {
        const homeTab = document.getElementById('tab-home');
        const productsTab = document.getElementById('tab-products');
        const categoryPopup = document.getElementById('product-category-overlay');
        const isHomeActive = !!(homeTab && homeTab.classList.contains('active'));
        const isProductsActive = !!(productsTab && productsTab.classList.contains('active'));
        const isCategoryPopupOpen = !!(categoryPopup && categoryPopup.classList.contains('is-open'));
        if(typeof window.applyPendingCategoryRouteIfPossible === 'function') {
            window.applyPendingCategoryRouteIfPossible({ refresh: false });
        }
        if(isHomeActive) {
            if(typeof window.renderHomeCategories === 'function') window.renderHomeCategories();
            if(typeof window.renderHomeDesktopCategoryMenu === 'function') window.renderHomeDesktopCategoryMenu();
            const filteredHomeProducts = getFilteredProducts(shopProducts);
            if(typeof window.renderHomeProductLists === 'function') window.renderHomeProductLists(filteredHomeProducts);
        }
        if((isProductsActive || isCategoryPopupOpen) && typeof window.renderProductsTabContent === 'function') {
            window.renderProductsTabContent();
        }
    };
    window.requestCatalogSyncAfterAuth = () => {
        if(isCatalogLoadBlocked()) return applyCatalogBlockedState();
        productFeedState.error = '';
        const hasCachedCatalog = loadCachedCatalogFromApp();
        if(hasCachedCatalog) refreshCatalogViews();
        else if(!productFeedState.initialSynced) refreshCatalogViews();
        scheduleIdleTask(() => syncCatalogFromPosCache({ refreshViews: true, force: !hasCachedCatalog }), 40);
        return true;
    };
    window.addEventListener('retail-catalog-updated', () => {
        if(loadCachedCatalogFromApp()) refreshCatalogViews();
    });
    const syncCatalogFromPosCache = (options = {}) => {
        try {
            if(isCatalogLoadBlocked()) return applyCatalogBlockedState();
            if(!window.retailFirebase || typeof window.retailFirebase.loadCatalogPage !== 'function') return false;
            if(productFeedState.loading) return false;
            productFeedState.loading = true;
            productFeedState.error = '';
            if(options.refreshViews !== false && !shopProducts.length) refreshCatalogViews();
            return window.retailFirebase.loadCatalogPage({
                reset: !!options.force,
                pageSize: options.pageSize || 24
            }).then((result) => {
                if(result && Array.isArray(result.products) && result.products.length > 0) {
                    shopProducts = result.products;
                    syncState.lastCatalogVersion = String(result.lastDeltaTs || result.savedAt || Date.now());
                    productFeedState.hasMore = result.hasMore !== false;
                    if(productFeedState.hasMore) productFeedState.endNoticeShown = false;
                    productFeedState.initialSynced = true;
                    productFeedState.error = '';
                    if(options.refreshViews !== false) refreshCatalogViews();
                    return true;
                }
                shopProducts = [];
                productFeedState.error = 'Chua tai duoc danh sach san pham tu Firebase.';
                if(options.refreshViews !== false) refreshCatalogViews();
                productFeedState.hasMore = !!(result && result.hasMore);
                if(productFeedState.hasMore) productFeedState.endNoticeShown = false;
                return false;
            }).catch((error) => {
                const message = String((error && (error.code || error.message)) || '').toLowerCase();
                shopProducts = [];
                productFeedState.error = message.includes('permission_denied')
                    ? 'Không đọc được danh sách sản phẩm từ Firebase. Hãy kiểm tra catalog_public, router shard 1 và chạy Đồng bộ ép buộc từ POS.'
                    : 'Lỗi tải sản phẩm từ Firebase.';
                refreshCatalogViews();
                return false;
            }).finally(() => {
                productFeedState.loading = false;
            });
        } catch(error) {
            console.warn('Không đồng bộ được catalog từ Firebase:', error);
            shopProducts = [];
            productFeedState.error = 'Loi tai san pham tu Firebase.';
            refreshCatalogViews();
            return false;
        }
    };
    const syncCatalogDeltaFromCloud = async () => {
        if(isCatalogLoadBlocked()) return applyCatalogBlockedState();
        if(!window.retailFirebase || typeof window.retailFirebase.syncCatalogDelta !== 'function') return false;
        if(productFeedState.loading) return false;

        productFeedState.loading = true;
        productFeedState.error = '';
        if(!shopProducts.length) refreshCatalogViews();
        try {
            const result = await window.retailFirebase.syncCatalogDelta({ pageSize: 60 });
            if(result && Array.isArray(result.products) && result.products.length > 0) {
                shopProducts = result.products;
                syncState.lastCatalogVersion = String(result.lastDeltaTs || result.savedAt || Date.now());
                productFeedState.hasMore = result.hasMore !== false;
                if(productFeedState.hasMore) productFeedState.endNoticeShown = false;
                productFeedState.error = '';
                refreshCatalogViews();
                return true;
            }
        } catch(error) {
            console.warn('Khong tai duoc delta catalog Firebase:', error);
            if(!shopProducts.length) {
                const message = String((error && (error.code || error.message)) || '').toLowerCase();
                productFeedState.error = message.includes('permission_denied')
                    ? 'Không đọc được danh sách sản phẩm từ Firebase. Hãy kiểm tra catalog_public, router shard 1 và chạy Đồng bộ ép buộc từ POS.'
                    : 'Lỗi tải sản phẩm từ Firebase.';
                refreshCatalogViews();
            }
        } finally {
            productFeedState.loading = false;
        }
        return false;
    };
    const loadMoreCatalogItems = async () => {
        if(productFeedState.loading) return false;
        if(!productFeedState.hasMore) {
            return false;
        }
        return syncCatalogFromPosCache({ refreshViews: true });
    };
    const setupCatalogLazyObserver = () => {
        if(productFeedState.observerReady || typeof IntersectionObserver !== 'function') return;
        const sentinels = [
            document.getElementById('home-products-sentinel'),
            document.getElementById('home-products-sentinel-desktop'),
            document.getElementById('products-tab-sentinel')
        ].filter(Boolean);
        if(!sentinels.length) return;

        const observer = new IntersectionObserver((entries) => {
            const shouldLoad = entries.some(entry => entry.isIntersecting);
            if(!shouldLoad) return;
            const homeActive = document.getElementById('tab-home').classList.contains('active');
            const productsActive = document.getElementById('tab-products').classList.contains('active');
            if(homeActive || productsActive) loadMoreCatalogItems();
        }, { rootMargin: '320px 0px' });

        sentinels.forEach(node => observer.observe(node));
        productFeedState.observerReady = true;
    };
    const mergeOrdersById = (localOrders = [], cloudOrders = []) => {
        const mergedMap = {};
        [...localOrders, ...cloudOrders].forEach((order) => {
            if(!order || !order.id) return;
            mergedMap[order.id] = {
                ...(mergedMap[order.id] || {}),
                ...order,
                items: (order.items && order.items.length) ? order.items : ((mergedMap[order.id] || {}).items || [])
            };
        });
        return Object.values(mergedMap).sort((a, b) => (Number(b.sortTs || 0) || 0) - (Number(a.sortTs || 0) || 0));
    };
    const reconcileOrdersWithCloud = (localOrders = [], cloudOrders = []) => {
        const cloudIds = new Set((Array.isArray(cloudOrders) ? cloudOrders : []).map((order) => String((order && order.id) || '').trim()).filter(Boolean));
        const preservedLocalOrders = (Array.isArray(localOrders) ? localOrders : []).filter((order) => {
            const orderId = String((order && order.id) || '').trim();
            if(!orderId) return false;
            if(cloudIds.has(orderId)) return true;
            const storageMode = String((order && order.storageMode) || '').trim().toLowerCase();
            const isPersisted = typeof (order && order.persisted) === 'boolean'
                ? !!order.persisted
                : storageMode !== 'gas-fallback';
            return !isPersisted || storageMode === 'gas-fallback';
        });
        return mergeOrdersById(preservedLocalOrders, cloudOrders);
    };
    const syncCurrentUserToCloud = async () => {
        if(!window.retailFirebase || !currentUser) return null;
        try {
            const safeUser = normalizeUserData({ ...currentUser });
            let authUid = String((safeUser && (safeUser.authUid || safeUser.auth_uid || safeUser.customerAuthUid)) || '').trim();
            if(!authUid && typeof window.retailFirebase.waitForAuthUser === 'function') {
                const authUser = await window.retailFirebase.waitForAuthUser();
                if(authUser && authUser.uid) authUid = String(authUser.uid || '').trim();
            }
            if(!authUid) return null;

            safeUser.authUid = authUid;
            safeUser.auth_uid = authUid;
            const profile = await window.retailFirebase.updateCurrentCustomerProfile(safeUser);
            if(profile) {
                currentUser = normalizeUserData({ ...currentUser, ...safeUser, ...profile, orders: currentUser.orders || [] });
                saveState();
            }
            return profile;
        } catch(error) {
            console.warn('Khong dong bo duoc ho so len Firebase:', error);
            return null;
        }
    };
    const hasRetailFirebase = () => !!(window.retailFirebase && typeof window.retailFirebase.bootstrapSession === 'function');
    const getFirebaseReadyMessage = () => {
        const status = window.__webNewScriptStatus || {};
        if(status.firebase === 'failed') return 'Không tải được file firebase.js. Hãy kiểm tra URL file local/public và thử tải lại.';
        return 'Firebase chưa sẵn sàng. Kiểm tra XAMPP hoặc URL file firebase.js.';
    };
    const waitForRetailFirebaseReady = (timeout = 8000) => {
        if(hasRetailFirebase()) return Promise.resolve(window.retailFirebase);
        return new Promise((resolve) => {
            const startedAt = Date.now();
            const timer = setInterval(() => {
                if(hasRetailFirebase() || Date.now() - startedAt >= timeout) {
                    clearInterval(timer);
                    resolve(window.retailFirebase || null);
                }
            }, 120);
        });
    };
    const syncCustomerSessionFromFirebase = async (options = {}) => {
        if(!hasRetailFirebase() || remoteState.accountSyncing) return null;
        remoteState.accountSyncing = true;
        try {
            const result = await window.retailFirebase.bootstrapSession();
            if(!result || !result.user) {
                if(options.clearIfSignedOut) {
                    currentUser = null;
                    saveState();
                }
                if(isCatalogLoadBlocked()) applyCatalogBlockedState();
                return null;
            }

            currentUser = normalizeUserData({
                ...(currentUser || {}),
                ...(result.profile || {}),
                authUid: result.user.uid,
                email: (result.profile && result.profile.email) || result.user.email || ((currentUser && currentUser.email) || ''),
                orders: mergeOrdersById((currentUser && currentUser.orders) || [], (result.profile && result.profile.orders) || [])
            });
            saveState();
            remoteState.sessionBooted = true;
            if(!options.skipCatalogRefresh && typeof window.requestCatalogSyncAfterAuth === 'function') {
                window.requestCatalogSyncAfterAuth();
            }
            return currentUser;
        } catch(error) {
            console.warn('Khong khoi tao duoc session Firebase:', error);
            return null;
        } finally {
            remoteState.accountSyncing = false;
        }
    };
    const syncOrdersFromFirebase = async (options = {}) => {
        if(!window.retailFirebase || !currentUser || !currentUser.authUid || remoteState.ordersSyncing) return currentUser ? currentUser.orders || [] : [];
        remoteState.ordersSyncing = true;
        try {
            const cloudOrders = await window.retailFirebase.loadOrders({ force: !!options.force, limit: options.limit || 30 });
            if(Array.isArray(cloudOrders)) {
                currentUser = normalizeUserData({
                    ...currentUser,
                    orders: reconcileOrdersWithCloud((currentUser && currentUser.orders) || [], cloudOrders)
                });
                saveState();
                return currentUser.orders || [];
            }
        } catch(error) {
            console.warn('Khong tai duoc lich su don Firebase:', error);
        } finally {
            remoteState.ordersSyncing = false;
        }
        return currentUser ? currentUser.orders || [] : [];
    };
    const syncOrderDetailFromFirebase = async (orderId) => {
        if(!window.retailFirebase || !currentUser || !currentUser.authUid || !orderId) return null;
        try {
            const detail = await window.retailFirebase.loadOrderDetail(orderId);
            if(detail && Array.isArray(detail.items)) {
                currentUser.orders = (currentUser.orders || []).map((order) => {
                    if(order.id !== orderId) return order;
                    return { ...order, items: detail.items, itemsCount: detail.items.length };
                });
                saveState();
                return detail;
            }
            currentUser.orders = (currentUser.orders || []).filter((order) => order.id !== orderId);
            saveState();
        } catch(error) {
            console.warn('Khong tai duoc chi tiet don Firebase:', error);
        }
        return null;
    };
    const isProductInStock = (product) => {
        if(!product) return false;
        if(typeof product.availableStock === 'number') return product.availableStock > 0;
        if(typeof product.stock === 'number' && typeof product.pendingStock === 'number') return (product.stock - product.pendingStock) > 0;
        return product.inStock !== false;
    };
    const renderProductBadges = (product) => {
        const badges = product && Array.isArray(product.badges) ? product.badges : [];
        const salePercent = getProductSalePercent(product);
        if(!badges.length && salePercent <= 0) return '';

        const badgeStyles = {
            NEW: 'bg-blue-500 text-white',
            HOT: 'bg-orange-500 text-white',
            SALE: 'bg-amber-400 text-white'
        };
        const badgeItems = [];
        if(salePercent > 0) {
            badgeItems.push({
                label: `-${salePercent}%`,
                className: 'bg-red-500 text-white'
            });
        }
        badges.forEach((badge) => {
            if(badge === 'SALE') return;
            badgeItems.push({
                label: badge,
                className: badgeStyles[badge] || 'bg-gray-800 text-white'
            });
        });

        return `
            <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                ${badgeItems.map((item) => `<span class="rounded-lg border border-white/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest shadow ${item.className}">${item.label}</span>`).join('')}
            </div>
        `;
    };
    const syncClosedModalShellVisibility = () => {
        document.querySelectorAll('.modal-shell').forEach((shell) => {
            if(shell.classList.contains('is-open')) return;
            shell.style.display = 'none';
            shell.setAttribute('aria-hidden', 'true');
        });
    };
    const modalDocumentLockState = {
        locked: false,
        htmlOverflow: '',
        bodyOverflow: '',
        bodyPaddingRight: ''
    };
    const syncModalScrollLock = () => {
        const hasOpenModal = getOpenModalShells().length > 0;
        const docEl = document.documentElement;
        const body = document.body;
        if(!docEl || !body) return;
        if(hasOpenModal) {
            if(!modalDocumentLockState.locked) {
                modalDocumentLockState.locked = true;
                modalDocumentLockState.htmlOverflow = docEl.style.overflow || '';
                modalDocumentLockState.bodyOverflow = body.style.overflow || '';
                modalDocumentLockState.bodyPaddingRight = body.style.paddingRight || '';
                const scrollbarWidth = Math.max(window.innerWidth - docEl.clientWidth, 0);
                docEl.style.overflow = 'hidden';
                body.style.overflow = 'hidden';
                if(scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
            }
            body.classList.add('modal-scroll-locked');
            return;
        }
        if(!modalDocumentLockState.locked) return;
        docEl.style.overflow = modalDocumentLockState.htmlOverflow;
        body.style.overflow = modalDocumentLockState.bodyOverflow;
        body.style.paddingRight = modalDocumentLockState.bodyPaddingRight;
        body.classList.remove('modal-scroll-locked');
        modalDocumentLockState.locked = false;
    };
    const openModalShell = (overlayId) => {
        const el = document.getElementById(overlayId);
        if(!el) return;
        el.style.display = '';
        el.classList.add('is-open');
        el.removeAttribute('aria-hidden');
        syncModalScrollLock();
    };
    const closeModalShell = (overlayId) => {
        const el = document.getElementById(overlayId);
        if(!el) return;
        const activeElement = document.activeElement;
        if(activeElement && typeof el.contains === 'function' && el.contains(activeElement) && typeof activeElement.blur === 'function') {
            activeElement.blur();
        }
        el.classList.remove('is-open');
        el.setAttribute('aria-hidden', 'true');
        syncModalScrollLock();
        window.setTimeout(() => {
            if(!el.classList.contains('is-open')) el.style.display = 'none';
        }, 220);
    };
    const getOpenModalShells = () => Array.from(document.querySelectorAll('.modal-shell.is-open'));
    const getTopmostOpenModalShell = () => {
        const openShells = getOpenModalShells();
        if(!openShells.length) return null;
        return openShells
            .map((shell, index) => ({
                shell,
                index,
                zIndex: Number(window.getComputedStyle(shell).zIndex) || 0
            }))
            .sort((left, right) => left.zIndex - right.zIndex || left.index - right.index)
            .pop().shell;
    };
    const runModalCloseAction = (shell) => {
        if(!shell) return false;
        const actionName = String(shell.getAttribute('data-close-action') || '').trim();
        if(actionName && typeof window[actionName] === 'function') {
            window[actionName]();
            return true;
        }
        if(shell.id) {
            closeModalShell(shell.id);
            return true;
        }
        return false;
    };
    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            syncClosedModalShellVisibility();
            syncModalScrollLock();
        }, { once: true });
    } else {
        syncClosedModalShellVisibility();
        syncModalScrollLock();
    }
    const dismissTopmostModalShell = () => runModalCloseAction(getTopmostOpenModalShell());
    const getModalTouchContext = (target) => {
        if(!target || !target.closest) return null;
        const panel = target.closest('.modal-panel');
        const shell = (panel && panel.closest('.modal-shell'))
            || target.closest('.modal-shell');
        if(!shell || !shell.classList.contains('is-open')) return null;
        if(getTopmostOpenModalShell() !== shell) return null;
        return {
            shell,
            panel: panel || shell.querySelector('.modal-panel') || shell
        };
    };
    const isFormFieldTarget = (target) => !!(target && target.closest && target.closest('input, textarea, select, option, [contenteditable=""], [contenteditable="true"]'));
    const canScrollNodeInDirection = (node, deltaY) => {
        if(!(node instanceof HTMLElement)) return false;
        if(Math.abs(Number(deltaY) || 0) < 0.5) return false;
        if(node.scrollHeight <= node.clientHeight + 1) return false;
        if(deltaY < 0) return node.scrollTop > 0;
        return (node.scrollTop + node.clientHeight) < (node.scrollHeight - 1);
    };
    const findScrollableModalTarget = (panel, target, deltaY) => {
        let node = target instanceof Element ? target : panel;
        while(node) {
            if(canScrollNodeInDirection(node, deltaY)) return node;
            if(node === panel) break;
            node = node.parentElement;
        }
        return canScrollNodeInDirection(panel, deltaY) ? panel : null;
    };
    const isScrollChainAtTop = (panel, target) => {
        let node = target instanceof Element ? target : panel;
        while(node) {
            if(node.scrollHeight > node.clientHeight + 12 && node.scrollTop > 12) return false;
            if(node === panel) break;
            node = node.parentElement;
        }
        return !(panel && panel.scrollHeight > panel.clientHeight + 12 && panel.scrollTop > 12);
    };
    let modalSwipeState = null;
    window.dismissTopmostModalShell = dismissTopmostModalShell;
    document.addEventListener('wheel', (event) => {
        const shell = getTopmostOpenModalShell();
        if(!shell) return;
        const panel = shell.querySelector('.modal-panel') || shell;
        const target = event.target instanceof Element ? event.target : null;
        if(!target || !shell.contains(target)) {
            if(canScrollNodeInDirection(panel, event.deltaY)) panel.scrollTop += event.deltaY;
            event.preventDefault();
            if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
            event.stopPropagation();
            return;
        }
        if(!panel.contains(target)) {
            if(canScrollNodeInDirection(panel, event.deltaY)) panel.scrollTop += event.deltaY;
            event.preventDefault();
            if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
            event.stopPropagation();
            return;
        }
        if(findScrollableModalTarget(panel, target, event.deltaY)) return;
        if(canScrollNodeInDirection(panel, event.deltaY)) panel.scrollTop += event.deltaY;
        event.preventDefault();
        if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        event.stopPropagation();
    }, { passive: false, capture: true });
    document.addEventListener('keydown', (event) => {
        if(event.defaultPrevented || event.isComposing || event.key !== 'Escape') return;
        if(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if(!dismissTopmostModalShell()) return;
        event.preventDefault();
        if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        event.stopPropagation();
    });
    document.addEventListener('touchstart', (event) => {
        if(!event.touches || event.touches.length !== 1) {
            modalSwipeState = null;
            return;
        }
        const context = getModalTouchContext(event.target);
        if(!context || isFormFieldTarget(event.target)) {
            modalSwipeState = null;
            return;
        }
        modalSwipeState = {
            shell: context.shell,
            panel: context.panel,
            startX: event.touches[0].clientX,
            startY: event.touches[0].clientY,
            startedAt: Date.now(),
            startedAtTop: isScrollChainAtTop(context.panel, event.target)
        };
    }, { passive: true });
    document.addEventListener('touchend', (event) => {
        if(!modalSwipeState || !event.changedTouches || !event.changedTouches.length) {
            modalSwipeState = null;
            return;
        }
        const state = modalSwipeState;
        modalSwipeState = null;
        const context = getModalTouchContext(event.target || state.panel);
        if(!context || context.shell !== state.shell) return;
        if(!state.startedAtTop || !isScrollChainAtTop(state.panel, event.target || state.panel)) return;
        const diffX = event.changedTouches[0].clientX - state.startX;
        const diffY = event.changedTouches[0].clientY - state.startY;
        const duration = Date.now() - state.startedAt;
        if(duration > 360) return;
        if(diffY > -84) return;
        if(Math.abs(diffY) <= Math.abs(diffX) * 1.15) return;
        runModalCloseAction(state.shell);
    }, { passive: true });
    const showToast = (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if(!container || !message) return;

        const colorMap = {
            success: 'border-green-200 bg-green-50 text-green-700',
            error: 'border-red-200 bg-red-50 text-red-700',
            warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
            info: 'border-pink-200 bg-white text-gray-700'
        };
        const iconMap = {
            success: 'fa-circle-check',
            error: 'fa-circle-exclamation',
            warning: 'fa-triangle-exclamation',
            info: 'fa-bell'
        };

        const toast = document.createElement('div');
        toast.className = `toast-item pointer-events-auto rounded-2xl border shadow-lg px-4 py-3 backdrop-blur-sm ${colorMap[type] || colorMap.info}`;
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shrink-0">
                    <i class="fa-solid ${iconMap[type] || iconMap.info}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold leading-5">${message}</p>
                </div>
            </div>
        `;

        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 220);
        }, 2600);
    };
    window.showToast = showToast;
    window.alert = (message) => showToast(message, 'info');
    let lastPlacedOrderMeta = null;
    let dismissedOrderSuccessId = '';
    window.openWelcomePopup = () => {
        const renderPopup = () => {
            if(window.introExperienceModule && typeof window.introExperienceModule.fillWelcomePopup === 'function') {
                window.introExperienceModule.fillWelcomePopup();
            } else if(window.uiPc && typeof window.uiPc.fillWelcomePopup === 'function') {
                window.uiPc.fillWelcomePopup(window.WELCOME_POPUP_CONTENT || {});
            }
            openModalShell('welcome-popup-overlay');
        };

        if(window.introExperienceModule && typeof window.introExperienceModule.fillWelcomePopup === 'function') {
            renderPopup();
            return;
        }

        if(window.webNewLoader && typeof window.webNewLoader.ensureBundle === 'function') {
            window.webNewLoader.ensureBundle('intro')
                .catch(() => false)
                .then(renderPopup);
            return;
        }

        renderPopup();
    };
    window.closeWelcomePopup = () => closeModalShell('welcome-popup-overlay');
    window.openAccountFromWelcomePopup = () => {
        closeModalShell('welcome-popup-overlay');
        goToTab('tab-account');
        openAuth();
    };
    window.viewProductsFromWelcomePopup = () => {
        closeModalShell('welcome-popup-overlay');
        goToTab('tab-products');
    };
    const buildOrderSupportZaloMessage = (payload = {}) => {
        const renderMoney = (value) => formatMoney(Number(value || 0) || 0);
        const items = Array.isArray(payload.items) ? payload.items : [];
        const itemLines = items.length
            ? items.map((item, index) => {
                const qty = Number(item.quantity || item.qty || 1) || 1;
                const unitPrice = Number(item.priceValue || parseMoney(item.price) || 0) || 0;
                const productName = getProductDisplayName(item) || item.name || 'Sản phẩm';
                return `${index + 1}. ${productName} | SL ${qty} | ${renderMoney(unitPrice)}`;
            }).join('\n')
            : 'Shop vui lòng kiểm tra lại chi tiết sản phẩm giúp em.';

        return [
            `Shop ơi, em vừa đặt đơn ${payload.orderId || ''}.`,
            payload.createdAt ? `Thời gian: ${payload.createdAt}` : '',
            payload.customerName ? `Người nhận: ${payload.customerName}` : '',
            payload.phone ? `Số điện thoại: ${payload.phone}` : '',
            payload.address ? `Địa chỉ: ${payload.address}` : '',
            '',
            'Chi tiết đơn hàng:',
            itemLines,
            '',
            `Tổng thanh toán: ${renderMoney(payload.finalAmount || payload.totalAmount || 0)}`,
            payload.orderDiscountValue > 0 ? `Chiết khấu hóa đơn: -${renderMoney(payload.orderDiscountValue)}` : '',
            payload.productDiscountValue > 0 ? `Giảm giá sản phẩm: -${renderMoney(payload.productDiscountValue)}` : '',
            '',
            'Nhờ shop xác nhận đơn giúp em ạ.'
        ].filter(Boolean).join('\n');
    };
    window.openOrderSupportZalo = () => {
        const message = buildOrderSupportZaloMessage(lastPlacedOrderMeta || {});
        openStoreZalo(message, ORDER_SUPPORT_ZALO_PHONE);
    };
    const renderOrderSuccessInvoice = (payload = {}) => {
        let invoice = document.getElementById('order-success-invoice');
        if(!invoice) {
            const overlay = ensureOrderSuccessModalShell();
            invoice = overlay ? overlay.querySelector('#order-success-invoice') : null;
        }
        if(!invoice) return;

        const items = Array.isArray(payload.items) ? payload.items : [];
        const renderMoney = (value) => formatMoney(Number(value || 0) || 0);
        const rows = items.length
            ? items.map((item) => {
                const qty = Number(item.quantity || item.qty || 1) || 1;
                const unitPrice = Number(item.priceValue || parseMoney(item.price) || 0) || 0;
                const lineTotal = unitPrice * qty;
                const variantHtml = item.variantInfo ? `<p class="order-success-item-variant">${escapeHtml(item.variantInfo)}</p>` : '';
                return `
                    <div class="order-success-item-row">
                        <div class="order-success-item-main">
                            <p class="order-success-item-name">${escapeHtml(getProductDisplayName(item) || item.name || 'Sản phẩm')}</p>
                            ${variantHtml}
                            <p class="order-success-item-meta">SL ${qty} x ${renderMoney(unitPrice)}</p>
                        </div>
                        <div class="order-success-item-total">${renderMoney(lineTotal)}</div>
                    </div>
                `;
            }).join('')
            : `<div class="order-success-empty">Chi tiết sản phẩm sẽ được shop xác nhận qua Zalo.</div>`;

        const summaryRows = [
            payload.originalAmount > payload.totalAmount
                ? `<div class="order-success-summary-row order-success-summary-row-muted"><span>Tổng gốc</span><span class="whitespace-nowrap line-through">${renderMoney(payload.originalAmount)}</span></div>`
                : '',
            payload.productDiscountValue > 0
                ? `<div class="order-success-summary-row order-success-summary-row-positive"><span>Giảm giá sản phẩm</span><span class="whitespace-nowrap">-${renderMoney(payload.productDiscountValue)}</span></div>`
                : '',
            payload.orderDiscountValue > 0
                ? `<div class="order-success-summary-row order-success-summary-row-positive"><span>Chiết khấu hóa đơn${payload.orderDiscountPercent ? ` (${payload.orderDiscountPercent}%)` : ''}</span><span class="whitespace-nowrap">-${renderMoney(payload.orderDiscountValue)}</span></div>`
                : '',
            `<div class="order-success-summary-row order-success-summary-row-total"><span>Tổng thanh toán</span><span class="text-babyPink whitespace-nowrap">${renderMoney(payload.finalAmount || payload.totalAmount)}</span></div>`
        ].filter(Boolean).join('');

        const customerRows = [
            payload.customerName ? `<div class="order-success-detail-card"><span class="order-success-detail-label">Người nhận</span><strong>${escapeHtml(payload.customerName)}</strong></div>` : '',
            payload.phone ? `<div class="order-success-detail-card"><span class="order-success-detail-label">Số điện thoại nhận hàng</span><strong>${escapeHtml(payload.phone)}</strong></div>` : '',
            payload.address ? `<div class="order-success-detail-card order-success-detail-card-wide"><span class="order-success-detail-label">Địa chỉ nhận hàng</span><strong>${escapeHtml(payload.address)}</strong></div>` : ''
        ].filter(Boolean).join('');

        invoice.innerHTML = `
            <div class="order-success-invoice-shell">
                <div class="order-success-invoice-top">
                    <div>
                        <p class="order-success-eyebrow">Hóa đơn đặt hàng</p>
                        <h4 class="order-success-order-id">${escapeHtml(payload.orderId || 'Đơn hàng')}</h4>
                    </div>
                    <div class="order-success-status-box">
                        <p>${escapeHtml(payload.createdAt || new Date().toLocaleString('vi-VN'))}</p>
                        <strong>${getOrderSuccessStatusText(payload)}</strong>
                    </div>
                </div>
                <div class="order-success-detail-grid">
                    ${customerRows}
                </div>
                <div class="order-success-items-block">
                    <div class="order-success-section-head">
                        <span>Chi tiết sản phẩm</span>
                        <span>${items.length} món</span>
                    </div>
                    <div class="order-success-items-list">
                        ${rows}
                    </div>
                </div>
                <div class="order-success-summary-block">
                    ${summaryRows}
                </div>
            </div>
        `;
    };
    const ensureOrderSuccessModalShell = () => {
        let overlay = document.getElementById('order-success-overlay');
        if(overlay) return overlay;
        const host = document.body || document.documentElement;
        if(!host) return null;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="fixed inset-0 z-[96] bg-black/50 modal-shell flex items-center justify-center p-4" id="order-success-overlay" data-close-action="closeOrderSuccessModal" onclick="if(event.target === this) closeOrderSuccessModal()">
                <div class="modal-panel order-success-panel bg-white rounded-[28px] w-full max-w-xl max-h-[88vh] overflow-y-auto no-scrollbar p-5 shadow-2xl" onclick="event.stopPropagation()">
                    <div class="order-success-header">
                        <div class="order-success-header-icon"><i class="fa-solid fa-circle-check"></i></div>
                        <div class="order-success-header-copy">
                            <h3 class="text-lg font-bold text-center text-gray-800 mb-2" id="order-success-title">Đặt hàng thành công</h3>
                            <p class="text-sm text-gray-500 text-center leading-6" id="order-success-message">Đơn hàng của bạn đã được ghi nhận.</p>
                        </div>
                    </div>
                    <div class="order-success-meta-grid" id="order-success-meta"></div>
                    <div class="mt-4 rounded-[24px] overflow-hidden" id="order-success-invoice"></div>
                    <div class="flex gap-3 mt-5 order-success-actions">
                        <button class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold" onclick="closeOrderSuccessModal()">Đóng</button>
                        <button class="flex-1 bg-babyPink text-white py-3 rounded-xl font-bold shadow-md hover:bg-pink-500 transition" id="order-success-zalo-btn" onclick="openOrderSupportZalo()">Gửi chi tiết đơn qua Zalo</button>
                    </div>
                </div>
            </div>
        `;
        overlay = wrapper.firstElementChild;
        if(overlay) host.appendChild(overlay);
        return overlay;
    };
    window.openOrderSuccessModal = (payload = {}) => {
        lastPlacedOrderMeta = payload;
        const overlay = ensureOrderSuccessModalShell();
        const panel = overlay ? overlay.querySelector('.modal-panel') : null;
        const dismissKey = getOrderSuccessDismissKey(payload);
        const wasOpen = !!(overlay && overlay.classList.contains('is-open'));
        if(payload.pendingSync && dismissKey) dismissedOrderSuccessId = '';
        const title = document.getElementById('order-success-title');
        const msg = document.getElementById('order-success-message');
        const meta = document.getElementById('order-success-meta');
        const zaloButton = document.getElementById('order-success-zalo-btn');
        const isUpdatedOrder = !!payload.updatedExistingOrder;
        if(title) {
            if(payload.pendingSync) title.innerText = isUpdatedOrder ? 'Đang cập nhật đơn hàng' : 'Đang gửi đơn hàng';
            else title.innerText = isUpdatedOrder ? 'Cập nhật đơn hàng thành công' : 'Đặt hàng thành công';
        }
        if(msg) {
            msg.innerText = getOrderSuccessMessage(payload);
        }
        if(meta) {
            const lines = [
                payload.orderId ? `Mã đơn: ${payload.orderId}` : '',
                payload.createdAt ? `Thời gian: ${payload.createdAt}` : '',
                payload.finalAmount ? `Tổng thanh toán: ${formatMoney(payload.finalAmount)}` : ''
            ].filter(Boolean);
            meta.innerHTML = lines.map((line, index) => `
                <div class="order-success-meta-card ${index === 2 ? 'order-success-meta-card-strong' : ''}">
                    <span>${escapeHtml(line)}</span>
                </div>
            `).join('');
        }
        if(zaloButton) zaloButton.innerText = `Gửi chi tiết đơn qua Zalo ${ORDER_SUPPORT_ZALO_PHONE}`;
        renderOrderSuccessInvoice(payload);
        if(wasOpen) return;
        if(!payload.pendingSync && dismissKey && dismissedOrderSuccessId === dismissKey) return;
        openModalShell('order-success-overlay');
        if(overlay) {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
            overlay.removeAttribute('aria-hidden');
        }
        if(panel) {
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0) scale(1)';
        }
    };
    window.closeOrderSuccessModal = () => {
        const overlay = document.getElementById('order-success-overlay');
        const panel = overlay ? overlay.querySelector('.modal-panel') : null;
        const dismissKey = getOrderSuccessDismissKey(lastPlacedOrderMeta || {});
        if(dismissKey) dismissedOrderSuccessId = dismissKey;
        if(panel) {
            panel.style.opacity = '';
            panel.style.transform = '';
        }
        if(overlay) {
            overlay.style.opacity = '';
            overlay.style.pointerEvents = '';
        }
        closeModalShell('order-success-overlay');
    };
    const upsertDefaultAddress = (addressText, shippingPhone = '') => {
        if(!currentUser) return;
        const text = String(addressText || '').trim();
        const phone = String(shippingPhone || '').trim();
        if(!text) return;
        if(!Array.isArray(currentUser.addresses)) currentUser.addresses = [];
        currentUser.addresses.forEach((item) => { item.isDefault = false; });
        const existed = currentUser.addresses.find((item) => String((item && item.text) || '').trim() === text);
        if(existed) {
            existed.isDefault = true;
            if(phone) existed.phone = phone;
        } else {
            currentUser.addresses.unshift({ id: `addr_${Date.now()}`, text, phone, isDefault: true });
        }
        currentUser.address = text;
        if(phone) currentUser.shippingPhone = phone;
    };
    const waitForCheckoutInfo = (payload = {}) => {
        checkoutInfoState = payload;
        const note = document.getElementById('checkout-info-note');
        const nameInput = document.getElementById('checkout-customer-name');
        const phoneInput = document.getElementById('checkout-phone-input');
        const addressInput = document.getElementById('checkout-address-input');
        const emailInput = document.getElementById('checkout-email-input');
        if(note) {
            note.innerText = payload.isGuest
                ? 'Khách chưa đăng nhập vẫn có thể đặt đơn, nhưng cần điền số điện thoại và địa chỉ để shop xác nhận.'
                : 'Tài khoản của bạn đang thiếu số điện thoại hoặc địa chỉ giao hàng. Vui lòng cập nhật trước khi đặt đơn.';
        }
        if(nameInput) nameInput.value = payload.customerName || DEFAULT_GUEST_NAME;
        if(phoneInput) phoneInput.value = payload.phone || '';
        if(addressInput) addressInput.value = payload.address || '';
        if(emailInput) emailInput.value = payload.email || '';
        openModalShell('checkout-info-overlay');
        return new Promise((resolve) => {
            checkoutInfoResolver = resolve;
            setTimeout(() => {
                if(phoneInput && !phoneInput.value.trim()) phoneInput.focus();
                else if(addressInput && !addressInput.value.trim()) addressInput.focus();
            }, 40);
        });
    };
    window.closeCheckoutInfoModal = (result = null) => {
        closeModalShell('checkout-info-overlay');
        const resolver = checkoutInfoResolver;
        checkoutInfoResolver = null;
        checkoutInfoState = null;
        if(resolver) resolver(result);
    };
    window.submitCheckoutInfo = () => {
        const phone = String((document.getElementById('checkout-phone-input') || {}).value || '').trim();
        const address = String((document.getElementById('checkout-address-input') || {}).value || '').trim();
        const email = String((document.getElementById('checkout-email-input') || {}).value || '').trim();
        const customerName = String((document.getElementById('checkout-customer-name') || {}).value || DEFAULT_GUEST_NAME).trim() || DEFAULT_GUEST_NAME;
        if(!phone) return showToast('Vui lòng nhập số điện thoại nhận hàng.', 'warning');
        if(!address) return showToast('Vui lòng nhập địa chỉ nhận hàng.', 'warning');

        if(checkoutInfoState && !checkoutInfoState.isGuest && currentUser) {
            currentUser.shippingPhone = phone;
            if(email) currentUser.email = email;
            upsertDefaultAddress(address, phone);
            saveState();
            scheduleIdleTask(() => syncCurrentUserToCloud());
            if(typeof window.renderAccountTab === 'function') window.renderAccountTab();
        }

        window.closeCheckoutInfoModal({
            customerName,
            phone,
            address,
            email
        });
    };
    const openConfirmModal = (message, onConfirm) => {
        confirmCallback = typeof onConfirm === 'function' ? onConfirm : null;
        document.getElementById('confirm-message').innerText = message;
        openModalShell('confirm-overlay');
    };
    window.closeConfirmModal = () => {
        confirmCallback = null;
        closeModalShell('confirm-overlay');
    };
    window.confirmModalAction = () => {
        const cb = confirmCallback;
        closeModalShell('confirm-overlay');
        confirmCallback = null;
        if(cb) cb();
    };
    const normalizeUserData = (user) => {
        if(!user) return null;
        if(!user.orders) user.orders = [];
        if(!Array.isArray(user.addresses)) user.addresses = [];
        user.authUid = String(user.authUid || user.auth_uid || user.customerAuthUid || '').trim();
        if(user.authUid && !user.auth_uid) user.auth_uid = user.authUid;
        const safeStatus = String(user.status || user.customerStatus || '').trim().toLowerCase();
        if (!safeStatus || ['active', 'online', 'hoạt động', 'hoat dong', 'đang giao dịch', 'dang giao dich'].includes(safeStatus)) {
            user.status = 'Hoạt động';
        } else if (['offline', 'inactive', 'disabled', 'blocked', 'lock', 'locked', 'ngừng hoạt động', 'ngung hoat dong', 'ngừng giao dịch', 'ngung giao dich'].includes(safeStatus)) {
            user.status = 'Ngừng hoạt động';
        } else {
            user.status = String(user.status || user.customerStatus || '').trim() || 'Hoạt động';
        }
        user.customerStatus = user.status;
        if(typeof user.email !== 'string') user.email = '';
        if(typeof user.phone !== 'string') user.phone = '';
        if(typeof user.shippingPhone !== 'string') user.shippingPhone = '';
        if(typeof user.bio !== 'string') user.bio = 'An tâm chọn đồ tốt cho bé mỗi ngày.';
        if(typeof user.gender !== 'string') user.gender = 'Chưa cập nhật';
        if(typeof user.birthday !== 'string') user.birthday = '';
        if(typeof user.personalInfo !== 'string') user.personalInfo = 'Thiết lập ngay';
        if(typeof user.maritalStatus !== 'string') user.maritalStatus = 'Chưa cập nhật';
        const ageFromBirthday = calculateAgeFromBirthday(user.birthday);
        user.age = ageFromBirthday > 0 ? String(ageFromBirthday) : String(user.age || '').trim();
        user.interests = parseProfileList(user.interests);
        user.concerns = parseProfileList(user.concerns);
        user.favoriteProducts = parseProfileList(user.favoriteProducts);
        if(user.favoriteProducts.length) {
            wishlistData = [...new Set([]
                .concat(Array.isArray(wishlistData) ? wishlistData : [])
                .concat(user.favoriteProducts)
                .map((item) => String(item || '').trim())
                .filter(Boolean))];
        }
        if(typeof user.avatar !== 'string') user.avatar = '';
        if(!user.phone && user.email) {
            const aliasMatch = String(user.email || '').trim().toLowerCase().match(new RegExp(`^(\\d{8,15})@${String(window.CUSTOMER_PHONE_DOMAIN || 'truongan.com').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
            if(aliasMatch) user.phone = aliasMatch[1];
        }
        if(!user.phone && user.email && !user.email.includes('@')) {
            user.phone = user.email;
            user.email = '';
        }
        user.addresses = user.addresses
            .map((address, index) => {
                const text = String((address && (address.text || address.address)) || '').trim();
                if(!text) return null;
                return {
                    id: String((address && address.id) || `addr_${index + 1}`),
                    text,
                    phone: String((address && address.phone) || '').trim(),
                    isDefault: !!(address && address.isDefault)
                };
            })
            .filter(Boolean);
        if(!user.addresses.length && String(user.address || '').trim()) {
            user.addresses = [{
                id: `addr_${Date.now()}`,
                text: String(user.address).trim(),
                phone: String(user.shippingPhone || '').trim(),
                isDefault: true
            }];
        }
        if(user.addresses.length && !user.addresses.some((address) => address.isDefault)) user.addresses[0].isDefault = true;
        const defaultAddress = user.addresses.find((address) => address && address.isDefault) || user.addresses[0];
        if(defaultAddress) {
            user.address = String(defaultAddress.text || '').trim();
            if(!user.shippingPhone && defaultAddress.phone) user.shippingPhone = String(defaultAddress.phone || '').trim();
            if(!defaultAddress.phone && user.shippingPhone) defaultAddress.phone = String(user.shippingPhone || '').trim();
        }
        if(!user.shippingPhone && user.phone) user.shippingPhone = String(user.phone || '').trim();
        if(Array.isArray(wishlistData) && wishlistData.length) {
            user.favoriteProducts = [...new Set(user.favoriteProducts.concat(wishlistData.map((item) => String(item || '').trim()).filter(Boolean)))];
        }
        return user;
    };
    const getUserContactText = (user) => {
        if(!user) return '';
        return [user.phone, user.email].filter(Boolean).join(' - ');
    };
    const getOrderTotals = (order) => {
        if(typeof window.cartLogicGetOrderTotals === 'function') return window.cartLogicGetOrderTotals(order);
        return {
            totalAmount: 0,
            discountPercent: 0,
            discountValue: 0,
            finalAmount: 0
        };
    };
    const escapeTelegramHtml = (value = '') => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const formatTelegramTimestamp = () => new Date().toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const postTelegramAlert = (message) => {
        if(!TELEGRAM_WEBHOOK_URL) return Promise.resolve(false);
        return fetch(TELEGRAM_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({ message })
        }).then(() => true).catch((error) => {
            console.warn('Khong gui duoc thong bao Telegram:', error);
            return false;
        });
    };
    const sendTelegramEvent = (type, payload = {}) => {
        const safeType = String(type || '').trim();
        if(!safeType) return Promise.resolve(false);
        let message = '';
        if(safeType === 'register') {
            message = [
                '<b>Khach moi dang ky tu web</b>',
                `Ten: <b>${escapeTelegramHtml(payload.name || DEFAULT_GUEST_NAME)}</b>`,
            `Loai khach: ${escapeTelegramHtml(payload.customerType || payload.group || DEFAULT_WEB_CUSTOMER_GROUP)}`,
                `Email: ${escapeTelegramHtml(payload.email || 'Chua cap nhat')}`,
                `SDT: ${escapeTelegramHtml(payload.phone || 'Chua cap nhat')}`,
                `Dia chi: ${escapeTelegramHtml(payload.address || 'Chua cap nhat')}`,
                `Thoi gian: ${escapeTelegramHtml(formatTelegramTimestamp())}`
            ].join('\n');
        } else if(safeType === 'order') {
            const items = Array.isArray(payload.items) ? payload.items : [];
            message = [
                '<b>Don hang moi tu web</b>',
                `Ma don: <code>${escapeTelegramHtml(payload.orderId || `DH${Date.now()}`)}</code>`,
                `Khach hang: <b>${escapeTelegramHtml(payload.customerName || DEFAULT_GUEST_NAME)}</b>`,
            `Loai khach: ${escapeTelegramHtml(payload.customerType || payload.group || DEFAULT_WEB_CUSTOMER_GROUP)}`,
                `Dia chi: ${escapeTelegramHtml(payload.address || 'Khách sẽ xác nhận qua Zalo')}`,
                `Lien he: ${escapeTelegramHtml(payload.contact || 'Khách sẽ liên hệ qua Zalo')}`,
                `Tong tien: <b>${escapeTelegramHtml(formatMoney(payload.finalAmount || 0))}</b>`,
                'San pham:',
                ...items.map((item, index) => `${index + 1}. ${escapeTelegramHtml(getProductDisplayName(item))} x${Number(item.quantity || 1) || 1}`)
            ].join('\n');
        } else if(safeType === 'order-cancel') {
            message = [
                '<b>Khach huy don tren web</b>',
                `Ma don: <code>${escapeTelegramHtml(payload.orderId || `DH${Date.now()}`)}</code>`,
                `Khach hang: <b>${escapeTelegramHtml(payload.customerName || DEFAULT_GUEST_NAME)}</b>`,
                `SDT: ${escapeTelegramHtml(payload.phone || 'Chua cap nhat')}`,
                `Dia chi: ${escapeTelegramHtml(payload.address || 'Chua cap nhat')}`,
                `Trang thai: ${escapeTelegramHtml(payload.status || 'Da huy boi khach')}`,
                `Thoi gian: ${escapeTelegramHtml(formatTelegramTimestamp())}`
            ].join('\n');
        }
        return message ? postTelegramAlert(message) : Promise.resolve(false);
    };
    const hideSearchBar = (options = {}) => {
        const searchShell = document.getElementById('search-shell');
        const searchToggleBtn = document.getElementById('search-toggle-btn');
        const searchInput = document.getElementById('search-input');
        const keepDesktopPinnedOpen = options.force !== true
            && searchShell
            && searchShell.classList.contains('search-shell-desktop-pinned')
            && window.innerWidth >= 768;
        if(keepDesktopPinnedOpen) {
            toggleSearchOpen = true;
            searchShell.classList.add('is-open');
            if(searchToggleBtn) searchToggleBtn.setAttribute('aria-expanded', 'true');
            if(window.__webNewSearchBootState) window.__webNewSearchBootState.open = true;
            if(options.blur !== false && searchInput && document.activeElement === searchInput) searchInput.blur();
            return;
        }
        toggleSearchOpen = false;
        if(searchShell) searchShell.classList.remove('is-open');
        if(searchToggleBtn) searchToggleBtn.setAttribute('aria-expanded', 'false');
        if(window.__webNewSearchBootState) window.__webNewSearchBootState.open = false;
        if(searchInput && document.activeElement === searchInput) searchInput.blur();
    };
    const maskValue = (value, type = 'text') => {
        if(!value) return 'Chưa cập nhật';
        if(type === 'phone') {
            const digits = value.replace(/\D/g, '');
            if(digits.length <= 4) return value;
            return `${'*'.repeat(Math.max(0, digits.length - 3))}${digits.slice(-3)}`;
        }
        if(type === 'email' && value.includes('@')) {
            const [name, domain] = value.split('@');
            const safeName = `${name.slice(0, 1)}${'*'.repeat(Math.max(1, name.length - 2))}${name.slice(-1)}`;
            return `${safeName}@${domain}`;
        }
        return value;
    };
    const formatBirthdayDisplay = (value) => {
        if(!value) return 'Thiết lập ngay';
        const parts = value.split('-');
        if(parts.length !== 3) return value;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };
    const calculateAgeFromBirthday = (value) => {
        const safeValue = String(value || '').trim();
        if(!safeValue) return 0;
        const parts = safeValue.split('-').map((part) => Number(part || 0) || 0);
        if(parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return 0;
        const now = new Date();
        let age = now.getFullYear() - parts[0];
        const monthDelta = (now.getMonth() + 1) - parts[1];
        if(monthDelta < 0 || (monthDelta === 0 && now.getDate() < parts[2])) age -= 1;
        return Math.max(age, 0);
    };
    const updateFloatingFilterButton = () => {
        return;
    };
    const applyTheme = (theme) => {
        currentTheme = theme === 'dark' ? 'dark' : 'light';
        document.body.classList.toggle('dark-mode', currentTheme === 'dark');
        document.documentElement.classList.toggle('dark', currentTheme === 'dark');
        document.documentElement.setAttribute('data-theme', currentTheme);
        const btn = document.getElementById('theme-toggle-btn');
        if(btn) {
            btn.innerHTML = currentTheme === 'dark'
                ? "<i class='fa-solid fa-sun text-lg text-yellow-400'></i>"
                : "<i class='fa-regular fa-moon text-lg'></i>";
        }
        localStorage.setItem('ta_theme', currentTheme);
    };
    window.toggleTheme = () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    const toInlineArgument = (value = '') => `'${String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    let productCategoryOptionsCacheKey = '';
    let productCategoryOptionsCache = [];
    let productCategoryIndexCacheKey = '';
    let productCategoryIndexCache = null;
    let filteredProductsCacheKey = '';
    let filteredProductsCache = [];
    const buildProductCategoryOptionsCacheKey = () => (shopProducts || []).map((product) => {
        const safeProduct = product || {};
        return [
            safeProduct.id || '',
            safeProduct.updatedTs || '',
            safeProduct.group || '',
            Array.isArray(safeProduct.groups) ? safeProduct.groups.join('|') : '',
            Array.isArray(safeProduct.tags) ? safeProduct.tags.join('|') : '',
            safeProduct.cat || ''
        ].join('~');
    }).join('||');
    const sortCategoryEntriesByCountThenName = (items = []) => items.slice().sort((left, right) => {
        const countDiff = (Number(right && right.count) || 0) - (Number(left && left.count) || 0);
        if(countDiff !== 0) return countDiff;
        return String((left && left.name) || '').localeCompare(String((right && right.name) || ''), 'vi');
    });
    const getProductCategoryIndex = () => {
        const cacheKey = buildProductCategoryOptionsCacheKey();
        if(productCategoryIndexCacheKey === cacheKey && productCategoryIndexCache) {
            return productCategoryIndexCache;
        }

        const productsByGroup = Object.create(null);
        const productsByCategory = Object.create(null);
        const childProductsByGroup = Object.create(null);
        const groupCounts = Object.create(null);

        (shopProducts || []).forEach((product) => {
            const safeProduct = product || {};
            const groupNames = getProductGroupNames(safeProduct);
            const childTags = getProductVisibleTags(safeProduct);

            groupNames.forEach((groupName) => {
                if(!productsByGroup[groupName]) productsByGroup[groupName] = [];
                if(!productsByCategory[groupName]) productsByCategory[groupName] = [];
                if(!childProductsByGroup[groupName]) childProductsByGroup[groupName] = Object.create(null);

                productsByGroup[groupName].push(safeProduct);
                productsByCategory[groupName].push(safeProduct);
                groupCounts[groupName] = (Number(groupCounts[groupName] || 0) || 0) + 1;

                childTags.forEach((tagName) => {
                    if(!childProductsByGroup[groupName][tagName]) childProductsByGroup[groupName][tagName] = [];
                    childProductsByGroup[groupName][tagName].push(safeProduct);
                });
            });

            childTags.forEach((tagName) => {
                if(!productsByCategory[tagName]) productsByCategory[tagName] = [];
                productsByCategory[tagName].push(safeProduct);
            });
        });

        productCategoryIndexCacheKey = cacheKey;
        productCategoryIndexCache = {
            cacheKey,
            groups: sortCategoryEntriesByCountThenName(Object.keys(groupCounts).map((groupName) => ({
                name: groupName,
                count: Number(groupCounts[groupName] || 0) || 0
            }))).map((entry) => entry.name),
            productsByGroup,
            productsByCategory,
            childProductsByGroup
        };
        return productCategoryIndexCache;
    };
    const getProductsForCategory = (categoryName, baseProducts = shopProducts) => {
        const safeCategoryName = String(categoryName || '').trim();
        const safeBaseProducts = Array.isArray(baseProducts) ? baseProducts : [];
        if(!safeCategoryName || isAllCategory(safeCategoryName)) return safeBaseProducts.slice();
        if(baseProducts === shopProducts) {
            const categoryIndex = getProductCategoryIndex();
            return Array.isArray(categoryIndex.productsByCategory[safeCategoryName])
                ? categoryIndex.productsByCategory[safeCategoryName].slice()
                : [];
        }
        return safeBaseProducts.filter((product) => productMatchesCategory(product, safeCategoryName));
    };
    const buildFilteredProductsCacheKey = (baseProducts, keyword) => {
        if(baseProducts !== shopProducts) return '';
        const catalogSignature = productCategoryIndexCacheKey || productCategoryOptionsCacheKey || buildProductCategoryOptionsCacheKey();
        return [
            catalogSignature,
            String(filterCategory || '').trim(),
            String(keyword || '').trim(),
            String(productFilters.minPrice || '').trim(),
            String(productFilters.maxPrice || '').trim(),
            productFilters.sort || 'popular',
            productFilters.bestSeller ? 1 : 0,
            productFilters.featured ? 1 : 0,
            productFilters.multiImage ? 1 : 0,
            productFilters.hasVariant ? 1 : 0
        ].join('##');
    };
    const getProductCategoryOptions = () => {
        const cacheKey = buildProductCategoryOptionsCacheKey();
        if(productCategoryOptionsCacheKey === cacheKey && Array.isArray(productCategoryOptionsCache) && productCategoryOptionsCache.length) {
            return productCategoryOptionsCache;
        }
        const categoryIndex = getProductCategoryIndex();
        const groups = Array.isArray(categoryIndex.groups) ? categoryIndex.groups : [];
        const rootOptions = groups.map((groupName) => {
            const productsInGroup = Array.isArray(categoryIndex.productsByGroup[groupName]) ? categoryIndex.productsByGroup[groupName] : [];
            const groupVisual = getCategoryVisual(groupName);
            const childMap = categoryIndex.childProductsByGroup[groupName] || {};
            const childTags = Object.keys(childMap);
            return {
                name: groupName,
                icon: groupVisual.icon,
                color: groupVisual.color,
                count: productsInGroup.length,
                preview: ((productsInGroup[0] || {}).img || ''),
                children: sortCategoryEntriesByCountThenName(childTags.map((tagName) => {
                    const tagVisual = getCategoryVisual(tagName);
                    const productsInTag = Array.isArray(childMap[tagName]) ? childMap[tagName] : [];
                    return {
                        name: tagName,
                        icon: tagVisual.icon,
                        color: tagVisual.color,
                        count: productsInTag.length,
                        preview: ((productsInTag[0] || {}).img || ''),
                        isChild: true,
                        parentName: groupName
                    };
                }))
            };
        });

        productCategoryOptionsCache = [{
            name: 'Tất cả',
            icon: 'fa-border-all',
            color: 'bg-slate-100 text-slate-500',
            count: shopProducts.length,
            preview: shopProducts[0] ? shopProducts[0].img : '',
            children: []
        }].concat(sortCategoryEntriesByCountThenName(rootOptions)).filter((item) => item.count > 0 || item.name === 'Tất cả');
        productCategoryOptionsCacheKey = cacheKey;
        return productCategoryOptionsCache;
    };
    const updateProductsCategoryButton = () => {};
    const getFilteredProducts = (baseProducts = shopProducts) => {
        const kw = normalizeKeyword((document.getElementById('search-input') && document.getElementById('search-input').value) || '');
        const filterCacheKey = buildFilteredProductsCacheKey(baseProducts, kw);
        if(filterCacheKey && filteredProductsCacheKey === filterCacheKey) {
            return filteredProductsCache.slice();
        }
        let filtered = filterCategory ? getProductsForCategory(filterCategory, baseProducts) : [...baseProducts];

        if(productFilters.minPrice !== '') filtered = filtered.filter(p => parseMoney(p.price) >= parseInt(productFilters.minPrice, 10));
        if(productFilters.maxPrice !== '') filtered = filtered.filter(p => parseMoney(p.price) <= parseInt(productFilters.maxPrice, 10));
        if(productFilters.bestSeller) filtered = filtered.filter(p => p.sold >= 180);
        if(productFilters.featured) filtered = filtered.filter(p => p.sold >= 100);
        if(productFilters.multiImage) filtered = filtered.filter(p => (p.images || []).length > 1);
        if(productFilters.hasVariant) filtered = filtered.filter(p => (p.variants || []).length > 0);
        if(kw) filtered = filtered.filter(p => getProductSearchText(p).includes(kw));

        if(productFilters.sort === 'newest') filtered.reverse();
        if(productFilters.sort === 'priceAsc') filtered.sort((a, b) => parseMoney(a.price) - parseMoney(b.price));
        if(productFilters.sort === 'priceDesc') filtered.sort((a, b) => parseMoney(b.price) - parseMoney(a.price));
        if(productFilters.sort === 'popular') filtered.sort((a, b) => b.sold - a.sold);
        if(filterCacheKey) {
            filteredProductsCacheKey = filterCacheKey;
            filteredProductsCache = filtered.slice();
        }
        return filtered;
    };

    const loadState = () => {
        try {
            const c = localStorage.getItem('ta_cart'); if(c) cartData = JSON.parse(c);
            const w = localStorage.getItem('ta_wishlist'); if(w) wishlistData = JSON.parse(w);
            const u = localStorage.getItem('ta_user'); 
            if(u) {
                currentUser = normalizeUserData(JSON.parse(u));
                if(!Array.isArray(currentUser.addresses)) {
                    currentUser.addresses = [];
                }
                if(currentUser.address && currentUser.address !== '' && currentUser.addresses.length === 0) {
                    currentUser.addresses.push({
                        id: 'addr_'+Date.now(),
                        text: currentUser.address,
                        phone: String(currentUser.shippingPhone || currentUser.phone || '').trim(),
                        isDefault: true
                    });
                }
            }
        } catch(e) { console.error("Lỗi đọc Storage", e); }
    };
