(function () {
    const FIREBASE_MAIN_CONFIG = {
        apiKey: "AIzaSyDseIwSnCWfNCqZItMiQ8svZRLWyYOTtJY",
        authDomain: "shop-truongan.firebaseapp.com",
        databaseURL: "https://shop-truongan-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "shop-truongan",
        storageBucket: "shop-truongan.firebasestorage.app",
        messagingSenderId: "589914507624",
        appId: "1:589914507624:web:4fcad009c81320c50e2edd",
        measurementId: "G-9Q5VFYL77K"
    };

    const FIREBASE_CATALOG_CONFIG = {
        apiKey: "AIzaSyCxz8CQCcrR48Niev2mSz0rX_3bFzKwuJw",
        authDomain: "truongan-pos2.firebaseapp.com",
        databaseURL: "https://truongan-pos2-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "truongan-pos2",
        storageBucket: "truongan-pos2.firebasestorage.app",
        messagingSenderId: "502189174580",
        appId: "1:502189174580:web:fefd117131cdd5ddeabf61",
        measurementId: "G-EDB7KCMY7Q"
    };

    const STORAGE_KEYS = {
        catalog: "ta_catalog_cache_v6",
        profile: "ta_customer_profile_v2",
        orders: "ta_orders_cache_v2",
        loginEmail: "ta_last_login_email_v1",
        customerId: "ta_customer_id_v1",
        phoneLoginMap: "ta_phone_login_map_v1"
    };

    const CUSTOMER_PHONE_DOMAIN = String(window.CUSTOMER_PHONE_DOMAIN || "truongan.com").replace(/^@+/, "").trim().toLowerCase();
    const DEFAULT_PAGE_SIZE = 24;
    const DEFAULT_ORDER_LIMIT = 30;

    const keyMapObj = {
        id: "i", name: "n", price: "p", stock: "s", date: "d", note: "nt", status: "st", barcode: "b",
        kho: "k", gia_ban_le: "gl", gia_si: "gs", si_tu: "su", gia_goc: "gg", km_phan_tram: "km", vat: "v",
        ton_kho: "tk", dang_dat: "dd", link_anh: "im", cap_nhat_cuoi: "cu", ngay_tao: "nta", variants: "vr",
        starred: "sr", tags: "tg", group: "gr", customer_id: "ci", customer_name: "cn", total_amount: "ta",
        subtotal: "sb", discount_percent: "dp", vat_rate: "vtr", shipping_fee: "sf", shipping_payer: "sp",
        creator: "cr", paid_amount: "pa", debt: "db", source: "sc", shipping_info: "si", payment_method: "pm",
        carrier: "ca", tracking_code: "tc", last_update: "lu", items: "it", qty: "q", discount: "dc",
        phone: "ph", email: "em", address: "ad", fb: "fb", avatar: "av", pass: "pw", token: "tkc", payments: "py",
        total_debt: "td", paid_debt: "pd", total_orders: "to", total_buy: "tb", amount: "am", sort_ts: "ts",
        auth_uid: "au", customer_auth_uid: "cau", owner_uid: "ou"
    };

    const reverseKeyMap = {};
    Object.keys(keyMapObj).forEach(function (key) {
        reverseKeyMap[keyMapObj[key]] = key;
    });

    function safeParse(raw, fallbackValue) {
        try {
            return JSON.parse(raw);
        } catch (error) {
            return fallbackValue;
        }
    }

    function readStorage(key, fallbackValue) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null || typeof raw === "undefined") return fallbackValue;
            return JSON.parse(raw);
        } catch (error) {
            return fallbackValue;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {}
    }

    function minifyData(obj) {
        if (Array.isArray(obj)) return obj.map(minifyData);
        if (obj !== null && typeof obj === "object") {
            const minified = {};
            Object.keys(obj).forEach(function (key) {
                minified[keyMapObj[key] || key] = minifyData(obj[key]);
            });
            return minified;
        }
        return obj;
    }

    function unminifyData(obj) {
        if (Array.isArray(obj)) return obj.map(unminifyData);
        if (obj !== null && typeof obj === "object") {
            const unminified = {};
            Object.keys(obj).forEach(function (key) {
                unminified[reverseKeyMap[key] || key] = unminifyData(obj[key]);
            });
            return unminified;
        }
        return obj;
    }

    function formatMoney(value) {
        const safeValue = Number(value || 0) || 0;
        return safeValue.toLocaleString("vi-VN") + "đ";
    }

    function parseMoney(value) {
        if (!value && value !== 0) return 0;
        if (typeof value === "number") return value;
        return parseInt(String(value).replace(/[^0-9]/g, ""), 10) || 0;
    }

    function sanitizeDigits(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function buildPhoneAlias(phone) {
        const digits = sanitizeDigits(phone);
        if (!digits) return "";
        return digits + "@" + CUSTOMER_PHONE_DOMAIN;
    }

    function isPhoneAliasEmail(value) {
        const safeValue = String(value || "").trim().toLowerCase();
        if (!safeValue || safeValue.indexOf("@") < 0) return false;
        const parts = safeValue.split("@");
        return parts.length === 2 && /^\d{8,15}$/.test(parts[0]) && parts[1] === CUSTOMER_PHONE_DOMAIN;
    }

    function buildFallbackEmail(phone, authUser) {
        const phoneAlias = buildPhoneAlias(phone);
        if (phoneAlias) return phoneAlias;
        const safeEmail = String((authUser && authUser.email) || "").trim().toLowerCase();
        if (safeEmail) return safeEmail;
        const safeUid = String((authUser && authUser.uid) || "guest").replace(/[^a-z0-9]/gi, "").toLowerCase();
        return "guest_" + (safeUid || "web") + "@" + CUSTOMER_PHONE_DOMAIN;
    }

    function normalizeCustomerStatus(statusValue) {
        const safeStatus = String(statusValue || "").trim().toLowerCase();
        if (!safeStatus || safeStatus === "active" || safeStatus === "online") return "online";
        if (["offline", "inactive", "disabled", "blocked", "lock", "locked"].includes(safeStatus)) return "offline";
        return safeStatus;
    }

    function buildLocalFallbackProfile(seed, authUser) {
        const source = seed || {};
        const safePhone = String(source.phone || "").trim();
        const safeAddress = String(source.address || "").trim();
        return {
            customerId: String(source.customerId || "").trim(),
            authUid: String((authUser && authUser.uid) || source.authUid || "").trim(),
            name: String(source.name || (authUser && authUser.displayName) || "Khach le tu web").trim(),
            email: String(source.email || (authUser && authUser.email) || buildFallbackEmail(safePhone, authUser)).trim(),
            phone: safePhone,
            shippingPhone: String(source.shippingPhone || safePhone).trim(),
            address: safeAddress,
            addresses: ensureAddressList(source.addresses, safeAddress, String(source.customerId || "").trim(), String(source.shippingPhone || safePhone).trim()),
            group: String(source.group || "Khach le tu web").trim(),
            status: normalizeCustomerStatus(source.status || "online"),
            bio: String(source.bio || "An tam chon do tot cho be moi ngay.").trim(),
            gender: String(source.gender || "Chua cap nhat").trim(),
            birthday: String(source.birthday || "").trim(),
            personalInfo: String(source.personalInfo || "Thiet lap ngay").trim(),
            avatar: String(source.avatar || "").trim(),
            facebook: String(source.facebook || "").trim(),
            orders: Array.isArray(source.orders) ? source.orders : [],
            totalOrders: Number(source.totalOrders || 0) || 0,
            totalBuy: Number(source.totalBuy || 0) || 0,
            totalDebt: Number(source.totalDebt || 0) || 0,
            paidDebt: Number(source.paidDebt || 0) || 0,
            payments: Array.isArray(source.payments) ? source.payments : [],
            updatedTs: Number(source.updatedTs || Date.now()) || Date.now()
        };
    }

    function ensureAddressList(addresses, fallbackAddress, customerId, fallbackPhone) {
        const safeAddresses = Array.isArray(addresses) ? addresses.map(function (entry, index) {
            const text = String((entry && (entry.text || entry.address)) || "").trim();
            if (!text) return null;
            return {
                id: String((entry && entry.id) || ("addr_" + (customerId || "kh") + "_" + index)).trim(),
                text: text,
                phone: String((entry && (entry.phone || entry.shippingPhone)) || "").trim(),
                isDefault: !!(entry && entry.isDefault)
            };
        }).filter(Boolean) : [];
        if (safeAddresses.length) {
            const hasDefault = safeAddresses.some(function (entry) { return !!entry.isDefault; });
            if (!hasDefault) safeAddresses[0].isDefault = true;
            return safeAddresses;
        }
        const safeFallback = String(fallbackAddress || "").trim();
        if (!safeFallback) return [];
        return [{
            id: "addr_" + (customerId || "kh"),
            text: safeFallback,
            phone: String(fallbackPhone || "").trim(),
            isDefault: true
        }];
    }

    function extractDriveId(raw) {
        const value = String(raw || "").trim();
        if (!value) return "";
        if (value.indexOf("data:image") === 0) return value;
        if (/^https?:\/\//i.test(value) && value.indexOf("drive.google.com") === -1 && value.indexOf("docs.google.com") === -1) {
            return value;
        }
        const match = value.match(/[-\w]{25,}/);
        return match ? match[0] : value;
    }

    function optimizeDriveUrl(raw, size) {
        const safeSize = size || "w800";
        const value = String(raw || "").trim();
        if (!value) return "https://via.placeholder.com/600x600?text=No+Image";
        if (value.indexOf("data:image") === 0) return value;
        if (/^https?:\/\//i.test(value) && value.indexOf("drive.google.com") === -1 && value.indexOf("docs.google.com") === -1) {
            return value;
        }
        const driveId = extractDriveId(value);
        if (/^https?:\/\//i.test(driveId)) return driveId;
        return "https://drive.google.com/thumbnail?id=" + driveId + "&sz=" + safeSize;
    }

    function normalizeImageList(rawInput) {
        const seen = {};
        const source = Array.isArray(rawInput) ? rawInput : String(rawInput || "").split(/[\n,]+/);
        return source.map(function (item) {
            return extractDriveId(item);
        }).map(function (item) {
            return String(item || "").trim();
        }).filter(Boolean).filter(function (item) {
            if (seen[item]) return false;
            seen[item] = true;
            return true;
        });
    }

    function normalizeVariants(rawVariants) {
        let parsed = rawVariants;
        if (typeof parsed === "string") {
            const parsedJson = safeParse(parsed, null);
            parsed = parsedJson !== null
                ? parsedJson
                : String(rawVariants || "").split(/[,;\n]+/).map(function (value) { return { name: String(value || "").trim() }; });
        }
        if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
            parsed = Object.keys(parsed).map(function (key) {
                return parsed[key];
            });
        }
        if (!Array.isArray(parsed)) return [];

        const groupedVariants = [];
        const flatVariants = [];

        parsed.forEach(function (variant) {
            const optionsSource = Array.isArray(variant && variant.options)
                ? variant.options
                : (Array.isArray(variant && variant.values) ? variant.values : []);
            const options = optionsSource.map(function (item) {
                return String(item || "").trim();
            }).filter(Boolean);

            if (options.length) {
                groupedVariants.push({
                    name: String((variant && (variant.name || variant.label)) || "Phan loai").trim(),
                    options: options
                });
                return;
            }

            const variantName = String((variant && (variant.name || variant.label || variant.n)) || variant || "").trim();
            if (!variantName) return;
            flatVariants.push({
                name: variantName,
                price: Number((variant && (variant.price || variant.p)) || 0) || 0,
                stock: Number((variant && (variant.stock || variant.s)) || 0) || 0
            });
        });

        if (groupedVariants.length) return groupedVariants;
        if (!flatVariants.length) return [];

        return [{
            name: "Phan loai",
            options: flatVariants.map(function (variant) { return variant.name; }),
            entries: flatVariants
        }];
    }

    function mapBadges(rawProduct) {
        const values = [
            String(rawProduct.status || "").trim(),
            String(rawProduct.tags || "").split(",")
        ].flat().map(function (value) {
            return String(value || "").trim();
        }).filter(Boolean);
        const badges = [];
        values.forEach(function (value) {
            const upper = value.toUpperCase();
            if ((upper.indexOf("NEW") > -1 || upper.indexOf("MOI") > -1) && badges.indexOf("NEW") === -1) badges.push("NEW");
            if ((upper.indexOf("HOT") > -1 || upper.indexOf("NOI") > -1) && badges.indexOf("HOT") === -1) badges.push("HOT");
            if ((upper.indexOf("SALE") > -1 || upper.indexOf("GIAM") > -1 || upper.indexOf("KHUYEN") > -1) && badges.indexOf("SALE") === -1) badges.push("SALE");
        });
        if ((Number(rawProduct.km_phan_tram || 0) || 0) > 0 && badges.indexOf("SALE") === -1) badges.push("SALE");
        return badges;
    }

    function normalizeTagList(rawTags, fallbackGroup) {
        const queue = [];
        if (Array.isArray(rawTags)) {
            queue.push.apply(queue, rawTags);
        } else if (rawTags && typeof rawTags === "object") {
            Object.keys(rawTags).forEach(function (key) {
                queue.push(rawTags[key]);
            });
        } else {
            queue.push(rawTags);
        }
        if (fallbackGroup) queue.push(fallbackGroup);

        const seen = {};
        const tags = [];
        queue.forEach(function (item) {
            String(item || "").split(/[,;|\n]+/).map(function (value) {
                return String(value || "").trim();
            }).filter(Boolean).forEach(function (value) {
                const key = value.toLowerCase();
                if (seen[key]) return;
                seen[key] = true;
                tags.push(value);
            });
        });

        return tags;
    }

    function normalizeCloudProductNode(productId, node) {
        const rawNode = node && node.co_kh ? unminifyData(node.co_kh) : unminifyData(node || {});
        const images = normalizeImageList(rawNode.link_anh || rawNode.image || rawNode.img || "");
        const wholesalePrice = parseMoney(rawNode.gia_si || rawNode.wholesale_price || 0);
        const retailPrice = parseMoney(rawNode.gia_ban_le || rawNode.price || 0);
        const basePrice = wholesalePrice || retailPrice || 0;
        const discountPercent = Number(rawNode.km_phan_tram || rawNode.discount_percent || 0) || 0;
        const finalPrice = discountPercent > 0 ? Math.max(0, Math.round(basePrice * (100 - discountPercent) / 100)) : basePrice;
        const stock = Number(rawNode.ton_kho || rawNode.stock || 0) || 0;
        const pendingStock = Number(rawNode.dang_dat || rawNode.pending_stock || 0) || 0;
        const availableStock = Math.max(stock - pendingStock, 0);
        const sold = Number(rawNode.total_buy || rawNode.sold || 0) || 0;
        const updatedTs = Number(rawNode.updated_ts || 0) || 0;
        const group = String(rawNode.group || "").trim();
        const code = String(rawNode.ma_sp || rawNode.code || rawNode.sku || rawNode.id || productId || "").trim();
        const firstImage = images[0] ? optimizeDriveUrl(images[0], "w800") : "https://via.placeholder.com/600x600?text=Product";
        const tags = normalizeTagList(rawNode.tags, rawNode.group);
        const primaryCategory = String(group || tags[0] || "San pham");
        const normalizedVariants = normalizeVariants(rawNode.variants || rawNode.vr || node.vr || node.variants || []);
        const unit = String(rawNode.dvt || rawNode.unit || rawNode.don_vi || rawNode.don_vi_tinh || rawNode.dv_tinh || "").trim();
        const minQty = Math.max(Number(rawNode.si_tu || rawNode.su || rawNode.min_qty || rawNode.minQty || 1) || 1, 1);
        return {
            id: String(rawNode.id || productId || code || ""),
            unit: unit,
            minQty: minQty,
            code: code,
            group: group,
            cat: primaryCategory,
            tags: tags,
            name: String(rawNode.name || ("San pham " + productId)),
            price: formatMoney(finalPrice || basePrice || 0),
            priceValue: finalPrice || basePrice || 0,
            sold: sold,
            images: images.length ? images.map(function (image) { return optimizeDriveUrl(image, "w1200"); }) : [firstImage],
            img: firstImage,
            desc: String(rawNode.description || rawNode.desc || (primaryCategory + " | Kho: " + (rawNode.kho || "Mac dinh"))),
            variants: normalizedVariants,
            inStock: availableStock > 0,
            badges: mapBadges(rawNode),
            stock: stock,
            pendingStock: pendingStock,
            availableStock: availableStock,
            updatedTs: updatedTs
        };
    }

    function normalizeCloudCustomer(customerId, node, authUser) {
        const basic = node && node.c_ba ? unminifyData(node.c_ba) : {};
        const finance = node && node.t_chi ? unminifyData(node.t_chi) : {};
        const secure = node && node.b_ma ? unminifyData(node.b_ma) : {};
        const addresses = Array.isArray(basic.addresses) ? basic.addresses : [];
        const fallbackAddress = String(basic.address || "").trim();
        const normalizedAddresses = ensureAddressList(
            addresses,
            fallbackAddress,
            customerId,
            String(basic.shipping_phone || basic.shippingPhone || basic.phone || "").trim()
        );
        const defaultAddress = normalizedAddresses.find(function (entry) { return !!(entry && entry.isDefault); }) || normalizedAddresses[0] || null;

        return {
            customerId: customerId,
            authUid: String(secure.auth_uid || (authUser && authUser.uid) || "").trim(),
            name: String(basic.name || (authUser && authUser.displayName) || "Truong An"),
            email: String(basic.email || (authUser && authUser.email) || "").trim(),
            phone: String(basic.phone || (isPhoneAliasEmail(authUser && authUser.email) ? sanitizeDigits(authUser.email) : "") || "").trim(),
            address: fallbackAddress,
            addresses: normalizedAddresses,
            shippingPhone: String(basic.shipping_phone || basic.shippingPhone || (defaultAddress && defaultAddress.phone) || "").trim(),
            avatar: String(basic.avatar || "").trim(),
            facebook: String(basic.fb || "").trim(),
            group: String(basic.group || "Khach le tu web").trim(),
            status: normalizeCustomerStatus(basic.status || "online"),
            bio: String(basic.bio || "An tam chon do tot cho be moi ngay."),
            gender: String(basic.gender || "Chua cap nhat"),
            birthday: String(basic.birthday || ""),
            personalInfo: String(basic.personalInfo || "Thiet lap ngay"),
            orders: [],
            totalOrders: Number(finance.total_orders || 0) || 0,
            totalBuy: Number(finance.total_buy || 0) || 0,
            totalDebt: Number(finance.total_debt || 0) || 0,
            paidDebt: Number(finance.paid_debt || 0) || 0,
            payments: Array.isArray(finance.payments) ? finance.payments : [],
            updatedTs: Number(basic.updated_ts || 0) || Date.now()
        };
    }

    function buildCustomerWritePayload(customerId, authUid, profileData, options) {
        const safeOptions = options || {};
        const safeProfile = profileData || {};
        const updatedTs = Number(safeOptions.updatedTs || safeProfile.updatedTs || Date.now()) || Date.now();
        const safeAddresses = ensureAddressList(safeProfile.addresses, safeProfile.address, customerId, safeProfile.shippingPhone || safeProfile.phone);
        const defaultAddress = safeAddresses.find(function (entry) {
            return !!(entry && entry.isDefault);
        });
        const shippingPhone = String(safeProfile.shippingPhone || (defaultAddress && defaultAddress.phone) || "").trim();
        const basic = minifyData({
            name: String(safeProfile.name || "").trim(),
            phone: String(safeProfile.phone || "").trim(),
            email: String(safeProfile.email || "").trim(),
            address: defaultAddress ? String(defaultAddress.text || "").trim() : String(safeProfile.address || "").trim(),
            shipping_phone: shippingPhone,
            avatar: String(safeProfile.avatar || "").trim(),
            fb: String(safeProfile.facebook || "").trim(),
            group: String(safeProfile.group || "Khach le tu web").trim(),
            status: normalizeCustomerStatus(safeProfile.status || "online"),
            updated_ts: updatedTs,
            bio: String(safeProfile.bio || "").trim(),
            gender: String(safeProfile.gender || "Chua cap nhat").trim(),
            birthday: String(safeProfile.birthday || "").trim(),
            personalInfo: String(safeProfile.personalInfo || "Thiet lap ngay").trim(),
            addresses: safeAddresses
        });
        const finance = {
            totalDebt: Number(safeProfile.totalDebt || 0) || 0,
            paidDebt: Number(safeProfile.paidDebt || 0) || 0,
            totalOrders: Number(safeProfile.totalOrders || 0) || 0,
            totalBuy: Number(safeProfile.totalBuy || 0) || 0,
            payments: Array.isArray(safeProfile.payments) ? safeProfile.payments : []
        };
        const updates = {};
        updates["khachhang/" + customerId + "/c_ba"] = basic;
        const customerNode = {
            c_ba: basic
        };
        if (safeOptions.includeFinance === true) {
            updates["khachhang/" + customerId + "/t_chi/td"] = finance.totalDebt;
            updates["khachhang/" + customerId + "/t_chi/pd"] = finance.paidDebt;
            updates["khachhang/" + customerId + "/t_chi/to"] = finance.totalOrders;
            updates["khachhang/" + customerId + "/t_chi/tb"] = finance.totalBuy;
            updates["khachhang/" + customerId + "/t_chi/py"] = minifyData(finance.payments);
            customerNode.t_chi = {
                td: finance.totalDebt,
                pd: finance.paidDebt,
                to: finance.totalOrders,
                tb: finance.totalBuy,
                py: minifyData(finance.payments)
            };
        }
        if (safeOptions.includeSecurity !== false) {
            customerNode.b_ma = minifyData({
                auth_uid: String(authUid || "").trim(),
                last_update: updatedTs
            });
            updates["khachhang/" + customerId + "/b_ma"] = customerNode.b_ma;
        }
        const authIndex = {
            customer_id: customerId,
            group: String(safeProfile.group || "Khach le tu web").trim(),
            updated_ts: updatedTs
        };
        updates["khachhang_auth_index/" + authUid] = authIndex;
        return {
            updates: updates,
            customerNode: customerNode,
            authIndex: authIndex,
            profile: Object.assign({}, safeProfile, {
                customerId: customerId,
                authUid: String(authUid || "").trim(),
                address: defaultAddress ? String(defaultAddress.text || "").trim() : String(safeProfile.address || "").trim(),
                addresses: safeAddresses,
                shippingPhone: shippingPhone,
                updatedTs: updatedTs
            })
        };
    }

    function normalizeOrderStatus(statusValue) {
        const statusMap = {
            "0": "Don dat",
            "1": "Cho xac nhan",
            "2": "Dang giao",
            "3": "Giao COD",
            "4": "Hoan thanh",
            "5": "Huy",
            "6": "Tra hang"
        };
        const safeValue = String(statusValue || "").trim();
        return statusMap[safeValue] || safeValue || "Cho xac nhan";
    }

    function findCatalogProductInCache(productId) {
        const safeProductId = String(productId || "").trim();
        if (!safeProductId) return null;
        const cached = getCatalogCache();
        if (!cached || !Array.isArray(cached.products)) return null;
        for (let index = 0; index < cached.products.length; index += 1) {
            const product = cached.products[index];
            if (String((product && product.id) || "").trim() === safeProductId) return product || null;
        }
        return null;
    }

    function normalizeOrderItem(item) {
        const rawItem = unminifyData(item || {});
        const rootId = String(rawItem.rootId || rawItem.product_id || rawItem.id || "").trim();
        const catalogProduct = rootId ? findCatalogProductInCache(rootId) : null;
        const imageSource = rawItem.img || rawItem.link_anh || (catalogProduct && (catalogProduct.img || ((catalogProduct.images || [])[0]))) || "";
        const unitPrice = parseMoney(rawItem.price || rawItem.gia_ban_le || 0);
        const unit = String(rawItem.unit || rawItem.dvt || rawItem.don_vi || (catalogProduct && catalogProduct.unit) || "").trim();
        return {
            id: String(rawItem.id || rootId || ""),
            rootId: rootId,
            name: String(rawItem.name || "San pham"),
            quantity: Number(rawItem.qty || rawItem.quantity || 1) || 1,
            price: formatMoney(unitPrice),
            priceValue: unitPrice,
            unit: unit,
            img: optimizeDriveUrl(imageSource, "w600"),
            variantInfo: String(rawItem.variantInfo || rawItem.note || "").trim()
        };
    }

    function normalizeOrderSummary(orderId, node) {
        const info = node && node.in4 ? unminifyData(node.in4) : unminifyData(node || {});
        const detail = node && node.ch_t ? unminifyData(node.ch_t) : {};
        const items = Array.isArray(detail.items) ? detail.items : [];
        const totalAmount = Number(info.total_amount || info.subtotal || 0) || 0;
        const shippingFee = Number(info.shipping_fee || 0) || 0;
        const paidAmount = Number(info.paid_amount || 0) || 0;
        const debtAmount = Number(info.debt || 0) || 0;
        return {
            id: String(info.id || orderId || ""),
            status: normalizeOrderStatus(info.status),
            rawStatus: Number(info.status || 0) || 0,
            ownerUid: String(info.owner_uid || info.customer_auth_uid || "").trim(),
            customerId: String(info.customer_id || "").trim(),
            customerName: String(info.customer_name || "").trim(),
            customerAuthUid: String(info.customer_auth_uid || "").trim(),
            totalAmount: totalAmount,
            subtotal: Number(info.subtotal || info.total_amount || 0) || 0,
            discountPercent: Number(info.discount_percent || 0) || 0,
            discountValue: Number(info.discount_value || 0) || 0,
            shippingFee: shippingFee,
            finalAmount: totalAmount,
            paidAmount: paidAmount,
            debt: debtAmount,
            phone: String(info.phone || ""),
            date: String(info.date || ""),
            sortTs: Number(info.sort_ts || 0) || 0,
            note: String(info.note || "").trim(),
            source: String(info.source || "").trim(),
            paymentMethod: String(info.payment_method || "").trim(),
            shippingPayer: String(info.shipping_payer || "").trim(),
            priceType: String(info.price_type || "").trim(),
            creator: String(info.creator || "").trim(),
            carrier: String(info.carrier || "").trim(),
            trackingCode: String(info.tracking_code || "").trim(),
            shippingInfo: info.shipping_info || {},
            itemsCount: items.length,
            items: items.length ? items.map(function (entry) { return normalizeOrderItem(entry); }) : []
        };
    }

    function getCatalogCache() {
        const cached = readStorage(STORAGE_KEYS.catalog, null);
        if (!cached || !Array.isArray(cached.products)) {
            return {
                products: [],
                cursor: { key: "", ts: 0 },
                hasMore: true,
                lastDeltaTs: 0,
                lastMetaTs: 0
            };
        }
        return cached;
    }

    function setCatalogCache(payload) {
        const safePayload = Object.assign({
            products: [],
            cursor: { key: "", ts: 0 },
            hasMore: true,
            lastDeltaTs: 0,
            lastMetaTs: 0,
            savedAt: Date.now()
        }, payload || {});
        writeStorage(STORAGE_KEYS.catalog, safePayload);
        return safePayload;
    }

    function mergeProductLists(existingProducts, nextProducts) {
        const productMap = {};
        (Array.isArray(existingProducts) ? existingProducts : []).forEach(function (product) {
            if (product && product.id) productMap[product.id] = product;
        });
        (Array.isArray(nextProducts) ? nextProducts : []).forEach(function (product) {
            if (product && product.id) productMap[product.id] = product;
        });
        return Object.keys(productMap).map(function (key) {
            return productMap[key];
        }).sort(function (a, b) {
            const delta = (Number(b.updatedTs || 0) || 0) - (Number(a.updatedTs || 0) || 0);
            if (delta !== 0) return delta;
            return String(a.id || "").localeCompare(String(b.id || ""));
        });
    }

    function getCatalogLastUpdatedTs(products) {
        return (Array.isArray(products) ? products : []).reduce(function (maxValue, product) {
            return Math.max(maxValue, Number((product && product.updatedTs) || 0) || 0);
        }, 0);
    }

    function updateCatalogCacheProducts(products, options) {
        const cached = getCatalogCache();
        const safeProducts = Array.isArray(products) ? products : cached.products;
        return setCatalogCache(Object.assign({}, cached, options || {}, {
            products: safeProducts,
            lastDeltaTs: getCatalogLastUpdatedTs(safeProducts) || Number(cached.lastDeltaTs || 0) || 0,
            savedAt: Date.now()
        }));
    }

    function applyPendingReservationToCatalog(orderItems, updatedTs) {
        const cached = getCatalogCache();
        const items = Array.isArray(orderItems) ? orderItems : [];
        if (!Array.isArray(cached.products) || !cached.products.length || !items.length) return cached;

        const pendingMap = {};
        items.forEach(function (item) {
            const productId = String((item && (item.rootId || item.id)) || "").trim();
            if (!productId) return;
            pendingMap[productId] = (Number(pendingMap[productId] || 0) || 0) + (Number(item.qty || item.quantity || 0) || 0);
        });

        const nextProducts = cached.products.map(function (product) {
            const productId = String((product && product.id) || "").trim();
            if (!productId || !pendingMap[productId]) return product;

            const stock = Number((product && product.stock) || 0) || 0;
            const currentPending = Number((product && (product.pendingStock || product.dangDat)) || 0) || 0;
            const nextPending = currentPending + pendingMap[productId];
            return Object.assign({}, product, {
                pendingStock: nextPending,
                availableStock: Math.max(stock - nextPending, 0),
                inStock: Math.max(stock - nextPending, 0) > 0,
                updatedTs: Number(updatedTs || product.updatedTs || Date.now()) || Date.now()
            });
        });

        const nextCache = updateCatalogCacheProducts(nextProducts, {
            savedAt: Number(updatedTs || Date.now()) || Date.now()
        });
        try {
            window.dispatchEvent(new CustomEvent("retail-catalog-updated"));
        } catch (error) {}
        return nextCache;
    }

    function removeCatalogCacheProduct(productId, sourceName) {
        const safeProductId = String(productId || "").trim();
        const cached = getCatalogCache();
        if (!safeProductId) return cached;
        const filteredProducts = (Array.isArray(cached.products) ? cached.products : []).filter(function (product) {
            return String((product && product.id) || "").trim() !== safeProductId;
        });
        return updateCatalogCacheProducts(filteredProducts, {
            catalogSource: sourceName || cached.catalogSource || service.catalogSource
        });
    }

    function rememberLoginEmail(email) {
        const safeEmail = String(email || "").trim().toLowerCase();
        if (!safeEmail) return;
        try {
            localStorage.setItem(STORAGE_KEYS.loginEmail, safeEmail);
        } catch (error) {}
    }

    function readRememberedLoginEmail() {
        try {
            return String(localStorage.getItem(STORAGE_KEYS.loginEmail) || "").trim().toLowerCase();
        } catch (error) {
            return "";
        }
    }

    function rememberPhoneLogin(phone, email) {
        const digits = sanitizeDigits(phone);
        const safeEmail = String(email || "").trim().toLowerCase();
        if (!digits || !safeEmail) return;
        try {
            const currentMap = readStorage(STORAGE_KEYS.phoneLoginMap, {}) || {};
            currentMap[digits] = safeEmail;
            writeStorage(STORAGE_KEYS.phoneLoginMap, currentMap);
        } catch (error) {}
    }

    function readPhoneLoginEmail(phone) {
        const digits = sanitizeDigits(phone);
        if (!digits) return "";
        try {
            const currentMap = readStorage(STORAGE_KEYS.phoneLoginMap, {}) || {};
            return String(currentMap[digits] || "").trim().toLowerCase();
        } catch (error) {
            return "";
        }
    }

    const service = {
        readyPromise: null,
        primaryDb: null,
        catalogDb: null,
        auth: null,
        catalogAuth: null,
        catalogMetaBound: false,
        catalogSource: "catalog_public",
        catalogAccessPromise: null,
        catalogLiveSource: "",
        catalogDeltaRef: null,
        catalogDeltaBaseRef: null,
        catalogDeltaAddedHandler: null,
        catalogDeltaChangedHandler: null,
        catalogDeltaRemovedHandler: null,
        catalogSubscribers: [],
        sessionBootPromise: null,
        catalogLoadState: {
            loading: false,
            syncingDelta: false
        }
    };

    function isPermissionDeniedError(error) {
        const code = String((error && error.code) || "").toLowerCase();
        const message = String((error && error.message) || "").toLowerCase();
        return code.indexOf("permission_denied") > -1 || message.indexOf("permission_denied") > -1;
    }

    function getCatalogSourceConfig(sourceName) {
        if (sourceName === "catalog_public") {
            return {
                source: "catalog_public",
                path: "catalog_public",
                orderBy: "updated_ts"
            };
        }
        return {
            source: "sanpham",
            path: "sanpham",
            orderBy: "co_kh/updated_ts"
        };
    }

    function readCatalogSourcePreference() {
        const cached = getCatalogCache();
        return String(service.catalogSource || cached.catalogSource || "catalog_public");
    }

    function saveCatalogSourcePreference(sourceName) {
        service.catalogSource = sourceName === "catalog_public" ? "catalog_public" : "sanpham";
        const cached = getCatalogCache();
        setCatalogCache(Object.assign({}, cached, {
            catalogSource: service.catalogSource
        }));
        return service.catalogSource;
    }

    function notifyCatalogSubscribers(payload) {
        (Array.isArray(service.catalogSubscribers) ? service.catalogSubscribers : []).forEach(function (callback) {
            if (typeof callback !== "function") return;
            try {
                callback(payload);
            } catch (error) {}
        });
    }

    function detachCatalogLiveBindings() {
        if (service.catalogDeltaRef && service.catalogDeltaAddedHandler) {
            service.catalogDeltaRef.off("child_added", service.catalogDeltaAddedHandler);
        }
        if (service.catalogDeltaBaseRef && service.catalogDeltaChangedHandler) {
            service.catalogDeltaBaseRef.off("child_changed", service.catalogDeltaChangedHandler);
        }
        if (service.catalogDeltaBaseRef && service.catalogDeltaRemovedHandler) {
            service.catalogDeltaBaseRef.off("child_removed", service.catalogDeltaRemovedHandler);
        }
        service.catalogDeltaRef = null;
        service.catalogDeltaBaseRef = null;
        service.catalogDeltaAddedHandler = null;
        service.catalogDeltaChangedHandler = null;
        service.catalogDeltaRemovedHandler = null;
        service.catalogLiveSource = "";
    }

    function attachCatalogLiveBindings(sourceName) {
        const safeSource = sourceName === "sanpham" ? "sanpham" : "catalog_public";
        if (!service.getCatalogDb()) return;
        if (service.catalogLiveSource === safeSource && service.catalogDeltaRef && service.catalogDeltaBaseRef) return;

        detachCatalogLiveBindings();
        service.catalogLiveSource = safeSource;
        service.catalogDeltaRef = service.getCatalogDb().ref(safeSource).orderByKey().limitToLast(1);
        service.catalogDeltaBaseRef = service.getCatalogDb().ref(safeSource);

        service.catalogDeltaAddedHandler = function (snapshot) {
            const product = normalizeCloudProductNode(snapshot.key, snapshot.val());
            const nextCache = product
                ? updateCatalogCacheProducts(mergeProductLists(getCatalogCache().products, [product]), {
                    catalogSource: safeSource
                })
                : removeCatalogCacheProduct(snapshot.key, safeSource);
            notifyCatalogSubscribers({
                type: "catalog-live",
                source: safeSource,
                products: nextCache.products,
                changedProductId: snapshot.key
            });
        };
        service.catalogDeltaChangedHandler = function (snapshot) {
            const product = normalizeCloudProductNode(snapshot.key, snapshot.val());
            const nextCache = product
                ? updateCatalogCacheProducts(mergeProductLists(getCatalogCache().products, [product]), {
                    catalogSource: safeSource
                })
                : removeCatalogCacheProduct(snapshot.key, safeSource);
            notifyCatalogSubscribers({
                type: "catalog-live",
                source: safeSource,
                products: nextCache.products,
                changedProductId: snapshot.key
            });
        };
        service.catalogDeltaRemovedHandler = function (snapshot) {
            const nextCache = removeCatalogCacheProduct(snapshot.key, safeSource);
            notifyCatalogSubscribers({
                type: "catalog-live",
                source: safeSource,
                products: nextCache.products,
                changedProductId: snapshot.key
            });
        };

        service.catalogDeltaRef.on("child_added", service.catalogDeltaAddedHandler, function () {});
        service.catalogDeltaBaseRef.on("child_changed", service.catalogDeltaChangedHandler, function () {});
        service.catalogDeltaBaseRef.on("child_removed", service.catalogDeltaRemovedHandler, function () {});
    }

    async function queryCatalogPageBySource(sourceName, options) {
        const opts = options || {};
        const cached = getCatalogCache();
        const config = getCatalogSourceConfig(sourceName);
        const pageSize = Math.max(8, Number(opts.pageSize || DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE);
        let query = service.getCatalogDb().ref(config.path).orderByChild(config.orderBy);
        if (!opts.reset && cached.cursor && cached.cursor.key) {
            query = query.startAt(Number(cached.cursor.ts || 0) || 0, String(cached.cursor.key));
        }
        query = query.limitToFirst(pageSize + (opts.reset ? 0 : 1));

        const snapshot = await query.once("value");
        const rows = [];
        snapshot.forEach(function (childSnapshot) {
            rows.push({
                key: childSnapshot.key,
                node: childSnapshot.val()
            });
        });

        if (!opts.reset && cached.cursor && cached.cursor.key && rows.length && rows[0].key === cached.cursor.key) {
            rows.shift();
        }

        return {
            config: config,
            rows: rows,
            cached: cached,
            pageSize: pageSize
        };
    }

    service.ensureReady = function () {
        if (service.readyPromise) return service.readyPromise;

        service.readyPromise = new Promise(function (resolve, reject) {
            try {
                if (typeof firebase === "undefined") {
                    reject(new Error("firebase-sdk-missing"));
                    return;
                }

                if (!firebase.apps || firebase.apps.length === 0) {
                    firebase.initializeApp(FIREBASE_MAIN_CONFIG);
                }

                const primaryApp = firebase.app();
                let catalogApp = null;
                for (let i = 0; i < firebase.apps.length; i += 1) {
                    if (firebase.apps[i].name === "RetailCatalog") {
                        catalogApp = firebase.apps[i];
                        break;
                    }
                }
                if (!catalogApp) catalogApp = firebase.initializeApp(FIREBASE_CATALOG_CONFIG, "RetailCatalog");

                service.primaryDb = primaryApp.database();
                service.catalogDb = catalogApp.database ? catalogApp.database() : service.primaryDb;
                service.auth = primaryApp.auth();
                service.catalogAuth = typeof catalogApp.auth === "function" ? catalogApp.auth() : null;
                if (service.auth && service.auth.setPersistence && firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
                    service.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () { return null; });
                }
                resolve(service);
            } catch (error) {
                reject(error);
            }
        });

        return service.readyPromise;
    };

    service.getPrimaryDb = function () {
        return service.primaryDb;
    };

    service.getCatalogDb = function () {
        return service.catalogDb || service.primaryDb;
    };

    service.getAuth = function () {
        return service.auth;
    };

    service.ensureCatalogAccess = async function () {
        await service.ensureReady();
        if (!service.catalogAuth || typeof service.catalogAuth.signInAnonymously !== "function") return false;
        if (service.catalogAuth.currentUser) return true;
        if (service.catalogAccessPromise) return service.catalogAccessPromise;

        service.catalogAccessPromise = service.catalogAuth.signInAnonymously().then(function () {
            return true;
        }).catch(function () {
            return false;
        }).finally(function () {
            service.catalogAccessPromise = null;
        });

        return service.catalogAccessPromise;
    };

    service.getCachedCatalog = function () {
        return getCatalogCache();
    };

    service.setCatalogCache = function (products, options) {
        const cached = getCatalogCache();
        return setCatalogCache(Object.assign({}, cached, options || {}, {
            products: Array.isArray(products) ? products : cached.products
        }));
    };

    service.loadCatalogPage = async function (options) {
        const opts = options || {};
        const reset = !!opts.reset;

        await service.ensureReady();
        if (service.catalogLoadState.loading) {
            const cachedWhileBusy = getCatalogCache();
            return Object.assign({}, cachedWhileBusy, { source: "cache" });
        }

        service.catalogLoadState.loading = true;

        try {
            const preferredSource = readCatalogSourcePreference();
            const hasCatalogAccess = await service.ensureCatalogAccess();
            const candidateSources = []
                .concat(hasCatalogAccess ? ["sanpham"] : [])
                .concat([preferredSource, "catalog_public"])
                .filter(function (sourceName, index, list) {
                    return !!sourceName && list.indexOf(sourceName) === index;
                });

            let queryResult = null;
            let lastError = null;
            for (let index = 0; index < candidateSources.length; index += 1) {
                const sourceName = candidateSources[index];
                try {
                    const nextResult = await queryCatalogPageBySource(sourceName, opts);
                    if (reset && !nextResult.rows.length && sourceName !== "catalog_public") continue;
                    queryResult = nextResult;
                    saveCatalogSourcePreference(nextResult.config.source);
                    break;
                } catch (error) {
                    lastError = error;
                    if (isPermissionDeniedError(error) && index < candidateSources.length - 1) continue;
                }
            }

            if (!queryResult) {
                throw lastError || new Error("catalog-load-failed");
            }

            const cached = queryResult.cached;
            const rows = queryResult.rows;
            const pageRows = rows.slice(0, queryResult.pageSize);
            const pageProducts = pageRows.map(function (row) {
                return normalizeCloudProductNode(row.key, row.node);
            }).filter(Boolean);

            const mergedProducts = mergeProductLists(reset ? [] : cached.products, pageProducts);
            const lastRow = pageRows.length ? pageRows[pageRows.length - 1] : null;
            const nextCursor = lastRow ? {
                key: lastRow.key,
                ts: Number((lastRow.node && lastRow.node.co_kh && lastRow.node.co_kh.updated_ts) || (lastRow.node && lastRow.node.updated_ts) || 0) || 0
            } : (reset ? { key: "", ts: 0 } : cached.cursor);

            const highestDeltaTs = mergedProducts.reduce(function (maxValue, product) {
                return Math.max(maxValue, Number(product.updatedTs || 0) || 0);
            }, 0);

            const saved = setCatalogCache({
                products: mergedProducts,
                cursor: nextCursor || { key: "", ts: 0 },
                hasMore: rows.length > queryResult.pageSize,
                lastDeltaTs: highestDeltaTs || Number(cached.lastDeltaTs || 0) || 0,
                lastMetaTs: Number(cached.lastMetaTs || 0) || 0,
                catalogSource: queryResult.config.source
            });

            attachCatalogLiveBindings(queryResult.config.source);
            return Object.assign({}, saved, {
                pageProducts: pageProducts,
                source: "firebase"
            });
        } finally {
            service.catalogLoadState.loading = false;
        }
    };

    service.syncCatalogDelta = async function (options) {
        const opts = options || {};
        const pageSize = Math.max(10, Number(opts.pageSize || 60) || 60);
        await service.ensureReady();
        if (service.catalogLoadState.syncingDelta) return getCatalogCache();
        service.catalogLoadState.syncingDelta = true;

        try {
            let cached = getCatalogCache();
            const startTs = Number(opts.force ? 0 : cached.lastDeltaTs || 0) || 0;
            if (!startTs) return service.loadCatalogPage({ reset: cached.products.length === 0, pageSize: Math.max(pageSize, DEFAULT_PAGE_SIZE) });

            const hasCatalogAccess = await service.ensureCatalogAccess();
            const candidateSources = []
                .concat([readCatalogSourcePreference()])
                .concat(hasCatalogAccess ? ["sanpham"] : [])
                .concat(["catalog_public"])
                .filter(function (sourceName, index, list) {
                    return !!sourceName && list.indexOf(sourceName) === index;
                });

            let mergedProducts = cached.products.slice();
            let resolvedSource = readCatalogSourcePreference();
            let lastError = null;

            for (let sourceIndex = 0; sourceIndex < candidateSources.length; sourceIndex += 1) {
                const sourceConfig = getCatalogSourceConfig(candidateSources[sourceIndex]);
                let cursorTs = startTs + 1;
                let keepLoading = true;
                let sourceMergedProducts = cached.products.slice();

                try {
                    while (keepLoading) {
                        const snapshot = await service.getCatalogDb().ref(sourceConfig.path).orderByChild(sourceConfig.orderBy).startAt(cursorTs).limitToFirst(pageSize).once("value");
                        const rows = [];
                        snapshot.forEach(function (childSnapshot) {
                            rows.push({
                                key: childSnapshot.key,
                                node: childSnapshot.val()
                            });
                        });

                        if (!rows.length) break;

                        const pageProducts = rows.map(function (row) {
                            return normalizeCloudProductNode(row.key, row.node);
                        }).filter(Boolean);

                        sourceMergedProducts = mergeProductLists(sourceMergedProducts, pageProducts);

                        const lastProduct = pageProducts.length ? pageProducts[pageProducts.length - 1] : null;
                        cursorTs = lastProduct ? (Number(lastProduct.updatedTs || cursorTs) || cursorTs) + 1 : cursorTs + 1;
                        keepLoading = rows.length === pageSize;
                    }

                    mergedProducts = sourceMergedProducts;
                    resolvedSource = sourceConfig.source;
                    break;
                } catch (error) {
                    lastError = error;
                    if (isPermissionDeniedError(error) && sourceIndex < candidateSources.length - 1) continue;
                    throw error;
                }
            }

            if (lastError && !mergedProducts.length && !cached.products.length) {
                throw lastError;
            }

            cached = updateCatalogCacheProducts(mergedProducts, Object.assign({}, cached, {
                catalogSource: resolvedSource
            }));
            attachCatalogLiveBindings(resolvedSource);
            saveCatalogSourcePreference(resolvedSource);

            return cached;
        } finally {
            service.catalogLoadState.syncingDelta = false;
        }
    };

    service.subscribeCatalogMeta = async function (onChange) {
        await service.ensureReady();
        if (typeof onChange === "function" && service.catalogSubscribers.indexOf(onChange) === -1) {
            service.catalogSubscribers.push(onChange);
        }
        attachCatalogLiveBindings(readCatalogSourcePreference());

        const hasCatalogAccess = await service.ensureCatalogAccess();
        if (service.catalogMetaBound || !hasCatalogAccess) return;
        service.catalogMetaBound = true;
        service.getCatalogDb().ref("metadata/last_update_products").on("value", function (snapshot) {
            const nextMetaTs = Number(snapshot.val() || 0) || 0;
            const cached = getCatalogCache();
            if (nextMetaTs && nextMetaTs > Number(cached.lastMetaTs || 0)) {
                setCatalogCache(Object.assign({}, cached, { lastMetaTs: nextMetaTs }));
                notifyCatalogSubscribers({
                    type: "catalog-meta",
                    ts: nextMetaTs,
                    source: readCatalogSourcePreference()
                });
            }
        }, function () {});
    };

    service.waitForAuthUser = async function (timeoutMs) {
        await service.ensureReady();
        const auth = service.getAuth();
        if (!auth) return null;
        if (auth.currentUser) return auth.currentUser;

        return new Promise(function (resolve) {
            let done = false;
            let unsubscribe = function () {};

            function finish(user) {
                if (done) return;
                done = true;
                try { unsubscribe(); } catch (error) {}
                resolve(user || null);
            }

            unsubscribe = auth.onAuthStateChanged(function (user) {
                finish(user);
            });

            setTimeout(function () {
                finish(auth.currentUser || null);
            }, Math.max(Number(timeoutMs || 2500) || 2500, 400));
        });
    };

    service.getCachedCustomer = function () {
        return readStorage(STORAGE_KEYS.profile, null);
    };

    service.saveCachedCustomer = function (profile) {
        if (!profile) return null;
        writeStorage(STORAGE_KEYS.profile, profile);
        if (profile.customerId) {
            try {
                localStorage.setItem(STORAGE_KEYS.customerId, String(profile.customerId));
            } catch (error) {}
        }
        return profile;
    };

    async function resolveCustomerSnapshotByAuth(db, authUid, preferredCustomerId) {
        const safeAuthUid = String(authUid || "").trim();
        const safeCustomerId = String(preferredCustomerId || "").trim();
        if (!safeAuthUid) return null;

        async function loadCustomerById(customerId) {
            try {
                const customerSnap = await db.ref("khachhang/" + customerId).once("value");
                if (!customerSnap.exists()) return null;
                const secure = customerSnap.child("b_ma").exists() ? unminifyData(customerSnap.child("b_ma").val() || {}) : {};
                if (String(secure.auth_uid || "").trim() && String(secure.auth_uid || "").trim() !== safeAuthUid) return null;
                return customerSnap;
            } catch (error) {
                const rawMessage = String((error && (error.code || error.message)) || "").toLowerCase();
                if (rawMessage.indexOf("permission") >= 0 || rawMessage.indexOf("denied") >= 0) return null;
                throw error;
            }
        }

        if (safeCustomerId) {
            const directSnap = await loadCustomerById(safeCustomerId);
            if (directSnap) return directSnap;
        }

        const authIndexSnap = await db.ref("khachhang_auth_index/" + safeAuthUid).once("value");
        if (authIndexSnap.exists()) {
            const authIndexValue = authIndexSnap.val() || {};
            const indexedCustomerId = String(authIndexValue.customer_id || authIndexValue.customerId || "").trim();
            if (indexedCustomerId) {
                const indexedSnap = await loadCustomerById(indexedCustomerId);
                if (indexedSnap) return indexedSnap;
            }
        }

        return null;
    }

    service.resolveCustomerProfile = async function (authUser, options) {
        const opts = options || {};
        const safeAuthUser = authUser || await service.waitForAuthUser();
        if (!safeAuthUser) return null;

        const cached = service.getCachedCustomer();
        if (!opts.force && cached && String(cached.authUid || "") === String(safeAuthUser.uid || "")) {
            return cached;
        }

        const db = service.getPrimaryDb();
        let customerId = "";
        try {
            customerId = String(localStorage.getItem(STORAGE_KEYS.customerId) || "").trim();
        } catch (error) {}

        let customerSnapshot = await resolveCustomerSnapshotByAuth(db, safeAuthUser.uid, customerId);

        if (!customerSnapshot || !customerSnapshot.exists()) {
            return null;
        }

        let resolvedProfile = null;
        if (customerSnapshot.key && customerSnapshot.key !== "khachhang") {
            resolvedProfile = normalizeCloudCustomer(customerSnapshot.key, customerSnapshot.val(), safeAuthUser);
        } else {
            customerSnapshot.forEach(function (childSnapshot) {
                if (resolvedProfile) return true;
                resolvedProfile = normalizeCloudCustomer(childSnapshot.key, childSnapshot.val(), safeAuthUser);
                return true;
            });
        }

        if (resolvedProfile) service.saveCachedCustomer(resolvedProfile);
        return resolvedProfile;
    };

    service.ensureCustomerProfile = async function (seedProfile) {
        const authUser = await service.waitForAuthUser();
        if (!authUser) return null;

        const existing = await service.resolveCustomerProfile(authUser, { force: true });
        if (existing) return existing;

        const seed = seedProfile || {};
        return service.persistCustomerProfile({
            customerId: "",
            authUid: authUser.uid,
            name: String(seed.name || authUser.displayName || "Truong An"),
            email: String(seed.email || authUser.email || "").trim() || buildFallbackEmail(seed.phone || "", authUser),
            phone: String(seed.phone || "").trim(),
            address: String(seed.address || "").trim(),
            addresses: ensureAddressList(seed.addresses, seed.address, "", seed.shippingPhone || seed.phone),
            shippingPhone: String(seed.shippingPhone || seed.phone || "").trim(),
            avatar: "",
            facebook: "",
            group: "Khach le tu web",
            status: "online",
            bio: "An tam chon do tot cho be moi ngay.",
            gender: "Chua cap nhat",
            birthday: "",
            personalInfo: "Thiet lap ngay",
            orders: [],
            totalOrders: 0,
            totalBuy: 0,
            totalDebt: 0,
            paidDebt: 0,
            payments: [],
            updatedTs: Date.now()
        }, { authUser: authUser });
    };

    service.bootstrapSession = async function () {
        if (service.sessionBootPromise) return service.sessionBootPromise;

        service.sessionBootPromise = (async function () {
            await service.ensureReady();
            const authUser = await service.waitForAuthUser();
            if (!authUser || authUser.isAnonymous) return { user: null, profile: null };

            let profile = await service.resolveCustomerProfile(authUser, { force: false });
            if (!profile) profile = await service.ensureCustomerProfile({
                name: authUser.displayName || "",
                email: authUser.email || ""
            });

            return {
                user: authUser,
                profile: profile
            };
        })();

        return service.sessionBootPromise.finally(function () {
            service.sessionBootPromise = null;
        });
    };

    service.persistCustomerProfile = async function (profileData, options) {
        await service.ensureReady();
        const authUser = (options && options.authUser) || await service.waitForAuthUser();
        if (!authUser) throw new Error("not-authenticated");

        const existing = await service.resolveCustomerProfile(authUser, { force: true });
        const merged = Object.assign({}, existing || {}, profileData || {});
        const customerId = String(merged.customerId || merged.id || "").trim() || ("KHW" + String(Date.now()).slice(-9));
        const email = String(merged.email || "").trim() || buildFallbackEmail(merged.phone, authUser);
        const safeProfile = Object.assign({}, merged, {
            customerId: customerId,
            authUid: authUser.uid,
            email: email,
            group: String(merged.group || "Khach le tu web").trim(),
            status: normalizeCustomerStatus(merged.status || "online"),
            bio: String(merged.bio || (existing && existing.bio) || "An tam chon do tot cho be moi ngay.").trim(),
            gender: String(merged.gender || (existing && existing.gender) || "Chua cap nhat").trim(),
            birthday: String(merged.birthday || (existing && existing.birthday) || "").trim(),
            personalInfo: String(merged.personalInfo || (existing && existing.personalInfo) || "Thiet lap ngay").trim(),
            avatar: String(merged.avatar || (existing && existing.avatar) || "").trim(),
            facebook: String(merged.facebook || (existing && existing.facebook) || "").trim(),
            totalDebt: Number(merged.totalDebt || 0) || 0,
            paidDebt: Number(merged.paidDebt || 0) || 0,
            totalOrders: Number(merged.totalOrders || 0) || 0,
            totalBuy: Number(merged.totalBuy || 0) || 0,
            payments: Array.isArray(merged.payments) ? merged.payments : [],
            addresses: ensureAddressList(merged.addresses, merged.address, customerId, merged.shippingPhone || merged.phone),
            shippingPhone: String(merged.shippingPhone || (existing && existing.shippingPhone) || merged.phone || "").trim()
        });
        const customerPayload = buildCustomerWritePayload(customerId, authUser.uid, safeProfile, {
            updatedTs: Number((options && options.updatedTs) || safeProfile.updatedTs || Date.now()) || Date.now(),
            includeFinance: !!(options && options.includeFinance),
            includeSecurity: typeof (options && options.includeSecurity) === "boolean"
                ? !!options.includeSecurity
                : !(existing && existing.customerId)
        });
        const primaryDb = service.getPrimaryDb();
        await primaryDb.ref().update(customerPayload.updates);
        service.saveCachedCustomer(customerPayload.profile);
        return customerPayload.profile;
    };

    service.ensureCheckoutAuthUser = async function () {
        await service.ensureReady();
        const auth = service.getAuth();
        if (!auth) return null;
        if (auth.currentUser) return auth.currentUser;
        if (typeof auth.signInAnonymously !== "function") return null;
        const credential = await auth.signInAnonymously();
        return (credential && credential.user) || auth.currentUser || null;
    };

    service.registerCustomer = async function (payload) {
        const data = payload || {};
        await service.ensureReady();
        const auth = service.getAuth();
        if (auth && auth.currentUser && auth.currentUser.isAnonymous) {
            try { await auth.signOut(); } catch (error) {}
        }
        const safeName = String(data.name || "").trim();
        const safeEmail = String(data.email || "").trim().toLowerCase();
        const safePhone = String(data.phone || "").trim();
        const safeAddress = String(data.address || "").trim();
        const safePassword = String(data.password || "");

        if (!safeName || !safePhone || !safePassword) {
            throw new Error("missing-register-fields");
        }

        const loginEmail = safeEmail || buildPhoneAlias(safePhone);
        let credential = null;
        try {
            credential = await auth.createUserWithEmailAndPassword(loginEmail, safePassword);
            rememberLoginEmail(loginEmail);
            rememberPhoneLogin(safePhone, loginEmail);
            const profile = await service.persistCustomerProfile({
                name: safeName,
                email: safeEmail || loginEmail,
                phone: safePhone,
                shippingPhone: safePhone,
                address: safeAddress,
                addresses: ensureAddressList([], safeAddress, "", safePhone),
                status: "online",
                updatedTs: Date.now()
            }, {
                authUser: credential.user,
                updatedTs: Date.now(),
                includeSecurity: true
            });
            return {
                authUser: credential.user,
                profile: profile
            };
        } catch (error) {
            const rawMessage = String((error && (error.code || error.message)) || "").toLowerCase();
            if (credential && credential.user && (rawMessage.indexOf("permission") >= 0 || rawMessage.indexOf("denied") >= 0)) {
                const fallbackProfile = buildLocalFallbackProfile({
                    name: safeName,
                    email: safeEmail || loginEmail,
                    phone: safePhone,
                    shippingPhone: safePhone,
                    address: safeAddress,
                    addresses: ensureAddressList([], safeAddress, "", safePhone),
                    status: "online",
                    updatedTs: Date.now()
                }, credential.user);
                service.saveCachedCustomer(fallbackProfile);
                return {
                    authUser: credential.user,
                    profile: fallbackProfile,
                    pendingProfileSync: true
                };
            }
            if (credential && credential.user && typeof credential.user.delete === "function") {
                try {
                    await credential.user.delete();
                } catch (deleteError) {}
            }
            throw error;
        }
    };

    service.loginCustomer = async function (identifier, password) {
        await service.ensureReady();
        const auth = service.getAuth();
        if (auth && auth.currentUser && auth.currentUser.isAnonymous) {
            try { await auth.signOut(); } catch (error) {}
        }
        const safeIdentifier = String(identifier || "").trim().toLowerCase();
        const safePassword = String(password || "");
        if (!safeIdentifier || !safePassword) throw new Error("missing-login-fields");

        const candidates = [];
        if (safeIdentifier.indexOf("@") > -1) {
            candidates.push(safeIdentifier);
        } else {
            const phoneAlias = buildPhoneAlias(safeIdentifier);
            if (phoneAlias) candidates.push(phoneAlias);
            const mappedLoginEmail = readPhoneLoginEmail(safeIdentifier);
            if (mappedLoginEmail) candidates.push(mappedLoginEmail);
            const rememberedEmail = readRememberedLoginEmail();
            if (rememberedEmail) candidates.push(rememberedEmail);
        }

        if (!candidates.length) candidates.push(safeIdentifier);

        let lastError = null;
        let credential = null;
        for (let i = 0; i < candidates.length; i += 1) {
            try {
                credential = await auth.signInWithEmailAndPassword(candidates[i], safePassword);
                rememberLoginEmail(candidates[i]);
                break;
            } catch (error) {
                lastError = error;
            }
        }

        if (!credential) throw lastError || new Error("login-failed");

        let profile = await service.resolveCustomerProfile(credential.user, { force: true });
        if (!profile) {
            try {
                profile = await service.ensureCustomerProfile({
                    name: credential.user.displayName || "",
                    email: credential.user.email || "",
                    phone: sanitizeDigits(safeIdentifier),
                    shippingPhone: sanitizeDigits(safeIdentifier)
                });
            } catch (error) {
                const rawMessage = String((error && (error.code || error.message)) || "").toLowerCase();
                if (rawMessage.indexOf("permission") === -1 && rawMessage.indexOf("denied") === -1) throw error;
                profile = buildLocalFallbackProfile({
                    name: credential.user.displayName || "",
                    email: credential.user.email || "",
                    phone: sanitizeDigits(safeIdentifier),
                    shippingPhone: sanitizeDigits(safeIdentifier),
                    updatedTs: Date.now()
                }, credential.user);
                service.saveCachedCustomer(profile);
            }
        } else if (sanitizeDigits(safeIdentifier) && (!profile.phone || !profile.shippingPhone)) {
            profile = await service.persistCustomerProfile(Object.assign({}, profile, {
                phone: profile.phone || sanitizeDigits(safeIdentifier),
                shippingPhone: profile.shippingPhone || sanitizeDigits(safeIdentifier)
            }), { authUser: credential.user, updatedTs: Date.now() });
        }
        if (profile && profile.phone) rememberPhoneLogin(profile.phone, (credential.user && credential.user.email) || profile.email);

        return {
            authUser: credential.user,
            profile: profile
        };
    };

    service.requestPasswordReset = async function (identifier) {
        await service.ensureReady();
        const safeIdentifier = String(identifier || "").trim().toLowerCase();
        if (!safeIdentifier) throw new Error("missing-reset-identifier");
        if (safeIdentifier.indexOf("@") < 0 || isPhoneAliasEmail(safeIdentifier)) {
            return { mode: "zalo", loginEmail: buildPhoneAlias(safeIdentifier), supportPhone: window.PASSWORD_RESET_ZALO_PHONE || window.STORE_ZALO_PHONE || window.STORE_CONTACT_PHONE || "" };
        }
        await service.getAuth().sendPasswordResetEmail(safeIdentifier);
        return { mode: "email", email: safeIdentifier };
    };

    service.changePassword = async function (currentPassword, nextPassword) {
        await service.ensureReady();
        const authUser = await service.waitForAuthUser();
        if (!authUser || !authUser.email) throw new Error("not-authenticated");
        const safeCurrentPassword = String(currentPassword || "");
        const safeNextPassword = String(nextPassword || "");
        if (!safeCurrentPassword || !safeNextPassword) throw new Error("missing-password-fields");
        if (safeNextPassword.length < 6) throw new Error("weak-password");
        const credential = firebase.auth.EmailAuthProvider.credential(authUser.email, safeCurrentPassword);
        await authUser.reauthenticateWithCredential(credential);
        await authUser.updatePassword(safeNextPassword);
        return true;
    };

    service.logout = async function () {
        await service.ensureReady();
        try {
            await service.getAuth().signOut();
        } finally {
            try { localStorage.removeItem(STORAGE_KEYS.profile); } catch (error) {}
            try { localStorage.removeItem(STORAGE_KEYS.orders); } catch (error) {}
        }
    };

    service.updateCurrentCustomerProfile = async function (nextProfile) {
        await service.ensureReady();
        const authUser = await service.waitForAuthUser();
        if (!authUser) throw new Error("not-authenticated");

        const existing = await service.resolveCustomerProfile(authUser, { force: true }) || await service.ensureCustomerProfile({
            email: authUser.email || ""
        });

        const merged = Object.assign({}, existing || {}, nextProfile || {});
        const addresses = Array.isArray(merged.addresses) ? merged.addresses : [];
        const defaultAddress = addresses.find(function (address) {
            return !!(address && address.isDefault);
        });
        merged.address = defaultAddress ? String(defaultAddress.text || "") : String(merged.address || "");
        merged.updatedTs = Date.now();
        return service.persistCustomerProfile(merged, { authUser: authUser, updatedTs: merged.updatedTs });
    };

    service.getCachedOrders = function () {
        return readStorage(STORAGE_KEYS.orders, null);
    };

    service.saveCachedOrders = function (authUid, orders) {
        const safePayload = {
            authUid: authUid,
            orders: Array.isArray(orders) ? orders : [],
            savedAt: Date.now()
        };
        writeStorage(STORAGE_KEYS.orders, safePayload);
        return safePayload.orders;
    };

    service.loadOrders = async function (options) {
        const opts = options || {};
        await service.ensureReady();
        const authUser = await service.waitForAuthUser();
        if (!authUser) return [];

        const cached = service.getCachedOrders();
        if (!opts.force && cached && String(cached.authUid || "") === String(authUser.uid) && Array.isArray(cached.orders)) {
            return cached.orders;
        }

        const snapshot = await service.getPrimaryDb().ref("donhang/" + authUser.uid).orderByChild("in4/ts").limitToLast(Math.max(Number(opts.limit || DEFAULT_ORDER_LIMIT) || DEFAULT_ORDER_LIMIT, 10)).once("value");
        const orders = [];
        snapshot.forEach(function (childSnapshot) {
            orders.push(normalizeOrderSummary(childSnapshot.key, childSnapshot.val()));
        });

        orders.sort(function (a, b) {
            return (Number(b.sortTs || 0) || 0) - (Number(a.sortTs || 0) || 0);
        });

        service.saveCachedOrders(authUser.uid, orders);
        return orders;
    };

    service.loadOrderDetail = async function (orderId) {
        await service.ensureReady();
        const authUser = await service.waitForAuthUser();
        if (!authUser || !orderId) return null;

        const cachedOrders = service.getCachedOrders();
        const cachedOrder = cachedOrders && Array.isArray(cachedOrders.orders)
            ? cachedOrders.orders.find(function (order) { return String((order && order.id) || "") === String(orderId); })
            : null;
        const ownerUid = String((cachedOrder && (cachedOrder.ownerUid || cachedOrder.customerAuthUid)) || authUser.uid || "").trim();
        const snapshot = await service.getPrimaryDb().ref("donhang/" + ownerUid + "/" + orderId + "/ch_t").once("value");
        if (!snapshot.exists()) return null;
        const detail = unminifyData(snapshot.val() || {});
        const items = Array.isArray(detail.items) ? detail.items.map(function (item) {
            return normalizeOrderItem(item);
        }) : [];
        return {
            id: orderId,
            ownerUid: ownerUid,
            note: String(detail.note || "").trim(),
            items: items
        };
    };

    service.cancelOrder = async function (orderId) {
        await service.ensureReady();
        const authUser = await service.waitForAuthUser();
        if (!authUser || !orderId) throw new Error("not-authenticated");

        const orderRef = service.getPrimaryDb().ref("donhang/" + authUser.uid + "/" + orderId + "/in4");
        const snapshot = await orderRef.once("value");
        if (!snapshot.exists()) throw new Error("order-not-found");

        const rawInfo = unminifyData(snapshot.val() || {});
        const rawStatus = Number(rawInfo.status || rawInfo.st || 0) || 0;
        if (rawStatus !== 1) throw new Error("order-not-cancellable");
        if (String(rawInfo.owner_uid || rawInfo.ou || "").trim() !== String(authUser.uid || "").trim()) {
            throw new Error("permission-denied");
        }
        if (String(rawInfo.customer_auth_uid || rawInfo.cau || "").trim() !== String(authUser.uid || "").trim()) {
            throw new Error("permission-denied");
        }

        const nextInfo = Object.assign({}, rawInfo, {
            status: 5,
            last_update: new Date().toLocaleString("vi-VN")
        });
        await orderRef.set(minifyData(nextInfo));

        const cached = service.getCachedOrders();
        let updatedOrder = normalizeOrderSummary(orderId, { in4: minifyData(nextInfo) });
        if (cached && Array.isArray(cached.orders)) {
            const nextOrders = cached.orders.map(function (order) {
                if (String((order && order.id) || "") !== String(orderId)) return order;
                return Object.assign({}, order, {
                    status: normalizeOrderStatus(5),
                    rawStatus: 5
                });
            });
            service.saveCachedOrders(authUser.uid, nextOrders);
            updatedOrder = nextOrders.find(function (order) {
                return String((order && order.id) || "") === String(orderId);
            }) || updatedOrder;
        }

        return updatedOrder;
    };

    service.submitOrder = async function (payload) {
        const data = payload || {};
        await service.ensureReady();
        const authUser = await service.ensureCheckoutAuthUser();
        if (!authUser) throw new Error("not-authenticated");
        const hasCatalogAccess = await service.ensureCatalogAccess().catch(function () {
            return false;
        });

        let profile = await service.resolveCustomerProfile(authUser, { force: true });
        if (!profile) {
            try {
                profile = await service.ensureCustomerProfile({
                    name: data.customerName || authUser.displayName || "",
                    email: data.email || authUser.email || "",
                    phone: data.phone || "",
                    address: data.address || ""
                });
            } catch (error) {
                const rawMessage = String((error && (error.code || error.message)) || "").toLowerCase();
                if (rawMessage.indexOf("permission") === -1 && rawMessage.indexOf("denied") === -1) throw error;
                profile = buildLocalFallbackProfile({
                    customerId: readStorage(STORAGE_KEYS.customerId, "") || ("KHW" + String(Date.now()).slice(-9)),
                    authUid: authUser.uid,
                    name: data.customerName || authUser.displayName || "",
                    email: data.email || authUser.email || buildFallbackEmail(data.phone || "", authUser),
                    phone: data.phone || "",
                    shippingPhone: data.phone || "",
                    address: data.address || "",
                    addresses: ensureAddressList([], data.address || "", "", data.phone || ""),
                    updatedTs: Date.now()
                }, authUser);
                service.saveCachedCustomer(profile);
            }
        }
        if (!profile || !profile.customerId) throw new Error("customer-profile-missing");

        const rawItems = Array.isArray(data.items) ? data.items : [];
        if (!rawItems.length) throw new Error("empty-cart");

        const now = new Date();
        const sortTs = Date.now();
        const orderId = "DH" + String(sortTs).slice(-10);
        const isAnonymousOrder = !!authUser.isAnonymous;
        const safeName = String(data.customerName || profile.name || "Khach le web").trim();
        const safePhone = String(data.phone || profile.phone || "").trim();
        const safeAddress = String(data.address || profile.address || "").trim();
        const safeEmail = String(data.email || profile.email || buildFallbackEmail(safePhone, authUser)).trim();
        const safeNote = String(data.note || "").trim();
        const subtotal = Number(data.totalAmount || 0) || 0;
        const discountPercent = Number(data.discountPercent || 0) || 0;
        const discountValue = Number(data.discountValue || 0) || 0;
        const finalAmount = Number(data.finalAmount || subtotal) || 0;
        const paidAmount = Number(data.paidAmount || 0) || 0;
        const debtAmount = Math.max(finalAmount - paidAmount, 0);
        const oldDebt = Number(profile.totalDebt || 0) || 0;
        const nextDebt = oldDebt + debtAmount;
        const dateText = now.toLocaleString("vi-VN");
        const items = rawItems.map(function (item) {
            const quantity = Number(item.quantity || item.qty || 1) || 1;
            const priceValue = parseMoney(item.priceValue || item.price || 0);
            return {
                id: String(item.id || item.rootId || "").trim(),
                rootId: String(item.id || item.rootId || "").trim(),
                code: String(item.code || "").trim(),
                name: String(item.name || "San pham").trim(),
                qty: quantity,
                price: priceValue,
                unit: String(item.unit || "").trim(),
                img: String(item.img || "").trim(),
                discount: 0,
                discountType: "%",
                variantInfo: String(item.variantInfo || "").trim()
            };
        });

        const orderInfo = {
            id: orderId,
            date: dateText,
            sort_ts: sortTs,
            last_update: dateText,
            note: safeNote || "Don hang tu web",
            status: 1,
            customer_id: profile.customerId,
            customer_name: safeName,
            customer_auth_uid: authUser.uid,
            owner_uid: authUser.uid,
            phone: safePhone,
            subtotal: subtotal,
            discount: discountValue,
            discount_value: discountValue,
            discount_percent: discountPercent,
            shipping_fee: Number(data.shippingFee || 0) || 0,
            shipping_payer: String(data.shippingPayer || "shop").trim(),
            vat_rate: Number(data.vatRate || 0) || 0,
            total_amount: finalAmount,
            paid_amount: paidAmount,
            debt: debtAmount,
            old_debt: oldDebt,
            debt_before: oldDebt,
            debt_after: nextDebt,
            source: isAnonymousOrder ? "Web le guest" : "Web le",
            shipping_info: safeAddress,
            payment_method: String(data.paymentMethod || "pending").trim(),
            carrier: "web_le",
            creator: isAnonymousOrder ? "Khach guest web" : "Khach tu web",
            price_type: String(data.priceType || "gia_si_web").trim(),
            hour: now.getHours()
        };
        const orderDetail = {
            items: items,
            note: safeNote || "Don dat tu web"
        };

        const nextProfile = await service.persistCustomerProfile(Object.assign({}, profile, {
            name: safeName,
            phone: safePhone,
            email: safeEmail,
            address: safeAddress || String(profile.address || "").trim(),
            addresses: ensureAddressList(profile.addresses, safeAddress || profile.address, profile.customerId),
            totalOrders: (Number(profile.totalOrders || 0) || 0) + 1,
            totalBuy: (Number(profile.totalBuy || 0) || 0) + finalAmount,
            totalDebt: nextDebt,
            paidDebt: Number(profile.paidDebt || 0) || 0,
            payments: Array.isArray(profile.payments) ? profile.payments : [],
            updatedTs: sortTs
        }), { authUser: authUser, updatedTs: sortTs });

        const orderBaseRef = service.getPrimaryDb().ref("donhang/" + authUser.uid + "/" + orderId);
        await orderBaseRef.child("in4").set(minifyData(orderInfo));
        await orderBaseRef.child("ch_t").set(minifyData(orderDetail));

        const summary = normalizeOrderSummary(orderId, {
            in4: minifyData(orderInfo),
            ch_t: minifyData(orderDetail)
        });
        const cachedOrders = service.getCachedOrders();
        const nextOrders = cachedOrders && Array.isArray(cachedOrders.orders)
            ? cachedOrders.orders.filter(function (order) { return String((order && order.id) || "") !== orderId; })
            : [];
        nextOrders.unshift(summary);
        nextOrders.sort(function (a, b) {
            return (Number(b.sortTs || 0) || 0) - (Number(a.sortTs || 0) || 0);
        });
        service.saveCachedOrders(authUser.uid, nextOrders);

        return {
            id: orderId,
            summary: summary,
            detail: {
                id: orderId,
                ownerUid: authUser.uid,
                note: orderDetail.note,
                items: items.map(function (item) { return normalizeOrderItem(item); })
            }
        };
    };

    service.submitOrder = async function (payload) {
        const data = payload || {};
        await service.ensureReady();
        const authUser = await service.ensureCheckoutAuthUser();
        if (!authUser) throw new Error("not-authenticated");
        const hasCatalogAccess = await service.ensureCatalogAccess().catch(function () {
            return false;
        });

        let profile = null;
        try {
            profile = await service.resolveCustomerProfile(authUser, { force: true });
        } catch (error) {
            profile = null;
        }

        if (!profile) {
            profile = await service.ensureCustomerProfile({
                name: data.customerName || authUser.displayName || "",
                email: data.email || authUser.email || "",
                phone: data.phone || "",
                address: data.address || ""
            });
        }

        const rawItems = Array.isArray(data.items) ? data.items : [];
        if (!rawItems.length) throw new Error("empty-cart");

        const now = new Date();
        const sortTs = Date.now();
        const orderId = "DH" + String(sortTs).slice(-10);
        const isAnonymousOrder = !!authUser.isAnonymous;
        const fallbackCustomerId = String((profile && profile.customerId) || readStorage(STORAGE_KEYS.customerId, "") || ("KHW" + String(sortTs).slice(-9))).trim();
        const safeName = String(data.customerName || (profile && profile.name) || "Khach le web").trim();
        const safePhone = String(data.phone || (profile && profile.shippingPhone) || (profile && profile.phone) || "").trim();
        const safeAddress = String(data.address || (profile && profile.address) || "").trim();
        const safeEmail = String(data.email || (profile && profile.email) || buildFallbackEmail(safePhone, authUser)).trim();
        const safeNote = String(data.note || "").trim();
        const subtotal = Number(data.totalAmount || 0) || 0;
        const discountPercent = Number(data.discountPercent || 0) || 0;
        const discountValue = Number(data.discountValue || 0) || 0;
        const finalAmount = Number(data.finalAmount || subtotal) || 0;
        const paidAmount = Number(data.paidAmount || 0) || 0;
        const oldDebt = Number((profile && profile.totalDebt) || 0) || 0;
        const debtAmount = Math.max(finalAmount - paidAmount, 0);
        const nextDebt = oldDebt + debtAmount;
        const dateText = now.toLocaleString("vi-VN");
        const items = rawItems.map(function (item) {
            const quantity = Number(item.quantity || item.qty || 1) || 1;
            const priceValue = parseMoney(item.priceValue || item.price || 0);
            return {
                id: String(item.id || item.rootId || "").trim(),
                rootId: String(item.id || item.rootId || "").trim(),
                code: String(item.code || "").trim(),
                name: String(item.name || "San pham").trim(),
                qty: quantity,
                price: priceValue,
                unit: String(item.unit || "").trim(),
                img: String(item.img || "").trim(),
                discount: 0,
                discountType: "%",
                variantInfo: String(item.variantInfo || "").trim()
            };
        });

        const orderInfo = {
            id: orderId,
            date: dateText,
            sort_ts: sortTs,
            last_update: dateText,
            note: safeNote || "Don hang tu web",
            status: 1,
            customer_id: fallbackCustomerId,
            customer_name: safeName,
            customer_auth_uid: authUser.uid,
            owner_uid: authUser.uid,
            phone: safePhone,
            subtotal: subtotal,
            discount: discountValue,
            discount_value: discountValue,
            discount_percent: discountPercent,
            shipping_fee: Number(data.shippingFee || 0) || 0,
            shipping_payer: String(data.shippingPayer || "shop").trim(),
            vat_rate: Number(data.vatRate || 0) || 0,
            total_amount: finalAmount,
            paid_amount: paidAmount,
            debt: debtAmount,
            old_debt: oldDebt,
            debt_before: oldDebt,
            debt_after: nextDebt,
            source: isAnonymousOrder ? "Web le guest" : "Web le",
            shipping_info: safeAddress,
            payment_method: String(data.paymentMethod || "pending").trim(),
            carrier: "web_le",
            creator: isAnonymousOrder ? "Khach guest web" : "Khach tu web",
            price_type: String(data.priceType || "gia_si_web").trim(),
            hour: now.getHours()
        };
        const orderDetail = {
            items: items,
            note: safeNote || "Don dat tu web"
        };

        const orderBaseRef = service.getPrimaryDb().ref("donhang/" + authUser.uid + "/" + orderId);
        await orderBaseRef.child("in4").set(minifyData(orderInfo));
        await orderBaseRef.child("ch_t").set(minifyData(orderDetail));
        await Promise.all(items.map(async function (item) {
            const productId = String(item.rootId || item.id || "").trim();
            const qty = Math.max(Number(item.qty || 1) || 0, 0);
            if (!productId || !qty) return null;

            const dbCandidates = [];
            if (hasCatalogAccess && service.getCatalogDb()) dbCandidates.push(service.getCatalogDb());
            if (service.getPrimaryDb() && dbCandidates.indexOf(service.getPrimaryDb()) === -1) {
                dbCandidates.push(service.getPrimaryDb());
            }

            let lastError = null;
            for (let index = 0; index < dbCandidates.length; index += 1) {
                const db = dbCandidates[index];
                if (!db || typeof db.ref !== "function") continue;
                try {
                    const txResult = await db.ref("sanpham/" + productId + "/co_kh").transaction(function (currentData) {
                        const nextData = currentData && typeof currentData === "object" ? Object.assign({}, currentData) : {};
                        nextData.dd = (Number(nextData.dd || 0) || 0) + qty;
                        nextData.updated_ts = Math.max(Number(nextData.updated_ts || 0) || 0, sortTs);
                        return nextData;
                    });
                    if (txResult && txResult.committed !== false) return txResult;
                } catch (error) {
                    lastError = error;
                }
            }

            if (lastError) {
                console.warn("Khong tang duoc dang_dat cho san pham:", productId, lastError);
            }
            return null;
        }));

        writeStorage(STORAGE_KEYS.customerId, fallbackCustomerId);
        applyPendingReservationToCatalog(items, sortTs);

        try {
            await service.persistCustomerProfile({
                customerId: fallbackCustomerId,
                authUid: authUser.uid,
                name: safeName,
                phone: String((profile && profile.phone) || safePhone).trim(),
                shippingPhone: safePhone,
                email: safeEmail,
                address: safeAddress,
                addresses: ensureAddressList((profile && profile.addresses) || [], safeAddress, fallbackCustomerId, safePhone),
                totalOrders: (Number((profile && profile.totalOrders) || 0) || 0) + 1,
                totalBuy: (Number((profile && profile.totalBuy) || 0) || 0) + finalAmount,
                totalDebt: nextDebt,
                paidDebt: Number((profile && profile.paidDebt) || 0) || 0,
                payments: Array.isArray(profile && profile.payments) ? profile.payments : [],
                updatedTs: sortTs
            }, {
                authUser: authUser,
                updatedTs: sortTs,
                includeSecurity: !(profile && profile.customerId)
            });
        } catch (error) {
            console.warn("Customer profile sync after order failed:", error);
        }

        const summary = normalizeOrderSummary(orderId, {
            in4: minifyData(orderInfo),
            ch_t: minifyData(orderDetail)
        });
        const cachedOrders = service.getCachedOrders();
        const nextOrders = cachedOrders && Array.isArray(cachedOrders.orders)
            ? cachedOrders.orders.filter(function (order) { return String((order && order.id) || "") !== orderId; })
            : [];
        nextOrders.unshift(summary);
        nextOrders.sort(function (a, b) {
            return (Number(b.sortTs || 0) || 0) - (Number(a.sortTs || 0) || 0);
        });
        service.saveCachedOrders(authUser.uid, nextOrders);

        return {
            id: orderId,
            summary: summary,
            detail: {
                id: orderId,
                ownerUid: authUser.uid,
                note: orderDetail.note,
                items: items.map(function (item) { return normalizeOrderItem(item); })
            }
        };
    };

    service.buildPhoneAlias = buildPhoneAlias;
    service.isPhoneAliasEmail = isPhoneAliasEmail;
    service.customerPhoneDomain = CUSTOMER_PHONE_DOMAIN;
    window.retailFirebase = service;
})();
