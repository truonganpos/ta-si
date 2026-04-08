    const saveState = () => {
        localStorage.setItem('ta_cart', JSON.stringify(cartData));
        localStorage.setItem('ta_wishlist', JSON.stringify(wishlistData));
        if(currentUser) localStorage.setItem('ta_user', JSON.stringify(currentUser));
        else localStorage.removeItem('ta_user');
        if(typeof window.updateBadgeNumbers === 'function') window.updateBadgeNumbers();
    };

    const buildProductRenderSignature = (containerId, products, wishedIds) => {
        const safeProducts = Array.isArray(products) ? products : [];
        const wishedSignature = Array.from(wishedIds || []).sort().join('|');
        const productSignatureHash = safeProducts.reduce((hashValue, prod, index) => {
            const safeProd = prod || {};
            const signatureSource = [
                safeProd.id || '',
                safeProd.updatedTs || '',
                safeProd.code || '',
                safeProd.priceValue || safeProd.price || '',
                safeProd.originalPriceValue || safeProd.originalPrice || '',
                safeProd.salePercent || safeProd.discountPercent || '',
                safeProd.sold || '',
                safeProd.pendingStock || '',
                safeProd.availableStock || '',
                safeProd.availableStock || safeProd.stock || '',
                safeProd.inStock === false ? 0 : 1,
                index
            ].join('~');
            let nextHash = hashValue >>> 0;
            for(let charIndex = 0; charIndex < signatureSource.length; charIndex += 1) {
                nextHash = ((nextHash * 33) ^ signatureSource.charCodeAt(charIndex)) >>> 0;
            }
            return nextHash >>> 0;
        }, 5381);
        return [
            containerId,
            safeProducts.length,
            productFeedState.loading ? 1 : 0,
            productFeedState.initialSynced ? 1 : 0,
            productFeedState.error || '',
            wishedSignature,
            productSignatureHash
        ].join('##');
    };

    const getProductCardName = (product) => {
        const code = getProductCode(product);
        const rawName = String((product && product.name) || '').trim();
        if(rawName && code) {
            const normalizedName = normalizeKeyword(rawName);
            const normalizedCode = normalizeKeyword(code);
            if(normalizedName.startsWith(normalizedCode)) {
                const strippedName = rawName.slice(code.length).replace(/^[\s\-:|/]+/, '').trim();
                if(strippedName) return strippedName;
            }
        }
        return rawName || getProductDisplayName(product);
    };

    const buildProductLoadingState = (emptyClass) => `
        <div class="${emptyClass}">
            <div class="catalog-loading-state" role="status" aria-live="polite" aria-busy="true">
                <span class="catalog-loading-state__spinner" aria-hidden="true">
                    <i class="fa-solid fa-spinner"></i>
                </span>
                <div class="catalog-loading-state__copy">
                    <p class="catalog-loading-state__title">Đang tải sản phẩm</p>
                    <p class="catalog-loading-state__desc">Danh sách sẽ hiển thị ngay khi dữ liệu đồng bộ xong.</p>
                </div>
            </div>
        </div>
    `;

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
        const requestedBundlePromises = {};
        const getInitialTabTargetId = () => {
            let rawTarget = '';
            try {
                const rawHash = String(window.location.hash || '').replace(/^#/, '').trim();
                const firstHashSegment = rawHash ? rawHash.split('/').filter(Boolean)[0] : '';
                rawTarget = firstHashSegment || '';
                if(!rawTarget) {
                    const url = new URL(window.location.href);
                    rawTarget = String(url.searchParams.get('tab') || '').trim();
                }
            } catch(error) {}
            const normalized = String(rawTarget || '').trim().toLowerCase().replace(/^#/, '').replace(/^tab-/, '');
            if(normalized === 'products') return 'tab-products';
            if(normalized === 'sale') return 'tab-sale';
            if(normalized === 'account') return 'tab-account';
            if(normalized === 'intro') return 'tab-intro';
            return 'tab-home';
        };
        const ensureBundleLoaded = (bundleName) => {
            const safeBundleName = String(bundleName || '').trim();
            if(!safeBundleName || !window.webNewLoader || typeof window.webNewLoader.ensureBundle !== 'function') {
                return Promise.resolve(false);
            }
            if(!requestedBundlePromises[safeBundleName]) {
                requestedBundlePromises[safeBundleName] = window.webNewLoader.ensureBundle(safeBundleName).catch((error) => {
                    console.warn('Khong tai duoc bundle:', safeBundleName, error);
                    delete requestedBundlePromises[safeBundleName];
                    return false;
                });
            }
            return requestedBundlePromises[safeBundleName];
        };
        const initializeDeferredTabModule = (config = {}, force = false) => {
            const moduleName = String(config.moduleName || '').trim();
            const readyEvent = String(config.readyEvent || '').trim();
            const stateKey = String(config.stateKey || '').trim();
            const tabId = String(config.tabId || '').trim();
            const bundleName = String(config.bundleName || '').trim();
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

            let readyHandled = false;
            const onTabReady = () => {
                readyHandled = true;
                renderModule();
            };
            window.addEventListener(readyEvent, onTabReady, { once: true });
            if(bundleName) {
                ensureBundleLoaded(bundleName).then(() => {
                    if(!readyHandled) renderModule();
                });
            }
            scheduleIdleTask(() => {
                if(renderModule()) return;
                if(bundleName) ensureBundleLoaded(bundleName).then(() => renderModule());
            }, force ? 60 : 220);
        };
        const initializeHomeTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'homeTabModule',
            readyEvent: 'web-new-home-tab-ready',
            stateKey: 'home',
            tabId: 'tab-home',
            bundleName: 'home'
        }, force);
        const initializeProductsTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'productsTabModule',
            readyEvent: 'web-new-products-tab-ready',
            stateKey: 'products',
            tabId: 'tab-products',
            bundleName: 'products'
        }, force);
        const initializeSaleTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'saleTabModule',
            readyEvent: 'web-new-sale-tab-ready',
            stateKey: 'sale',
            tabId: 'tab-sale',
            bundleName: 'sale',
            loadingMarkup: `<div class="bg-white rounded-[28px] border border-gray-100 p-5 shadow-sm text-sm text-gray-500">Đang tải trạm săn deal...</div>`
        }, force);
        const initializeIntroTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'introTabModule',
            readyEvent: 'web-new-intro-tab-ready',
            stateKey: 'intro',
            tabId: 'tab-intro',
            bundleName: 'intro'
        }, force);
        const initializeAccountTab = (force = false) => initializeDeferredTabModule({
            moduleName: 'accountTabModule',
            readyEvent: 'web-new-account-tab-ready',
            stateKey: 'account',
            tabId: 'tab-account',
            bundleName: 'account',
            loadingMarkup: `<div class="flex flex-col items-center justify-center py-20 text-center px-4 text-gray-500"><div class="w-16 h-16 rounded-full border-4 border-pink-100 border-t-babyPink animate-spin mb-4"></div><h2 class="font-bold text-lg text-gray-800 mb-2">Đang tải tài khoản</h2><p class="text-sm">Thông tin tài khoản đang được khởi tạo.</p></div>`
        }, force);
        const ensureTabInitialized = (tabId, force = false) => {
            if(tabId === 'tab-home') initializeHomeTab(force);
            if(tabId === 'tab-products') initializeProductsTab(force);
            if(tabId === 'tab-sale') initializeSaleTab(force);
            if(tabId === 'tab-intro') initializeIntroTab(force);
            if(tabId === 'tab-account') initializeAccountTab();
        };

        let remoteAccountRefreshTimer = null;
        const scheduleRemoteAccountRefresh = (options = {}) => {
            clearTimeout(remoteAccountRefreshTimer);
            remoteAccountRefreshTimer = setTimeout(async () => {
                if(!currentUser || !currentUser.authUid) return;
                try {
                    if(options.customers !== false) {
                        await syncCustomerSessionFromFirebase({ clearIfSignedOut: true, skipCatalogRefresh: true });
                    }
                    if(options.orders !== false) {
                        await syncOrdersFromFirebase({ force: true });
                    }
                } catch(error) {
                    console.warn('Khong dong bo duoc tai khoan tu metadata:', error);
                } finally {
                    if(tabRenderState.account && typeof window.renderAccountTab === 'function') window.renderAccountTab();
                    if(typeof window.renderOrdersUI === 'function') window.renderOrdersUI();
                }
            }, Math.max(Number(options.delay || 220) || 220, 80));
        };

        ensureTabInitialized(getInitialTabTargetId(), true);
        if(typeof window.updateBadgeNumbers === 'function') window.updateBadgeNumbers();
        updateFloatingFilterButton();
        scheduleIdleTask(() => {
            if(typeof window.setupSwipeGestures === 'function') window.setupSwipeGestures();
            if(typeof window.initFullscreenSwipe === 'function') window.initFullscreenSwipe();
        }, 80);
        setupCatalogLazyObserver();
        const syncCurrentViewingProductFromCatalog = (products, changedProductId) => {
            const activeProductId = String((currentViewingProduct && currentViewingProduct.id) || changedProductId || '').trim();
            if(!activeProductId) return;
            const catalogProducts = Array.isArray(products) ? products : [];
            const nextProduct = catalogProducts.find((product) => String((product && product.id) || '').trim() === activeProductId);
            if(!nextProduct) {
                if(currentViewingProduct && String(currentViewingProduct.id || '').trim() === activeProductId) currentViewingProduct = null;
                return;
            }
            currentViewingProduct = {
                ...nextProduct,
                ...(currentViewingProduct && String(currentViewingProduct.id || '').trim() === activeProductId
                    ? {
                        quantity: currentViewingProduct.quantity || getProductMinQty(nextProduct),
                        minQty: currentViewingProduct.minQty || getProductMinQty(nextProduct)
                    }
                    : {})
            };
        };
        scheduleIdleTask(async () => {
            await waitForRetailFirebaseReady();
            if(window.retailFirebase && typeof window.retailFirebase.ensureReady === 'function') {
                window.retailFirebase.ensureReady().catch((error) => {
                    console.warn('Khong prewarm duoc Firebase runtime:', error);
                    return null;
                });
            }
            if(isCatalogLoadBlocked()) {
                applyCatalogBlockedState();
            } else {
                syncCatalogFromPosCache({ refreshViews: true, force: !loadCachedCatalogFromApp() });
            }
            if(window.retailFirebase && typeof window.retailFirebase.subscribeCatalogMeta === 'function') {
                window.retailFirebase.subscribeCatalogMeta((payload) => {
                    if(payload && payload.type === 'catalog-live') {
                        if(!isCatalogLoadBlocked()) {
                            if(Array.isArray(payload.products)) {
                                shopProducts = payload.products;
                                productFeedState.error = '';
                            } else {
                                loadCachedCatalogFromApp();
                            }
                            syncCurrentViewingProductFromCatalog(shopProducts, payload.changedProductId);
                            refreshCatalogViews();
                            const wishlistShell = document.getElementById('wishlist-page');
                            if(wishlistShell && wishlistShell.classList.contains('is-open') && typeof window.renderWishlistUI === 'function') {
                                window.renderWishlistUI();
                            }
                            const accountTab = document.getElementById('tab-account');
                            if(accountTab && accountTab.classList.contains('active') && typeof window.renderAccountTab === 'function') {
                                window.renderAccountTab();
                            }
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
            if(window.retailFirebase && typeof window.retailFirebase.subscribeAccountMeta === 'function') {
                window.retailFirebase.subscribeAccountMeta((payload) => {
                    if(!payload) return;
                    if(payload.type === 'account-signout') {
                        currentUser = null;
                        saveState();
                        if(tabRenderState.account && typeof window.renderAccountTab === 'function') window.renderAccountTab();
                        if(typeof window.renderOrdersUI === 'function') window.renderOrdersUI();
                        return;
                    }
                    if(payload.type === 'customer-live') {
                        if(!payload.profile) return;
                        currentUser = normalizeUserData({
                            ...(currentUser || {}),
                            ...(payload.profile || {}),
                            authUid: payload.authUid || (payload.profile && payload.profile.authUid) || ((currentUser && currentUser.authUid) || ''),
                            orders: Array.isArray(payload.profile && payload.profile.orders)
                                ? payload.profile.orders
                                : ((currentUser && currentUser.orders) || [])
                        });
                        saveState();
                        if(tabRenderState.account && typeof window.renderAccountTab === 'function') window.renderAccountTab();
                        if(typeof window.renderOrdersUI === 'function') window.renderOrdersUI();
                        return;
                    }
                    if(payload.type === 'orders-live') {
                        if(!currentUser || !currentUser.authUid) return;
                        currentUser = normalizeUserData({
                            ...currentUser,
                            orders: Array.isArray(payload.orders) ? payload.orders : (currentUser.orders || [])
                        });
                        saveState();
                        if(tabRenderState.account && typeof window.renderAccountTab === 'function') window.renderAccountTab();
                        if(typeof window.renderOrdersUI === 'function') window.renderOrdersUI();
                        return;
                    }
                    if(!currentUser || !currentUser.authUid) return;
                    const hasLiveBindings = !!(
                        window.retailFirebase
                        && typeof window.retailFirebase.hasLiveAccountBindings === 'function'
                        && window.retailFirebase.hasLiveAccountBindings(currentUser.authUid)
                    );
                    if(payload.type === 'customers-meta') {
                        if(hasLiveBindings) return;
                        scheduleRemoteAccountRefresh({ orders: false, customers: true, delay: 140 });
                        return;
                    }
                    if(payload.type === 'orders-meta') {
                        scheduleRemoteAccountRefresh({ orders: true, customers: false, delay: hasLiveBindings ? 90 : 140 });
                    }
                });
            }
            syncCustomerSessionFromFirebase({ clearIfSignedOut: true });
        }, 24);
        scheduleIdleTask(() => {
            ensureBundleLoaded('intro').then(() => {
                if(window.introExperienceModule && typeof window.introExperienceModule.maybeAutoOpenWelcomePopup === 'function') {
                    window.introExperienceModule.maybeAutoOpenWelcomePopup({ storageKey: 'ta_welcome_popup_seen_v2', delay: 420 });
                    return;
                }
                if(window.uiPc && typeof window.uiPc.maybeAutoOpenWelcomePopup === 'function') {
                    window.uiPc.maybeAutoOpenWelcomePopup({ storageKey: 'ta_welcome_popup_seen_v2', delay: 420 });
                }
            });
        }, 90);
        
        const navItems = document.querySelectorAll(".nav-item");
        navItems.forEach(item => {
            item.addEventListener("click", () => {
                const targetId = item.getAttribute("data-target");
                goToTab(targetId);
            });
        });
        scheduleIdleTask(() => {
            if(!applyTabTargetFromLocation({ syncUrl: false, scroll: false })) {
                syncUrlForTab('tab-home');
            }
        }, 12);

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
        document.addEventListener('visibilitychange', () => {
            if(document.visibilityState !== 'visible') return;
            scheduleRemoteAccountRefresh({ customers: true, orders: true, delay: 120 });
        });
        window.addEventListener('focus', () => {
            scheduleRemoteAccountRefresh({ customers: true, orders: true, delay: 120 });
        });

        window.ensureTabInitialized = ensureTabInitialized;
    };
    if(document.readyState === 'loading') {
        document.addEventListener("DOMContentLoaded", initializeAppCore, { once: true });
    } else {
        initializeAppCore();
    }

    let toggleSearchOpen = !!(document.getElementById('search-shell') && document.getElementById('search-shell').classList.contains('is-open'));
    const HEADER_SEARCH_COLLAPSED_WIDTH = 40;
    const HEADER_SEARCH_MIN_OPEN_WIDTH = 104;
    const HEADER_SEARCH_DESKTOP_MIN_OPEN_WIDTH = 156;
    const HEADER_SEARCH_DESKTOP_PIN_WIDTH = 240;
    const TAB_DEEP_LINK_MAP = Object.freeze({
        'tab-home': 'home',
        'tab-products': 'products',
        'tab-sale': 'sale',
        'tab-account': 'account',
        'tab-intro': 'intro'
    });
    let pendingCategoryRouteState = null;
    const TAB_SLUG_TO_ID = Object.freeze(Object.keys(TAB_DEEP_LINK_MAP).reduce((accumulator, tabId) => {
        accumulator[TAB_DEEP_LINK_MAP[tabId]] = tabId;
        return accumulator;
    }, {}));
    const resolveTabTargetId = (rawValue) => {
        const safeValue = String(rawValue || '').trim().toLowerCase().replace(/^#/, '');
        if(!safeValue) return '';
        if(TAB_SLUG_TO_ID[safeValue]) return TAB_SLUG_TO_ID[safeValue];
        if(TAB_DEEP_LINK_MAP[safeValue]) return safeValue;
        if(TAB_SLUG_TO_ID[safeValue.replace(/^tab-/, '')]) return TAB_SLUG_TO_ID[safeValue.replace(/^tab-/, '')];
        return '';
    };
    const getTabSlug = (targetId) => TAB_DEEP_LINK_MAP[String(targetId || '').trim()] || '';
    const normalizeRouteSlug = (value = '') => String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const getCategoryRouteDescriptor = (categoryName = '') => {
        const safeName = String(categoryName || '').trim();
        if(!safeName || isAllCategory(safeName)) return { mode: '', slug: '', name: '' };
        const categories = typeof getProductCategoryOptions === 'function' ? getProductCategoryOptions() : [];
        const safeKey = normalizeKeyword(safeName);
        const rootMatch = categories.find((item) => normalizeKeyword(item && item.name) === safeKey);
        if(rootMatch && !isAllCategory(rootMatch.name)) {
            return { mode: 'group', slug: normalizeRouteSlug(rootMatch.name), name: String(rootMatch.name || '').trim() };
        }
        let childName = '';
        categories.some((group) => {
            return (Array.isArray(group && group.children) ? group.children : []).some((child) => {
                if(normalizeKeyword(child && child.name) !== safeKey) return false;
                childName = String(child.name || '').trim();
                return true;
            });
        });
        if(childName) return { mode: 'tag', slug: normalizeRouteSlug(childName), name: childName };
        return { mode: 'category', slug: normalizeRouteSlug(safeName), name: safeName };
    };
    const resolveCategoryNameFromRoute = (mode, slug) => {
        const safeMode = String(mode || '').trim().toLowerCase();
        const safeSlug = normalizeRouteSlug(decodeURIComponent(String(slug || '').trim()));
        if(!safeSlug) return '';
        const categories = typeof getProductCategoryOptions === 'function' ? getProductCategoryOptions() : [];
        if(safeMode === 'group') {
            const groupMatch = categories.find((item) => !isAllCategory(item && item.name) && normalizeRouteSlug(item && item.name) === safeSlug);
            return String((groupMatch && groupMatch.name) || '').trim();
        }
        if(safeMode === 'tag') {
            let tagMatch = '';
            categories.some((group) => {
                return (Array.isArray(group && group.children) ? group.children : []).some((child) => {
                    if(normalizeRouteSlug(child && child.name) !== safeSlug) return false;
                    tagMatch = String(child.name || '').trim();
                    return true;
                });
            });
            return tagMatch;
        }
        const allNames = [];
        categories.forEach((group) => {
            if(group && group.name && !isAllCategory(group.name)) allNames.push(String(group.name).trim());
            (Array.isArray(group && group.children) ? group.children : []).forEach((child) => {
                if(child && child.name) allNames.push(String(child.name).trim());
            });
        });
        const match = allNames.find((name) => normalizeRouteSlug(name) === safeSlug);
        return String(match || '').trim();
    };
    const parseLocationRouteState = () => {
        const rawHash = String(window.location.hash || '').replace(/^#/, '').trim();
        const segments = rawHash
            ? rawHash.split('/').map((segment) => decodeURIComponent(String(segment || '').trim())).filter(Boolean)
            : [];
        const explicitHashTarget = resolveTabTargetId(segments[0] || '');
        const categoryMode = ['group', 'tag', 'category'].includes(String(segments[1] || '').trim().toLowerCase())
            ? String(segments[1] || '').trim().toLowerCase()
            : '';
        const categorySlug = categoryMode ? segments.slice(2).join('/') : '';
        let queryTarget = '';
        let queryCategoryMode = '';
        let queryCategorySlug = '';
        try {
            const url = new URL(window.location.href);
            queryTarget = resolveTabTargetId(url.searchParams.get('tab'));
            if(url.searchParams.get('group')) {
                queryCategoryMode = 'group';
                queryCategorySlug = url.searchParams.get('group');
            } else if(url.searchParams.get('tag')) {
                queryCategoryMode = 'tag';
                queryCategorySlug = url.searchParams.get('tag');
            } else if(url.searchParams.get('category')) {
                queryCategoryMode = 'category';
                queryCategorySlug = url.searchParams.get('category');
            }
        } catch(error) {}
        const targetId = explicitHashTarget || queryTarget || ((categoryMode || queryCategoryMode) ? 'tab-products' : '');
        return {
            targetId,
            categoryMode: categoryMode || queryCategoryMode,
            categorySlug: categorySlug || queryCategorySlug
        };
    };
    const applyCatalogRouteStateFromLocation = () => {
        const routeState = parseLocationRouteState();
        pendingCategoryRouteState = routeState.categoryMode && routeState.categorySlug
            ? { mode: routeState.categoryMode, slug: routeState.categorySlug }
            : null;
        const resolvedCategory = routeState.categoryMode && routeState.categorySlug
            ? resolveCategoryNameFromRoute(routeState.categoryMode, routeState.categorySlug)
            : '';
        if(resolvedCategory) {
            filterCategory = String(resolvedCategory || '').trim();
            pendingCategoryRouteState = null;
            return filterCategory;
        }
        if(!routeState.categoryMode) filterCategory = '';
        return filterCategory;
    };
    window.applyPendingCategoryRouteIfPossible = (options = {}) => {
        if(!pendingCategoryRouteState || !Array.isArray(shopProducts) || !shopProducts.length) return false;
        const resolvedCategory = resolveCategoryNameFromRoute(pendingCategoryRouteState.mode, pendingCategoryRouteState.slug);
        if(!resolvedCategory) return false;
        filterCategory = String(resolvedCategory || '').trim();
        pendingCategoryRouteState = null;
        if(options.refresh !== false) {
            if(typeof window.renderProductsTabContent === 'function') window.renderProductsTabContent();
            if(typeof window.renderHomeProductLists === 'function') {
                const filteredProducts = getFilteredProducts(shopProducts);
                window.renderHomeProductLists(filteredProducts);
            }
        }
        return true;
    };
    const getTabTargetIdFromLocation = () => {
        return parseLocationRouteState().targetId;
    };
    const syncUrlForTab = (targetId, options = {}) => {
        const slug = getTabSlug(targetId);
        if(!slug || !window.history || typeof window.history.replaceState !== 'function') return;
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('tab');
            url.searchParams.delete('group');
            url.searchParams.delete('tag');
            url.searchParams.delete('category');
            const hashSegments = [slug];
            if(['tab-home', 'tab-products'].includes(String(targetId || '').trim())) {
                const categoryRoute = getCategoryRouteDescriptor(filterCategory);
                if(categoryRoute.mode && categoryRoute.slug) {
                    hashSegments.push(categoryRoute.mode, categoryRoute.slug);
                }
            }
            url.hash = hashSegments.join('/');
            const nextUrl = `${url.pathname}${url.search}${url.hash}`;
            if(options.push === true && typeof window.history.pushState === 'function') {
                window.history.pushState({ tab: slug }, '', nextUrl);
            } else {
                window.history.replaceState({ tab: slug }, '', nextUrl);
            }
        } catch(error) {}
    };
    const applyTabTargetFromLocation = (options = {}) => {
        const targetId = getTabTargetIdFromLocation();
        if(!targetId || typeof window.goToTab !== 'function') return false;
        applyCatalogRouteStateFromLocation();
        window.goToTab(targetId, {
            syncUrl: options.syncUrl !== false,
            scroll: options.scroll === true,
            preserveHash: true
        });
        return true;
    };
    window.syncCurrentRouteState = (options = {}) => {
        const activeTab = document.querySelector('.tab-content.active');
        syncUrlForTab(activeTab ? activeTab.id : 'tab-home', options);
        return window.location.href;
    };
    const isElementVisibleForLayout = (node) => {
        if(!node) return false;
        const style = window.getComputedStyle(node);
        if(style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    };
    const syncHeaderSearchLayout = (options = {}) => {
        const shell = document.getElementById('search-shell');
        const toggleButton = document.getElementById('search-toggle-btn');
        const actions = document.getElementById('app-header-actions');
        const headerInner = document.getElementById('app-header-inner');
        const brand = document.getElementById('app-header-brand');
        const desktopNav = document.getElementById('desktop-header-nav');
        if(!shell || !toggleButton || !actions || !headerInner) return HEADER_SEARCH_COLLAPSED_WIDTH;
        const isDesktopViewport = window.innerWidth >= 768;
        const headerInnerRect = headerInner.getBoundingClientRect();
        let nextWidth = HEADER_SEARCH_COLLAPSED_WIDTH;
        if(isDesktopViewport) {
            const brandRect = brand ? brand.getBoundingClientRect() : { right: headerInnerRect.left };
            const navRect = desktopNav && isElementVisibleForLayout(desktopNav)
                ? desktopNav.getBoundingClientRect()
                : { right: brandRect.right };
            const leftBoundary = Math.max(brandRect.right, navRect.right);
            const visibleChildren = Array.from(actions.children || []).filter(isElementVisibleForLayout);
            const otherWidth = visibleChildren
                .filter((node) => node !== shell)
                .reduce((total, node) => total + node.getBoundingClientRect().width, 0);
            const actionsStyle = window.getComputedStyle(actions);
            const gapSize = parseFloat(actionsStyle.columnGap || actionsStyle.gap || '0') || 0;
            const totalGapWidth = Math.max(0, visibleChildren.length - 1) * gapSize;
            const availableInlineWidth = Math.max(
                HEADER_SEARCH_COLLAPSED_WIDTH,
                Math.floor(headerInnerRect.right - leftBoundary - otherWidth - totalGapWidth - 20)
            );
            nextWidth = Math.min(460, availableInlineWidth);
        } else {
            nextWidth = Math.max(
                HEADER_SEARCH_MIN_OPEN_WIDTH,
                Math.floor(headerInnerRect.width - 8)
            );
        }
        const collapseThreshold = isDesktopViewport
            ? HEADER_SEARCH_DESKTOP_MIN_OPEN_WIDTH
            : HEADER_SEARCH_MIN_OPEN_WIDTH;
        const shouldPinDesktop = isDesktopViewport && nextWidth >= HEADER_SEARCH_DESKTOP_PIN_WIDTH;
        const wasPinnedDesktop = shell.classList.contains('search-shell-desktop-pinned');
        shell.style.setProperty('--search-shell-open-width', `${nextWidth}px`);
        shell.classList.toggle('search-shell-desktop-pinned', shouldPinDesktop);
        shell.classList.toggle('search-shell-collapsed-only', !shouldPinDesktop && nextWidth < collapseThreshold);
        if(shouldPinDesktop) {
            toggleSearchOpen = true;
            shell.classList.add('is-open');
            toggleButton.setAttribute('aria-expanded', 'true');
            if(window.__webNewSearchBootState) window.__webNewSearchBootState.open = true;
        } else if(wasPinnedDesktop && typeof hideSearchBar === 'function') {
            hideSearchBar({ force: true, blur: false });
        } else if(options.closeIfTight && toggleSearchOpen && nextWidth < HEADER_SEARCH_COLLAPSED_WIDTH + 24 && typeof hideSearchBar === 'function') {
            hideSearchBar({ force: true });
        }
        return nextWidth;
    };
    window.syncHeaderSearchLayout = syncHeaderSearchLayout;
    window.goToTab = (targetId, options = {}) => {
        const safeTargetId = String(targetId || '').trim();
        if(!safeTargetId) return;
        const navItems = document.querySelectorAll(".nav-item");
        const tabContents = document.querySelectorAll(".tab-content");

        tabContents.forEach(tab => tab.classList.remove("active"));
        navItems.forEach(nav => nav.classList.remove("active-nav"));
        
        const targetTab = document.getElementById(safeTargetId);
        if(targetTab) targetTab.classList.add("active");
        
        document.querySelectorAll(`.nav-item[data-target="${safeTargetId}"]`).forEach(n => n.classList.add("active-nav"));
        
        if(typeof window.ensureTabInitialized === 'function') {
            if(safeTargetId === 'tab-account') {
                window.ensureTabInitialized(safeTargetId, true);
                scheduleIdleTask(async () => {
                    try {
                        await syncCustomerSessionFromFirebase({ clearIfSignedOut: true });
                        await syncOrdersFromFirebase({ force: true });
                    } catch(error) {
                        console.warn('Khong dong bo duoc tab tai khoan:', error);
                    } finally {
                        if(typeof window.renderAccountTab === 'function') window.renderAccountTab();
                    }
                });
            }
            else if(['tab-products', 'tab-sale', 'tab-intro'].includes(safeTargetId)) window.ensureTabInitialized(safeTargetId);
            else if(safeTargetId === 'tab-home') {
                window.ensureTabInitialized(safeTargetId);
                scheduleIdleTask(() => {
                    if(window.homeTabModule && typeof window.homeTabModule.render === 'function') window.homeTabModule.render();
                }, 60);
            }
        } else {
            if(safeTargetId === 'tab-account' && typeof window.renderAccountTab === 'function') window.renderAccountTab();
            if(safeTargetId === 'tab-products' && typeof window.renderProductsTabContent === 'function') window.renderProductsTabContent();
        }
        if((safeTargetId === 'tab-home' || safeTargetId === 'tab-products') && !productFeedState.initialSynced) {
            scheduleIdleTask(() => syncCatalogFromPosCache({ refreshViews: true }));
        }
        if(options.syncUrl !== false) syncUrlForTab(safeTargetId, options);
        
        hideSearchBar();
        updateFloatingFilterButton();
        if(options.scroll !== false) {
            window.scrollTo({top: 0, behavior: options.scrollBehavior || 'smooth'});
        }
    };
    window.getCurrentTabShareUrl = () => {
        const activeTab = document.querySelector('.tab-content.active');
        const activeId = activeTab ? activeTab.id : 'tab-home';
        syncUrlForTab(activeId, { push: false });
        return window.location.href;
    };
    window.addEventListener('hashchange', () => {
        applyTabTargetFromLocation({ syncUrl: false, scroll: false });
    });
    window.addEventListener('popstate', () => {
        applyTabTargetFromLocation({ syncUrl: false, scroll: false });
    });

    window.openSearch = () => {
        const shell = document.getElementById('search-shell');
        const toggleButton = document.getElementById('search-toggle-btn');
        const searchInput = document.getElementById('search-input');
        syncHeaderSearchLayout();
        toggleSearchOpen = true;
        if(shell) shell.classList.add('is-open');
        if(toggleButton) toggleButton.setAttribute('aria-expanded', 'true');
        if(window.__webNewSearchBootState) window.__webNewSearchBootState.open = true;
        if(searchInput) {
            window.setTimeout(() => {
                try {
                    searchInput.focus({ preventScroll: true });
                } catch(error) {
                    searchInput.focus();
                }
                searchInput.select();
            }, 120);
        }
    };

    window.toggleSearch = (event) => {
        if(event && typeof event.stopPropagation === 'function') event.stopPropagation();
        const shell = document.getElementById('search-shell');
        const searchInput = document.getElementById('search-input');
        if(shell && shell.classList.contains('search-shell-desktop-pinned') && window.innerWidth >= 768) {
            window.openSearch();
            if(searchInput) {
                try {
                    searchInput.focus({ preventScroll: true });
                } catch(error) {
                    searchInput.focus();
                }
                searchInput.select();
            }
            return;
        }
        if(toggleSearchOpen) {
            hideSearchBar();
            return;
        }
        window.openSearch();
    };
    let lastResponsiveProductViewportKey = `${window.innerWidth >= 768 ? 'desktop' : 'mobile'}:${window.innerWidth >= 1024 ? 'wide' : 'compact'}`;
    window.addEventListener('resize', () => {
        syncHeaderSearchLayout({ closeIfTight: true });
        const nextViewportKey = `${window.innerWidth >= 768 ? 'desktop' : 'mobile'}:${window.innerWidth >= 1024 ? 'wide' : 'compact'}`;
        if(nextViewportKey === lastResponsiveProductViewportKey) return;
        lastResponsiveProductViewportKey = nextViewportKey;
        scheduleIdleTask(() => {
            const filteredProducts = getFilteredProducts(shopProducts);
            const homeTab = document.getElementById('tab-home');
            const productsTab = document.getElementById('tab-products');
            if(homeTab && homeTab.classList.contains('active')) {
                if(typeof window.renderHomeCategories === 'function') window.renderHomeCategories();
                if(typeof window.renderHomeDesktopCategoryMenu === 'function') window.renderHomeDesktopCategoryMenu();
                if(typeof window.renderHomeProductLists === 'function') window.renderHomeProductLists(filteredProducts);
            }
            if(productsTab && productsTab.classList.contains('active') && typeof window.renderProductsTabContent === 'function') {
                window.renderProductsTabContent();
            }
        }, 60);
    });
    syncHeaderSearchLayout();

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
            if(kw.length > 0 && typeof window.openSearch === 'function') window.openSearch();
        }
    };

    const productListRenderJobs = Object.create(null);
    const clearProductListRenderJob = (containerId) => {
        const activeJob = productListRenderJobs[containerId];
        if(activeJob && activeJob.frameId) {
            try {
                window.cancelAnimationFrame(activeJob.frameId);
            } catch(error) {}
        }
        delete productListRenderJobs[containerId];
    };
    window.cancelProductListRenderJob = clearProductListRenderJob;
    const getProductListBatchConfig = (containerId) => {
        const isProductsGrid = containerId === 'products-tab-grid';
        const isDesktopViewport = window.innerWidth >= 768;
        if(isProductsGrid) {
            return isDesktopViewport
                ? { initial: 24, chunk: 28 }
                : { initial: 10, chunk: 12 };
        }
        return isDesktopViewport
            ? { initial: 18, chunk: 20 }
            : { initial: 8, chunk: 10 };
    };
    const buildProductCardHtml = (prod, containerId, wishedIds, imageClass) => {
        const isWished = wishedIds.has(String((prod && prod.id) || '').trim());
        const isInStock = isProductInStock(prod);
        const badgeHtml = renderProductBadges(prod);
        const productCode = getProductCode(prod);
        const displayName = getProductDisplayName(prod);
        const productCardName = getProductCardName(prod);
        const pricingMeta = getProductPricingMeta(prod);
        const imageHtml = typeof window.renderResponsiveImageHtml === 'function'
            ? window.renderResponsiveImageHtml(
                prod.img,
                containerId === 'products-tab-grid' ? 'w800' : 'w600',
                `${imageClass} media-stable`,
                {
                    alt: displayName,
                    loading: 'lazy',
                    decoding: 'async',
                    pictureClass: 'block media-stable'
                }
            )
            : `<img src="${getOptimizedImageUrl(prod.img, containerId === 'products-tab-grid' ? 'w800' : 'w600')}" loading="lazy" decoding="async" class="${imageClass} media-stable" />`;
        const cartBtnClass = isInStock
            ? 'bg-babyPink text-white w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-pink-500 transition'
            : 'bg-gray-200 text-gray-400 w-8 h-8 rounded-full shadow-sm flex items-center justify-center opacity-60 cursor-not-allowed';
        return `
            <div class="catalog-product-card bg-white rounded-2xl shadow-sm border border-gray-100 relative group transition hover:shadow-md flex flex-col h-full overflow-hidden">
                <button id="wish-icon-${prod.id}" onclick="toggleWishlist(event, '${prod.id}')" class="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition ${isWished ? 'text-red-500' : 'text-gray-300'} hover:text-red-500"><i class="fa-solid fa-heart"></i></button>
                <div onclick="openFullscreenViewer('${prod.id}', '${containerId}')" class="cursor-pointer">
                    <div class="catalog-image-shell relative overflow-hidden bg-gray-100 shadow-[inset_0_2px_5px_rgba(0,0,0,0.05)]">
                        ${badgeHtml}
                        ${imageHtml}
                    </div>
                    <div class="p-3">
                        ${productCode ? `<div class="catalog-product-card__code-row mb-2"><span class="catalog-product-card__code-label">Mã SP</span><span class="catalog-product-card__code-value">${escapeHtml(productCode)}</span></div>` : ''}
                        <h4 class="catalog-product-card__name text-sm font-bold text-gray-700 line-clamp-2 leading-tight mb-2 hover:text-babyPink transition">${escapeHtml(productCardName || displayName)}</h4>
                    </div>
                </div>
                <div class="flex justify-between items-end mt-auto px-3 pb-3">
                    <div class="min-w-0 pr-2">
                        <span class="text-babyPink font-extrabold text-sm block">${pricingMeta.currentText || formatProductPriceLabel(prod)}</span>
                        ${pricingMeta.hasSale ? `<span class="text-[11px] text-gray-400 line-through block mt-0.5">${pricingMeta.originalText}</span>` : ''}
                    </div>
                    <div class="flex items-center gap-1.5 md:gap-2">
                        <button onclick="openProductDetail('${prod.id}')" class="bg-pink-50 text-babyPink w-8 h-8 md:w-auto md:px-3 rounded-full md:rounded-lg flex items-center justify-center font-bold text-xs shadow-sm hover:bg-pink-100 transition"><i class="fa-solid fa-eye md:hidden"></i><span class="hidden md:inline">Chi tiết</span></button>
                        <button onclick="${isInStock ? `openPopup('${prod.id}')` : `showToast('Sản phẩm hiện đã hết hàng.', 'warning')`}" class="${cartBtnClass}" ${isInStock ? '' : 'disabled'}><i class="fa-solid fa-cart-shopping text-sm"></i></button>
                    </div>
                </div>
            </div>`;
    };
    const buildProductCardBatchHtml = (products, containerId, wishedIds, imageClass) => (Array.isArray(products) ? products : []).map((product) => {
        return buildProductCardHtml(product, containerId, wishedIds, imageClass);
    }).join('');
    // Dùng chung cho Home & Products tab
    function renderProductsList(arr, containerId = 'product-container', sourceArray = shopProducts) {
        const container = document.getElementById(containerId);
        if(!container) return;
        const sourceProducts = Array.isArray(sourceArray) ? sourceArray : [];
        const products = Array.isArray(arr) ? arr : [];
        const imageClass = containerId === 'products-tab-grid'
            ? 'w-full h-40 md:h-56 object-cover transition-transform duration-700 ease-out group-hover:scale-110'
            : 'w-full h-36 md:h-52 object-cover transition-transform duration-700 ease-out group-hover:scale-110';
        const emptyClass = containerId === 'products-tab-grid' ? 'col-span-2 md:col-span-4 xl:col-span-5 2xl:col-span-6' : 'col-span-2 md:col-span-4';
        const shouldRenderLoadingSkeleton = !productFeedState.error
            && !sourceProducts.length
            && (!productFeedState.initialSynced || productFeedState.loading);
        const emptyMessage = shouldRenderLoadingSkeleton
            ? buildProductLoadingState(emptyClass)
            : productFeedState.error
            ? `<div class='${emptyClass} text-center py-10 text-red-400'><i class="fa-solid fa-circle-exclamation text-3xl mb-3 block opacity-80"></i><p>${productFeedState.error}</p><p class='text-xs text-gray-400 mt-2'>Kiểm tra rules public của catalog_public, router shard 1 và file firebase.js đang được nạp mới nhất.</p></div>`
            : `<div class='${emptyClass} text-center py-10 text-gray-400'>Không tìm thấy sản phẩm phù hợp.</div>`;

        const wishedIds = new Set((Array.isArray(wishlistData) ? wishlistData : []).map((item) => String(item || '').trim()).filter(Boolean));
        const renderSignature = buildProductRenderSignature(containerId, products, wishedIds);
        window[`context_${containerId}`] = sourceArray;
        if(container.dataset.renderSignature === renderSignature) {
            return;
        }

        clearProductListRenderJob(containerId);
        container.dataset.renderSignature = renderSignature;

        if(!products.length) {
            container.innerHTML = emptyMessage;
            return;
        }

        const batchConfig = getProductListBatchConfig(containerId);
        const initialCount = Math.min(products.length, Math.max(batchConfig.initial, 1));
        container.innerHTML = buildProductCardBatchHtml(products.slice(0, initialCount), containerId, wishedIds, imageClass);

        if(initialCount >= products.length) {
            return;
        }

        const jobToken = `${containerId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const renderNextChunk = (startIndex) => {
            const activeJob = productListRenderJobs[containerId];
            if(!activeJob || activeJob.token !== jobToken) return;
            const nextIndex = Math.min(startIndex + batchConfig.chunk, products.length);
            container.insertAdjacentHTML('beforeend', buildProductCardBatchHtml(products.slice(startIndex, nextIndex), containerId, wishedIds, imageClass));
            if(nextIndex >= products.length) {
                clearProductListRenderJob(containerId);
                return;
            }
            activeJob.frameId = window.requestAnimationFrame(() => renderNextChunk(nextIndex));
        };

        productListRenderJobs[containerId] = {
            token: jobToken,
            frameId: window.requestAnimationFrame(() => renderNextChunk(initialCount))
        };
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
        renderResponsiveImageHtml: window.renderResponsiveImageHtml,
        normalizeKeyword,
        isAllCategory,
        getProductDisplayName,
        getProductUnit,
        getProductMinQty,
        getProductSalePercent,
        getProductPricingMeta,
        formatProductPriceLabel,
        getProductCategoryNames,
        getProductCategoryOptions,
        getCategoryVisual,
        getRecommendedProductsForUser,
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
        cancelProductListRenderJob: clearProductListRenderJob,
        defaultGuestName: DEFAULT_GUEST_NAME,
        uploadEndpoint: String(window.WEB_NEW_UPLOAD_ENDPOINT || 'upload-avatar.php').trim() || 'upload-avatar.php',
        storeContactPhone: STORE_CONTACT_PHONE,
        storeZaloPhone: STORE_ZALO_PHONE,
        passwordResetZaloPhone: PASSWORD_RESET_ZALO_PHONE,
        storeMapUrl: STORE_MAP_URL
    });
