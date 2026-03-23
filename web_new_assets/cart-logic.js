(function () {
    var DISCOUNT_TIERS = [
        { amount: 500000, percent: 5, label: "Chiết khấu 5%" },
        { amount: 1000000, percent: 7, label: "Chiết khấu 7%" },
        { amount: 2000000, percent: 10, label: "Chiết khấu 10%" },
        { amount: 5000000, percent: 15, label: "Chiết khấu 15%" },
        { amount: 10000000, percent: 20, label: "Chiết khấu 20%" }
    ];

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
        return {
            cartId: variantStr ? product.id + "_" + variantStr : product.id,
            id: product.id,
            name: product.name,
            code: String(product.code || product.id || "").trim(),
            group: String(product.group || product.cat || "").trim(),
            unit: getProductUnit(product),
            minQty: minQty,
            price: product.price,
            img: product.img,
            quantity: clampQty(quantity, minQty, minQty),
            variantInfo: variantStr
        };
    }

    function getOrderTotals(order) {
        var totalAmount = Number(order && (order.totalAmount || order.total_amount || order.finalAmount) || 0) || 0;
        var items = order && Array.isArray(order.items) ? order.items : [];

        if (!totalAmount) {
            items.forEach(function (item) {
                totalAmount += parseMoney(item.price) * (Number(item.quantity || item.qty || 1) || 1);
            });
        }

        var discountTier = getDiscountTierForAmount(totalAmount);
        var discountPercent = Number(order && (order.discountPercent || order.discount_percent) || 0) || 0;
        if (!discountPercent && discountTier) discountPercent = discountTier.percent;

        var discountValue = Number(order && (order.discountValue || order.discount_value) || 0) || 0;
        if (!discountValue && discountPercent > 0) discountValue = Math.round((totalAmount * discountPercent) / 100);

        var shippingFee = Number(order && (order.shippingFee || order.shipping_fee) || 0) || 0;
        var finalAmount = Number(order && (order.finalAmount || order.final_amount) || 0) || Math.max(0, totalAmount - discountValue + shippingFee);

        return {
            totalAmount: totalAmount,
            discountPercent: discountPercent,
            discountValue: discountValue,
            finalAmount: finalAmount,
            tier: discountTier
        };
    }

    function mapOrderError(error) {
        var rawCode = String((error && error.code) || "").trim().toLowerCase();
        var rawMessage = String((error && error.message) || "").trim().toLowerCase();
        var joined = rawCode + " " + rawMessage;

        if (joined.indexOf("operation-not-allowed") >= 0 || joined.indexOf("anonymous") >= 0) {
            return "Firebase chưa bật Anonymous Auth nên chưa tạo được đơn khách lẻ.";
        }
        if (joined.indexOf("permission") >= 0 || joined.indexOf("denied") >= 0) {
            return "Firebase đang chặn ghi đơn hàng. Vui lòng kiểm tra rules hoặc quyền tài khoản.";
        }
        if (joined.indexOf("not-authenticated") >= 0) {
            return "Phiên đặt hàng chưa sẵn sàng. Vui lòng thử lại.";
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

    function getResolvedShippingData(user, isGuest) {
        var checkoutUser = user || {};
        var addresses = Array.isArray(checkoutUser.addresses) ? checkoutUser.addresses : [];
        var defaultAddr = addresses.find(function (entry) {
            return entry && entry.isDefault && String(entry.text || entry.address || "").trim();
        }) || addresses.find(function (entry) {
            return entry && String(entry.text || entry.address || "").trim();
        }) || null;

        return {
            customerName: isGuest ? (getBridge().defaultGuestName || "Khách Lẻ Web") : String(checkoutUser.name || getBridge().defaultGuestName || "Khách Lẻ Web").trim(),
            phone: String((defaultAddr && defaultAddr.phone) || checkoutUser.shippingPhone || checkoutUser.phone || "").trim(),
            email: String(checkoutUser.email || "").trim(),
            address: String((defaultAddr && (defaultAddr.text || defaultAddr.address)) || checkoutUser.address || "").trim()
        };
    }

    function buildDiscountGuide(totalAmount, totals) {
        var currentTier = getDiscountTierForAmount(totalAmount);
        var nextTier = getNextDiscountTier(totalAmount);
        var headline = currentTier
            ? "Bạn đã đạt " + currentTier.label + " cho đơn này."
            : "Đơn hàng chưa đạt mức chiết khấu đầu tiên.";
        var subline = nextTier
            ? "Chỉ cần thêm " + formatMoney(nextTier.amount - totalAmount) + " để lên mức " + nextTier.label + "."
            : "Bạn đang ở mức chiết khấu cao nhất của shop.";

        var tiersHtml = DISCOUNT_TIERS.map(function (tier) {
            var active = totalAmount >= tier.amount;
            var isNext = !active && nextTier && nextTier.amount === tier.amount;
            return [
                "<div class='rounded-2xl px-3 py-3 border ",
                active ? "border-pink-200 bg-pink-50 text-babyPink" : (isNext ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-white text-gray-600"),
                "'>",
                "    <div class='flex items-center justify-between gap-3'>",
                "        <span class='font-bold'>", escapeHtml(tier.label), "</span>",
                "        <span class='text-xs font-black uppercase tracking-[0.18em]'>", formatMoney(tier.amount), "</span>",
                "    </div>",
                active
                    ? "    <p class='text-xs mt-2 font-semibold'>Đã đạt</p>"
                    : (isNext
                        ? "    <p class='text-xs mt-2 font-semibold'>Còn thiếu " + formatMoney(tier.amount - totalAmount) + "</p>"
                        : "    <p class='text-xs mt-2 font-semibold'>Chưa đạt</p>"),
                "</div>"
            ].join("");
        }).join("");

        return {
            headline: headline,
            subline: subline,
            html: [
                "<div class='space-y-3'>",
                "    <div>",
                "        <p class='font-bold text-amber-800'>", escapeHtml(headline), "</p>",
                "        <p class='text-xs text-amber-700 mt-1 leading-5'>", escapeHtml(subline), "</p>",
                "    </div>",
                "    <div class='grid gap-2'>", tiersHtml, "</div>",
                totals.discountPercent > 0
                    ? "    <div class='rounded-2xl bg-green-50 border border-green-200 px-3 py-3 text-green-700 text-sm font-semibold'>Bạn đang tiết kiệm " + formatMoney(totals.discountValue) + " ở đơn hàng này.</div>"
                    : "",
                "</div>"
            ].join("")
        };
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

    window.setCartQtyInput = function (cartId, value) {
        var safeCartId = String(cartId || "").trim();
        if (!safeCartId) return;

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

    window.toggleDiscountGuide = function () {
        var panel = document.getElementById("discount-guide-panel");
        var toggle = document.getElementById("discount-guide-toggle");
        if (!panel || !toggle || panel.classList.contains("hidden") && !panel.innerHTML.trim()) return;
        var opening = panel.classList.contains("hidden");
        panel.classList.toggle("hidden", !opening);
        toggle.innerText = opening ? "Ẩn nhắc mức chiết khấu" : "Nhắc các mức chiết khấu";
    };

    window.renderCartUI = function () {
        var bridge = getBridge();
        var container = document.getElementById("cart-items-container");
        var subtotalEl = document.getElementById("cart-subtotal");
        var alertEl = document.getElementById("discount-alert");
        var totalEl = document.getElementById("cart-total-price");
        var guideEl = document.getElementById("discount-guide-panel");
        var guideToggle = document.getElementById("discount-guide-toggle");
        if (!container || !subtotalEl || !alertEl || !totalEl) return;

        var cartData = getCartItems().map(function (item) {
            return Object.assign({}, item, {
                minQty: getProductMinQty(item),
                quantity: clampQty(item && item.quantity, getProductMinQty(item), getProductMinQty(item))
            });
        });
        if (cartData.length !== getCartItems().length) syncCartState(cartData, { skipRender: true });

        if (!cartData.length) {
            container.innerHTML = "<div class='flex flex-col items-center justify-center h-full text-gray-400 gap-2 mt-20'><i class='fa-solid fa-basket-shopping text-5xl opacity-30'></i><p>Giỏ hàng đang trống</p><button onclick='closeCart()' class='mt-4 border border-babyPink text-babyPink px-4 py-1.5 rounded-full text-sm font-bold'>Mua sắm ngay</button></div>";
            subtotalEl.classList.add("hidden");
            alertEl.classList.add("hidden");
            if (guideEl) {
                guideEl.classList.add("hidden");
                guideEl.innerHTML = "";
            }
            if (guideToggle) guideToggle.classList.add("hidden");
            totalEl.innerText = "0đ";
            return;
        }

        var totalAmount = 0;
        container.innerHTML = cartData.map(function (item) {
            var priceValue = parseMoney(item.price);
            var quantity = Number(item.quantity || 0) || 0;
            var minQty = getProductMinQty(item);
            totalAmount += priceValue * quantity;
            var variantHtml = item.variantInfo
                ? "<p class=\"text-[10px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5 inline-block mt-1\">" + escapeHtml(item.variantInfo) + "</p>"
                : "";
            var minimumHtml = minQty > 1
                ? "<p class=\"text-[11px] text-amber-600 font-bold mt-2\">Tối thiểu " + minQty + (item.unit ? " " + escapeHtml(item.unit) : "") + "</p>"
                : "";
            var priceLabel = String(item.price || "") + (item.unit ? " / " + item.unit : "");
            var imageUrl = bridge.getOptimizedImageUrl ? bridge.getOptimizedImageUrl(item.img, "w400") : String(item.img || "");
            var displayName = getProductDisplayName(item);
            var safeCartId = String(item.cartId || "").replace(/'/g, "\\'");
            return [
                "<div class=\"flex gap-3 bg-white p-3 rounded-xl border border-gray-100 relative\">",
                "    <button onclick=\"updateCartQty('" + safeCartId + "', -999)\" class=\"absolute top-2 right-2 text-gray-300 hover:text-red-500\"><i class=\"fa-solid fa-xmark\"></i></button>",
                "    <img src=\"" + imageUrl + "\" loading=\"lazy\" decoding=\"async\" class=\"w-20 h-20 object-cover rounded-lg\" />",
                "    <div class=\"flex flex-col flex-1 py-1 pr-4\">",
                "        <h4 class=\"font-bold text-sm line-clamp-2 leading-tight\">" + escapeHtml(displayName) + "</h4>",
                "        " + variantHtml,
                "        " + minimumHtml,
                "        <div class=\"flex justify-between items-end gap-3 mt-auto pt-2\">",
                "            <span class=\"font-bold text-babyPink\">" + escapeHtml(priceLabel) + "</span>",
                "            <div class=\"flex items-center gap-2 border rounded-xl p-1\">",
                "                <button class=\"w-7 h-7 bg-gray-50 flex items-center justify-center hover:bg-gray-200 transition rounded-lg\" onclick=\"updateCartQty('" + safeCartId + "', -1)\"><i class=\"fa-solid fa-minus text-[10px]\"></i></button>",
                "                <input class=\"w-16 min-w-[4rem] text-center text-sm font-bold border-none focus:outline-none bg-transparent\" type=\"number\" min=\"" + minQty + "\" step=\"1\" value=\"" + quantity + "\" oninput=\"setCartQtyInput('" + safeCartId + "', this.value)\"/>",
                "                <button class=\"w-7 h-7 bg-gray-50 flex items-center justify-center hover:bg-gray-200 transition rounded-lg\" onclick=\"updateCartQty('" + safeCartId + "', 1)\"><i class=\"fa-solid fa-plus text-[10px]\"></i></button>",
                "            </div>",
                "        </div>",
                "    </div>",
                "</div>"
            ].join("");
        }).join("");

        var totals = getOrderTotals({ items: cartData });
        var discountGuide = buildDiscountGuide(totalAmount, totals);

        alertEl.classList.remove("hidden");
        alertEl.className = totals.discountPercent > 0
            ? "mb-2 text-sm font-bold text-green-700 bg-green-50 border border-green-200 p-3 rounded-2xl"
            : "mb-2 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-2xl";
        alertEl.innerHTML = totals.discountPercent > 0
            ? "<i class=\"fa-solid fa-sparkles mr-1\"></i> Bạn đã đạt chiết khấu " + totals.discountPercent + "% và đang tiết kiệm " + formatMoney(totals.discountValue) + "."
            : "<i class=\"fa-solid fa-bullhorn mr-1\"></i> Chưa chạm mức chiết khấu. Bấm nút bên dưới để xem các mức ưu đãi.";

        if (totals.discountPercent > 0) {
            subtotalEl.classList.remove("hidden");
            subtotalEl.innerText = formatMoney(totalAmount);
        } else {
            subtotalEl.classList.add("hidden");
        }

        if (guideEl) {
            guideEl.innerHTML = discountGuide.html;
            guideEl.classList.add("hidden");
        }
        if (guideToggle) {
            guideToggle.classList.remove("hidden");
            guideToggle.innerText = "Nhắc các mức chiết khấu";
        }

        totalEl.innerText = formatMoney(totals.finalAmount);
    };

    window.processCheckout = async function () {
        var bridge = getBridge();
        var cartData = getCartItems();
        if (!cartData.length) {
            if (bridge.showToast) bridge.showToast("Giỏ hàng đang trống!", "warning");
            return;
        }

        var currentUser = getCurrentUser();
        var isGuestCheckout = !currentUser || !currentUser.authUid;
        var checkoutUser = bridge.normalizeUserData
            ? bridge.normalizeUserData(isGuestCheckout
                ? { name: bridge.defaultGuestName || "Khách Lẻ Web", group: "Khách lẻ từ web", orders: [], addresses: [] }
                : currentUser)
            : (currentUser || { name: bridge.defaultGuestName || "Khách Lẻ Web" });

        var checkoutInfo = getResolvedShippingData(checkoutUser, isGuestCheckout);

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
                    ? (bridge.defaultGuestName || "Khách Lẻ Web")
                    : String(filledInfo.customerName || checkoutInfo.customerName || bridge.defaultGuestName || "Khách Lẻ Web").trim()
            });
        }

        var orderItems = cartData.map(function (item) {
            return Object.assign({}, item, {
                priceValue: parseMoney(item.price),
                quantity: clampQty(item.quantity, getProductMinQty(item), getProductMinQty(item))
            });
        });
        var totals = getOrderTotals({ items: orderItems });
        var contactText = [checkoutInfo.phone, checkoutInfo.email].filter(Boolean).join(" - ") || "Khách sẽ liên hệ với shop";

        if (bridge.waitForRetailFirebaseReady) await bridge.waitForRetailFirebaseReady();
        if (!(bridge.hasRetailFirebase && bridge.hasRetailFirebase()) || !window.retailFirebase || typeof window.retailFirebase.submitOrder !== "function") {
            if (bridge.showToast) bridge.showToast(bridge.getFirebaseReadyMessage ? bridge.getFirebaseReadyMessage() : "Firebase chưa sẵn sàng.", "error");
            return;
        }

        var orderId = "DH" + Date.now();
        var persisted = false;

        try {
            var createdOrder = await window.retailFirebase.submitOrder({
                customerName: checkoutInfo.customerName,
                phone: checkoutInfo.phone,
                email: checkoutInfo.email,
                address: checkoutInfo.address,
                items: orderItems,
                totalAmount: totals.totalAmount,
                discountPercent: totals.discountPercent,
                discountValue: totals.discountValue,
                finalAmount: totals.finalAmount,
                paymentMethod: "pending",
                priceType: "gia_si_web"
            });

            if (createdOrder && createdOrder.id) {
                orderId = createdOrder.id;
                persisted = true;
                if (currentUser && currentUser.authUid && bridge.syncOrdersFromFirebase) {
                    await bridge.syncOrdersFromFirebase({ force: true });
                }
            }
        } catch (error) {
            console.warn("Firebase checkout error:", error);
            if (bridge.showToast) bridge.showToast(mapOrderError(error), "error");
            return;
        }

        if (bridge.scheduleIdleTask && bridge.sendTelegramEvent) {
            bridge.scheduleIdleTask(function () {
                bridge.sendTelegramEvent("order", {
                    orderId: orderId,
                    customerName: checkoutInfo.customerName,
                    customerType: isGuestCheckout ? "guest" : "member",
                    address: checkoutInfo.address,
                    contact: contactText,
                    finalAmount: totals.finalAmount,
                    items: orderItems
                });
            });
        }

        syncCartState([], { skipRender: true });
        if (typeof window.closeCart === "function") window.closeCart();
        if (typeof window.closeProductDetail === "function") window.closeProductDetail();
        if (typeof window.renderAccountTab === "function") window.renderAccountTab();
        if (currentUser && currentUser.authUid && typeof window.renderOrdersUI === "function") window.renderOrdersUI();
        if (typeof window.openOrderSuccessModal === "function") {
            window.openOrderSuccessModal({
                orderId: orderId,
                finalAmount: totals.finalAmount,
                customerName: checkoutInfo.customerName,
                persisted: persisted
            });
        }
        if (bridge.showToast) {
            bridge.showToast(persisted ? "Đơn hàng đã được tạo trên hệ thống." : "Đơn hàng đã được ghi nhận.", "success");
        }
    };

    function initializeCartUiOnce() {
        if (typeof window.updateBadgeNumbers === "function") window.updateBadgeNumbers();
        if (typeof window.renderCartUI === "function") window.renderCartUI();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeCartUiOnce, { once: true });
    } else {
        initializeCartUiOnce();
    }
})();
