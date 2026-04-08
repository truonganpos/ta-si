(function () {
    var config = {
        guestBlockedMessage: "Vui lòng đăng nhập để xem danh sách sản phẩm và giá mới nhất.",
        inactiveBlockedMessage: "Tài khoản của bạn đang ở trạng thái ngừng hoạt động. Bạn vẫn đăng nhập được nhưng chưa thể xem sản phẩm."
    };

    function normalizeStatus(user) {
        var safeStatus = String((user && (user.status || user.customerStatus)) || "").trim().toLowerCase();
        if (!safeStatus || ["active", "online", "hoạt động", "hoat dong", "đang giao dịch", "dang giao dich"].includes(safeStatus)) return "Hoạt động";
        if (["offline", "inactive", "disabled", "blocked", "lock", "locked", "ngừng hoạt động", "ngung hoat dong", "ngừng giao dịch", "ngung giao dich"].includes(safeStatus)) return "Ngừng hoạt động";
        return String((user && (user.status || user.customerStatus)) || "").trim() || "Hoạt động";
    }

    window.webNewCatalogGate = {
        enabled: true,
        shouldBlockCatalog: function (user) {
            if (!(user && user.authUid)) return true;
            return normalizeStatus(user) === "Ngừng hoạt động";
        },
        getBlockedMessage: function () {
            var user = window.webNewAppBridge && typeof window.webNewAppBridge.getCurrentUser === "function"
                ? window.webNewAppBridge.getCurrentUser()
                : null;
            if (user && user.authUid && normalizeStatus(user) === "Ngừng hoạt động") {
                return String(config.inactiveBlockedMessage || "Tài khoản đang ngừng hoạt động.").trim();
            }
            return String(config.guestBlockedMessage || "Vui lòng đăng nhập để xem sản phẩm.").trim();
        }
    };
})();
