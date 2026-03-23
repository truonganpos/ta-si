(function () {
    const SHOPEE_AFFILIATE_ID = window.SHOPEE_AFFILIATE_ID || "an_17317330043";
    const SHOPEE_VOUCHER_APP_SCHEME = window.SHOPEE_VOUCHER_APP_SCHEME || "shopeevn://main?apprl=";

    let activeSaleChannel = "Shopee";

    // Kho chiến dịch evergreen để khách luôn có một lý do hợp lý bấm vào link Shopee.
    window.EVERGREEN_CAMPAIGNS_DATA = window.EVERGREEN_CAMPAIGNS_DATA || [
        {
            id: "shopee-freeship",
            channel: "Shopee",
            badge: "FREESHIP XTRA",
            title: "Kho Mã Miễn Phí Vận Chuyển",
            desc: "Lưu mã Freeship mỗi ngày, áp dụng cho nhiều mức đơn và ngành hàng khác nhau.",
            rawUrl: "https://shopee.vn/m/mien-phi-van-chuyen",
            icon: "fa-truck-fast",
            color: "from-emerald-400 to-teal-500",
            actionText: "Vào Kho Freeship"
        },
        {
            id: "shopee-hoanxu",
            channel: "Shopee",
            badge: "HOÀN XU XTRA",
            title: "Trạm Hoàn Xu Xtra",
            desc: "Săn hoàn xu vào các khung giờ đẹp để tăng tỷ lệ chốt đơn trên app Shopee.",
            rawUrl: "https://shopee.vn/m/shopee-cashback",
            icon: "fa-coins",
            color: "from-amber-400 to-orange-500",
            actionText: "Săn Xu Ngay"
        },
        {
            id: "shopee-flashsale",
            channel: "Shopee",
            badge: "DEAL 1K - 9K",
            title: "Flash Sale Chớp Nhoáng",
            desc: "Cập nhật liên tục các deal hot cho mẹ và bé, đồ chơi và quà tặng.",
            rawUrl: "https://shopee.vn/flash_sale",
            icon: "fa-bolt",
            color: "from-red-500 to-pink-500",
            actionText: "Săn Deal 1K"
        },
        {
            id: "shopee-live",
            channel: "Shopee",
            badge: "SHOPEE LIVE",
            title: "Cổng Shopee Live Deal",
            desc: "Đưa khách vào Shopee Live để săn deal sốc, combo live và ưu đãi theo phiên.",
            rawUrl: "https://shopee.vn/m/shopee-live",
            icon: "fa-tower-broadcast",
            color: "from-violet-500 to-fuchsia-500",
            actionText: "Mở Live Deal"
        }
    ];

    function safeParse(raw, fallbackValue) {
        try {
            return JSON.parse(raw);
        } catch (error) {
            return fallbackValue;
        }
    }

    function showToast(message, type) {
        if (typeof window.showToast === "function") {
            window.showToast(message, type);
        }
    }

    function getAffiliateCustomerUid() {
        const storedUser = safeParse(localStorage.getItem("ta_user"), null);
        if (storedUser && storedUser.authUid) return String(storedUser.authUid).trim();

        const storedCustomerId = safeParse(localStorage.getItem("ta_customer_id_v1"), "");
        if (storedCustomerId) return String(storedCustomerId).trim();

        return "guest_" + Date.now();
    }

    function generateShopeeAffiliateLink(rawUrl, customerUid) {
        const separator = String(rawUrl || "").includes("?") ? "&" : "?";
        const trackingParams = `utm_medium=affiliates&utm_source=${SHOPEE_AFFILIATE_ID}&mmp_pid=${SHOPEE_AFFILIATE_ID}&utm_content=${customerUid}`;
        return String(rawUrl || "").trim() + separator + trackingParams;
    }

    function getSaleCampaignCollections() {
        return {
            Shopee: Array.isArray(window.EVERGREEN_CAMPAIGNS_DATA) ? window.EVERGREEN_CAMPAIGNS_DATA : [],
            Lazada: [],
            Tiki: [],
            "Highland Cafe": []
        };
    }

    window.openCampaignPortal = function (campaignId) {
        const collections = getSaleCampaignCollections();
        const campaigns = collections.Shopee;
        const campaign = campaigns.find((item) => String(item.id) === String(campaignId));

        if (!campaign) {
            showToast("Không tìm thấy chiến dịch này.", "warning");
            return;
        }

        const customerUid = getAffiliateCustomerUid();
        const affiliateLink = generateShopeeAffiliateLink(campaign.rawUrl, customerUid);
        const schemeLink = SHOPEE_VOUCHER_APP_SCHEME + encodeURIComponent(affiliateLink);
        const isMobile = /android|iphone|ipad|ipod/i.test(String(navigator.userAgent || "").toLowerCase());

        showToast("Đang đưa bạn đến " + campaign.title + "...", "info");

        if (!isMobile) {
            setTimeout(() => window.open(affiliateLink, "_blank", "noopener"), 500);
            return;
        }

        let fallbackTriggered = false;
        const fallbackTimer = window.setTimeout(() => {
            if (document.visibilityState === "visible") {
                fallbackTriggered = true;
                window.location.href = affiliateLink;
            }
        }, 900);

        setTimeout(() => {
            window.location.href = schemeLink;
        }, 300);

        window.setTimeout(() => {
            if (!fallbackTriggered) window.clearTimeout(fallbackTimer);
        }, 2200);
    };

    function ensureSaleShell() {
        const tabSale = document.getElementById("tab-sale");
        if (!tabSale) return false;

        tabSale.innerHTML = `
            <div class="bg-gradient-to-r from-red-500 to-babyPink rounded-xl p-5 text-white shadow-md flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold mb-1">Trạm Săn Deal</h2>
                    <p class="text-sm opacity-90">Cập nhật các đặc quyền tốt nhất mỗi ngày</p>
                </div>
                <i class="fa-solid fa-gift text-5xl opacity-80 transform -rotate-12"></i>
            </div>
            <div class="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1" id="sale-channel-list"></div>
            <h3 class="font-bold text-lg mb-3 mt-2">Cổng Ưu Đãi Độc Quyền</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="campaign-list"></div>
        `;
        return true;
    }

    function renderSaleChannels() {
        const channels = [
            { name: "Shopee", color: "from-orange-500 to-orange-400", icon: "fa-store" },
            { name: "Lazada", color: "from-blue-600 to-fuchsia-500", icon: "fa-bag-shopping" },
            { name: "Tiki", color: "from-sky-500 to-blue-500", icon: "fa-gift" },
            { name: "Highland Cafe", color: "from-amber-700 to-orange-500", icon: "fa-mug-hot" }
        ];
        const container = document.getElementById("sale-channel-list");
        if (!container) return;

        container.innerHTML = channels.map((channel) => {
            const active = channel.name === activeSaleChannel;
            return `
                <button class="shrink-0 rounded-full px-4 py-2.5 shadow-sm flex items-center gap-2 text-sm font-bold whitespace-nowrap transition ${active ? `bg-gradient-to-r ${channel.color} text-white` : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}" onclick="setSaleChannel('${channel.name}')">
                    <i class="fa-solid ${channel.icon} text-xs"></i>
                    <span>${channel.name}</span>
                </button>
            `;
        }).join("");
    }

    function renderCampaigns() {
        const container = document.getElementById("campaign-list");
        if (!container) return;

        const collections = getSaleCampaignCollections();
        const campaigns = Array.isArray(collections[activeSaleChannel]) ? collections[activeSaleChannel] : [];

        if (!campaigns.length) {
            container.innerHTML = `
                <div class="col-span-1 md:col-span-2 bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm text-center">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-3"><i class="fa-solid fa-box-open text-2xl"></i></div>
                    <p class="text-sm font-bold text-gray-800">${activeSaleChannel}</p>
                    <p class="text-sm text-gray-500 leading-6 mt-2 max-w-sm mx-auto">Kênh này đang được cập nhật. Vui lòng quay lại sau hoặc chuyển sang xem ưu đãi của Shopee.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = campaigns.map((camp) => `
            <div class="bg-white rounded-[24px] border border-gray-100 p-4 md:p-5 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between h-full relative overflow-hidden group cursor-pointer" onclick="openCampaignPortal('${camp.id}')">
                <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${camp.color} opacity-5 rounded-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>

                <div class="flex items-start gap-4 relative z-10">
                    <div class="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-[18px] bg-gradient-to-br ${camp.color} text-white flex items-center justify-center text-2xl md:text-3xl shadow-sm transform transition-transform group-hover:-translate-y-1">
                        <i class="fa-solid ${camp.icon}"></i>
                    </div>
                    <div class="flex-1 min-w-0 pt-1">
                        <span class="inline-block px-2 py-0.5 rounded-[6px] text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r ${camp.color} mb-1.5 shadow-sm">${camp.badge}</span>
                        <h4 class="font-extrabold text-base md:text-lg text-gray-800 leading-tight mb-1.5 group-hover:text-babyPink transition-colors">${camp.title}</h4>
                        <p class="text-xs md:text-sm text-gray-500 leading-relaxed line-clamp-2">${camp.desc}</p>
                    </div>
                </div>

                <div class="mt-5 pt-4 border-t border-dashed border-gray-100 relative z-10">
                    <button class="w-full bg-gray-50 text-gray-700 py-3 md:py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:bg-babyPink group-hover:text-white transition duration-300 shadow-sm">
                        <span>${camp.actionText}</span>
                        <i class="fa-solid fa-arrow-right text-sm transform transition-transform group-hover:translate-x-1"></i>
                    </button>
                </div>
            </div>
        `).join("");
    }

    function render() {
        if (!ensureSaleShell()) return;
        renderSaleChannels();
        renderCampaigns();
    }

    window.setSaleChannel = function (channelName) {
        activeSaleChannel = String(channelName || "Shopee").trim() || "Shopee";
        render();
    };

    window.saveVoucher = window.openCampaignPortal;

    window.saleTabModule = {
        render: render,
        openPortal: window.openCampaignPortal,
        setChannel: window.setSaleChannel,
        getData: getSaleCampaignCollections
    };

    window.dispatchEvent(new Event("web-new-sale-tab-ready"));
})();
