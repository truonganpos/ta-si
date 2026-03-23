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
// Đổi 1 lần tại đây để cập nhật số liên hệ và Zalo toàn web.
    const STORE_CONTACT_PHONE = window.STORE_CONTACT_PHONE || '0989441685';
    const STORE_ZALO_PHONE = window.STORE_ZALO_PHONE || STORE_CONTACT_PHONE;
    const ORDER_SUPPORT_ZALO_PHONE = window.ORDER_SUPPORT_ZALO_PHONE || STORE_ZALO_PHONE;
    const PASSWORD_RESET_ZALO_PHONE = window.PASSWORD_RESET_ZALO_PHONE || STORE_ZALO_PHONE;
    const STORE_FACEBOOK_URL = window.STORE_FACEBOOK_URL || 'https://www.facebook.com/';
    const STORE_ZALO_GROUP_URL = window.STORE_ZALO_GROUP_URL || '';
    const STORE_EMAIL_ADDRESS = window.STORE_EMAIL_ADDRESS || 'truonganstore@gmail.com';
    const STORE_MAP_URL = window.STORE_MAP_URL || 'https://maps.google.com/?q=Trường+An+Store';
    const DEFAULT_GUEST_NAME = 'Khách Lẻ Web';
    const SHORTCUT_PROMPT_DELAY_MS = Number(window.SHORTCUT_PROMPT_DELAY_MS || 90000);
    const SHORTCUT_PROMPT_AFTER_LOGIN_MS = Number(window.SHORTCUT_PROMPT_AFTER_LOGIN_MS || 8000);
    const SHORTCUT_PROMPT_COOLDOWN_MS = Number(window.SHORTCUT_PROMPT_COOLDOWN_MS || (3 * 24 * 60 * 60 * 1000));
    const SHORTCUT_PROMPT_STORAGE_KEY = 'ta_shortcut_prompt_dismissed_at';
    const SHORTCUT_INSTALLED_STORAGE_KEY = 'ta_shortcut_installed';
    const TELEGRAM_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycby5el0pzwvokeXVLpdl6b7n4K68moCxhOYZk8chcppgcjv_Ih2dwTeePI3Ts8Tl0_iB/exec';
    // Huong dan webhook Telegram:
    // 1. Mo file telegram_bot.gs va deploy thanh Web App tren Apps Script.
    // 2. Copy URL Web App vao TELEGRAM_WEBHOOK_URL de web gui thong bao dang ky va don hang.
    const CATEGORY_ICON_RULES = [
        { icon: 'fa-bottle-droplet', color: 'bg-pink-100 text-babyPink', keywords: ['sua', 'bim', 'ta', 'binh sua', 'me va be'] },
        { icon: 'fa-baby', color: 'bg-sky-100 text-sky-500', keywords: ['so sinh', 'tre em', 'baby', 'be', 'an dam'] },
        { icon: 'fa-cubes', color: 'bg-yellow-100 text-yellow-500', keywords: ['do choi', 'toy', 'ghep hinh', 'montessori', 'lego'] },
        { icon: 'fa-car-side', color: 'bg-emerald-100 text-emerald-500', keywords: ['xe', 'day', 'choi ngoai troi', 'van dong'] },
        { icon: 'fa-pump-soap', color: 'bg-violet-100 text-violet-500', keywords: ['ve sinh', 'tam goi', 'cham soc', 'kem', 'sua tam'] },
        { icon: 'fa-gift', color: 'bg-orange-100 text-orange-500', keywords: ['combo', 'qua tang', 'sale', 'hot', 'new'] }
    ];
    const POS_CACHE_KEYS = {
        appCatalog: 'ta_catalog_cache_v6'
    };
    const tabRenderState = { home: false, products: false, sale: false, account: false, intro: false };
    const syncState = { lastCatalogVersion: '', posSchema: null };
    const productFeedState = { loading: false, hasMore: true, initialSynced: false, observerReady: false, error: '' };
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
    const hasShortcutPromptCooldown = () => {
        try {
            const lastDismissedAt = Number(localStorage.getItem(SHORTCUT_PROMPT_STORAGE_KEY) || 0) || 0;
            return !!lastDismissedAt && (Date.now() - lastDismissedAt) < SHORTCUT_PROMPT_COOLDOWN_MS;
        } catch(error) {
            return false;
        }
    };
    const getShortcutPromptCopy = () => {
        if (deferredInstallPromptEvent) {
            return {
                title: 'Tạo lối tắt ra màn hình chính',
                desc: 'Bạn muốn ghim web này ra màn hình chính để mở nhanh như ứng dụng không?',
                hint: 'Bấm nút bên dưới để trình duyệt mở hộp cài lối tắt.'
            };
        }
        if (isIosDevice()) {
            return {
                title: 'Thêm web ra màn hình chính',
                desc: 'Bạn có thể tạo lối tắt để mở web nhanh hơn như ứng dụng.',
                hint: 'Trên iPhone/iPad: bấm Chia sẻ rồi chọn "Thêm vào Màn hình chính".'
            };
        }
        return {
            title: 'Thêm lối tắt web',
            desc: 'Bạn có thể ghim web này ra màn hình chính để vào nhanh hơn.',
            hint: 'Trên Android: mở menu trình duyệt rồi chọn "Thêm vào màn hình chính" hoặc "Cài đặt ứng dụng".'
        };
    };
    const canPromptForShortcut = () => {
        if (!isMobileDevice()) return false;
        if (isAppInstalledMode()) return false;
        if (hasShortcutPromptCooldown()) return false;
        return true;
    };
    window.closeShortcutInstallPrompt = (options = {}) => {
        if (options.remindLater !== true) markShortcutPromptDismissed();
        closeModalShell('shortcut-install-overlay');
    };
    window.openShortcutInstallPrompt = () => {
        if (!canPromptForShortcut()) return;
        const titleEl = document.getElementById('shortcut-install-title');
        const descEl = document.getElementById('shortcut-install-desc');
        const hintEl = document.getElementById('shortcut-install-hint');
        const actionBtn = document.getElementById('shortcut-install-action-btn');
        const copy = getShortcutPromptCopy();
        if (titleEl) titleEl.innerText = copy.title;
        if (descEl) descEl.innerText = copy.desc;
        if (hintEl) hintEl.innerText = copy.hint;
        if (actionBtn) actionBtn.innerText = deferredInstallPromptEvent ? 'Tạo lối tắt ngay' : 'Xem cách thêm';
        openModalShell('shortcut-install-overlay');
    };
    window.triggerShortcutInstallPrompt = async () => {
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
                    closeModalShell('shortcut-install-overlay');
                    showToast('Đã gửi yêu cầu tạo lối tắt ra màn hình chính.', 'success');
                    return;
                }
            } catch(error) {}
        }
        closeModalShell('shortcut-install-overlay');
        markShortcutPromptDismissed();
        showToast(isIosDevice()
            ? 'Mở nút Chia sẻ của trình duyệt rồi chọn "Thêm vào Màn hình chính".'
            : 'Mở menu trình duyệt rồi chọn "Thêm vào màn hình chính" để tạo lối tắt.', 'info');
    };
    const scheduleShortcutPrompt = (delayMs) => {
        if (shortcutPromptTimer) clearTimeout(shortcutPromptTimer);
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
    });
    window.addEventListener('appinstalled', () => {
        try {
            localStorage.setItem(SHORTCUT_INSTALLED_STORAGE_KEY, '1');
        } catch(error) {}
        closeModalShell('shortcut-install-overlay');
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
        const seen = new Set();
        return String(rawInput || '')
            .split(/[\n,]+/)
            .map(item => extractDriveId(item))
            .map(item => String(item || '').trim())
            .filter(Boolean)
            .filter(item => {
                if(seen.has(item)) return false;
                seen.add(item);
                return true;
            });
    };
    const getOptimizedImageUrl = (raw, size = 'w800') => {
        const value = String(raw || '').trim();
        if(!value) return 'https://via.placeholder.com/600x600?text=No+Image';
        if(value.startsWith('data:image')) return value;
        if(/^https?:\/\//i.test(value) && !value.includes('drive.google.com') && !value.includes('docs.google.com')) return value;
        const driveId = extractDriveId(value);
        if(/^https?:\/\//i.test(driveId)) return driveId;
        return `https://drive.google.com/thumbnail?id=${driveId}&sz=${size}`;
    };
    const normalizeKeyword = (value = '') => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const isAllCategory = (value = '') => normalizeKeyword(value) === 'tat ca';
    const getProductCode = (product) => String((product && (product.code || product.sku || product.id)) || '').trim();
    const getProductGroupName = (product) => String((product && (product.group || product.cat)) || '').trim();
    const getProductDisplayName = (product) => {
        const code = getProductCode(product);
        const name = String((product && product.name) || '').trim();
        if(code && name && normalizeKeyword(name).startsWith(normalizeKeyword(code))) return name;
        if(code && name) return `${code} - ${name}`;
        return name || code || 'Sản phẩm';
    };
    const getProductUnit = (product) => String((product && (product.unit || product.dvt || product.don_vi || product.don_vi_tinh)) || '').trim();
    const getProductMinQty = (product) => {
        const rawValue = product && (product.minQty || product.si_tu || product.su || product.min_qty || product.min_quantity || 1);
        return Math.max(Number(rawValue || 1) || 1, 1);
    };
    const formatProductPriceLabel = (product) => {
        const price = String((product && product.price) || '').trim();
        const unit = getProductUnit(product);
        if(!price) return unit ? unit : '';
        return unit ? `${price} / ${unit}` : price;
    };
    const getProductVisibleTags = (product) => {
        const group = getProductGroupName(product);
        const tags = (Array.isArray(product && product.tags) ? product.tags : [])
            .map(item => String(item || '').trim())
            .filter(Boolean)
            .filter(tag => tag !== group);
        return [...new Set(tags.length ? tags : (group ? [group] : []))];
    };
    const getProductTagText = (product) => {
        const tags = getProductVisibleTags(product);
        if(!tags.length) return 'Tag: Sản phẩm';
        return `Tag: ${tags.slice(0, 2).join(' • ')}`;
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
            getProductGroupName(product),
            ...(Array.isArray(product && product.tags) ? product.tags : []),
            product && product.desc
        ];
        return normalizeKeyword(parts.filter(Boolean).join(' '));
    };
    const getProductCategoryNames = (product) => {
        const group = getProductGroupName(product);
        const tagList = Array.isArray(product && product.tags)
            ? product.tags
            : String((product && product.tags) || '').split(/[,;|\n]+/);
        const values = [group, ...tagList, String((product && product.cat) || '').trim()]
            .map(item => String(item || '').trim())
            .filter(Boolean);
        return [...new Set(values)];
    };
    const getRelatedProductsForCategory = (name = '') => {
        if(!name || isAllCategory(name)) return shopProducts || [];
        return (shopProducts || []).filter(product => getProductCategoryNames(product).includes(name));
    };
    const getCategoryVisual = (name = '') => {
        const signal = normalizeKeyword([
            name,
            ...getRelatedProductsForCategory(name).flatMap((product) => [
                getProductGroupName(product),
                product && product.name,
                product && product.desc,
                ...(Array.isArray(product && product.tags) ? product.tags : [])
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
        return bestScore > 0 ? { icon: bestRule.icon, color: bestRule.color } : { icon: 'fa-box-open', color: 'bg-slate-100 text-slate-500' };
    };
    const productMatchesCategory = (product, categoryName) => {
        if(!categoryName || isAllCategory(categoryName)) return true;
        return getProductCategoryNames(product).includes(categoryName);
    };
    const getDynamicCategoryNames = () => {
        const groups = [...new Set((shopProducts || []).map(product => getProductGroupName(product)).filter(Boolean))];
        const tags = [...new Set((shopProducts || []).flatMap(product => {
            const list = Array.isArray(product && product.tags)
                ? product.tags
                : String((product && product.tags) || '').split(/[,;|\n]+/);
            return list.map(item => String(item || '').trim()).filter(Boolean);
        }).filter(name => !groups.includes(name)))];
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
        if((Number(posProduct.km_phan_tram || posProduct.Discount || 0) || 0) > 0 && !badges.includes('SALE')) badges.push('SALE');
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
            return {
                name: variant.name || variant.label || 'Phân loại',
                options
            };
        }).filter((variant) => variant.options.length > 0);
    };
    const mapPosProductToAppProduct = (posProduct, index = 0) => {
        const images = normalizeDriveImageInput(posProduct.link_anh || posProduct.Image || posProduct.image || posProduct.img || '');
        const wholesalePrice = parseMoney(posProduct.gia_si || posProduct.WholesalePrice || 0);
        const retailPrice = parseMoney(posProduct.gia_ban_le || posProduct.Price || posProduct.price || 0);
        const basePrice = wholesalePrice || retailPrice || 0;
        const discountPercent = Number(posProduct.km_phan_tram || posProduct.Discount || 0) || 0;
        const finalPrice = discountPercent > 0 ? Math.max(0, Math.round(basePrice * (100 - discountPercent) / 100)) : basePrice;
        const stock = Number(posProduct.ton_kho || posProduct.Stock || posProduct.stock || 0) || 0;
        const pendingStock = Number(posProduct.dang_dat || posProduct.dd || posProduct.pending_stock || 0) || 0;
        const availableStock = Math.max(stock - pendingStock, 0);
        const sold = Number(posProduct.total_buy || posProduct.sold || 0) || 0;
        const group = String(posProduct.group || posProduct.Group || '').trim();
        const code = String(posProduct.ma_sp || posProduct.code || posProduct.Code || posProduct.sku || posProduct.SKU || posProduct.id || posProduct.ID || `POS_${index + 1}`).trim();
        const updatedTs = Number(posProduct.updated_ts || posProduct.updatedAt || posProduct.UpdatedTs || 0) || 0;
        const firstImage = images[0] ? getOptimizedImageUrl(images[0], 'w800') : 'https://via.placeholder.com/600x600?text=Product';
        const variants = mapPosVariants(posProduct);
        const unit = String(posProduct.dvt || posProduct.unit || posProduct.don_vi || posProduct.don_vi_tinh || posProduct['Don vi tinh'] || posProduct['Đơn vị tính'] || '').trim();
        const tags = [...new Set([
            ...String(posProduct.tags || posProduct.Tags || '').split(/[,;|\n]+/).map(item => item.trim()),
            group
        ].filter(Boolean))];
        const primaryCategory = group || tags[0] || 'Sản phẩm';
        return {
            id: String(posProduct.id || posProduct.ID || code || `POS_${index + 1}`),
            code,
            group,
            unit,
            cat: primaryCategory,
            tags,
            name: String(posProduct.name || posProduct.Name || `Sản phẩm ${index + 1}`),
            price: formatMoney(finalPrice || basePrice || 0),
            priceValue: finalPrice || basePrice || 0,
            sold,
            images: images.length ? images.map(item => getOptimizedImageUrl(item, 'w1200')) : [firstImage],
            img: firstImage,
            desc: String(posProduct.mo_ta || posProduct.description || posProduct.desc || `${primaryCategory} | Kho: ${posProduct.kho || posProduct.Kho || 'Mặc định'}`),
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
        if(typeof window.renderHomeCategories === 'function') window.renderHomeCategories();
        if(typeof window.renderHomeDesktopCategoryMenu === 'function') window.renderHomeDesktopCategoryMenu();
        if(typeof window.renderDesktopCategoryMenu === 'function') window.renderDesktopCategoryMenu();
        if(tabRenderState.home) {
            const filteredHomeProducts = getFilteredProducts(shopProducts);
            if(typeof window.renderHomeProductLists === 'function') window.renderHomeProductLists(filteredHomeProducts);
        }
        if(tabRenderState.products && typeof window.renderProductsTabContent === 'function') window.renderProductsTabContent();
    };
    window.requestCatalogSyncAfterAuth = () => {
        if(isCatalogLoadBlocked()) return applyCatalogBlockedState();
        if(loadCachedCatalogFromApp()) refreshCatalogViews();
        scheduleIdleTask(() => syncCatalogFromPosCache({ refreshViews: true, force: true }), 40);
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
            return window.retailFirebase.loadCatalogPage({
                reset: !!options.force,
                pageSize: options.pageSize || 24
            }).then((result) => {
                if(result && Array.isArray(result.products) && result.products.length > 0) {
                    shopProducts = result.products;
                    syncState.lastCatalogVersion = String(result.lastDeltaTs || result.savedAt || Date.now());
                    productFeedState.hasMore = result.hasMore !== false;
                    productFeedState.initialSynced = true;
                    productFeedState.error = '';
                    if(options.refreshViews !== false) refreshCatalogViews();
                    return true;
                }
                shopProducts = [];
                productFeedState.error = 'Chua tai duoc danh sach san pham tu Firebase.';
                if(options.refreshViews !== false) refreshCatalogViews();
                productFeedState.hasMore = !!(result && result.hasMore);
                return false;
            }).catch((error) => {
                const message = String((error && (error.code || error.message)) || '').toLowerCase();
                shopProducts = [];
                productFeedState.error = message.includes('permission_denied')
                    ? 'Không đọc được danh sách sản phẩm từ Firebase. Hãy kiểm tra catalog_public hoặc anonymous auth.'
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
        try {
            const result = await window.retailFirebase.syncCatalogDelta({ pageSize: 60 });
            if(result && Array.isArray(result.products) && result.products.length > 0) {
                shopProducts = result.products;
                syncState.lastCatalogVersion = String(result.lastDeltaTs || result.savedAt || Date.now());
                productFeedState.hasMore = result.hasMore !== false;
                productFeedState.error = '';
                refreshCatalogViews();
                return true;
            }
        } catch(error) {
            console.warn('Khong tai duoc delta catalog Firebase:', error);
            if(!shopProducts.length) {
                const message = String((error && (error.code || error.message)) || '').toLowerCase();
                productFeedState.error = message.includes('permission_denied')
                    ? 'Không đọc được danh sách sản phẩm từ Firebase. Hãy kiểm tra catalog_public hoặc anonymous auth.'
                    : 'Lỗi tải sản phẩm từ Firebase.';
                refreshCatalogViews();
            }
        } finally {
            productFeedState.loading = false;
        }
        return false;
    };
    const loadMoreCatalogItems = async () => {
        if(productFeedState.loading || !productFeedState.hasMore) return false;
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
        [...cloudOrders, ...localOrders].forEach((order) => {
            if(!order || !order.id) return;
            mergedMap[order.id] = {
                ...(mergedMap[order.id] || {}),
                ...order,
                items: (order.items && order.items.length) ? order.items : ((mergedMap[order.id] || {}).items || [])
            };
        });
        return Object.values(mergedMap).sort((a, b) => (Number(b.sortTs || 0) || 0) - (Number(a.sortTs || 0) || 0));
    };
    const syncCurrentUserToCloud = async () => {
        if(!window.retailFirebase || !currentUser || !currentUser.authUid) return null;
        try {
            const profile = await window.retailFirebase.updateCurrentCustomerProfile(currentUser);
            if(profile) {
                currentUser = normalizeUserData({ ...currentUser, ...profile, orders: currentUser.orders || [] });
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
                    orders: mergeOrdersById((currentUser && currentUser.orders) || [], cloudOrders)
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
        if(!badges.length) return '';

        const badgeStyles = {
            NEW: 'bg-emerald-500 text-white',
            HOT: 'bg-red-500 text-white',
            SALE: 'bg-amber-400 text-white'
        };

        return `
            <div class="absolute top-3 left-3 z-10 flex flex-col gap-1">
                ${badges.map((badge) => `<span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-[0.14em] shadow-sm ${badgeStyles[badge] || 'bg-gray-800 text-white'}">${badge}</span>`).join('')}
            </div>
        `;
    };
    const openModalShell = (overlayId) => {
        const el = document.getElementById(overlayId);
        if(el) el.classList.add('is-open');
    };
    const closeModalShell = (overlayId) => {
        const el = document.getElementById(overlayId);
        if(el) el.classList.remove('is-open');
    };
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
    window.openWelcomePopup = () => {
        if(window.introExperienceModule && typeof window.introExperienceModule.fillWelcomePopup === 'function') {
            window.introExperienceModule.fillWelcomePopup();
        } else if(window.uiPc && typeof window.uiPc.fillWelcomePopup === 'function') {
            window.uiPc.fillWelcomePopup(window.WELCOME_POPUP_CONTENT || {});
        }
        openModalShell('welcome-popup-overlay');
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
    window.openOrderSupportZalo = () => {
        const message = lastPlacedOrderMeta && lastPlacedOrderMeta.orderId
            ? `Shop ơi, em cần hỗ trợ đơn ${lastPlacedOrderMeta.orderId}.`
            : '';
        openStoreZalo(message, ORDER_SUPPORT_ZALO_PHONE);
    };
    window.openOrderSuccessModal = (payload = {}) => {
        lastPlacedOrderMeta = payload;
        const msg = document.getElementById('order-success-message');
        const meta = document.getElementById('order-success-meta');
        const zaloButton = document.getElementById('order-success-zalo-btn');
        if(msg) {
            msg.innerText = payload.persisted === false
                ? 'Đơn hàng đã được ghi nhận trên web. Bạn có thể mở Zalo để shop xác nhận nhanh hơn.'
                : 'Đơn hàng của bạn đã được tạo thành công trên hệ thống.';
        }
        if(meta) {
            const lines = [
                payload.orderId ? `Mã đơn: ${payload.orderId}` : '',
                payload.finalAmount ? `Tổng thanh toán: ${formatMoney(payload.finalAmount)}` : '',
                payload.customerName ? `Khách hàng: ${payload.customerName}` : ''
            ].filter(Boolean);
            meta.innerHTML = lines.map((line) => `<p>${line}</p>`).join('');
        }
        if(zaloButton) zaloButton.innerText = `Mở Zalo ${ORDER_SUPPORT_ZALO_PHONE}`;
        openModalShell('order-success-overlay');
    };
    window.closeOrderSuccessModal = () => closeModalShell('order-success-overlay');
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
        const safeStatus = String(user.status || user.customerStatus || '').trim().toLowerCase();
        user.status = (!safeStatus || safeStatus === 'active' || safeStatus === 'online')
            ? 'online'
            : (['offline', 'inactive', 'disabled', 'blocked', 'lock', 'locked'].includes(safeStatus) ? 'offline' : safeStatus);
        user.customerStatus = user.status;
        if(typeof user.email !== 'string') user.email = '';
        if(typeof user.phone !== 'string') user.phone = '';
        if(typeof user.shippingPhone !== 'string') user.shippingPhone = '';
        if(typeof user.bio !== 'string') user.bio = 'An tâm chọn đồ tốt cho bé mỗi ngày.';
        if(typeof user.gender !== 'string') user.gender = 'Chưa cập nhật';
        if(typeof user.birthday !== 'string') user.birthday = '';
        if(typeof user.personalInfo !== 'string') user.personalInfo = 'Thiết lập ngay';
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
                `Email: ${escapeTelegramHtml(payload.email || 'Chua cap nhat')}`,
                `SDT: ${escapeTelegramHtml(payload.phone || 'Chua cap nhat')}`,
                `Thoi gian: ${escapeTelegramHtml(formatTelegramTimestamp())}`
            ].join('\n');
        } else if(safeType === 'order') {
            const items = Array.isArray(payload.items) ? payload.items : [];
            message = [
                '<b>Don hang moi tu web</b>',
                `Ma don: <code>${escapeTelegramHtml(payload.orderId || `DH${Date.now()}`)}</code>`,
                `Khach hang: <b>${escapeTelegramHtml(payload.customerName || DEFAULT_GUEST_NAME)}</b>`,
                `Loai khach: ${escapeTelegramHtml(payload.customerType || 'guest')}`,
                `Dia chi: ${escapeTelegramHtml(payload.address || 'Khách sẽ xác nhận qua Zalo')}`,
                `Lien he: ${escapeTelegramHtml(payload.contact || 'Khách sẽ liên hệ qua Zalo')}`,
                `Tong tien: <b>${escapeTelegramHtml(formatMoney(payload.finalAmount || 0))}</b>`,
                'San pham:',
                ...items.map((item, index) => `${index + 1}. ${escapeTelegramHtml(getProductDisplayName(item))} x${Number(item.quantity || 1) || 1}`)
            ].join('\n');
        }
        return message ? postTelegramAlert(message) : Promise.resolve(false);
    };
    const hideSearchBar = () => {
        toggleSearchOpen = false;
        document.getElementById('search-bar').classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
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
    const updateFloatingFilterButton = () => {
        return;
    };
    const applyTheme = (theme) => {
        currentTheme = theme === 'dark' ? 'dark' : 'light';
        document.body.classList.toggle('dark-mode', currentTheme === 'dark');
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
    const getProductCategoryOptions = () => {
        const groups = [...new Set((shopProducts || []).map(product => getProductGroupName(product)).filter(Boolean))];
        const rootOptions = groups.map((groupName) => {
            const productsInGroup = (shopProducts || []).filter((product) => getProductGroupName(product) === groupName);
            const groupVisual = getCategoryVisual(groupName);
            const childTags = [...new Set(productsInGroup.flatMap((product) => getProductVisibleTags(product)).filter((tag) => tag && tag !== groupName))];
            return {
                name: groupName,
                icon: groupVisual.icon,
                color: groupVisual.color,
                count: productsInGroup.length,
                preview: ((productsInGroup[0] || {}).img || ''),
                children: childTags.map((tagName) => {
                    const tagVisual = getCategoryVisual(tagName);
                    return {
                        name: tagName,
                        icon: tagVisual.icon,
                        color: tagVisual.color,
                        count: productsInGroup.filter((product) => productMatchesCategory(product, tagName)).length,
                        preview: ((productsInGroup.find((product) => productMatchesCategory(product, tagName)) || {}).img || ''),
                        isChild: true,
                        parentName: groupName
                    };
                })
            };
        });

        return [{
            name: 'Tất cả',
            icon: 'fa-border-all',
            color: 'bg-slate-100 text-slate-500',
            count: shopProducts.length,
            preview: shopProducts[0] ? shopProducts[0].img : '',
            children: []
        }].concat(rootOptions).filter((item) => item.count > 0 || item.name === 'Tất cả');
    };
    const updateProductsCategoryButton = () => {
        const label = document.getElementById('products-category-label');
        if(label) label.innerText = filterCategory || 'Tất cả danh mục';
    };
    const getFilteredProducts = (baseProducts = shopProducts) => {
        let filtered = [...baseProducts];
        const kw = normalizeKeyword((document.getElementById('search-input') && document.getElementById('search-input').value) || '');

        if(filterCategory) filtered = filtered.filter(p => productMatchesCategory(p, filterCategory));
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

    const saveState = () => {
        localStorage.setItem('ta_cart', JSON.stringify(cartData));
        localStorage.setItem('ta_wishlist', JSON.stringify(wishlistData));
        if(currentUser) localStorage.setItem('ta_user', JSON.stringify(currentUser));
        else localStorage.removeItem('ta_user');
        if(typeof window.updateBadgeNumbers === 'function') window.updateBadgeNumbers();
    };

    const initializeAppCore = () => {
        loadState();
        applyTheme(localStorage.getItem('ta_theme') || 'light');
        const introSupportPhone = document.getElementById('intro-support-phone');
        if(introSupportPhone) introSupportPhone.innerText = STORE_CONTACT_PHONE;
        
        // MOCK DATA NÂNG CẤP THÊM IMAGES VÀ VARIANTS
        shopProducts = [
            { id: 'p1', cat: 'Sơ sinh', name: 'Set đồ sơ sinh 100% Cotton an toàn tuyệt đối', price: '199.000đ', sold: 120, inStock: true, badges: ['NEW'],
              images: ['https://images.unsplash.com/photo-1522771930-78848d92871d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=600&q=80'],
              img: 'https://images.unsplash.com/photo-1522771930-78848d92871d?auto=format&fit=crop&w=400&q=80', desc: 'Chất liệu vải 100% cotton tự nhiên, vô cùng mềm mịn và thoáng mát. An toàn cho trẻ sơ sinh từ 0-6 tháng tuổi.',
              variants: [{ name: 'Màu sắc', options: ['Xanh Mint', 'Hồng Phấn', 'Vàng Chanh'] }, { name: 'Size', options: ['0-3M', '3-6M'] }]
            },
            { id: 'p2', cat: 'Đồ chơi', name: 'Đồ chơi xếp hình gỗ Montessori', price: '150.000đ', sold: 340, inStock: true, badges: ['HOT'],
              images: ['https://drive.google.com/thumbnail?id=1ddz0OyMeWpfmrxFcrCUFavcFTTq1rZiF&sz=w800', 'https://drive.google.com/thumbnail?id=1ddz0OyMeWpfmrxFcrCUFavcFTTq1rZiF&sz=w800'],
              img: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80', desc: 'Bộ đồ chơi được làm từ gỗ tự nhiên, sơn phủ sinh học không độc hại. Phát triển tư duy logic thông qua phương pháp giáo dục Montessori.',
              variants: []
            },
            { id: 'p3', cat: 'Sữa bỉm', name: 'Sữa công thức số 1 nhập khẩu chính hãng', price: '550.000đ', sold: 89, inStock: false, badges: ['SALE'],
              images: ['https://images.unsplash.com/photo-1629815049386-5386f78cc73d?auto=format&fit=crop&w=600&q=80'],
              img: 'https://images.unsplash.com/photo-1629815049386-5386f78cc73d?auto=format&fit=crop&w=400&q=80', desc: 'Bổ sung DHA, ARA và hệ chất xơ GOS/FOS mô phỏng sữa mẹ giúp bé tiêu hóa tốt, tăng cường miễn dịch.',
              variants: [{ name: 'Khối lượng', options: ['Hộp 400g', 'Hộp 800g'] }]
            },
            { id: 'p4', cat: 'Đồ chơi', name: 'Gấu bông ru ngủ phát nhạc tự động', price: '210.000đ', sold: 215, inStock: true, badges: ['HOT', 'NEW'],
              images: ['https://images.unsplash.com/photo-1559418612-4cf4e723528b?auto=format&fit=crop&w=600&q=80'],
              img: 'https://images.unsplash.com/photo-1559418612-4cf4e723528b?auto=format&fit=crop&w=400&q=80', desc: 'Tích hợp bộ phát nhạc với tiếng ồn trắng. Cảm biến thông minh tự động phát nhạc khi bé khóc, chất liệu nỉ lông cừu siêu êm.',
              variants: [{ name: 'Mẫu mã', options: ['Gấu Nâu', 'Thỏ Trắng'] }]
            }
        ];
        shopProducts = [];

        loadCachedCatalogFromApp();
        scheduleShortcutPrompt(SHORTCUT_PROMPT_DELAY_MS);
        const initializeDeferredTabModule = (config = {}, force = false) => {
            const moduleName = String(config.moduleName || '').trim();
            const readyEvent = String(config.readyEvent || '').trim();
            const stateKey = String(config.stateKey || '').trim();
            const tabId = String(config.tabId || '').trim();
            const loadingMarkup = String(config.loadingMarkup || '').trim();
            if(!moduleName || !readyEvent || !stateKey) return;

            const renderModule = () => {
                const tabModule = window[moduleName];
                if(tabModule && typeof tabModule.render === 'function') {
                    tabModule.render({ force: !!force });
                    tabRenderState[stateKey] = true;
                    return true;
                }
                return false;
            };

            if(renderModule()) return;

            if(loadingMarkup && tabId) {
                const tabNode = document.getElementById(tabId);
                if(tabNode && !tabNode.innerHTML.trim()) tabNode.innerHTML = loadingMarkup;
            }

            const onTabReady = () => { renderModule(); };
            window.addEventListener(readyEvent, onTabReady, { once: true });
            scheduleIdleTask(renderModule, 360);
        };
        const initializeHomeTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'homeTabModule',
            readyEvent: 'web-new-home-tab-ready',
            stateKey: 'home',
            tabId: 'tab-home'
        }, force);
        const initializeProductsTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'productsTabModule',
            readyEvent: 'web-new-products-tab-ready',
            stateKey: 'products',
            tabId: 'tab-products'
        }, force);
        const initializeSaleTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'saleTabModule',
            readyEvent: 'web-new-sale-tab-ready',
            stateKey: 'sale',
            tabId: 'tab-sale',
            loadingMarkup: `<div class="bg-white rounded-[28px] border border-gray-100 p-5 shadow-sm text-sm text-gray-500">Đang tải trạm săn deal...</div>`
        }, force);
        const initializeIntroTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'introTabModule',
            readyEvent: 'web-new-intro-tab-ready',
            stateKey: 'intro',
            tabId: 'tab-intro'
        }, force);
        const initializeAccountTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'accountTabModule',
            readyEvent: 'web-new-account-tab-ready',
            stateKey: 'account',
            tabId: 'tab-account',
            loadingMarkup: `<div class="flex flex-col items-center justify-center py-20 text-center px-4 text-gray-500"><div class="w-16 h-16 rounded-full border-4 border-pink-100 border-t-babyPink animate-spin mb-4"></div><h2 class="font-bold text-lg text-gray-800 mb-2">Đang tải tài khoản</h2><p class="text-sm">Thông tin tài khoản đang được khởi tạo.</p></div>`
        }, force);
        const ensureTabInitialized = (tabId, force = false) => {
            if(tabId === 'tab-home') initializeHomeTab(force);
            if(tabId === 'tab-products') initializeProductsTab(force);
            if(tabId === 'tab-sale') initializeSaleTab(force);
            if(tabId === 'tab-intro') initializeIntroTab(force);
            if(tabId === 'tab-account') initializeAccountTab();
        };

        ensureTabInitialized('tab-home', true);
        if(typeof window.updateBadgeNumbers === 'function') window.updateBadgeNumbers();
        updateFloatingFilterButton();
        scheduleIdleTask(() => {
            if(typeof window.setupSwipeGestures === 'function') window.setupSwipeGestures();
            if(typeof window.initFullscreenSwipe === 'function') window.initFullscreenSwipe();
        }, 80);
        setupCatalogLazyObserver();
        scheduleIdleTask(async () => {
            await waitForRetailFirebaseReady();
            if(isCatalogLoadBlocked()) {
                applyCatalogBlockedState();
            } else {
                syncCatalogFromPosCache({ refreshViews: true, force: !loadCachedCatalogFromApp() });
            }
            if(window.retailFirebase && typeof window.retailFirebase.subscribeCatalogMeta === 'function') {
                window.retailFirebase.subscribeCatalogMeta((payload) => {
                    if(payload && payload.type === 'catalog-live') {
                        if(!isCatalogLoadBlocked()) {
                            loadCachedCatalogFromApp();
                            refreshCatalogViews();
                        }
                        return;
                    }
                    scheduleIdleTask(() => {
                        if(isCatalogLoadBlocked()) {
                            applyCatalogBlockedState();
                            return;
                        }
                        syncCatalogDeltaFromCloud();
                    });
                });
            }
            syncCustomerSessionFromFirebase({ clearIfSignedOut: true });
        });
        scheduleIdleTask(() => {
            if(window.introExperienceModule && typeof window.introExperienceModule.maybeAutoOpenWelcomePopup === 'function') {
                window.introExperienceModule.maybeAutoOpenWelcomePopup({ storageKey: 'ta_welcome_popup_seen_v2', delay: 700 });
            } else if(window.uiPc && typeof window.uiPc.maybeAutoOpenWelcomePopup === 'function') {
                window.uiPc.maybeAutoOpenWelcomePopup({ storageKey: 'ta_welcome_popup_seen_v2', delay: 700 });
            }
        }, 260);
        
        const navItems = document.querySelectorAll(".nav-item");
        navItems.forEach(item => {
            item.addEventListener("click", () => {
                const targetId = item.getAttribute("data-target");
                goToTab(targetId);
            });
        });

        document.addEventListener('click', (event) => {
            if(!toggleSearchOpen) return;
            const header = document.getElementById('app-header');
            if(header && !header.contains(event.target)) hideSearchBar();
        });

        window.addEventListener('storage', (event) => {
            if([POS_CACHE_KEYS.appCatalog, 'ta_user', 'ta_orders_cache_v2', 'ta_customer_profile_v2'].includes(event.key)) {
                loadCachedCatalogFromApp();
                if(event.key === POS_CACHE_KEYS.appCatalog) refreshCatalogViews();
                if(event.key === 'ta_user') {
                    loadState();
                    if(tabRenderState.account && typeof window.renderAccountTab === 'function') window.renderAccountTab();
                }
            }
        });

        window.ensureTabInitialized = ensureTabInitialized;
    };
    if(document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", initializeAppCore, { once: true });
    } else {
        initializeAppCore();
    }

    let toggleSearchOpen = false;
    window.goToTab = (targetId) => {
        const navItems = document.querySelectorAll(".nav-item");
        const tabContents = document.querySelectorAll(".tab-content");

        tabContents.forEach(tab => tab.classList.remove("active"));
        navItems.forEach(nav => nav.classList.remove("active-nav"));
        
        const targetTab = document.getElementById(targetId);
        if(targetTab) targetTab.classList.add("active");
        
        document.querySelectorAll(`.nav-item[data-target="${targetId}"]`).forEach(n => n.classList.add("active-nav"));
        
        if(typeof window.ensureTabInitialized === 'function') {
            if(targetId === 'tab-account') {
                window.ensureTabInitialized(targetId, true);
                scheduleIdleTask(async () => {
                    try {
                        await syncCustomerSessionFromFirebase({ clearIfSignedOut: true });
                        await syncOrdersFromFirebase();
                    } catch(error) {
                        console.warn('Khong dong bo duoc tab tai khoan:', error);
                    } finally {
                        if(typeof window.renderAccountTab === 'function') window.renderAccountTab();
                    }
                });
            }
            else if(['tab-products', 'tab-sale', 'tab-intro'].includes(targetId)) window.ensureTabInitialized(targetId);
            else if(targetId === 'tab-home') {
                window.ensureTabInitialized(targetId);
                scheduleIdleTask(() => {
                    if(window.homeTabModule && typeof window.homeTabModule.render === 'function') window.homeTabModule.render();
                }, 60);
            }
        } else {
            if(targetId === 'tab-account' && typeof window.renderAccountTab === 'function') window.renderAccountTab();
            if(targetId === 'tab-products' && typeof window.renderProductsTabContent === 'function') window.renderProductsTabContent();
        }
        if((targetId === 'tab-home' || targetId === 'tab-products') && !productFeedState.initialSynced) {
            scheduleIdleTask(() => syncCatalogFromPosCache({ refreshViews: true }));
        }
        
        hideSearchBar();
        updateFloatingFilterButton();
        window.scrollTo({top: 0, behavior: 'smooth'});
    };

    window.toggleSearch = () => {
        const bar = document.getElementById('search-bar');
        toggleSearchOpen = !toggleSearchOpen;
        if(toggleSearchOpen) { 
            bar.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none'); 
            document.getElementById('search-input').focus(); 
        } else { 
            hideSearchBar();
        }
    };

    window.handleSearch = (keyword) => {
        const kw = keyword.toLowerCase();
        const filtered = getFilteredProducts(shopProducts);
        
        if(document.getElementById('tab-home').classList.contains('active')) {
            const bannerSec = document.getElementById('home-banner-section');
            const titleSec = { set innerText(value) { if(typeof window.updateHomeProductTitles === 'function') window.updateHomeProductTitles(value); } };
            if(kw.length > 0) {
                if(bannerSec) bannerSec.classList.add('hidden');
                titleSec.innerText = `Kết quả cho: "${keyword}"`;
            } else {
                if(bannerSec) bannerSec.classList.remove('hidden');
                titleSec.innerText = "Sản Phẩm Đề Xuất";
            }
            if(typeof window.renderHomeProductLists === 'function') window.renderHomeProductLists(filtered);
        } else {
            goToTab('tab-products');
            if(typeof window.ensureTabInitialized === 'function') window.ensureTabInitialized('tab-products', true);
            else if(typeof window.renderProductsTabContent === 'function') window.renderProductsTabContent();
        }
    };

    // Dùng chung cho Home & Products tab
    function renderProductsList(arr, containerId = 'product-container', sourceArray = shopProducts) {
        const container = document.getElementById(containerId);
        if(!container) return;
        const imageClass = containerId === 'products-tab-grid' ? 'w-full h-36 md:h-52 object-cover rounded-xl mb-3' : 'w-full h-32 md:h-48 object-cover rounded-xl mb-3';
        const emptyClass = containerId === 'products-tab-grid' ? 'col-span-2 md:col-span-4 xl:col-span-5 2xl:col-span-6' : 'col-span-2 md:col-span-4';
        const emptyMessage = productFeedState.error
            ? `<div class='${emptyClass} text-center py-10 text-red-400'><i class="fa-solid fa-circle-exclamation text-3xl mb-3 block opacity-80"></i><p>${productFeedState.error}</p><p class='text-xs text-gray-400 mt-2'>Kiểm tra catalog public, anonymous auth và file firebase.js đang được nạp mới nhất.</p></div>`
            : `<div class='${emptyClass} text-center py-10 text-gray-400'>Không tìm thấy sản phẩm phù hợp.</div>`;
        
        container.innerHTML = arr.length ? arr.map(prod => {
            const isWished = wishlistData.includes(prod.id);
            const isInStock = isProductInStock(prod);
            const badgeHtml = renderProductBadges(prod);
            const displayName = getProductDisplayName(prod);
            const cartBtnClass = isInStock
                ? 'bg-babyPink text-white w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-pink-500 transition'
                : 'bg-gray-200 text-gray-400 w-8 h-8 rounded-full shadow-sm flex items-center justify-center opacity-60 cursor-not-allowed';
            return `
            <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative group transition hover:shadow-md flex flex-col h-full">
                ${badgeHtml}
                <button id="wish-icon-${prod.id}" onclick="toggleWishlist(event, '${prod.id}')" class="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition ${isWished ? 'text-red-500' : 'text-gray-300'} hover:text-red-500"><i class="fa-solid fa-heart"></i></button>
                <div onclick="openFullscreenViewer('${prod.id}', '${containerId}')" class="cursor-pointer">
                    <img src="${getOptimizedImageUrl(prod.img, containerId === 'products-tab-grid' ? 'w800' : 'w600')}" loading="lazy" decoding="async" class="${imageClass}" />
                    <h4 class="text-sm font-bold text-gray-700 line-clamp-2 leading-tight mb-2 hover:text-babyPink transition">${displayName}</h4>
                </div>
                <div class="flex justify-between items-end mt-auto pt-2">
                    <div><span class="text-babyPink font-extrabold text-sm block">${formatProductPriceLabel(prod)}</span></div>
                    <div class="flex items-center gap-1.5 md:gap-2">
                        <button onclick="openProductDetail('${prod.id}')" class="bg-pink-50 text-babyPink w-8 h-8 md:w-auto md:px-3 rounded-full md:rounded-lg flex items-center justify-center font-bold text-xs shadow-sm hover:bg-pink-100 transition"><i class="fa-solid fa-eye md:hidden"></i><span class="hidden md:inline">Chi tiết</span></button>
                        <button onclick="${isInStock ? `openPopup('${prod.id}')` : `showToast('Sản phẩm hiện đã hết hàng.', 'warning')`}" class="${cartBtnClass}" ${isInStock ? '' : 'disabled'}><i class="fa-solid fa-cart-shopping text-sm"></i></button>
                    </div>
                </div>
            </div>`;
        }).join('') : emptyMessage;
        
        window[`context_${containerId}`] = sourceArray;
    }
    window.renderProductsList = renderProductsList;
    window.webNewAppBridge = Object.assign(window.webNewAppBridge || {}, {
        createDefaultProductFilters,
        getCartData: () => cartData,
        setCartData: (nextValue) => {
            cartData = Array.isArray(nextValue) ? nextValue : [];
            return cartData;
        },
        getWishlistData: () => wishlistData,
        setWishlistData: (nextValue) => {
            wishlistData = Array.isArray(nextValue) ? nextValue : [];
            return wishlistData;
        },
        getCurrentUser: () => currentUser,
        setCurrentUser: (nextValue) => {
            currentUser = nextValue || null;
            return currentUser;
        },
        getCurrentViewingProduct: () => currentViewingProduct,
        setCurrentViewingProduct: (nextValue) => {
            currentViewingProduct = nextValue || null;
            return currentViewingProduct;
        },
        getShopProducts: () => shopProducts,
        setShopProducts: (nextValue) => {
            shopProducts = Array.isArray(nextValue) ? nextValue : [];
            return shopProducts;
        },
        getFilterCategory: () => filterCategory,
        setFilterCategory: (nextValue) => {
            filterCategory = String(nextValue || '').trim();
            return filterCategory;
        },
        getCurrentTheme: () => currentTheme,
        setCurrentTheme: (nextValue) => {
            currentTheme = nextValue === 'dark' ? 'dark' : 'light';
            return currentTheme;
        },
        getProductFilters: () => productFilters,
        setProductFilters: (nextValue) => {
            productFilters = nextValue && typeof nextValue === 'object'
                ? { ...productFilters, ...nextValue }
                : productFilters;
            return productFilters;
        },
        replaceProductFilters: (nextValue) => {
            productFilters = nextValue && typeof nextValue === 'object'
                ? { ...createDefaultProductFilters(), ...nextValue }
                : createDefaultProductFilters();
            return productFilters;
        },
        getActiveProfileField: () => activeProfileField,
        setActiveProfileField: (nextValue) => {
            activeProfileField = String(nextValue || '').trim();
            return activeProfileField;
        },
        getHomeBannerIndex: () => homeBannerIndex,
        setHomeBannerIndex: (nextValue) => {
            homeBannerIndex = Math.max(0, Number(nextValue) || 0);
            return homeBannerIndex;
        },
        getHomeBannerTimer: () => homeBannerTimer,
        setHomeBannerTimer: (nextValue) => {
            homeBannerTimer = nextValue || null;
            return homeBannerTimer;
        },
        getTabRenderState: () => tabRenderState,
        getProductFeedState: () => productFeedState,
        getRemoteState: () => remoteState,
        saveState,
        loadState,
        scheduleIdleTask,
        formatMoney,
        parseMoney,
        hasRetailFirebase,
        getFirebaseReadyMessage,
        waitForRetailFirebaseReady,
        requestCatalogSyncAfterAuth: window.requestCatalogSyncAfterAuth,
        normalizeUserData,
        syncCurrentUserToCloud,
        syncOrdersFromFirebase,
        syncOrderDetailFromFirebase,
        isProductInStock,
        renderProductBadges,
        showToast,
        openConfirmModal,
        openModalShell,
        closeModalShell,
        getOrderTotals,
        getOptimizedImageUrl,
        normalizeKeyword,
        isAllCategory,
        getProductDisplayName,
        getProductUnit,
        getProductMinQty,
        formatProductPriceLabel,
        getProductCategoryNames,
        getProductCategoryOptions,
        getCategoryVisual,
        getProductVariantSummary,
        productMatchesCategory,
        getFilteredProducts,
        toInlineArgument,
        updateProductsCategoryButton,
        openStoreZalo,
        openStoreFacebook: window.openStoreFacebook,
        openStoreEmail: window.openStoreEmail,
        openStoreZaloGroup: window.openStoreZaloGroup,
        sendTelegramEvent,
        formatBirthdayDisplay,
        renderProductsList,
        defaultGuestName: DEFAULT_GUEST_NAME,
        storeContactPhone: STORE_CONTACT_PHONE,
        storeZaloPhone: STORE_ZALO_PHONE,
        passwordResetZaloPhone: PASSWORD_RESET_ZALO_PHONE,
        storeMapUrl: STORE_MAP_URL
    });

    // ==========================================
    // TRẢI NGHIỆM FULLSCREEN VIEWER
    // ==========================================
    const renderFullscreenDots = (images = []) => {
        const dotsContainer = document.getElementById('fs-dots');
        if(!dotsContainer) return;
        if(images.length > 1) {
            dotsContainer.innerHTML = images.map((_, i) => `<div class="h-1.5 rounded-full transition-all duration-300 ${i === fsCurrentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}"></div>`).join('');
        } else {
            dotsContainer.innerHTML = '';
        }
    };
    const updateFullscreenUI = () => {
        const prod = fsContextList[fsCurrentIndex];
        if(!prod) return;

        const trackEl = document.getElementById('fs-img-track');
        const images = (prod.images && prod.images.length) ? prod.images : [prod.img];
        const minQty = getProductMinQty(prod);

        currentViewingProduct = prod;
        if(trackEl) {
            trackEl.innerHTML = images.map((image, index) => `
                <div class="w-full h-full shrink-0 snap-center flex items-center justify-center bg-black">
                    <img src="${getOptimizedImageUrl(image, index === 0 ? 'w1600' : 'w1400')}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" class="max-w-full max-h-full lg:max-h-[calc(100vh-16rem)] object-contain pointer-events-none select-none"/>
                </div>
            `).join('');
            requestAnimationFrame(() => {
                trackEl.scrollTo({ left: (trackEl.clientWidth || 0) * fsCurrentImageIndex, behavior: 'auto' });
            });
        }

        document.getElementById('fs-name').innerText = getProductDisplayName(prod);
        document.getElementById('fs-price').innerText = formatProductPriceLabel(prod);
        document.getElementById('fs-sold').innerText = '';
        const variantSummaryEl = document.getElementById('fs-variant-summary');
        if(variantSummaryEl) {
            const variantSummary = getProductVariantSummary(prod);
            const summaryParts = [variantSummary || getProductTagText(prod)];
            if(minQty > 1) summaryParts.push(`Mua tối thiểu ${minQty}${prod.unit ? ` ${prod.unit}` : ''}`);
            variantSummaryEl.innerText = summaryParts.filter(Boolean).join(' • ');
        }
        const fsQtyInput = document.getElementById('fs-qty');
        if(fsQtyInput) {
            fsQtyInput.min = String(minQty);
            fsQtyInput.value = String(minQty);
        }
        const inStock = isProductInStock(prod);
        const fsAddBtn = document.getElementById('fs-add-btn');
        const fsQtyWrap = document.getElementById('fs-qty-wrap');
        if(fsAddBtn) {
            fsAddBtn.disabled = !inStock;
            fsAddBtn.className = inStock
                ? 'w-12 h-12 bg-babyPink text-white rounded-full shadow-[0_4px_15px_rgba(255,143,171,0.5)] flex items-center justify-center hover:bg-pink-500 transition shrink-0'
                : 'w-12 h-12 bg-white/10 text-white/60 rounded-full flex items-center justify-center border border-white/10 opacity-50 cursor-not-allowed shrink-0';
            fsAddBtn.innerHTML = inStock ? `<i class="fa-solid fa-cart-shopping"></i> Thêm vào giỏ` : `<i class="fa-solid fa-ban"></i> Hết hàng`;
        }
        if(fsAddBtn) {
            fsAddBtn.setAttribute('aria-label', inStock ? 'Thêm vào giỏ' : 'Hết hàng');
            fsAddBtn.innerHTML = inStock ? `<i class="fa-solid fa-cart-shopping text-sm"></i>` : `<i class="fa-solid fa-ban text-sm"></i>`;
        }
        if(fsQtyWrap) {
            fsQtyWrap.classList.toggle('opacity-50', !inStock);
            fsQtyWrap.classList.toggle('pointer-events-none', !inStock);
        }

        renderFullscreenDots(images);
        const thumbStrip = document.getElementById('fs-thumb-strip');
        if(thumbStrip) {
            thumbStrip.classList.toggle('hidden', images.length <= 1);
            thumbStrip.classList.toggle('flex', images.length > 1);
            thumbStrip.innerHTML = images.map((image, index) => `
                <button class="w-14 h-14 rounded-2xl overflow-hidden border ${index === fsCurrentImageIndex ? 'border-babyPink ring-2 ring-babyPink/50' : 'border-white/20'} bg-white/10 shrink-0" onclick="scrollFullscreenImage(${index})">
                    <img src="${getOptimizedImageUrl(image, 'w300')}" loading="lazy" decoding="async" class="w-full h-full object-contain bg-black/20"/>
                </button>
            `).join('');
        }

        const wishBtn = document.getElementById('fs-wish-btn');
        wishBtn.innerHTML = `<i class="fa-solid fa-heart ${wishlistData.includes(prod.id) ? 'text-red-500' : 'text-white'}"></i>`;
    };
    window.scrollFullscreenImage = (index) => {
        const trackEl = document.getElementById('fs-img-track');
        fsCurrentImageIndex = Math.max(0, Number(index) || 0);
        renderFullscreenDots((fsContextList[fsCurrentIndex] && fsContextList[fsCurrentIndex].images) || []);
        if(trackEl) {
            trackEl.scrollTo({
                left: (trackEl.clientWidth || 0) * fsCurrentImageIndex,
                behavior: 'smooth'
            });
        }
        const prod = fsContextList[fsCurrentIndex];
        const images = (prod && prod.images && prod.images.length) ? prod.images : [prod && prod.img];
        const thumbStrip = document.getElementById('fs-thumb-strip');
        if(thumbStrip) {
            thumbStrip.querySelectorAll('button').forEach((button, buttonIndex) => {
                button.classList.toggle('border-babyPink', buttonIndex === fsCurrentImageIndex);
                button.classList.toggle('ring-2', buttonIndex === fsCurrentImageIndex);
                button.classList.toggle('ring-babyPink/50', buttonIndex === fsCurrentImageIndex);
                button.classList.toggle('border-white/20', buttonIndex !== fsCurrentImageIndex);
            });
        }
        renderFullscreenDots(images);
    };

    window.openFullscreenViewer = (productId, contextId) => {
        fsContextList = window[`context_${contextId}`] || shopProducts;
        fsCurrentIndex = fsContextList.findIndex(p => p.id === productId);
        if(fsCurrentIndex === -1) {
            fsCurrentIndex = 0;
            fsContextList = shopProducts;
        }
        const viewer = document.getElementById('fullscreen-viewer');
        viewer.classList.remove('hidden');
        requestAnimationFrame(() => {
            fsCurrentImageIndex = 0;
            updateFullscreenUI();
            viewer.classList.remove('opacity-0');
        });
    };

    window.closeFullscreenViewer = () => {
        const viewer = document.getElementById('fullscreen-viewer');
        viewer.classList.add('opacity-0');
        setTimeout(() => { viewer.classList.add('hidden'); }, 300);
    };
    document.addEventListener('keydown', (event) => {
        const viewer = document.getElementById('fullscreen-viewer');
        if(!viewer || viewer.classList.contains('hidden')) return;
        if(event.key === 'ArrowLeft') changeFullscreenProduct(-1);
        if(event.key === 'ArrowRight') changeFullscreenProduct(1);
        if(event.key === 'Escape') closeFullscreenViewer();
    });

    window.initFullscreenSwipe = () => {
        const container = document.getElementById('fs-img-container');
        const track = document.getElementById('fs-img-track');
        if(!container || !track || container.dataset.swipeBound === '1') return;
        container.dataset.swipeBound = '1';
        let startX = 0;
        let startY = 0;

        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        track.addEventListener('scroll', () => {
            const width = track.clientWidth || 1;
            const nextIndex = Math.round(track.scrollLeft / width);
            if(nextIndex === fsCurrentImageIndex) return;
            fsCurrentImageIndex = nextIndex;
            const prod = fsContextList[fsCurrentIndex];
            renderFullscreenDots((prod && prod.images && prod.images.length) ? prod.images : [prod && prod.img]);
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = endX - startX;
            const diffY = endY - startY;

            if(Math.abs(diffX) > Math.abs(diffY)) return;

            if(Math.abs(diffY) <= 60) return;
            if(diffY > 0 && fsCurrentIndex > 0) fsCurrentIndex--;
            else if(diffY < 0 && fsCurrentIndex < fsContextList.length - 1) fsCurrentIndex++;
            fsCurrentImageIndex = 0;
            updateFullscreenUI();
        }, { passive: true });
    };

    window.fsChangeQty = (delta) => {
        const product = fsContextList[fsCurrentIndex];
        if(!isProductInStock(product)) return;
        const minQty = getProductMinQty(product);
        const currentValue = window.sanitizeQtyInput('fs-qty', minQty);
        document.getElementById('fs-qty').value = Math.max(minQty, currentValue + Number(delta || 0));
    };

    window.fsToggleWish = () => {
        const prod = fsContextList[fsCurrentIndex];
        if(!prod) return;
        toggleWishlist({ stopPropagation: () => {} }, prod.id);
        updateFullscreenUI();
    };

    window.fsViewDetail = () => {
        const prod = fsContextList[fsCurrentIndex];
        if(!prod) return;
        closeFullscreenViewer();
        setTimeout(() => openProductDetail(prod.id), 220);
    };
    const animateFullscreenProductSwap = (direction) => {
        const animationClass = Number(direction || 0) >= 0 ? 'fs-product-slide-next' : 'fs-product-slide-prev';
        ['fs-img-container', 'fs-info-panel'].forEach((id) => {
            const element = document.getElementById(id);
            if(!element) return;
            element.classList.remove('fs-product-slide-next', 'fs-product-slide-prev');
            void element.offsetWidth;
            element.classList.add(animationClass);
            setTimeout(() => element.classList.remove(animationClass), 280);
        });
    };
    window.changeFullscreenProduct = (direction) => {
        if(!Array.isArray(fsContextList) || !fsContextList.length) return;
        const nextIndex = fsCurrentIndex + Number(direction || 0);
        if(nextIndex < 0 || nextIndex >= fsContextList.length) return;
        fsCurrentIndex = nextIndex;
        fsCurrentImageIndex = 0;
        updateFullscreenUI();
        animateFullscreenProductSwap(direction);
    };

    window.fsAddToCart = () => {
        const prod = fsContextList[fsCurrentIndex];
        if(!prod) return;
        if(!isProductInStock(prod)) return showToast('Sản phẩm hiện đã hết hàng.', 'warning');
        const qty = Math.max(getProductMinQty(prod), window.sanitizeQtyInput('fs-qty', getProductMinQty(prod)));
        let varsText = '';

        if(prod.variants && prod.variants.length > 0) {
            const autoSelected = {};
            prod.variants.forEach(v => { autoSelected[v.name] = v.options[0]; });
            varsText = Object.entries(autoSelected).map(([k, v]) => `${k}: ${v}`).join(' | ');
        }

        if(typeof window.addToCartLogic === 'function') window.addToCartLogic(prod, qty, varsText);
        if(varsText) showToast(`Đã thêm vào giỏ với phân loại mặc định: ${varsText}`, 'success');
        else showToast('Đã thêm vào giỏ hàng!', 'success');
        closeFullscreenViewer();
    };


    const categoryTree = [
        { id: 'c1', name: 'Đồ chơi', banner: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=500&q=80', subCats: [{ name: 'Xếp hình', img: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80' }, { name: 'Nhồi bông', img: 'https://images.unsplash.com/photo-1559418612-4cf4e723528b?auto=format&fit=crop&w=400&q=80' }] },
        { id: 'c2', name: 'Sơ sinh & Sữa', banner: 'https://images.unsplash.com/photo-1522771930-78848d92871d?auto=format&fit=crop&w=500&q=80', subCats: [{ name: 'Quần áo', img: 'https://images.unsplash.com/photo-1522771930-78848d92871d?auto=format&fit=crop&w=400&q=80' }, { name: 'Sữa công thức', img: 'https://images.unsplash.com/photo-1629815049386-5386f78cc73d?auto=format&fit=crop&w=400&q=80' }] },
        { id: 'c3', name: 'Xe đẩy', banner: 'https://images.unsplash.com/photo-1512413914619-74d32e60086c?auto=format&fit=crop&w=500&q=80', subCats: [{ name: 'Du lịch', img: 'https://images.unsplash.com/photo-1512413914619-74d32e60086c?auto=format&fit=crop&w=400&q=80' }] }
    ];
    
    window.renderCatContent = (id) => {
        const selected = categoryTree.find(c => c.id === id);
        if(!selected) return;
        document.getElementById("cat-content").innerHTML = `
            <div class="w-full h-28 md:h-40 rounded-lg overflow-hidden mb-4 shadow-sm relative">
                <img src="${getOptimizedImageUrl(selected.banner, 'w1200')}" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/20 flex items-center justify-center"><span class="text-white font-bold tracking-widest text-sm md:text-lg">${selected.name.toUpperCase()}</span></div>
            </div>
            <div class="grid grid-cols-3 md:grid-cols-4 gap-3">
                ${selected.subCats.map(sub => `
                    <div class="flex flex-col items-center cursor-pointer group">
                        <img src="${getOptimizedImageUrl(sub.img, 'w400')}" loading="lazy" decoding="async" class="w-14 h-14 md:w-20 md:h-20 object-cover rounded-full border border-gray-100 group-hover:border-babyPink mb-1.5 shadow-sm transition-colors" />
                        <span class="text-[9px] md:text-xs text-center text-gray-600 font-medium">${sub.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const renderCatSidebar = () => {
        document.getElementById("cat-sidebar").innerHTML = categoryTree.map((cat, index) => {
            const isActive = index === 0 ? "bg-white border-babyPink text-babyPink font-bold" : "border-transparent text-gray-600";
            return `<div class="cat-item py-4 px-2 text-center text-[11px] md:text-sm border-l-4 cursor-pointer transition-colors ${isActive}" data-id="${cat.id}">${cat.name}</div>`;
        }).join('');
        
        document.querySelectorAll('.cat-item').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('.cat-item').forEach(i => i.className = "cat-item py-4 px-2 text-center text-[11px] md:text-sm border-l-4 cursor-pointer transition-colors border-transparent text-gray-600");
                this.className = "cat-item py-4 px-2 text-center text-[11px] md:text-sm border-l-4 cursor-pointer transition-colors bg-white border-babyPink text-babyPink font-bold";
                renderCatContent(this.getAttribute("data-id"));
            });
        });
        if(categoryTree.length > 0) renderCatContent(categoryTree[0].id);
    };

    

    // SỔ ĐỊA CHỈ TRONG SETTINGS (Hỗ trợ nhiều địa chỉ)
    window.openSettings = () => {
        if(!currentUser) return;
        currentUser = normalizeUserData(currentUser);
        const u = currentUser;
        let addressesHtml = `<p class="text-sm text-gray-500 text-center py-4">Bạn chưa có địa chỉ nào.</p>`;
        
        if(u.addresses && u.addresses.length > 0) {
            addressesHtml = u.addresses.map((addr) => `
                <div class="bg-white rounded-2xl shadow-sm border ${addr.isDefault ? 'border-babyPink bg-pink-50/30' : 'border-gray-200'} p-4 mb-3 relative">
                    ${addr.isDefault ? '<div class="absolute top-3 right-3 text-[9px] font-bold bg-babyPink text-white px-2 py-1 rounded-full shadow-sm">Mặc định</div>' : ''}
                    <p class="text-sm text-gray-700 font-semibold pr-16 leading-6">${addr.text}</p>
                    <div class="flex gap-3 mt-3 pt-3 border-t border-dashed">
                        ${!addr.isDefault ? `<button onclick="setAddressDefault('${addr.id}')" class="text-xs text-blue-500 font-bold hover:underline">Đặt mặc định</button>` : ''}
                        <button onclick="deleteAddress('${addr.id}')" class="text-xs text-red-500 font-bold hover:underline ml-auto"><i class="fa-solid fa-trash"></i> Xóa</button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('settings-content').innerHTML = `
            <div id="settings-view" class="space-y-4">
<section class="rounded-2xl md:rounded-[28px] bg-white p-4 md:p-5 shadow-sm border border-gray-100">
                    <div class="rounded-[24px] bg-gray-50 p-5 text-center">
                        <div class="w-24 h-24 rounded-full bg-white border border-gray-200 mx-auto overflow-hidden flex items-center justify-center text-babyPink text-3xl shadow-sm">
                            ${u.avatar ? `<img src="${getOptimizedImageUrl(u.avatar, 'w300')}" loading="lazy" decoding="async" class="w-full h-full object-cover"/>` : `<i class="fa-regular fa-user"></i>`}
                        </div>
                        <button class="mt-4 text-sm font-bold text-gray-600 inline-flex items-center gap-2" onclick="openProfileFieldEditor('avatar')"><i class="fa-regular fa-pen-to-square"></i> Sửa</button>
                    </div>
                </section>

                <section class="rounded-[28px] bg-white shadow-sm border border-gray-100 overflow-hidden">
                    <button class="w-full bg-gray-50 px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-pink-50 transition" onclick="openProfileFieldEditor('name')">
                        <div>
                            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Hồ sơ người dùng</p>
                            <h3 class="font-bold text-lg text-gray-800 mt-1">${u.name}</h3>
                            <p class="text-sm text-gray-500 mt-1 max-w-[80vw] md:max-w-[380px] truncate">${u.bio}</p>
                        </div>
                        <span class="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-babyPink shadow-sm">
                            <i class="fa-solid fa-angle-right"></i>
                        </span>
                    </button>
                    <div class="grid gap-px bg-gray-100">
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition" onclick="openProfileFieldEditor('bio')">
                            <span class="text-gray-600">Tiểu sử</span>
                            <span class="font-bold text-gray-800 flex items-center gap-2 max-w-[60%] text-right truncate">${u.bio}<i class="fa-solid fa-angle-right text-gray-300"></i></span>
                        </button>
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition" onclick="openProfileFieldEditor('gender')">
                            <span class="text-gray-600">Giới tính</span>
                            <span class="font-bold text-gray-800 flex items-center gap-2">${u.gender}<i class="fa-solid fa-angle-right text-gray-300"></i></span>
                        </button>
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition" onclick="openProfileFieldEditor('birthday')">
                            <span class="text-gray-600">Ngày sinh</span>
                            <span class="font-bold text-gray-800 flex items-center gap-2">${formatBirthdayDisplay(u.birthday)}<i class="fa-solid fa-angle-right text-gray-300"></i></span>
                        </button>
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition" onclick="openProfileFieldEditor('personalInfo')">
                            <span class="text-gray-600">Thông tin cá nhân</span>
                            <span class="font-bold text-babyPink flex items-center gap-2">${u.personalInfo}<i class="fa-solid fa-angle-right text-gray-300"></i></span>
                        </button>
                    </div>
                </section>

                <section class="rounded-[28px] bg-white shadow-sm border border-gray-100 overflow-hidden">
                    <div class="grid gap-px bg-gray-100">
                        <div class="bg-white px-4 py-4 flex items-center justify-between gap-4">
                            <span class="text-gray-600">Số điện thoại</span>
                                <span class="font-bold text-gray-800">${u.phone || 'Chưa cập nhật'}</span>
                        </div>
                        <div class="bg-white px-4 py-4 flex items-center justify-between gap-4">
                            <span class="text-gray-600">Email</span>
                                <span class="font-bold text-gray-800">${u.email || 'Chưa cập nhật'}</span>
                        </div>
                    </div>
                </section>

                <div id="settings-editor-panel" class="fixed inset-0 z-[120] bg-black/50 modal-shell flex items-center justify-center p-4" onclick="if(event.target === this) closeProfileFieldEditor()">
                    <div class="modal-panel bg-white w-full max-w-md rounded-[28px] p-5 shadow-2xl" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-extrabold text-lg text-gray-800" id="settings-editor-title">Chỉnh sửa</h3>
                            <button class="text-gray-400 hover:text-gray-600" onclick="closeProfileFieldEditor()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div id="settings-editor-body"></div>
                        <div class="flex gap-3 mt-4">
                            <button onclick="closeProfileFieldEditor()" class="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition">Hủy</button>
                            <button onclick="saveProfileField()" class="flex-1 bg-babyPink text-white py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition">OK</button>
                        </div>
                    </div>
                </div>
                
<section class="rounded-2xl md:rounded-[28px] bg-white p-4 md:p-5 shadow-sm border border-gray-100">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h3 class="font-extrabold text-lg text-gray-800">Sổ địa chỉ giao hàng</h3>
                            <p class="text-sm text-gray-500 mt-1">Quản lý địa chỉ nhận hàng nhanh ngay trong tài khoản.</p>
                        </div>
                        <button onclick="toggleAddAddress()" class="text-babyPink font-bold cursor-pointer bg-pink-50 px-3 py-2 rounded-2xl shadow-sm">+ Thêm mới</button>
                    </div>
                    ${addressesHtml}
                </section>
            </div>

<div id="settings-add-address" class="hidden rounded-2xl md:rounded-[28px] bg-white p-4 md:p-5 shadow-sm border border-gray-100">
                <h3 class="font-extrabold text-lg text-gray-800 mb-3">Thêm địa chỉ mới</h3>
                <textarea id="new-address-text" placeholder="Nhập Số nhà, Đường, Phường, Quận, Tỉnh/TP..." class="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm mb-3 h-24 focus:outline-babyPink shadow-sm"></textarea>
                <div class="flex items-center gap-2 mb-4">
                    <input type="checkbox" id="new-address-default" class="w-4 h-4 text-babyPink focus:ring-babyPink border-gray-300 rounded"/>
                    <label for="new-address-default" class="text-sm text-gray-700 font-semibold">Đặt làm mặc định</label>
                </div>
                <button onclick="saveAddress()" class="w-full bg-babyPink text-white py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition">Lưu địa chỉ</button>
                <button onclick="toggleAddAddress()" class="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold mt-2 hover:bg-gray-200 transition">Hủy</button>
            </div>
        `;
        document.getElementById('account-settings-page').classList.remove('translate-x-full');
    };

    window.closeSettings = () => { document.getElementById('account-settings-page').classList.add('translate-x-full'); };
    window.openProfileFieldEditor = (field) => {
        activeProfileField = field;
        const panel = document.getElementById('settings-editor-panel');
        const title = document.getElementById('settings-editor-title');
        const body = document.getElementById('settings-editor-body');
        if(!panel || !title || !body) return;

        const templates = {
            avatar: {
                title: 'Cập nhật ảnh đại diện',
                html: `
                    <input id="settings-field-input" value="${currentUser.avatar || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Dán URL ảnh đại diện" type="text"/>
                    <div class="relative mt-3">
                        <input id="settings-avatar-file" class="w-full bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" accept="image/*" type="file"/>
                    </div>
                    <p class="text-xs text-gray-500 mt-3 leading-5">
                        Chọn ảnh từ máy để upload lên thư mục cấu hình sẵn trong <code>upload-avatar.php</code>.
                    </p>
                `
            },
            name: {
                title: 'Sửa tên hiển thị',
                html: `<input id="settings-field-input" value="${currentUser.name}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Nhập tên hiển thị" type="text"/>`
            },
            bio: {
                title: 'Sửa tiểu sử',
                html: `<textarea id="settings-field-input" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm h-28 focus:outline-babyPink shadow-sm" placeholder="Viết ngắn gọn về cửa hàng hoặc nhu cầu của bạn">${currentUser.bio}</textarea>`
            },
            gender: {
                title: 'Chọn giới tính',
                html: `<select id="settings-field-input" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm"><option ${currentUser.gender === 'Nam' ? 'selected' : ''}>Nam</option><option ${currentUser.gender === 'Nữ' ? 'selected' : ''}>Nữ</option><option ${currentUser.gender === 'Khác' ? 'selected' : ''}>Khác</option><option ${currentUser.gender === 'Chưa cập nhật' ? 'selected' : ''}>Chưa cập nhật</option></select>`
            },
            birthday: {
                title: 'Chọn ngày sinh',
                html: `<input id="settings-field-input" value="${currentUser.birthday || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" type="date"/>`
            },
            personalInfo: {
                title: 'Thông tin cá nhân',
                html: `<input id="settings-field-input" value="${currentUser.personalInfo === 'Thiết lập ngay' ? '' : currentUser.personalInfo}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Ví dụ: Mẹ bầu tháng 8, cần combo quà tặng..." type="text"/>`
            }
        };

        title.innerText = templates[field].title;
        body.innerHTML = templates[field].html;
        openModalShell('settings-editor-panel');
        setTimeout(() => {
            const input = document.getElementById('settings-field-input');
            if(input) input.focus();
        }, 40);
    };
    window.closeProfileFieldEditor = () => {
        activeProfileField = '';
        closeModalShell('settings-editor-panel');
    };
    window.saveProfileField = async () => {
        const input = document.getElementById('settings-field-input');
        if(!input || !activeProfileField) return;
        let value = input.value.trim();
        if(activeProfileField === 'name' && !value) return showToast("Tên hiển thị không được để trống.", 'warning');
        if(activeProfileField === 'bio' && !value) return showToast("Tiểu sử không được để trống.", 'warning');

        if(activeProfileField === 'avatar') {
            const fileInput = document.getElementById('settings-avatar-file');
            if(fileInput && fileInput.files && fileInput.files[0]) {
                try {
                    const formData = new FormData();
                    formData.append('avatar', fileInput.files[0]);
                    const response = await fetch('upload-avatar.php', { method: 'POST', body: formData });
                    const result = await response.json();
                    if(!response.ok || !result.url) {
                        throw new Error(result.message || 'UPLOAD_FAILED');
                    }
                    value = result.url;
                } catch(error) {
                    return showToast('Upload ảnh thất bại. Kiểm tra lại cấu hình thư mục trong upload-avatar.php.', 'warning');
                }
            }
        }

        if(activeProfileField === 'personalInfo') currentUser.personalInfo = value || 'Thiết lập ngay';
        else currentUser[activeProfileField] = value;
        saveState();
        scheduleIdleTask(() => syncCurrentUserToCloud());
        closeProfileFieldEditor();
        openSettings();
        renderAccountTab();
        showToast("Hồ sơ cá nhân đã được cập nhật.", 'success');
    };
    window.toggleAddAddress = () => {
        const view = document.getElementById('settings-view');
        const addAddress = document.getElementById('settings-add-address');
        if(!view || !addAddress) return;
        const opening = addAddress.classList.contains('hidden');
        if(opening) {
            view.classList.add('hidden');
            addAddress.classList.remove('hidden');
        } else {
            addAddress.classList.add('hidden');
            view.classList.remove('hidden');
        }
    };

    window.saveAddress = () => {
        const txt = document.getElementById('new-address-text').value;
        const phoneInput = document.getElementById('new-address-phone');
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const isDefault = document.getElementById('new-address-default').checked;
        if(!txt.trim()) return showToast("Vui lòng nhập địa chỉ!", 'warning');
        if(!phone) return showToast("Vui lòng nhập số điện thoại giao hàng!", 'warning');
        
        if(!currentUser.addresses) currentUser.addresses = [];
        if(isDefault || currentUser.addresses.length === 0) {
            currentUser.addresses.forEach(a => a.isDefault = false);
        }
        
        currentUser.addresses.push({ id: 'addr_'+Date.now(), text: txt, phone: phone, isDefault: (isDefault || currentUser.addresses.length === 0) });
        saveState();
        scheduleIdleTask(() => syncCurrentUserToCloud());
        openSettings();
        showToast("Đã lưu địa chỉ giao hàng.", 'success');
    };

    window.setAddressDefault = (id) => {
        currentUser.addresses.forEach(a => { a.isDefault = (a.id === id); });
        saveState();
        scheduleIdleTask(() => syncCurrentUserToCloud());
        openSettings();
        showToast("Đã cập nhật địa chỉ mặc định.", 'success');
    };

    window.deleteAddress = (id) => {
        openConfirmModal("Bạn có chắc muốn xóa địa chỉ này?", () => {
            currentUser.addresses = currentUser.addresses.filter(a => a.id !== id);
            if(currentUser.addresses.length > 0 && !currentUser.addresses.find(a=>a.isDefault)) {
                currentUser.addresses[0].isDefault = true;
            }
            saveState();
            scheduleIdleTask(() => syncCurrentUserToCloud());
            openSettings();
            showToast("Đã xóa địa chỉ.", 'success');
        });
    };

    window.toggleWishlist = (event, id) => {
        event.stopPropagation();
        const iconBtn = document.getElementById(`wish-icon-${id}`);
        
        if(wishlistData.includes(id)) {
            wishlistData = wishlistData.filter(i => i !== id);
            if(iconBtn) { iconBtn.classList.remove('text-red-500'); iconBtn.classList.add('text-gray-300'); }
        } else {
            wishlistData.push(id);
            if(iconBtn) { iconBtn.classList.add('text-red-500'); iconBtn.classList.remove('text-gray-300'); }
        }
        saveState();
        if(document.getElementById('pd-name') && currentViewingProduct && currentViewingProduct.id === id) {
            updatePDWishlistBtn(id);
        }
        if(document.getElementById('tab-account').classList.contains('active') && typeof window.renderAccountTab === 'function') window.renderAccountTab();
        if(typeof window.renderWishlistUI === 'function') window.renderWishlistUI();
    };

    const updatePDWishlistBtn = (id) => {
        const btn = document.getElementById('pd-wish-btn');
        if(!btn) return;
        if(wishlistData.includes(id)) { btn.classList.add('text-red-500'); btn.classList.remove('text-gray-400'); }
        else { btn.classList.remove('text-red-500'); btn.classList.add('text-gray-400'); }
    };
    window.toggleDetailWishlist = () => { if(currentViewingProduct) toggleWishlist({ stopPropagation: () => {} }, currentViewingProduct.id); };

    window.openWishlist = () => { renderWishlistUI(); document.getElementById('wishlist-page').classList.remove('translate-x-full'); };
    window.closeWishlist = () => { document.getElementById('wishlist-page').classList.add('translate-x-full'); };

    window.renderWishlistUI = () => {
        const container = document.getElementById('wishlist-content');
        if(!container) return;
        
        if(wishlistData.length === 0) {
            container.innerHTML = `<div class='col-span-2 md:col-span-4 flex flex-col items-center justify-center py-20 text-gray-400'><i class='fa-regular fa-heart text-5xl mb-3 opacity-50'></i><p>Bạn chưa yêu thích sản phẩm nào.</p></div>`;
            return;
        }

        const items = shopProducts.filter(p => wishlistData.includes(p.id));
        container.innerHTML = items.map(prod => `
            <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative group transition hover:shadow-md flex flex-col h-full">
                ${renderProductBadges(prod)}
                <button onclick="toggleWishlist(event, '${prod.id}')" class="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-red-500 hover:text-gray-300 transition"><i class="fa-solid fa-heart"></i></button>
                <div onclick="openProductDetail('${prod.id}')" class="cursor-pointer">
                    <img src="${getOptimizedImageUrl(prod.img, 'w600')}" loading="lazy" decoding="async" class="w-full h-32 md:h-48 object-cover rounded-xl mb-3" />
                    <h4 class="text-sm font-bold text-gray-700 line-clamp-2 leading-tight mb-2 hover:text-babyPink transition">${getProductDisplayName(prod)}</h4>
                </div>
                <div class="flex justify-between items-end mt-auto pt-2">
                    <div>
                        <span class="text-babyPink font-extrabold text-sm block">${formatProductPriceLabel(prod)}</span>
                    </div>
                    <button onclick="${isProductInStock(prod) ? `openPopup('${prod.id}')` : `showToast('Sản phẩm hiện đã hết hàng.', 'warning')`}" class="${isProductInStock(prod) ? 'bg-babyPink text-white w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-pink-500 transition' : 'bg-gray-200 text-gray-400 w-8 h-8 rounded-full shadow-sm flex items-center justify-center opacity-60 cursor-not-allowed'}" ${isProductInStock(prod) ? '' : 'disabled'}><i class="fa-solid fa-cart-plus text-sm"></i></button>
                </div>
            </div>
        `).join('');
    };

    window.openOrders = async () => {
        await syncOrdersFromFirebase({ force: true });
        renderOrdersUI();
        document.getElementById('orders-page').classList.remove('translate-x-full');
    };
    window.closeOrders = () => {
        document.getElementById('orders-page').classList.add('translate-x-full');
        closeModalShell('order-detail-overlay');
    };
    window.closeOrderDetail = () => {
        activeOrderDetailId = null;
        closeModalShell('order-detail-overlay');
    };
    window.openOrderDetail = async (orderId) => {
        if(!currentUser || !currentUser.orders) return;
        await syncOrderDetailFromFirebase(orderId);
        const order = currentUser.orders.find(item => item.id === orderId);
        if(!order) return;
        activeOrderDetailId = orderId;
        const totals = getOrderTotals(order);
        const canCancelOrder = Number(order.rawStatus || 0) === 1;
        document.getElementById('order-detail-title').innerText = `Đơn ${order.id}`;
        document.getElementById('order-detail-body').innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Trạng thái</p>
                        <p class="text-sm font-bold text-orange-500">${order.status}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Tổng thanh toán</p>
                        <p class="text-xl font-extrabold text-babyPink">${formatMoney(totals.finalAmount)}</p>
                    </div>
                </div>
                ${canCancelOrder ? `
                    <button class="mt-4 w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold hover:bg-red-100 transition" onclick="cancelPendingOrder('${order.id}')">
                        Hủy đơn hàng này
                    </button>
                ` : ''}
            </div>
            <div class="space-y-3">
                ${(order.items || []).map(item => `
                    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3">
                        <img src="${getOptimizedImageUrl(item.img, 'w400')}" loading="lazy" decoding="async" class="w-20 h-20 object-cover rounded-xl border border-gray-100"/>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-sm text-gray-800 line-clamp-2">${getProductDisplayName(item)}</h4>
                            ${item.variantInfo ? `<p class="text-xs text-gray-500 mt-1">${item.variantInfo}</p>` : ''}
                            <div class="flex justify-between items-center mt-3 text-sm">
                                <span class="text-gray-500">SL: x${item.quantity}</span>
                                <span class="font-bold text-babyPink">${item.unit ? `${item.price} / ${item.unit}` : item.price}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        openModalShell('order-detail-overlay');
    };

    window.cancelPendingOrder = (orderId) => {
        if(!currentUser || !Array.isArray(currentUser.orders)) return;
        const order = currentUser.orders.find((entry) => String((entry && entry.id) || '') === String(orderId || ''));
        if(!order || Number(order.rawStatus || 0) !== 1) {
            showToast('Chỉ có thể hủy đơn ở trạng thái chờ xác nhận.', 'warning');
            return;
        }
        if(!window.retailFirebase || typeof window.retailFirebase.cancelOrder !== 'function') {
            showToast('Tính năng hủy đơn chưa sẵn sàng.', 'warning');
            return;
        }

        openConfirmModal('Bạn có chắc muốn hủy đơn hàng này?', async () => {
            try {
                const updated = await window.retailFirebase.cancelOrder(orderId);
                if(updated) {
                    currentUser = normalizeUserData({
                        ...currentUser,
                        orders: mergeOrdersById(currentUser.orders || [], [updated])
                    });
                    saveState();
                }
                renderOrdersUI();
                if(typeof window.renderAccountTab === 'function') window.renderAccountTab();
                closeOrderDetail();
                showToast('Đã hủy đơn hàng.', 'success');
            } catch(error) {
                console.warn('Khong huy duoc don hang:', error);
                showToast('Không thể hủy đơn hàng này. Vui lòng thử lại.', 'error');
            }
        });
    };

    window.renderOrdersUI = () => {
        const container = document.getElementById('orders-content');
        if(!container) return;
        if(!currentUser || !currentUser.orders || currentUser.orders.length === 0) {
            container.innerHTML = `<div class='flex flex-col items-center justify-center py-20 text-gray-400'><i class='fa-solid fa-box-open text-5xl mb-3 opacity-50'></i><p>Bạn chưa có đơn hàng nào.</p><button onclick='closeOrders(); goToTab("tab-home");' class='mt-4 border border-babyPink text-babyPink px-4 py-1.5 rounded-full text-sm font-bold'>Mua sắm ngay</button></div>`;
            return;
        }

        container.innerHTML = [...currentUser.orders].reverse().map(order => {
            const totals = getOrderTotals(order);
            return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
                <div class="flex justify-between items-center border-b pb-3 mb-3">
                    <span class="text-xs font-bold text-gray-500">Mã: ${order.id}</span>
                    <span class="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded">${order.status}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-600 font-semibold">${Number(order.itemsCount || (order.items || []).length || 0)} sản phẩm</span>
                    <div class="text-right">
                        <span class="text-xs text-gray-400">Thành tiền: </span>
                        <span class="text-lg font-bold text-babyPink">${formatMoney(totals.finalAmount)}</span>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <button class="w-full bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-pink-50 hover:text-babyPink transition" onclick="openOrderDetail('${order.id}')">Xem chi tiết</button>
                    ${Number(order.rawStatus || 0) === 1
                        ? `<button class="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold hover:bg-red-100 transition" onclick="cancelPendingOrder('${order.id}')">Hủy đơn</button>`
                        : ``}
                </div>
            </div>`;
        }).join('');
    };

    const syncFilterDrawerUI = () => {
        const minEl = document.getElementById('filter-min-price');
        const maxEl = document.getElementById('filter-max-price');
        if(minEl) minEl.value = productFilters.minPrice;
        if(maxEl) maxEl.value = productFilters.maxPrice;
        document.querySelectorAll('.filter-flag-btn').forEach(btn => {
            const flag = btn.getAttribute('data-flag');
            const active = !!productFilters[flag];
            btn.classList.toggle('border-babyPink', active);
            btn.classList.toggle('text-babyPink', active);
            btn.classList.toggle('bg-pink-50', active);
        });
        document.querySelectorAll('.filter-sort-btn').forEach(btn => {
            const active = btn.getAttribute('data-sort') === productFilters.sort;
            btn.classList.toggle('border-babyPink', active);
            btn.classList.toggle('text-babyPink', active);
            btn.classList.toggle('bg-pink-50', active);
        });
    };
    window.openFilter = () => {
        syncFilterDrawerUI();
        openModalShell('filter-overlay');
    };
    window.closeFilter = () => { closeModalShell('filter-overlay'); };
    
    window.toggleFilterFlag = (btn, flag) => {
        productFilters[flag] = !productFilters[flag];
        btn.classList.toggle('border-babyPink', productFilters[flag]);
        btn.classList.toggle('text-babyPink', productFilters[flag]);
        btn.classList.toggle('bg-pink-50', productFilters[flag]);
    };
    window.selectSortOption = (btn, sortValue) => {
        productFilters.sort = sortValue;
        document.querySelectorAll('.filter-sort-btn').forEach(b => {
            b.classList.remove('border-babyPink', 'text-babyPink', 'bg-pink-50');
        });
        btn.classList.add('border-babyPink', 'text-babyPink', 'bg-pink-50');
    };
    window.resetFilter = () => {
        resetProductsFilters();
        closeFilter();
    };
    window.applyFilter = () => {
        productFilters.minPrice = document.getElementById('filter-min-price').value.trim();
        productFilters.maxPrice = document.getElementById('filter-max-price').value.trim();
        renderProductsTabContent();
        const filtered = getFilteredProducts(shopProducts);
        renderHomeProductLists(filtered);
        closeFilter();
    };

    window.openPopup = (id) => {
        const p = shopProducts.find(i=>i.id===id); if(!p) return;
        const minQty = getProductMinQty(p);
        currentViewingProduct = {...p, quantity: minQty, minQty};
        const inStock = isProductInStock(p);
        const badgeHtml = Array.isArray(p.badges) && p.badges.length
            ? `<div class="flex justify-center gap-2 flex-wrap mb-3">${p.badges.map((badge) => `<span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-[0.14em] shadow-sm ${badge === 'NEW' ? 'bg-emerald-500 text-white' : badge === 'HOT' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'}">${badge}</span>`).join('')}</div>`
            : '';
        document.getElementById('popup-body').innerHTML = `
            ${badgeHtml}
            <img src="${getOptimizedImageUrl(p.img, 'w600')}" loading="lazy" decoding="async" class="w-32 h-32 object-cover rounded-full mx-auto mb-4 border-4 border-pink-100"/>
            <h3 class="text-lg font-bold">${getProductDisplayName(p)}</h3>
            <p class="text-babyPink text-xl font-extrabold">${formatProductPriceLabel(p)}</p>
                    ${(p.variants && p.variants.length) || minQty > 1 ? `<p class="text-xs text-gray-500 leading-5 mt-2">${[getProductVariantSummary(p), minQty > 1 ? `Mua tối thiểu ${minQty}${p.unit ? ` ${p.unit}` : ''}` : ''].filter(Boolean).join(' • ')}</p>` : ''}
            <div class="mt-4 flex items-center justify-center gap-3 ${inStock ? '' : 'opacity-50 pointer-events-none'}">
                        <span class="text-sm text-gray-500">Số lượng</span>
                <div class="inline-flex items-center border border-gray-200 rounded-xl px-1">
                    <button class="w-8 h-8 text-gray-600 font-bold text-lg flex justify-center items-center" onclick="popupChangeQty(-1)">-</button>
                    <input class="w-16 min-w-[4rem] text-center text-sm font-bold border-none focus:outline-none bg-transparent" id="popup-qty-input" inputmode="numeric" min="${minQty}" oninput="sanitizeQtyInput('popup-qty-input', ${minQty})" step="1" type="number" value="${minQty}"/>
                    <button class="w-8 h-8 text-gray-600 font-bold text-lg flex justify-center items-center" onclick="popupChangeQty(1)">+</button>
                </div>
            </div>
        `;
        const popupAddBtn = document.getElementById('popup-add-btn');
        if(popupAddBtn) {
            popupAddBtn.disabled = !inStock;
            popupAddBtn.className = inStock
                ? 'flex-1 bg-babyPink text-white py-2.5 rounded-xl font-bold shadow-md hover:bg-pink-500 transition'
                : 'flex-1 bg-gray-200 text-gray-400 py-2.5 rounded-xl font-bold cursor-not-allowed opacity-60';
        popupAddBtn.innerText = inStock ? 'Thêm giỏ hàng' : 'Hết hàng';
        }
        document.getElementById('popup-overlay').classList.remove('opacity-0', 'pointer-events-none');
        document.getElementById('popup-content').classList.remove('scale-95'); document.getElementById('popup-content').classList.add('scale-100');
    };
    window.popupChangeQty = (delta) => {
        if(!isProductInStock(currentViewingProduct)) return;
        const input = document.getElementById('popup-qty-input');
        if(!input) return;
        const minQty = getProductMinQty(currentViewingProduct);
        const currentValue = window.sanitizeQtyInput('popup-qty-input', minQty);
        input.value = Math.max(minQty, currentValue + Number(delta || 0));
    };
    window.closePopup = () => {
        document.getElementById('popup-overlay').classList.add('opacity-0', 'pointer-events-none');
        document.getElementById('popup-content').classList.remove('scale-100'); document.getElementById('popup-content').classList.add('scale-95');
    };

    window.openProductDetail = (id) => {
        const p = shopProducts.find(i=>i.id===id); if(!p) return;
        currentViewingProduct = p;
        selectedVariants = {};
        const minQty = getProductMinQty(p);
        const detailQtyInput = document.getElementById('pd-qty-input');
        if(detailQtyInput) {
            detailQtyInput.min = String(minQty);
            detailQtyInput.value = String(minQty);
        }
        
        const imgArr = p.images || [p.img];
        document.getElementById('pd-img-slider').innerHTML = imgArr.map((src, index) => `<img id="pd-img-${index}" src="${getOptimizedImageUrl(src, 'w1200')}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" class="w-full h-full object-contain shrink-0 snap-start" />`).join('');
        const thumbStrip = document.getElementById('pd-thumb-strip');
        if(thumbStrip) {
            thumbStrip.classList.toggle('hidden', imgArr.length <= 1);
            thumbStrip.classList.toggle('flex', imgArr.length > 1);
            thumbStrip.innerHTML = imgArr.map((src, index) => `
                <button class="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 ${index === 0 ? 'ring-2 ring-babyPink border-babyPink' : ''}" onclick="scrollProductDetailImage(${index})">
                    <img src="${getOptimizedImageUrl(src, 'w300')}" loading="lazy" decoding="async" class="w-full h-full object-contain bg-white"/>
                </button>
            `).join('');
        }
        const sliderEl = document.getElementById('pd-img-slider');
        if(sliderEl) {
            sliderEl.onscroll = () => {
                const nextIndex = Math.round((sliderEl.scrollLeft || 0) / Math.max(sliderEl.clientWidth || 1, 1));
                document.querySelectorAll('#pd-thumb-strip button').forEach((thumb, thumbIndex) => {
                    thumb.classList.toggle('ring-2', thumbIndex === nextIndex);
                    thumb.classList.toggle('ring-babyPink', thumbIndex === nextIndex);
                    thumb.classList.toggle('border-babyPink', thumbIndex === nextIndex);
                });
            };
        }

        document.getElementById('pd-price').innerText = formatProductPriceLabel(p);
        document.getElementById('pd-name').innerText = getProductDisplayName(p);
        document.getElementById('pd-sold').innerText = '';
        document.getElementById('pd-desc').innerText = p.desc;
        const variantSummaryEl = document.getElementById('pd-variant-summary');
        if(variantSummaryEl) {
            const variantSummary = getProductVariantSummary(p);
        const summaryText = [variantSummary, minQty > 1 ? `Mua tối thiểu ${minQty}${p.unit ? ` ${p.unit}` : ''}` : ''].filter(Boolean).join(' • ');
            variantSummaryEl.classList.toggle('hidden', !summaryText);
            variantSummaryEl.innerText = summaryText || '';
        }
        const inStock = isProductInStock(p);
        const pdAddBtn = document.getElementById('pd-add-btn');
        const pdQtyWrap = document.getElementById('pd-qty-wrap');
        if(pdAddBtn) {
            pdAddBtn.disabled = !inStock;
            pdAddBtn.className = inStock
                ? 'flex-1 bg-pink-50 text-babyPink border border-pink-200 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-pink-100 transition'
                : 'flex-1 bg-gray-100 text-gray-400 border border-gray-200 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 opacity-60 cursor-not-allowed';
        pdAddBtn.innerHTML = inStock ? `<i class="fa-solid fa-cart-plus"></i> Thêm giỏ` : `<i class="fa-solid fa-ban"></i> Hết hàng`;
        }
        if(pdQtyWrap) {
            pdQtyWrap.classList.toggle('opacity-50', !inStock);
            pdQtyWrap.classList.toggle('pointer-events-none', !inStock);
        }
        
        updatePDWishlistBtn(p.id);

        const varContainer = document.getElementById('pd-variants-container');
        const varList = document.getElementById('pd-variants-list');
        if(p.variants && p.variants.length > 0) {
            varContainer.classList.remove('hidden');
            varList.innerHTML = p.variants.map((variant, vIdx) => `
                <div>
                    <p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">${variant.name}</p>
                    <div class="flex flex-wrap gap-2">
                        ${variant.options.map((opt, oIdx) => `
                            <button onclick="selectVariant('${variant.name}', '${opt}')" id="var-${vIdx}-${oIdx}" class="variant-btn-${variant.name.replace(/\s/g,'')} px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:border-babyPink transition">${opt}</button>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            p.variants.forEach((v) => selectVariant(v.name, v.options[0]));
        } else {
            varContainer.classList.add('hidden');
        }

        openModalShell('product-detail-page');
    };

    window.closeProductDetail = () => { closeModalShell('product-detail-page'); };

    window.pdChangeQty = (delta) => {
        if(!isProductInStock(currentViewingProduct)) return;
        const input = document.getElementById('pd-qty-input');
        if(!input) return;
        const minQty = getProductMinQty(currentViewingProduct);
        const currentValue = window.sanitizeQtyInput('pd-qty-input', minQty);
        input.value = Math.max(minQty, currentValue + Number(delta || 0));
    };
    window.scrollProductDetailImage = (index) => {
        const slider = document.getElementById('pd-img-slider');
        const thumbs = document.querySelectorAll('#pd-thumb-strip button');
        if(!slider) return;
        slider.scrollTo({ left: slider.clientWidth * index, behavior: 'smooth' });
        thumbs.forEach((thumb, thumbIndex) => {
            thumb.classList.toggle('ring-2', thumbIndex === index);
            thumb.classList.toggle('ring-babyPink', thumbIndex === index);
            thumb.classList.toggle('border-babyPink', thumbIndex === index);
        });
    };

    window.selectVariant = (varName, optionValue) => {
        selectedVariants[varName] = optionValue;
        const safeClass = `variant-btn-${varName.replace(/\s/g,'')}`;
        document.querySelectorAll(`.${safeClass}`).forEach(btn => {
            if(btn.innerText === optionValue) {
                btn.classList.add('border-babyPink', 'text-babyPink', 'bg-pink-50');
                btn.classList.remove('border-gray-300', 'text-gray-600');
            } else {
                btn.classList.remove('border-babyPink', 'text-babyPink', 'bg-pink-50');
                btn.classList.add('border-gray-300', 'text-gray-600');
            }
        });
    };

    window.processAddToCartFromDetail = () => {
        if(!currentViewingProduct) return;
        if(!isProductInStock(currentViewingProduct)) return showToast("Sản phẩm hiện đã hết hàng.", 'warning');
        if(currentViewingProduct.variants && currentViewingProduct.variants.length > 0) {
            const requiredCount = currentViewingProduct.variants.length;
            if(Object.keys(selectedVariants).length < requiredCount) {
                return showToast("Vui lòng chọn đầy đủ phân loại sản phẩm!", 'warning');
            }
        }
        
        const qty = Math.max(getProductMinQty(currentViewingProduct), window.sanitizeQtyInput('pd-qty-input', getProductMinQty(currentViewingProduct)));
        let varsText = Object.entries(selectedVariants).map(([k,v]) => `${k}: ${v}`).join(' | ');
        
        if(typeof window.addToCartLogic === 'function') window.addToCartLogic(currentViewingProduct, qty, varsText);
        showToast("Thêm giỏ hàng thành công!", 'success');
        closeProductDetail();
    };

    const addToCartLogic = (product, qty, variantStr) => {
        const cartItemId = variantStr ? `${product.id}_${variantStr}` : product.id;
        const existing = cartData.find(item => item.cartId === cartItemId);
        if(existing) {
            existing.quantity += qty;
        } else {
            cartData.push({
                cartId: cartItemId,
                id: product.id,
                name: product.name,
                code: getProductCode(product),
                group: getProductGroupName(product),
                price: product.price,
                img: product.img,
                quantity: qty,
                variantInfo: variantStr
            });
        }
        saveState();
        updateBadgeNumbers();
        renderCartUI();
    };

    // GIỎ HÀNG THƯỜNG DÙNG TRÊN POPUP HOẶC KHÔNG PHÂN LOẠI
    window.processAddToCart = () => {
        if(!currentViewingProduct) return;
        if(!isProductInStock(currentViewingProduct)) return showToast('Sản phẩm hiện đã hết hàng.', 'warning');
        const qtyInput = document.getElementById('popup-qty-input');
        const qty = Math.max(1, parseInt(qtyInput?.value || currentViewingProduct.quantity || 1, 10) || 1);
        if(typeof window.addToCartLogic === 'function') window.addToCartLogic(currentViewingProduct, qty, '');
        showToast('Đã thêm sản phẩm vào giỏ hàng.', 'success');
        closePopup();
    };

    window.updateBadgeNumbers = () => {
        const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
        const badges = ['cart-count-badge', 'pd-cart-badge', 'acc-cart-badge', 'pc-cart-badge'];
        badges.forEach(id => {
            const b = document.getElementById(id);
            if(b) b.innerText = totalItems;
        });
    };

    window.openCart = () => {
        openModalShell('cart-overlay');
        renderCartUI();
    };
    window.closeCart = () => { closeModalShell('cart-overlay'); };
    
    window.updateCartQty = (cartId, delta) => {
        const item = cartData.find(i => i.cartId === cartId); if(!item) return;
        item.quantity += delta; if(item.quantity <= 0) cartData = cartData.filter(i => i.cartId !== cartId);
        saveState(); renderCartUI();
    };

    window.renderCartUI = () => {
        const container = document.getElementById('cart-items-container');
        if(cartData.length === 0) {
            container.innerHTML = `<div class='flex flex-col items-center justify-center h-full text-gray-400 gap-2 mt-20'><i class='fa-solid fa-basket-shopping text-5xl opacity-30'></i><p>Giỏ hàng đang trống</p><button onclick='closeCart()' class='mt-4 border border-babyPink text-babyPink px-4 py-1.5 rounded-full text-sm font-bold'>Mua sắm ngay</button></div>`;
            document.getElementById('cart-subtotal').classList.add('hidden');
            document.getElementById('discount-alert').classList.add('hidden');
            document.getElementById('cart-total-price').innerText = '0đ';
            return;
        }

        let totalAmount = 0;
        container.innerHTML = cartData.map(item => {
            const numPrice = parseMoney(item.price);
            totalAmount += numPrice * item.quantity;
            const varHtml = item.variantInfo ? `<p class="text-[10px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5 inline-block mt-1">${item.variantInfo}</p>` : '';
            return `
            <div class="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 relative">
                <button onclick="updateCartQty('${item.cartId}', -999)" class="absolute top-2 right-2 text-gray-300 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button>
                <img src="${getOptimizedImageUrl(item.img, 'w400')}" loading="lazy" decoding="async" class="w-20 h-20 object-cover rounded-lg" />
                <div class="flex flex-col flex-1 py-1 pr-4">
                    <h4 class="font-bold text-sm line-clamp-2 leading-tight">${getProductDisplayName(item)}</h4>
                    ${varHtml}
                    <div class="flex justify-between items-center mt-auto pt-2">
                        <span class="font-bold text-babyPink">${item.unit ? `${item.price} / ${item.unit}` : item.price}</span>
                        <div class="flex items-center gap-2 border rounded-lg p-0.5">
                            <button class="w-6 h-6 bg-gray-50 flex items-center justify-center hover:bg-gray-200 transition" onclick="updateCartQty('${item.cartId}', -1)"><i class="fa-solid fa-minus text-[10px]"></i></button>
                            <span class="text-xs font-bold w-4 text-center">${item.quantity}</span>
                            <button class="w-6 h-6 bg-gray-50 flex items-center justify-center hover:bg-gray-200 transition" onclick="updateCartQty('${item.cartId}', 1)"><i class="fa-solid fa-plus text-[10px]"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');

        let discountPercent = 0;
        if(totalAmount >= 10000000) discountPercent = 20;
        else if(totalAmount >= 5000000) discountPercent = 15;
        else if(totalAmount >= 2000000) discountPercent = 10;
        else if(totalAmount >= 1000000) discountPercent = 7;
        else if(totalAmount >= 500000) discountPercent = 5;

        const discountValue = (totalAmount * discountPercent) / 100;
        const finalAmount = totalAmount - discountValue;

        const alertEl = document.getElementById('discount-alert');
        const subtotalEl = document.getElementById('cart-subtotal');
        
        if(discountPercent > 0) {
            alertEl.classList.remove('hidden');
            alertEl.innerHTML = `<i class="fa-solid fa-tags"></i> Tuyệt vời! Bạn được giảm ${discountPercent}% hóa đơn (-${formatMoney(discountValue)})`;
            subtotalEl.classList.remove('hidden');
            subtotalEl.innerText = formatMoney(totalAmount);
        } else {
            alertEl.classList.add('hidden');
            subtotalEl.classList.add('hidden');
        }
        document.getElementById('cart-total-price').innerText = formatMoney(finalAmount);
    };


    window.setupSwipeGestures = () => {
        const swipeables = document.querySelectorAll('.swipeable');
        swipeables.forEach(el => {
            let startX = 0;
            el.addEventListener('touchstart', e => { startX = e.changedTouches[0].screenX; }, {passive: true});
            el.addEventListener('touchend', e => {
                const endX = e.changedTouches[0].screenX;
                if(Math.abs(endX - startX) > 80) { 
                    if(el.id === 'product-detail-page') closeProductDetail();
                    else if(el.id === 'account-settings-page') closeSettings();
                    else if(el.id === 'cart-drawer') closeCart();
                    else if(el.id === 'filter-drawer') closeFilter();
                    else if(el.id === 'auth-page') closeAuth();
                    else if(el.id === 'orders-page') closeOrders();
                    else if(el.id === 'wishlist-page') closeWishlist();
                }
            }, {passive: true});
        });
    };

    if(document.readyState !== 'loading') {
        if(typeof window.setupSwipeGestures === 'function') window.setupSwipeGestures();
        if(typeof window.initFullscreenSwipe === 'function') window.initFullscreenSwipe();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if(typeof window.setupSwipeGestures === 'function') window.setupSwipeGestures();
            if(typeof window.initFullscreenSwipe === 'function') window.initFullscreenSwipe();
        }, { once: true });
    }


