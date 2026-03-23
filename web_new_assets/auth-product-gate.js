(function () {
    // Xóa file này đi là web sẽ bỏ chế độ khóa catalog theo đăng nhập/trạng thái khách.
    // Chỉ cần sửa 2 biến message bên dưới nếu muốn đổi nội dung hiển thị.
    var config = {
        guestBlockedMessage: "Vui lòng đăng nhập để xem danh sách sản phẩm và giá mới nhất.",
        offlineBlockedMessage: "Tài khoản của bạn đang ở trạng thái offline. Bạn vẫn đăng nhập được nhưng chưa thể xem sản phẩm."
    };

    function normalizeStatus(user) {
        var safeStatus = String((user && (user.status || user.customerStatus)) || "").trim().toLowerCase();
        if (!safeStatus || safeStatus === "active" || safeStatus === "online") return "online";
        if (["offline", "inactive", "disabled", "blocked", "lock", "locked"].includes(safeStatus)) return "offline";
        return safeStatus;
    }

    window.webNewCatalogGate = {
        enabled: true,
        shouldBlockCatalog: function (user) {
            if (!(user && user.authUid)) return true;
            return normalizeStatus(user) === "offline";
        },
        getBlockedMessage: function () {
            var user = window.webNewAppBridge && typeof window.webNewAppBridge.getCurrentUser === "function"
                ? window.webNewAppBridge.getCurrentUser()
                : null;
            if (user && user.authUid && normalizeStatus(user) === "offline") {
                return String(config.offlineBlockedMessage || "Tài khoản đang offline.").trim();
            }
            return String(config.guestBlockedMessage || "Vui lòng đăng nhập để xem sản phẩm.").trim();
        }
    };
})();
