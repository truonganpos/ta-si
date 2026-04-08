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
    const DEFAULT_CATALOG_SHARD_CONFIGS = [
        {
            label: "Catalog 1",
            appName: "RetailCatalog",
            config: FIREBASE_CATALOG_CONFIG
        }
    ];
    const PRODUCT_DETAIL_GAS_URL = "https://script.google.com/macros/s/AKfycbyYGE5lb_Ag6pEa9YT8C31tbk4-lCMu0brWzhqbYo-F3gybmQnRn6Lw8KSFTKGji69Urg/exec";
    const PRODUCT_DETAIL_SHEET_ID = "1sQtuh32Leh3SKB2k3l4D3vXUQyZSMCYdWlaqB-i2DLM";
    const PRODUCT_DETAIL_SHEET_NAME = "Product_Details";
    const PRODUCT_DETAIL_CACHE_TTL = 60 * 1000;

    const STORAGE_KEYS = {
        catalog: "ta_catalog_cache_v6",
        productDetails: "ta_product_detail_sheet_v1",
        profile: "ta_customer_profile_v2",
        orders: "ta_orders_cache_v2",
        loginEmail: "ta_last_login_email_v1",
        customerId: "ta_customer_id_v1",
        phoneLoginMap: "ta_phone_login_map_v1"
    };
    const productDetailState = {
        lookup: {},
        promise: null,
        loadedAt: 0
    };

    const CUSTOMER_PHONE_DOMAIN = String(window.CUSTOMER_PHONE_DOMAIN || "truongan.com").replace(/^@+/, "").trim().toLowerCase();
    const DEFAULT_WEB_CUSTOMER_GROUP = String(window.DEFAULT_WEB_CUSTOMER_GROUP || "Khách sỉ từ web").trim() || "Khách sỉ từ web";
    const DEFAULT_WEB_GUEST_NAME = String(window.DEFAULT_WEB_GUEST_NAME || "Khach si web").trim() || "Khach si web";
    const DEFAULT_WEB_ORDER_SOURCE = String(window.DEFAULT_WEB_ORDER_SOURCE || "Web si").trim() || "Web si";
    const DEFAULT_WEB_ORDER_SOURCE_GUEST = String(window.DEFAULT_WEB_ORDER_SOURCE_GUEST || "Web si guest").trim() || "Web si guest";
    const DEFAULT_WEB_ORDER_CREATOR = String(window.DEFAULT_WEB_ORDER_CREATOR || "Khach si web").trim() || "Khach si web";
    const DEFAULT_WEB_ORDER_CREATOR_GUEST = String(window.DEFAULT_WEB_ORDER_CREATOR_GUEST || "Khach si guest web").trim() || "Khach si guest web";
    const DEFAULT_PAGE_SIZE = 24;
    const DEFAULT_ORDER_LIMIT = 30;
    const LIVE_ORDER_SUMMARY_LIMIT = 40;

    const keyMapObj = {
        id: "i", name: "n", price: "p", stock: "s", date: "d", note: "nt", status: "st", barcode: "b",
        kho: "k", gia_ban_le: "gl", gia_si: "gs", si_tu: "su", gia_goc: "gg", km_phan_tram: "km", vat: "v",
        ton_kho: "tk", dang_dat: "dd", link_anh: "im", cap_nhat_cuoi: "cu", ngay_tao: "nta", variants: "vr",
        starred: "sr", tags: "tg", group: "gr", don_vi_tinh: "dv", unit: "u", ai_hint: "ah", mo_ta: "mt", customer_id: "ci", customer_name: "cn", total_amount: "ta",
        subtotal: "sb", discount_percent: "dp", vat_rate: "vtr", shipping_fee: "sf", shipping_payer: "sp",
        creator: "cr", paid_amount: "pa", debt: "db", source: "sc", shipping_info: "si", payment_method: "pm",
        carrier: "ca", tracking_code: "tc", last_update: "lu", items: "it", qty: "q", discount: "dc",
        phone: "ph", email: "em", address: "ad", fb: "fb", avatar: "av", pass: "pw", token: "tkc", payments: "py", gender: "gt", birthday: "ns", zalo: "z",
        total_debt: "td", paid_debt: "pd", total_orders: "to", total_buy: "tb", amount: "am", sort_ts: "ts",
        auth_uid: "au", customer_auth_uid: "cau", owner_uid: "ou"
    };

    const reverseKeyMap = {};
    Object.keys(keyMapObj).forEach(function (key) {
        reverseKeyMap[keyMapObj[key]] = key;
    });
    reverseKeyMap.dvt = "don_vi_tinh";
    reverseKeyMap.un = "unit";
    reverseKeyMap.mt = "mo_ta";
    reverseKeyMap.gd = "gender";
    reverseKeyMap.bdy = "birthday";
    reverseKeyMap.zl = "zalo";

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

    function sanitizeCatalogShardLinePart(value) {
        return String(value || "").trim();
    }

    function parseCatalogShardConfigText(rawText) {
        return String(rawText || "")
            .split(/\r?\n/)
            .map(function (line) { return line.trim(); })
            .filter(Boolean)
            .map(function (line, index) {
                const parts = line.split("|").map(sanitizeCatalogShardLinePart);
                if (parts.length < 8) return null;
                return {
                    label: parts[0] || ("Catalog " + String(index + 1)),
                    appName: "RetailCatalogShard" + String(index + 1),
                    config: {
                        apiKey: parts[1] || "",
                        authDomain: parts[2] || "",
                        databaseURL: parts[3] || "",
                        projectId: parts[4] || "",
                        storageBucket: parts[5] || "",
                        messagingSenderId: parts[6] || "",
                        appId: parts[7] || "",
                        measurementId: parts[8] || ""
                    }
                };
            })
            .filter(function (entry) {
                return entry && entry.config && entry.config.databaseURL && entry.config.apiKey && entry.config.projectId;
            });
    }

    function getCatalogShardEntriesFromSettings(rawSettings) {
        const settings = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
        const catalogStorage = settings.catalogStorage && typeof settings.catalogStorage === "object" ? settings.catalogStorage : {};
        const parsed = parseCatalogShardConfigText(catalogStorage.shardsText || "");
        const merged = DEFAULT_CATALOG_SHARD_CONFIGS.map(function (entry) {
            return {
                label: entry.label,
                appName: entry.appName,
                config: Object.assign({}, entry.config)
            };
        });
        parsed.forEach(function (entry) {
            const nextUrl = String(entry && entry.config && entry.config.databaseURL || "").trim();
            if (!nextUrl) return;
            const duplicated = merged.some(function (existingEntry) {
                return String(existingEntry && existingEntry.config && existingEntry.config.databaseURL || "").trim() === nextUrl;
            });
            if (!duplicated) merged.push(entry);
        });
        return merged.map(function (entry, index) {
            return {
                label: entry.label || ("Catalog " + String(index + 1)),
                appName: index === 0 ? "RetailCatalog" : ("RetailCatalogShard" + String(index + 1)),
                config: Object.assign({}, entry.config || {})
            };
        });
    }

    function getFirebaseConfigSignature(config) {
        const safeConfig = config && typeof config === "object" ? config : {};
        return [
            String(safeConfig.databaseURL || "").trim().toLowerCase(),
            String(safeConfig.apiKey || "").trim(),
            String(safeConfig.projectId || "").trim(),
            String(safeConfig.appId || "").trim(),
            String(safeConfig.authDomain || "").trim().toLowerCase()
        ].join("|");
    }

    function getFirebaseRuntimeAppName(appName, config) {
        const baseName = String(appName || "RetailCatalog").trim() || "RetailCatalog";
        const signature = getFirebaseConfigSignature(config) || "default";
        const safeSuffix = signature.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 48) || "default";
        return baseName + "_" + safeSuffix;
    }

    function getCatalogShardConfigSignature(entries) {
        return JSON.stringify((Array.isArray(entries) ? entries : []).map(function (entry) {
            const config = entry && entry.config ? entry.config : {};
            return {
                label: String(entry && entry.label || "").trim(),
                signature: getFirebaseConfigSignature(config)
            };
        }));
    }

    function getOrInitNamedFirebaseApp(appName, config) {
        const runtimeName = getFirebaseRuntimeAppName(appName, config);
        const signature = getFirebaseConfigSignature(config);
        if (firebase.apps && firebase.apps.length) {
            for (let index = 0; index < firebase.apps.length; index += 1) {
                const existingApp = firebase.apps[index];
                const existingSignature = String(existingApp.__tasConfigSignature || getFirebaseConfigSignature(existingApp.options || ""));
                if ((existingApp.name === runtimeName || existingApp.name === appName) && existingSignature === signature) {
                    existingApp.__tasConfigSignature = signature;
                    existingApp.__tasBaseName = String(appName || "").trim();
                    return existingApp;
                }
            }
        }
        const nextApp = firebase.initializeApp(config, runtimeName);
        nextApp.__tasConfigSignature = signature;
        nextApp.__tasBaseName = String(appName || "").trim();
        return nextApp;
    }

    function normalizeVariantSheetList(rawVariants) {
        let parsed = rawVariants;
        if (typeof parsed === "string") {
            const jsonParsed = safeParse(parsed, null);
            parsed = jsonParsed !== null ? jsonParsed : [];
        }
        if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
            parsed = Object.keys(parsed).map(function (key) { return parsed[key]; });
        }
        if (!Array.isArray(parsed)) return [];
        return parsed.map(function (variant) {
            const nextVariant = Object.assign({}, variant || {});
            const image = String((nextVariant.image || nextVariant.link_anh || nextVariant.img) || "").trim();
            if (image) {
                nextVariant.image = image;
                nextVariant.link_anh = image;
            }
            return nextVariant;
        }).filter(function (variant) {
            return variant && Object.keys(variant).length > 0;
        });
    }

    function getProductDetailSheetConfig() {
        const sharedSettings = readStorage("tas_sys_settings", {}) || {};
        const aiVision = sharedSettings.aiVision && typeof sharedSettings.aiVision === "object" ? sharedSettings.aiVision : {};
        const sheetConfigs = sharedSettings.sheetConfigs && typeof sharedSettings.sheetConfigs === "object" ? sharedSettings.sheetConfigs : {};
        const productSheetConfig = sheetConfigs.tas_product_sheet_export_config
            || sheetConfigs.tas_product_sheet_import_config
            || sheetConfigs.tas_product_sheet_config
            || {};
        return {
            gasUrl: String(window.TAS_PRODUCT_DETAIL_GAS_URL || window.TAS_GAS_URL || productSheetConfig.gasUrl || PRODUCT_DETAIL_GAS_URL).trim(),
            sheetId: String(window.TAS_PRODUCT_DETAIL_SHEET_ID || productSheetConfig.sheetId || aiVision.hashSheetId || PRODUCT_DETAIL_SHEET_ID).trim(),
            sheetName: String(window.TAS_PRODUCT_DETAIL_SHEET_NAME || PRODUCT_DETAIL_SHEET_NAME).trim() || PRODUCT_DETAIL_SHEET_NAME
        };
    }

    function parseProductDetailSheetRow(row) {
        const safeRow = row && typeof row === "object" ? row : {};
        const id = String(
            safeRow.ID
            || safeRow.Id
            || safeRow.id
            || safeRow["Mã SKU"]
            || safeRow["Ma SKU"]
            || safeRow.SKU
            || ""
        ).trim();
        if (!id) return null;
        const variantLinks = String(safeRow.VariantImageLinks || safeRow["Variant Image Links"] || "").split(/\r?\n+/).map(function (item) {
            return String(item || "").trim();
        }).filter(Boolean);
        let variants = normalizeVariantSheetList(safeRow.VariantsJSON || safeRow.VariantsJson || safeRow.Variants || safeRow["Variants JSON"] || []);
        if (variantLinks.length) {
            if (!variants.length) {
                variants = variantLinks.map(function (url, index) {
                    return { name: "Phan loai " + (index + 1), image: url, link_anh: url };
                });
            } else {
                variants = variants.map(function (variant, index) {
                    const nextVariant = Object.assign({}, variant || {});
                    const nextImage = String(variantLinks[index] || nextVariant.link_anh || nextVariant.image || "").trim();
                    if (nextImage) {
                        nextVariant.image = nextImage;
                        nextVariant.link_anh = nextImage;
                    }
                    return nextVariant;
                });
            }
        }
        return {
            id: id,
            mo_ta: String(safeRow.Description || safeRow["Mô Tả"] || safeRow["Mo Ta"] || safeRow.Desc || "").trim(),
            variants: variants
        };
    }

    function buildProductDetailLookup(rows) {
        const lookup = {};
        (Array.isArray(rows) ? rows : []).forEach(function (row) {
            const parsed = parseProductDetailSheetRow(row);
            if (!parsed || !parsed.id) return;
            lookup[parsed.id] = {
                mo_ta: parsed.mo_ta || "",
                variants: Array.isArray(parsed.variants) ? parsed.variants : []
            };
        });
        return lookup;
    }

    function getProductDetailById(productId) {
        const safeId = String(productId || "").trim();
        if (!safeId) return null;
        return (productDetailState.lookup && productDetailState.lookup[safeId]) || null;
    }

    function applyProductDetailSheetToCatalogProduct(product) {
        const safeProduct = product && typeof product === "object" ? Object.assign({}, product) : null;
        if (!safeProduct) return safeProduct;
        const detail = getProductDetailById(safeProduct.id);
        if (!detail) return safeProduct;
        if (String(detail.mo_ta || "").trim()) {
            const safeDesc = String(detail.mo_ta || "").trim();
            safeProduct.detail_desc = safeDesc;
            safeProduct.mo_ta = safeDesc;
            safeProduct.description = safeDesc;
            safeProduct.desc = buildCatalogMetaDesc(safeDesc, safeProduct.group || safeProduct.cat, safeProduct.tags || []);
        }
        if (Array.isArray(detail.variants) && detail.variants.length) {
            safeProduct.variants = normalizeVariants(detail.variants);
            safeProduct.variantOptions = safeProduct.variants;
        }
        return safeProduct;
    }

    function refreshCatalogCacheWithProductDetails() {
        const cached = getCatalogCache();
        if (!Array.isArray(cached.products) || !cached.products.length) return cached;
        const nextProducts = cached.products.map(function (product) {
            return applyProductDetailSheetToCatalogProduct(product);
        });
        return setCatalogCache(Object.assign({}, cached, { products: nextProducts }));
    }

    async function fetchProductDetailRows(force) {
        const safeForce = !!force;
        const cachedDetail = readStorage(STORAGE_KEYS.productDetails, null);
        if (!safeForce && cachedDetail && typeof cachedDetail === "object" && Array.isArray(cachedDetail.rows) && cachedDetail.rows.length && (Date.now() - Number(cachedDetail.savedAt || 0) < PRODUCT_DETAIL_CACHE_TTL)) {
            productDetailState.lookup = buildProductDetailLookup(cachedDetail.rows);
            productDetailState.loadedAt = Number(cachedDetail.savedAt || 0) || Date.now();
            return productDetailState.lookup;
        }

        const config = getProductDetailSheetConfig();
        if (!config.gasUrl) return productDetailState.lookup || {};
        const url = new URL(config.gasUrl);
        url.searchParams.set("action", "get_product_detail_sheet");
        if (config.sheetId) url.searchParams.set("sheet_id", config.sheetId);
        url.searchParams.set("sheet_name", config.sheetName || PRODUCT_DETAIL_SHEET_NAME);

        const response = await fetch(url.toString(), { method: "GET" });
        const text = await response.text();
        let payload = {};
        try {
            payload = text ? JSON.parse(text) : {};
        } catch (error) {
            throw new Error("product-detail-sheet-json-invalid");
        }
        if (!response.ok || payload.status !== "success") {
            throw new Error(String(payload.message || "product-detail-sheet-fetch-failed"));
        }
        const rows = Array.isArray(payload.data) ? payload.data : [];
        writeStorage(STORAGE_KEYS.productDetails, {
            savedAt: Date.now(),
            rows: rows
        });
        productDetailState.lookup = buildProductDetailLookup(rows);
        productDetailState.loadedAt = Date.now();
        return productDetailState.lookup;
    }

    async function ensureProductDetailSheet(force) {
        const safeForce = !!force;
        if (!safeForce && productDetailState.loadedAt && (Date.now() - productDetailState.loadedAt) < PRODUCT_DETAIL_CACHE_TTL && productDetailState.lookup && Object.keys(productDetailState.lookup).length) {
            return productDetailState.lookup;
        }
        if (productDetailState.promise) return productDetailState.promise;
        productDetailState.promise = fetchProductDetailRows(safeForce).catch(function () {
            const cachedDetail = readStorage(STORAGE_KEYS.productDetails, null);
            productDetailState.lookup = buildProductDetailLookup((cachedDetail && cachedDetail.rows) || []);
            return productDetailState.lookup;
        }).finally(function () {
            productDetailState.promise = null;
        });
        return productDetailState.promise;
    }

    function startProductDetailWarmup(force) {
        return ensureProductDetailSheet(!!force).catch(function () {
            return null;
        });
    }

    function applyProductDetailWarmupToCatalog(detailWarmupPromise) {
        if (!detailWarmupPromise || typeof detailWarmupPromise.then !== "function") return;
        detailWarmupPromise.then(function (lookup) {
            if (!lookup || !Object.keys(lookup).length) return null;
            const nextCache = refreshCatalogCacheWithProductDetails();
            if (!nextCache || !Array.isArray(nextCache.products) || !nextCache.products.length) return nextCache;
            try {
                window.dispatchEvent(new CustomEvent("retail-catalog-updated"));
            } catch (error) {}
            notifyCatalogSubscribers({
                type: "catalog-detail",
                ts: Number(nextCache.lastMetaTs || nextCache.savedAt || Date.now()) || Date.now(),
                source: readCatalogSourcePreference(),
                products: nextCache.products
            });
            return nextCache;
        }).catch(function () {
            return null;
        });
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

    function resolveLockedProfileContacts(authUser, existingProfile, nextProfile) {
        const authEmail = String((authUser && authUser.email) || "").trim().toLowerCase();
        const currentProfile = existingProfile && typeof existingProfile === "object" ? existingProfile : {};
        const draftProfile = nextProfile && typeof nextProfile === "object" ? nextProfile : {};
        const isPhoneLogin = isPhoneAliasEmail(authEmail);
        const lockedPhone = isPhoneLogin
            ? (sanitizeDigits(authEmail) || sanitizeDigits(currentProfile.phone || draftProfile.phone || ""))
            : String(draftProfile.phone || currentProfile.phone || "").trim();
        const lockedEmail = isPhoneLogin
            ? (authEmail || buildFallbackEmail(lockedPhone, authUser))
            : (authEmail || String(draftProfile.email || currentProfile.email || "").trim().toLowerCase() || buildFallbackEmail(lockedPhone, authUser));
        return {
            loginMethod: isPhoneLogin ? "phone" : "email",
            phone: lockedPhone,
            email: lockedEmail
        };
    }

    function normalizeCustomerStatus(statusValue) {
        const safeStatus = String(statusValue || "").trim().toLowerCase();
        if (!safeStatus || safeStatus === "active" || safeStatus === "online" || safeStatus === "hoạt động" || safeStatus === "hoat dong" || safeStatus === "đang giao dịch" || safeStatus === "dang giao dich") return "Hoạt động";
        if (["offline", "inactive", "disabled", "blocked", "lock", "locked", "ngừng hoạt động", "ngung hoat dong", "ngừng giao dịch", "ngung giao dich"].includes(safeStatus)) return "Ngừng hoạt động";
        return String(statusValue || "").trim() || "Hoạt động";
    }

    function isInactiveCustomerStatus(statusValue) {
        return normalizeCustomerStatus(statusValue) === "Ngừng hoạt động";
    }

    function buildLocalFallbackProfile(seed, authUser) {
        const source = seed || {};
        const safePhone = String(source.phone || "").trim();
        const safeAddress = String(source.address || "").trim();
        return {
            customerId: String(source.customerId || "").trim(),
            authUid: String((authUser && authUser.uid) || source.authUid || "").trim(),
            name: String(source.name || (authUser && authUser.displayName) || DEFAULT_WEB_GUEST_NAME).trim(),
            email: String(source.email || (authUser && authUser.email) || buildFallbackEmail(safePhone, authUser)).trim(),
            phone: safePhone,
            shippingPhone: String(source.shippingPhone || safePhone).trim(),
            address: safeAddress,
            addresses: ensureAddressList(source.addresses, safeAddress, String(source.customerId || "").trim(), String(source.shippingPhone || safePhone).trim()),
            group: String(source.group || DEFAULT_WEB_CUSTOMER_GROUP).trim(),
            status: normalizeCustomerStatus(source.status || "Hoạt động"),
            bio: String(source.bio || "An tam chon do tot cho be moi ngay.").trim(),
            gender: String(source.gender || "Chua cap nhat").trim(),
            birthday: String(source.birthday || "").trim(),
            maritalStatus: String(source.maritalStatus || "Chua cap nhat").trim(),
            age: String(source.age || "").trim(),
            interests: normalizeTextList(source.interests),
            concerns: normalizeTextList(source.concerns),
            favoriteProducts: normalizeTextList(source.favoriteProducts),
            zalo: String(source.zalo || "").trim(),
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

    function normalizeTextList(value) {
        const list = Array.isArray(value) ? value : String(value || "").split(/[,;|\n]+/);
        return list
            .map(function (item) { return String(item || "").trim(); })
            .filter(Boolean)
            .filter(function (item, index, array) { return array.indexOf(item) === index; });
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
        if (/^https?:\/\/res\.cloudinary\.com\//i.test(value) && value.indexOf("/image/upload/") > -1) {
            const widthMatch = String(safeSize || "").match(/w(\d+)/i);
            const width = widthMatch && widthMatch[1] ? Number(widthMatch[1]) || 0 : 0;
            const uploadMarker = "/image/upload/";
            const transformPrefixes = {
                a: true, ac: true, af: true, ar: true, b: true, bo: true, br: true, c: true, co: true, d: true, dl: true, dn: true, dpr: true, e: true, f: true, fl: true, fn: true, fps: true, g: true, h: true, ki: true, l: true, o: true, p: true, pg: true, q: true, r: true, so: true, sp: true, t: true, u: true, vc: true, w: true, x: true, y: true, z: true
            };
            const markerIndex = value.indexOf(uploadMarker);
            const prefix = value.slice(0, markerIndex + uploadMarker.length);
            const suffix = value.slice(markerIndex + uploadMarker.length);
            const firstSlashIndex = suffix.indexOf("/");
            const firstSegment = firstSlashIndex >= 0 ? suffix.slice(0, firstSlashIndex) : suffix;
            const looksLikeTransform = !!firstSegment
                && firstSegment.indexOf(".") === -1
                && firstSegment.split(",").every(function (token) {
                    const match = String(token || "").trim().match(/^([a-z]{1,4})_/i);
                    return !!(match && transformPrefixes[String(match[1] || "").toLowerCase()]);
                });
            const assetPath = looksLikeTransform ? suffix.slice(firstSlashIndex + 1) : suffix;
            const transforms = ["f_auto", "q_auto"];
            if (width > 0) transforms.push("w_" + width, "c_limit");
            return prefix + transforms.join(",") + "/" + String(assetPath || "").replace(/^\/+/, "");
        }
        if (/^https?:\/\//i.test(value) && value.indexOf("drive.google.com") === -1 && value.indexOf("docs.google.com") === -1) {
            return value;
        }
        const driveId = extractDriveId(value);
        if (/^https?:\/\//i.test(driveId)) return driveId;
        return "https://drive.google.com/thumbnail?id=" + driveId + "&sz=" + safeSize;
    }

    function normalizeImageList(rawInput) {
        const raw = Array.isArray(rawInput) ? rawInput.join("\n") : String(rawInput || "").replace(/\r/g, "").trim();
        if (!raw) return [];
        const tokens = [];
        const urlStartRegex = /(https?:\/\/|data:image\/)/ig;
        const urlStarts = [];
        let match;
        while ((match = urlStartRegex.exec(raw))) urlStarts.push(match.index);
        const pushSimpleParts = function (segment) {
            String(segment || "").split(/[,\n]+/).map(function (item) {
                return String(item || "").trim();
            }).filter(Boolean).forEach(function (item) {
                tokens.push(item);
            });
        };
        if (!urlStarts.length) pushSimpleParts(raw);
        else {
            if (urlStarts[0] > 0) pushSimpleParts(raw.slice(0, urlStarts[0]));
            urlStarts.forEach(function (startIndex, index) {
                const endIndex = index + 1 < urlStarts.length ? urlStarts[index + 1] : raw.length;
                let segment = raw.slice(startIndex, endIndex).trim();
                segment = segment.replace(/[\s,]+$/, "").trim();
                if (segment) tokens.push(segment);
            });
        }
        const seen = {};
        return tokens.map(function (item) {
            return extractDriveId(item);
        }).map(function (item) {
            return String(item || "").trim().replace(/#(?:.*?&)?tasmeta=[^&]+.*$/i, "").replace(/#$/, "");
        }).filter(Boolean).filter(function (item) {
            if (seen[item]) return false;
            seen[item] = true;
            return true;
        });
    }

    function decodeHostedImageMeta(rawUrl) {
        const value = String(rawUrl || "").trim();
        if (!value) return null;
        const match = value.match(/#(?:.*?&)?tasmeta=([^&]+)/i);
        if (!match || !match[1]) return null;
        try {
            let encoded = String(match[1] || "").trim().replace(/-/g, "+").replace(/_/g, "/");
            while (encoded.length % 4) encoded += "=";
            const decoded = decodeURIComponent(escape(atob(encoded)));
            const parsed = safeParse(decoded, null);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch (error) {
            return null;
        }
    }

    function getPrimaryHostedImageMeta(images) {
        const list = Array.isArray(images) ? images : [];
        for (let i = 0; i < list.length; i += 1) {
            const parsed = decodeHostedImageMeta(list[i]);
            if (parsed) return parsed;
        }
        return null;
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
            const variantImage = String((variant && (variant.image || variant.link_anh || variant.img)) || "").trim();
            const variantMeta = decodeHostedImageMeta(variantImage);
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

            const variantName = String((variant && (variant.name || variant.label || variant.n)) || (variantMeta && variantMeta.v) || variant || "").trim();
            if (!variantName) return;
            flatVariants.push({
                name: variantName,
                price: Number((variant && (variant.price || variant.p)) || 0) || 0,
                stock: Number((variant && (variant.stock || variant.s)) || 0) || 0,
                image: variantImage || ""
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

    function normalizeList(rawValue) {
        const queue = [];
        if (Array.isArray(rawValue)) {
            queue.push.apply(queue, rawValue);
        } else if (rawValue && typeof rawValue === "object") {
            Object.keys(rawValue).forEach(function (key) {
                queue.push(rawValue[key]);
            });
        } else {
            queue.push(rawValue);
        }

        const seen = {};
        const values = [];
        queue.forEach(function (item) {
            String(item || "").split(/[,;|\n]+/).map(function (value) {
                return String(value || "").trim();
            }).filter(Boolean).forEach(function (value) {
                const key = value.toLowerCase();
                if (seen[key]) return;
                seen[key] = true;
                values.push(value);
            });
        });

        return values;
    }

    function normalizeGroupList(rawGroups) {
        return normalizeList(rawGroups);
    }

    function normalizeTagList(rawTags, excludedValues) {
        const excluded = {};
        normalizeList(excludedValues || []).forEach(function (value) {
            excluded[String(value || "").toLowerCase()] = true;
        });
        return normalizeList(rawTags).filter(function (value) {
            return !excluded[String(value || "").toLowerCase()];
        });
    }

    function buildCatalogMetaDesc(rawDesc, groupValue, tagsValue) {
        const safeGroups = normalizeGroupList(groupValue || []);
        const safeGroup = safeGroups.join(" • ");
        const safeTags = normalizeTagList(tagsValue || [], safeGroups);
        const parts = [];
        if (safeGroup) parts.push("Nhóm: " + safeGroup);
        if (safeTags.length) parts.push("Tag: " + safeTags.slice(0, 4).join(" • "));
        parts.push("Kho: " + String(window.STORE_WAREHOUSE_LABEL || "Dị Nậu - Xã Tây Phương - TP. Hà Nội"));
        const fallbackDesc = parts.join(" | ");
        const safeDesc = String(rawDesc || "").trim();
        if (!safeDesc) return fallbackDesc;
        return /kho\s*:/i.test(safeDesc) ? fallbackDesc : safeDesc;
    }

    function normalizeCloudProductNode(productId, node) {
        if (String(productId || "").trim() === "__router__") return null;
        const rawNode = node && node.co_kh ? unminifyData(node.co_kh) : unminifyData(node || {});
        const detail = getProductDetailById(productId);
        const images = normalizeImageList(rawNode.link_anh || rawNode.image || rawNode.img || "");
        const primaryImageMeta = getPrimaryHostedImageMeta(images);
        const wholesalePrice = parseMoney(rawNode.gia_si || rawNode.wholesale_price || 0);
        const retailPrice = parseMoney(rawNode.gia_ban_le || rawNode.price || 0);
        const basePrice = wholesalePrice || retailPrice || 0;
        const discountPercent = Number(
            rawNode.km_phan_tram
            ?? rawNode.discount_percent
            ?? rawNode.discountPercent
            ?? rawNode.salePercent
            ?? rawNode["Sale (%)"]
            ?? rawNode["Khuyến Mãi (%)"]
            ?? rawNode.Discount
            ?? rawNode.discount
            ?? 0
        ) || 0;
        const finalPrice = discountPercent > 0 ? Math.max(0, Math.round(basePrice * (100 - discountPercent) / 100)) : basePrice;
        const stock = Number(rawNode.ton_kho || rawNode.stock || 0) || 0;
        const pendingStock = Number(rawNode.dang_dat || rawNode.pending_stock || 0) || 0;
        const availableStock = Math.max(stock - pendingStock, 0);
        const sold = Number(rawNode.total_buy || rawNode.sold || 0) || 0;
        const updatedTs = Number(rawNode.updated_ts || 0) || 0;
        const groupList = normalizeGroupList([rawNode.group, rawNode.groups, rawNode.groupList]);
        const group = String(groupList[0] || rawNode.group || "").trim();
        const code = String(rawNode.ma_sp || rawNode.code || rawNode.sku || rawNode.id || productId || "").trim();
        const firstImage = images[0] ? optimizeDriveUrl(images[0], "w800") : "https://via.placeholder.com/600x600?text=Product";
        const tags = normalizeTagList([rawNode.tags, rawNode.tagList, (primaryImageMeta && primaryImageMeta.t) || []], groupList);
        const primaryCategory = String(group || tags[0] || "San pham");
        const normalizedVariants = normalizeVariants((detail && detail.variants && detail.variants.length) ? detail.variants : (rawNode.variants || rawNode.vr || node.vr || node.variants || []));
        const unit = String(rawNode.dvt || rawNode.unit || rawNode.u || rawNode.don_vi || rawNode.don_vi_tinh || rawNode.dv || rawNode.dv_tinh || "").trim();
        const minQty = Math.max(Number(rawNode.si_tu || rawNode.su || rawNode.min_qty || rawNode.minQty || 1) || 1, 1);
        return applyProductDetailSheetToCatalogProduct({
            id: String(rawNode.id || productId || code || ""),
            unit: unit,
            minQty: minQty,
            code: code,
            group: group,
            groups: groupList,
            cat: primaryCategory,
            tags: tags,
            name: String(rawNode.name || ("San pham " + productId)),
            price: formatMoney(finalPrice || basePrice || 0),
            priceValue: finalPrice || basePrice || 0,
            originalPrice: discountPercent > 0 ? formatMoney(basePrice || 0) : "",
            originalPriceValue: basePrice || 0,
            salePercent: discountPercent,
            discountPercent: discountPercent,
            sold: sold,
            images: images.length ? images.map(function (image) { return optimizeDriveUrl(image, "w1200"); }) : [firstImage],
            img: firstImage,
            desc: buildCatalogMetaDesc((detail && detail.mo_ta) || rawNode.description || rawNode.desc || rawNode.mo_ta || (primaryImageMeta && primaryImageMeta.d) || "", group || primaryCategory, tags),
            variants: normalizedVariants,
            inStock: availableStock > 0,
            badges: mapBadges(rawNode),
            stock: stock,
            pendingStock: pendingStock,
            availableStock: availableStock,
            updatedTs: updatedTs
        });
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
            group: String(basic.group || DEFAULT_WEB_CUSTOMER_GROUP).trim(),
            status: normalizeCustomerStatus(basic.status || "Hoạt động"),
            bio: String(basic.bio || "An tam chon do tot cho be moi ngay."),
            gender: String(basic.gender || "Chua cap nhat"),
            birthday: String(basic.birthday || ""),
            maritalStatus: String(basic.maritalStatus || "Chua cap nhat").trim(),
            age: String(basic.age || "").trim(),
            interests: normalizeTextList(basic.interests),
            concerns: normalizeTextList(basic.concerns),
            favoriteProducts: normalizeTextList(basic.favoriteProducts),
            zalo: String(basic.zalo || "").trim(),
            personalInfo: String(basic.personalInfo || "Thiet lap ngay"),
            pass: "",
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
        const passwordForSync = String(safeOptions.passwordForSync || "").trim();
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
            group: String(safeProfile.group || DEFAULT_WEB_CUSTOMER_GROUP).trim(),
            status: normalizeCustomerStatus(safeProfile.status || "Hoạt động"),
            updated_ts: updatedTs,
            bio: String(safeProfile.bio || "").trim(),
            gender: String(safeProfile.gender || "Chua cap nhat").trim(),
            birthday: String(safeProfile.birthday || "").trim(),
            maritalStatus: String(safeProfile.maritalStatus || "Chua cap nhat").trim(),
            age: String(safeProfile.age || "").trim(),
            interests: normalizeTextList(safeProfile.interests),
            concerns: normalizeTextList(safeProfile.concerns),
            favoriteProducts: normalizeTextList(safeProfile.favoriteProducts),
            zalo: String(safeProfile.zalo || "").trim(),
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
            const secureData = {
                auth_uid: String(authUid || "").trim(),
                last_update: updatedTs
            };
            if (passwordForSync) secureData.pass = passwordForSync;
            customerNode.b_ma = minifyData(secureData);
            updates["khachhang/" + customerId + "/b_ma"] = customerNode.b_ma;
        }
        const authIndex = {
            customer_id: customerId,
            group: String(safeProfile.group || DEFAULT_WEB_CUSTOMER_GROUP).trim(),
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
                pass: "",
                shippingPhone: shippingPhone,
                updatedTs: updatedTs
            })
        };
    }

    function normalizeOrderStatus(statusValue) {
        const statusMap = {
            "0": "Đơn đặt",
            "1": "Chờ xác nhận",
            "2": "Đang giao",
            "3": "Giao COD",
            "4": "Hoàn thành",
            "5": "Đã hủy",
            "6": "Trả hàng"
        };
        const safeValue = String(statusValue || "").trim();
        return statusMap[safeValue] || safeValue || "Chờ xác nhận";
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

    function getOrderSummaryBucketPath(authUid) {
        const safeAuthUid = String(authUid || "").trim() || "guest";
        return "donhang_tomtat/" + safeAuthUid;
    }

    function getOrderSummaryPath(authUid, orderId) {
        return getOrderSummaryBucketPath(authUid) + "/" + String(orderId || "").trim();
    }

    function buildOrderSummaryNode(orderInfo) {
        return minifyData(orderInfo || {});
    }

    function normalizeOrderSummaryFromMirror(orderId, node) {
        return normalizeOrderSummary(orderId, { in4: node || {} });
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

    function buildPendingReservationMap(orderItems) {
        const pendingMap = {};
        (Array.isArray(orderItems) ? orderItems : []).forEach(function (item) {
            const productId = String((item && (item.rootId || item.id)) || "").trim();
            if (!productId) return;
            pendingMap[productId] = (Number(pendingMap[productId] || 0) || 0) + (Number(item.qty || item.quantity || 0) || 0);
        });
        return pendingMap;
    }

    function applyPendingReservationDeltaToCatalog(deltaMap, updatedTs) {
        const cached = getCatalogCache();
        const safeDeltaMap = deltaMap && typeof deltaMap === "object" ? deltaMap : {};
        if (!Array.isArray(cached.products) || !cached.products.length) return cached;

        const nextProducts = cached.products.map(function (product) {
            const productId = String((product && product.id) || "").trim();
            const delta = Number(safeDeltaMap[productId] || 0) || 0;
            if (!productId || !delta) return product;

            const stock = Number((product && product.stock) || 0) || 0;
            const currentPending = Number((product && (product.pendingStock || product.dangDat)) || 0) || 0;
            const nextPending = Math.max(0, currentPending + delta);
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

    function applyPendingReservationToCatalog(orderItems, updatedTs) {
        return applyPendingReservationDeltaToCatalog(buildPendingReservationMap(orderItems), updatedTs);
    }

    function buildCatalogStockShadowNodeFromPublicRaw_(publicNode, updatedTs) {
        const safeNode = publicNode && typeof publicNode === "object" ? Object.assign({}, publicNode) : {};
        return {
            tk: Math.max(0, Number(safeNode.tk || 0) || 0),
            dd: Math.max(0, Number(safeNode.dd || 0) || 0),
            updated_ts: Math.max(Number(safeNode.updated_ts || 0) || 0, Number(updatedTs || Date.now()) || Date.now())
        };
    }

    function getDbIdentityKey_(db) {
        if (!db) return "";
        try {
            const appOptions = db.app && db.app.options ? db.app.options : {};
            const databaseUrl = String(appOptions.databaseURL || "").trim();
            if (databaseUrl) return databaseUrl;
        } catch (error) {}
        try {
            return String((db.app && db.app.name) || "").trim();
        } catch (error) {}
        return "";
    }

    function appendUniqueDbCandidate_(list, db) {
        if (!Array.isArray(list) || !db || typeof db.ref !== "function") return list;
        const nextKey = getDbIdentityKey_(db);
        const duplicated = list.some(function (existingDb) {
            return getDbIdentityKey_(existingDb) === nextKey;
        });
        if (!duplicated) list.push(db);
        return list;
    }

    function getCatalogWriteDbCandidates_(hasCatalogAccess) {
        const candidates = [];
        if (hasCatalogAccess && typeof service.getCatalogDbs === "function") {
            (service.getCatalogDbs() || []).forEach(function (db) {
                appendUniqueDbCandidate_(candidates, db);
            });
        } else if (hasCatalogAccess && service.getCatalogDb()) {
            appendUniqueDbCandidate_(candidates, service.getCatalogDb());
        }
        appendUniqueDbCandidate_(candidates, service.getPrimaryDb());
        return candidates;
    }

    async function syncCatalogStockShadowNode_(db, productId, publicNode, updatedTs) {
        const safeDb = db && typeof db.ref === "function" ? db : null;
        const safeProductId = String(productId || "").trim();
        if (!safeDb || !safeProductId) return null;
        const publicData = publicNode && typeof publicNode === "object" ? publicNode : null;
        if (!publicData) return null;
        const productRef = safeDb.ref("sanpham/" + safeProductId);
        const productSnapshot = await productRef.once("value").catch(function () { return null; });
        if (!productSnapshot || !productSnapshot.exists()) return null;
        const shadowNode = buildCatalogStockShadowNodeFromPublicRaw_(publicData, updatedTs);
        await productRef.child("co_kh").update(shadowNode);
        return shadowNode;
    }

    async function transactCatalogPendingDelta_(productId, delta, sortTs, dbCandidates) {
        const safeProductId = String(productId || "").trim();
        const safeDelta = Number(delta || 0) || 0;
        const safeSortTs = Number(sortTs || Date.now()) || Date.now();
        const candidates = Array.isArray(dbCandidates) ? dbCandidates : [];
        let lastError = null;

        for (let index = 0; index < candidates.length; index += 1) {
            const db = candidates[index];
            if (!db || typeof db.ref !== "function") continue;
            try {
                const txResult = await db.ref("catalog_public/" + safeProductId).transaction(function (currentData) {
                    if (!currentData || typeof currentData !== "object") return;
                    const nextData = currentData && typeof currentData === "object" ? Object.assign({}, currentData) : {};
                    nextData.dd = Math.max(0, (Number(nextData.dd || 0) || 0) + safeDelta);
                    nextData.updated_ts = Math.max(Number(nextData.updated_ts || 0) || 0, safeSortTs);
                    return nextData;
                });
                if (txResult && txResult.committed !== false && txResult.snapshot && txResult.snapshot.exists()) {
                    try {
                        await syncCatalogStockShadowNode_(db, safeProductId, txResult.snapshot.val(), safeSortTs);
                    } catch (shadowError) {
                        console.warn("Khong dong bo duoc shadow co_kh cho san pham:", safeProductId, shadowError);
                    }
                    return txResult;
                }
            } catch (error) {
                lastError = error;
            }
        }

        if (lastError) throw lastError;
        return null;
    }

    async function syncPendingReservationDelta(deltaMap, sortTs, hasCatalogAccess, options) {
        const opts = options || {};
        const entries = Object.keys(deltaMap || {}).map(function (productId) {
            return {
                productId: String(productId || "").trim(),
                delta: Number(deltaMap[productId] || 0) || 0
            };
        }).filter(function (entry) {
            return entry.productId && entry.delta !== 0;
        });

        const results = await Promise.all(entries.map(async function (entry) {
            const dbCandidates = getCatalogWriteDbCandidates_(hasCatalogAccess);

            let lastError = null;
            let committed = false;
            for (let index = 0; index < dbCandidates.length; index += 1) {
                const db = dbCandidates[index];
                if (!db || typeof db.ref !== "function") continue;
                try {
                    const txResult = await transactCatalogPendingDelta_(entry.productId, entry.delta, sortTs, [db]);
                    if (txResult && txResult.committed !== false) {
                        committed = true;
                        return txResult;
                    }
                } catch (error) {
                    lastError = error;
                }
            }

            if (lastError) {
                console.warn("Khong dong bo duoc dang_dat cho san pham:", entry.productId, lastError);
            } else if (!committed) {
                console.warn("Khong tim thay shard san pham de dong bo dang_dat:", entry.productId);
            }
            return {
                productId: entry.productId,
                delta: entry.delta,
                committed: committed,
                error: lastError || null
            };
        }));

        const summary = {
            successes: results.filter(function (entry) { return !!(entry && entry.committed); }),
            failures: results.filter(function (entry) { return !!(entry && !entry.committed); })
        };
        if (opts.strict && summary.failures.length) {
            const syncError = new Error("pending-reservation-sync-failed");
            syncError.pendingReservationResult = summary;
            throw syncError;
        }
        return summary;
    }

    function normalizePendingReservationState_(value, fallbackValue) {
        const safeValue = String(value || "").trim().toLowerCase();
        if (!safeValue) return String(fallbackValue || "").trim().toLowerCase() || "";
        if (safeValue === "queued") return "pending";
        if (safeValue === "synced") return "done";
        return safeValue;
    }

    function buildPendingReservationRevertMap_(pendingMap, productIds) {
        const safeMap = pendingMap && typeof pendingMap === "object" ? pendingMap : {};
        const safeIds = Array.isArray(productIds) ? productIds : Object.keys(safeMap || {});
        return safeIds.reduce(function (result, productId) {
            const safeProductId = String(productId || "").trim();
            if (!safeProductId) return result;
            const qty = Math.max(Number(safeMap[safeProductId] || 0) || 0, 0);
            if (qty > 0) result[safeProductId] = -qty;
            return result;
        }, {});
    }

    function describePendingReservationError_(error, syncResult, pendingMap) {
        const failures = syncResult && Array.isArray(syncResult.failures) ? syncResult.failures : [];
        if (failures.length) {
            return failures.map(function (entry) {
                return String((entry && entry.productId) || "").trim();
            }).filter(Boolean).join(", ") || "pending-reservation-pending";
        }
        const safeMessage = String((error && error.message) || "").trim();
        if (safeMessage) return safeMessage;
        const productIds = Object.keys(pendingMap || {}).filter(Boolean);
        return productIds.length ? ("pending:" + productIds.join(",")) : "pending-reservation-pending";
    }

    async function attemptDirectPendingReservationSync_(pendingMap, sortTs, hasCatalogAccess) {
        const productIds = Object.keys(pendingMap || {}).filter(function (productId) {
            return String(productId || "").trim() && (Number(pendingMap[productId] || 0) || 0) > 0;
        });
        if (!productIds.length) {
            return {
                state: "not_required",
                committed: false,
                result: { successes: [], failures: [] },
                errorMessage: ""
            };
        }
        if (!hasCatalogAccess) {
            return {
                state: "pending",
                committed: false,
                result: null,
                errorMessage: "catalog-access-unavailable"
            };
        }

        let syncResult = null;
        let syncError = null;
        try {
            syncResult = await syncPendingReservationDelta(pendingMap, sortTs, hasCatalogAccess);
        } catch (error) {
            syncError = error;
            syncResult = error && error.pendingReservationResult ? error.pendingReservationResult : null;
        }

        const successes = syncResult && Array.isArray(syncResult.successes) ? syncResult.successes : [];
        const failures = syncResult && Array.isArray(syncResult.failures) ? syncResult.failures : [];
        const successIds = successes.map(function (entry) {
            return String((entry && entry.productId) || "").trim();
        }).filter(Boolean);
        const hasFailures = failures.length > 0 || successIds.length !== productIds.length;
        if (hasFailures) {
            if (successIds.length) {
                const revertMap = buildPendingReservationRevertMap_(pendingMap, successIds);
                if (Object.keys(revertMap).length) {
                    await syncPendingReservationDelta(revertMap, Date.now(), hasCatalogAccess).catch(function (revertError) {
                        console.warn("Khong hoan tac duoc dang_dat direct sau khi sync mot phan:", revertError);
                        return null;
                    });
                }
            }
            return {
                state: "pending",
                committed: false,
                result: syncResult,
                errorMessage: describePendingReservationError_(syncError, syncResult, pendingMap)
            };
        }

        return {
            state: "done",
            committed: true,
            result: syncResult,
            errorMessage: "",
            processedTs: Number(sortTs || Date.now()) || Date.now()
        };
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
        coreReadyPromise: null,
        readyPromise: null,
        primaryDb: null,
        catalogDb: null,
        catalogDbs: [],
        catalogApps: [],
        catalogConfigSignature: "",
        auth: null,
        catalogAuth: null,
        catalogMetaBound: false,
        catalogMetaRef: null,
        catalogMetaHandler: null,
        catalogSource: "catalog_public",
        catalogAccessPromise: null,
        catalogLiveSource: "",
        catalogDeltaRef: null,
        catalogDeltaBaseRef: null,
        catalogDeltaRefs: [],
        catalogDeltaAddedHandler: null,
        catalogDeltaChangedHandler: null,
        catalogDeltaRemovedHandler: null,
        catalogLiveRefreshTimer: null,
        catalogSubscribers: [],
        accountMetaBound: false,
        accountMetaSubscribers: [],
        accountMetaTs: {
            orders: 0,
            customers: 0
        },
        liveAccountAuthBound: false,
        liveAccountAuthUnsubscribe: null,
        liveCustomerRef: null,
        liveCustomerHandler: null,
        liveCustomerId: "",
        liveCustomerAuthUid: "",
        liveOrdersRef: null,
        liveOrdersAddedHandler: null,
        liveOrdersChangedHandler: null,
        liveOrdersRemovedHandler: null,
        liveOrdersAuthUid: "",
        ensureProductDetailSheet: ensureProductDetailSheet,
        sessionBootPromise: null,
        catalogLoadState: {
            loading: false,
            syncingDelta: false
        }
    };

    function cleanupLegacyAnonymousSessions() {
        const authList = [];
        if (service.auth) authList.push(service.auth);
        if (Array.isArray(service.catalogApps)) {
            service.catalogApps.forEach(function (appInstance) {
                if (!appInstance || typeof appInstance.auth !== "function") return;
                try {
                    const nextAuth = appInstance.auth();
                    if (nextAuth) authList.push(nextAuth);
                } catch (error) {}
            });
        }
        authList.forEach(function (authInstance) {
            try {
                if (authInstance && authInstance.currentUser && authInstance.currentUser.isAnonymous && typeof authInstance.signOut === "function") {
                    authInstance.signOut().catch(function () { return null; });
                }
            } catch (error) {}
        });
    }

    service.ensureCoreReady = function () {
        if (service.coreReadyPromise) return service.coreReadyPromise;

        service.coreReadyPromise = new Promise(function (resolve, reject) {
            try {
                if (typeof firebase === "undefined") {
                    reject(new Error("firebase-sdk-missing"));
                    return;
                }

                if (!firebase.apps || firebase.apps.length === 0) {
                    firebase.initializeApp(FIREBASE_MAIN_CONFIG);
                }

                const primaryApp = firebase.app();
                service.primaryDb = primaryApp.database();
                service.auth = primaryApp.auth();
                if (service.auth && service.auth.setPersistence && firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
                    service.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () { return null; });
                }
                cleanupLegacyAnonymousSessions();
                resolve(service);
            } catch (error) {
                reject(error);
            }
        });

        return service.coreReadyPromise;
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
        service.catalogSource = "catalog_public";
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

    function notifyAccountMetaSubscribers(payload) {
        (Array.isArray(service.accountMetaSubscribers) ? service.accountMetaSubscribers : []).forEach(function (callback) {
            if (typeof callback !== "function") return;
            try {
                callback(payload);
            } catch (error) {}
        });
    }

    function getCatalogDbsSafe() {
        return Array.isArray(service.catalogDbs) && service.catalogDbs.length ? service.catalogDbs : [service.getCatalogDb()];
    }

    function detachCatalogMetaBinding() {
        if (service.catalogMetaRef && service.catalogMetaHandler) {
            try {
                service.catalogMetaRef.off("value", service.catalogMetaHandler);
            } catch (error) {}
        }
        service.catalogMetaRef = null;
        service.catalogMetaHandler = null;
        service.catalogMetaBound = false;
    }

    function rebuildCatalogAppsFromEntries(entries, options) {
        const opts = options || {};
        const safeEntries = Array.isArray(entries) && entries.length
            ? entries
            : DEFAULT_CATALOG_SHARD_CONFIGS.map(function (entry) {
                return {
                    label: entry.label,
                    appName: entry.appName,
                    config: Object.assign({}, entry.config)
                };
            });
        const nextSignature = getCatalogShardConfigSignature(safeEntries);
        if (!opts.force && service.catalogConfigSignature === nextSignature && Array.isArray(service.catalogApps) && service.catalogApps.length) {
            return false;
        }

        service.catalogApps = safeEntries.map(function (entry) {
            return getOrInitNamedFirebaseApp(entry.appName, entry.config);
        });
        service.catalogDbs = service.catalogApps
            .map(function (app) { return app && typeof app.database === "function" ? app.database() : null; })
            .filter(Boolean);
        service.catalogDb = service.catalogDbs[0] || service.primaryDb;
        service.catalogAuth = service.catalogApps[0] && typeof service.catalogApps[0].auth === "function"
            ? service.catalogApps[0].auth()
            : null;
        service.catalogConfigSignature = nextSignature;

        detachCatalogLiveBindings();
        detachCatalogMetaBinding();

        if ((Array.isArray(service.catalogSubscribers) && service.catalogSubscribers.length) || service.catalogLiveSource) {
            attachCatalogLiveBindings(readCatalogSourcePreference());
        }
        if ((Array.isArray(service.catalogSubscribers) && service.catalogSubscribers.length) && typeof service.subscribeCatalogMeta === "function") {
            setTimeout(function () {
                service.subscribeCatalogMeta().catch(function () { return null; });
            }, 0);
        }

        return true;
    }

    function getCachedOrdersForAuthUid(authUid) {
        const safeAuthUid = String(authUid || "").trim();
        const cached = service.getCachedOrders ? service.getCachedOrders() : null;
        if (!safeAuthUid || !cached || String(cached.authUid || "").trim() !== safeAuthUid || !Array.isArray(cached.orders)) return [];
        return cached.orders;
    }

    function syncCachedCustomerOrders(authUid, orders) {
        const safeOrders = Array.isArray(orders) ? orders : [];
        const cachedProfile = service.getCachedCustomer ? service.getCachedCustomer() : null;
        if (!cachedProfile || String(cachedProfile.authUid || "").trim() !== String(authUid || "").trim()) return null;
        const nextProfile = Object.assign({}, cachedProfile, { orders: safeOrders });
        service.saveCachedCustomer(nextProfile);
        return nextProfile;
    }

    async function writeOrderSummaryMirror_(authUid, orderId, orderInfo) {
        const safeAuthUid = String(authUid || "").trim();
        const safeOrderId = String(orderId || "").trim();
        if (!safeAuthUid || !safeOrderId) return false;
        try {
            await service.getPrimaryDb().ref(getOrderSummaryPath(safeAuthUid, safeOrderId)).set(buildOrderSummaryNode(orderInfo));
            return true;
        } catch (error) {
            if (isPermissionDeniedError_(error)) {
                console.warn("Khong ghi duoc donhang_tomtat cho khach web:", safeOrderId, error);
                return false;
            }
            throw error;
        }
    }

    async function removeOrderSummaryMirror_(authUid, orderId) {
        const safeAuthUid = String(authUid || "").trim();
        const safeOrderId = String(orderId || "").trim();
        if (!safeAuthUid || !safeOrderId) return false;
        try {
            await service.getPrimaryDb().ref(getOrderSummaryPath(safeAuthUid, safeOrderId)).remove();
            return true;
        } catch (error) {
            if (isPermissionDeniedError_(error)) {
                console.warn("Khong xoa duoc donhang_tomtat cho khach web:", safeOrderId, error);
                return false;
            }
            throw error;
        }
    }

    function detachCurrentAccountLiveBindings() {
        if (service.liveCustomerRef && service.liveCustomerHandler) {
            try {
                service.liveCustomerRef.off("value", service.liveCustomerHandler);
            } catch (error) {}
        }
        if (service.liveOrdersRef) {
            try {
                if (service.liveOrdersAddedHandler) service.liveOrdersRef.off("child_added", service.liveOrdersAddedHandler);
                if (service.liveOrdersChangedHandler) service.liveOrdersRef.off("child_changed", service.liveOrdersChangedHandler);
                if (service.liveOrdersRemovedHandler) service.liveOrdersRef.off("child_removed", service.liveOrdersRemovedHandler);
            } catch (error) {}
        }
        service.liveCustomerRef = null;
        service.liveCustomerHandler = null;
        service.liveCustomerId = "";
        service.liveCustomerAuthUid = "";
        service.liveOrdersRef = null;
        service.liveOrdersAddedHandler = null;
        service.liveOrdersChangedHandler = null;
        service.liveOrdersRemovedHandler = null;
        service.liveOrdersAuthUid = "";
    }

    function notifyCurrentCustomerLive(authUser, customerId, snapshot) {
        if (!snapshot || !snapshot.exists() || !customerId) return;
        const nextProfile = normalizeCloudCustomer(customerId, snapshot.val(), authUser);
        const nextOrders = getCachedOrdersForAuthUid(authUser && authUser.uid);
        nextProfile.orders = nextOrders;
        if (isInactiveCustomerStatus(nextProfile.status)) {
            nextProfile.restrictedData = true;
            nextProfile.orders = [];
            service.saveCachedOrders(authUser.uid, []);
        }
        service.saveCachedCustomer(nextProfile);
        notifyAccountMetaSubscribers({
            type: "customer-live",
            authUid: String((authUser && authUser.uid) || "").trim(),
            profile: nextProfile
        });
    }

    function publishCurrentOrdersLive_(authUid, orders, options) {
        const safeAuthUid = String(authUid || "").trim();
        if (!safeAuthUid) return;
        const opts = options || {};
        const nextOrders = Array.isArray(orders) ? orders : [];
        service.saveCachedOrders(safeAuthUid, nextOrders);
        syncCachedCustomerOrders(safeAuthUid, nextOrders);
        notifyAccountMetaSubscribers({
            type: "orders-live",
            authUid: safeAuthUid,
            orders: nextOrders,
            changedOrderId: String(opts.changedOrderId || "").trim(),
            removed: opts.removed === true
        });
    }

    function normalizeLiveOrderSummary_(snapshot) {
        if (!snapshot || !snapshot.exists()) return null;
        const safeOrderId = String(snapshot.key || "").trim();
        if (!safeOrderId) return null;
        if (typeof snapshot.child === "function") {
            const infoSnapshot = snapshot.child("in4");
            if (!infoSnapshot || !infoSnapshot.exists()) return null;
        }
        const rawNode = snapshot.val() || {};
        if (!rawNode || typeof rawNode !== "object" || !rawNode.in4) return null;
        return normalizeOrderSummary(safeOrderId, rawNode);
    }

    async function upsertCurrentOrderLive(authUid, snapshot) {
        if (!snapshot || !snapshot.exists()) return;
        const safeAuthUid = String(authUid || "").trim();
        const safeOrderId = String(snapshot.key || "").trim();
        if (!safeAuthUid || !safeOrderId) return;
        const nextSummary = normalizeLiveOrderSummary_(snapshot);
        if (!nextSummary) {
            await removeCurrentOrderLive(safeAuthUid, snapshot);
            return;
        }
        const nextOrders = mergeOrderListsById_(getCachedOrdersForAuthUid(safeAuthUid), [nextSummary]);
        publishCurrentOrdersLive_(safeAuthUid, nextOrders, {
            changedOrderId: safeOrderId
        });
    }

    async function removeCurrentOrderLive(authUid, snapshot) {
        const safeAuthUid = String(authUid || "").trim();
        const safeOrderId = String(snapshot && snapshot.key || "").trim();
        if (!safeAuthUid || !safeOrderId) return;
        try {
            const confirmSnap = await service.getPrimaryDb().ref("donhang/" + safeAuthUid + "/" + safeOrderId).once("value");
            if (confirmSnap.exists() && confirmSnap.child("in4").exists()) return;
        } catch (error) {}
        try {
            await removeOrderSummaryMirror_(safeAuthUid, safeOrderId);
        } catch (error) {}
        const nextOrders = getCachedOrdersForAuthUid(safeAuthUid).filter(function (order) {
            return String((order && order.id) || "").trim() !== safeOrderId;
        });
        publishCurrentOrdersLive_(safeAuthUid, nextOrders, {
            changedOrderId: safeOrderId,
            removed: true
        });
    }

    async function bindCurrentAccountLiveBindings(authUser) {
        await service.ensureReady();
        const safeAuthUser = authUser || await service.waitForAuthUser(1200);
        if (!safeAuthUser || safeAuthUser.isAnonymous) {
            detachCurrentAccountLiveBindings();
            return false;
        }

        const resolvedProfile = await service.resolveCustomerProfile(safeAuthUser, { force: true });
        const customerId = String((resolvedProfile && resolvedProfile.customerId) || "").trim();
        if (
            service.liveCustomerAuthUid === String(safeAuthUser.uid || "").trim() &&
            service.liveCustomerId === customerId &&
            service.liveOrdersAuthUid === String(safeAuthUser.uid || "").trim() &&
            service.liveOrdersRef
        ) {
            return true;
        }

        detachCurrentAccountLiveBindings();
        service.liveCustomerAuthUid = String(safeAuthUser.uid || "").trim();
        service.liveCustomerId = customerId;
        service.liveOrdersAuthUid = String(safeAuthUser.uid || "").trim();

        if (customerId) {
            service.liveCustomerRef = service.getPrimaryDb().ref("khachhang/" + customerId);
            service.liveCustomerHandler = function (snapshot) {
                notifyCurrentCustomerLive(safeAuthUser, customerId, snapshot);
            };
            service.liveCustomerRef.on("value", service.liveCustomerHandler, function () {});
        }

        service.liveOrdersRef = service.getPrimaryDb()
            .ref("donhang/" + safeAuthUser.uid)
            .orderByChild("in4/ts")
            .limitToLast(LIVE_ORDER_SUMMARY_LIMIT);
        service.liveOrdersAddedHandler = function (snapshot) {
            upsertCurrentOrderLive(safeAuthUser.uid, snapshot).catch(function () { return null; });
        };
        service.liveOrdersChangedHandler = function (snapshot) {
            upsertCurrentOrderLive(safeAuthUser.uid, snapshot).catch(function () { return null; });
        };
        service.liveOrdersRemovedHandler = function (snapshot) {
            removeCurrentOrderLive(safeAuthUser.uid, snapshot).catch(function () { return null; });
        };

        service.liveOrdersRef.on("child_added", service.liveOrdersAddedHandler, function () {});
        service.liveOrdersRef.on("child_changed", service.liveOrdersChangedHandler, function () {});
        service.liveOrdersRef.on("child_removed", service.liveOrdersRemovedHandler, function () {});
        return true;
    }

    function isMultiCatalogShardEnabled() {
        return getCatalogDbsSafe().length > 1;
    }

    function getCatalogNodeUpdatedTs(node, sourceName) {
        if (!node || typeof node !== "object") return 0;
        if (sourceName === "sanpham") {
            return Number((node.co_kh && node.co_kh.updated_ts) || 0) || 0;
        }
        return Number(node.updated_ts || 0) || 0;
    }

    async function loadMergedCatalogRows(sourceName, options) {
        const config = getCatalogSourceConfig(sourceName);
        const opts = options || {};
        const limitPerShard = Math.max(0, Number(opts.limitPerShard || 0) || 0);
        const snapshots = await Promise.all(getCatalogDbsSafe().map(async function (targetDb) {
            if (!targetDb) return { snapshot: null, hasOverflow: false };
            try {
                let query = targetDb.ref(config.path);
                if (limitPerShard > 0) {
                    query = query.orderByChild(config.orderBy).limitToLast(limitPerShard + 1);
                }
                const snapshot = await query.once("value").catch(function () { return null; });
                let rowCount = 0;
                if (snapshot && snapshot.exists()) {
                    snapshot.forEach(function (childSnapshot) {
                        if (childSnapshot.key === "__router__") return;
                        rowCount += 1;
                    });
                }
                return {
                    snapshot: snapshot,
                    hasOverflow: limitPerShard > 0 && rowCount > limitPerShard
                };
            } catch (error) {
                return { snapshot: null, hasOverflow: false };
            }
        }));
        const mergedMap = {};
        let maybeMore = false;
        snapshots.forEach(function (entry) {
            const snapshot = entry && entry.snapshot ? entry.snapshot : null;
            if (!snapshot || !snapshot.exists()) return;
            if (entry && entry.hasOverflow) maybeMore = true;
            snapshot.forEach(function (childSnapshot) {
                if (childSnapshot.key === "__router__") return;
                mergedMap[childSnapshot.key] = childSnapshot.val();
            });
        });
        const rows = Object.keys(mergedMap).map(function (key) {
            return {
                key: key,
                node: mergedMap[key]
            };
        }).sort(function (left, right) {
            const tsDiff = getCatalogNodeUpdatedTs(right.node, sourceName) - getCatalogNodeUpdatedTs(left.node, sourceName);
            if (tsDiff !== 0) return tsDiff;
            return String(right.key || "").localeCompare(String(left.key || ""));
        });
        if (!rows.length && sourceName === "catalog_public") {
            const gasResult = await loadMergedCatalogRowsViaGas(sourceName).catch(function () { return null; });
            if (gasResult && Array.isArray(gasResult.rows) && gasResult.rows.length) return gasResult;
            const shadowResult = await loadMergedCatalogRows("sanpham", opts).catch(function () { return null; });
            if (shadowResult && Array.isArray(shadowResult.rows) && shadowResult.rows.length) return shadowResult;
        }
        return {
            config: config,
            rows: rows,
            maybeMore: maybeMore,
            highestTs: rows.reduce(function (maxTs, row) {
                return Math.max(maxTs, getCatalogNodeUpdatedTs(row.node, sourceName));
            }, 0)
        };
    }

    async function loadMergedCatalogRowsViaGas(sourceName) {
        if (sourceName !== "catalog_public" || !PRODUCT_DETAIL_GAS_URL) return null;
        const url = new URL(PRODUCT_DETAIL_GAS_URL);
        url.searchParams.set("action", "get_catalog_public_products");
        url.searchParams.set("_ts", String(Date.now()));
        try {
            if (service.auth && service.auth.currentUser && typeof service.auth.currentUser.getIdToken === "function") {
                const token = await service.auth.currentUser.getIdToken();
                if (token) url.searchParams.set("firebase_id_token", token);
            }
        } catch (error) {}
        const response = await fetch(url.toString(), { method: "GET", cache: "no-store" }).catch(function () { return null; });
        if (!response || !response.ok) return null;
        const payload = await response.json().catch(function () { return null; });
        if (!payload || payload.status !== "success") return null;
        const mergedMap = payload.data && typeof payload.data === "object"
            ? Object.assign({}, payload.data)
            : (payload.products && typeof payload.products === "object" ? Object.assign({}, payload.products) : null);
        if (!mergedMap) return null;
        delete mergedMap.__router__;
        const rows = Object.keys(mergedMap).map(function (key) {
            return {
                key: key,
                node: mergedMap[key]
            };
        }).sort(function (left, right) {
            const tsDiff = getCatalogNodeUpdatedTs(right.node, sourceName) - getCatalogNodeUpdatedTs(left.node, sourceName);
            if (tsDiff !== 0) return tsDiff;
            return String(right.key || "").localeCompare(String(left.key || ""));
        });
        return {
            config: getCatalogSourceConfig(sourceName),
            rows: rows,
            highestTs: Number(payload.highest_ts || 0) || rows.reduce(function (maxTs, row) {
                return Math.max(maxTs, getCatalogNodeUpdatedTs(row.node, sourceName));
            }, 0)
        };
    }

    function detachCatalogLiveBindings() {
        if (Array.isArray(service.catalogDeltaRefs) && service.catalogDeltaRefs.length) {
            service.catalogDeltaRefs.forEach(function (entry) {
                if (!entry || !entry.ref || typeof entry.ref.off !== "function" || typeof entry.handler !== "function") return;
                try {
                    if (entry.event) {
                        entry.ref.off(entry.event, entry.handler);
                        return;
                    }
                    entry.ref.off("child_added", entry.handler);
                    entry.ref.off("child_changed", entry.handler);
                    entry.ref.off("child_removed", entry.handler);
                } catch (error) {}
            });
        }
        service.catalogDeltaRefs = [];
        clearTimeout(service.catalogLiveRefreshTimer);
        service.catalogLiveRefreshTimer = null;
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

    function notifyCatalogLiveCacheChange_(sourceName, productId, nextCache, options) {
        const safeCache = nextCache && typeof nextCache === "object" ? nextCache : getCatalogCache();
        const safeOptions = options || {};
        try {
            window.dispatchEvent(new CustomEvent("retail-catalog-updated", {
                detail: {
                    source: sourceName,
                    changedProductId: String(productId || "").trim(),
                    removed: safeOptions.removed === true
                }
            }));
        } catch (error) {}
        notifyCatalogSubscribers({
            type: "catalog-live",
            source: sourceName,
            products: Array.isArray(safeCache.products) ? safeCache.products : [],
            changedProductId: String(productId || "").trim(),
            removed: safeOptions.removed === true
        });
    }

    function applyCatalogLiveSnapshotChange_(snapshot, sourceName) {
        const safeSource = sourceName === "sanpham" ? "sanpham" : "catalog_public";
        const safeProductId = String((snapshot && snapshot.key) || "").trim();
        if (!safeProductId) return getCatalogCache();
        const product = normalizeCloudProductNode(safeProductId, snapshot && typeof snapshot.val === "function" ? snapshot.val() : null);
        const nextCache = product
            ? updateCatalogCacheProducts(mergeProductLists(getCatalogCache().products, [product]), {
                catalogSource: safeSource
            })
            : removeCatalogCacheProduct(safeProductId, safeSource);
        notifyCatalogLiveCacheChange_(safeSource, safeProductId, nextCache, {
            removed: !product
        });
        return nextCache;
    }

    function applyCatalogLiveSnapshotRemoval_(snapshot, sourceName) {
        const safeSource = sourceName === "sanpham" ? "sanpham" : "catalog_public";
        const safeProductId = String((snapshot && snapshot.key) || "").trim();
        const nextCache = removeCatalogCacheProduct(safeProductId, safeSource);
        notifyCatalogLiveCacheChange_(safeSource, safeProductId, nextCache, {
            removed: true
        });
        return nextCache;
    }

    function attachCatalogLiveBindings(sourceName) {
        const safeSource = sourceName === "sanpham" ? "sanpham" : "catalog_public";
        if (!service.getCatalogDb()) return;
        if (isMultiCatalogShardEnabled()) {
            if (service.catalogLiveSource === safeSource && Array.isArray(service.catalogDeltaRefs) && service.catalogDeltaRefs.length) return;
            detachCatalogLiveBindings();
            service.catalogLiveSource = safeSource;
            getCatalogDbsSafe().forEach(function (targetDb) {
                const baseRef = targetDb.ref(safeSource);
                const addedRef = baseRef.orderByKey().limitToLast(1);
                const liveAddedHandler = function () {
                    clearTimeout(service.catalogLiveRefreshTimer);
                    service.catalogLiveRefreshTimer = setTimeout(function () {
                        service.syncCatalogDelta({
                            force: true,
                            pageSize: Math.max((getCatalogCache().products || []).length || 0, DEFAULT_PAGE_SIZE)
                        }).catch(function () { return null; });
                    }, 220);
                };
                const liveChangedHandler = function (snapshot) {
                    applyCatalogLiveSnapshotChange_(snapshot, safeSource);
                };
                const liveRemovedHandler = function (snapshot) {
                    applyCatalogLiveSnapshotRemoval_(snapshot, safeSource);
                };
                addedRef.on("child_added", liveAddedHandler, function () {});
                baseRef.on("child_changed", liveChangedHandler, function () {});
                baseRef.on("child_removed", liveRemovedHandler, function () {});
                service.catalogDeltaRefs.push({ ref: addedRef, event: "child_added", handler: liveAddedHandler });
                service.catalogDeltaRefs.push({ ref: baseRef, event: "child_changed", handler: liveChangedHandler });
                service.catalogDeltaRefs.push({ ref: baseRef, event: "child_removed", handler: liveRemovedHandler });
            });
            return;
        }
        if (service.catalogLiveSource === safeSource && service.catalogDeltaRef && service.catalogDeltaBaseRef) return;

        detachCatalogLiveBindings();
        service.catalogLiveSource = safeSource;
        service.catalogDeltaRef = service.getCatalogDb().ref(safeSource).orderByKey().limitToLast(1);
        service.catalogDeltaBaseRef = service.getCatalogDb().ref(safeSource);

        service.catalogDeltaAddedHandler = function (snapshot) {
            applyCatalogLiveSnapshotChange_(snapshot, safeSource);
        };
        service.catalogDeltaChangedHandler = function (snapshot) {
            applyCatalogLiveSnapshotChange_(snapshot, safeSource);
        };
        service.catalogDeltaRemovedHandler = function (snapshot) {
            applyCatalogLiveSnapshotRemoval_(snapshot, safeSource);
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

        service.readyPromise = new Promise(async function (resolve, reject) {
            try {
                await service.ensureCoreReady();
                const localSharedSettings = readStorage("tas_sys_settings", {}) || {};
                const syncSharedSettings = function (nextSettings) {
                    const safeSettings = nextSettings && typeof nextSettings === "object"
                        ? nextSettings
                        : {};
                    service.sharedSettings = safeSettings;
                    writeStorage("tas_sys_settings", safeSettings);
                };
                syncSharedSettings(localSharedSettings);
                rebuildCatalogAppsFromEntries(getCatalogShardEntriesFromSettings(localSharedSettings), { force: true });

                const defaultCatalogApp = getOrInitNamedFirebaseApp("RetailCatalog", FIREBASE_CATALOG_CONFIG);
                const defaultCatalogDb = defaultCatalogApp.database ? defaultCatalogApp.database() : null;
                const publicRouterEntriesPromise = defaultCatalogDb
                    ? defaultCatalogDb.ref("catalog_public/__router__").once("value").then(function (routerSnap) {
                        const routerValue = routerSnap.exists() ? (routerSnap.val() || {}) : {};
                        if (!Array.isArray(routerValue.shards) || !routerValue.shards.length) return [];
                        return routerValue.shards.map(function (entry, index) {
                            const next = entry && typeof entry === "object" ? entry : {};
                            return {
                                label: String(next.label || ("Catalog " + String(index + 1))),
                                appName: String(next.appName || ("RetailCatalogShard" + String(index + 1))),
                                config: {
                                    apiKey: String(next.apiKey || ""),
                                    authDomain: String(next.authDomain || ""),
                                    databaseURL: String(next.databaseURL || ""),
                                    projectId: String(next.projectId || ""),
                                    storageBucket: String(next.storageBucket || ""),
                                    messagingSenderId: String(next.messagingSenderId || ""),
                                    appId: String(next.appId || ""),
                                    measurementId: String(next.measurementId || "")
                                }
                            };
                        }).filter(function (entry) {
                            return entry && entry.config && entry.config.databaseURL && entry.config.apiKey && entry.config.projectId;
                        });
                    }).catch(function () { return []; })
                    : Promise.resolve([]);
                const remoteSharedSettingsPromise = service.primaryDb.ref("cauhinh/hethong").once("value").then(function (remoteSettingsSnap) {
                    return remoteSettingsSnap.exists() ? (remoteSettingsSnap.val() || {}) : {};
                }).catch(function () {
                    return {};
                });
                const readyData = await Promise.all([publicRouterEntriesPromise, remoteSharedSettingsPromise]);
                const publicRouterEntries = Array.isArray(readyData[0]) ? readyData[0] : [];
                const remoteSharedSettings = readyData[1] && typeof readyData[1] === "object" ? readyData[1] : {};
                const effectiveSharedSettings = Object.keys(remoteSharedSettings || {}).length
                    ? remoteSharedSettings
                    : localSharedSettings;
                syncSharedSettings(effectiveSharedSettings);
                try {
                    if (service._sharedSettingsRef && service._sharedSettingsListener) {
                        service._sharedSettingsRef.off("value", service._sharedSettingsListener);
                    }
                    service._sharedSettingsRef = service.primaryDb.ref("cauhinh/hethong");
                    service._sharedSettingsListener = function (snapshot) {
                        const liveSettings = snapshot && snapshot.exists() ? (snapshot.val() || {}) : {};
                        const fallbackSettings = readStorage("tas_sys_settings", {}) || {};
                        const effectiveSettings = Object.keys(liveSettings || {}).length ? liveSettings : fallbackSettings;
                        syncSharedSettings(effectiveSettings);
                        try {
                            const nextEntries = getCatalogShardEntriesFromSettings(effectiveSettings);
                            rebuildCatalogAppsFromEntries(nextEntries);
                        } catch (error) {}
                    };
                    service._sharedSettingsRef.on("value", service._sharedSettingsListener);
                } catch (error) {}
                const catalogShardEntries = publicRouterEntries.length
                    ? publicRouterEntries
                    : getCatalogShardEntriesFromSettings(effectiveSharedSettings);
                rebuildCatalogAppsFromEntries(catalogShardEntries, { force: true });
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

    service.getCatalogDbs = function () {
        return getCatalogDbsSafe();
    };

    service.getAuth = function () {
        return service.auth;
    };

    service.ensureCatalogAccess = async function () {
        await service.ensureReady();
        if (service.catalogAccessPromise) return service.catalogAccessPromise;

        service.catalogAccessPromise = (async function () {
            const catalogApps = Array.isArray(service.catalogApps) ? service.catalogApps : [];
            if (!catalogApps.length) return false;

            let hasAccess = false;
            await Promise.all(catalogApps.map(async function (appInstance) {
                if (!appInstance || typeof appInstance.auth !== "function") return null;
                try {
                    const authInstance = appInstance.auth();
                    if (!authInstance) return null;
                    if (authInstance.currentUser) {
                        hasAccess = true;
                        return authInstance.currentUser;
                    }
                    if (firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence && typeof authInstance.setPersistence === "function") {
                        await authInstance.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () { return null; });
                    }
                    if (typeof authInstance.signInAnonymously !== "function") return null;
                    const credential = await authInstance.signInAnonymously();
                    if (credential && credential.user) hasAccess = true;
                    return credential;
                } catch (error) {
                    const rawCode = String((error && error.code) || "").trim().toLowerCase();
                    const rawMessage = String((error && error.message) || "").trim().toLowerCase();
                    if (rawCode === "auth/admin-restricted-operation" || rawCode === "auth/operation-not-allowed" || rawMessage.indexOf("admin-restricted-operation") >= 0) {
                        return null;
                    }
                    console.warn("Khong mo duoc quyen ghi catalog shard:", error);
                    return null;
                }
            }));

            return hasAccess;
        })();

        return service.catalogAccessPromise.finally(function () {
            service.catalogAccessPromise = null;
        });
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
        const pageSize = Math.max(8, Number(opts.pageSize || DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE);

        await service.ensureReady();
        if (service.catalogLoadState.loading) {
            const cachedWhileBusy = getCatalogCache();
            return Object.assign({}, cachedWhileBusy, { source: "cache" });
        }

        service.catalogLoadState.loading = true;

        try {
            const detailWarmupPromise = startProductDetailWarmup(reset);
            if (isMultiCatalogShardEnabled()) {
                const cachedMulti = getCatalogCache();
                const currentOffset = reset ? 0 : Number((cachedMulti.cursor && cachedMulti.cursor.offset) || (cachedMulti.products || []).length || 0);
                const queryResult = await loadMergedCatalogRows("catalog_public", {
                    limitPerShard: Math.max(pageSize, currentOffset + pageSize)
                });
                const pageProducts = queryResult.rows
                    .slice(currentOffset, currentOffset + pageSize)
                    .map(function (row) { return normalizeCloudProductNode(row.key, row.node); })
                    .filter(Boolean);
                const mergedProducts = mergeProductLists(reset ? [] : cachedMulti.products, pageProducts);
                const saved = setCatalogCache({
                    products: mergedProducts,
                    cursor: { offset: currentOffset + pageProducts.length },
                    hasMore: !!queryResult.maybeMore || (currentOffset + pageProducts.length) < queryResult.rows.length,
                    lastDeltaTs: Number(queryResult.highestTs || 0) || 0,
                    lastMetaTs: Number(queryResult.highestTs || 0) || 0,
                    catalogSource: queryResult.config.source
                });
                saveCatalogSourcePreference(queryResult.config.source);
                attachCatalogLiveBindings(queryResult.config.source);
                applyProductDetailWarmupToCatalog(detailWarmupPromise);
                return Object.assign({}, saved, {
                    pageProducts: pageProducts,
                    source: "firebase"
                });
            }
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
            applyProductDetailWarmupToCatalog(detailWarmupPromise);
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
            if (isMultiCatalogShardEnabled()) {
                const cachedMulti = getCatalogCache();
                const requestedPageSize = Math.max((cachedMulti.products || []).length || 0, pageSize, DEFAULT_PAGE_SIZE);
                return service.loadCatalogPage({ reset: true, pageSize: requestedPageSize });
            }
            const detailWarmupPromise = startProductDetailWarmup(!!opts.force);
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
            applyProductDetailWarmupToCatalog(detailWarmupPromise);

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

        if (service.catalogMetaBound || !service.getCatalogDb()) return;
        service.catalogMetaBound = true;
        service.catalogMetaRef = service.getCatalogDb().ref("metadata/last_update_products");
        service.catalogMetaHandler = function (snapshot) {
            const nextMetaTs = Number(snapshot.val() || 0) || 0;
            const cached = getCatalogCache();
            if (nextMetaTs && nextMetaTs > Number(cached.lastMetaTs || 0)) {
                productDetailState.loadedAt = 0;
                setCatalogCache(Object.assign({}, cached, { lastMetaTs: nextMetaTs }));
                ensureProductDetailSheet(true).then(function () {
                    const nextCache = refreshCatalogCacheWithProductDetails();
                    notifyCatalogSubscribers({
                        type: "catalog-detail",
                        ts: nextMetaTs,
                        source: readCatalogSourcePreference(),
                        products: nextCache.products
                    });
                }).catch(function () { return null; });
                notifyCatalogSubscribers({
                    type: "catalog-meta",
                    ts: nextMetaTs,
                    source: readCatalogSourcePreference()
                });
            }
        };
        service.catalogMetaRef.on("value", service.catalogMetaHandler, function () {});
    };

    service.subscribeAccountMeta = async function (onChange) {
        await service.ensureReady();
        if (typeof onChange === "function" && service.accountMetaSubscribers.indexOf(onChange) === -1) {
            service.accountMetaSubscribers.push(onChange);
        }
        if (!service.liveAccountAuthBound && service.getAuth()) {
            service.liveAccountAuthBound = true;
            service.liveAccountAuthUnsubscribe = service.getAuth().onAuthStateChanged(function (user) {
                if (!user || user.isAnonymous) {
                    detachCurrentAccountLiveBindings();
                    notifyAccountMetaSubscribers({ type: "account-signout" });
                    return;
                }
                bindCurrentAccountLiveBindings(user).catch(function () { return null; });
            });
        }
        bindCurrentAccountLiveBindings().catch(function () { return null; });
        if (service.accountMetaBound || !service.getPrimaryDb()) return;

        service.accountMetaBound = true;
        [
            { type: "orders-meta", key: "orders", path: "metadata/last_update_orders" },
            { type: "customers-meta", key: "customers", path: "metadata/last_update_customers" }
        ].forEach(function (entry) {
            try {
                service.getPrimaryDb().ref(entry.path).on("value", function (snapshot) {
                    const nextTs = Number(snapshot && snapshot.val() || 0) || 0;
                    const prevTs = Number((service.accountMetaTs && service.accountMetaTs[entry.key]) || 0) || 0;
                    if (!nextTs) return;
                    service.accountMetaTs[entry.key] = nextTs;
                    if (!prevTs || nextTs <= prevTs) return;
                    if (entry.key === "customers") {
                        bindCurrentAccountLiveBindings().catch(function () { return null; });
                    }
                    notifyAccountMetaSubscribers({
                        type: entry.type,
                        ts: nextTs
                    });
                }, function () {});
            } catch (error) {}
        });
    };

    service.waitForAuthUser = async function (timeoutMs) {
        await service.ensureCoreReady();
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

        if (resolvedProfile) {
            resolvedProfile.orders = [];
            if (isInactiveCustomerStatus(resolvedProfile.status)) {
                resolvedProfile.restrictedData = true;
                service.saveCachedOrders(safeAuthUser.uid, []);
            }
            service.saveCachedCustomer(resolvedProfile);
        }
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
            group: DEFAULT_WEB_CUSTOMER_GROUP,
            status: "Hoạt động",
            bio: "An tam chon do tot cho be moi ngay.",
            gender: "Chua cap nhat",
            birthday: "",
            maritalStatus: "Chua cap nhat",
            age: "",
            interests: [],
            concerns: [],
            favoriteProducts: [],
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
            await service.ensureCoreReady();
            const authUser = await service.waitForAuthUser();
            if (!authUser || authUser.isAnonymous) return { user: null, profile: null };

            let profile = await service.resolveCustomerProfile(authUser, { force: true });
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
        await service.ensureCoreReady();
        const authUser = (options && options.authUser) || await service.waitForAuthUser();
        if (!authUser) throw new Error("not-authenticated");

        const existing = await service.resolveCustomerProfile(authUser, { force: true });
        const merged = Object.assign({}, existing || {}, profileData || {});
        const customerId = String(merged.customerId || merged.id || "").trim() || ("KHW" + String(Date.now()).slice(-9));
        const protectedContacts = resolveLockedProfileContacts(authUser, existing, merged);
        const safeProfile = Object.assign({}, merged, {
            customerId: customerId,
            authUid: authUser.uid,
            email: protectedContacts.email,
            phone: protectedContacts.phone,
            loginMethod: protectedContacts.loginMethod,
            group: String(merged.group || DEFAULT_WEB_CUSTOMER_GROUP).trim(),
            status: normalizeCustomerStatus(merged.status || "Hoạt động"),
            bio: String(merged.bio || (existing && existing.bio) || "An tam chon do tot cho be moi ngay.").trim(),
            gender: String(merged.gender || (existing && existing.gender) || "Chua cap nhat").trim(),
            birthday: String(merged.birthday || (existing && existing.birthday) || "").trim(),
            maritalStatus: String(merged.maritalStatus || (existing && existing.maritalStatus) || "Chua cap nhat").trim(),
            age: String(merged.age || (existing && existing.age) || "").trim(),
            interests: normalizeTextList(merged.interests || (existing && existing.interests) || []),
            concerns: normalizeTextList(merged.concerns || (existing && existing.concerns) || []),
            favoriteProducts: normalizeTextList(merged.favoriteProducts || (existing && existing.favoriteProducts) || []),
            zalo: String(merged.zalo || (existing && existing.zalo) || "").trim(),
            personalInfo: String(merged.personalInfo || (existing && existing.personalInfo) || "Thiet lap ngay").trim(),
            avatar: String(merged.avatar || (existing && existing.avatar) || "").trim(),
            facebook: String(merged.facebook || (existing && existing.facebook) || "").trim(),
            totalDebt: Number(merged.totalDebt || 0) || 0,
            paidDebt: Number(merged.paidDebt || 0) || 0,
            totalOrders: Number(merged.totalOrders || 0) || 0,
            totalBuy: Number(merged.totalBuy || 0) || 0,
            payments: Array.isArray(merged.payments) ? merged.payments : [],
            addresses: ensureAddressList(merged.addresses, merged.address, customerId, merged.shippingPhone || merged.phone || protectedContacts.phone),
            shippingPhone: String(merged.shippingPhone || (existing && existing.shippingPhone) || merged.phone || protectedContacts.phone || "").trim()
        });
        const customerPayload = buildCustomerWritePayload(customerId, authUser.uid, safeProfile, {
            updatedTs: Number((options && options.updatedTs) || safeProfile.updatedTs || Date.now()) || Date.now(),
            includeFinance: !!(options && options.includeFinance),
            includeSecurity: typeof (options && options.includeSecurity) === "boolean"
                ? !!options.includeSecurity
                : !(existing && existing.customerId),
            passwordForSync: String((options && options.passwordForSync) || (profileData && profileData.pass) || "").trim()
        });
        const primaryDb = service.getPrimaryDb();
        await primaryDb.ref().update(customerPayload.updates);
        service.saveCachedCustomer(customerPayload.profile);
        return customerPayload.profile;
    };

    service.ensureCheckoutAuthUser = async function () {
        await service.ensureCoreReady();
        const auth = service.getAuth();
        if (!auth) return null;
        if (auth.currentUser) return auth.currentUser;
        if (typeof auth.signInAnonymously !== "function") {
            throw new Error("anonymous-auth-unavailable");
        }
        const credential = await auth.signInAnonymously();
        return (credential && credential.user) || auth.currentUser || null;
    };

    service.loginWithGoogle = async function () {
        await service.ensureCoreReady();
        const auth = service.getAuth();
        if (!auth || !firebase.auth || typeof firebase.auth.GoogleAuthProvider !== "function") {
            throw new Error("google-provider-unavailable");
        }
        if (auth.currentUser && auth.currentUser.isAnonymous) {
            try { await auth.signOut(); } catch (error) {}
        }

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope("email");
        provider.addScope("profile");
        if (typeof provider.setCustomParameters === "function") {
            provider.setCustomParameters({ prompt: "select_account" });
        }

        const credential = await auth.signInWithPopup(provider);
        const authUser = (credential && credential.user) || auth.currentUser || null;
        if (!authUser) throw new Error("google-auth-failed");

        let profile = await service.resolveCustomerProfile(authUser, { force: true });
        if (!profile) {
            try {
                profile = await service.ensureCustomerProfile({
                    name: authUser.displayName || "",
                    email: authUser.email || "",
                    phone: "",
                    address: ""
                });
            } catch (error) {
                const rawMessage = String((error && (error.code || error.message)) || "").toLowerCase();
                if (rawMessage.indexOf("permission") === -1 && rawMessage.indexOf("denied") === -1) throw error;
                profile = buildLocalFallbackProfile({
                    customerId: readStorage(STORAGE_KEYS.customerId, "") || ("KHW" + String(Date.now()).slice(-9)),
                    authUid: authUser.uid,
                    name: authUser.displayName || "Khach le tu web",
                    email: authUser.email || buildFallbackEmail("", authUser),
                    phone: "",
                    shippingPhone: "",
                    address: "",
                    addresses: [],
                    updatedTs: Date.now()
                }, authUser);
                service.saveCachedCustomer(profile);
            }
        }

        return {
            authUser: authUser,
            profile: profile,
            isNewUser: !!(credential && credential.additionalUserInfo && credential.additionalUserInfo.isNewUser)
        };
    };

    service.registerWithGoogle = async function () {
        return service.loginWithGoogle();
    };

    async function postGasJsonPayload_(gasUrl, payload) {
        const response = await fetch(gasUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload || {})
        });
        const text = await response.text();
        let result = {};
        try {
            result = text ? JSON.parse(text) : {};
        } catch (error) {
            throw new Error("guest-order-json-invalid");
        }
        if (!response.ok || result.status !== "success") {
            throw new Error(String(result.message || "guest-order-failed"));
        }
        return result;
    }

    async function submitGuestOrderViaGas_(payload) {
        throw new Error("firebase-only-order-storage");
    }

    function isPermissionDeniedError_(error) {
        const rawCode = String((error && error.code) || "").trim().toLowerCase();
        const rawMessage = String((error && error.message) || "").trim().toLowerCase();
        const joined = rawCode + " " + rawMessage;
        return joined.indexOf("permission") >= 0 || joined.indexOf("denied") >= 0;
    }

    function mergeOrderListsById_(baseOrders, nextOrders) {
        const mergedMap = {};
        []
            .concat(Array.isArray(baseOrders) ? baseOrders : [])
            .concat(Array.isArray(nextOrders) ? nextOrders : [])
            .forEach(function (order) {
                if (!order || !order.id) return;
                const current = mergedMap[order.id] || {};
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

    function reconcileOrderListsWithCloud_(cachedOrders, cloudOrders) {
        const safeCloudOrders = Array.isArray(cloudOrders) ? cloudOrders : [];
        const cloudIds = new Set(safeCloudOrders.map(function (order) {
            return String((order && order.id) || "").trim();
        }).filter(Boolean));
        const preservedCachedOrders = (Array.isArray(cachedOrders) ? cachedOrders : []).filter(function (order) {
            const safeOrderId = String((order && order.id) || "").trim();
            if (!safeOrderId) return false;
            if (cloudIds.has(safeOrderId)) return true;
            const storageMode = String((order && order.storageMode) || "").trim().toLowerCase();
            const isPersisted = typeof (order && order.persisted) === "boolean"
                ? !!order.persisted
                : storageMode !== "gas-fallback";
            return !isPersisted || storageMode === "gas-fallback";
        });
        return mergeOrderListsById_(preservedCachedOrders, safeCloudOrders);
    }

    function saveMergedOrderSummary_(authUid, summary) {
        const cached = service.getCachedOrders();
        const baseOrders = cached && String(cached.authUid || "") === String(authUid || "") && Array.isArray(cached.orders)
            ? cached.orders
            : [];
        const nextOrders = mergeOrderListsById_(baseOrders, [summary]);
        service.saveCachedOrders(authUid, nextOrders);
        return summary;
    }

    function buildOrderResult_(orderId, orderInfo, orderDetail, options) {
        const opts = options || {};
        const summary = normalizeOrderSummary(orderId, {
            in4: minifyData(orderInfo),
            ch_t: minifyData(orderDetail)
        });
        summary.persisted = opts.persisted !== false;
        summary.storageMode = String(opts.storageMode || (summary.persisted ? "firebase" : "gas-fallback")).trim();
        if (opts.ownerUid) summary.ownerUid = String(opts.ownerUid || "").trim();
        if (opts.customerAuthUid) summary.customerAuthUid = String(opts.customerAuthUid || "").trim();
        return {
            id: orderId,
            summary: summary,
            detail: {
                id: orderId,
                ownerUid: summary.ownerUid || "",
                note: String(orderDetail && orderDetail.note || "").trim(),
                items: Array.isArray(orderDetail && orderDetail.items)
                    ? orderDetail.items.map(function (item) { return normalizeOrderItem(item); })
                    : []
            },
            persisted: summary.persisted,
            storageMode: summary.storageMode
        };
    }

    async function postOrderViaGasBackend_(orderInfo) {
        throw new Error("firebase-only-order-storage");
    }

    function buildCachedOrderInfoFromSummary_(summary, authUser) {
        const safeSummary = summary && typeof summary === "object" ? summary : {};
        const safeAuthUid = String((authUser && authUser.uid) || safeSummary.ownerUid || safeSummary.customerAuthUid || "").trim();
        return {
            id: String(safeSummary.id || "").trim(),
            status: Number(safeSummary.rawStatus || 1) || 1,
            owner_uid: safeSummary.ownerUid || safeAuthUid,
            customer_auth_uid: safeSummary.customerAuthUid || safeAuthUid,
            customer_id: String(safeSummary.customerId || "").trim(),
            customer_name: String(safeSummary.customerName || "").trim(),
            phone: String(safeSummary.phone || "").trim(),
            subtotal: Number(safeSummary.subtotal || safeSummary.totalAmount || 0) || 0,
            discount_value: Number(safeSummary.discountValue || 0) || 0,
            discount_percent: Number(safeSummary.discountPercent || 0) || 0,
            shipping_fee: Number(safeSummary.shippingFee || 0) || 0,
            shipping_payer: String(safeSummary.shippingPayer || "shop").trim(),
            total_amount: Number(safeSummary.finalAmount || safeSummary.totalAmount || 0) || 0,
            paid_amount: Number(safeSummary.paidAmount || 0) || 0,
            debt: Number(safeSummary.debt || 0) || 0,
            source: String(safeSummary.source || DEFAULT_WEB_ORDER_SOURCE).trim(),
            shipping_info: safeSummary.shippingInfo || "",
            payment_method: String(safeSummary.paymentMethod || "pending").trim(),
            price_type: String(safeSummary.priceType || "gia_si_web").trim(),
            creator: String(safeSummary.creator || DEFAULT_WEB_ORDER_CREATOR).trim(),
            carrier: String(safeSummary.carrier || "web_si").trim(),
            tracking_code: String(safeSummary.trackingCode || "").trim(),
            note: String(safeSummary.note || "").trim(),
            date: String(safeSummary.date || new Date(Number(safeSummary.sortTs || Date.now()) || Date.now()).toLocaleString("vi-VN")).trim(),
            last_update: String(safeSummary.date || new Date().toLocaleString("vi-VN")).trim(),
            sort_ts: Number(safeSummary.sortTs || Date.now()) || Date.now()
        };
    }

    function buildCachedOrderDetailFromSummary_(summary) {
        const safeSummary = summary && typeof summary === "object" ? summary : {};
        return {
            note: String(safeSummary.note || "Don dat tu web").trim(),
            items: (Array.isArray(safeSummary.items) ? safeSummary.items : []).map(function (item) {
                const priceValue = Number((item && item.priceValue) || 0) || parseMoney(item && item.price || 0);
                const rootId = String((item && (item.rootId || item.id)) || "").trim();
                return {
                    id: rootId,
                    rootId: rootId,
                    code: String((item && item.code) || "").trim(),
                    name: String((item && item.name) || "San pham").trim(),
                    qty: Number((item && (item.quantity || item.qty)) || 1) || 1,
                    price: priceValue,
                    unit: String((item && item.unit) || "").trim(),
                    img: String((item && item.img) || "").trim(),
                    discount: 0,
                    discountType: "%",
                    variantInfo: String((item && item.variantInfo) || "").trim()
                };
            })
        };
    }

    service.registerCustomer = async function (payload) {
        const data = payload || {};
        await service.ensureCoreReady();
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
                status: "Hoạt động",
                maritalStatus: "Chưa cập nhật",
                age: "",
                interests: [],
                concerns: [],
                favoriteProducts: [],
                updatedTs: Date.now()
            }, {
                authUser: credential.user,
                updatedTs: Date.now(),
                includeSecurity: true,
                passwordForSync: safePassword
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
                    status: "Hoạt động",
                    maritalStatus: "Chưa cập nhật",
                    age: "",
                    interests: [],
                    concerns: [],
                    favoriteProducts: [],
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
        await service.ensureCoreReady();
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
        if (profile && isInactiveCustomerStatus(profile.status)) service.saveCachedOrders(credential.user.uid, []);

        return {
            authUser: credential.user,
            profile: profile
        };
    };

    service.requestPasswordReset = async function (identifier) {
        await service.ensureCoreReady();
        const safeIdentifier = String(identifier || "").trim().toLowerCase();
        if (!safeIdentifier) throw new Error("missing-reset-identifier");
        if (safeIdentifier.indexOf("@") < 0 || isPhoneAliasEmail(safeIdentifier)) {
            return { mode: "zalo", loginEmail: buildPhoneAlias(safeIdentifier), supportPhone: window.PASSWORD_RESET_ZALO_PHONE || window.STORE_ZALO_PHONE || window.STORE_CONTACT_PHONE || "" };
        }
        await service.getAuth().sendPasswordResetEmail(safeIdentifier);
        return { mode: "email", email: safeIdentifier };
    };

    service.changePassword = async function (currentPassword, nextPassword) {
        await service.ensureCoreReady();
        const authUser = await service.waitForAuthUser();
        if (!authUser || !authUser.email) throw new Error("not-authenticated");
        const safeCurrentPassword = String(currentPassword || "");
        const safeNextPassword = String(nextPassword || "");
        if (!safeCurrentPassword || !safeNextPassword) throw new Error("missing-password-fields");
        if (safeNextPassword.length < 6) throw new Error("weak-password");
        const credential = firebase.auth.EmailAuthProvider.credential(authUser.email, safeCurrentPassword);
        await authUser.reauthenticateWithCredential(credential);
        await authUser.updatePassword(safeNextPassword);
        const existingProfile = await service.resolveCustomerProfile(authUser, { force: true });
        await service.persistCustomerProfile(existingProfile || {}, {
            authUser: authUser,
            updatedTs: Date.now(),
            includeSecurity: true,
            passwordForSync: safeNextPassword
        });
        return true;
    };

    service.logout = async function () {
        await service.ensureCoreReady();
        try {
            await service.getAuth().signOut();
        } finally {
            try { localStorage.removeItem(STORAGE_KEYS.profile); } catch (error) {}
            try { localStorage.removeItem(STORAGE_KEYS.orders); } catch (error) {}
        }
    };

    service.updateCurrentCustomerProfile = async function (nextProfile) {
        await service.ensureCoreReady();
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

    service.hasLiveAccountBindings = function (authUid) {
        const safeAuthUid = String(authUid || "").trim();
        if (!safeAuthUid) return false;
        return service.liveOrdersAuthUid === safeAuthUid || service.liveCustomerAuthUid === safeAuthUid;
    };

    async function loadLegacyOrdersForAuthUid_(authUid, limit) {
        const safeAuthUid = String(authUid || "").trim();
        if (!safeAuthUid) return [];
        const snapshot = await service.getPrimaryDb()
            .ref("donhang/" + safeAuthUid)
            .orderByChild("in4/ts")
            .limitToLast(Math.max(Number(limit || DEFAULT_ORDER_LIMIT) || DEFAULT_ORDER_LIMIT, 10))
            .once("value");
        const orders = [];
        if (snapshot && snapshot.exists()) {
            snapshot.forEach(function (childSnapshot) {
                if (!childSnapshot || !childSnapshot.exists() || !childSnapshot.child("in4").exists()) return;
                orders.push(normalizeOrderSummary(childSnapshot.key, childSnapshot.val()));
            });
        }
        orders.sort(function (a, b) {
            return (Number(b.sortTs || 0) || 0) - (Number(a.sortTs || 0) || 0);
        });
        return orders;
    }

    const DEFAULT_WEB_ORDER_DISCOUNT_TIERS_ = [
        { amount: 1000000, percent: 1 },
        { amount: 5000000, percent: 3 }
    ];

    function getWebOrderDiscountTiers_() {
        const rawTiers = Array.isArray(window.WEB_NEW_ORDER_DISCOUNT_TIERS)
            ? window.WEB_NEW_ORDER_DISCOUNT_TIERS
            : DEFAULT_WEB_ORDER_DISCOUNT_TIERS_;
        return rawTiers.map(function (tier) {
            return {
                amount: Math.max(0, Number(tier && tier.amount || 0) || 0),
                percent: Math.max(0, Math.min(99, Number(tier && tier.percent || 0) || 0))
            };
        }).filter(function (tier) {
            return tier.amount > 0 && tier.percent > 0;
        }).sort(function (left, right) {
            return left.amount - right.amount;
        });
    }

    function getCheckoutDiscountPercentForSubtotal_(subtotal) {
        const safeSubtotal = Math.max(0, Number(subtotal || 0) || 0);
        let matchedPercent = 0;
        getWebOrderDiscountTiers_().forEach(function (tier) {
            if (safeSubtotal >= tier.amount) matchedPercent = tier.percent;
        });
        return matchedPercent;
    }

    async function loadTrustedCatalogProductForCheckout_(productId) {
        const safeProductId = String(productId || "").trim();
        if (!safeProductId) return null;

        const dbCandidates = getCatalogWriteDbCandidates_(true);

        for (let index = 0; index < dbCandidates.length; index += 1) {
            const db = dbCandidates[index];
            if (!db || typeof db.ref !== "function") continue;
            try {
                const snapshot = await db.ref("catalog_public/" + safeProductId).once("value");
                if (snapshot && snapshot.exists()) {
                    const normalized = normalizeCloudProductNode(safeProductId, snapshot.val());
                    if (normalized) return normalized;
                }
            } catch (error) {}
        }

        return findCatalogProductInCache(safeProductId);
    }

    async function normalizeCheckoutItemsAgainstCatalog_(rawItems) {
        const safeItems = Array.isArray(rawItems) ? rawItems : [];
        const normalizedItems = [];

        for (let index = 0; index < safeItems.length; index += 1) {
            const rawItem = safeItems[index] || {};
            const safeProductId = String(rawItem.rootId || rawItem.id || "").trim();
            if (!safeProductId) throw new Error("invalid-product-reference");
            const catalogProduct = await loadTrustedCatalogProductForCheckout_(safeProductId);
            if (!catalogProduct) throw new Error("product-unavailable");

            const minQty = Math.max(Number(catalogProduct.minQty || 1) || 1, 1);
            const quantity = Math.max(Number(rawItem.quantity || rawItem.qty || 1) || 1, minQty);
            const currentPriceValue = Math.max(0, Number(catalogProduct.priceValue || 0) || parseMoney(catalogProduct.price));
            const originalPriceValue = Math.max(Number(catalogProduct.originalPriceValue || 0) || parseMoney(catalogProduct.originalPrice), currentPriceValue);

            normalizedItems.push({
                id: safeProductId,
                rootId: safeProductId,
                code: String(catalogProduct.code || rawItem.code || safeProductId).trim(),
                name: String(catalogProduct.name || rawItem.name || "San pham").trim(),
                qty: quantity,
                price: currentPriceValue,
                unit: String(catalogProduct.unit || rawItem.unit || "").trim(),
                img: String(catalogProduct.img || rawItem.img || "").trim(),
                discount: 0,
                discountType: "%",
                variantInfo: String(rawItem.variantInfo || "").trim(),
                priceValue: currentPriceValue,
                originalPriceValue: originalPriceValue
            });
        }

        return normalizedItems;
    }

    function computeCheckoutAmountsFromItems_(items, payload) {
        const safeItems = Array.isArray(items) ? items : [];
        const shippingFee = Math.max(0, Number(payload && payload.shippingFee || 0) || 0);
        const vatRate = Math.max(0, Number(payload && payload.vatRate || 0) || 0);
        const subtotal = safeItems.reduce(function (sum, item) {
            return sum + ((Number(item && item.priceValue || item && item.price || 0) || 0) * (Number(item && item.qty || 1) || 1));
        }, 0);
        const originalAmount = safeItems.reduce(function (sum, item) {
            const currentPrice = Number(item && item.priceValue || item && item.price || 0) || 0;
            const originalPrice = Math.max(Number(item && item.originalPriceValue || 0) || 0, currentPrice);
            return sum + (originalPrice * (Number(item && item.qty || 1) || 1));
        }, 0);
        const productDiscountValue = Math.max(0, originalAmount - subtotal);
        const discountPercent = getCheckoutDiscountPercentForSubtotal_(subtotal);
        const discountValue = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
        const finalAmount = Math.max(0, subtotal - discountValue + shippingFee);
        return {
            subtotal: subtotal,
            originalAmount: originalAmount,
            productDiscountValue: productDiscountValue,
            discountPercent: discountPercent,
            discountValue: discountValue,
            shippingFee: shippingFee,
            vatRate: vatRate,
            finalAmount: finalAmount
        };
    }

    async function loadMirroredOrdersForAuthUid_(authUid, limit) {
        const safeAuthUid = String(authUid || "").trim();
        if (!safeAuthUid) return [];
        const snapshot = await service.getPrimaryDb()
            .ref(getOrderSummaryBucketPath(safeAuthUid))
            .orderByChild("ts")
            .limitToLast(Math.max(Number(limit || DEFAULT_ORDER_LIMIT) || DEFAULT_ORDER_LIMIT, 10))
            .once("value");
        const orders = [];
        if (snapshot && snapshot.exists()) {
            snapshot.forEach(function (childSnapshot) {
                orders.push(normalizeOrderSummaryFromMirror(childSnapshot.key, childSnapshot.val()));
            });
        }
        orders.sort(function (a, b) {
            return (Number(b.sortTs || 0) || 0) - (Number(a.sortTs || 0) || 0);
        });
        return orders;
    }

    async function cleanupStaleMirroredOrders_(authUid, authoritativeOrders, limit) {
        const safeAuthUid = String(authUid || "").trim();
        if (!safeAuthUid) return;
        try {
            const legacyOrderIds = new Set((Array.isArray(authoritativeOrders) ? authoritativeOrders : []).map(function (order) {
                return String((order && order.id) || "").trim();
            }).filter(Boolean));
            const mirroredOrders = await loadMirroredOrdersForAuthUid_(safeAuthUid, limit);
            const staleOrderIds = mirroredOrders.map(function (order) {
                return String((order && order.id) || "").trim();
            }).filter(function (orderId) {
                return orderId && !legacyOrderIds.has(orderId);
            });
            if (!staleOrderIds.length) return;
            await Promise.all(staleOrderIds.map(function (orderId) {
                return removeOrderSummaryMirror_(safeAuthUid, orderId).catch(function () { return null; });
            }));
        } catch (error) {}
    }

    service.loadOrders = async function (options) {
        const opts = options || {};
        await service.ensureReady();
        const authUser = await service.waitForAuthUser();
        if (!authUser) return [];

        const profile = await service.resolveCustomerProfile(authUser, { force: !!opts.force });
        if (profile && isInactiveCustomerStatus(profile.status)) {
            service.saveCachedOrders(authUser.uid, []);
            return [];
        }

        const cached = service.getCachedOrders();
        if (!opts.force && cached && String(cached.authUid || "") === String(authUser.uid) && Array.isArray(cached.orders)) {
            return cached.orders;
        }

        const limit = Math.max(Number(opts.limit || DEFAULT_ORDER_LIMIT) || DEFAULT_ORDER_LIMIT, 10);
        let orders = [];
        let loadedFromLegacy = false;
        try {
            orders = await loadLegacyOrdersForAuthUid_(authUser.uid, limit);
            loadedFromLegacy = true;
        } catch (error) {
            orders = await loadMirroredOrdersForAuthUid_(authUser.uid, limit);
        }
        if (loadedFromLegacy) {
            cleanupStaleMirroredOrders_(authUser.uid, orders, limit).catch(function () { return null; });
        }

        const mergedOrders = cached && String(cached.authUid || "") === String(authUser.uid) && Array.isArray(cached.orders)
            ? reconcileOrderListsWithCloud_(cached.orders, orders)
            : orders;
        service.saveCachedOrders(authUser.uid, mergedOrders);
        return mergedOrders;
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
        const fallbackDetail = cachedOrder
            ? {
                id: orderId,
                ownerUid: ownerUid,
                note: String(cachedOrder.note || "").trim(),
                items: Array.isArray(cachedOrder.items) ? cachedOrder.items : []
            }
            : null;
        try {
            const snapshot = await service.getPrimaryDb().ref("donhang/" + ownerUid + "/" + orderId + "/ch_t").once("value");
            if (!snapshot.exists()) return fallbackDetail;
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
        } catch (error) {
            if (fallbackDetail) return fallbackDetail;
            throw error;
        }
    };

    async function touchOrdersMetaTimestamp_(timestamp) {
        const safeTimestamp = Number(timestamp || Date.now()) || Date.now();
        try {
            await service.getPrimaryDb().ref("metadata/last_update_orders").set(safeTimestamp);
        } catch (error) {
            console.warn("Khong cap nhat duoc metadata don hang:", error);
        }
    }

    service.cancelOrder = async function (orderId) {
        await service.ensureReady();
        const authUser = await service.waitForAuthUser();
        if (!authUser || !orderId) throw new Error("not-authenticated");

        const hasCatalogAccess = await service.ensureCatalogAccess().catch(function () {
            return false;
        });
        const orderBaseRef = service.getPrimaryDb().ref("donhang/" + authUser.uid + "/" + orderId);
        const snapshot = await orderBaseRef.once("value");
        if (!snapshot.exists()) throw new Error("order-not-found");

        const rawInfo = unminifyData((snapshot.child("in4").val()) || {});
        const rawStatus = Number(rawInfo.status || rawInfo.st || 0) || 0;
        if (rawStatus !== 1) throw new Error("order-not-cancellable");
        if (String(rawInfo.owner_uid || rawInfo.ou || "").trim() !== String(authUser.uid || "").trim()) {
            throw new Error("permission-denied");
        }
        if (String(rawInfo.customer_auth_uid || rawInfo.cau || "").trim() !== String(authUser.uid || "").trim()) {
            throw new Error("permission-denied");
        }

        const detail = unminifyData((snapshot.child("ch_t").val()) || {});
        const nextInfo = Object.assign({}, rawInfo, {
            status: 5,
            last_update: new Date().toLocaleString("vi-VN")
        });
        await orderBaseRef.child("in4").set(minifyData(nextInfo));
        await writeOrderSummaryMirror_(authUser.uid, orderId, nextInfo);
        await touchOrdersMetaTimestamp_(Date.now());

        const pendingMap = buildPendingReservationMap(Array.isArray(detail.items) ? detail.items : []);
        const revertMap = {};
        Object.keys(pendingMap).forEach(function (productId) {
            revertMap[productId] = -Math.max(Number(pendingMap[productId] || 0) || 0, 0);
        });
        await syncPendingReservationDelta(revertMap, Date.now(), hasCatalogAccess);
        applyPendingReservationDeltaToCatalog(revertMap, Date.now());

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

    service.updateOrder = async function (orderId, payload) {
        const data = payload || {};
        await service.ensureReady();
        const authUser = await service.ensureCheckoutAuthUser();
        if (!authUser || !orderId) throw new Error("not-authenticated");
        const hasCatalogAccess = await service.ensureCatalogAccess().catch(function () {
            return false;
        });

        const orderBaseRef = service.getPrimaryDb().ref("donhang/" + authUser.uid + "/" + orderId);
        const cachedOrders = service.getCachedOrders();
        const cachedOrder = cachedOrders && String(cachedOrders.authUid || "") === String(authUser.uid || "") && Array.isArray(cachedOrders.orders)
            ? cachedOrders.orders.find(function (order) { return String((order && order.id) || "") === String(orderId || ""); })
            : null;
        let snapshot = null;
        let hasFirebaseSnapshot = false;
        try {
            snapshot = await orderBaseRef.once("value");
            hasFirebaseSnapshot = !!(snapshot && snapshot.exists());
        } catch (error) {
            if (!isPermissionDeniedError_(error)) throw error;
        }
        if (!hasFirebaseSnapshot && !cachedOrder) throw new Error("order-not-found");

        const rawInfo = hasFirebaseSnapshot
            ? unminifyData((snapshot.child("in4").val()) || {})
            : buildCachedOrderInfoFromSummary_(cachedOrder, authUser);
        const rawDetail = hasFirebaseSnapshot
            ? unminifyData((snapshot.child("ch_t").val()) || {})
            : buildCachedOrderDetailFromSummary_(cachedOrder);
        const rawStatus = Number(rawInfo.status || rawInfo.st || 0) || 0;
        if (rawStatus !== 1) throw new Error("order-not-editable");
        if (String(rawInfo.owner_uid || rawInfo.ou || authUser.uid || "").trim() !== String(authUser.uid || "").trim()) {
            throw new Error("permission-denied");
        }
        if (String(rawInfo.customer_auth_uid || rawInfo.cau || authUser.uid || "").trim() !== String(authUser.uid || "").trim()) {
            throw new Error("permission-denied");
        }

        const rawItems = Array.isArray(data.items) ? data.items : [];
        if (!rawItems.length) throw new Error("empty-cart");

        let profile = service.getCachedCustomer ? service.getCachedCustomer() : null;
        if (!profile || String((profile && profile.authUid) || "") !== String(authUser.uid || "")) {
            try {
                profile = await service.resolveCustomerProfile(authUser, { force: false });
            } catch (error) {
                profile = null;
            }
        }

        const sortTs = Date.now();
        const lastUpdateText = new Date(sortTs).toLocaleString("vi-VN");
        const previousFinalAmount = Number(rawInfo.total_amount || 0) || 0;
        const previousPaidAmount = Number(rawInfo.paid_amount || 0) || 0;
        const previousDebt = Number(rawInfo.debt || Math.max(previousFinalAmount - previousPaidAmount, 0)) || 0;
        const safeName = String(data.customerName || rawInfo.customer_name || (profile && profile.name) || DEFAULT_WEB_GUEST_NAME).trim();
        const safePhone = String(data.phone || rawInfo.phone || (profile && profile.shippingPhone) || (profile && profile.phone) || "").trim();
        const safeAddress = String(data.address || rawInfo.shipping_info || (profile && profile.address) || "").trim();
        const safeEmail = String(data.email || (profile && profile.email) || buildFallbackEmail(safePhone, authUser)).trim();
        const safeNote = String(data.note || rawInfo.note || "").trim();
        const items = await normalizeCheckoutItemsAgainstCatalog_(rawItems);
        const amounts = computeCheckoutAmountsFromItems_(items, data);
        const subtotal = amounts.subtotal;
        const discountPercent = amounts.discountPercent;
        const discountValue = amounts.discountValue;
        const finalAmount = amounts.finalAmount;
        const paidAmount = Number(data.paidAmount || rawInfo.paid_amount || 0) || 0;
        const debtAmount = Math.max(finalAmount - paidAmount, 0);
        const customerId = String(rawInfo.customer_id || (profile && profile.customerId) || readStorage(STORAGE_KEYS.customerId, "") || ("KHW" + String(sortTs).slice(-9))).trim();

        const nextInfo = Object.assign({}, rawInfo, {
            id: String(rawInfo.id || orderId || "").trim(),
            last_update: lastUpdateText,
            note: safeNote || rawInfo.note || "Don hang tu web",
            status: 1,
            customer_id: customerId,
            customer_name: safeName,
            customer_auth_uid: authUser.uid,
            owner_uid: authUser.uid,
            phone: safePhone,
            subtotal: subtotal,
            discount: discountValue,
            discount_value: discountValue,
            discount_percent: discountPercent,
            shipping_fee: amounts.shippingFee,
            shipping_payer: String(data.shippingPayer || rawInfo.shipping_payer || "shop").trim(),
            vat_rate: amounts.vatRate || (Number(rawInfo.vat_rate || 0) || 0),
            total_amount: finalAmount,
            paid_amount: paidAmount,
            debt: debtAmount,
            debt_before: Math.max((Number((profile && profile.totalDebt) || 0) || 0) - previousDebt, 0),
            debt_after: Math.max((Number((profile && profile.totalDebt) || 0) || 0) - previousDebt, 0) + debtAmount,
            shipping_info: safeAddress,
            payment_method: String(data.paymentMethod || rawInfo.payment_method || "pending").trim(),
            price_type: String(data.priceType || rawInfo.price_type || "gia_si_web").trim(),
            source: String(rawInfo.source || DEFAULT_WEB_ORDER_SOURCE).trim(),
            creator: String(rawInfo.creator || DEFAULT_WEB_ORDER_CREATOR).trim(),
            sort_ts: Number(rawInfo.sort_ts || 0) || Number(rawInfo.ts || 0) || sortTs
        });
        const nextDetail = {
            items: items,
            note: safeNote || rawDetail.note || "Don dat tu web"
        };

        const previousPendingMap = buildPendingReservationMap(Array.isArray(rawDetail.items) ? rawDetail.items : []);
        const nextPendingMap = buildPendingReservationMap(items);
        const deltaMap = {};
        Object.keys(Object.assign({}, previousPendingMap, nextPendingMap)).forEach(function (productId) {
            const previousQty = Number(previousPendingMap[productId] || 0) || 0;
            const nextQty = Number(nextPendingMap[productId] || 0) || 0;
            const delta = nextQty - previousQty;
            if (delta !== 0) deltaMap[productId] = delta;
        });

        try {
            if (!hasFirebaseSnapshot) throw new Error("order-write-fallback");
            await orderBaseRef.child("in4").set(minifyData(nextInfo));
            await orderBaseRef.child("ch_t").set(minifyData(nextDetail));
            await writeOrderSummaryMirror_(authUser.uid, orderId, nextInfo);
            await touchOrdersMetaTimestamp_(sortTs);
            await syncPendingReservationDelta(deltaMap, sortTs, hasCatalogAccess);
            applyPendingReservationDeltaToCatalog(deltaMap, sortTs);
        } catch (error) {
            if (!isPermissionDeniedError_(error) && String((error && error.message) || "") !== "order-write-fallback") {
                throw error;
            }
            await postOrderViaGasBackend_(Object.assign({}, nextInfo, {
                items: items,
                note: nextDetail.note
            }));
            applyPendingReservationDeltaToCatalog(deltaMap, sortTs);
            writeStorage(STORAGE_KEYS.customerId, customerId);
            const fallbackResult = buildOrderResult_(orderId, nextInfo, nextDetail, {
                persisted: false,
                storageMode: "gas-fallback",
                ownerUid: authUser.uid,
                customerAuthUid: authUser.uid
            });
            saveMergedOrderSummary_(authUser.uid, fallbackResult.summary);
            return fallbackResult;
        }

        writeStorage(STORAGE_KEYS.customerId, customerId);

        try {
            await service.persistCustomerProfile({
                customerId: customerId,
                authUid: authUser.uid,
                name: safeName,
                phone: String((profile && profile.phone) || safePhone).trim(),
                shippingPhone: safePhone,
                email: safeEmail,
                address: safeAddress,
                addresses: ensureAddressList((profile && profile.addresses) || [], safeAddress, customerId, safePhone),
                totalOrders: Number((profile && profile.totalOrders) || 0) || 0,
                totalBuy: Math.max(0, (Number((profile && profile.totalBuy) || 0) || 0) - previousFinalAmount + finalAmount),
                totalDebt: Math.max(0, (Number((profile && profile.totalDebt) || 0) || 0) - previousDebt + debtAmount),
                paidDebt: Number((profile && profile.paidDebt) || 0) || 0,
                payments: Array.isArray(profile && profile.payments) ? profile.payments : [],
                updatedTs: sortTs
            }, {
                authUser: authUser,
                updatedTs: sortTs,
                includeSecurity: !(profile && profile.customerId)
            });
        } catch (error) {
            console.warn("Customer profile sync after order update failed:", error);
        }

        const successResult = buildOrderResult_(orderId, nextInfo, nextDetail, {
            persisted: true,
            storageMode: "firebase",
            ownerUid: authUser.uid,
            customerAuthUid: authUser.uid
        });
        saveMergedOrderSummary_(authUser.uid, successResult.summary);
        return successResult;
    };

    service.submitOrder = async function (payload) {
        const data = payload || {};
        await service.ensureReady();
        const authUser = await service.ensureCheckoutAuthUser();
        if (!authUser) {
            return submitGuestOrderViaGas_(data);
        }
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
        const safeName = String(data.customerName || profile.name || DEFAULT_WEB_GUEST_NAME).trim();
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
            source: isAnonymousOrder ? DEFAULT_WEB_ORDER_SOURCE_GUEST : DEFAULT_WEB_ORDER_SOURCE,
            shipping_info: safeAddress,
            payment_method: String(data.paymentMethod || "pending").trim(),
            carrier: isAnonymousOrder ? "web_si_guest" : "web_si",
            creator: isAnonymousOrder ? DEFAULT_WEB_ORDER_CREATOR_GUEST : DEFAULT_WEB_ORDER_CREATOR,
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
        await writeOrderSummaryMirror_(authUser.uid, orderId, orderInfo);
        await touchOrdersMetaTimestamp_(sortTs);

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
        if (!authUser) {
            return submitGuestOrderViaGas_(data);
        }
        const hasCatalogAccess = await service.ensureCatalogAccess().catch(function () {
            return false;
        });

        let profile = service.getCachedCustomer ? service.getCachedCustomer() : null;
        if (!profile || String((profile && profile.authUid) || "").trim() !== String((authUser && authUser.uid) || "").trim()) {
            try {
                profile = await service.resolveCustomerProfile(authUser, { force: false });
            } catch (error) {
                profile = null;
            }
        }

        if (!profile) {
            try {
                profile = await service.ensureCustomerProfile({
                    name: data.customerName || authUser.displayName || "",
                    email: data.email || authUser.email || "",
                    phone: data.phone || "",
                    address: data.address || ""
                });
            } catch (error) {
                if (!isPermissionDeniedError_(error)) throw error;
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

        const rawItems = Array.isArray(data.items) ? data.items : [];
        if (!rawItems.length) throw new Error("empty-cart");

        const now = new Date();
        const sortTs = Date.now();
        const orderId = "DH" + String(sortTs).slice(-10);
        const isAnonymousOrder = !!authUser.isAnonymous;
        const fallbackCustomerId = String((profile && profile.customerId) || readStorage(STORAGE_KEYS.customerId, "") || ("KHW" + String(sortTs).slice(-9))).trim();
        const safeName = String(data.customerName || (profile && profile.name) || DEFAULT_WEB_GUEST_NAME).trim();
        const safePhone = String(data.phone || (profile && profile.shippingPhone) || (profile && profile.phone) || "").trim();
        const safeAddress = String(data.address || (profile && profile.address) || "").trim();
        const safeEmail = String(data.email || (profile && profile.email) || buildFallbackEmail(safePhone, authUser)).trim();
        const safeNote = String(data.note || "").trim();
        const items = await normalizeCheckoutItemsAgainstCatalog_(rawItems);
        const amounts = computeCheckoutAmountsFromItems_(items, data);
        const subtotal = amounts.subtotal;
        const discountPercent = amounts.discountPercent;
        const discountValue = amounts.discountValue;
        const finalAmount = amounts.finalAmount;
        const paidAmount = Number(data.paidAmount || 0) || 0;
        const oldDebt = Number((profile && profile.totalDebt) || 0) || 0;
        const debtAmount = Math.max(finalAmount - paidAmount, 0);
        const nextDebt = oldDebt + debtAmount;
        const dateText = now.toLocaleString("vi-VN");

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
            shipping_fee: amounts.shippingFee,
            shipping_payer: String(data.shippingPayer || "shop").trim(),
            vat_rate: amounts.vatRate,
            total_amount: finalAmount,
            paid_amount: paidAmount,
            debt: debtAmount,
            old_debt: oldDebt,
            debt_before: oldDebt,
            debt_after: nextDebt,
            source: isAnonymousOrder ? DEFAULT_WEB_ORDER_SOURCE_GUEST : DEFAULT_WEB_ORDER_SOURCE,
            shipping_info: safeAddress,
            payment_method: String(data.paymentMethod || "pending").trim(),
            carrier: isAnonymousOrder ? "web_si_guest" : "web_si",
            creator: isAnonymousOrder ? DEFAULT_WEB_ORDER_CREATOR_GUEST : DEFAULT_WEB_ORDER_CREATOR,
            price_type: String(data.priceType || "gia_si_web").trim(),
            hour: now.getHours()
        };
        const orderDetail = {
            items: items,
            note: safeNote || "Don dat tu web"
        };

        const pendingReservationMap = buildPendingReservationMap(items);
        const orderBaseRef = service.getPrimaryDb().ref("donhang/" + authUser.uid + "/" + orderId);
        const pendingReservationSync = await attemptDirectPendingReservationSync_(pendingReservationMap, sortTs, hasCatalogAccess);
        if (pendingReservationSync.state !== "not_required") {
            orderInfo.pending_reservation_state = pendingReservationSync.state;
            orderInfo.pending_reservation_requested_ts = sortTs;
            if (pendingReservationSync.processedTs) orderInfo.pending_reservation_processed_ts = pendingReservationSync.processedTs;
            if (pendingReservationSync.errorMessage) orderInfo.pending_reservation_error = pendingReservationSync.errorMessage;
        }
        let orderNodeWritten = false;
        let summaryWritten = false;
        try {
            await orderBaseRef.child("in4").set(minifyData(orderInfo));
            await orderBaseRef.child("ch_t").set(minifyData(orderDetail));
            orderNodeWritten = true;
            await writeOrderSummaryMirror_(authUser.uid, orderId, orderInfo);
            summaryWritten = true;
            await touchOrdersMetaTimestamp_(sortTs);
        } catch (error) {
            if (pendingReservationSync.committed) {
                const revertMap = buildPendingReservationRevertMap_(pendingReservationMap);
                if (Object.keys(revertMap).length) {
                    await syncPendingReservationDelta(revertMap, Date.now(), hasCatalogAccess).catch(function (revertError) {
                        console.warn("Khong hoan tac duoc hang ket sau khi dat don that bai:", revertError);
                        return null;
                    });
                }
            }
            if (orderNodeWritten || summaryWritten) {
                await orderBaseRef.remove().catch(function (removeError) {
                    console.warn("Khong xoa duoc don hang loi tren Firebase:", removeError);
                    return null;
                });
                if (summaryWritten) {
                    await removeOrderSummaryMirror_(authUser.uid, orderId).catch(function (mirrorError) {
                        console.warn("Khong xoa duoc mirror don hang loi:", mirrorError);
                        return null;
                    });
                }
                await touchOrdersMetaTimestamp_(Date.now()).catch(function () { return null; });
            }
            throw error;
        }

        writeStorage(STORAGE_KEYS.customerId, fallbackCustomerId);
        if (pendingReservationSync.state !== "not_required") applyPendingReservationToCatalog(items, sortTs);

        Promise.resolve(service.persistCustomerProfile({
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
        })).catch(function (error) {
            console.warn("Customer profile sync after order failed:", error);
        });

        const result = buildOrderResult_(orderId, orderInfo, orderDetail, {
            persisted: true,
            storageMode: "firebase",
            ownerUid: authUser.uid,
            customerAuthUid: authUser.uid
        });
        saveMergedOrderSummary_(authUser.uid, result.summary);
        return result;
    };

    service.buildPhoneAlias = buildPhoneAlias;
    service.isPhoneAliasEmail = isPhoneAliasEmail;
    service.customerPhoneDomain = CUSTOMER_PHONE_DOMAIN;
    window.retailFirebase = service;
})();
