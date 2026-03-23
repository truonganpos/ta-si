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

    var homeBannerSlides = window.HOME_BANNER_SLIDES || [
        // Hướng dẫn chèn link ảnh:
        // 1. Thay giá trị "image" bên dưới bằng link ảnh của bạn.
        // 2. Nên dùng ảnh ngang tỷ lệ 16:9 hoặc 21:9 để slide hiển thị đẹp hơn.
        // 3. Có thể thêm hoặc xóa slide bằng cách chỉnh mảng này.
        { image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1400&q=80" },
        { image: "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=1400&q=80" },
        { image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1400&q=80" }
    ];

    function updateHomeBannerContent() {
        var bridge = getBridge();
        var track = document.getElementById("home-banner-track");
        var dots = document.getElementById("home-banner-dots");
        var bannerIndex = bridge.getHomeBannerIndex ? bridge.getHomeBannerIndex() : 0;
        if (!track) return;

        track.style.transform = "translateX(-" + (bannerIndex * 100) + "%)";
        if (!dots) return;

        dots.querySelectorAll("button").forEach(function (dot, index) {
            dot.classList.toggle("bg-white", index === bannerIndex);
            dot.classList.toggle("scale-110", index === bannerIndex);
            dot.classList.toggle("bg-white/50", index !== bannerIndex);
        });
    }

    function renderHomeBannerSlider() {
        var bridge = getBridge();
        var track = document.getElementById("home-banner-track");
        var dots = document.getElementById("home-banner-dots");
        if (!track || !dots) return;

        track.innerHTML = homeBannerSlides.map(function (slide, index) {
            var imageUrl = bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(slide.image, "w1600") : slide.image;
            return [
                "<div class='w-full h-full shrink-0'>",
                "    <img src='", imageUrl, "' class='w-full h-full object-cover' alt='Banner ", String(index + 1), "' loading='", index === 0 ? "eager" : "lazy", "' decoding='async' fetchpriority='", index === 0 ? "high" : "low", "'/>",
                "</div>"
            ].join("");
        }).join("");

        dots.innerHTML = homeBannerSlides.map(function (_, index) {
            var activeIndex = bridge.getHomeBannerIndex ? bridge.getHomeBannerIndex() : 0;
            return "<button class='w-2.5 h-2.5 rounded-full transition-all " + (index === activeIndex ? "bg-white scale-110" : "bg-white/50") + "' onclick='setHomeBanner(" + index + ")'></button>";
        }).join("");

        updateHomeBannerContent();

        var timer = bridge.getHomeBannerTimer ? bridge.getHomeBannerTimer() : null;
        if (timer) clearInterval(timer);

        var nextTimer = setInterval(function () {
            var nextIndex = ((bridge.getHomeBannerIndex ? bridge.getHomeBannerIndex() : 0) + 1) % Math.max(homeBannerSlides.length, 1);
            if (bridge.setHomeBannerIndex) bridge.setHomeBannerIndex(nextIndex);
            updateHomeBannerContent();
        }, 4000);

        if (bridge.setHomeBannerTimer) bridge.setHomeBannerTimer(nextTimer);
    }

    window.setHomeBanner = function (index) {
        var bridge = getBridge();
        if (bridge.setHomeBannerIndex) bridge.setHomeBannerIndex(index);
        updateHomeBannerContent();
    };

    function renderHomeDesktopCategoryMenu() {
        var bridge = getBridge();
        var categories = bridge.getProductCategoryOptions ? bridge.getProductCategoryOptions() : [];
        var activeCategory = bridge.getFilterCategory ? bridge.getFilterCategory() : "";

        if (window.uiPc && typeof window.uiPc.renderSidebarMenu === "function") {
            window.uiPc.renderSidebarMenu({
                containerId: "home-desktop-category-menu",
                counterId: "home-desktop-category-count",
                categories: categories,
                activeCategory: activeCategory,
                allLabel: "Tất cả",
                selectHandler: "filterHomeByCategory",
                buildArgument: bridge.toInlineArgument
            });
            return;
        }

        var container = document.getElementById("home-desktop-category-menu");
        var counter = document.getElementById("home-desktop-category-count");
        if (!container) return;

        if (counter) counter.innerText = Math.max(categories.length - 1, 0) + " nhóm";
        container.innerHTML = categories.map(function (item) {
            var active = (!activeCategory && item.name === "Tất cả") || activeCategory === item.name;
            return [
                "<button class='w-full flex items-center gap-3 rounded-2xl px-4 py-3 border text-left transition ",
                active ? "border-babyPink bg-pink-50 text-babyPink shadow-sm [.dark-mode_&]:!bg-[#1f2937] [.dark-mode_&]:!border-[#334155] [.dark-mode_&]:!text-babyPink" : "border-transparent bg-white text-gray-600 hover:bg-gray-50 [.dark-mode_&]:!bg-transparent [.dark-mode_&]:hover:!bg-[#1f2937] [.dark-mode_&]:!text-gray-300",
                "' onclick='filterHomeByCategory(",
                bridge.toInlineArgument ? bridge.toInlineArgument(item.name === "Tất cả" ? "" : item.name) : "''",
                ")'>",
                "    <div class='w-11 h-11 rounded-2xl ", active ? "bg-white [.dark-mode_&]:!bg-[#0f172a]" : item.color, " flex items-center justify-center shrink-0'>",
                "        <i class='fa-solid ", item.name === "Tất cả" ? "fa-border-all" : item.icon, "'></i>",
                "    </div>",
                "    <div class='min-w-0 flex-1 flex items-center justify-between gap-3'>",
                "        <span class='font-bold truncate'>", escapeHtml(item.name), "</span>",
                "        <span class='text-xs font-bold ", active ? "text-babyPink" : "text-gray-400", "'>", String(item.count || 0), "</span>",
                "    </div>",
                "</button>"
            ].join("");
        }).join("");
    }

    function renderHomeGuestCta() {
        var bridge = getBridge();
        var container = document.getElementById("home-guest-cta");
        if (!container) return;

        var user = bridge.getCurrentUser ? bridge.getCurrentUser() : null;
        var isGuest = !(user && user.authUid);
        container.classList.toggle("hidden", !isGuest);
        if (!isGuest) {
            container.innerHTML = "";
            return;
        }

        var gateMessage = window.webNewCatalogGate && typeof window.webNewCatalogGate.getBlockedMessage === "function"
            ? window.webNewCatalogGate.getBlockedMessage()
            : "Đăng nhập để đồng bộ giá và danh sách sản phẩm mới nhất.";

        container.innerHTML = [
            "<div class='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>",
            "    <div>",
            "        <p class='text-[11px] uppercase tracking-[0.22em] text-babyPink font-black'>Khách chưa đăng nhập</p>",
            "        <h3 class='font-extrabold text-xl text-gray-800 mt-1'>Đăng nhập để xem giá sỉ và đồng bộ đơn hàng</h3>",
            "        <p class='text-sm text-gray-600 mt-2 leading-6 max-w-2xl'>", escapeHtml(gateMessage), "</p>",
            "    </div>",
            "    <div class='flex flex-wrap gap-3 shrink-0'>",
            "        <button class='bg-babyPink text-white px-5 py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition' onclick='openAuthFromHome(\"login\")'>Đăng nhập</button>",
            "        <button class='bg-white text-babyPink border border-pink-200 px-5 py-3 rounded-2xl font-bold hover:bg-pink-50 transition [.dark-mode_&]:!bg-[#1f2937] [.dark-mode_&]:!border-[#334155]' onclick='openAuthFromHome(\"register\")'>Đăng ký</button>",
            "    </div>",
            "</div>"
        ].join("");
    }

    window.openAuthFromHome = function (mode) {
        if (typeof window.goToTab === "function") window.goToTab("tab-account");
        setTimeout(function () {
            if (typeof window.openAuth === "function") window.openAuth();
            if (typeof window.switchAuthTab === "function") {
                window.switchAuthTab(mode === "register" ? "register" : "login");
            }
        }, 120);
    };

    window.renderHomeCategories = function () {
        var container = document.getElementById("home-mobile-categories");
        if (!container) return;

        container.innerHTML = [
            "<div class='flex items-center justify-between rounded-[28px] border border-pink-100 bg-gradient-to-r from-rose-50 via-white to-pink-50 shadow-sm p-4 md:p-5 cursor-pointer hover:opacity-90 transition [.dark-mode_&]:!from-[#1e293b] [.dark-mode_&]:!via-[#0f172a] [.dark-mode_&]:!to-[#1e293b] [.dark-mode_&]:!border-[#334155]' onclick='goToTab(\"tab-products\"); setTimeout(function(){ if(typeof openProductCategoryPopup === \"function\") openProductCategoryPopup(); }, 100);'>",
            "    <div class='flex items-center gap-4'>",
            "        <div class='w-12 h-12 rounded-full bg-white text-babyPink flex items-center justify-center text-xl shadow-sm shrink-0 [.dark-mode_&]:!bg-[#0f172a]'><i class='fa-solid fa-layer-group'></i></div>",
            "        <div>",
            "            <h3 class='font-bold text-gray-800 text-base'>Khám phá danh mục</h3>",
            "            <p class='text-xs text-gray-500 mt-0.5'>Mở menu nhóm hàng và tag sản phẩm</p>",
            "        </div>",
            "    </div>",
            "    <div class='w-10 h-10 rounded-full bg-white text-gray-400 flex items-center justify-center shadow-sm shrink-0 [.dark-mode_&]:!bg-[#0f172a]'><i class='fa-solid fa-angle-right'></i></div>",
            "</div>"
        ].join("");
    };

    window.filterHomeByCategory = function (categoryName) {
        var bridge = getBridge();
        var currentCategory = bridge.getFilterCategory ? bridge.getFilterCategory() : "";

        if ((bridge.isAllCategory && bridge.isAllCategory(categoryName)) || currentCategory === categoryName) {
            if (bridge.setFilterCategory) bridge.setFilterCategory("");
        } else if (bridge.setFilterCategory) {
            bridge.setFilterCategory(categoryName);
        }

        if (bridge.updateProductsCategoryButton) bridge.updateProductsCategoryButton();
        if (typeof window.renderProductsFilterSummary === "function") window.renderProductsFilterSummary();
        renderHomeDesktopCategoryMenu();

        var filtered = bridge.getFilteredProducts ? bridge.getFilteredProducts(bridge.getShopProducts ? bridge.getShopProducts() : []) : [];
        window.renderHomeProductLists(filtered);
    };

    window.renderHomeProductLists = function (products) {
        var bridge = getBridge();
        var renderList = bridge.renderProductsList || window.renderProductsList;
        if (typeof renderList !== "function") return;
        renderList(products, "product-container", products);
        renderList(products, "product-container-desktop", products);
    };

    window.updateHomeProductTitles = function (title) {
        ["home-products-title", "home-products-title-desktop"].forEach(function (id) {
            var element = document.getElementById(id);
            if (element) element.innerText = title;
        });
    };

    function render() {
        var bridge = getBridge();
        renderHomeBannerSlider();
        renderHomeGuestCta();
        renderHomeDesktopCategoryMenu();
        window.renderHomeCategories();
        var filteredProducts = bridge.getFilteredProducts ? bridge.getFilteredProducts(bridge.getShopProducts ? bridge.getShopProducts() : []) : [];
        window.renderHomeProductLists(filteredProducts);
    }

    window.renderHomeDesktopCategoryMenu = renderHomeDesktopCategoryMenu;
    window.homeTabModule = {
        render: render,
        renderBanner: renderHomeBannerSlider,
        renderCategories: window.renderHomeCategories,
        renderProducts: window.renderHomeProductLists,
        updateTitles: window.updateHomeProductTitles,
        renderGuestCta: renderHomeGuestCta
    };

    window.dispatchEvent(new Event("web-new-home-tab-ready"));
})();