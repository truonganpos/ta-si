// Tên file: account-tab.js
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

    function getNormalizedUser() {
        const bridge = getBridge();
        const user = bridge.getCurrentUser ? bridge.getCurrentUser() : null;
        if (!user || !bridge.normalizeUserData) return user;
        const normalized = bridge.normalizeUserData(user);
        if (bridge.setCurrentUser) bridge.setCurrentUser(normalized);
        return normalized;
    }

    function getSafeOrders(user) {
        return Array.isArray(user && user.orders) ? user.orders : [];
    }

    function mapAccountError(error, mode) {
        const code = String((error && error.code) || '').trim().toLowerCase();
        const message = String((error && error.message) || '').trim().toLowerCase();
        const raw = code + ' ' + message;

        if (raw.indexOf('missing-register-fields') >= 0) return 'Vui lòng nhập họ tên, số điện thoại và mật khẩu. Email có thể để trống.';
        if (raw.indexOf('missing-password-fields') >= 0) return 'Vui lòng nhập đầy đủ thông tin mật khẩu.';
        if (raw.indexOf('email-already-in-use') >= 0) return 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.';
        if (raw.indexOf('invalid-email') >= 0) return 'Email chưa đúng định dạng.';
        if (raw.indexOf('weak-password') >= 0) return 'Mật khẩu cần tối thiểu 6 ký tự.';
        if (raw.indexOf('requires-recent-login') >= 0) return 'Vui lòng đăng nhập lại rồi đổi mật khẩu để đảm bảo an toàn.';
        if (raw.indexOf('too-many-requests') >= 0) return 'Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.';
        if (raw.indexOf('user-not-found') >= 0 || raw.indexOf('wrong-password') >= 0 || raw.indexOf('invalid-credential') >= 0) {
            return 'Thông tin đăng nhập chưa đúng. Vui lòng kiểm tra lại email hoặc mật khẩu.';
        }
        if (raw.indexOf('permission') >= 0 || raw.indexOf('denied') >= 0) {
            return mode === 'register'
                ? 'Tài khoản đã tạo nhưng hồ sơ khách chưa đồng bộ được. Hãy đăng nhập lại để hoàn tất.'
                : 'Đăng nhập được nhưng hồ sơ khách chưa đồng bộ xong. Vui lòng thử lại sau vài giây.';
        }
        return mode === 'register'
            ? 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin rồi thử lại.'
            : 'Đăng nhập thất bại. Nếu bạn dùng số điện thoại, hãy thử email đã đăng ký.';
    }

    function getDefaultAddress(user) {
        if (!user || !Array.isArray(user.addresses)) return null;
        return user.addresses.find((address) => address && address.isDefault) || user.addresses[0] || null;
    }

    function getAddressLine(address) {
        return String((address && address.text) || '').trim();
    }

    function getAddressPhone(address, user) {
        return String((address && address.phone) || (user && user.shippingPhone) || '').trim();
    }

    function renderSupportMenu(menuId) {
        return `
            <div class='mt-3'>
                <div class='grid grid-cols-2 md:grid-cols-4 gap-2 mt-3' id='${menuId}'>
                    <button class='rounded-2xl bg-green-50 text-green-700 py-3 font-bold text-[11px] hover:bg-green-100 transition flex flex-col items-center justify-center' onclick='openStoreZalo()'><i class='fa-solid fa-comment-dots text-base mb-2'></i><span>Zalo</span></button>
                    <button class='rounded-2xl bg-sky-50 text-sky-700 py-3 font-bold text-[11px] hover:bg-sky-100 transition flex flex-col items-center justify-center' onclick='openStoreFacebook()'><i class='fa-brands fa-facebook-f text-base mb-2'></i><span>Facebook</span></button>
                    <button class='rounded-2xl bg-amber-50 text-amber-700 py-3 font-bold text-[11px] hover:bg-amber-100 transition flex flex-col items-center justify-center' onclick='openStoreEmail()'><i class='fa-regular fa-envelope text-base mb-2'></i><span>Email</span></button>
                    <button class='rounded-2xl bg-purple-50 text-purple-700 py-3 font-bold text-[11px] hover:bg-purple-100 transition flex flex-col items-center justify-center' onclick='openStoreZaloGroup()'><i class='fa-solid fa-user-group text-base mb-2'></i><span>Nhóm Zalo</span></button>
                </div>
            </div>
        `;
    }

    function openPage(pageId) {
        const page = document.getElementById(pageId);
        if (page) page.classList.remove('translate-x-full');
    }

    function closePage(pageId) {
        const page = document.getElementById(pageId);
        if (page) page.classList.add('translate-x-full');
    }

    window.updateHeaderUserBadge = function () {
        const badge = document.getElementById('header-user-badge');
        if (!badge) return;

        let nameToDisplay = '';
        const user = getNormalizedUser(); 

        if (user && user.name) {
            nameToDisplay = user.name;
            localStorage.setItem('ta_cached_name', nameToDisplay); 
        } else {
            nameToDisplay = localStorage.getItem('ta_cached_name') || '';
        }

        if (nameToDisplay) {
            const shortName = nameToDisplay.split(' ').pop();
            badge.innerHTML = `<i class='fa-solid fa-user-check'></i> ${escapeHtml(shortName)}`;
        } else {
            badge.innerHTML = `<i class='fa-regular fa-user'></i> Đăng nhập`;
        }
    };

    window.renderAccountTab = function () {
        const bridge = getBridge();
        const area = document.getElementById('account-render-area');
        if (!area) return;

        window.updateHeaderUserBadge();

        const user = getNormalizedUser();
        if (!user) {
            area.innerHTML = `
                <div class='max-w-3xl mx-auto space-y-6'>
                    <section class='rounded-[32px] bg-white border border-gray-100 shadow-sm p-8 text-center'>
                        <div class='w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-babyPink text-4xl mb-5 shadow-sm mx-auto'><i class='fa-solid fa-user-lock'></i></div>
                        <h2 class='font-bold text-2xl text-gray-800'>Chào mừng bạn</h2>
                        <p class='text-sm text-gray-500 mt-3 max-w-lg mx-auto'>Đăng nhập để lưu lịch sử mua hàng, sửa hồ sơ nhanh và đồng bộ dữ liệu từ Firebase.</p>
                        <div class='flex flex-wrap gap-3 mt-6 justify-center'>
                            <button onclick='openAuth()' class='bg-babyPink text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition'>Đăng nhập / Đăng ký</button>
                        </div>
                        <p class='text-xs text-gray-400 mt-5'>Khách chưa đăng nhập vẫn có thể đặt hàng. Hệ thống sẽ tự động ghi nhận theo SĐT và Địa chỉ bạn cung cấp lúc thanh toán.</p>
                    </section>
                    <section class='rounded-[32px] bg-white border border-gray-100 shadow-sm p-6 text-center md:text-left'>
                        <div class='mb-2'>
                            <p class='text-xs uppercase tracking-[0.18em] text-gray-400 font-bold'>Hỗ trợ nhanh</p>
                            <h3 class='font-bold text-lg text-gray-800 mt-1'>Liên hệ shop</h3>
                        </div>
                        ${renderSupportMenu('guest-account-support')}
                    </section>
                </div>
            `;
            return;
        }

        const orders = getSafeOrders(user);
        const wishlistData = bridge.getWishlistData ? bridge.getWishlistData() : [];
        const defaultAddress = getDefaultAddress(user);
        const defaultAddressLine = getAddressLine(defaultAddress);
        const defaultAddressPhone = getAddressPhone(defaultAddress, user);
        const statusCards = [
            { label: 'Chờ xác nhận', icon: 'fa-wallet', color: 'text-orange-500', count: orders.filter((order) => (bridge.normalizeKeyword ? bridge.normalizeKeyword(order.status) : '').includes('xac nhan')).length },
            { label: 'Đang giao', icon: 'fa-truck-fast', color: 'text-sky-500', count: orders.filter((order) => (bridge.normalizeKeyword ? bridge.normalizeKeyword(order.status) : '').includes('dang giao')).length },
            { label: 'Hoàn tất', icon: 'fa-circle-check', color: 'text-emerald-500', count: orders.filter((order) => (bridge.normalizeKeyword ? bridge.normalizeKeyword(order.status) : '').includes('hoan')).length },
            { label: 'Yêu thích', icon: 'fa-heart', color: 'text-babyPink', count: wishlistData.length }
        ];
        const recentOrders = orders.slice(0, 3);

        area.innerHTML = `
            <div class='grid xl:grid-cols-[360px,minmax(0,1fr)] gap-6'>
                <section class='rounded-[32px] bg-white border border-gray-100 shadow-sm p-6 flex flex-col items-center md:items-start min-w-0'>
                    <div class='w-24 h-24 rounded-full bg-pink-50 border border-pink-100 overflow-hidden flex items-center justify-center text-babyPink text-3xl shadow-sm shrink-0 mb-4 md:mb-0'>
                        ${user.avatar ? `<img src="${bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(user.avatar, 'w300') : user.avatar}" loading="lazy" decoding="async" class='w-full h-full object-cover'/>` : `<i class='fa-regular fa-user'></i>`}
                    </div>
                    <button class='w-full text-center md:text-left mt-3 md:mt-5 min-w-0' onclick='openSettings()'>
                        <h2 class='font-bold text-2xl text-gray-800 truncate w-full'>${user.name || bridge.defaultGuestName || 'Khách Lẻ Web'}</h2>
                    </button>
                    <div class='flex flex-wrap justify-center md:justify-start gap-2 mt-4'>
                        <span class='text-xs font-bold text-babyPink bg-pink-50 px-3 py-1 rounded-full'>${user.group || 'Khách lẻ từ web'}</span>
                        <span class='text-xs font-bold ${user.status === 'offline' ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'} px-3 py-1 rounded-full'>${user.status === 'offline' ? 'Trạng thái: Offline' : 'Trạng thái: Online'}</span>
                        <span class='text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full'>${orders.length} đơn</span>
                    </div>
                    ${user.status === 'offline' ? `
                        <div class='w-full rounded-[24px] bg-amber-50 border border-amber-200 p-4 mt-4 text-sm text-amber-700 leading-6'>
                            Tài khoản của bạn đang ở trạng thái <strong>offline</strong>. Bạn vẫn có thể đăng nhập và xem tài khoản, nhưng danh sách sản phẩm sẽ tạm khóa cho đến khi shop chuyển lại sang online.
                        </div>
                    ` : ''}
                    <div class='w-full rounded-[24px] bg-gray-50 border border-gray-100 p-3 md:p-4 mt-5 text-center md:text-left'>
                        <p class='text-xs uppercase tracking-[0.18em] text-gray-400 font-bold'>Cài đặt</p>
                        <button class='mt-2 text-sm font-semibold text-babyPink hover:underline' onclick='openSettings()'><i class='fa-solid fa-gear'></i> Mở bảng điều khiển</button>
                    </div>
                    <div class='w-full rounded-[24px] bg-gray-50 border border-gray-100 p-3 md:p-4 mt-4 text-center md:text-left'>
                        <p class='text-xs uppercase tracking-[0.18em] text-gray-400 font-bold'>Liên hệ nhanh</p>
                        ${renderSupportMenu('member-account-support')}
                    </div>
                    <button onclick='processLogout()' class='w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition mt-5'>Đăng xuất</button>
                </section>

                <div class='space-y-6 min-w-0'>
                    <section class='rounded-[32px] bg-white border border-gray-100 shadow-sm p-5'>
                        <div class='flex flex-wrap items-center justify-between gap-3 mb-5'>
                            <div><p class='text-xs uppercase tracking-[0.18em] text-gray-400 font-bold'>Đơn mua</p><h3 class='font-extrabold text-xl text-gray-800 mt-1'>Đơn hàng</h3></div>
                            <button class='bg-pink-50 text-babyPink px-4 py-2 rounded-2xl font-bold text-sm hover:bg-pink-100 transition' onclick='openOrders()'>Tất cả</button>
                        </div>
                        <div class='grid grid-cols-4 gap-3'>
                            ${statusCards.map((item) => `
                                <button class='rounded-2xl bg-gray-50 border border-gray-100 p-3 flex flex-col items-center justify-center gap-2 hover:border-pink-200 hover:bg-pink-50 transition' onclick='${item.label === 'Yêu thích' ? 'openWishlist()' : 'openOrders()'}'>
                                    <i class='fa-solid ${item.icon} ${item.color} text-lg'></i>
                                    <p class='text-[11px] font-bold text-gray-500 text-center leading-tight'>${item.label}</p>
                                    <p class='text-sm font-extrabold text-gray-800'>${item.count}</p>
                                </button>
                            `).join('')}
                        </div>
                    </section>

                    <section class='grid lg:grid-cols-2 gap-6 min-w-0'>
                        <div class='rounded-[32px] bg-white border border-gray-100 shadow-sm p-5 flex flex-col min-w-0'>
                            <p class='text-xs uppercase tracking-[0.18em] text-gray-400 font-bold text-center md:text-left'>Hồ sơ</p>
                            <h3 class='font-extrabold text-xl text-gray-800 mt-2 text-center md:text-left'>Thông tin cá nhân</h3>
                            <div class='space-y-3 mt-5 flex-1 min-w-0'>
                                <button class='w-full bg-gray-50 rounded-2xl px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-pink-50 transition min-w-0' onclick='openProfileFieldEditor("name")'>
                                    <span class='text-gray-500 shrink-0'>Tên</span>
                                    <span class='font-bold text-gray-800 text-right truncate flex-1 min-w-0 ml-4'>${user.name || bridge.defaultGuestName || 'Khách Lẻ Web'}</span>
                                </button>
                                <button class='w-full bg-gray-50 rounded-2xl px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-pink-50 transition min-w-0' onclick='openProfileFieldEditor("bio")'>
                                    <span class='text-gray-500 shrink-0'>Tiểu sử</span>
                                    <span class='font-bold text-gray-800 text-right truncate flex-1 min-w-0 ml-4'>${user.bio || 'Chưa cập nhật'}</span>
                                </button>
                                <button class='w-full bg-gray-50 rounded-2xl px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-pink-50 transition min-w-0' onclick='openSettings()'>
                                    <span class='text-gray-500 shrink-0'>Chi tiết</span>
                                    <span class='font-bold text-babyPink text-right shrink-0 ml-4'>Cài đặt</span>
                                </button>
                            </div>
                        </div>
                        <div class='rounded-[32px] bg-white border border-gray-100 shadow-sm p-5 flex flex-col min-w-0'>
                            <p class='text-xs uppercase tracking-[0.18em] text-gray-400 font-bold text-center md:text-left'>Giao hàng</p>
                            <h3 class='font-extrabold text-xl text-gray-800 mt-2 text-center md:text-left'>Địa chỉ</h3>
                            <div class='rounded-[24px] bg-gray-50 border border-gray-100 p-4 mt-5 flex-1 flex flex-col min-w-0'>
                                <div class='flex-1 space-y-2 text-center md:text-left min-w-0'>
                                    <p class='text-sm text-gray-700 leading-6 break-words line-clamp-2'>${defaultAddressLine || 'Chưa có địa chỉ mặc định. Bấm cài đặt để thêm.'}</p>
                                    <p class='text-sm font-semibold text-gray-800 truncate'>${defaultAddressPhone || 'Chưa có số điện thoại'}</p>
                                </div>
                                <button class='mt-4 w-full md:w-auto bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-2xl font-bold hover:bg-pink-50 hover:text-babyPink transition self-center md:self-start' onclick='openSettings()'>Cập nhật</button>
                            </div>
                        </div>
                    </section>

                    <section class='rounded-[32px] bg-white border border-gray-100 shadow-sm p-5 min-w-0'>
                        <div class='flex items-center justify-between gap-3 mb-5 min-w-0'>
                            <div class='min-w-0'><p class='text-xs uppercase tracking-[0.18em] text-gray-400 font-bold'>Gần đây</p><h3 class='font-extrabold text-xl text-gray-800 mt-1 truncate'>Đơn gần đây</h3></div>
                            <button class='text-sm font-bold text-babyPink hover:underline shrink-0' onclick='openOrders()'>Lịch sử</button>
                        </div>
                        ${recentOrders.length ? `
                            <div class='space-y-3 min-w-0'>
                                ${recentOrders.map((order) => {
                                    const totals = bridge.getOrderTotals ? bridge.getOrderTotals(order) : { finalAmount: 0 };
                                    return `
                                        <button class='w-full rounded-[24px] bg-gray-50 border border-gray-100 px-4 py-4 text-left hover:border-pink-200 hover:bg-pink-50 transition min-w-0' onclick="openOrderDetail('${order.id}')">
                                            <div class='flex items-center justify-between gap-3 min-w-0'>
                                                <div class='min-w-0 flex-1'>
                                                    <p class='text-xs uppercase tracking-[0.16em] text-gray-400 font-bold truncate'>${order.id}</p>
                                                    <h4 class='font-bold text-gray-800 mt-2 truncate'>${order.status || 'Chờ xác nhận'}</h4>
                                                </div>
                                                <span class='text-sm font-extrabold text-babyPink whitespace-nowrap ml-2 shrink-0'>${bridge.formatMoney ? bridge.formatMoney(totals.finalAmount) : totals.finalAmount}</span>
                                            </div>
                                            <p class='text-sm text-gray-500 mt-2 truncate'>${Number(order.itemsCount || (order.items || []).length || 0)} sản phẩm</p>
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        ` : `<div class='rounded-[24px] bg-gray-50 border border-dashed border-gray-200 px-5 py-12 text-center text-gray-400 mt-5'><i class='fa-solid fa-box-open text-4xl opacity-40'></i><p class='mt-3'>Chưa có đơn hàng nào.</p></div>`}
                    </section>
                </div>
            </div>
        `;
    };

    window.openAuth = function () {
        const bridge = getBridge();
        if (bridge.openModalShell) bridge.openModalShell('auth-page');
        else {
            const page = document.getElementById('auth-page');
            if (page) page.classList.add('is-open');
        }
    };

    window.closeAuth = function () {
        const bridge = getBridge();
        if (bridge.closeModalShell) bridge.closeModalShell('auth-page');
        else {
            const page = document.getElementById('auth-page');
            if (page) page.classList.remove('is-open');
        }
    };

    window.switchAuthTab = function (tab) {
        if (tab === 'login') {
            document.getElementById('auth-login-form').classList.replace('hidden', 'flex');
            document.getElementById('auth-register-form').classList.replace('flex', 'hidden');
            document.getElementById('tab-login-btn').className = 'flex-1 py-2 font-bold text-babyPink border-b-2 border-babyPink';
            document.getElementById('tab-register-btn').className = 'flex-1 py-2 font-bold text-gray-400 border-b-2 border-transparent';
        } else {
            document.getElementById('auth-login-form').classList.replace('flex', 'hidden');
            document.getElementById('auth-register-form').classList.replace('hidden', 'flex');
            document.getElementById('tab-register-btn').className = 'flex-1 py-2 font-bold text-babyPink border-b-2 border-babyPink';
            document.getElementById('tab-login-btn').className = 'flex-1 py-2 font-bold text-gray-400 border-b-2 border-transparent';
        }
    };

    window.togglePasswordVisibility = function (inputId, toggleId) {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);
        if (!input || !toggle) return;
        const showing = input.getAttribute('type') === 'text';
        input.setAttribute('type', showing ? 'password' : 'text');
        toggle.innerHTML = showing ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    };

    window.toggleAccountSupportMenu = function (menuId, toggleId) {
        return;
    };

    window.handleRegister = async function () {
        const bridge = getBridge();
        const name = String((document.getElementById('reg-name') || {}).value || '').trim();
        const email = String((document.getElementById('reg-email') || {}).value || '').trim();
        const phone = String((document.getElementById('reg-phone') || {}).value || '').trim();
        const address = String((document.getElementById('reg-address') || {}).value || '').trim();
        const password = String((document.getElementById('reg-pass') || {}).value || '').trim();

        if (!name || !phone || !password) return bridge.showToast && bridge.showToast('Vui lòng nhập đủ họ tên, số điện thoại và mật khẩu.', 'warning');
        if (password.length < 6) return bridge.showToast && bridge.showToast('Mật khẩu cần tối thiểu 6 ký tự.', 'warning');
        await (bridge.waitForRetailFirebaseReady ? bridge.waitForRetailFirebaseReady() : Promise.resolve());
        if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase())) {
            return bridge.showToast && bridge.showToast('Firebase chưa sẵn sàng.', 'warning');
        }

        try {
            const result = await window.retailFirebase.registerCustomer({ name, email, phone, address, password });
            const normalizedProfile = bridge.normalizeUserData ? bridge.normalizeUserData({
                ...(bridge.getCurrentUser ? bridge.getCurrentUser() : {}),
                ...(result.profile || {}),
                authUid: result.authUser ? result.authUser.uid : '',
                email: (result.profile && result.profile.email) || email,
                phone: (result.profile && result.profile.phone) || phone,
                shippingPhone: (result.profile && result.profile.shippingPhone) || phone,
                address: (result.profile && result.profile.address) || address
            }) : null;
            if (bridge.setCurrentUser && bridge.normalizeUserData) {
                bridge.setCurrentUser(normalizedProfile);
            }
            if (bridge.saveState) bridge.saveState();
            if (typeof window.requestCatalogSyncAfterAuth === 'function') window.requestCatalogSyncAfterAuth();
            if (window.homeTabModule && typeof window.homeTabModule.renderGuestCta === 'function') window.homeTabModule.renderGuestCta();
            window.closeAuth();
            window.renderAccountTab();
            bridge.showToast && bridge.showToast('Đăng ký thành công!', 'success');
        } catch (error) {
            bridge.showToast && bridge.showToast(mapAccountError(error, 'register'), 'error');
        }
    };

    window.handleLogin = async function () {
        const bridge = getBridge();
        const loginId = String((document.getElementById('login-email') || {}).value || '').trim();
        const password = String((document.getElementById('login-pass') || {}).value || '').trim();

        if (!loginId || !password) return bridge.showToast && bridge.showToast('Nhập email/số điện thoại và mật khẩu!', 'warning');
        await (bridge.waitForRetailFirebaseReady ? bridge.waitForRetailFirebaseReady() : Promise.resolve());
        if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase())) {
            return bridge.showToast && bridge.showToast('Firebase chưa sẵn sàng.', 'warning');
        }

        try {
            const result = await window.retailFirebase.loginCustomer(loginId, password);
            const normalizedProfile = bridge.normalizeUserData ? bridge.normalizeUserData({
                ...(bridge.getCurrentUser ? bridge.getCurrentUser() : {}),
                ...(result.profile || {}),
                authUid: result.authUser ? result.authUser.uid : '',
                email: (result.profile && result.profile.email) || (result.authUser && result.authUser.email) || '',
                phone: (result.profile && result.profile.phone) || (loginId.indexOf('@') > -1 ? '' : loginId.replace(/\D/g, '')),
                shippingPhone: (result.profile && result.profile.shippingPhone) || ((result.profile && result.profile.phone) || (loginId.indexOf('@') > -1 ? '' : loginId.replace(/\D/g, '')))
            }) : null;
            if (bridge.setCurrentUser && bridge.normalizeUserData) {
                bridge.setCurrentUser(normalizedProfile);
            }
            if (bridge.syncOrdersFromFirebase) await bridge.syncOrdersFromFirebase({ force: true });
            if (bridge.saveState) bridge.saveState();
            if (typeof window.requestCatalogSyncAfterAuth === 'function') window.requestCatalogSyncAfterAuth();
            if (window.homeTabModule && typeof window.homeTabModule.renderGuestCta === 'function') window.homeTabModule.renderGuestCta();
            window.closeAuth();
            window.renderAccountTab();
            if (bridge.showToast) {
                bridge.showToast(
                    normalizedProfile && normalizedProfile.status === 'offline'
                        ? 'Đăng nhập thành công. Tài khoản hiện đang offline nên chưa xem được sản phẩm.'
                        : 'Đăng nhập thành công!',
                    normalizedProfile && normalizedProfile.status === 'offline' ? 'warning' : 'success'
                );
            }
        } catch (error) {
            bridge.showToast && bridge.showToast(mapAccountError(error, 'login'), 'error');
        }
    };

    window.handleForgotPassword = async function () {
        const bridge = getBridge();
        const identifier = String((document.getElementById('login-email') || {}).value || '').trim();
        if (!identifier) return bridge.showToast && bridge.showToast('Nhập email hoặc số điện thoại để lấy lại mật khẩu.', 'warning');
        await (bridge.waitForRetailFirebaseReady ? bridge.waitForRetailFirebaseReady() : Promise.resolve());
        if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase())) {
            return bridge.showToast && bridge.showToast('Firebase chưa sẵn sàng.', 'warning');
        }

        try {
            const result = await window.retailFirebase.requestPasswordReset(identifier);
            if (result && result.mode === 'zalo') {
                if (typeof window.openPasswordResetSupport === 'function') window.openPasswordResetSupport(identifier);
                bridge.showToast && bridge.showToast('Shop sẽ hỗ trợ cấp lại mật khẩu qua Zalo.', 'info');
                return;
            }
            bridge.showToast && bridge.showToast('Đã gửi email đặt lại mật khẩu.', 'success');
        } catch (error) {
            bridge.showToast && bridge.showToast(mapAccountError(error, 'login'), 'error');
        }
    };

    window.processLogout = function () {
        const bridge = getBridge();
        if (!bridge.openConfirmModal) return;
        bridge.openConfirmModal('Bạn muốn đăng xuất?', () => {
            Promise.resolve(window.retailFirebase && typeof window.retailFirebase.logout === 'function'
                ? window.retailFirebase.logout()
                : null
            ).finally(() => {
                if (bridge.setCurrentUser) bridge.setCurrentUser(null);
                if (bridge.saveState) bridge.saveState();
                
                // Xóa tên lưu tạm khi đăng xuất để Header reset về "Đăng nhập"
                localStorage.removeItem('ta_cached_name');

                if (typeof window.requestCatalogSyncAfterAuth === 'function') window.requestCatalogSyncAfterAuth();
                if (window.homeTabModule && typeof window.homeTabModule.renderGuestCta === 'function') window.homeTabModule.renderGuestCta();
                window.renderAccountTab();
                bridge.showToast && bridge.showToast('Đã đăng xuất.', 'success');
            });
        });
    };

    window.openSettings = function () {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;

        let addressesHtml = '<p class="text-sm text-gray-500 text-center py-4">Bạn chưa có địa chỉ nào.</p>';
        if (Array.isArray(user.addresses) && user.addresses.length > 0) {
            addressesHtml = user.addresses.map((address) => `
                <div class="bg-white rounded-2xl shadow-sm border ${address.isDefault ? 'border-babyPink bg-pink-50/30' : 'border-gray-200'} p-4 mb-3 relative text-left min-w-0">
                    ${address.isDefault ? '<div class="absolute top-3 right-3 text-[9px] font-bold bg-babyPink text-white px-2 py-1 rounded-full shadow-sm">Mặc định</div>' : ''}
                    <p class="text-sm text-gray-700 font-semibold pr-16 leading-6 break-words">${address.text}</p>
                    <p class="text-sm text-gray-500 mt-2 truncate">${address.phone || 'Chưa có số điện thoại giao hàng'}</p>
                    <div class="flex gap-3 mt-3 pt-3 border-t border-dashed">
                        ${!address.isDefault ? `<button onclick="setAddressDefault('${address.id}')" class="text-xs text-blue-500 font-bold hover:underline">Mặc định</button>` : ''}
                        <button onclick="openEditAddress('${address.id}')" class="text-xs text-amber-500 font-bold hover:underline ml-auto shrink-0"><i class="fa-solid fa-pen"></i> Sửa</button>
                        <button onclick="deleteAddress('${address.id}')" class="text-xs text-red-500 font-bold hover:underline ml-3 shrink-0"><i class="fa-solid fa-trash"></i> Xóa</button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('settings-content').innerHTML = `
            <div id="settings-view" class="space-y-4 min-w-0">
                <section class="rounded-2xl md:rounded-[28px] bg-white p-4 md:p-5 shadow-sm border border-gray-100 min-w-0">
                    <div class="rounded-[24px] bg-gray-50 p-5 text-center flex flex-col items-center">
                        <div class="w-24 h-24 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center text-babyPink text-3xl shadow-sm">
                            ${user.avatar ? `<img src="${bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(user.avatar, 'w300') : user.avatar}" loading="lazy" decoding="async" class="w-full h-full object-cover"/>` : `<i class="fa-regular fa-user"></i>`}
                        </div>
                        <button class="mt-4 text-sm font-bold text-gray-600 inline-flex items-center gap-2" onclick="openProfileFieldEditor('avatar')"><i class="fa-regular fa-pen-to-square"></i> Sửa</button>
                    </div>
                </section>

                <section class="rounded-[28px] bg-white shadow-sm border border-gray-100 overflow-hidden min-w-0">
                    <button class="w-full bg-gray-50 px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-pink-50 transition min-w-0" onclick="openProfileFieldEditor('name')">
                        <div class="min-w-0 flex-1">
                            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Hồ sơ người dùng</p>
                            <h3 class="font-bold text-lg text-gray-800 mt-1 truncate">${user.name || bridge.defaultGuestName || 'Khách Lẻ Web'}</h3>
                            <p class="text-sm text-gray-500 mt-1 truncate">${user.bio || 'Chưa cập nhật'}</p>
                        </div>
                        <span class="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-babyPink shadow-sm shrink-0">
                            <i class="fa-solid fa-angle-right"></i>
                        </span>
                    </button>
                    <div class="grid gap-px bg-gray-100 min-w-0">
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition min-w-0" onclick="openProfileFieldEditor('bio')">
                            <span class="text-gray-600 shrink-0">Tiểu sử</span>
                            <span class="font-bold text-gray-800 flex items-center justify-end gap-2 truncate flex-1 min-w-0 ml-4">
                                <span class="truncate min-w-0">${user.bio || 'Chưa cập nhật'}</span>
                                <i class="fa-solid fa-angle-right text-gray-300 shrink-0"></i>
                            </span>
                        </button>
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition min-w-0" onclick="openProfileFieldEditor('gender')">
                            <span class="text-gray-600 shrink-0">Giới tính</span>
                            <span class="font-bold text-gray-800 flex items-center justify-end gap-2 truncate flex-1 min-w-0 ml-4">
                                <span class="truncate min-w-0">${user.gender || 'Chưa cập nhật'}</span>
                                <i class="fa-solid fa-angle-right text-gray-300 shrink-0"></i>
                            </span>
                        </button>
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition min-w-0" onclick="openProfileFieldEditor('birthday')">
                            <span class="text-gray-600 shrink-0">Ngày sinh</span>
                            <span class="font-bold text-gray-800 flex items-center justify-end gap-2 truncate flex-1 min-w-0 ml-4">
                                <span class="truncate min-w-0">${bridge.formatBirthdayDisplay ? bridge.formatBirthdayDisplay(user.birthday) : (user.birthday || 'Thiết lập ngay')}</span>
                                <i class="fa-solid fa-angle-right text-gray-300 shrink-0"></i>
                            </span>
                        </button>
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition min-w-0" onclick="openProfileFieldEditor('personalInfo')">
                            <span class="text-gray-600 shrink-0">Cá nhân</span>
                            <span class="font-bold text-babyPink flex items-center justify-end gap-2 truncate flex-1 min-w-0 ml-4">
                                <span class="truncate min-w-0">${user.personalInfo || 'Thiết lập ngay'}</span>
                                <i class="fa-solid fa-angle-right text-gray-300 shrink-0"></i>
                            </span>
                        </button>
                    </div>
                </section>

                <section class="rounded-[28px] bg-white shadow-sm border border-gray-100 overflow-hidden min-w-0">
                    <div class="grid gap-px bg-gray-100 min-w-0">
                        <div class="bg-white px-4 py-4 flex items-center justify-between gap-4 min-w-0">
                            <span class="text-gray-600 shrink-0">SĐT đăng nhập</span>
                            <span class="font-bold text-gray-800 truncate flex-1 text-right ml-4 min-w-0">${user.phone || 'Chưa cập nhật'}</span>
                        </div>
                        <div class="bg-white px-4 py-4 flex items-center justify-between gap-4 min-w-0">
                            <span class="text-gray-600 shrink-0">Email</span>
                            <span class="font-bold text-gray-800 truncate flex-1 text-right ml-4 min-w-0">${user.email || 'Chưa cập nhật'}</span>
                        </div>
                    </div>
                </section>

                <section class="rounded-[28px] bg-white shadow-sm border border-gray-100 p-4 min-w-0">
                    <div class="flex items-center justify-between gap-3 min-w-0">
                        <div class="min-w-0">
                            <p class="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Bảo mật</p>
                            <h3 class="font-extrabold text-lg text-gray-800 mt-1 truncate">Mật khẩu</h3>
                        </div>
                        <button onclick="openChangePasswordModal()" class="bg-pink-50 text-babyPink px-4 py-2 rounded-2xl font-bold text-sm hover:bg-pink-100 transition shrink-0">Đổi</button>
                    </div>
                    <p class="text-sm text-gray-500 mt-3 leading-6 break-words">Nếu bạn đăng ký bằng số điện thoại, nút quên mật khẩu sẽ tự chuyển sang Zalo để shop hỗ trợ cấp lại.</p>
                </section>

                <div id="settings-editor-panel" class="fixed inset-0 z-[120] bg-black/50 modal-shell flex items-center justify-center p-4" onclick="if(event.target === this) closeProfileFieldEditor()">
                    <div class="modal-panel bg-white w-full max-w-sm md:max-w-md rounded-[28px] p-4 md:p-5 shadow-2xl" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-extrabold text-lg text-gray-800" id="settings-editor-title">Chỉnh sửa</h3>
                            <button class="text-gray-400 hover:text-gray-600 w-8 h-8 flex justify-center items-center rounded-full bg-gray-50 hover:bg-gray-100 transition" onclick="closeProfileFieldEditor()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div id="settings-editor-body" class="min-w-0"></div>
                        <div class="flex gap-3 mt-4">
                            <button onclick="closeProfileFieldEditor()" class="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition">Hủy</button>
                            <button onclick="saveProfileField()" class="flex-1 bg-babyPink text-white py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition">Lưu</button>
                        </div>
                    </div>
                </div>

                <section class="rounded-2xl md:rounded-[28px] bg-white p-4 md:p-5 shadow-sm border border-gray-100 min-w-0">
                    <div class="flex justify-between items-center mb-4 min-w-0">
                        <div class="min-w-0">
                            <h3 class="font-extrabold text-lg text-gray-800 truncate">Sổ địa chỉ</h3>
                            <p class="text-sm text-gray-500 mt-1 truncate">Lưu riêng địa chỉ và SĐT.</p>
                        </div>
                        <button onclick="toggleAddAddress()" class="text-babyPink font-bold cursor-pointer bg-pink-50 px-3 py-2 rounded-2xl shadow-sm shrink-0">+ Thêm</button>
                    </div>
                    ${addressesHtml}
                </section>
            </div>

            <div id="settings-add-address" data-editing-id="" class="hidden rounded-2xl md:rounded-[28px] bg-white p-4 md:p-5 shadow-sm border border-gray-100 text-left min-w-0">
                <h3 id="settings-address-title" class="font-extrabold text-lg text-gray-800 mb-3 truncate">Thêm địa chỉ mới</h3>
                <textarea id="new-address-text" placeholder="Nhập Số nhà, Đường, Phường, Quận, Tỉnh/TP..." class="w-full box-border bg-white border border-gray-200 rounded-2xl p-3 text-sm mb-3 h-24 focus:outline-babyPink shadow-sm"></textarea>
                <input id="new-address-phone" placeholder="Số điện thoại nhận hàng" class="w-full box-border bg-white border border-gray-200 rounded-2xl p-3 text-sm mb-3 focus:outline-babyPink shadow-sm" type="tel"/>
                <div class="flex items-center gap-2 mb-4 min-w-0">
                    <input type="checkbox" id="new-address-default" class="w-4 h-4 text-babyPink focus:ring-babyPink border-gray-300 rounded shrink-0"/>
                    <label for="new-address-default" class="text-sm text-gray-700 font-semibold truncate">Đặt làm mặc định</label>
                </div>
                <button onclick="saveAddress()" class="w-full bg-babyPink text-white py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition">Lưu địa chỉ</button>
                <button onclick="toggleAddAddress()" class="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold mt-2 hover:bg-gray-200 transition">Hủy</button>
            </div>
        `;

        if (bridge.openModalShell) bridge.openModalShell('account-settings-page');
    };

    window.closeSettings = function () {
        const bridge = getBridge();
        if (bridge.closeModalShell) bridge.closeModalShell('account-settings-page');
    };

    window.openProfileFieldEditor = function (field) {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;
        if (bridge.setActiveProfileField) bridge.setActiveProfileField(field);

        const panel = document.getElementById('settings-editor-panel');
        const title = document.getElementById('settings-editor-title');
        const body = document.getElementById('settings-editor-body');
        if (!panel || !title || !body) return;

        const templates = {
            avatar: {
                title: 'Cập nhật ảnh',
                html: `
                    <input id="settings-field-input" value="${user.avatar || ''}" class="w-full box-border bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Dán URL ảnh đại diện" type="text"/>
                    <div class="relative mt-3">
                        <input id="settings-avatar-file" class="w-full box-border bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" accept="image/*" type="file"/>
                    </div>
                `
            },
            name: { title: 'Sửa tên', html: `<input id="settings-field-input" value="${user.name || ''}" class="w-full box-border bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Nhập tên hiển thị" type="text"/>` },
            bio: { title: 'Sửa tiểu sử', html: `<textarea id="settings-field-input" class="w-full box-border bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm h-24 focus:outline-babyPink shadow-sm" placeholder="Viết ngắn gọn về bạn">${user.bio || ''}</textarea>` },
            gender: { title: 'Chọn giới tính', html: `<select id="settings-field-input" class="w-full box-border bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm"><option ${user.gender === 'Nam' ? 'selected' : ''}>Nam</option><option ${user.gender === 'Nữ' ? 'selected' : ''}>Nữ</option><option ${user.gender === 'Khác' ? 'selected' : ''}>Khác</option><option ${user.gender === 'Chưa cập nhật' ? 'selected' : ''}>Chưa cập nhật</option></select>` },
            birthday: { title: 'Ngày sinh', html: `<input id="settings-field-input" value="${user.birthday || ''}" class="w-full box-border bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" type="date"/>` },
            personalInfo: { title: 'Thông tin cá nhân', html: `<input id="settings-field-input" value="${user.personalInfo === 'Thiết lập ngay' ? '' : (user.personalInfo || '')}" class="w-full box-border bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Vd: Mẹ bỉm sữa, tìm đồ chơi..." type="text"/>` },
            passwordChange: {
                title: 'Đổi mật khẩu',
                html: `
                    <div class="space-y-3">
                        <div class="relative">
                            <input id="settings-current-pass" class="w-full box-border bg-gray-50 border border-gray-200 rounded-2xl p-3 pr-12 text-sm focus:outline-babyPink shadow-sm" placeholder="Mật khẩu hiện tại" type="password"/>
                            <button class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-babyPink transition" onclick="togglePasswordVisibility('settings-current-pass', 'settings-current-pass-toggle')" id="settings-current-pass-toggle" type="button"><i class="fa-regular fa-eye"></i></button>
                        </div>
                        <div class="relative">
                            <input id="settings-new-pass" class="w-full box-border bg-gray-50 border border-gray-200 rounded-2xl p-3 pr-12 text-sm focus:outline-babyPink shadow-sm" placeholder="Mật khẩu mới" type="password"/>
                            <button class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-babyPink transition" onclick="togglePasswordVisibility('settings-new-pass', 'settings-new-pass-toggle')" id="settings-new-pass-toggle" type="button"><i class="fa-regular fa-eye"></i></button>
                        </div>
                        <div class="relative">
                            <input id="settings-confirm-pass" class="w-full box-border bg-gray-50 border border-gray-200 rounded-2xl p-3 pr-12 text-sm focus:outline-babyPink shadow-sm" placeholder="Nhập lại mật khẩu mới" type="password"/>
                            <button class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-babyPink transition" onclick="togglePasswordVisibility('settings-confirm-pass', 'settings-confirm-pass-toggle')" id="settings-confirm-pass-toggle" type="button"><i class="fa-regular fa-eye"></i></button>
                        </div>
                    </div>
                `
            }
        };

        const template = templates[field];
        if (!template) return;
        title.innerText = template.title;
        body.innerHTML = template.html;
        if (bridge.openModalShell) bridge.openModalShell('settings-editor-panel');
        setTimeout(() => {
            const input = document.getElementById('settings-field-input');
            if (input) input.focus();
        }, 40);
    };

    window.closeProfileFieldEditor = function () {
        const bridge = getBridge();
        if (bridge.setActiveProfileField) bridge.setActiveProfileField('');
        if (bridge.closeModalShell) bridge.closeModalShell('settings-editor-panel');
    };

    window.openChangePasswordModal = function () {
        window.openProfileFieldEditor('passwordChange');
    };

    window.saveProfileField = async function () {
        const bridge = getBridge();
        const user = getNormalizedUser();
        const activeField = bridge.getActiveProfileField ? bridge.getActiveProfileField() : '';
        const input = document.getElementById('settings-field-input');
        if (!activeField || !user) return;

        if (activeField === 'passwordChange') {
            const currentPassword = String((document.getElementById('settings-current-pass') || {}).value || '').trim();
            const newPassword = String((document.getElementById('settings-new-pass') || {}).value || '').trim();
            const confirmPassword = String((document.getElementById('settings-confirm-pass') || {}).value || '').trim();
            if (!currentPassword || !newPassword || !confirmPassword) return bridge.showToast && bridge.showToast('Vui lòng nhập đủ thông tin đổi mật khẩu.', 'warning');
            if (newPassword.length < 6) return bridge.showToast && bridge.showToast('Mật khẩu mới cần tối thiểu 6 ký tự.', 'warning');
            if (newPassword !== confirmPassword) return bridge.showToast && bridge.showToast('Mật khẩu xác nhận chưa khớp.', 'warning');
            try {
                await window.retailFirebase.changePassword(currentPassword, newPassword);
                window.closeProfileFieldEditor();
                bridge.showToast && bridge.showToast('Đổi mật khẩu thành công.', 'success');
            } catch (error) {
                bridge.showToast && bridge.showToast(mapAccountError(error, 'login'), 'error');
            }
            return;
        }

        if (!input) return;

        let value = String(input.value || '').trim();
        if (activeField === 'name' && !value) return bridge.showToast && bridge.showToast('Tên hiển thị không được để trống.', 'warning');
        if (activeField === 'bio' && !value) return bridge.showToast && bridge.showToast('Tiểu sử không được để trống.', 'warning');

        if (activeField === 'avatar') {
            const fileInput = document.getElementById('settings-avatar-file');
            if (fileInput && fileInput.files && fileInput.files[0]) {
                try {
                    const formData = new FormData();
                    formData.append('avatar', fileInput.files[0]);
                    const response = await fetch('upload-avatar.php', { method: 'POST', body: formData });
                    const result = await response.json();
                    if (!response.ok || !result.url) throw new Error(result.message || 'UPLOAD_FAILED');
                    value = result.url;
                } catch (error) {
                    return bridge.showToast && bridge.showToast('Upload ảnh thất bại. Kiểm tra lại cấu hình thư mục.', 'warning');
                }
            }
        }

        if (activeField === 'personalInfo') user.personalInfo = value || 'Thiết lập ngay';
        else user[activeField] = value;

        if (bridge.setCurrentUser) bridge.setCurrentUser(user);
        if (bridge.saveState) bridge.saveState();
        if (bridge.scheduleIdleTask) bridge.scheduleIdleTask(() => bridge.syncCurrentUserToCloud && bridge.syncCurrentUserToCloud());
        window.closeProfileFieldEditor();
        window.openSettings();
        window.renderAccountTab();
        bridge.showToast && bridge.showToast('Hồ sơ đã được cập nhật.', 'success');
    };

    window.openEditAddress = function (addressId) {
        const user = getNormalizedUser();
        if (!user || !Array.isArray(user.addresses)) return;
        const address = user.addresses.find(a => a.id === addressId);
        if (!address) return;

        document.getElementById('new-address-text').value = address.text;
        document.getElementById('new-address-phone').value = address.phone || '';
        document.getElementById('new-address-default').checked = address.isDefault;
        document.getElementById('settings-add-address').dataset.editingId = addressId;
        document.getElementById('settings-address-title').innerText = 'Sửa địa chỉ';

        const view = document.getElementById('settings-view');
        const addAddress = document.getElementById('settings-add-address');
        view.classList.add('hidden');
        addAddress.classList.remove('hidden');
    };

    window.toggleAddAddress = function () {
        const view = document.getElementById('settings-view');
        const addAddress = document.getElementById('settings-add-address');
        if (!view || !addAddress) return;
        
        if (addAddress.classList.contains('hidden')) {
            document.getElementById('new-address-text').value = '';
            document.getElementById('new-address-phone').value = '';
            document.getElementById('new-address-default').checked = false;
            document.getElementById('settings-add-address').dataset.editingId = '';
            document.getElementById('settings-address-title').innerText = 'Thêm địa chỉ mới';
            
            view.classList.add('hidden');
            addAddress.classList.remove('hidden');
        } else {
            addAddress.classList.add('hidden');
            view.classList.remove('hidden');
        }
    };

    window.saveAddress = function () {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;

        const text = String((document.getElementById('new-address-text') || {}).value || '').trim();
        const phone = String((document.getElementById('new-address-phone') || {}).value || '').trim();
        const isDefault = !!((document.getElementById('new-address-default') || {}).checked);
        const editingId = document.getElementById('settings-add-address').dataset.editingId;

        if (!text) return bridge.showToast && bridge.showToast('Vui lòng nhập địa chỉ!', 'warning');
        if (!phone) return bridge.showToast && bridge.showToast('Vui lòng nhập số điện thoại giao hàng!', 'warning');

        if (!Array.isArray(user.addresses)) user.addresses = [];

        if (isDefault || user.addresses.length === 0 || (editingId && user.addresses.length === 1)) {
            user.addresses.forEach((a) => { a.isDefault = false; });
        }

        const nextIsDefault = isDefault || user.addresses.length === 0;

        if (editingId) {
            const addressIndex = user.addresses.findIndex(a => a.id === editingId);
            if (addressIndex > -1) {
                user.addresses[addressIndex].text = text;
                user.addresses[addressIndex].phone = phone;
                user.addresses[addressIndex].isDefault = nextIsDefault;
            }
        } else {
            user.addresses.push({ id: `addr_${Date.now()}`, text, phone, isDefault: nextIsDefault });
        }

        if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
            user.addresses[0].isDefault = true;
        }

        const defaultAddress = getDefaultAddress(user);
        if (defaultAddress) {
            user.address = defaultAddress.text;
            user.shippingPhone = defaultAddress.phone || user.shippingPhone || '';
        }

        if (bridge.setCurrentUser) bridge.setCurrentUser(user);
        if (bridge.saveState) bridge.saveState();
        if (bridge.scheduleIdleTask) bridge.scheduleIdleTask(() => bridge.syncCurrentUserToCloud && bridge.syncCurrentUserToCloud());
        window.openSettings();
        bridge.showToast && bridge.showToast(editingId ? 'Đã cập nhật địa chỉ.' : 'Đã lưu địa chỉ giao hàng.', 'success');
    };

    window.setAddressDefault = function (addressId) {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user || !Array.isArray(user.addresses)) return;

        user.addresses.forEach((address) => { address.isDefault = address.id === addressId; });
        const defaultAddress = getDefaultAddress(user);
        if (defaultAddress) {
            user.address = defaultAddress.text;
            user.shippingPhone = defaultAddress.phone || user.shippingPhone || '';
        }
        if (bridge.setCurrentUser) bridge.setCurrentUser(user);
        if (bridge.saveState) bridge.saveState();
        if (bridge.scheduleIdleTask) bridge.scheduleIdleTask(() => bridge.syncCurrentUserToCloud && bridge.syncCurrentUserToCloud());
        window.openSettings();
        bridge.showToast && bridge.showToast('Đã cập nhật địa chỉ mặc định.', 'success');
    };

    window.deleteAddress = function (addressId) {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user || !Array.isArray(user.addresses) || !bridge.openConfirmModal) return;

        bridge.openConfirmModal('Bạn có chắc muốn xóa địa chỉ này?', () => {
            user.addresses = user.addresses.filter((address) => address.id !== addressId);
            if (user.addresses.length > 0 && !user.addresses.find((address) => address.isDefault)) user.addresses[0].isDefault = true;
            const defaultAddress = getDefaultAddress(user);
            user.address = defaultAddress ? defaultAddress.text : '';
            user.shippingPhone = defaultAddress ? (defaultAddress.phone || '') : '';
            if (bridge.setCurrentUser) bridge.setCurrentUser(user);
            if (bridge.saveState) bridge.saveState();
            if (bridge.scheduleIdleTask) bridge.scheduleIdleTask(() => bridge.syncCurrentUserToCloud && bridge.syncCurrentUserToCloud());
            window.openSettings();
            bridge.showToast && bridge.showToast('Đã xóa địa chỉ.', 'success');
        });
    };

    window.openWishlist = function () {
        window.renderWishlistUI();
        openPage('wishlist-page');
    };

    window.closeWishlist = function () {
        closePage('wishlist-page');
    };

    window.renderWishlistUI = function () {
        const bridge = getBridge();
        const container = document.getElementById('wishlist-content');
        const wishlistData = bridge.getWishlistData ? bridge.getWishlistData() : [];
        const products = bridge.getShopProducts ? bridge.getShopProducts() : [];
        if (!container) return;

        if (!wishlistData.length) {
            container.innerHTML = `<div class='col-span-2 md:col-span-4 flex flex-col items-center justify-center py-20 text-gray-400'><i class='fa-regular fa-heart text-5xl mb-3 opacity-50'></i><p>Bạn chưa yêu thích sản phẩm nào.</p></div>`;
            return;
        }

        const items = products.filter((product) => wishlistData.includes(product.id));
        container.innerHTML = items.map((product) => `
            <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative group transition hover:shadow-md flex flex-col h-full">
                ${bridge.renderProductBadges ? bridge.renderProductBadges(product) : ''}
                <button onclick="toggleWishlist(event, '${product.id}')" class="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-red-500 hover:text-gray-300 transition"><i class="fa-solid fa-heart"></i></button>
                <div onclick="openProductDetail('${product.id}')" class="cursor-pointer">
                    <img src="${bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(product.img, 'w600') : product.img}" loading="lazy" decoding="async" class="w-full h-32 md:h-48 object-cover rounded-xl mb-3" />
                    <h4 class="text-sm font-bold text-gray-700 line-clamp-2 leading-tight mb-2 hover:text-babyPink transition">${bridge.getProductDisplayName ? bridge.getProductDisplayName(product) : product.name}</h4>
                </div>
                <div class="flex justify-between items-end mt-auto pt-2">
                    <div><span class="text-babyPink font-extrabold text-sm block">${product.price}</span></div>
                    <button onclick="${bridge.isProductInStock && bridge.isProductInStock(product) ? `openPopup('${product.id}')` : `showToast('Sản phẩm hiện đã hết hàng.', 'warning')`}" class="${bridge.isProductInStock && bridge.isProductInStock(product) ? 'bg-babyPink text-white w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-pink-500 transition' : 'bg-gray-200 text-gray-400 w-8 h-8 rounded-full shadow-sm flex items-center justify-center opacity-60 cursor-not-allowed'}" ${bridge.isProductInStock && bridge.isProductInStock(product) ? '' : 'disabled'}><i class="fa-solid fa-cart-plus text-sm"></i></button>
                </div>
            </div>
        `).join('');
    };

    window.openOrders = async function () {
        const bridge = getBridge();
        if (bridge.syncOrdersFromFirebase) await bridge.syncOrdersFromFirebase({ force: true });
        window.renderOrdersUI();
        openPage('orders-page');
    };

    window.closeOrders = function () {
        closePage('orders-page');
        const bridge = getBridge();
        if (bridge.closeModalShell) bridge.closeModalShell('order-detail-overlay');
    };

    window.closeOrderDetail = function () {
        const bridge = getBridge();
        if (bridge.closeModalShell) bridge.closeModalShell('order-detail-overlay');
    };

    window.openOrderDetail = async function (orderId) {
        const bridge = getBridge();
        const user = getNormalizedUser();
        if (!user) return;

        if (bridge.syncOrderDetailFromFirebase) await bridge.syncOrderDetailFromFirebase(orderId);
        const refreshedUser = getNormalizedUser();
        const order = getSafeOrders(refreshedUser).find((item) => item.id === orderId);
        if (!order) return;

        const totals = bridge.getOrderTotals ? bridge.getOrderTotals(order) : { finalAmount: 0 };
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
                        <p class="text-xl font-extrabold text-babyPink">${bridge.formatMoney ? bridge.formatMoney(totals.finalAmount) : totals.finalAmount}</p>
                    </div>
                </div>
            </div>
            <div class="space-y-3">
                ${(order.items || []).map((item) => `
                    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3">
                        <img src="${bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(item.img, 'w400') : item.img}" loading="lazy" decoding="async" class="w-20 h-20 object-cover rounded-xl border border-gray-100"/>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-sm text-gray-800 line-clamp-2">${bridge.getProductDisplayName ? bridge.getProductDisplayName(item) : item.name}</h4>
                            ${item.variantInfo ? `<p class="text-xs text-gray-500 mt-1">${item.variantInfo}</p>` : ''}
                            <div class="flex justify-between items-center mt-3 text-sm">
                                <span class="text-gray-500">SL: x${item.quantity}</span>
                                <span class="font-bold text-babyPink">${item.price}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        if (bridge.openModalShell) bridge.openModalShell('order-detail-overlay');
    };

    window.renderOrdersUI = function () {
        const bridge = getBridge();
        const container = document.getElementById('orders-content');
        const user = getNormalizedUser();
        if (!container) return;

        const orders = getSafeOrders(user);
        if (!orders.length) {
            container.innerHTML = `<div class='flex flex-col items-center justify-center py-20 text-gray-400'><i class='fa-solid fa-box-open text-5xl mb-3 opacity-50'></i><p>Bạn chưa có đơn hàng nào.</p><button onclick='closeOrders(); goToTab("tab-home");' class='mt-4 border border-babyPink text-babyPink px-4 py-1.5 rounded-full text-sm font-bold'>Mua sắm ngay</button></div>`;
            return;
        }

        container.innerHTML = [...orders].reverse().map((order) => {
            const totals = bridge.getOrderTotals ? bridge.getOrderTotals(order) : { finalAmount: 0 };
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
                            <span class="text-lg font-bold text-babyPink">${bridge.formatMoney ? bridge.formatMoney(totals.finalAmount) : totals.finalAmount}</span>
                        </div>
                    </div>
                    <button class="mt-4 w-full bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-pink-50 hover:text-babyPink transition" onclick="openOrderDetail('${order.id}')">Xem chi tiết</button>
                </div>
            `;
        }).join('');
    };

    // Load Header tức thì khi vừa nạp xong HTML
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.updateHeaderUserBadge);
    } else {
        window.updateHeaderUserBadge();
    }

    window.accountTabModule = {
        render: window.renderAccountTab,
        renderOrders: window.renderOrdersUI,
        renderWishlist: window.renderWishlistUI
    };

    window.dispatchEvent(new Event('web-new-account-tab-ready'));
})();
