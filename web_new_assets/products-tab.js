// T?n file: products-tab.js
(function () {
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

    function renderDesktopCategoryMenu() {
        const bridge = getBridge();
        const categories = bridge.getProductCategoryOptions ? bridge.getProductCategoryOptions() : [];
        const activeCategory = bridge.getFilterCategory ? bridge.getFilterCategory() : '';

        if (window.uiPc && typeof window.uiPc.renderSidebarMenu === 'function') {
            window.uiPc.renderSidebarMenu({
                containerId: 'desktop-category-menu',
                counterId: 'desktop-category-count',
                categories: categories,
                activeCategory: activeCategory,
                allLabel: 'Tất cả',
                selectHandler: 'selectProductCategory',
                buildArgument: bridge.toInlineArgument
            });
        }
    }

    window.openProductCategoryPopup = function () {
        window.renderCategoryGroupsView();
        const bridge = getBridge();
        if (bridge.openModalShell) bridge.openModalShell('product-category-overlay');
    };

    window.closeProductCategoryPopup = function () {
        const bridge = getBridge();
        if (bridge.closeModalShell) bridge.closeModalShell('product-category-overlay');
    };

    window.renderCategoryGroupsView = function() {
        const bridge = getBridge();
        const categories = bridge.getProductCategoryOptions ? bridge.getProductCategoryOptions() : [];
        const container = document.getElementById('product-category-list');
        const headerTitle = document.getElementById('product-category-title');
        const backBtn = document.getElementById('product-category-back-btn');
        
        if(headerTitle) {
            headerTitle.innerHTML = `<p class='text-xs uppercase tracking-[0.2em] text-babyPink font-black mb-1'>Danh mục</p><h2 class='font-bold text-lg text-gray-800'>Chọn nhóm sản phẩm</h2>`;
        }
        if(backBtn) backBtn.classList.add('hidden');

        if (!container) return;
        
        container.innerHTML = `<div class="grid grid-cols-2 gap-3 pb-6">` + categories.map(cat => {
            if(cat.name === 'Tất cả') {
                return `
                    <button onclick="selectProductCategory('')" class="col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:border-babyPink hover:bg-pink-50 transition">
                        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl shrink-0"><i class="fa-solid fa-border-all"></i></div>
                        <div class="text-left flex-1"><h4 class="font-bold text-gray-800 text-base">Tất cả sản phẩm</h4><p class="text-xs text-gray-500 mt-1">${cat.count} sản phẩm</p></div>
                        <i class="fa-solid fa-angle-right text-gray-300"></i>
                    </button>
                `;
            }
            return `
                <button onclick="renderCategoryTagsView('${escapeHtml(cat.name)}')" class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center hover:border-babyPink hover:bg-pink-50 transition relative overflow-hidden">
                    <div class="w-14 h-14 rounded-full ${cat.color} flex items-center justify-center text-2xl mb-3"><i class="fa-solid ${cat.icon}"></i></div>
                    <h4 class="font-bold text-gray-800 text-sm line-clamp-1">${escapeHtml(cat.name)}</h4>
                    <p class="text-[11px] text-gray-500 mt-1">${cat.count} sản phẩm</p>
                    ${cat.children && cat.children.length > 0 ? `<div class="absolute top-2 right-2 text-gray-300"><i class="fa-solid fa-angle-right text-xs"></i></div>` : ''}
                </button>
            `;
        }).join('') + `</div>`;
    };

    window.renderCategoryTagsView = function(groupName) {
        const bridge = getBridge();
        const categories = bridge.getProductCategoryOptions ? bridge.getProductCategoryOptions() : [];
        const group = categories.find(c => c.name === groupName);
        if(!group) return;

        const container = document.getElementById('product-category-list');
        const headerTitle = document.getElementById('product-category-title');
        const backBtn = document.getElementById('product-category-back-btn');

        if(headerTitle) {
            headerTitle.innerHTML = `<p class='text-xs uppercase tracking-[0.2em] text-babyPink font-black mb-1'>Thẻ tag</p><h2 class='font-bold text-lg text-gray-800'>${escapeHtml(groupName)}</h2>`;
        }
        if(backBtn) backBtn.classList.remove('hidden');

        if(!container) return;

        let html = `<div class="flex flex-col gap-2 pb-6">`;
        html += `<button onclick="selectProductCategory('${escapeHtml(groupName)}')" class="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:border-babyPink hover:bg-pink-50 transition">
                    <span class="font-bold text-gray-800">Tất cả ${escapeHtml(groupName)}</span>
                    <span class="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">${group.count}</span>
                 </button>`;
        
        if(group.children && group.children.length > 0) {
            html += group.children.map(child => `
                 <button onclick="selectProductCategory('${escapeHtml(child.name)}')" class="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:border-babyPink hover:bg-pink-50 transition">
                    <span class="font-bold text-gray-600">${escapeHtml(child.name)}</span>
                    <span class="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">${child.count}</span>
                 </button>
            `).join('');
        }
        html += `</div>`;
        container.innerHTML = html;
    };

    window.selectProductCategory = function (category) {
        const bridge = getBridge();
        if (bridge.setFilterCategory) bridge.setFilterCategory(category);
        if (bridge.replaceProductFilters) bridge.replaceProductFilters({});
        window.renderProductsTabContent();
        const filtered = bridge.getFilteredProducts ? bridge.getFilteredProducts(bridge.getShopProducts ? bridge.getShopProducts() : []) : [];
        if (typeof window.renderHomeProductLists === 'function') window.renderHomeProductLists(filtered);
        window.closeProductCategoryPopup();
    };

    window.renderProductsFilterSummary = function () {
        const bridge = getBridge();
        const filters = bridge.getProductFilters ? bridge.getProductFilters() : {};
        const activeCategory = bridge.getFilterCategory ? bridge.getFilterCategory() : '';
        const summaryContainer = document.getElementById('products-filter-summary');
        if (!summaryContainer) return;

        const tags = [];
        if (activeCategory) tags.push({ label: `Danh mục: ${activeCategory}`, action: () => { window.selectProductCategory(''); } });
        if (filters.minPrice || filters.maxPrice) {
            const min = bridge.formatMoney ? bridge.formatMoney(filters.minPrice || 0) : filters.minPrice;
            const max = bridge.formatMoney ? bridge.formatMoney(filters.maxPrice || 0) : filters.maxPrice;
            tags.push({ label: `Giá: ${filters.minPrice ? min : '0đ'} - ${filters.maxPrice ? max : 'Trở lên'}`, action: () => { filters.minPrice = ''; filters.maxPrice = ''; window.applyFilter(); } });
        }
        if (filters.bestSeller) tags.push({ label: 'Bán chạy', action: () => { filters.bestSeller = false; window.applyFilter(); } });
        if (filters.featured) tags.push({ label: 'Nổi bật', action: () => { filters.featured = false; window.applyFilter(); } });
        if (filters.multiImage) tags.push({ label: 'Nhiều ảnh', action: () => { filters.multiImage = false; window.applyFilter(); } });
        if (filters.hasVariant) tags.push({ label: 'Có phân loại', action: () => { filters.hasVariant = false; window.applyFilter(); } });

        const sortLabels = { newest: 'Mới nhất', priceAsc: 'Giá thấp đến cao', priceDesc: 'Giá cao đến thấp', popular: '' };
        if (filters.sort && sortLabels[filters.sort]) tags.push({ label: `Sắp xếp: ${sortLabels[filters.sort]}`, action: () => { filters.sort = 'popular'; window.applyFilter(); } });

        summaryContainer.innerHTML = tags.map((tag, index) => `
            <span class="inline-flex items-center gap-1.5 bg-pink-50 border border-pink-100 text-babyPink text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm">
                ${escapeHtml(tag.label)}
                <button onclick="window.removeFilterTag(${index})" class="w-4 h-4 flex items-center justify-center rounded-full hover:bg-pink-200 transition"><i class="fa-solid fa-xmark text-[10px]"></i></button>
            </span>
        `).join('');

        window.removeFilterTag = (index) => { if (tags[index] && typeof tags[index].action === 'function') tags[index].action(); };
    };

    window.resetProductsFilters = function () {
        const bridge = getBridge();
        if (bridge.replaceProductFilters) bridge.replaceProductFilters({});
        if (bridge.setFilterCategory) bridge.setFilterCategory(''); // Thêm lại lệnh này để xóa hoàn toàn tag nhóm hàng
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

        window.renderProductsTabContent();
        const filtered = bridge.getFilteredProducts ? bridge.getFilteredProducts(bridge.getShopProducts ? bridge.getShopProducts() : []) : [];
        if (typeof window.renderHomeProductLists === 'function') window.renderHomeProductLists(filtered);
        if (typeof window.updateHomeProductTitles === 'function') window.updateHomeProductTitles('Sản Phẩm Đề Xuất');
        if (typeof window.syncFilterDrawerUI === 'function') window.syncFilterDrawerUI();
    };
    window.setPriceFilter = function(min, max) {
        const minEl = document.getElementById('filter-min-price');
        const maxEl = document.getElementById('filter-max-price');
        if (minEl) minEl.value = min;
        if (maxEl) maxEl.value = max;
    };

    window.setPriceFilter = function(min, max) {
        const minEl = document.getElementById('filter-min-price');
        const maxEl = document.getElementById('filter-max-price');
        if (minEl) minEl.value = min;
        if (maxEl) maxEl.value = max;
    };

    window.renderProductsTabContent = function () {
        const bridge = getBridge();
        const filtered = bridge.getFilteredProducts ? bridge.getFilteredProducts(bridge.getShopProducts ? bridge.getShopProducts() : []) : [];
        if (bridge.updateProductsCategoryButton) bridge.updateProductsCategoryButton();
        window.renderProductsFilterSummary();
        renderDesktopCategoryMenu();
        if (bridge.renderProductsList) bridge.renderProductsList(filtered, 'products-tab-grid', filtered);
    };

    function setupCategorySwipe() {
        const panel = document.getElementById('product-category-panel');
        if(!panel || panel.dataset.swipeBound) return;
        panel.dataset.swipeBound = '1';
        let startX = 0, startY = 0;
        panel.addEventListener('touchstart', e => {
            startX = e.changedTouches[0].screenX;
            startY = e.changedTouches[0].screenY;
        }, {passive: true});
        panel.addEventListener('touchend', e => {
            const endX = e.changedTouches[0].screenX;
            const endY = e.changedTouches[0].screenY;
            const diffX = endX - startX;
            const diffY = endY - startY;
            
            // Vuốt dọc xuống để đóng popup
            if(diffY > 80 && Math.abs(diffY) > Math.abs(diffX)) {
                window.closeProductCategoryPopup();
            }
            // Vuốt ngang phải để quay lại bước trước đó
            else if(diffX > 80 && Math.abs(diffX) > Math.abs(diffY)) {
                const backBtn = document.getElementById('product-category-back-btn');
                if(backBtn && !backBtn.classList.contains('hidden')) window.renderCategoryGroupsView();
                else window.closeProductCategoryPopup();
            }
        }, {passive: true});
    }

    function render() {
        window.renderProductsFilterSummary();
        window.renderProductsTabContent();
        setupCategorySwipe();
    }

    window.productsTabModule = {
        render: render,
        renderDesktopCategoryMenu: renderDesktopCategoryMenu,
        renderFilters: window.renderProductsFilterSummary,
        renderGrid: window.renderProductsTabContent
    };

    window.dispatchEvent(new Event('web-new-products-tab-ready'));
})();
