(function () {
    var STYLE_ID = 'ta-intro-experience-styles';
    var SHARED_MAP_URL = window.STORE_MAP_URL || 'https://maps.app.goo.gl/uvE9CiNHheZyWP55A';
    var SHARED_WAREHOUSE_LABEL = window.STORE_WAREHOUSE_LABEL || 'Di Nau - Xa Tay Phuong - TP. Ha Noi';

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            /* HERO SECTION */
            .ta-intro-hero { position: relative; border-radius: 2.5rem; overflow: hidden; background: linear-gradient(135deg, #fffafb 0%, #fff1f6 50%, #f8fbff 100%); border: 1px solid #fce7f3; box-shadow: 0 20px 40px rgba(255,143,171,0.08); }
            .ta-intro-hero-glow { position: absolute; top: -5rem; right: -5rem; width: 20rem; height: 20rem; background: radial-gradient(circle, rgba(255,143,171,0.3) 0%, transparent 70%); border-radius: 50%; filter: blur(20px); pointer-events: none; }
            
            /* THỐNG KÊ (STATS) */
            .ta-stat-box { display: flex; flex-direction: column; align-items: flex-start; padding: 1rem 1.25rem; background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.8); border-radius: 1.5rem; box-shadow: 0 8px 20px rgba(0,0,0,0.03); transition: transform 0.3s; }
            .ta-stat-box:hover { transform: translateY(-3px); }
            .ta-stat-num { font-size: 1.75rem; font-weight: 900; color: #ff6b99; line-height: 1; margin-bottom: 0.25rem; }
            .ta-stat-label { font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

            /* HIGHLIGHT CARDS */
            .ta-hl-card { padding: 1.5rem; border-radius: 2rem; background: #ffffff; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(15,23,42,0.02); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
            .ta-hl-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(255,143,171,0.1); border-color: #fce7f3; }
            .ta-hl-icon { width: 3.5rem; height: 3.5rem; border-radius: 1.2rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1.25rem; transition: transform 0.3s; }
            .ta-hl-card:hover .ta-hl-icon { transform: scale(1.1) rotate(-5deg); }

            /* GALLERY BENTO GRID */
            .ta-gallery-item { position: relative; border-radius: 2rem; overflow: hidden; display: block; }
            .ta-gallery-item img { transition: transform 0.7s ease; }
            .ta-gallery-item:hover img { transform: scale(1.05); }
            .ta-gallery-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.8) 0%, transparent 60%); opacity: 0.8; transition: opacity 0.3s; }
            .ta-gallery-item:hover .ta-gallery-overlay { opacity: 1; }

            /* APP-LIKE CONTACT BUTTONS */
            .ta-contact-btn { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem 0; border-radius: 1.5rem; transition: all 0.3s; cursor: pointer; border: 1px solid transparent; outline: none;}
            .ta-contact-btn:hover { transform: translateY(-3px); }
            .ta-app-icon { width: 3.5rem; height: 3.5rem; border-radius: 1rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; box-shadow: 0 8px 15px rgba(0,0,0,0.1); }
            .ta-btn-zalo .ta-app-icon { background: linear-gradient(135deg, #00A3FF, #0077FF); }
            .ta-btn-zalo:hover { background: #f0f9ff; border-color: #bae6fd; }
            .ta-btn-fb .ta-app-icon { background: linear-gradient(135deg, #1877F2, #0C5A9E); }
            .ta-btn-fb:hover { background: #eff6ff; border-color: #bfdbfe; }
            .ta-btn-group .ta-app-icon { background: linear-gradient(135deg, #8B5CF6, #6D28D9); }
            .ta-btn-group:hover { background: #f5f3ff; border-color: #ddd6fe; }
            .ta-btn-mail .ta-app-icon { background: linear-gradient(135deg, #F59E0B, #D97706); }
            .ta-btn-mail:hover { background: #fffbeb; border-color: #fde68a; }

            /* DARK MODE SUPPORT */
            body.dark-mode .ta-intro-hero { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-color: #334155; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
            body.dark-mode .ta-stat-box { background: rgba(15,23,42,0.6); border-color: #334155; }
            body.dark-mode .ta-hl-card { background: #111827; border-color: #334155; }
            body.dark-mode .ta-hl-card:hover { border-color: #475569; box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
            body.dark-mode .ta-contact-btn:hover { background: #1e293b; border-color: #334155; }
        `;
        document.head.appendChild(style);
    }

    function getBridge() { return window.webNewAppBridge || {}; }

    function escapeHtml(value) {
        return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    window.INTRO_EXPERIENCE_CONFIG = window.INTRO_EXPERIENCE_CONFIG || {
        hero: {
            badge: "Về Chúng Tôi",
            title: "Cùng bé lớn khôn mỗi ngày",
            description: "Trường An Store không chỉ là một siêu thị, chúng tôi là người bạn đồng hành mang đến những sản phẩm an toàn, giáo dục và chất lượng nhất cho tuổi thơ của bé.",
            primaryLabel: "Mua sắm ngay",
            secondaryLabel: "Chỉ đường",
            stats: [
                { label: "Sản phẩm", value: "5K+" },
                { label: "Khách hàng", value: "10K+" },
                { label: "Đối tác Sỉ", value: "200+" }
            ]
        },
        highlights: [
            { icon: "fa-shield-halved", color: "bg-emerald-100 text-emerald-600", title: "An toàn tuyệt đối", description: "100% sản phẩm có nguồn gốc xuất xứ rõ ràng, chất liệu an toàn cho trẻ sơ sinh." },
            { icon: "fa-cubes-stacked", color: "bg-violet-100 text-violet-600", title: "Phát triển trí tuệ", description: "Tập trung vào các dòng đồ chơi giáo dục, Montessori giúp bé phát triển toàn diện." },
            { icon: "fa-hand-holding-dollar", color: "bg-rose-100 text-rose-600", title: "Giá sỉ cạnh tranh", description: "Hỗ trợ giá sỉ siêu tốt cho CTV và đại lý nhập hàng trên toàn quốc." }
        ],
        storeInfo: {
            name: "Trường An Store",
            summary: "Siêu thị Mẹ & Bé, Đồ chơi giáo dục cao cấp.",
            address: SHARED_WAREHOUSE_LABEL,
            mapUrl: SHARED_MAP_URL,
            openHours: "08:00 - 21:30 (Thứ 2 - Chủ Nhật)"
        },
        gallery: [
            { image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1400&q=80", title: "Không gian mua sắm", caption: "Rộng rãi, thoáng mát", link: "#" },
            { image: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=800&q=80", title: "Góc đồ chơi mộc", caption: "Giáo dục Montessori", link: "#" },
            { image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80", title: "Thời trang trẻ em", caption: "Chất liệu 100% Cotton", link: "#" },
            { image: "https://images.unsplash.com/photo-1543340903-73c1b0b3c8b2?auto=format&fit=crop&w=1200&q=80", title: "Kệ sữa & Tã bỉm", caption: "Nhập khẩu chính hãng", link: "#" }
        ],
        welcomePopup: {
            title: "Món quà gặp mặt!",
            subtitle: "Đăng ký thành viên ngay hôm nay để mở khóa đặc quyền dành riêng cho bạn và bé.",
            lines: [
                "Tặng ngay Voucher 50K cho đơn hàng đầu tiên.",
                "Sỉ từ đơn hàng từ 1 triệu trở lên. Chiết khấu 1% cho đơn hàng từ 2 Triệu",
                "Tích điểm, quản lí đơn hàng minh bạch, đầy đủ."
            ],
            trustNote: "Hơn 10.000+ mẹ bỉm đã tin chọn Trường An Store",
            primaryLabel: "Đăng ký nhận quà ngay",
            secondaryLabel: "Bỏ qua ưu đãi này"
        }
    };

    function getConfig() { return window.INTRO_EXPERIENCE_CONFIG || {}; }

    function renderHero() {
        const config = getConfig();
        const hero = config.hero || {};
        const stats = hero.stats || [];
        ensureStyles();

        return `
            <section class="ta-intro-hero p-8 md:p-12 lg:p-16">
                <div class="ta-intro-hero-glow"></div>
                <div class="relative z-10 max-w-4xl">
                    <p class="text-[11px] uppercase tracking-[0.3em] text-pink-500 font-black mb-4">${escapeHtml(hero.badge)}</p>
                    <h2 class="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight mb-6">${escapeHtml(hero.title)}</h2>
                    <p class="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-2xl">${escapeHtml(hero.description)}</p>
                    
                    <div class="flex flex-wrap gap-4 mb-10">
                        <button class="bg-pink-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-[0_8px_20px_rgba(236,72,153,0.3)] hover:bg-pink-600 hover:-translate-y-1 transition-all" onclick="goToTab('tab-products')">${escapeHtml(hero.primaryLabel)}</button>
                        <a href="${escapeHtml(getConfig().storeInfo.mapUrl || '#')}" target="_blank" class="bg-white text-slate-700 border-2 border-slate-100 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-slate-50 hover:-translate-y-1 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white flex items-center gap-2"><i class="fa-solid fa-location-dot text-pink-500"></i> ${escapeHtml(hero.secondaryLabel)}</a>
                    </div>

                    <div class="flex flex-wrap gap-4">
                        ${stats.map(s => `
                            <div class="ta-stat-box">
                                <span class="ta-stat-num">${escapeHtml(s.value)}</span>
                                <span class="ta-stat-label">${escapeHtml(s.label)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    function renderHighlights() {
        const highlights = getConfig().highlights || [];
        if (!highlights.length) return "";

        return `
            <section class="grid md:grid-cols-3 gap-5">
                ${highlights.map(item => `
                    <article class="ta-hl-card">
                        <div class="ta-hl-icon ${escapeHtml(item.color)}"><i class="fa-solid ${escapeHtml(item.icon)}"></i></div>
                        <h3 class="font-black text-slate-800 dark:text-white text-xl mb-3">${escapeHtml(item.title)}</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">${escapeHtml(item.description)}</p>
                    </article>
                `).join('')}
            </section>
        `;
    }

    function renderGallery() {
        const bridge = getBridge();
        const gallery = getConfig().gallery || [];
        if (!gallery.length) return "";

        return `
            <section class="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div class="mb-6">
                    <p class="text-[11px] uppercase tracking-[0.2em] text-pink-500 font-black mb-1">Không gian</p>
                    <h3 class="font-black text-2xl text-slate-800 dark:text-white">Thư viện ảnh</h3>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${gallery.map((item, idx) => {
                        const colSpan = idx === 0 ? 'col-span-2 md:col-span-2 row-span-2 min-h-[250px] md:min-h-[400px]' : 'col-span-1 min-h-[150px] md:min-h-[190px]';
                        const imgUrl = bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(item.image, idx === 0 ? "w1200" : "w600") : item.image;
                        return `
                            <a href="${item.link || '#'}" target="_blank" class="ta-gallery-item ${colSpan} bg-slate-100 dark:bg-slate-700">
                                <img src="${escapeHtml(imgUrl)}" class="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                                <div class="ta-gallery-overlay"></div>
                                <div class="absolute bottom-0 left-0 right-0 p-4 md:p-5 z-10">
                                    <h4 class="text-white font-bold text-sm md:text-lg leading-tight mb-1">${escapeHtml(item.title)}</h4>
                                    <p class="text-white/80 text-[10px] md:text-xs font-medium line-clamp-1">${escapeHtml(item.caption)}</p>
                                </div>
                            </a>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }

    function renderContactAside() {
        const store = getConfig().storeInfo || {};
        const bridge = getBridge();
        
        return `
            <aside class="space-y-5">
                <section class="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div class="w-16 h-16 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center text-2xl mb-6"><i class="fa-solid fa-store"></i></div>
                    <h3 class="font-black text-2xl text-slate-800 dark:text-white mb-6">${escapeHtml(store.name)}</h3>
                    
                    <ul class="space-y-4 text-sm">
                        <li class="flex gap-4">
                            <i class="fa-solid fa-location-dot text-slate-400 mt-1"></i>
                            <span class="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">${escapeHtml(store.address)}</span>
                        </li>
                        <li class="flex gap-4">
                            <i class="fa-regular fa-clock text-slate-400 mt-1"></i>
                            <span class="text-slate-600 dark:text-slate-300 font-medium">${escapeHtml(store.openHours)}</span>
                        </li>
                        <li class="flex gap-4">
                            <i class="fa-solid fa-phone text-slate-400 mt-1"></i>
                            <span class="text-slate-600 dark:text-slate-300 font-bold">${escapeHtml(bridge.storeContactPhone || "")}</span>
                        </li>
                    </ul>
                </section>

                <section class="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <h3 class="font-black text-lg text-slate-800 dark:text-white mb-5">Liên hệ trực tuyến</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="ta-contact-btn ta-btn-zalo" onclick="openStoreZalo()">
                            <div class="ta-app-icon"><i class="fa-solid fa-comment-dots"></i></div>
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Zalo Chat</span>
                        </button>
                        <button class="ta-contact-btn ta-btn-fb" onclick="openStoreFacebook()">
                            <div class="ta-app-icon"><i class="fa-brands fa-facebook-f"></i></div>
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Facebook</span>
                        </button>
                        <button class="ta-contact-btn ta-btn-group" onclick="openStoreZaloGroup()">
                            <div class="ta-app-icon"><i class="fa-solid fa-users"></i></div>
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Nhóm Sỉ</span>
                        </button>
                        <button class="ta-contact-btn ta-btn-mail" onclick="openStoreEmail()">
                            <div class="ta-app-icon"><i class="fa-solid fa-envelope"></i></div>
                            <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Gửi Email</span>
                        </button>
                    </div>
                </section>
            </aside>
        `;
    }

    function renderIntroTab() {
        const area = document.getElementById("tab-intro");
        if (!area) return;

        area.innerHTML = `
            <div class="space-y-6">
                ${renderHero()}
                ${renderHighlights()}
                <div class="grid lg:grid-cols-[1fr,380px] gap-6 items-start">
                    ${renderGallery()}
                    ${renderContactAside()}
                </div>
            </div>
        `;
    }

    // GIAO DIỆN POPUP MỚI (TRUST & CẢM XÚC)
    function fillWelcomePopup() {
        const popup = getConfig().welcomePopup || {};
        const body = document.getElementById("welcome-popup-body");

        if (!body) return;

        // Định nghĩa các icon cho từng dòng lợi ích
        const lineIcons = ["fa-gift", "fa-truck-fast", "fa-crown"];

        body.innerHTML = `
            <div class="relative bg-gradient-to-br from-pink-400 to-rose-500 p-8 text-center overflow-hidden">
                <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 16px 16px;"></div>
                
                <div class="relative z-10 w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center text-4xl text-pink-500 shadow-[0_0_30px_rgba(255,255,255,0.4)] mb-4 animate-bounce">
                    <i class="fa-solid fa-gift"></i>
                </div>
                
                <h3 class="relative z-10 font-black text-2xl text-white tracking-tight leading-tight">${escapeHtml(popup.title)}</h3>
                <p class="relative z-10 text-white/90 text-sm font-medium mt-3 leading-relaxed px-2">${escapeHtml(popup.subtitle)}</p>
            </div>
            
            <div class="p-6 md:p-8 bg-white dark:bg-slate-800">
                <div class="space-y-3 mb-6">
                    ${(popup.lines || []).map((line, index) => `
                        <div class="flex items-start gap-3 bg-pink-50/50 dark:bg-slate-700/50 p-3.5 rounded-2xl border border-pink-100/50 dark:border-slate-600/50">
                            <span class="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 text-pink-500 shadow-sm"><i class="fa-solid ${lineIcons[index] || 'fa-check'}"></i></span>
                            <p class="text-[13px] text-slate-700 dark:text-slate-200 font-bold leading-relaxed pt-1.5">${escapeHtml(line)}</p>
                        </div>
                    `).join('')}
                </div>
                
                <div class="flex items-center justify-center gap-2 mb-7 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 py-2.5 px-4 rounded-full border border-emerald-100 dark:border-emerald-800">
                    <i class="fa-solid fa-shield-check"></i>
                    <span>${escapeHtml(popup.trustNote)}</span>
                </div>

                <div class="flex flex-col gap-3">
                    <button class="w-full bg-pink-500 text-white py-4 rounded-2xl font-black text-base shadow-[0_8px_20px_rgba(236,72,153,0.3)] hover:bg-pink-600 hover:-translate-y-0.5 transition-all active:scale-95" onclick="if(typeof openAccountFromWelcomePopup === 'function') openAccountFromWelcomePopup(); else goToTab('tab-account'); closeWelcomePopup();">${escapeHtml(popup.primaryLabel)}</button>
                    <button class="w-full bg-transparent text-slate-400 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all" onclick="if(typeof closeWelcomePopup === 'function') closeWelcomePopup()">${escapeHtml(popup.secondaryLabel)}</button>
                </div>
            </div>
        `;
    }

    function maybeAutoOpenWelcomePopup(options) {
        const settings = options || {};
        const storageKey = String(settings.storageKey || "ta_welcome_popup_seen_v5");
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
