(function () {
    const SHOPEE_AFFILIATE_ID = window.SHOPEE_AFFILIATE_ID || "an_17317330043";
    const SHOPEE_VOUCHER_APP_SCHEME = window.SHOPEE_VOUCHER_APP_SCHEME || "shopeevn://main?apprl=";
    const isMobileDevice = /android|iphone|ipad|ipod/i.test(String(navigator.userAgent || "").toLowerCase());

    const BRAND_TABS = ["Shopee", "Lazada", "Tiki", "Highlands"];
    const BRAND_META = {
        Shopee: { icon: "fa-bag-shopping", accentClass: "sale-brand-shopee", ticketClass: "sale-ticket-brand-shopee", iconAccentClass: "sale-icon-shopee", buttonClass: "sale-btn-shopee" },
        Lazada: { icon: "fa-heart", accentClass: "sale-brand-lazada", ticketClass: "sale-ticket-brand-lazada", iconAccentClass: "sale-icon-lazada", buttonClass: "sale-btn-lazada" },
        Tiki: { icon: "fa-face-smile", accentClass: "sale-brand-tiki", ticketClass: "sale-ticket-brand-tiki", iconAccentClass: "sale-icon-tiki", buttonClass: "sale-btn-tiki" },
        Highlands: { icon: "fa-mug-hot", accentClass: "sale-brand-highlands", ticketClass: "sale-ticket-brand-highlands", iconAccentClass: "sale-icon-highlands", buttonClass: "sale-btn-highlands" }
    };

    const compactCampaigns = [
        { id: "freeship", icon: "fa-truck-fast", themeClass: "sale-campaign-freeship", title: "M\u00e3<br>Freeship", url: "https://shopee.vn/m/mien-phi-van-chuyen", isShopee: true },
        { id: "hoanxu", icon: "fa-coins", themeClass: "sale-campaign-cashback", title: "Ho\u00e0n<br>Xu Xtra", url: "https://shopee.vn/m/shopee-cashback", isShopee: true },
        { id: "flashsale", icon: "fa-bolt", themeClass: "sale-campaign-shopee", title: "Flash<br>Sale 1K", url: "https://shopee.vn/flash_sale", isShopee: true },
        { id: "shopeelive", icon: "fa-video", themeClass: "sale-campaign-live", title: "Shopee<br>Live", url: "https://shopee.vn/m/shopee-live", isShopee: true },
        { id: "highlands", icon: "fa-mug-hot", themeClass: "sale-campaign-highlands", title: "Voucher<br>Highlands", url: "https://shorten.asia/UguuTdSU", isShopee: false }
    ];

    const mockDataAll = {
        Shopee: [
            { id: "s1", type: "freeship", badge: "Freeship Xtra", title: "Gi\u1ea3m 15k ph\u00ed v\u1eadn chuy\u1ec3n", minSpend: "\u0110\u01a1n T\u1ed1i Thi\u1ec3u 0\u0111", exp: "S\u1eafp h\u1ebft h\u1ea1n: C\u00f2n 1 ng\u00e0y", usagePercent: 85, code: "FSAUTO001", link: "https://shopee.vn/m/mien-phi-van-chuyen" },
            { id: "s2", type: "discount", badge: "Shopee", title: "Gi\u1ea3m 10%", minSpend: "\u0110\u01a1n T\u1ed1i Thi\u1ec3u 250k", exp: "HSD: 31.03.2026", usagePercent: 40, code: "SHP10PERCENT", link: "https://shopee.vn/m/ma-giam-gia" },
            { id: "s3", type: "cashback", badge: "Ho\u00e0n Xu", title: "Ho\u00e0n 15% t\u1ed1i \u0111a 100k xu", minSpend: "\u0110\u01a1n T\u1ed1i Thi\u1ec3u 500k", exp: "HSD: 31.03.2026", usagePercent: 98, code: "HOANXU15", link: "https://shopee.vn/m/shopee-cashback" },
            { id: "s4", type: "discount", badge: "Shopee Mall", title: "Gi\u1ea3m 120k", minSpend: "\u0110\u01a1n T\u1ed1i Thi\u1ec3u 1.500k", exp: "HSD: 15.04.2026", usagePercent: 12, code: "MALL120K", link: "https://shopee.vn" }
        ],
        Lazada: [
            { id: "l1", type: "lazada", badge: "LazFlash", title: "Gi\u1ea3m 50k", minSpend: "\u0110\u01a1n T\u1ed1i Thi\u1ec3u 250k", exp: "HSD: 31.03.2026", usagePercent: 20, code: "LAZFLASH50", link: "https://lazada.vn" },
            { id: "l2", type: "lazada", badge: "Freeship", title: "Mi\u1ec5n ph\u00ed v\u1eadn chuy\u1ec3n", minSpend: "\u0110\u01a1n T\u1ed1i Thi\u1ec3u 49k", exp: "S\u1eafp h\u1ebft h\u1ea1n: 2 gi\u1edd", usagePercent: 65, code: "LAZFREE", link: "https://lazada.vn" }
        ],
        Tiki: [
            { id: "t1", type: "tiki", badge: "TikiNOW", title: "Freeship 2H", minSpend: "\u0110\u01a1n T\u1ed1i Thi\u1ec3u 100k", exp: "HSD: 31.03.2026", usagePercent: 50, code: "NOWFREE", link: "https://tiki.vn" },
            { id: "t2", type: "tiki", badge: "Astra", title: "Ho\u00e0n ti\u1ec1n 20%", minSpend: "\u0110\u01a1n T\u1ed1i Thi\u1ec3u 300k", exp: "HSD: 10.04.2026", usagePercent: 15, code: "ASTRA20", link: "https://tiki.vn" }
        ],
        Highlands: [
            { id: "h1", type: "highlands", badge: "Phindi", title: "Gi\u1ea3m 20k", minSpend: "\u00c1p d\u1ee5ng d\u00f2ng Phindi", exp: "HSD: 31.03.2026", usagePercent: 30, code: "PHINDI20K", link: "https://shorten.asia/UguuTdSU" },
            { id: "h2", type: "highlands", badge: "Highlands", title: "Mua 1 T\u1eb7ng 1", minSpend: "D\u00f2ng Tr\u00e0 / Freeze", exp: "HSD: H\u00f4m nay", usagePercent: 95, code: "M1T1FREEZE", link: "https://shorten.asia/UguuTdSU" }
        ]
    };

    let activeSaleChannel = "Shopee";
    let lastRenderedSaleChannel = "";

    function injectStyles() {
        if (document.getElementById("sale-tab-inline-styles")) return;
        const style = document.createElement("style");
        style.id = "sale-tab-inline-styles";
        style.textContent = `
            #tab-sale .sale-tab-shell {
                --sale-page-bg: #f4f6fb;
                --sale-surface: rgba(255, 255, 255, 0.94);
                --sale-surface-2: #ffffff;
                --sale-surface-soft: #f8fafc;
                --sale-border: rgba(226, 232, 240, 0.96);
                --sale-text: #172033;
                --sale-muted: #667085;
                --sale-muted-2: #94a3b8;
                --sale-shadow: 0 24px 70px rgba(15, 23, 42, 0.10);
                --sale-shadow-soft: 0 10px 32px rgba(15, 23, 42, 0.08);
                --sale-body-gap: clamp(16px, 2vw, 28px);
                padding: clamp(16px, 2.2vw, 28px);
                color: var(--sale-text);
            }
            body.dark-mode #tab-sale .sale-tab-shell {
                --sale-page-bg: #0f172a;
                --sale-surface: rgba(15, 23, 42, 0.92);
                --sale-surface-2: #111b31;
                --sale-surface-soft: #18243c;
                --sale-border: rgba(51, 65, 85, 0.96);
                --sale-text: #f8fafc;
                --sale-muted: #cbd5e1;
                --sale-muted-2: #94a3b8;
                --sale-shadow: 0 30px 80px rgba(2, 6, 23, 0.34);
                --sale-shadow-soft: 0 18px 44px rgba(2, 6, 23, 0.28);
            }
            #tab-sale .sale-tab-container {
                width: min(1320px, 100%);
                margin: 0 auto;
            }
            #tab-sale .sale-hero {
                position: relative;
                overflow: hidden;
                border-radius: 30px;
                padding: clamp(24px, 4vw, 46px);
                background: linear-gradient(135deg, #ff7b3e 0%, #ee4d2d 56%, #d13b21 100%);
                box-shadow: var(--sale-shadow);
            }
            #tab-sale .sale-hero-orb {
                position: absolute;
                border-radius: 999px;
                pointer-events: none;
                opacity: .18;
                filter: blur(28px);
                animation: saleFloat 5s ease-in-out infinite;
            }
            #tab-sale .sale-hero-orb.orb-a { width: 230px; height: 230px; top: -40px; right: -35px; background: #fff; }
            #tab-sale .sale-hero-orb.orb-b { width: 170px; height: 170px; left: 5%; bottom: -55px; background: #fde68a; animation-delay: 1s; }
            #tab-sale .sale-hero-row {
                position: relative;
                z-index: 1;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 18px;
            }
            #tab-sale .sale-hero-chip {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                width: fit-content;
                margin-bottom: 18px;
                padding: 8px 14px;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,.16);
                background: rgba(255,255,255,.18);
                color: #fff;
                box-shadow: 0 10px 28px rgba(0,0,0,.10);
                backdrop-filter: blur(14px);
                font-size: 12px;
                font-weight: 800;
                letter-spacing: .18em;
                text-transform: uppercase;
            }
            #tab-sale .sale-hero-chip-dot {
                width: 8px;
                height: 8px;
                border-radius: 999px;
                background: #86efac;
                box-shadow: 0 0 12px rgba(134, 239, 172, 0.9);
            }
            #tab-sale .sale-hero-badge {
                flex: 0 0 auto;
                width: clamp(64px, 9vw, 82px);
                height: clamp(64px, 9vw, 82px);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 24px;
                border: 1px solid rgba(255,255,255,.18);
                background: rgba(255,255,255,.18);
                color: #fff4cc;
                box-shadow: inset 0 1px 0 rgba(255,255,255,.18);
                backdrop-filter: blur(12px);
                font-size: clamp(30px, 4vw, 38px);
            }
            #tab-sale .sale-hero-copy { min-width: 0; }
            #tab-sale .sale-hero-title {
                margin: 0 0 6px;
                color: #fff;
                font-size: clamp(34px, 6vw, 60px);
                font-weight: 900;
                line-height: .98;
                letter-spacing: -.03em;
                text-shadow: 0 10px 28px rgba(0,0,0,.16);
            }
            #tab-sale .sale-hero-subtitle {
                margin: 0;
                color: rgba(255,255,255,.94);
                font-size: clamp(15px, 1.9vw, 24px);
                font-weight: 600;
            }
            #tab-sale .sale-brand-strip {
                position: sticky;
                top: 0;
                z-index: 20;
                margin: -26px auto 0;
                padding: 0 clamp(8px, 2vw, 18px);
            }
            #tab-sale .sale-brand-strip-inner {
                width: min(1040px, 100%);
                margin: 0 auto;
                padding: 14px;
                border: 1px solid var(--sale-border);
                border-radius: 26px;
                background: var(--sale-surface);
                box-shadow: var(--sale-shadow-soft);
                backdrop-filter: blur(18px);
            }
            #tab-sale .sale-brand-tabs {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 12px;
            }
            #tab-sale .sale-brand-tab {
                border: 1px solid transparent;
                border-radius: 999px;
                padding: 11px 20px;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: var(--sale-surface-soft);
                color: var(--sale-muted);
                box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.10);
                cursor: pointer;
                font-size: 14px;
                font-weight: 800;
                transition: transform .2s ease, background-color .2s ease, color .2s ease, box-shadow .2s ease, border-color .2s ease;
            }
            #tab-sale .sale-brand-tab:hover {
                transform: translateY(-1px);
                color: var(--sale-text);
                background: #eef2ff;
            }
            body.dark-mode #tab-sale .sale-brand-tab {
                background: #162235;
                color: #e8eef8;
                box-shadow: inset 0 0 0 1px rgba(71, 85, 105, 0.70), 0 12px 28px rgba(2, 6, 23, 0.22);
            }
            body.dark-mode #tab-sale .sale-brand-tab:hover { background: #22304e; }
            #tab-sale .sale-brand-tab i { font-size: 14px; }
            #tab-sale .sale-brand-tab.is-active { color: #fff; transform: translateY(-1px); }
            #tab-sale .sale-brand-tab.sale-brand-shopee.is-active {
                background: linear-gradient(135deg, #ff7b3e, #ee4d2d);
                border-color: rgba(238, 77, 45, 0.55);
                box-shadow: 0 14px 32px rgba(238, 77, 45, 0.28);
            }
            #tab-sale .sale-brand-tab.sale-brand-lazada.is-active {
                background: linear-gradient(135deg, #4a2dc5, #e24693);
                border-color: rgba(226, 70, 147, 0.42);
                box-shadow: 0 14px 32px rgba(105, 57, 196, 0.24);
            }
            #tab-sale .sale-brand-tab.sale-brand-tiki.is-active {
                background: linear-gradient(135deg, #1a94ff, #0d6efd);
                border-color: rgba(26, 148, 255, 0.46);
                box-shadow: 0 14px 32px rgba(26, 148, 255, 0.24);
            }
            #tab-sale .sale-brand-tab.sale-brand-highlands.is-active {
                background: linear-gradient(135deg, #aa2c36, #68412c);
                border-color: rgba(170, 44, 54, 0.5);
                box-shadow: 0 14px 32px rgba(104, 65, 44, 0.28);
            }
            #tab-sale .sale-tab-content {
                display: grid;
                gap: var(--sale-body-gap);
                margin-top: 24px;
            }
            #tab-sale .sale-panel {
                border: 1px solid var(--sale-border);
                border-radius: 28px;
                background: var(--sale-surface);
                box-shadow: var(--sale-shadow-soft);
            }
            #tab-sale .sale-campaign-panel {
                padding: clamp(14px, 2vw, 24px);
            }
            #tab-sale .sale-campaign-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: clamp(12px, 1.6vw, 20px);
            }
            #tab-sale .sale-campaign-card {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                gap: 8px;
                text-align: center;
                cursor: pointer;
                color: var(--sale-text);
            }
            #tab-sale .sale-campaign-card:hover .sale-campaign-icon {
                transform: translateY(-2px);
            }
            #tab-sale .sale-campaign-icon {
                width: clamp(48px, 5vw, 62px);
                height: clamp(48px, 5vw, 62px);
                border-radius: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 10px 24px rgba(15, 23, 42, 0.08);
                transition: transform .2s ease;
                font-size: clamp(18px, 2vw, 26px);
            }
            #tab-sale .sale-campaign-label {
                font-size: 12px;
                line-height: 1.2;
                font-weight: 800;
                color: var(--sale-muted);
            }
            #tab-sale .sale-campaign-freeship .sale-campaign-icon { background: rgba(0, 191, 165, 0.14); color: #00a78f; }
            #tab-sale .sale-campaign-cashback .sale-campaign-icon { background: rgba(246, 167, 0, 0.14); color: #d89200; }
            #tab-sale .sale-campaign-shopee .sale-campaign-icon { background: rgba(238, 77, 45, 0.14); color: #ee4d2d; }
            #tab-sale .sale-campaign-live .sale-campaign-icon { background: rgba(236, 72, 153, 0.14); color: #db2777; }
            #tab-sale .sale-campaign-highlands .sale-campaign-icon { background: rgba(178, 40, 48, 0.14); color: #8b1e25; }
            body.dark-mode #tab-sale .sale-campaign-freeship .sale-campaign-icon { background: rgba(45, 212, 191, 0.16); color: #5eead4; }
            body.dark-mode #tab-sale .sale-campaign-cashback .sale-campaign-icon { background: rgba(250, 204, 21, 0.18); color: #fde68a; }
            body.dark-mode #tab-sale .sale-campaign-shopee .sale-campaign-icon { background: rgba(249, 115, 22, 0.16); color: #fdba74; }
            body.dark-mode #tab-sale .sale-campaign-live .sale-campaign-icon { background: rgba(236, 72, 153, 0.18); color: #f9a8d4; }
            body.dark-mode #tab-sale .sale-campaign-highlands .sale-campaign-icon { background: rgba(248, 113, 113, 0.16); color: #fecaca; }
            body.dark-mode #tab-sale .sale-campaign-label { color: #d7deea; }
            #tab-sale .sale-section-title {
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0;
                color: var(--sale-text);
                font-size: clamp(18px, 2.1vw, 26px);
                font-weight: 900;
                letter-spacing: -.02em;
                text-transform: uppercase;
            }
            #tab-sale .sale-section-title i.sale-icon-shopee { color: #ee4d2d; }
            #tab-sale .sale-section-title i.sale-icon-lazada { color: #c23393; }
            #tab-sale .sale-section-title i.sale-icon-tiki { color: #0f82ff; }
            #tab-sale .sale-section-title i.sale-icon-highlands { color: #933136; }
            #tab-sale .sale-voucher-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: clamp(16px, 2vw, 24px);
            }
            #tab-sale .sale-empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 14px;
                min-height: 260px;
                padding: 28px;
                border-radius: 26px;
                border: 1px solid var(--sale-border);
                background: var(--sale-surface);
                box-shadow: var(--sale-shadow-soft);
                color: var(--sale-muted);
            }
            #tab-sale .sale-empty-state i { font-size: 48px; opacity: .55; }
            #tab-sale .sale-ticket {
                position: relative;
                display: flex;
                min-height: 148px;
                overflow: hidden;
                border: 1px solid var(--sale-border);
                border-radius: 26px;
                background: var(--sale-surface-2);
                box-shadow: var(--sale-shadow-soft);
                transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
            }
            #tab-sale .sale-ticket:hover {
                transform: translateY(-3px);
                box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
            }
            body.dark-mode #tab-sale .sale-ticket:hover { box-shadow: 0 20px 44px rgba(2, 6, 23, 0.34); }
            #tab-sale .sale-ticket-left {
                position: relative;
                width: 126px;
                flex: 0 0 126px;
                padding: 16px 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                overflow: hidden;
            }
            #tab-sale .sale-ticket-left::after {
                content: "";
                position: absolute;
                top: 0;
                right: -6px;
                bottom: 0;
                width: 8px;
                background-image: radial-gradient(circle at 8px 12px, var(--sale-surface-2) 5px, transparent 5.5px);
                background-size: 8px 22px;
            }
            #tab-sale .sale-ticket-brand-shopee { background: linear-gradient(135deg, #ff7b3e, #ee4d2d); }
            #tab-sale .sale-ticket-brand-lazada { background: linear-gradient(135deg, #4a2dc5, #e24693); }
            #tab-sale .sale-ticket-brand-tiki { background: linear-gradient(135deg, #1a94ff, #0fd4ff); }
            #tab-sale .sale-ticket-brand-highlands { background: linear-gradient(135deg, #aa2c36, #6a4430); }
            #tab-sale .sale-ticket-brand-freeship { background: linear-gradient(135deg, #00bfa5, #00cca4); }
            #tab-sale .sale-ticket-brand-cashback { background: linear-gradient(135deg, #f6a700, #ffb81c); }
            #tab-sale .sale-ticket-watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-8deg);
                opacity: .20;
                font-size: 66px;
                pointer-events: none;
            }
            #tab-sale .sale-ticket-badge {
                position: relative;
                z-index: 1;
                margin-bottom: 6px;
                font-size: 11px;
                line-height: 1.15;
                font-weight: 900;
                text-align: center;
                letter-spacing: .08em;
                text-transform: uppercase;
            }
            #tab-sale .sale-ticket-value-label {
                position: relative;
                z-index: 1;
                font-size: 13px;
                font-weight: 700;
                opacity: .92;
            }
            #tab-sale .sale-ticket-value {
                position: relative;
                z-index: 1;
                margin-top: 4px;
                font-size: 36px;
                line-height: .9;
                font-weight: 900;
                letter-spacing: -.04em;
                text-align: center;
                word-break: break-word;
            }
            #tab-sale .sale-ticket-divider {
                position: absolute;
                top: 0;
                bottom: 0;
                left: 126px;
                width: 0;
                border-left: 2px dashed rgba(148, 163, 184, 0.26);
                z-index: 2;
            }
            #tab-sale .sale-ticket-divider::before,
            #tab-sale .sale-ticket-divider::after {
                content: "";
                position: absolute;
                left: -8px;
                width: 16px;
                height: 16px;
                border-radius: 999px;
                background: var(--sale-page-bg);
                border: 1px solid var(--sale-border);
            }
            #tab-sale .sale-ticket-divider::before { top: -8px; }
            #tab-sale .sale-ticket-divider::after { bottom: -8px; }
            #tab-sale .sale-ticket-body {
                flex: 1;
                min-width: 0;
                padding: 16px 18px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                gap: 12px;
                background: var(--sale-surface-2);
            }
            #tab-sale .sale-ticket-title {
                margin: 0;
                color: var(--sale-text);
                font-size: 16px;
                line-height: 1.35;
                font-weight: 800;
                transition: color .2s ease;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
            }
            #tab-sale .sale-ticket:hover .sale-ticket-title { color: #ee4d2d; }
            #tab-sale .sale-ticket-min {
                margin: 8px 0 0;
                font-size: 12px;
                font-weight: 600;
                color: var(--sale-muted);
            }
            #tab-sale .sale-ticket-meta {
                display: flex;
                align-items: end;
                justify-content: space-between;
                gap: 14px;
            }
            #tab-sale .sale-ticket-exp {
                margin: 0 0 8px;
                color: var(--sale-muted);
                font-size: 12px;
                font-weight: 700;
            }
            #tab-sale .sale-ticket-exp.is-urgent { color: #ee4d2d; }
            #tab-sale .sale-ticket-progress {
                height: 6px;
                border-radius: 999px;
                background: rgba(248, 113, 113, 0.18);
                overflow: hidden;
            }
            #tab-sale .sale-ticket-progress-fill {
                height: 100%;
                border-radius: 999px;
                background: #f59e0b;
            }
            #tab-sale .sale-ticket-progress-fill.is-danger { background: #ef4444; }
            #tab-sale .sale-ticket-progress-label {
                display: block;
                margin-top: 6px;
                color: var(--sale-muted);
                font-size: 11px;
                font-weight: 700;
                white-space: nowrap;
            }
            #tab-sale .sale-ticket-action {
                flex: 0 0 auto;
                min-width: 84px;
                padding: 12px 18px;
                border: 1px solid transparent;
                border-radius: 999px;
                color: #fff;
                font-size: 12px;
                font-weight: 900;
                line-height: 1;
                box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
                transition: transform .18s ease, opacity .18s ease, filter .18s ease;
            }
            #tab-sale .sale-ticket-action:hover { filter: brightness(1.04); }
            #tab-sale .sale-ticket-action:active { transform: scale(.97); }
            #tab-sale .sale-ticket-action.sale-btn-shopee { background: linear-gradient(135deg, #ff7b3e, #ee4d2d); box-shadow: 0 12px 24px rgba(238, 77, 45, 0.24); }
            #tab-sale .sale-ticket-action.sale-btn-lazada { background: linear-gradient(135deg, #4a2dc5, #e24693); box-shadow: 0 12px 24px rgba(105, 57, 196, 0.24); }
            #tab-sale .sale-ticket-action.sale-btn-tiki { background: linear-gradient(135deg, #1a94ff, #0d6efd); box-shadow: 0 12px 24px rgba(26, 148, 255, 0.24); }
            #tab-sale .sale-ticket-action.sale-btn-highlands { background: linear-gradient(135deg, #aa2c36, #6a4430); box-shadow: 0 12px 24px rgba(106, 68, 48, 0.24); }
            body.dark-mode #tab-sale .sale-ticket-action:not(.is-disabled) {
                border-color: rgba(255, 255, 255, 0.16);
                box-shadow: 0 16px 30px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.14);
                filter: saturate(1.08) brightness(1.04);
            }
            #tab-sale .sale-ticket-action.is-disabled {
                background: #e5e7eb;
                color: #9ca3af;
                box-shadow: none;
                cursor: not-allowed;
            }
            body.dark-mode #tab-sale .sale-ticket-action.is-disabled {
                background: #243145;
                color: #94a3b8;
            }
            #tab-sale .sale-toast {
                background: rgba(15, 23, 42, 0.88);
                color: #fff;
                padding: 12px 24px;
                border-radius: 14px;
                box-shadow: 0 20px 44px rgba(15, 23, 42, 0.22);
                backdrop-filter: blur(10px);
                pointer-events: auto;
            }
            @keyframes saleFloat {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-10px) scale(1.04); }
            }
            @media (max-width: 1024px) {
                #tab-sale .sale-voucher-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
            }
            @media (max-width: 767px) {
                #tab-sale .sale-tab-shell { padding: 14px; }
                #tab-sale .sale-hero { border-radius: 26px; padding: 22px 18px 30px; }
                #tab-sale .sale-hero-row { gap: 14px; }
                #tab-sale .sale-hero-badge { border-radius: 20px; }
                #tab-sale .sale-brand-strip { margin-top: -22px; padding: 0 6px; }
                #tab-sale .sale-brand-strip-inner { border-radius: 24px; padding: 12px; }
                #tab-sale .sale-brand-tabs {
                    flex-wrap: nowrap;
                    justify-content: flex-start;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                #tab-sale .sale-brand-tabs::-webkit-scrollbar { display: none; }
                #tab-sale .sale-brand-tab { white-space: nowrap; padding: 10px 16px; }
                #tab-sale .sale-campaign-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
                #tab-sale .sale-ticket { min-height: 138px; }
                #tab-sale .sale-ticket-left {
                    width: 108px;
                    flex-basis: 108px;
                    padding: 14px 10px;
                }
                #tab-sale .sale-ticket-divider { left: 108px; }
                #tab-sale .sale-ticket-body { padding: 14px; gap: 10px; }
                #tab-sale .sale-ticket-title { font-size: 14px; }
                #tab-sale .sale-ticket-value { font-size: 30px; }
                #tab-sale .sale-ticket-action { min-width: 74px; padding: 11px 14px; }
            }
            @media (max-width: 560px) {
                #tab-sale .sale-ticket { min-height: 0; }
                #tab-sale .sale-ticket-meta {
                    align-items: flex-start;
                    gap: 12px;
                }
                #tab-sale .sale-ticket-action { align-self: center; }
                #tab-sale .sale-ticket-value { font-size: 28px; }
            }
        `;
        document.head.appendChild(style);
    }

    function showSaleToast(message) {
        const container = document.getElementById("toast-container");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = "sale-toast transition-opacity duration-300 opacity-0 font-medium shadow-lg flex items-center gap-2";
        toast.innerHTML = `<i class="fa-solid fa-check-circle text-green-400"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.remove("opacity-0"), 10);
        setTimeout(() => {
            toast.classList.add("opacity-0");
            setTimeout(() => toast.remove(), 300);
        }, 2200);
    }

    function openDeepLink(rawUrl, isShopee) {
        let finalWebUrl = rawUrl;
        if (isShopee && !String(rawUrl || "").includes("shorten.asia")) {
            const separator = rawUrl.includes("?") ? "&" : "?";
            finalWebUrl = `${rawUrl}${separator}utm_medium=affiliates&utm_source=${SHOPEE_AFFILIATE_ID}&mmp_pid=${SHOPEE_AFFILIATE_ID}`;
        }
        const schemeLink = isShopee ? `${SHOPEE_VOUCHER_APP_SCHEME}${encodeURIComponent(finalWebUrl)}` : finalWebUrl;
        if (isMobileDevice && isShopee) {
            window.location.href = schemeLink;
            setTimeout(() => {
                if (document.visibilityState === "visible") {
                    window.open(finalWebUrl, "_blank", "noopener");
                }
            }, 1500);
            return;
        }
        window.open(finalWebUrl, "_blank", "noopener");
    }

    function copyToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand("copy");
            return true;
        } catch (err) {
            return false;
        } finally {
            textArea.remove();
        }
    }

    function getBrandMeta(channelName) {
        return BRAND_META[channelName] || BRAND_META.Shopee;
    }

    function getTicketThemeClass(voucher) {
        if (voucher.type === "freeship") return "sale-ticket-brand-freeship";
        if (voucher.type === "cashback") return "sale-ticket-brand-cashback";
        if (voucher.type === "lazada") return "sale-ticket-brand-lazada";
        if (voucher.type === "tiki") return "sale-ticket-brand-tiki";
        if (voucher.type === "highlands") return "sale-ticket-brand-highlands";
        return getBrandMeta(activeSaleChannel).ticketClass;
    }

    function getVoucherValueParts(voucher) {
        let label = "Gi\u1ea3m";
        let value = voucher.title.replace(/Gi\u1ea3m |Ho\u00e0n |Mi\u1ec5n ph\u00ed v\u1eadn chuy\u1ec3n/i, "");
        if (voucher.type === "freeship") {
            label = "M\u00e3";
            value = "Freeship";
        } else if (voucher.type === "cashback") {
            label = "Ho\u00e0n";
        }
        if (value.length > 8) value = "HOT";
        return { label, value };
    }

    window.saleTabOpenDeepLink = openDeepLink;
    window.saleTabCopyAndGoToApp = function (code, rawUrl, channel) {
        copyToClipboard(code);
        showSaleToast(`\u0110\u00e3 l\u01b0u m\u00e3: ${code}`);
        openDeepLink(rawUrl, channel === "Shopee");
    };

    function ensureSaleShell() {
        const tabSale = document.getElementById("tab-sale");
        if (!tabSale) return false;
        if (tabSale.querySelector("[data-sale-shell]")) return true;
        tabSale.innerHTML = `
            <div class="sale-tab-shell" data-sale-shell="1">
                <div class="sale-tab-container">
                    <section class="sale-hero">
                        <div class="sale-hero-orb orb-a"></div>
                        <div class="sale-hero-orb orb-b"></div>
                        <div class="sale-hero-chip">
                            <span class="sale-hero-chip-dot"></span>
                            <span>C\u1eadp Nh\u1eadt T\u1ef1 \u0110\u1ed9ng</span>
                        </div>
                        <div class="sale-hero-row">
                            <div class="sale-hero-badge">
                                <i class="fa-solid fa-gift"></i>
                            </div>
                            <div class="sale-hero-copy">
                                <h1 class="sale-hero-title">TR\u1ea0M S\u0102N DEAL</h1>
                                <p class="sale-hero-subtitle">M\u1edf app l\u01b0u m\u00e3 \u01b0u \u0111\u00e3i \u0111\u1ed9c quy\u1ec1n m\u1ed7i ng\u00e0y</p>
                            </div>
                        </div>
                    </section>
                    <div class="sale-brand-strip">
                        <div class="sale-brand-strip-inner">
                            <div class="sale-brand-tabs" id="shopee-tabs"></div>
                        </div>
                    </div>
                    <div class="sale-tab-content">
                        <section id="compact-campaign-container"></section>
                        <section class="sale-vouchers-section">
                            <div class="mb-1 px-1">
                                <h2 class="sale-section-title" id="voucher-title"></h2>
                            </div>
                            <div class="sale-voucher-grid" id="shopee-voucher-list"></div>
                        </section>
                    </div>
                </div>
            </div>
        `;
        return true;
    }

    function renderTabs() {
        const container = document.getElementById("shopee-tabs");
        if (!container) return;
        container.innerHTML = BRAND_TABS.map((tab) => {
            const meta = getBrandMeta(tab);
            const isActive = tab === activeSaleChannel;
            return `
                <button type="button" class="sale-brand-tab ${meta.accentClass} ${isActive ? "is-active" : ""}" onclick="window.setSaleChannel('${tab}')">
                    <i class="fa-solid ${meta.icon}"></i>
                    <span>${tab}</span>
                </button>
            `;
        }).join("");
    }

    function renderCompactCampaigns() {
        const container = document.getElementById("compact-campaign-container");
        if (!container) return;
        if (activeSaleChannel !== "Shopee") {
            container.innerHTML = "";
            return;
        }
        container.innerHTML = `
            <div class="sale-panel sale-campaign-panel">
                <div class="sale-campaign-grid">
                    ${compactCampaigns.map((campaign) => `
                        <div class="sale-campaign-card ${campaign.themeClass}" onclick="window.saleTabOpenDeepLink('${campaign.url}', ${campaign.isShopee})">
                            <div class="sale-campaign-icon">
                                <i class="fa-solid ${campaign.icon}"></i>
                            </div>
                            <div class="sale-campaign-label">${campaign.title}</div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }

    function renderEmptyState(channelName) {
        return `
            <div class="sale-empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <p>Ch\u01b0a c\u00f3 m\u00e3 gi\u1ea3m gi\u00e1 cho ${channelName}</p>
            </div>
        `;
    }

    function renderVouchers() {
        const container = document.getElementById("shopee-voucher-list");
        const titleContainer = document.getElementById("voucher-title");
        if (!container || !titleContainer) return;
        const vouchersData = mockDataAll[activeSaleChannel] || [];
        const activeMeta = getBrandMeta(activeSaleChannel);
        titleContainer.innerHTML = `
            <i class="fa-solid fa-fire ${activeMeta.iconAccentClass}"></i>
            <span>\u0110\u1ea1i Ti\u1ec7c Voucher ${activeSaleChannel}</span>
        `;
        if (!vouchersData.length) {
            container.innerHTML = renderEmptyState(activeSaleChannel);
            return;
        }
        container.innerHTML = vouchersData.map((voucher) => {
            const valueParts = getVoucherValueParts(voucher);
            const isOutOfStock = voucher.usagePercent >= 100;
            const isUrgent = voucher.exp.includes("S\u1eafp");
            const ticketThemeClass = getTicketThemeClass(voucher);
            const progressClass = voucher.usagePercent > 80 ? "is-danger" : "";
            const actionClass = isOutOfStock ? "is-disabled" : activeMeta.buttonClass;
            const buttonText = isOutOfStock ? "H\u1ebft m\u00e3" : "L\u01b0u";
            let progressHtml = "";
            if (voucher.usagePercent > 0 && !isOutOfStock) {
                progressHtml = `
                    <div class="sale-ticket-progress">
                        <div class="sale-ticket-progress-fill ${progressClass}" style="width: ${voucher.usagePercent}%"></div>
                    </div>
                    <span class="sale-ticket-progress-label">\u0110\u00e3 d\u00f9ng ${voucher.usagePercent}%</span>
                `;
            }
            return `
                <div class="sale-ticket group cursor-pointer" onclick="${isOutOfStock ? "" : `window.saleTabCopyAndGoToApp('${voucher.code}', '${voucher.link}', '${activeSaleChannel}')`}">
                    <div class="sale-ticket-left ${ticketThemeClass}">
                        <i class="fa-solid ${activeMeta.icon} sale-ticket-watermark"></i>
                        <div class="relative z-[1] flex flex-col items-center w-full">
                            <span class="sale-ticket-badge">${voucher.badge}</span>
                            <span class="sale-ticket-value-label">${valueParts.label}</span>
                            <span class="sale-ticket-value">${valueParts.value}</span>
                        </div>
                    </div>
                    <div class="sale-ticket-divider"></div>
                    <div class="sale-ticket-body">
                        <div>
                            <h3 class="sale-ticket-title">${voucher.title}</h3>
                            <p class="sale-ticket-min">${voucher.minSpend}</p>
                        </div>
                        <div class="sale-ticket-meta">
                            <div class="min-w-0 flex-1">
                                <p class="sale-ticket-exp ${isUrgent ? "is-urgent" : ""}">${voucher.exp}</p>
                                ${progressHtml}
                            </div>
                            <button type="button" class="sale-ticket-action ${actionClass}">${buttonText}</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderSaleTab(options) {
        if (!ensureSaleShell()) return;
        const forceRender = !!(options && options.force);
        if (!forceRender && lastRenderedSaleChannel === activeSaleChannel) return;
        renderTabs();
        renderCompactCampaigns();
        renderVouchers();
        lastRenderedSaleChannel = activeSaleChannel;
    }

    window.setSaleChannel = function (channelName) {
        const nextChannel = String(channelName || "Shopee").trim() || "Shopee";
        if (nextChannel === activeSaleChannel && lastRenderedSaleChannel === nextChannel) return;
        activeSaleChannel = nextChannel;
        renderSaleTab({ force: true });
    };

    const saleTabModule = {
        ensureStyles() {
            injectStyles();
        },
        mount() {
            this.ensureStyles();
            return document.getElementById("tab-sale");
        },
        render() {
            this.ensureStyles();
            renderSaleTab(arguments[0]);
        },
        destroy() {
            const host = document.getElementById("tab-sale");
            if (!host) return;
            host.innerHTML = "";
            lastRenderedSaleChannel = "";
        }
    };

    window.saleTabFeature = {
        ensureStyles: saleTabModule.ensureStyles.bind(saleTabModule),
        mount: saleTabModule.mount.bind(saleTabModule),
        render: saleTabModule.render.bind(saleTabModule),
        destroy: saleTabModule.destroy.bind(saleTabModule),
        module: saleTabModule
    };
    window.saleTabModule = saleTabModule;
    window.dispatchEvent(new Event("web-new-sale-tab-ready"));
})();
