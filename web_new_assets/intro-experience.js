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

    function getCurrentUser() {
        const bridge = getBridge();
        return bridge.getCurrentUser ? bridge.getCurrentUser() : null;
    }

    window.INTRO_EXPERIENCE_CONFIG = window.INTRO_EXPERIENCE_CONFIG || {
        hero: {
            badge: "Trường An Store",
            title: "Không gian mua sắm gần gũi cho mẹ và bé, đồ chơi, quà tặng và hàng bán sỉ.",
            description: "Tab giới thiệu này được tách riêng để bạn dễ thay ảnh, đổi nội dung và chỉnh landing page mà không cần chạm vào file chính.",
            primaryLabel: "Xem sản phẩm",
            secondaryLabel: "Mở Google Maps",
            statisticLabel: "Khách mới mỗi ngày",
            statisticValue: "200+"
        },
        highlights: [
            {
                icon: "fa-heart-circle-check",
                color: "bg-pink-100 text-babyPink",
                title: "Ảnh rõ, mô tả gọn",
                description: "Khách xem nhanh là nắm được nhóm hàng, giá bán và điểm nổi bật."
            },
            {
                icon: "fa-truck-fast",
                color: "bg-sky-100 text-sky-600",
                title: "Lên đơn trực tiếp",
                description: "Khách có thể đặt đơn ngay trên web, shop chỉ cần xác nhận và xử lý."
            },
            {
                icon: "fa-gift",
                color: "bg-amber-100 text-amber-600",
                title: "Ưu đãi nổi bật",
                description: "Popup đầu trang và khu sale có thể thay đổi độc lập theo từng chiến dịch."
            }
        ],
        storeInfo: {
            name: "Trường An Store",
            summary: "Chuyên nhóm hàng mẹ và bé, đồ chơi, quà tặng và sản phẩm bán sỉ cho cộng tác viên.",
            address: "Cập nhật địa chỉ thật của cửa hàng tại đây.",
            mapUrl: "https://maps.google.com/?q=Truong+An+Store",
            openHours: "08:00 - 21:00 mỗi ngày"
        },
        gallery: [
            {
                image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1400&q=80",
                title: "Không gian mua sắm cho mẹ và bé",
                caption: "Ảnh banner chính cho phần giới thiệu.",
                link: "https://maps.google.com/?q=Truong+An+Store"
            },
            {
                image: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=1200&q=80",
                title: "Khu đồ chơi nổi bật",
                caption: "Có thể thay bằng ảnh thật trong shop.",
                link: "https://maps.google.com/?q=Truong+An+Store"
            },
            {
                image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80",
                title: "Nhóm hàng mẹ và bé",
                caption: "Dùng để giới thiệu nhóm sản phẩm chủ lực.",
                link: "https://maps.google.com/?q=Truong+An+Store"
            },
            {
                image: "https://images.unsplash.com/photo-1543340903-73c1b0b3c8b2?auto=format&fit=crop&w=1200&q=80",
                title: "Kệ trưng bày khuyến mại",
                caption: "Phù hợp đổi theo từng chiến dịch sale.",
                link: "https://maps.google.com/?q=Truong+An+Store"
            }
        ],
        welcomePopup: {
            badge: "Ưu đãi đầu trang",
            title: "Nhận ưu đãi cho khách mới",
            subtitle: "Đăng ký để lưu hồ sơ, theo dõi đơn hàng và nhận các cập nhật mới nhất từ shop.",
            lines: [
                "Tạo tài khoản nhanh bằng email hoặc số điện thoại.",
                "Lưu địa chỉ giao hàng để lên đơn nhanh hơn ở các lần mua sau.",
                "Bạn có thể đổi toàn bộ nội dung popup này ngay trong file intro-experience.js."
            ],
            primaryLabel: "Đăng ký / Đăng nhập",
            secondaryLabel: "Xem sản phẩm"
        },
        supportMenuLabel: "Mở liên hệ nhanh"
    };

    function getConfig() {
        return window.INTRO_EXPERIENCE_CONFIG || {};
    }

    function getGallery() {
        const bridge = getBridge();
        return (Array.isArray(getConfig().gallery) ? getConfig().gallery : [])
            .map(function (item, index) {
                return {
                    id: String((item && item.id) || ("intro-" + (index + 1))).trim(),
                    image: String((item && item.image) || "").trim(),
                    title: String((item && item.title) || ("Hình giới thiệu " + (index + 1))).trim(),
                    caption: String((item && item.caption) || "").trim(),
                    link: String((item && item.link) || bridge.storeMapUrl || "").trim()
                };
            })
            .filter(function (item) { return !!item.image; });
    }

    function renderHero() {
        const bridge = getBridge();
        const config = getConfig();
        const hero = config.hero || {};
        const store = config.storeInfo || {};
        const gallery = getGallery();
        const heroImage = gallery.length ? gallery[0].image : "";

        return [
            "<section class='rounded-[32px] border border-gray-100 bg-white shadow-sm overflow-hidden'>",
            "    <div class='grid lg:grid-cols-[minmax(0,1.15fr),420px]'>",
            "        <div class='px-6 py-7 md:px-8 md:py-9 bg-gradient-to-br from-rose-50 via-white to-pink-50 [.dark-mode_&]:!from-[#1e293b] [.dark-mode_&]:!via-[#0f172a] [.dark-mode_&]:!to-[#1e293b] [.dark-mode_&]:!border-[#334155]'>",
            "            <p class='text-[11px] uppercase tracking-[0.28em] text-babyPink font-black mb-3'>", escapeHtml(hero.badge || "Trường An Store"), "</p>",
            "            <h2 class='text-2xl md:text-[2.25rem] font-extrabold text-gray-800 leading-tight max-w-3xl'>", escapeHtml(hero.title || ""), "</h2>",
            "            <p class='text-sm md:text-base text-gray-600 leading-7 mt-4 max-w-2xl'>", escapeHtml(hero.description || ""), "</p>",
            "            <div class='grid sm:grid-cols-3 gap-3 mt-6'>",
            "                <div class='rounded-2xl bg-white border border-pink-100 px-4 py-4 [.dark-mode_&]:!bg-[#0f172a] [.dark-mode_&]:!border-[#334155]'>",
            "                    <p class='text-[11px] uppercase tracking-[0.18em] text-gray-400 font-black'>Danh mục</p>",
            "                    <p class='font-extrabold text-xl text-gray-800 mt-2'>Mẹ bé • Đồ chơi • Quà tặng</p>",
            "                </div>",
            "                <div class='rounded-2xl bg-white border border-pink-100 px-4 py-4 [.dark-mode_&]:!bg-[#0f172a] [.dark-mode_&]:!border-[#334155]'>",
            "                    <p class='text-[11px] uppercase tracking-[0.18em] text-gray-400 font-black'>Hỗ trợ nhanh</p>",
            "                    <p class='font-extrabold text-xl text-gray-800 mt-2'>Zalo ", escapeHtml(bridge.storeZaloPhone || bridge.storeContactPhone || ""), "</p>",
            "                </div>",
            "                <div class='rounded-2xl bg-white border border-pink-100 px-4 py-4 [.dark-mode_&]:!bg-[#0f172a] [.dark-mode_&]:!border-[#334155]'>",
            "                    <p class='text-[11px] uppercase tracking-[0.18em] text-gray-400 font-black'>", escapeHtml(hero.statisticLabel || "Khách mới mỗi ngày"), "</p>",
            "                    <p class='font-extrabold text-xl text-gray-800 mt-2'>", escapeHtml(hero.statisticValue || "200+"), "</p>",
            "                </div>",
            "            </div>",
            "            <div class='flex flex-wrap gap-3 mt-6'>",
            "                <button class='bg-babyPink text-white px-5 py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition' onclick='goToTab(\"tab-products\")'>", escapeHtml(hero.primaryLabel || "Xem sản phẩm"), "</button>",
            "                <a class='bg-white text-gray-700 border border-gray-200 px-5 py-3 rounded-2xl font-bold hover:bg-gray-50 transition [.dark-mode_&]:!bg-[#0f172a] [.dark-mode_&]:!border-[#334155] [.dark-mode_&]:!text-gray-300' href='", escapeHtml(store.mapUrl || bridge.storeMapUrl || "#"), "' rel='noopener noreferrer' target='_blank'>", escapeHtml(hero.secondaryLabel || "Mở Google Maps"), "</a>",
            getCurrentUser() ? "" : "                <button class='border border-pink-200 bg-pink-50 text-babyPink px-5 py-3 rounded-2xl font-bold hover:bg-pink-100 transition [.dark-mode_&]:!bg-[#1f2937] [.dark-mode_&]:!border-[#334155]' onclick='goToTab(\"tab-account\"); setTimeout(function(){ if (typeof openAuth === \"function\") openAuth(); }, 120);'>Đăng ký / Đăng nhập</button>",
            "            </div>",
            "        </div>",
            "        <div class='relative min-h-[280px] md:min-h-[360px] bg-gray-100'>",
            heroImage
                ? "            <img src='" + escapeHtml(bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(heroImage, "w1600") : heroImage) + "' loading='lazy' decoding='async' class='absolute inset-0 w-full h-full object-cover'/>"
                : "            <div class='absolute inset-0 bg-gradient-to-br from-pink-100 to-white'></div>",
            "            <div class='absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent'></div>",
            "            <div class='absolute left-5 right-5 bottom-5 rounded-[24px] bg-white/92 backdrop-blur px-4 py-4 border border-white/70 shadow-xl [.dark-mode_&]:!bg-[#1e293b]/90 [.dark-mode_&]:!border-[#334155]'>",
            "                <p class='text-[11px] uppercase tracking-[0.18em] text-babyPink font-black'>Thông tin cửa hàng</p>",
            "                <h3 class='font-extrabold text-lg text-gray-800 mt-2'>", escapeHtml(store.name || "Trường An Store"), "</h3>",
            "                <p class='text-sm text-gray-600 leading-6 mt-2'>", escapeHtml(store.summary || ""), "</p>",
            "                <div class='grid sm:grid-cols-2 gap-2 mt-4 text-sm text-gray-600'>",
            "                    <div class='rounded-2xl bg-white px-3 py-3 border border-gray-100 [.dark-mode_&]:!bg-[#0f172a] [.dark-mode_&]:!border-[#334155]'><span class='font-bold text-gray-800 block mb-1'>Giờ mở cửa</span>", escapeHtml(store.openHours || "08:00 - 21:00"), "</div>",
            "                    <div class='rounded-2xl bg-white px-3 py-3 border border-gray-100 [.dark-mode_&]:!bg-[#0f172a] [.dark-mode_&]:!border-[#334155]'><span class='font-bold text-gray-800 block mb-1'>Bản đồ</span>", escapeHtml(store.address || "Cập nhật địa chỉ cửa hàng"), "</div>",
            "                </div>",
            "            </div>",
            "        </div>",
            "    </div>",
            "</section>"
        ].join("");
    }

    function renderHighlights() {
        const highlights = Array.isArray(getConfig().highlights) ? getConfig().highlights : [];
        if (!highlights.length) return "";

        return [
            "<section class='grid md:grid-cols-3 gap-4'>",
            highlights.map(function (item) {
                return [
                    "<article class='rounded-[28px] bg-white border border-gray-100 shadow-sm p-5'>",
                    "    <div class='w-12 h-12 rounded-2xl ", escapeHtml(item.color || "bg-pink-100 text-babyPink"), " flex items-center justify-center text-xl mb-4'><i class='fa-solid ", escapeHtml(item.icon || "fa-star"), "'></i></div>",
                    "    <h3 class='font-bold text-gray-800 text-lg'>", escapeHtml(item.title || ""), "</h3>",
                    "    <p class='text-sm text-gray-500 leading-6 mt-2'>", escapeHtml(item.description || ""), "</p>",
                    "</article>"
                ].join("");
            }).join(""),
            "</section>"
        ].join("");
    }

    function renderGallery() {
        const bridge = getBridge();
        const gallery = getGallery();

        if (!gallery.length) {
            return [
                "<section class='rounded-[28px] border border-dashed border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400 shadow-sm'>",
                "    Chưa có ảnh giới thiệu. Hãy thêm ảnh trong file intro-experience.js.",
                "</section>"
            ].join("");
        }

        return [
            "<section class='rounded-[32px] border border-gray-100 bg-white shadow-sm p-5 md:p-6'>",
            "    <div class='flex flex-wrap items-center justify-between gap-3 mb-4'>",
            "        <div>",
            "            <p class='text-[11px] uppercase tracking-[0.22em] text-gray-400 font-black'>Hình ảnh cửa hàng</p>",
            "            <h3 class='font-extrabold text-xl text-gray-800 mt-1'>Album giới thiệu</h3>",
            "        </div>",
            "        <a class='text-sm font-bold text-babyPink hover:underline' href='", escapeHtml((getConfig().storeInfo && getConfig().storeInfo.mapUrl) || bridge.storeMapUrl || "#"), "' rel='noopener noreferrer' target='_blank'>Xem bản đồ</a>",
            "    </div>",
            "    <div class='grid md:grid-cols-2 xl:grid-cols-3 gap-4'>",
            gallery.map(function (item, index) {
                const sizeClass = index === 0 ? "md:col-span-2 xl:col-span-2 min-h-[320px]" : "min-h-[220px]";
                return [
                    "<a class='group relative overflow-hidden rounded-[28px] border border-gray-100 bg-gray-100 ", sizeClass, "' href='", escapeHtml(item.link || bridge.storeMapUrl || "#"), "' rel='noopener noreferrer' target='_blank'>",
                    "    <img src='", escapeHtml(bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(item.image, index === 0 ? "w1600" : "w1000") : item.image), "' loading='lazy' decoding='async' class='absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]'/>",
                    "    <div class='absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent'></div>",
                    "    <div class='absolute left-0 right-0 bottom-0 p-4 md:p-5 text-white'>",
                    "        <h4 class='font-extrabold text-lg leading-tight'>", escapeHtml(item.title), "</h4>",
                    "        <p class='text-sm text-white/90 leading-6 mt-2'>", escapeHtml(item.caption), "</p>",
                    "    </div>",
                    "</a>"
                ].join("");
            }).join(""),
            "    </div>",
            "</section>"
        ].join("");
    }

    function renderAside() {
        const bridge = getBridge();
        const config = getConfig();
        const store = config.storeInfo || {};

        return [
            "<aside class='space-y-4'>",
            "    <section class='rounded-[32px] bg-white border border-gray-100 shadow-sm p-5'>",
            "        <p class='text-[11px] uppercase tracking-[0.2em] text-gray-400 font-black'>Thông tin cửa hàng</p>",
            "        <h3 class='font-extrabold text-xl text-gray-800 mt-2'>", escapeHtml(store.name || "Trường An Store"), "</h3>",
            "        <div class='space-y-3 mt-4 text-sm text-gray-600 leading-6'>",
            "            <p><span class='font-bold text-gray-800'>Mô tả:</span> ", escapeHtml(store.summary || ""), "</p>",
            "            <p><span class='font-bold text-gray-800'>Địa chỉ:</span> ", escapeHtml(store.address || "Cập nhật địa chỉ cửa hàng"), "</p>",
            "            <p><span class='font-bold text-gray-800'>Zalo:</span> ", escapeHtml(bridge.storeZaloPhone || bridge.storeContactPhone || ""), "</p>",
            "            <p><span class='font-bold text-gray-800'>Giờ mở cửa:</span> ", escapeHtml(store.openHours || "08:00 - 21:00"), "</p>",
            "        </div>",
            "        <a class='mt-4 inline-flex items-center gap-2 text-babyPink font-bold hover:underline' href='", escapeHtml(store.mapUrl || bridge.storeMapUrl || "#"), "' rel='noopener noreferrer' target='_blank'>",
            "            <i class='fa-solid fa-location-dot'></i>",
            "            Xem vị trí trên Google Maps",
            "        </a>",
            "    </section>",
            "    <section class='rounded-[32px] bg-white border border-gray-100 shadow-sm p-5'>",
            "        <p class='text-[11px] uppercase tracking-[0.2em] text-gray-400 font-black'>Liên hệ nhanh</p>",
            "        <div class='grid grid-cols-2 gap-3 mt-4' id='intro-contact-links'>",
            "            <button class='rounded-2xl bg-green-50 text-green-700 py-4 font-bold text-xs hover:bg-green-100 transition' onclick='openStoreZalo()'><i class='fa-solid fa-comment-dots text-lg mb-2'></i><span class='block'>Zalo</span></button>",
            "            <button class='rounded-2xl bg-sky-50 text-sky-700 py-4 font-bold text-xs hover:bg-sky-100 transition' onclick='openStoreFacebook()'><i class='fa-brands fa-facebook-f text-lg mb-2'></i><span class='block'>Facebook</span></button>",
            "            <button class='rounded-2xl bg-violet-50 text-violet-700 py-4 font-bold text-xs hover:bg-violet-100 transition' onclick='openStoreZaloGroup()'><i class='fa-solid fa-user-group text-lg mb-2'></i><span class='block'>Nhóm Zalo</span></button>",
            "            <button class='rounded-2xl bg-amber-50 text-amber-700 py-4 font-bold text-xs hover:bg-amber-100 transition' onclick='openStoreEmail()'><i class='fa-regular fa-envelope text-lg mb-2'></i><span class='block'>Email</span></button>",
            "        </div>",
            "    </section>",
            "</aside>"
        ].join("");
    }

    function renderIntroTab() {
        const area = document.getElementById("tab-intro");
        if (!area) return;

        area.innerHTML = [
            "<div class='space-y-6'>",
            renderHero(),
            "<div class='grid gap-6 xl:grid-cols-[minmax(0,1fr),360px] items-start'>",
            "    <div class='space-y-6'>",
            renderHighlights(),
            renderGallery(),
            "    </div>",
            renderAside(),
            "</div>",
            "</div>"
        ].join("");
    }

    function fillWelcomePopup() {
        const config = getConfig();
        const popup = config.welcomePopup || {};
        const body = document.getElementById("welcome-popup-body");
        const primaryBtn = document.getElementById("welcome-popup-primary");
        const secondaryBtn = document.getElementById("welcome-popup-secondary");
        const badge = document.getElementById("welcome-popup-badge");
        const title = document.getElementById("welcome-popup-title");

        if (!body) return;

        if (badge) badge.innerText = popup.badge || "Ưu đãi đầu trang";
        if (title) title.innerText = popup.title || "Thông báo nhanh";

        body.innerHTML = [
            "<div class='rounded-[24px] bg-gradient-to-br from-pink-50 via-white to-rose-50 border border-pink-100 px-4 py-4 text-left [.dark-mode_&]:!from-[#1e293b] [.dark-mode_&]:!via-[#0f172a] [.dark-mode_&]:!to-[#1e293b] [.dark-mode_&]:!border-[#334155]'>",
            "    <p class='text-[11px] uppercase tracking-[0.22em] text-babyPink font-black mb-2'>", escapeHtml(popup.badge || "Ưu đãi đầu trang"), "</p>",
            "    <h3 class='font-extrabold text-xl text-gray-800 leading-tight'>", escapeHtml(popup.title || "Thông báo nhanh"), "</h3>",
            "    <p class='text-sm text-gray-500 leading-6 mt-3'>", escapeHtml(popup.subtitle || ""), "</p>",
            "</div>",
            Array.isArray(popup.lines) && popup.lines.length ? [
                "<div class='space-y-3 mt-4'>",
                popup.lines.map(function (line) {
                    return [
                        "<div class='flex items-start gap-3 rounded-2xl bg-white border border-gray-100 px-4 py-3 [.dark-mode_&]:!bg-[#1f2937] [.dark-mode_&]:!border-[#334155]'>",
                        "    <span class='w-8 h-8 rounded-full bg-pink-100 text-babyPink flex items-center justify-center shrink-0 [.dark-mode_&]:!bg-[#0f172a]'><i class='fa-solid fa-check'></i></span>",
                        "    <p class='text-sm text-gray-600 leading-6'>", escapeHtml(line), "</p>",
                        "</div>"
                    ].join("");
                }).join(""),
                "</div>"
            ].join("") : ""
        ].join("");

        if (primaryBtn) primaryBtn.innerText = popup.primaryLabel || "Đăng ký / Đăng nhập";
        if (secondaryBtn) secondaryBtn.innerText = popup.secondaryLabel || "Xem sản phẩm";
    }

    function maybeAutoOpenWelcomePopup(options) {
        const settings = options || {};
        const storageKey = String(settings.storageKey || "ta_welcome_popup_seen_v3");
        const delay = Math.max(Number(settings.delay || 650) || 650, 0);

        try {
            if (sessionStorage.getItem(storageKey)) return false;
            sessionStorage.setItem(storageKey, String(Date.now()));
        } catch (error) {}

        setTimeout(function () {
            if (typeof window.openWelcomePopup === "function") window.openWelcomePopup();
        }, delay);

        return true;
    }

    window.introExperienceModule = {
        render: renderIntroTab,
        fillWelcomePopup: fillWelcomePopup,
        maybeAutoOpenWelcomePopup: maybeAutoOpenWelcomePopup
    };

    window.introTabModule = {
        render: renderIntroTab
    };

    window.dispatchEvent(new Event("web-new-intro-tab-ready"));
})();