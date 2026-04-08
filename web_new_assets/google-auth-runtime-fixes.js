(function () {
    if (window.__webNewGoogleAuthRuntimeFixesLoaded) return;
    window.__webNewGoogleAuthRuntimeFixesLoaded = true;

    function getBridge() {
        return window.webNewAppBridge || {};
    }

    function isInactiveCustomer(user) {
        var safeStatus = String((user && (user.status || user.customerStatus)) || '').trim().toLowerCase();
        return safeStatus === 'offline'
            || safeStatus === 'inactive'
            || safeStatus === 'disabled'
            || safeStatus === 'blocked'
            || safeStatus === 'lock'
            || safeStatus === 'locked'
            || safeStatus.indexOf('ngung') >= 0
            || safeStatus.indexOf('ngung hoat dong') >= 0;
    }

    function getGoogleAuthErrorMessage(error) {
        var code = String((error && error.code) || '').trim().toLowerCase();
        var message = String((error && error.message) || '').trim().toLowerCase();
        var raw = code + ' ' + message;
        var hostname = String((window.location && window.location.hostname) || '').trim();

        if (raw.indexOf('unauthorized-domain') >= 0 || raw.indexOf('current domain is not authorized') >= 0) {
            return 'Domain ' + (hostname || 'hien tai') + ' chua duoc them vao Firebase Authentication > Settings > Authorized domains.';
        }
        if (raw.indexOf('operation-not-allowed') >= 0 || raw.indexOf('google-provider-unavailable') >= 0) {
            return 'Firebase chua bat provider Google. Vao Authentication > Sign-in method va bat Google.';
        }
        if (raw.indexOf('popup-blocked') >= 0) {
            return 'Trinh duyet dang chan popup dang nhap Gmail. Hay cho phep popup roi thu lai.';
        }
        if (raw.indexOf('popup-closed-by-user') >= 0) {
            return 'Ban da dong cua so dang nhap Gmail truoc khi hoan tat.';
        }
        if (raw.indexOf('account-exists-with-different-credential') >= 0) {
            return 'Email nay da ton tai bang phuong thuc dang nhap khac. Hay dang nhap bang cach cu truoc.';
        }
        return 'Dang nhap Gmail that bai. Kiem tra Google provider va Authorized domains trong Firebase.';
    }

    window.handleGoogleAuth = async function () {
        var bridge = getBridge();
        await (bridge.waitForRetailFirebaseReady ? bridge.waitForRetailFirebaseReady() : Promise.resolve());
        if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase()) || !window.retailFirebase || typeof window.retailFirebase.loginWithGoogle !== 'function') {
            return bridge.showToast && bridge.showToast('Firebase chua san sang.', 'warning');
        }

        try {
            var result = await window.retailFirebase.loginWithGoogle();
            var profile = result && result.profile ? result.profile : {};
            var authUser = result && result.authUser ? result.authUser : null;
            var normalizedProfile = bridge.normalizeUserData ? bridge.normalizeUserData(Object.assign(
                {},
                bridge.getCurrentUser ? (bridge.getCurrentUser() || {}) : {},
                profile || {},
                {
                    authUid: authUser ? authUser.uid : '',
                    email: (profile && profile.email) || (authUser && authUser.email) || '',
                    name: (profile && profile.name) || (authUser && authUser.displayName) || '',
                    phone: (profile && profile.phone) || '',
                    shippingPhone: (profile && profile.shippingPhone) || (profile && profile.phone) || ''
                }
            )) : profile;

            if (bridge.setCurrentUser && bridge.normalizeUserData) {
                bridge.setCurrentUser(normalizedProfile);
            }
            if (bridge.syncOrdersFromFirebase && authUser && authUser.uid) {
                await bridge.syncOrdersFromFirebase({ force: true });
            }
            if (bridge.saveState) bridge.saveState();
            if (typeof window.requestCatalogSyncAfterAuth === 'function') window.requestCatalogSyncAfterAuth();
            if (window.homeTabModule && typeof window.homeTabModule.renderGuestCta === 'function') window.homeTabModule.renderGuestCta();
            if (typeof window.scheduleShortcutPromptAfterLogin === 'function') window.scheduleShortcutPromptAfterLogin();
            if (result && result.isNewUser && bridge.scheduleIdleTask && bridge.sendTelegramEvent) {
                bridge.scheduleIdleTask(function () {
                    bridge.sendTelegramEvent('register', {
                        name: normalizedProfile && normalizedProfile.name ? normalizedProfile.name : '',
                        email: normalizedProfile && normalizedProfile.email ? normalizedProfile.email : '',
                        phone: normalizedProfile && normalizedProfile.phone ? normalizedProfile.phone : '',
                        address: normalizedProfile && normalizedProfile.address ? normalizedProfile.address : '',
                        customerType: normalizedProfile && normalizedProfile.group ? normalizedProfile.group : 'Khach le tu web'
                    });
                });
            }
            if (typeof window.closeAuth === 'function') window.closeAuth();
            if (typeof window.renderAccountTab === 'function') window.renderAccountTab();
            if (bridge.showToast) {
                var inactiveProfile = isInactiveCustomer(normalizedProfile);
                var successMessage = result && result.isNewUser
                    ? 'Tao tai khoan Gmail thanh cong!'
                    : 'Dang nhap Gmail thanh cong!';
                bridge.showToast(
                    inactiveProfile
                        ? 'Dang nhap thanh cong. Tai khoan hien dang ngung hoat dong nen chua xem duoc san pham va du lieu ban hang.'
                        : successMessage,
                    inactiveProfile ? 'warning' : 'success'
                );
            }
        } catch (error) {
            console.error('Google auth error:', error);
            if (bridge.showToast) bridge.showToast(getGoogleAuthErrorMessage(error), 'error');
        }
    };
})();
