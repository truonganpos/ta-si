(function () {
    if (window.homeTabFeature) return;

    var STYLE_ID = "home-tab-feature-styles";

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = [
            "[data-feature-root='home-tab']{min-width:0;}",
            "[data-feature-root='home-tab'] #home-highlight-grid > *{min-width:0;}"
        ].join("");
        document.head.appendChild(style);
    }

    function resolveRoot(target) {
        if (target && target.nodeType === 1) return target;
        if (typeof target === "string" && target) return document.getElementById(target);
        return document.querySelector("[data-feature-root='home-tab']") || document.getElementById("tab-home");
    }

    function getBridge() {
        return window.webNewAppBridge || {};
    }

    function getCategoryFeature() {
        return window.categoryMenuFeature || {};
    }

    function isDesktopPreviewViewport() {
        return window.innerWidth >= 768;
    }

    function clearRenderContainer(containerId) {
        var node = document.getElementById(String(containerId || "").trim());
        if (typeof window.cancelProductListRenderJob === "function") {
            window.cancelProductListRenderJob(containerId);
        }
        if (!node) return;
        delete node.dataset.renderSignature;
        node.innerHTML = "";
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    var homeBannerSlides = (window.HOME_BANNER_SLIDES || [
        {
            image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1600&q=80",
            badge: "Trường An Store",
            title: "Thế giới niềm vui bé",
            subtitle: "Khơi dậy tiềm năng với hàng ngàn đồ chơi giáo dục an toàn.",
            support: "Đồ chơi • Mẹ bé • Giá sỉ rõ ràng"
        },
        {
            image: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=1600&q=80",
            badge: "Góc đồ chơi",
            title: "Đồ chơi sáng tạo cho bé mỗi ngày",
            subtitle: "Danh mục rõ ràng theo nhóm hàng và tag để khách tìm nhanh hơn.",
            support: "Lọc nhanh • Xem đẹp trên mobile và desktop"
        },
        {
            image: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=1600&q=80",
            badge: "Mẹ và bé",
            title: "Sơ sinh, sữa bỉm và đồ dùng tiện chăm bé",
            subtitle: "Gợi ý hàng bán nhanh, dễ chốt đơn và dễ tạo giỏ hàng lớn.",
            support: "Giá tốt • Đồng bộ đơn hàng • Chăm sóc nhanh"
        }
    ]).map(function (slide) {
        return Object.assign({}, slide || {});
    });

    var homeHighlightCards = window.HOME_HIGHLIGHT_CARDS || [
        {
            image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80",
            label: "Đồ sơ sinh",
            accentClass: "text-blue-600",
            iconSvg: "<svg class='w-5 h-5 soft-icon' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path d='M12 2v20'></path><path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'></path></svg>",
            action: "goToTab('tab-products')"
        },
        {
            image: "https://images.unsplash.com/photo-1581557991964-125469da3b8a?auto=format&fit=crop&w=1200&q=80",
            label: "Đồ chơi mộc",
            accentClass: "text-violet-600",
            iconSvg: "<svg class='w-5 h-5 soft-icon' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'></path><path d='M3 3v5h5'></path></svg>",
            action: "goToTab('tab-products')"
        }
    ];

    function renderBanner(track, dots, slides, activeIndex, getOptimizedImageUrl) {
        if (track) {
            track.innerHTML = (slides || []).map(function (slide, index) {
                var imageUrl = getOptimizedImageUrl ? getOptimizedImageUrl(slide.image, "w1600") : slide.image;
                var badge = String(slide.badge || slide.label || "").trim();
                var title = String(slide.title || slide.text || "").trim();
                var subtitle = String(slide.subtitle || slide.description || slide.desc || "").trim();
                var support = String(slide.support || slide.note || "").trim();

                return [
                    "<div class='relative w-full h-full shrink-0 overflow-hidden'>",
                    "    <img src='", imageUrl, "' class='w-full h-full object-cover' alt='Banner ", String(index + 1), "' loading='", index === 0 ? "eager" : "lazy", "' decoding='async' fetchpriority='", index === 0 ? "high" : "low", "'/>",
                    "    <div class='absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/45 to-transparent'></div>",
                    "    <div class='absolute inset-y-0 left-0 z-10 flex items-center'>",
                    "        <div class='p-8 sm:p-12 lg:p-20 max-w-xl text-white'>",
                    badge ? "            <span class='inline-flex items-center rounded-full bg-white/15 border border-white/20 px-4 py-2 text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase mb-4 backdrop-blur-md'>" + escapeHtml(badge) + "</span>" : "",
                    title ? "            <h3 class='text-3xl sm:text-5xl lg:text-7xl font-black leading-tight'>" + escapeHtml(title) + "</h3>" : "",
                    subtitle ? "            <p class='text-slate-200 text-sm lg:text-xl mb-6 mt-4 font-medium leading-7'>" + escapeHtml(subtitle) + "</p>" : "",
                    support ? "            <p class='text-white/85 text-xs sm:text-sm font-bold tracking-[0.18em] uppercase'>" + escapeHtml(support) + "</p>" : "",
                    "        </div>",
                    "    </div>",
                    "</div>"
                ].join("");
            }).join("");
        }

        if (dots) {
            dots.innerHTML = (slides || []).map(function (_, index) {
                return "<button class='w-3 h-3 rounded-full transition-all " + (index === activeIndex ? "bg-babyPink scale-110" : "bg-white/60") + "' onclick='setHomeBanner(" + index + ")'></button>";
            }).join("");
        }
    }

    function renderHighlightGrid(container, items, getOptimizedImageUrl) {
        if (!container) return;

        container.innerHTML = (Array.isArray(items) ? items : []).map(function (item, index) {
            var imageUrl = getOptimizedImageUrl ? getOptimizedImageUrl(item.image, "w1200") : item.image;
            var accentClass = String(item.accentClass || "text-sky-600").trim();
            var label = String(item.label || "").trim();
            var action = String(item.action || "goToTab('tab-products')").trim();
            var iconSvg = String(item.iconSvg || "").trim();
            var safeAlt = label || ("Ưu đãi " + String(index + 1));

            return [
                "<button class='group relative col-span-2 rounded-[2rem] overflow-hidden h-36 sm:h-56 shadow-sm border border-slate-100 dark:border-slate-800 text-left' onclick=\"", action.replace(/\"/g, "&quot;"), "\">",
                "    <img src='", imageUrl, "' class='w-full h-full object-cover transition-transform duration-700 group-hover:scale-105' alt='", escapeHtml(safeAlt), "' loading='lazy' decoding='async'/>",
                "    <div class='absolute inset-0 bg-gradient-to-r from-slate-900/55 via-slate-900/18 to-transparent'></div>",
                "    <div class='absolute top-4 left-4 inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-bold shadow ", accentClass, "'>",
                iconSvg,
                "        <span>", escapeHtml(label), "</span>",
                "    </div>",
                "</button>"
            ].join("");
        }).join("");
    }

    function renderGuestCta(container, options) {
        if (!container) return;

        var isGuest = !!(options && options.isGuest);
        container.classList.toggle("hidden", !isGuest);
        if (!isGuest) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = [
            "<div class='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>",
            "    <div>",
            "        <p class='text-[11px] uppercase tracking-[0.22em] text-babyPink font-black'>Khách chưa đăng nhập</p>",
            "        <h3 class='font-extrabold text-xl text-gray-800 mt-1'>Đăng nhập để xem giá sỉ và đồng bộ đơn hàng</h3>",
            "        <p class='text-sm text-gray-600 mt-2 leading-6 max-w-2xl'>", escapeHtml(options.gateMessage || ""), "</p>",
            "    </div>",
            "    <div class='flex flex-wrap gap-3 shrink-0'>",
            "        <button class='bg-babyPink text-white px-5 py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition' onclick='openAuthFromHome(\"login\")'>Đăng nhập</button>",
            "        <button class='bg-white text-babyPink border border-pink-200 px-5 py-3 rounded-2xl font-bold hover:bg-pink-50 transition [.dark-mode_&]:!bg-[#1f2937] [.dark-mode_&]:!border-[#334155]' onclick='openAuthFromHome(\"register\")'>Đăng ký</button>",
            "    </div>",
            "</div>"
        ].join("");
    }

    function updateHomeBannerContent() {
        var bridge = getBridge();
        var track = document.getElementById("home-banner-track");
        var dots = document.getElementById("home-banner-dots");
        var bannerIndex = bridge.getHomeBannerIndex ? bridge.getHomeBannerIndex() : 0;
        if (!track) return;

        track.style.transform = "translateX(-" + (bannerIndex * 100) + "%)";
        if (!dots) return;

        dots.querySelectorAll("button").forEach(function (dot, index) {
            dot.classList.toggle("bg-babyPink", index === bannerIndex);
            dot.classList.toggle("scale-110", index === bannerIndex);
            dot.classList.toggle("bg-white/60", index !== bannerIndex);
        });
    }

    function renderHomeBannerSlider() {
        var bridge = getBridge();
        var track = document.getElementById("home-banner-track");
        var dots = document.getElementById("home-banner-dots");
        if (!track || !dots) return;

        var canAutoRotate = function () {
            var homeTab = document.getElementById("tab-home");
            return document.visibilityState === "visible" && !!(homeTab && homeTab.classList.contains("active"));
        };

        renderBanner(
            track,
            dots,
            homeBannerSlides,
            bridge.getHomeBannerIndex ? bridge.getHomeBannerIndex() : 0,
            bridge.getOptimizedImageUrl
        );

        updateHomeBannerContent();

        var timer = bridge.getHomeBannerTimer ? bridge.getHomeBannerTimer() : null;
        if (timer) clearInterval(timer);

        var nextTimer = setInterval(function () {
            if (!canAutoRotate()) return;
            var nextIndex = ((bridge.getHomeBannerIndex ? bridge.getHomeBannerIndex() : 0) + 1) % Math.max(homeBannerSlides.length, 1);
            if (bridge.setHomeBannerIndex) bridge.setHomeBannerIndex(nextIndex);
            updateHomeBannerContent();
        }, 4000);

        if (bridge.setHomeBannerTimer) bridge.setHomeBannerTimer(nextTimer);
    }

    function renderHomeHighlightGrid() {
        var bridge = getBridge();
        var container = document.getElementById("home-highlight-grid");
        if (!container) return;
        renderHighlightGrid(container, homeHighlightCards, bridge.getOptimizedImageUrl);
    }

    function renderHomeDesktopCategoryMenu() {
        var categoryFeature = getCategoryFeature();
        if (categoryFeature && typeof categoryFeature.renderHomeDesktopCategoryMenu === "function") {
            return categoryFeature.renderHomeDesktopCategoryMenu();
        }
    }

    function renderHomeGuestCta() {
        var bridge = getBridge();
        var container = document.getElementById("home-guest-cta");
        if (!container) return;

        var user = bridge.getCurrentUser ? bridge.getCurrentUser() : null;
        var isGuest = !(user && user.authUid);
        var gateMessage = window.webNewCatalogGate && typeof window.webNewCatalogGate.getBlockedMessage === "function"
            ? window.webNewCatalogGate.getBlockedMessage()
            : "Đăng nhập để đồng bộ giá và danh sách sản phẩm mới nhất.";

        renderGuestCta(container, {
            isGuest: isGuest,
            gateMessage: gateMessage
        });
    }

    function renderHomeCategories() {
        var categoryFeature = getCategoryFeature();
        if (categoryFeature && typeof categoryFeature.renderHomeCategories === "function") {
            return categoryFeature.renderHomeCategories();
        }
    }

    function renderHomeProductLists(products) {
        var bridge = getBridge();
        var renderList = bridge.renderProductsList || window.renderProductsList;
        if (typeof renderList !== "function") return;
        var safeProducts = Array.isArray(products) ? products.slice() : [];
        var safeUser = bridge.getCurrentUser ? bridge.getCurrentUser() : null;
        var hasCategoryFilter = !!(bridge.getFilterCategory && bridge.getFilterCategory());
        var recommendedProducts = (!hasCategoryFilter && safeUser && bridge.getRecommendedProductsForUser)
            ? bridge.getRecommendedProductsForUser(safeProducts, safeUser)
            : safeProducts;
        updateHomeProductTitles(!hasCategoryFilter && safeUser ? "Gợi ý phù hợp cho bạn" : "Sản phẩm đề xuất");
        if (isDesktopPreviewViewport()) {
            clearRenderContainer("product-container");
            renderList(recommendedProducts, "product-container-desktop", recommendedProducts);
            return;
        }
        clearRenderContainer("product-container-desktop");
        renderList(recommendedProducts, "product-container", recommendedProducts);
    }

    function updateHomeProductTitles(title) {
        ["home-products-title", "home-products-title-desktop"].forEach(function (id) {
            var element = document.getElementById(id);
            if (element) {
                var textContainer = element.querySelector("span:last-child");
                if (textContainer) textContainer.innerText = title;
                else element.innerText = title;
            }
        });
    }

    function filterHomeByCategory(categoryName) {
        var categoryFeature = getCategoryFeature();
        if (categoryFeature && typeof categoryFeature.filterHomeByCategory === "function") {
            return categoryFeature.filterHomeByCategory(categoryName);
        }
    }

    function render(options) {
        ensureStyles();
        mount(options && options.target);
        var bridge = getBridge();
        renderHomeBannerSlider();
        renderHomeHighlightGrid();
        renderHomeGuestCta();
        if (isDesktopPreviewViewport()) renderHomeDesktopCategoryMenu();
        else renderHomeCategories();
        var filteredProducts = bridge.getFilteredProducts ? bridge.getFilteredProducts(bridge.getShopProducts ? bridge.getShopProducts() : []) : [];
        renderHomeProductLists(filteredProducts);
    }

    function mount(target) {
        ensureStyles();
        return resolveRoot(target);
    }

    function destroy(target) {
        var bridge = getBridge();
        var timer = bridge.getHomeBannerTimer ? bridge.getHomeBannerTimer() : null;
        if (timer) clearInterval(timer);
        if (bridge.setHomeBannerTimer) bridge.setHomeBannerTimer(null);

        var root = resolveRoot(target);
        if (!root) return;
        [
            "home-banner-track",
            "home-banner-dots",
            "home-highlight-grid",
            "home-guest-cta",
            "product-container",
            "product-container-desktop"
        ].forEach(function (id) {
            var node = document.getElementById(id);
            if (node && root.contains(node)) node.innerHTML = "";
        });
    }

    function setHomeBanner(index) {
        var bridge = getBridge();
        if (bridge.setHomeBannerIndex) bridge.setHomeBannerIndex(index);
        updateHomeBannerContent();
    }

    function openAuthFromHome(mode) {
        if (typeof window.goToTab === "function") window.goToTab("tab-account");
        setTimeout(function () {
            if (typeof window.openAuth === "function") window.openAuth();
            if (typeof window.switchAuthTab === "function") {
                window.switchAuthTab(mode === "register" ? "register" : "login");
            }
        }, 120);
    }

    function exposeLegacyApi() {
        window.homeTabUi = feature.ui;
        window.setHomeBanner = setHomeBanner;
        window.openAuthFromHome = openAuthFromHome;
        window.renderHomeProductLists = renderHomeProductLists;
        window.updateHomeProductTitles = updateHomeProductTitles;
        window.homeTabModule = feature.module;
    }

    var feature = {
        ensureStyles: ensureStyles,
        mount: mount,
        render: render,
        destroy: destroy,
        ui: {
            renderBanner: renderBanner,
            renderHighlightGrid: renderHighlightGrid,
            renderGuestCta: renderGuestCta
        },
        renderBanner: renderHomeBannerSlider,
        renderCategories: renderHomeCategories,
        renderProducts: renderHomeProductLists,
        renderGuestCta: renderHomeGuestCta,
        renderDesktopCategoryMenu: renderHomeDesktopCategoryMenu,
        updateTitles: updateHomeProductTitles,
        filterByCategory: filterHomeByCategory,
        openAuth: openAuthFromHome,
        exposeLegacyApi: exposeLegacyApi
    };

    feature.module = {
        render: render,
        renderBanner: renderHomeBannerSlider,
        renderCategories: renderHomeCategories,
        renderProducts: renderHomeProductLists,
        updateTitles: updateHomeProductTitles,
        renderGuestCta: renderHomeGuestCta
    };

    window.homeTabFeature = feature;
    exposeLegacyApi();
    window.dispatchEvent(new Event("web-new-home-tab-ready"));
})();
