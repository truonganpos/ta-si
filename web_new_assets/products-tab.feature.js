(function () {
    if (window.productsTabFeature) return;

    var STYLE_ID = "products-tab-feature-styles";

    function ensureStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = [
            "[data-feature-root='products-tab']{min-width:0;}",
            "[data-feature-root='products-tab'] #products-filter-summary:empty{display:none;}"
        ].join("");
        document.head.appendChild(style);
    }

    function resolveRoot(target) {
        if (target && target.nodeType === 1) return target;
        if (typeof target === "string" && target) return document.getElementById(target);
        return document.querySelector("[data-feature-root='products-tab']") || document.getElementById("tab-products");
    }

    function getBridge() {
        return window.webNewAppBridge || {};
    }

    function getCategoryFeature() {
        return window.categoryMenuFeature || {};
    }

    function isDesktopCategoryViewport() {
        return window.innerWidth >= 1024;
    }

    function clearContainer(containerId) {
        var node = document.getElementById(String(containerId || "").trim());
        if (!node) return;
        delete node.dataset.categoryMenuStructureSignature;
        delete node.dataset.categoryMenuMetaSignature;
        node.innerHTML = "";
    }

    function renderDesktopCategoryMenu() {
        var categoryFeature = getCategoryFeature();
        if (categoryFeature && typeof categoryFeature.renderProductsDesktopCategoryMenu === "function") {
            return categoryFeature.renderProductsDesktopCategoryMenu();
        }
    }

    function openProductCategoryPopup() {
        var categoryFeature = getCategoryFeature();
        if (categoryFeature && typeof categoryFeature.openProductCategoryPopup === "function") {
            return categoryFeature.openProductCategoryPopup();
        }
    }

    function closeProductCategoryPopup() {
        var categoryFeature = getCategoryFeature();
        if (categoryFeature && typeof categoryFeature.closeProductCategoryPopup === "function") {
            return categoryFeature.closeProductCategoryPopup();
        }
    }

    function renderCategoryGroupsView() {
        var categoryFeature = getCategoryFeature();
        if (categoryFeature && typeof categoryFeature.renderCategoryGroupsView === "function") {
            return categoryFeature.renderCategoryGroupsView();
        }
    }

    function renderCategoryTagsView(groupName) {
        var categoryFeature = getCategoryFeature();
        if (categoryFeature && typeof categoryFeature.renderCategoryTagsView === "function") {
            return categoryFeature.renderCategoryTagsView(groupName);
        }
    }

    function selectProductCategory(category) {
        var categoryFeature = getCategoryFeature();
        if (categoryFeature && typeof categoryFeature.selectProductCategory === "function") {
            return categoryFeature.selectProductCategory(category);
        }
    }

    function renderProductsFilterSummary() {
        var bridge = getBridge();
        var categoryUi = getCategoryFeature();
        var filters = bridge.getProductFilters ? bridge.getProductFilters() : {};
        var activeCategory = bridge.getFilterCategory ? bridge.getFilterCategory() : "";
        var summaryContainer = document.getElementById("products-filter-summary");
        if (!summaryContainer) return;

        var tags = [];
        if (activeCategory) {
            tags.push({
                label: "Danh mục: " + activeCategory,
                action: function () { selectProductCategory(""); }
            });
        }
        if (filters.minPrice || filters.maxPrice) {
            var min = bridge.formatMoney ? bridge.formatMoney(filters.minPrice || 0) : filters.minPrice;
            var max = bridge.formatMoney ? bridge.formatMoney(filters.maxPrice || 0) : filters.maxPrice;
            tags.push({
                label: "Giá: " + (filters.minPrice ? min : "0đ") + " - " + (filters.maxPrice ? max : "Trở lên"),
                action: function () {
                    filters.minPrice = "";
                    filters.maxPrice = "";
                    window.applyFilter();
                }
            });
        }
        if (filters.bestSeller) tags.push({ label: "Bán chạy", action: function () { filters.bestSeller = false; window.applyFilter(); } });
        if (filters.featured) tags.push({ label: "Nổi bật", action: function () { filters.featured = false; window.applyFilter(); } });
        if (filters.multiImage) tags.push({ label: "Nhiều ảnh", action: function () { filters.multiImage = false; window.applyFilter(); } });
        if (filters.hasVariant) tags.push({ label: "Có phân loại", action: function () { filters.hasVariant = false; window.applyFilter(); } });

        var sortLabels = {
            newest: "Mới nhất",
            priceAsc: "Giá thấp đến cao",
            priceDesc: "Giá cao đến thấp",
            popular: ""
        };
        if (filters.sort && sortLabels[filters.sort]) {
            tags.push({
                label: "Sắp xếp: " + sortLabels[filters.sort],
                action: function () {
                    filters.sort = "popular";
                    window.applyFilter();
                }
            });
        }

        if (typeof categoryUi.renderFilterSummary === "function") {
            categoryUi.renderFilterSummary(summaryContainer, tags);
        }

        window.removeFilterTag = function (index) {
            if (tags[index] && typeof tags[index].action === "function") tags[index].action();
        };
    }

    function resetProductsFilters() {
        var bridge = getBridge();
        if (bridge.replaceProductFilters) bridge.replaceProductFilters({});
        if (bridge.setFilterCategory) bridge.setFilterCategory("");
        if (typeof window.syncCurrentRouteState === "function") window.syncCurrentRouteState();

        var searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.value = "";

        renderProductsTabContent();
        var filtered = bridge.getFilteredProducts
            ? bridge.getFilteredProducts(bridge.getShopProducts ? bridge.getShopProducts() : [])
            : [];
        if (typeof window.renderHomeProductLists === "function") window.renderHomeProductLists(filtered);
        if (typeof window.updateHomeProductTitles === "function") window.updateHomeProductTitles("Sản phẩm đề xuất");
        if (typeof window.syncFilterDrawerUI === "function") window.syncFilterDrawerUI();
    }

    function setPriceFilter(min, max) {
        var minEl = document.getElementById("filter-min-price");
        var maxEl = document.getElementById("filter-max-price");
        if (minEl) minEl.value = min;
        if (maxEl) maxEl.value = max;
    }

    function renderProductsTabContent() {
        var bridge = getBridge();
        var filtered = bridge.getFilteredProducts
            ? bridge.getFilteredProducts(bridge.getShopProducts ? bridge.getShopProducts() : [])
            : [];

        if (bridge.updateProductsCategoryButton) bridge.updateProductsCategoryButton();
        renderProductsFilterSummary();
        if (isDesktopCategoryViewport()) renderDesktopCategoryMenu();
        else clearContainer("desktop-category-menu");
        if (bridge.renderProductsList) bridge.renderProductsList(filtered, "products-tab-grid", filtered);
    }

    function setupCategorySwipe() {
        var panel = document.getElementById("product-category-panel");
        if (!panel || panel.dataset.swipeBound) return;
        panel.dataset.swipeBound = "1";

        var startX = 0;
        var startY = 0;
        panel.addEventListener("touchstart", function (event) {
            startX = event.changedTouches[0].screenX;
            startY = event.changedTouches[0].screenY;
        }, { passive: true });

        panel.addEventListener("touchend", function (event) {
            var endX = event.changedTouches[0].screenX;
            var endY = event.changedTouches[0].screenY;
            var diffX = endX - startX;
            var diffY = endY - startY;

            if (diffY > 80 && Math.abs(diffY) > Math.abs(diffX)) {
                closeProductCategoryPopup();
            }
        }, { passive: true });
    }

    function render(options) {
        ensureStyles();
        mount(options && options.target);
        renderProductsTabContent();
        setupCategorySwipe();
    }

    function mount(target) {
        ensureStyles();
        return resolveRoot(target);
    }

    function destroy(target) {
        var root = resolveRoot(target);
        if (!root) return;
        ["products-filter-summary", "products-tab-grid", "desktop-category-menu"].forEach(function (id) {
            var node = document.getElementById(id);
            if (node && root.contains(node)) node.innerHTML = "";
        });
    }

    function exposeLegacyApi() {
        window.productsTabUi = feature.ui;
        window.renderProductsFilterSummary = renderProductsFilterSummary;
        window.resetProductsFilters = resetProductsFilters;
        window.setPriceFilter = setPriceFilter;
        window.renderProductsTabContent = renderProductsTabContent;
        window.productsTabModule = feature.module;
    }

    var feature = {
        ensureStyles: ensureStyles,
        mount: mount,
        render: render,
        destroy: destroy,
        ui: {
            renderTreeMenu: function (options) {
                if (typeof getCategoryFeature().renderTreeMenu === "function") {
                    return getCategoryFeature().renderTreeMenu(options);
                }
            },
            renderCategoryGroups: function (container, headerTitle, backBtn, categories, buildArgument, activeCategory) {
                if (typeof getCategoryFeature().renderCategoryGroups === "function") {
                    return getCategoryFeature().renderCategoryGroups(container, headerTitle, backBtn, categories, buildArgument, activeCategory);
                }
            },
            renderCategoryTags: function (container, headerTitle, backBtn, group, buildArgument, activeCategory) {
                if (typeof getCategoryFeature().renderCategoryTags === "function") {
                    return getCategoryFeature().renderCategoryTags(container, headerTitle, backBtn, group, buildArgument, activeCategory);
                }
            },
            renderFilterSummary: function (container, tags) {
                if (typeof getCategoryFeature().renderFilterSummary === "function") {
                    return getCategoryFeature().renderFilterSummary(container, tags);
                }
            },
            toggleTreeNode: function (nodeId, bodyId) {
                if (typeof getCategoryFeature().toggleTreeNode === "function") {
                    return getCategoryFeature().toggleTreeNode(nodeId, bodyId);
                }
            }
        },
        renderDesktopCategoryMenu: renderDesktopCategoryMenu,
        renderFilterSummary: renderProductsFilterSummary,
        renderGrid: renderProductsTabContent,
        openCategoryPopup: openProductCategoryPopup,
        closeCategoryPopup: closeProductCategoryPopup,
        renderCategoryGroups: renderCategoryGroupsView,
        renderCategoryTags: renderCategoryTagsView,
        selectCategory: selectProductCategory,
        resetFilters: resetProductsFilters,
        exposeLegacyApi: exposeLegacyApi
    };

    feature.module = {
        render: render,
        renderDesktopCategoryMenu: renderDesktopCategoryMenu,
        renderFilters: renderProductsFilterSummary,
        renderGrid: renderProductsTabContent
    };

    window.productsTabFeature = feature;
    exposeLegacyApi();
    window.dispatchEvent(new Event("web-new-products-tab-ready"));
})();
