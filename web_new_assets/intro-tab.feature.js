(function () {
    var STYLE_ID = 'intro-tab-feature-styles';
    var SHARED_MAP_URL = window.STORE_MAP_URL || 'https://maps.app.goo.gl/uvE9CiNHheZyWP55A';
    var SHARED_WAREHOUSE_LABEL = window.STORE_WAREHOUSE_LABEL || 'Di Nau - Xa Tay Phuong - TP. Ha Noi';
    var defaultConfig = {
        hero: {
            badge: 'Trường An Store',
            title: 'Không gian mua sắm gần gũi cho mẹ và bé, đồ chơi, quà tặng và hàng bán sỉ.',
            description: 'Tab giới thiệu này được gom vào một file duy nhất để bạn đổi ảnh, đổi nội dung hoặc bỏ hẳn tab mà không phải lần ngược nhiều file.',
            primaryLabel: 'Xem sản phẩm',
            secondaryLabel: 'Mở Google Maps',
            statisticLabel: 'Khách mới mỗi ngày',
            statisticValue: '200+'
        },
        highlights: [
            {
                icon: 'fa-heart-circle-check',
                title: 'Ảnh rõ, mô tả gọn',
                description: 'Khách xem nhanh là nắm được nhóm hàng, giá bán và điểm nổi bật.'
            },
            {
                icon: 'fa-truck-fast',
                title: 'Lên đơn trực tiếp',
                description: 'Khách có thể đặt đơn ngay trên web, shop chỉ cần xác nhận và xử lý.'
            },
            {
                icon: 'fa-gift',
                title: 'Ưu đãi nổi bật',
                description: 'Popup đầu trang và khu sale có thể thay đổi độc lập theo từng chiến dịch.'
            }
        ],
        storeInfo: {
            name: 'Trường An Store',
            summary: 'Chuyên nhóm hàng mẹ và bé, đồ chơi, quà tặng và sản phẩm bán sỉ cho cộng tác viên.',
            address: SHARED_WAREHOUSE_LABEL,
            mapUrl: SHARED_MAP_URL,
            openHours: '08:00 - 21:00 mỗi ngày'
        },
        gallery: [
            {
                image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1400&q=80',
                title: 'Không gian mua sắm cho mẹ và bé',
                caption: 'Ảnh banner chính cho phần giới thiệu.',
                link: SHARED_MAP_URL
            },
            {
                image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=1200&q=80',
                title: 'Khu đồ chơi nổi bật',
                caption: 'Có thể thay bằng ảnh thật trong shop.',
                link: SHARED_MAP_URL
            },
            {
                image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80',
                title: 'Nhóm hàng mẹ và bé',
                caption: 'Dùng để giới thiệu nhóm sản phẩm chủ lực.',
                link: SHARED_MAP_URL
            }
        ],
        welcomePopup: {
            badge: 'Ưu đãi đầu trang',
            title: 'Nhận ưu đãi cho khách mới',
            subtitle: 'Đăng ký để lưu hồ sơ, theo dõi đơn hàng và nhận các cập nhật mới nhất từ shop.',
            lines: [
                'Tạo tài khoản nhanh bằng email hoặc số điện thoại.',
                'Lưu địa chỉ giao hàng để lên đơn nhanh hơn ở các lần mua sau.',
                'Bạn có thể đổi toàn bộ nội dung popup này ngay trong file intro-tab.feature.js.'
            ],
            primaryLabel: 'Đăng ký / Đăng nhập',
            secondaryLabel: 'Xem sản phẩm'
        }
    };

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;

        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = [
            ".intro-feature{display:flex;flex-direction:column;gap:1.5rem;}",
            ".intro-feature__hero{position:relative;overflow:hidden;border-radius:2rem;border:1px solid #ead7e1;background:linear-gradient(135deg,#fff8fb 0%,#fff 45%,#f8fbff 100%);box-shadow:0 18px 44px rgba(255,143,171,.1);}",
            ".intro-feature__hero-grid{display:grid;gap:1.5rem;padding:1.5rem;}",
            ".intro-feature__eyebrow{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#ff8fab;font-weight:900;margin-bottom:.8rem;}",
            ".intro-feature__title{font-size:clamp(1.85rem,3vw,3.1rem);line-height:1.05;color:#1f2937;font-weight:900;max-width:16ch;}",
            ".intro-feature__desc{margin-top:1rem;color:#64748b;font-size:.96rem;line-height:1.8;max-width:55ch;}",
            ".intro-feature__actions{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:1.25rem;}",
            ".intro-feature__primary,.intro-feature__secondary,.intro-feature__ghost{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;padding:.9rem 1.15rem;border-radius:999px;font-size:13px;font-weight:900;}",
            ".intro-feature__primary{background:#ff8fab;color:#fff;box-shadow:0 18px 34px rgba(255,143,171,.22);}",
            ".intro-feature__secondary,.intro-feature__ghost{background:#fff;border:1px solid #ead7e1;color:#334155;}",
            ".intro-feature__stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem;margin-top:1.35rem;}",
            ".intro-feature__stat{border-radius:1.2rem;border:1px solid #f1d9e4;background:rgba(255,255,255,.9);padding:.9rem;}",
            ".intro-feature__stat span{display:block;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#94a3b8;font-weight:900;}",
            ".intro-feature__stat strong{display:block;margin-top:.45rem;font-size:1rem;line-height:1.4;color:#1f2937;font-weight:900;}",
            ".intro-feature__media{position:relative;min-height:340px;border-radius:1.7rem;overflow:hidden;background:#f8fafc;}",
            ".intro-feature__media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}",
            ".intro-feature__media::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.08) 0%,rgba(15,23,42,.55) 100%);}",
            ".intro-feature__card{position:absolute;left:1rem;right:1rem;bottom:1rem;z-index:1;border-radius:1.35rem;border:1px solid rgba(255,255,255,.7);background:rgba(255,255,255,.9);backdrop-filter:blur(18px);padding:1rem 1.05rem;box-shadow:0 14px 34px rgba(15,23,42,.14);}",
            ".intro-feature__card p{color:#64748b;font-size:.88rem;line-height:1.7;margin-top:.45rem;}",
            ".intro-feature__layout{display:grid;gap:1.5rem;align-items:start;}",
            ".intro-feature__highlights{display:grid;gap:1rem;}",
            ".intro-feature__highlight{border-radius:1.55rem;border:1px solid #eceff5;background:#fff;padding:1.15rem;box-shadow:0 14px 30px rgba(15,23,42,.05);}",
            ".intro-feature__highlight i{width:2.8rem;height:2.8rem;border-radius:1rem;background:#fff1f4;color:#ff6b99;display:inline-flex;align-items:center;justify-content:center;font-size:1.1rem;box-shadow:inset 0 1px 0 rgba(255,255,255,.72),0 10px 18px rgba(255,143,171,.1);}",
            ".intro-feature__highlight h3{margin-top:.95rem;color:#1f2937;font-size:1.05rem;font-weight:900;}",
            ".intro-feature__highlight p{margin-top:.55rem;color:#64748b;font-size:.92rem;line-height:1.75;}",
            ".intro-feature__gallery,.intro-feature__aside-card{border-radius:2rem;border:1px solid #eceff5;background:#fff;padding:1.2rem;box-shadow:0 14px 30px rgba(15,23,42,.05);}",
            ".intro-feature__section-label{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#94a3b8;font-weight:900;}",
            ".intro-feature__section-title{margin-top:.35rem;color:#1f2937;font-size:1.25rem;font-weight:900;}",
            ".intro-feature__gallery-grid{display:grid;gap:1rem;margin-top:1rem;}",
            ".intro-feature__gallery-item{position:relative;overflow:hidden;min-height:220px;border-radius:1.6rem;background:#f8fafc;}",
            ".intro-feature__gallery-item--large{min-height:320px;}",
            ".intro-feature__gallery-item img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 420ms ease;}",
            ".intro-feature__gallery-item:hover img{transform:scale(1.03);}",
            ".intro-feature__gallery-item::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.06) 0%,rgba(15,23,42,.72) 100%);}",
            ".intro-feature__gallery-copy{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:1rem;color:#fff;}",
            ".intro-feature__gallery-copy p{margin-top:.35rem;color:rgba(255,255,255,.9);font-size:.9rem;line-height:1.65;}",
            ".intro-feature__aside-list{display:grid;gap:.85rem;margin-top:1rem;color:#64748b;font-size:.92rem;line-height:1.75;}",
            ".intro-feature__aside-list strong{color:#1f2937;display:block;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;font-weight:900;}",
            ".intro-feature__contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;margin-top:1rem;}",
            ".intro-feature__contact{border-radius:1.2rem;border:1px solid #eceff5;background:#f8fafc;padding:.95rem;font-size:12px;font-weight:900;color:#334155;text-align:center;}",
            ".intro-feature__contact i{display:block;font-size:1rem;margin-bottom:.5rem;}",
            ".intro-popup-card{border-radius:1.5rem;border:1px solid #f1d9e4;background:linear-gradient(135deg,#fff8fb 0%,#fff 55%,#fff1f6 100%);padding:1rem 1.05rem;}",
            ".intro-popup-card h3{margin-top:.45rem;color:#1f2937;font-size:1.15rem;font-weight:900;line-height:1.35;}",
            ".intro-popup-card p{margin-top:.7rem;color:#64748b;font-size:.92rem;line-height:1.75;}",
            ".intro-popup-lines{display:grid;gap:.7rem;margin-top:1rem;}",
            ".intro-popup-line{display:flex;align-items:flex-start;gap:.7rem;border-radius:1.15rem;border:1px solid #eceff5;background:#fff;padding:.9rem;}",
            ".intro-popup-line span{width:2rem;height:2rem;border-radius:999px;background:#fff1f4;color:#ff6b99;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}",
            ".intro-popup-line p{color:#475569;font-size:.9rem;line-height:1.7;}",
            "@media (min-width:1024px){.intro-feature__hero-grid{grid-template-columns:minmax(0,1.08fr) minmax(330px,.92fr);padding:1.8rem;}.intro-feature__highlights{grid-template-columns:repeat(3,minmax(0,1fr));}.intro-feature__layout{grid-template-columns:minmax(0,1fr) 340px;}.intro-feature__gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.intro-feature__gallery-item--large{grid-column:span 2;}}",
            "body.dark-mode .intro-feature__hero,body.dark-mode .intro-feature__highlight,body.dark-mode .intro-feature__gallery,body.dark-mode .intro-feature__aside-card,body.dark-mode .intro-feature__contact,body.dark-mode .intro-popup-line{background:#111827;border-color:#334155;box-shadow:0 18px 40px rgba(2,6,23,.32);}",
            "body.dark-mode .intro-feature__title,body.dark-mode .intro-feature__highlight h3,body.dark-mode .intro-feature__section-title,body.dark-mode .intro-feature__stat strong,body.dark-mode .intro-feature__aside-list strong,body.dark-mode .intro-popup-card h3{color:#f8fafc;}",
            "body.dark-mode .intro-feature__desc,body.dark-mode .intro-feature__highlight p,body.dark-mode .intro-feature__card p,body.dark-mode .intro-feature__aside-list,body.dark-mode .intro-feature__section-label,body.dark-mode .intro-feature__stat span,body.dark-mode .intro-popup-card p,body.dark-mode .intro-popup-line p{color:#cbd5e1;}",
            "body.dark-mode .intro-feature__secondary,body.dark-mode .intro-feature__ghost,body.dark-mode .intro-feature__stat,body.dark-mode .intro-feature__card,body.dark-mode .intro-popup-card{background:rgba(15,23,42,.9);border-color:#334155;color:#e2e8f0;}",
            "body.dark-mode .intro-feature__highlight i,body.dark-mode .intro-popup-line span{background:rgba(255,143,171,.12);color:#ffb0c2;}"
        ].join('');

        document.head.appendChild(style);
    }

    function getBridge() {
        return window.webNewAppBridge || {};
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function mergeSection(base, override) {
        var output = Object.assign({}, base || {});
        Object.keys(override || {}).forEach(function (key) {
            var value = override[key];
            if (Array.isArray(value)) output[key] = value.slice();
            else if (value && typeof value === 'object') output[key] = mergeSection(output[key], value);
            else output[key] = value;
        });
        return output;
    }

    function getConfig() {
        var external = window.INTRO_TAB_FEATURE_CONFIG || window.INTRO_EXPERIENCE_CONFIG || {};
        return mergeSection(defaultConfig, external);
    }

    function getCurrentUser() {
        var bridge = getBridge();
        return bridge.getCurrentUser ? bridge.getCurrentUser() : null;
    }

    function getGallery() {
        var bridge = getBridge();
        var config = getConfig();
        return (Array.isArray(config.gallery) ? config.gallery : []).map(function (item, index) {
            return {
                image: String(item && item.image || '').trim(),
                title: String(item && item.title || ('Ảnh giới thiệu ' + (index + 1))).trim(),
                caption: String(item && item.caption || '').trim(),
                link: String(item && item.link || (config.storeInfo && config.storeInfo.mapUrl) || bridge.storeMapUrl || '#').trim()
            };
        }).filter(function (item) {
            return !!item.image;
        });
    }

    function getImageUrl(src, size) {
        var bridge = getBridge();
        return bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(src, size) : src;
    }

    function renderHero() {
        var bridge = getBridge();
        var config = getConfig();
        var hero = config.hero || {};
        var store = config.storeInfo || {};
        var gallery = getGallery();
        var image = gallery.length ? gallery[0].image : '';

        return [
            "<section class='intro-feature__hero'>",
            "  <div class='intro-feature__hero-grid'>",
            "      <div>",
            "          <p class='intro-feature__eyebrow'>", escapeHtml(hero.badge || 'Trường An Store'), "</p>",
            "          <h2 class='intro-feature__title'>", escapeHtml(hero.title || ''), "</h2>",
            "          <p class='intro-feature__desc'>", escapeHtml(hero.description || ''), "</p>",
            "          <div class='intro-feature__actions'>",
            "              <button type='button' class='intro-feature__primary' onclick='goToTab(\"tab-products\")'>", escapeHtml(hero.primaryLabel || 'Xem sản phẩm'), "</button>",
            "              <a class='intro-feature__secondary' href='", escapeHtml(store.mapUrl || bridge.storeMapUrl || '#'), "' rel='noopener noreferrer' target='_blank'>", escapeHtml(hero.secondaryLabel || 'Mở Google Maps'), "</a>",
            getCurrentUser() ? '' : "              <button type='button' class='intro-feature__ghost' onclick='goToTab(\"tab-account\");setTimeout(function(){if(typeof openAuth===\"function\") openAuth();},120)'>Đăng ký / Đăng nhập</button>",
            "          </div>",
            "          <div class='intro-feature__stats'>",
            "              <div class='intro-feature__stat'><span>Danh mục</span><strong>Mẹ bé • Đồ chơi • Quà tặng</strong></div>",
            "              <div class='intro-feature__stat'><span>Hỗ trợ nhanh</span><strong>Zalo ", escapeHtml(bridge.storeZaloPhone || bridge.storeContactPhone || ''), "</strong></div>",
            "              <div class='intro-feature__stat'><span>", escapeHtml(hero.statisticLabel || 'Khách mới mỗi ngày'), "</span><strong>", escapeHtml(hero.statisticValue || '200+'), "</strong></div>",
            "          </div>",
            "      </div>",
            "      <div class='intro-feature__media'>",
            image ? "<img src='" + escapeHtml(getImageUrl(image, 'w1600')) + "' loading='lazy' decoding='async' alt='Giới thiệu Trường An Store'/>" : '',
            "          <div class='intro-feature__card'>",
            "              <p class='intro-feature__eyebrow'>Thông tin cửa hàng</p>",
            "              <h3 class='intro-feature__section-title'>", escapeHtml(store.name || 'Trường An Store'), "</h3>",
            "              <p>", escapeHtml(store.summary || ''), "</p>",
            "              <p><strong>Giờ mở cửa:</strong> ", escapeHtml(store.openHours || '08:00 - 21:00'), "</p>",
            "          </div>",
            "      </div>",
            "  </div>",
            "</section>"
        ].join('');
    }

    function renderHighlights() {
        var config = getConfig();
        var highlights = Array.isArray(config.highlights) ? config.highlights : [];

        return [
            "<section class='intro-feature__highlights'>",
            highlights.map(function (item) {
                return [
                    "<article class='intro-feature__highlight'>",
                    "  <i class='fa-solid ", escapeHtml(item.icon || 'fa-star'), "'></i>",
                    "  <h3>", escapeHtml(item.title || ''), "</h3>",
                    "  <p>", escapeHtml(item.description || ''), "</p>",
                    "</article>"
                ].join('');
            }).join(''),
            "</section>"
        ].join('');
    }

    function renderGallery() {
        var gallery = getGallery();
        var config = getConfig();

        if (!gallery.length) return '';

        return [
            "<section class='intro-feature__gallery'>",
            "  <p class='intro-feature__section-label'>Hình ảnh cửa hàng</p>",
            "  <h3 class='intro-feature__section-title'>Album giới thiệu</h3>",
            "  <div class='intro-feature__gallery-grid'>",
            gallery.map(function (item, index) {
                return [
                    "<a class='intro-feature__gallery-item", index === 0 ? " intro-feature__gallery-item--large" : "", "' href='", escapeHtml(item.link), "' rel='noopener noreferrer' target='_blank'>",
                    "  <img src='", escapeHtml(getImageUrl(item.image, index === 0 ? 'w1600' : 'w1000')), "' loading='lazy' decoding='async' alt='", escapeHtml(item.title), "'/>",
                    "  <div class='intro-feature__gallery-copy'>",
                    "      <strong>", escapeHtml(item.title), "</strong>",
                    "      <p>", escapeHtml(item.caption), "</p>",
                    "  </div>",
                    "</a>"
                ].join('');
            }).join(''),
            "  </div>",
            "</section>"
        ].join('');
    }

    function renderAside() {
        var bridge = getBridge();
        var store = getConfig().storeInfo || {};

        return [
            "<aside class='intro-feature__aside'>",
            "  <section class='intro-feature__aside-card'>",
            "      <p class='intro-feature__section-label'>Thông tin cửa hàng</p>",
            "      <h3 class='intro-feature__section-title'>", escapeHtml(store.name || 'Trường An Store'), "</h3>",
            "      <div class='intro-feature__aside-list'>",
            "          <div><strong>Mô tả</strong><span>", escapeHtml(store.summary || ''), "</span></div>",
            "          <div><strong>Địa chỉ</strong><span>", escapeHtml(store.address || 'Cập nhật địa chỉ thật của cửa hàng tại đây.'), "</span></div>",
            "          <div><strong>Zalo</strong><span>", escapeHtml(bridge.storeZaloPhone || bridge.storeContactPhone || ''), "</span></div>",
            "          <div><strong>Giờ mở cửa</strong><span>", escapeHtml(store.openHours || '08:00 - 21:00 mỗi ngày'), "</span></div>",
            "      </div>",
            "  </section>",
            "  <section class='intro-feature__aside-card'>",
            "      <p class='intro-feature__section-label'>Liên hệ nhanh</p>",
            "      <h3 class='intro-feature__section-title'>Chạm để kết nối</h3>",
            "      <div class='intro-feature__contact-grid'>",
            "          <button type='button' class='intro-feature__contact' onclick='openStoreZalo()'><i class='fa-solid fa-comment-dots'></i>Zalo</button>",
            "          <button type='button' class='intro-feature__contact' onclick='openStoreFacebook()'><i class='fa-brands fa-facebook-f'></i>Facebook</button>",
            "          <button type='button' class='intro-feature__contact' onclick='openStoreZaloGroup()'><i class='fa-solid fa-user-group'></i>Nhóm Zalo</button>",
            "          <button type='button' class='intro-feature__contact' onclick='openStoreEmail()'><i class='fa-regular fa-envelope'></i>Email</button>",
            "      </div>",
            "  </section>",
            "</aside>"
        ].join('');
    }

    function renderIntroTab(root) {
        if (!root) return;

        ensureStyles();

        root.innerHTML = [
            "<div class='intro-feature' data-feature-owner='intro-tab-feature'>",
            renderHero(),
            renderHighlights(),
            "<div class='intro-feature__layout'>",
            renderGallery(),
            renderAside(),
            "</div>",
            "</div>"
        ].join('');
    }

    function fillWelcomePopup() {
        var popup = getConfig().welcomePopup || {};
        var body = document.getElementById('welcome-popup-body');
        var primaryBtn = document.getElementById('welcome-popup-primary');
        var secondaryBtn = document.getElementById('welcome-popup-secondary');
        var badge = document.getElementById('welcome-popup-badge');
        var title = document.getElementById('welcome-popup-title');

        if (!body) return;

        ensureStyles();

        if (badge) badge.innerText = popup.badge || 'Ưu đãi đầu trang';
        if (title) title.innerText = popup.title || '';

        body.innerHTML = [
            "<div class='intro-popup-card'>",
            "  <p class='intro-feature__eyebrow'>", escapeHtml(popup.badge || 'Ưu đãi đầu trang'), "</p>",
            "  <h3>", escapeHtml(popup.title || 'Thông báo nhanh'), "</h3>",
            "  <p>", escapeHtml(popup.subtitle || ''), "</p>",
            "</div>",
            Array.isArray(popup.lines) && popup.lines.length ? [
                "<div class='intro-popup-lines'>",
                popup.lines.map(function (line) {
                    return [
                        "<div class='intro-popup-line'>",
                        "  <span><i class='fa-solid fa-check'></i></span>",
                        "  <p>", escapeHtml(line), "</p>",
                        "</div>"
                    ].join('');
                }).join(''),
                "</div>"
            ].join('') : ''
        ].join('');

        if (primaryBtn) primaryBtn.innerText = popup.primaryLabel || 'Đăng ký / Đăng nhập';
        if (secondaryBtn) secondaryBtn.innerText = popup.secondaryLabel || 'Xem sản phẩm';
    }

    function maybeAutoOpenWelcomePopup(options) {
        var settings = options || {};
        var storageKey = String(settings.storageKey || 'ta_welcome_popup_seen_v3');
        var delay = Math.max(Number(settings.delay || 650) || 650, 0);

        try {
            if (sessionStorage.getItem(storageKey)) return false;
            sessionStorage.setItem(storageKey, String(Date.now()));
        } catch (error) {}

        setTimeout(function () {
            if (typeof window.openWelcomePopup === 'function') window.openWelcomePopup();
        }, delay);

        return true;
    }

    function render(options) {
        var root = options && options.root ? options.root : document.getElementById('tab-intro');
        renderIntroTab(root);
    }

    function destroy(target) {
        var root = target && target.nodeType ? target : document.getElementById(String(target || 'tab-intro'));
        if (root) root.innerHTML = '';
    }

    window.introTabFeature = {
        ensureStyles: ensureStyles,
        render: render,
        fillWelcomePopup: fillWelcomePopup,
        maybeAutoOpenWelcomePopup: maybeAutoOpenWelcomePopup,
        destroy: destroy,
        getConfig: getConfig
    };
})();
