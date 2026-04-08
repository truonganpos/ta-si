(function () {
    // Chinh sua thu cong cac moc chiet khau hoa don tai day.
    // amount: tong tien don hang, percent: phan tram giam, label: nhan hien thi tren web.
    // Muon tat hoan toan tinh nang nay, doi DISCOUNT_TIERS thanh [].
    var DISCOUNT_TIERS = [
        { amount: 1000000, percent: 1, label: "Chiết khấu 1%" },
        { amount: 5000000, percent: 3, label: "Chiết khấu 3%" },
        
    ];
    var EDIT_ORDER_STORAGE_KEY = "ta_editing_order_v1";
    var editingOrderState = null;
    var cartQtyDraftMap = {};
    var checkoutSubmissionInFlight = false;

    function getBridge() {
        return window.webNewAppBridge || {};
    }

    function getCartItems() {
        var bridge = getBridge();
        var cart = bridge.getCartData ? bridge.getCartData() : [];
        return Array.isArray(cart) ? cart : [];
    }

    function setCartItems(nextCart) {
        var bridge = getBridge();
        if (bridge.setCartData) bridge.setCartData(Array.isArray(nextCart) ? nextCart : []);
    }

    function getCurrentViewingProduct() {
        var bridge = getBridge();
        return bridge.getCurrentViewingProduct ? bridge.getCurrentViewingProduct() : null;
    }

    function getCurrentUser() {
        var bridge = getBridge();
        return bridge.getCurrentUser ? bridge.getCurrentUser() : null;
    }

    function parseMoney(value) {
        var bridge = getBridge();
        if (bridge.parseMoney) return bridge.parseMoney(value);
        if (typeof value === "number") return value;
        return parseInt(String(value || "").replace(/[^0-9]/g, ""), 10) || 0;
    }

    function formatMoney(value) {
        var bridge = getBridge();
        if (bridge.formatMoney) return bridge.formatMoney(value);
        return (Number(value || 0) || 0).toLocaleString("vi-VN") + "đ";
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function readEditingOrderState() {
        try {
            var raw = localStorage.getItem(EDIT_ORDER_STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            return parsed && parsed.orderId ? parsed : null;
        } catch (error) {
            return null;
        }
    }

    function persistEditingOrderState() {
        try {
            if (editingOrderState && editingOrderState.orderId) {
                localStorage.setItem(EDIT_ORDER_STORAGE_KEY, JSON.stringify(editingOrderState));
            } else {
                localStorage.removeItem(EDIT_ORDER_STORAGE_KEY);
            }
        } catch (error) {}
    }

    function getEditingOrderState() {
        return editingOrderState && editingOrderState.orderId ? editingOrderState : null;
    }

    function setEditingOrderState(nextValue) {
        editingOrderState = nextValue && nextValue.orderId
            ? {
                orderId: String(nextValue.orderId || "").trim(),
                customerName: String(nextValue.customerName || "").trim(),
                phone: String(nextValue.phone || "").trim(),
                email: String(nextValue.email || "").trim(),
                address: String(nextValue.address || "").trim(),
                note: String(nextValue.note || "").trim()
            }
            : null;
        persistEditingOrderState();
        return getEditingOrderState();
    }

    function clearEditingOrderState() {
        editingOrderState = null;
        persistEditingOrderState();
    }

    function setCartQtyDraftValue(cartId, value) {
        var safeCartId = String(cartId || "").trim();
        if (!safeCartId) return;
        cartQtyDraftMap[safeCartId] = String(value == null ? "" : value).replace(/[^\d]/g, "");
    }

    function getCartQtyDraftValue(cartId) {
        var safeCartId = String(cartId || "").trim();
        if (!safeCartId) return null;
        if (!Object.prototype.hasOwnProperty.call(cartQtyDraftMap, safeCartId)) return null;
        return typeof cartQtyDraftMap[safeCartId] === "string" ? cartQtyDraftMap[safeCartId] : null;
    }

    function clearCartQtyDraftValue(cartId) {
        var safeCartId = String(cartId || "").trim();
        if (!safeCartId) return;
        delete cartQtyDraftMap[safeCartId];
    }

    function cloneCartSnapshot(items) {
        return (Array.isArray(items) ? items : []).map(function (item) {
            return Object.assign({}, item);
        });
    }

    function setCheckoutSubmittingState(isSubmitting, label) {
        var checkoutBtn = document.getElementById("cart-checkout-btn");
        if (!checkoutBtn) return;
        checkoutBtn.disabled = !!isSubmitting;
        checkoutBtn.innerText = String(label || (isSubmitting ? "Đang gửi đơn..." : "Đặt Hàng Ngay")).trim();
        checkoutBtn.classList.toggle("opacity-70", !!isSubmitting);
        checkoutBtn.classList.toggle("cursor-wait", !!isSubmitting);
    }

    function buildOrderSuccessPayload(orderId, checkoutInfo, orderItems, totals, options) {
        var config = options || {};
        return {
            orderId: orderId,
            submissionKey: config.submissionKey || orderId,
            createdAt: config.createdAt || new Date().toLocaleString("vi-VN"),
            items: orderItems,
            originalAmount: totals.originalAmount,
            totalAmount: totals.totalAmount,
            productDiscountValue: totals.productDiscountValue,
            orderDiscountPercent: totals.orderDiscountPercent,
            orderDiscountValue: totals.orderDiscountValue,
            finalAmount: totals.finalAmount,
            customerName: checkoutInfo.customerName,
            phone: checkoutInfo.phone,
            email: checkoutInfo.email,
            address: checkoutInfo.address,
            persisted: !!config.persisted,
            pendingSync: !!config.pendingSync,
            updatedExistingOrder: !!config.updatedExistingOrder
        };
    }

    function isProductInStock(product) {
        var bridge = getBridge();
        if (bridge.isProductInStock) return !!bridge.isProductInStock(product);
        return !!(product && product.inStock !== false);
    }

    function getProductDisplayName(product) {
        var bridge = getBridge();
        return bridge.getProductDisplayName ? bridge.getProductDisplayName(product) : String((product && product.name) || "");
    }

    function getProductMinQty(product) {
        var bridge = getBridge();
        if (bridge.getProductMinQty) return Math.max(Number(bridge.getProductMinQty(product) || 1) || 1, 1);
        return Math.max(Number((product && (product.minQty || product.si_tu || product.su)) || 1) || 1, 1);
    }

    function getProductUnit(product) {
        var bridge = getBridge();
        if (bridge.getProductUnit) return String(bridge.getProductUnit(product) || "").trim();
        return String((product && product.unit) || "").trim();
    }

    function getProductPricingMeta(product) {
        var bridge = getBridge();
        if (bridge.getProductPricingMeta) return bridge.getProductPricingMeta(product) || {};
        var currentValue = Number(product && product.priceValue) || parseMoney(product && product.price);
        var originalValue = Number(product && product.originalPriceValue) || parseMoney(product && product.originalPrice);
        var salePercent = bridge.getProductSalePercent
            ? bridge.getProductSalePercent(product)
            : (Number(product && product.salePercent || 0) || 0);
        return {
            currentValue: currentValue,
            originalValue: originalValue > currentValue ? originalValue : currentValue,
            salePercent: salePercent
        };
    }

    function clampQty(value, fallback, minQty) {
        var safeFallback = Math.max(Number(fallback || 1) || 1, 1);
        var safeMin = Math.max(Number(minQty || safeFallback) || safeFallback, 1);
        var parsed = parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
        if (!parsed || parsed < safeMin) return safeMin;
        return parsed;
    }

    function getDiscountTierForAmount(totalAmount) {
        var subtotal = Number(totalAmount || 0) || 0;
        var matched = null;
        DISCOUNT_TIERS.forEach(function (tier) {
            if (subtotal >= tier.amount) matched = tier;
        });
        return matched;
    }

    function getNextDiscountTier(totalAmount) {
        var subtotal = Number(totalAmount || 0) || 0;
        for (var i = 0; i < DISCOUNT_TIERS.length; i += 1) {
            if (subtotal < DISCOUNT_TIERS[i].amount) return DISCOUNT_TIERS[i];
        }
        return null;
    }

    function buildCartItem(product, quantity, variantStr) {
        var minQty = getProductMinQty(product);
        var pricingMeta = getProductPricingMeta(product);
        return {
            cartId: variantStr ? product.id + "_" + variantStr : product.id,
            id: product.id,
            name: product.name,
            code: String(product.code || product.id || "").trim(),
            group: String(product.group || product.cat || "").trim(),
            unit: getProductUnit(product),
            minQty: minQty,
            price: product.price,
            priceValue: pricingMeta.currentValue || parseMoney(product.price),
            originalPrice: String(product.originalPrice || '').trim(),
            originalPriceValue: pricingMeta.originalValue || parseMoney(product.originalPrice),
            salePercent: Number(pricingMeta.salePercent || 0) || 0,
            img: product.img,
            quantity: clampQty(quantity, minQty, minQty),
            variantInfo: variantStr
        };
    }

    function getOrderTotals(order) {
        var totalAmount = Number(order && (order.totalAmount || order.total_amount || 0)) || 0;
        var items = order && Array.isArray(order.items) ? order.items : [];
        var originalAmount = Number(order && (order.originalAmount || order.original_amount || 0)) || 0;

        if (!totalAmount) {
            items.forEach(function (item) {
                var quantity = Number(item.quantity || item.qty || 1) || 1;
                var currentValue = Number(item.priceValue || 0) || parseMoney(item.price);
                var originalValue = Number(item.originalPriceValue || 0) || parseMoney(item.originalPrice);
                totalAmount += currentValue * quantity;
                originalAmount += Math.max(originalValue || currentValue, currentValue) * quantity;
            });
        }
        if (!originalAmount) originalAmount = totalAmount;

        var productDiscountValue = Number(order && (order.productDiscountValue || order.product_discount_value) || 0) || Math.max(0, originalAmount - totalAmount);

        var discountTier = getDiscountTierForAmount(totalAmount);
        var orderDiscountPercent = Number(order && (order.orderDiscountPercent || order.order_discount_percent || order.discountPercent || order.discount_percent) || 0) || 0;
        if (!orderDiscountPercent && discountTier) orderDiscountPercent = discountTier.percent;

        var orderDiscountValue = Number(order && (order.orderDiscountValue || order.order_discount_value || order.discountValue || order.discount_value) || 0) || 0;
        if (!orderDiscountValue && orderDiscountPercent > 0) orderDiscountValue = Math.round((totalAmount * orderDiscountPercent) / 100);

        var shippingFee = Number(order && (order.shippingFee || order.shipping_fee) || 0) || 0;
        var finalAmount = Number(order && (order.finalAmount || order.final_amount) || 0) || Math.max(0, totalAmount - orderDiscountValue + shippingFee);

        return {
            originalAmount: originalAmount,
            totalAmount: totalAmount,
            productDiscountValue: productDiscountValue,
            orderDiscountPercent: orderDiscountPercent,
            orderDiscountValue: orderDiscountValue,
            discountPercent: orderDiscountPercent,
            discountValue: orderDiscountValue,
            finalAmount: finalAmount,
            tier: discountTier
        };
    }

    function mapOrderError(error) {
        var rawCode = String((error && error.code) || "").trim().toLowerCase();
        var rawMessage = String((error && error.message) || "").trim().toLowerCase();
        var joined = rawCode + " " + rawMessage;

        if (joined.indexOf("operation-not-allowed") >= 0 || joined.indexOf("anonymous") >= 0) {
            return "Firebase chưa bật Anonymous Auth nên chưa tạo được đơn web sỉ cho khách chưa đăng nhập.";
        }
        if (joined.indexOf("order-not-found") >= 0) {
            return "Không tìm thấy đơn hàng để cập nhật. Vui lòng tải lại danh sách đơn.";
        }
        if (joined.indexOf("order-not-editable") >= 0 || joined.indexOf("order-not-cancellable") >= 0) {
            return "Đơn hàng này không còn ở trạng thái cho phép chỉnh sửa.";
        }
        if (joined.indexOf("product-unavailable") >= 0 || joined.indexOf("invalid-product-reference") >= 0) {
            return "Một số sản phẩm trong giỏ không còn hợp lệ hoặc đã ngừng bán. Vui lòng kiểm tra lại giỏ hàng.";
        }
        if (joined.indexOf("permission") >= 0 || joined.indexOf("denied") >= 0) {
            return "Firebase đang chặn ghi đơn hàng. Vui lòng kiểm tra rules hoặc quyền tài khoản.";
        }
        if (joined.indexOf("not-authenticated") >= 0) {
            return "Phiên đặt hàng chưa sẵn sàng. Vui lòng thử lại.";
        }
        if (joined.indexOf("pending-reservation-sync-failed") >= 0) {
            return "Không giữ được hàng kẹt cho một số sản phẩm nên đơn chưa được tạo. Vui lòng thử lại.";
        }
        if (joined.indexOf("firebase-only-order-storage") >= 0) {
            return "Web này chỉ lưu đơn trên Firebase. Vui lòng kiểm tra đăng nhập và quyền ghi dữ liệu.";
        }
        if (joined.indexOf("firebase-ready-missing") >= 0 || joined.indexOf("firebase-sdk-missing") >= 0) {
            return "Firebase chưa sẵn sàng. Vui lòng thử lại sau vài giây.";
        }
        if (joined.indexOf("submit-order-disabled") >= 0) {
            return "Web chưa bật tính năng tạo đơn hàng.";
        }
        return "Chưa tạo được đơn hàng trên Firebase. Vui lòng thử lại.";
    }

    function syncCartState(nextCart, options) {
        var bridge = getBridge();
        setCartItems(nextCart);
        if (bridge.saveState) bridge.saveState();
        if ((!options || options.skipBadge !== true) && typeof window.updateBadgeNumbers === "function") {
            window.updateBadgeNumbers();
        }
        if ((!options || options.skipRender !== true) && typeof window.renderCartUI === "function") {
            window.renderCartUI();
        }
    }

    function mergeOrdersById(localOrders, nextOrders) {
        var mergedMap = {};
        []
            .concat(Array.isArray(localOrders) ? localOrders : [])
            .concat(Array.isArray(nextOrders) ? nextOrders : [])
            .forEach(function (order) {
                if (!order || !order.id) return;
                var current = mergedMap[order.id] || {};
                mergedMap[order.id] = Object.assign({}, current, order, {
                    items: Array.isArray(order.items) && order.items.length
                        ? order.items
                        : (Array.isArray(current.items) ? current.items : [])
                });
            });
        return Object.keys(mergedMap).map(function (orderId) {
            return mergedMap[orderId];
        }).sort(function (left, right) {
            return (Number((right && right.sortTs) || 0) || 0) - (Number((left && left.sortTs) || 0) || 0);
        });
    }

    function upsertCurrentUserOrder(orderSummary) {
        var bridge = getBridge();
        if (!orderSummary || !orderSummary.id || !bridge.getCurrentUser || !bridge.setCurrentUser) return null;
        var currentUser = bridge.getCurrentUser();
        if (!currentUser || !(currentUser.authUid || currentUser.auth_uid)) return null;
        var nextUser = Object.assign({}, currentUser, {
            orders: mergeOrdersById((currentUser && currentUser.orders) || [], [orderSummary])
        });
        if (bridge.normalizeUserData) nextUser = bridge.normalizeUserData(nextUser);
        bridge.setCurrentUser(nextUser);
        if (bridge.saveState) bridge.saveState();
        return nextUser;
    }

    function getResolvedShippingData(user, isGuest) {
        var checkoutUser = user || {};
        var addresses = Array.isArray(checkoutUser.addresses) ? checkoutUser.addresses : [];
        var defaultAddr = addresses.find(function (entry) {
            return entry && entry.isDefault && String(entry.text || entry.address || "").trim();
        }) || addresses.find(function (entry) {
            return entry && String(entry.text || entry.address || "").trim();
        }) || null;

        return {
            customerName: isGuest ? (getBridge().defaultGuestName || "Khách Sỉ Web") : String(checkoutUser.name || getBridge().defaultGuestName || "Khách Sỉ Web").trim(),
            phone: String((defaultAddr && defaultAddr.phone) || checkoutUser.shippingPhone || checkoutUser.phone || "").trim(),
            email: String(checkoutUser.email || "").trim(),
            address: String((defaultAddr && (defaultAddr.text || defaultAddr.address)) || checkoutUser.address || "").trim()
        };
    }

    function hasSavedShippingAddress(user) {
        var checkoutUser = user || {};
        var addresses = Array.isArray(checkoutUser.addresses) ? checkoutUser.addresses : [];
        if (addresses.some(function (entry) {
            return entry && String((entry.text || entry.address) || "").trim();
        })) return true;
        return !!String(checkoutUser.address || "").trim();
    }

    window.cartLogicGetOrderTotals = getOrderTotals;

    window.addToCartLogic = function (product, qty, variantStr) {
        var safeProduct = product || {};
        var minQty = getProductMinQty(safeProduct);
        var safeQty = clampQty(qty, minQty, minQty);
        var safeVariant = String(variantStr || "").trim();
        var cartItemId = safeVariant ? safeProduct.id + "_" + safeVariant : safeProduct.id;
        var cartData = getCartItems().slice();
        var existing = cartData.find(function (item) {
            return String((item && item.cartId) || "") === cartItemId;
        });

        if (existing) {
            existing.minQty = getProductMinQty(existing);
            existing.unit = existing.unit || getProductUnit(safeProduct);
            existing.quantity = clampQty((Number(existing.quantity || 0) || 0) + safeQty, minQty, minQty);
        } else {
            cartData.push(buildCartItem(safeProduct, safeQty, safeVariant));
        }

        syncCartState(cartData);
        return true;
    };

    window.processAddToCart = function () {
        var bridge = getBridge();
        var product = getCurrentViewingProduct();
        var minQty = getProductMinQty(product);
        if (!product) return;
        if (!isProductInStock(product)) {
            if (bridge.showToast) bridge.showToast("Sản phẩm hiện đã hết hàng.", "warning");
            return;
        }

        var qty = typeof window.sanitizeQtyInput === "function"
            ? window.sanitizeQtyInput("popup-qty-input", minQty)
            : clampQty((((document.getElementById("popup-qty-input") || {}).value) || minQty), minQty, minQty);
        qty = clampQty(qty, minQty, minQty);
        window.addToCartLogic(product, qty, "");
        if (bridge.showToast) bridge.showToast("Đã thêm sản phẩm vào giỏ hàng.", "success");
        if (typeof window.closePopup === "function") window.closePopup();
    };

    window.updateBadgeNumbers = function () {
        var totalItems = getCartItems().reduce(function (sum, item) {
            return sum + (Number(item && item.quantity || 0) || 0);
        }, 0);
        ["cart-count-badge", "pd-cart-badge", "acc-cart-badge", "pc-cart-badge"].forEach(function (id) {
            var badge = document.getElementById(id);
            if (badge) badge.innerText = totalItems;
        });
    };

    window.openCart = function () {
        var bridge = getBridge();
        if (bridge.openModalShell) bridge.openModalShell("cart-overlay");
        if (typeof window.renderCartUI === "function") window.renderCartUI();
    };

    window.closeCart = function () {
        var bridge = getBridge();
        if (bridge.closeModalShell) bridge.closeModalShell("cart-overlay");
    };

    window.updateCartQty = function (cartId, delta) {
        var safeCartId = String(cartId || "").trim();
        if (!safeCartId) return;
        clearCartQtyDraftValue(safeCartId);

        var nextCart = [];
        getCartItems().forEach(function (item) {
            if (!item) return;
            if (String(item.cartId || "") !== safeCartId) {
                nextCart.push(item);
                return;
            }

            if (Number(delta || 0) <= -999) return;

            var minQty = getProductMinQty(item);
            var nextQty = clampQty((Number(item.quantity || 0) || 0) + Number(delta || 0), minQty, minQty);
            nextCart.push(Object.assign({}, item, { quantity: nextQty, minQty: minQty }));
        });

        syncCartState(nextCart);
    };

    window.setCartQtyDraft = function (cartId, value) {
        setCartQtyDraftValue(cartId, value);
    };

    window.setCartQtyInput = function (cartId, value) {
        var safeCartId = String(cartId || "").trim();
        if (!safeCartId) return;
        clearCartQtyDraftValue(safeCartId);

        var nextCart = getCartItems().map(function (item) {
            if (!item || String(item.cartId || "") !== safeCartId) return item;
            var minQty = getProductMinQty(item);
            return Object.assign({}, item, {
                minQty: minQty,
                quantity: clampQty(value, minQty, minQty)
            });
        });

        syncCartState(nextCart);
    };

    window.commitCartQtyInput = function (cartId, value) {
        window.setCartQtyInput(cartId, value);
    };

    window.handleCartQtyInputKeydown = function (event, cartId, value) {
        if (!event || event.key !== "Enter") return;
        if (typeof event.preventDefault === "function") event.preventDefault();
        window.commitCartQtyInput(cartId, value);
        if (event.target && typeof event.target.blur === "function") event.target.blur();
    };

    window.startCartOrderEdit = function (payload) {
        clearEditingOrderState();
        var bridge = getBridge();
        if (bridge.showToast) bridge.showToast("Tính năng sửa đơn hàng đã được tắt. Hãy xóa đơn cũ và đặt lại đơn mới.", "warning");
    };

    window.cancelCartOrderEdit = function () {
        clearEditingOrderState();
        if (typeof window.renderCartUI === "function") window.renderCartUI();
    };

    window.renderCartUI = function () {
        var bridge = getBridge();
        var container = document.getElementById("cart-items-container");
        var editBannerEl = document.getElementById("cart-edit-order-banner");
        var subtotalEl = document.getElementById("cart-subtotal");
        var alertEl = document.getElementById("discount-alert");
        var productDiscountRowEl = document.getElementById("cart-product-discount-row");
        var productDiscountValueEl = document.getElementById("cart-product-discount-value");
        var orderDiscountRowEl = document.getElementById("cart-order-discount-row");
        var orderDiscountValueEl = document.getElementById("cart-order-discount-value");
        var totalEl = document.getElementById("cart-total-price");
        var checkoutBtn = document.getElementById("cart-checkout-btn");
        if (!container || !subtotalEl || !alertEl || !totalEl) return;

        var activeElement = document.activeElement;
        var activeInputId = null;
        var activeCursorPos = 0;
        if (activeElement && activeElement.tagName === "INPUT" && activeElement.id && activeElement.id.indexOf("cart-qty-input-") === 0) {
            activeInputId = activeElement.id;
            try { activeCursorPos = activeElement.selectionStart || 0; } catch(e){}
        }

        var editingState = null;
        if (editBannerEl) {
            editBannerEl.className = "px-4 pt-4 hidden";
            editBannerEl.innerHTML = "";
        }
        if (checkoutBtn) checkoutBtn.innerText = "Đặt Hàng Ngay";

        var cartData = getCartItems().map(function (item) {
            return Object.assign({}, item, {
                minQty: getProductMinQty(item),
                quantity: clampQty(item && item.quantity, getProductMinQty(item), getProductMinQty(item))
            });
        });
        if (cartData.length !== getCartItems().length) syncCartState(cartData, { skipRender: true });

        if (!cartData.length) {
            container.innerHTML = "<div class='flex flex-col items-center justify-center h-full text-gray-400 gap-2 mt-20'><i class='fa-solid fa-basket-shopping text-5xl opacity-30'></i><p>Giỏ hàng đang trống</p><button onclick='closeCart(); goToTab(\"tab-products\"); if(typeof window.ensureTabInitialized === \"function\") window.ensureTabInitialized(\"tab-products\", true);' class='mt-4 border border-babyPink text-babyPink px-4 py-1.5 rounded-full text-sm font-bold'>Mua sắm ngay</button></div>";
            subtotalEl.classList.add("hidden");
            alertEl.classList.add("hidden");
            if (productDiscountRowEl) {
                productDiscountRowEl.classList.add("hidden");
                productDiscountRowEl.classList.remove("flex");
            }
            if (orderDiscountRowEl) {
                orderDiscountRowEl.classList.add("hidden");
                orderDiscountRowEl.classList.remove("flex");
            }
            totalEl.innerText = "0đ";
            return;
        }

        container.innerHTML = cartData.map(function (item) {
            var priceValue = Number(item.priceValue || 0) || parseMoney(item.price);
            var quantity = Number(item.quantity || 0) || 0;
            var minQty = getProductMinQty(item);
            var originalValue = Math.max(Number(item.originalPriceValue || 0) || parseMoney(item.originalPrice), priceValue);
            var lineOriginalTotal = originalValue * quantity;
            var lineCurrentTotal = priceValue * quantity;
            var lineProductDiscountValue = Math.max(0, lineOriginalTotal - lineCurrentTotal);
            var variantHtml = item.variantInfo
                ? "<p class=\"text-[10px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5 inline-block mt-1\">" + escapeHtml(item.variantInfo) + "</p>"
                : "";
            var minimumHtml = minQty > 1
                ? "<p class=\"text-[11px] text-amber-600 font-bold mt-2\">Tối thiểu " + minQty + (item.unit ? " " + escapeHtml(item.unit) : "") + "</p>"
                : "";
            var priceLabel = formatMoney(priceValue) + (item.unit ? " / " + item.unit : "");
            var originalLabel = originalValue > priceValue
                ? formatMoney(originalValue) + (item.unit ? " / " + item.unit : "")
                : "";
            var displayName = getProductDisplayName(item);
            var imageHtml = bridge.renderResponsiveImageHtml
                ? bridge.renderResponsiveImageHtml(item.img, "w400", "w-20 h-20 object-cover rounded-lg", {
                    alt: displayName,
                    pictureClass: "block w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-50"
                })
                : "<img src=\"" + (bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(item.img, "w400") : String(item.img || "")) + "\" loading=\"lazy\" decoding=\"async\" class=\"w-20 h-20 object-cover rounded-lg shrink-0\" />";
            var safeCartId = String(item.cartId || "").replace(/'/g, "\\'");
            var inputId = "cart-qty-input-" + String(item.cartId || "").replace(/[^a-zA-Z0-9_-]/g, "");
            var qtyInputValue = getCartQtyDraftValue(item.cartId);
            if (qtyInputValue === null) qtyInputValue = String(quantity);
            return [
                "<div class=\"flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 relative\">",
                "    <button onclick=\"updateCartQty('" + safeCartId + "', -999)\" class=\"absolute top-2 right-2 text-gray-300 hover:text-red-500\"><i class=\"fa-solid fa-xmark\"></i></button>",
                "    " + imageHtml,
                "    <div class=\"flex flex-col flex-1 py-1 pr-4\">",
                "        <h4 class=\"font-bold text-[13px] leading-snug text-gray-800 line-clamp-2\">" + escapeHtml(displayName) + "</h4>",
                "        " + variantHtml,
                "        " + minimumHtml,
                "        <div class=\"flex justify-between items-end gap-2 mt-auto pt-2\">",
                "            <div class=\"pr-2 shrink-0 text-right whitespace-nowrap\">",
                "                <span class=\"font-bold text-sm text-babyPink block whitespace-nowrap\">" + escapeHtml(priceLabel) + "</span>",
                originalLabel ? "                <span class=\"text-[10px] text-gray-400 line-through block mt-0.5 whitespace-nowrap\">" + escapeHtml(originalLabel) + "</span>" : "",
                lineProductDiscountValue > 0 ? "                <span class=\"text-[10px] font-semibold text-emerald-600 block mt-1 whitespace-nowrap\">Giảm " + formatMoney(lineProductDiscountValue) + "</span>" : "",
                "            </div>",
                "            <div class=\"qty-stepper qty-stepper-sm\">",
                "                <button class=\"qty-stepper-btn\" onclick=\"updateCartQty('" + safeCartId + "', -1)\"><i class=\"fa-solid fa-minus text-[10px]\"></i></button>",
                "                <input id=\"" + inputId + "\" class=\"qty-stepper-input text-sm\" type=\"text\" inputmode=\"numeric\" pattern=\"[0-9]*\" autocomplete=\"off\" value=\"" + qtyInputValue + "\" onfocus=\"this.select()\" oninput=\"event.stopPropagation(); setCartQtyDraft('" + safeCartId + "', this.value)\" onchange=\"event.stopPropagation()\" onblur=\"commitCartQtyInput('" + safeCartId + "', this.value)\" onkeydown=\"event.stopPropagation(); handleCartQtyInputKeydown(event, '" + safeCartId + "', this.value)\" onkeyup=\"event.stopPropagation()\"/>",
                "                <button class=\"qty-stepper-btn\" onclick=\"updateCartQty('" + safeCartId + "', 1)\"><i class=\"fa-solid fa-plus text-[10px]\"></i></button>",
                "            </div>",
                "        </div>",
                "    </div>",
                "</div>"
            ].join("");
        }).join("");

        var totals = getOrderTotals({ items: cartData });
        var totalAmount = totals.totalAmount;
        var maxTierAmount = DISCOUNT_TIERS.length ? DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1].amount : 0;
        var progress = maxTierAmount > 0 ? Math.min(100, Math.max(0, (totalAmount / maxTierAmount) * 100)) : 0;
        var nextTier = getNextDiscountTier(totalAmount);
        var currentTier = getDiscountTierForAmount(totalAmount);
        var progressMessage = currentTier
            ? "🎉 Đơn hàng đã đạt " + currentTier.label + "."
            : "Mua thêm để mở chiết khấu hóa đơn.";
        if (nextTier) {
            progressMessage += " Còn " + formatMoney(nextTier.amount - totalAmount) + " để lên " + nextTier.label + ".";
        } else if (DISCOUNT_TIERS.length) {
            progressMessage += " Bạn đang ở mức ưu đãi cao nhất.";
        }
        var totalSavedValue = Math.max(0, (Number(totals.productDiscountValue || 0) || 0) + (Number(totals.orderDiscountValue || 0) || 0));
        if (totalSavedValue > 0) {
            progressMessage += " Tổng giảm " + formatMoney(totalSavedValue) + ".";
        }
        var tierLabelsHtml = DISCOUNT_TIERS.slice(0, 3).map(function (tier) {
            return "<span>" + formatMoney(tier.amount) + " (" + tier.percent + "%)</span>";
        }).join("");

        if (DISCOUNT_TIERS.length) {
            var isDarkMode = document.body.classList.contains("dark-mode") || document.documentElement.classList.contains("dark");
            alertEl.classList.remove("hidden");
            alertEl.className = isDarkMode
                ? "mb-3 rounded-[24px] border border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 shadow-[0_16px_36px_rgba(2,6,23,0.28)]"
                : "mb-3 rounded-[24px] border border-pink-100 bg-gradient-to-r from-pink-50 via-white to-pink-50 px-4 py-3 shadow-sm";
            alertEl.innerHTML = [
                "<p class='mb-2 text-[13px] font-semibold leading-5 ", isDarkMode ? "text-slate-100" : "text-slate-700", "'>", escapeHtml(progressMessage), "</p>",
                "<div class='w-full h-3 rounded-full overflow-hidden ", isDarkMode ? "bg-slate-950 border border-slate-700" : "bg-white border border-pink-100", "'>",
                "    <div class='h-full ", isDarkMode ? "bg-gradient-to-r from-pink-400 via-rose-400 to-orange-300" : "bg-gradient-to-r from-babyPink to-pink-400", " transition-all duration-500' style='width:", String(progress.toFixed(2)), "%'></div>",
                "</div>",
                "<div class='flex flex-wrap justify-between gap-2 text-[10px] font-black mt-1.5 ", isDarkMode ? "text-slate-400" : "text-gray-400", "'>", tierLabelsHtml, "</div>"
            ].join("");
        } else {
            alertEl.className = "mb-3 hidden";
            alertEl.innerHTML = "";
        }

        if (totals.orderDiscountPercent > 0 || totals.productDiscountValue > 0) {
            subtotalEl.classList.remove("hidden");
            subtotalEl.innerText = formatMoney(totals.originalAmount);
        } else {
            subtotalEl.classList.add("hidden");
        }

        if (productDiscountRowEl && productDiscountValueEl) {
            if (totals.productDiscountValue > 0) {
                productDiscountRowEl.classList.remove("hidden");
                productDiscountRowEl.classList.add("flex");
                productDiscountValueEl.innerText = "-" + formatMoney(totals.productDiscountValue);
            } else {
                productDiscountRowEl.classList.add("hidden");
                productDiscountRowEl.classList.remove("flex");
                productDiscountValueEl.innerText = "-0đ";
            }
        }
        if (orderDiscountRowEl && orderDiscountValueEl) {
            if (totals.orderDiscountValue > 0) {
                orderDiscountRowEl.classList.remove("hidden");
                orderDiscountRowEl.classList.add("flex");
                orderDiscountValueEl.innerText = "-" + formatMoney(totals.orderDiscountValue);
            } else {
                orderDiscountRowEl.classList.add("hidden");
                orderDiscountRowEl.classList.remove("flex");
                orderDiscountValueEl.innerText = "-0đ";
            }
        }
        totalEl.innerText = formatMoney(totals.finalAmount);

        if (activeInputId) {
            setTimeout(function() {
                var el = document.getElementById(activeInputId);
                if (el) {
                    el.focus();
                    try { el.setSelectionRange(activeCursorPos, activeCursorPos); } catch(e){}
                }
            }, 10);
        }
    };

    window.processCheckout = async function () {
        var bridge = getBridge();
        var cartData = getCartItems();
        clearEditingOrderState();
        var editingState = null;
        if (!cartData.length) {
            if (bridge.showToast) bridge.showToast("Giỏ hàng đang trống!", "warning");
            return;
        }

        var currentUser = getCurrentUser();
        var isGuestCheckout = !currentUser || !(currentUser.authUid || currentUser.auth_uid);
        var checkoutUser = bridge.normalizeUserData
            ? bridge.normalizeUserData(isGuestCheckout
                ? { name: bridge.defaultGuestName || "Khách Sỉ Web", group: "Khách sỉ từ web", orders: [], addresses: [] }
                : currentUser)
            : (currentUser || { name: bridge.defaultGuestName || "Khách Sỉ Web" });

        var checkoutInfo = getResolvedShippingData(checkoutUser, isGuestCheckout);

        if (!isGuestCheckout && !hasSavedShippingAddress(checkoutUser)) {
            if (bridge.showToast) bridge.showToast("Bạn cần cập nhật địa chỉ nhận hàng trước khi đặt đơn.", "warning");
            if (typeof window.openAddressBookModal === "function") {
                window.openAddressBookModal();
                setTimeout(function () {
                    if (typeof window.openAddressFormModal === "function") window.openAddressFormModal();
                }, 80);
            } else if (typeof window.openSettings === "function") {
                window.openSettings();
            }
            return;
        }

        if (isGuestCheckout || !checkoutInfo.phone || !checkoutInfo.address) {
            if (typeof window.waitForCheckoutInfo !== "function") {
                if (bridge.showToast) bridge.showToast("Thiếu thông tin giao hàng. Vui lòng thử lại.", "warning");
                return;
            }

            var filledInfo = await window.waitForCheckoutInfo({
                isGuest: isGuestCheckout,
                customerName: checkoutInfo.customerName,
                phone: checkoutInfo.phone,
                email: checkoutInfo.email,
                address: checkoutInfo.address
            });

            if (!filledInfo) return;

            checkoutInfo = Object.assign({}, checkoutInfo, filledInfo, {
                customerName: isGuestCheckout
                    ? (bridge.defaultGuestName || "Khách Sỉ Web")
                    : String(filledInfo.customerName || checkoutInfo.customerName || bridge.defaultGuestName || "Khách Sỉ Web").trim()
            });
        }

        var orderItems = cartData.map(function (item) {
            return Object.assign({}, item, {
                priceValue: Number(item.priceValue || 0) || parseMoney(item.price),
                quantity: clampQty(item.quantity, getProductMinQty(item), getProductMinQty(item))
            });
        });
        var totals = getOrderTotals({ items: orderItems });
        var contactText = [checkoutInfo.phone, checkoutInfo.email].filter(Boolean).join(" - ") || "Khách sẽ liên hệ với shop";

        if (checkoutSubmissionInFlight) {
            if (bridge.showToast) bridge.showToast("Đơn hàng đang được gửi. Vui lòng chờ vài giây.", "info");
            return;
        }

        checkoutSubmissionInFlight = true;
        setCheckoutSubmittingState(true, "Đang gửi đơn...");

        var orderId = "DH" + Date.now();
        var persisted = false;
        var updatedExistingOrder = false;
        var checkoutCreatedAt = new Date().toLocaleString("vi-VN");
        var cartSnapshot = cloneCartSnapshot(getCartItems());
        var hasOrderSuccessModal = typeof window.openOrderSuccessModal === "function";
        var orderSuccessKey = "checkout_" + Date.now();
        var orderCommitted = false;
        var orderPayload = {
            customerName: checkoutInfo.customerName,
            phone: checkoutInfo.phone,
            email: checkoutInfo.email,
            address: checkoutInfo.address,
            items: orderItems,
            totalAmount: totals.totalAmount,
            originalAmount: totals.originalAmount,
            productDiscountValue: totals.productDiscountValue,
            orderDiscountPercent: totals.orderDiscountPercent,
            orderDiscountValue: totals.orderDiscountValue,
            discountPercent: totals.orderDiscountPercent,
            discountValue: totals.orderDiscountValue,
            finalAmount: totals.finalAmount,
            paymentMethod: "pending",
            priceType: "gia_si_web",
            note: ""
        };

        clearEditingOrderState();
        syncCartState([], { skipRender: true });
        if (typeof window.closeCart === "function") window.closeCart();
        if (typeof window.closeProductDetail === "function") window.closeProductDetail();
        if (hasOrderSuccessModal) {
            window.openOrderSuccessModal(buildOrderSuccessPayload(orderId, checkoutInfo, orderItems, totals, {
                createdAt: checkoutCreatedAt,
                submissionKey: orderSuccessKey,
                pendingSync: true,
                persisted: false,
                updatedExistingOrder: updatedExistingOrder
            }));
        }

        (async function submitOrderInBackground() {
            try {
                if (bridge.waitForRetailFirebaseReady) await bridge.waitForRetailFirebaseReady();
                if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase()) || !window.retailFirebase) {
                    throw new Error("firebase-ready-missing");
                }
                if (typeof window.retailFirebase.submitOrder !== "function") {
                    throw new Error("submit-order-disabled");
                }
                var createdOrder = await window.retailFirebase.submitOrder(orderPayload);
                orderCommitted = true;

                if (createdOrder && createdOrder.id) {
                    orderId = createdOrder.id;
                    persisted = typeof createdOrder.persisted === "boolean" ? createdOrder.persisted : true;
                    if (createdOrder.summary) upsertCurrentUserOrder(createdOrder.summary);
                }

                if (bridge.scheduleIdleTask && bridge.sendTelegramEvent) {
                    bridge.scheduleIdleTask(function () {
                        bridge.sendTelegramEvent("order", {
                            orderId: orderId,
                            customerName: checkoutInfo.customerName,
                            customerType: String((checkoutUser && checkoutUser.group) || "Khách sỉ từ web").trim(),
                            address: checkoutInfo.address,
                            contact: contactText,
                            finalAmount: totals.finalAmount,
                            items: orderItems
                        });
                    });
                }

                if (typeof window.renderAccountTab === "function") window.renderAccountTab();
                if (currentUser && currentUser.authUid && typeof window.renderOrdersUI === "function") window.renderOrdersUI();
                if (hasOrderSuccessModal) {
                    window.openOrderSuccessModal(buildOrderSuccessPayload(orderId, checkoutInfo, orderItems, totals, {
                        createdAt: checkoutCreatedAt,
                        submissionKey: orderSuccessKey,
                        pendingSync: false,
                        persisted: persisted,
                        updatedExistingOrder: updatedExistingOrder
                    }));
                }
                if (persisted && currentUser && currentUser.authUid && bridge.syncOrdersFromFirebase) {
                    Promise.resolve(bridge.syncOrdersFromFirebase({ force: true }))
                        .then(function () {
                            if (typeof window.renderOrdersUI === "function") window.renderOrdersUI();
                            if (typeof window.renderAccountTab === "function") window.renderAccountTab();
                        })
                        .catch(function (error) {
                            console.warn("Khong dong bo duoc don hang sau khi dat:", error);
                        });
                }
                if (!hasOrderSuccessModal && bridge.showToast) {
                    bridge.showToast(
                        updatedExistingOrder
                            ? (persisted ? "Đơn hàng đã được cập nhật." : "Yêu cầu cập nhật đơn đã được ghi nhận trên web.")
                            : (persisted ? "Đơn hàng đã được tạo trên hệ thống." : "Đơn hàng đã được ghi nhận."),
                        "success"
                    );
                }
            } catch (error) {
                console.warn("Firebase checkout error:", error);
                if (orderCommitted) {
                    if (hasOrderSuccessModal) {
                        try {
                            window.openOrderSuccessModal(buildOrderSuccessPayload(orderId, checkoutInfo, orderItems, totals, {
                                createdAt: checkoutCreatedAt,
                                submissionKey: orderSuccessKey,
                                pendingSync: false,
                                persisted: persisted,
                                updatedExistingOrder: updatedExistingOrder
                            }));
                        } catch (modalError) {
                            console.warn("Khong cap nhat duoc modal thanh cong sau khi don da tao:", modalError);
                        }
                    } else if (bridge.showToast) {
                        bridge.showToast(
                            updatedExistingOrder
                                ? (persisted ? "Đơn hàng đã được cập nhật." : "Yêu cầu cập nhật đơn đã được ghi nhận trên web.")
                                : (persisted ? "Đơn hàng đã được tạo trên hệ thống." : "Đơn hàng đã được ghi nhận."),
                            "success"
                        );
                    }
                    return;
                }
                syncCartState(cartSnapshot, { skipRender: false });
                if (typeof window.closeOrderSuccessModal === "function") window.closeOrderSuccessModal();
                if (typeof window.renderAccountTab === "function") window.renderAccountTab();
                if (bridge.showToast) bridge.showToast(mapOrderError(error) + " Giỏ hàng đã được khôi phục.", "error");
                if (typeof window.openCart === "function") window.openCart();
            } finally {
                checkoutSubmissionInFlight = false;
                setCheckoutSubmittingState(false, "Đặt Hàng Ngay");
            }
        })();
    };

    function initializeCartUiOnce() {
        clearEditingOrderState();
        editingOrderState = null;
        if (typeof window.updateBadgeNumbers === "function") window.updateBadgeNumbers();
        if (typeof window.renderCartUI === "function") window.renderCartUI();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeCartUiOnce, { once: true });
    } else {
        initializeCartUiOnce();
    }
})();
