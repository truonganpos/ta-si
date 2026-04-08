    // ==========================================
    // TRẢI NGHIỆM FULLSCREEN VIEWER
    // ==========================================
    let fullscreenEndNoticeShown = false;
    const notifyFullscreenEndReached = () => {
        if(fullscreenEndNoticeShown || typeof showToast !== 'function' || !Array.isArray(fsContextList) || !fsContextList.length) return;
        if(fsCurrentIndex < fsContextList.length - 1) return;
        fullscreenEndNoticeShown = true;
        showToast('Bạn đã xem hết sản phẩm trong chế độ toàn màn hình.', 'info');
    };
    const renderFullscreenDots = (images = []) => {
        const dotsContainer = document.getElementById('fs-dots');
        if(!dotsContainer) return;
        if(images.length > 1) {
            dotsContainer.innerHTML = images.map((_, i) => `<div class="h-1.5 rounded-full transition-all duration-300 ${i === fsCurrentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}"></div>`).join('');
        } else {
            dotsContainer.innerHTML = '';
        }
    };
    const syncFullscreenThumbState = () => {
        const thumbStrip = document.getElementById('fs-thumb-strip');
        if(!thumbStrip) return;
        thumbStrip.querySelectorAll('button').forEach((button, buttonIndex) => {
            button.classList.toggle('border-babyPink', buttonIndex === fsCurrentImageIndex);
            button.classList.toggle('ring-2', buttonIndex === fsCurrentImageIndex);
            button.classList.toggle('ring-babyPink/50', buttonIndex === fsCurrentImageIndex);
            button.classList.toggle('border-white/20', buttonIndex !== fsCurrentImageIndex);
        });
    };
    const preloadFullscreenNeighbors = () => {
        const preloadIndexes = [fsCurrentIndex - 1, fsCurrentIndex, fsCurrentIndex + 1];
        preloadIndexes.forEach((productIndex) => {
            const product = fsContextList[productIndex];
            if(!product) return;
            const images = (product.images && product.images.length) ? product.images : [product.img];
            images.slice(0, 3).forEach((image, imageIndex) => {
                if(!image) return;
                const preloadImage = new Image();
                preloadImage.decoding = 'async';
                preloadImage.src = getOptimizedImageUrl(image, imageIndex === 0 ? 'w1600' : 'w1200');
            });
        });
    };
    const updateFullscreenUI = () => {
        const prod = fsContextList[fsCurrentIndex];
        if(!prod) return;

        const trackEl = document.getElementById('fs-img-track');
        const images = (prod.images && prod.images.length) ? prod.images : [prod.img];
        const minQty = getProductMinQty(prod);

        currentViewingProduct = prod;
        if(trackEl) {
            trackEl.innerHTML = images.map((image, index) => `
                <div class="w-full h-full shrink-0 snap-center flex items-center justify-center bg-black">
                    ${typeof window.renderResponsiveImageHtml === 'function'
                        ? window.renderResponsiveImageHtml(
                            image,
                            index === 0 ? 'w1600' : 'w1400',
                            'max-w-full max-h-full lg:max-h-[calc(100vh-16rem)] object-contain pointer-events-none select-none',
                            {
                                alt: `Hình ảnh sản phẩm ${index + 1}`,
                                loading: index === 0 ? 'eager' : 'lazy',
                                decoding: 'async',
                                pictureClass: 'block'
                            }
                        )
                        : `<img src="${getOptimizedImageUrl(image, index === 0 ? 'w1600' : 'w1400')}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" class="max-w-full max-h-full lg:max-h-[calc(100vh-16rem)] object-contain pointer-events-none select-none"/>`}
                </div>
            `).join('');
            requestAnimationFrame(() => {
                trackEl.scrollTo({ left: (trackEl.clientWidth || 0) * fsCurrentImageIndex, behavior: 'auto' });
            });
        }

        document.getElementById('fs-name').innerText = getProductDisplayName(prod);
        const pricingMeta = getProductPricingMeta(prod);
        const fsPriceEl = document.getElementById('fs-price');
        const fsSoldEl = document.getElementById('fs-sold');
        if(fsPriceEl) fsPriceEl.innerText = pricingMeta.currentText || formatProductPriceLabel(prod);
        if(fsSoldEl) {
            fsSoldEl.classList.toggle('hidden', !pricingMeta.hasSale);
            fsSoldEl.innerHTML = pricingMeta.hasSale
                ? `<span class="line-through">${pricingMeta.originalText}</span>`
                : '';
        }
        const variantSummaryEl = document.getElementById('fs-variant-summary');
        if(variantSummaryEl) {
            const variantSummary = getProductVariantSummary(prod);
            const summaryParts = [variantSummary || getProductTagText(prod)];
            if(minQty > 1) summaryParts.push(`Mua tối thiểu ${minQty}${prod.unit ? ` ${prod.unit}` : ''}`);
            variantSummaryEl.innerText = summaryParts.filter(Boolean).join(' • ');
        }
        const fsQtyInput = document.getElementById('fs-qty');
        if(fsQtyInput) {
            fsQtyInput.min = String(minQty);
            fsQtyInput.value = String(minQty);
        }
        const inStock = isProductInStock(prod);
        const fsAddBtn = document.getElementById('fs-add-btn');
        const fsQtyWrap = document.getElementById('fs-qty-wrap');
        if(fsAddBtn) {
            fsAddBtn.disabled = !inStock;
            fsAddBtn.className = inStock
                ? 'w-12 h-12 bg-babyPink text-white rounded-full shadow-[0_4px_15px_rgba(255,143,171,0.5)] flex items-center justify-center hover:bg-pink-500 transition shrink-0'
                : 'w-12 h-12 bg-white/10 text-white/60 rounded-full flex items-center justify-center border border-white/10 opacity-50 cursor-not-allowed shrink-0';
            fsAddBtn.innerHTML = inStock ? `<i class="fa-solid fa-cart-shopping"></i> Thêm vào giỏ` : `<i class="fa-solid fa-ban"></i> Hết hàng`;
        }
        if(fsAddBtn) {
            fsAddBtn.setAttribute('aria-label', inStock ? 'Thêm vào giỏ' : 'Hết hàng');
            fsAddBtn.innerHTML = inStock ? `<i class="fa-solid fa-cart-shopping text-sm"></i>` : `<i class="fa-solid fa-ban text-sm"></i>`;
        }
        if(fsQtyWrap) {
            fsQtyWrap.classList.toggle('opacity-50', !inStock);
            fsQtyWrap.classList.toggle('pointer-events-none', !inStock);
        }

        renderFullscreenDots(images);
        const thumbStrip = document.getElementById('fs-thumb-strip');
        if(thumbStrip) {
            thumbStrip.classList.toggle('hidden', images.length <= 1);
            thumbStrip.classList.toggle('flex', images.length > 1);
            thumbStrip.innerHTML = images.map((image, index) => `
                <button class="w-14 h-14 rounded-2xl overflow-hidden border ${index === fsCurrentImageIndex ? 'border-babyPink ring-2 ring-babyPink/50' : 'border-white/20'} bg-white/10 shrink-0" onclick="scrollFullscreenImage(${index})">
                    ${typeof window.renderResponsiveImageHtml === 'function'
                        ? window.renderResponsiveImageHtml(
                            image,
                            'w300',
                            'w-full h-full object-contain bg-black/20',
                            {
                                alt: `Thumbnail ${index + 1}`,
                                loading: 'lazy',
                                decoding: 'async',
                                pictureClass: 'block w-full h-full'
                            }
                        )
                        : `<img src="${getOptimizedImageUrl(image, 'w300')}" loading="lazy" decoding="async" class="w-full h-full object-contain bg-black/20"/>`}
                </button>
            `).join('');
        }

        const wishBtn = document.getElementById('fs-wish-btn');
        if(wishBtn) {
            wishBtn.innerHTML = `<i class="fa-solid fa-heart ${wishlistData.includes(prod.id) ? 'text-red-500' : 'text-white'}"></i>`;
        }
        syncFullscreenThumbState();
        preloadFullscreenNeighbors();
    };
    window.scrollFullscreenImage = (index) => {
        const trackEl = document.getElementById('fs-img-track');
        fsCurrentImageIndex = Math.max(0, Number(index) || 0);
        renderFullscreenDots((fsContextList[fsCurrentIndex] && fsContextList[fsCurrentIndex].images) || []);
        if(trackEl) {
            trackEl.scrollTo({
                left: (trackEl.clientWidth || 0) * fsCurrentImageIndex,
                behavior: 'smooth'
            });
        }
        const prod = fsContextList[fsCurrentIndex];
        const images = (prod && prod.images && prod.images.length) ? prod.images : [prod && prod.img];
        syncFullscreenThumbState();
        renderFullscreenDots(images);
    };

    window.openFullscreenViewer = (productId, contextId) => {
        fsContextList = window[`context_${contextId}`] || shopProducts;
        fsCurrentIndex = fsContextList.findIndex(p => p.id === productId);
        if(fsCurrentIndex === -1) {
            fsCurrentIndex = 0;
            fsContextList = shopProducts;
        }
        fullscreenEndNoticeShown = false;
        const viewer = document.getElementById('fullscreen-viewer');
        viewer.classList.remove('hidden');
        requestAnimationFrame(() => {
            fsCurrentImageIndex = 0;
            updateFullscreenUI();
            notifyFullscreenEndReached();
            viewer.classList.add('is-visible');
            viewer.classList.remove('opacity-0');
        });
    };

    window.closeFullscreenViewer = () => {
        const viewer = document.getElementById('fullscreen-viewer');
        viewer.classList.remove('is-visible');
        viewer.classList.add('opacity-0');
        setTimeout(() => { viewer.classList.add('hidden'); }, 320);
    };
    document.addEventListener('keydown', (event) => {
        const viewer = document.getElementById('fullscreen-viewer');
        if(!viewer || viewer.classList.contains('hidden')) return;
        if(event.key === 'ArrowLeft') changeFullscreenProduct(-1);
        if(event.key === 'ArrowRight') changeFullscreenProduct(1);
        if(event.key === 'Escape') closeFullscreenViewer();
    });

    window.initFullscreenSwipe = () => {
        const container = document.getElementById('fs-img-container');
        const track = document.getElementById('fs-img-track');
        if(!container || !track || container.dataset.swipeBound === '1') return;
        container.dataset.swipeBound = '1';
        let startX = 0;
        let startY = 0;

        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        track.addEventListener('scroll', () => {
            const width = track.clientWidth || 1;
            const nextIndex = Math.round(track.scrollLeft / width);
            if(nextIndex === fsCurrentImageIndex) return;
            fsCurrentImageIndex = nextIndex;
            const prod = fsContextList[fsCurrentIndex];
            renderFullscreenDots((prod && prod.images && prod.images.length) ? prod.images : [prod && prod.img]);
            syncFullscreenThumbState();
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = endX - startX;
            const diffY = endY - startY;
            const prod = fsContextList[fsCurrentIndex];
            const images = (prod && prod.images && prod.images.length) ? prod.images : [prod && prod.img];

            if(Math.abs(diffX) > Math.abs(diffY)) {
                if(Math.abs(diffX) <= 60) return;
                const canMoveByHorizontalEdge = images.length <= 1
                    || (diffX > 0 && fsCurrentImageIndex <= 0)
                    || (diffX < 0 && fsCurrentImageIndex >= images.length - 1);
                if(!canMoveByHorizontalEdge) return;
                if(diffX > 0 && fsCurrentIndex > 0) fsCurrentIndex--;
                else if(diffX < 0 && fsCurrentIndex < fsContextList.length - 1) fsCurrentIndex++;
                else return;
                fsCurrentImageIndex = 0;
                updateFullscreenUI();
                notifyFullscreenEndReached();
                requestAnimationFrame(() => animateFullscreenProductSwap(diffX < 0 ? 1 : -1));
                return;
            }

            if(Math.abs(diffY) <= 60) return;
            if(diffY > 0 && fsCurrentIndex > 0) fsCurrentIndex--;
            else if(diffY < 0 && fsCurrentIndex < fsContextList.length - 1) fsCurrentIndex++;
            else return;
            fsCurrentImageIndex = 0;
            updateFullscreenUI();
            notifyFullscreenEndReached();
            requestAnimationFrame(() => animateFullscreenProductSwap(diffY < 0 ? 1 : -1));
        }, { passive: true });
    };

    window.fsChangeQty = (delta) => {
        const product = fsContextList[fsCurrentIndex];
        if(!isProductInStock(product)) return;
        const minQty = getProductMinQty(product);
        const currentValue = window.sanitizeQtyInput('fs-qty', minQty);
        document.getElementById('fs-qty').value = Math.max(minQty, currentValue + Number(delta || 0));
    };

    window.fsToggleWish = () => {
        const prod = fsContextList[fsCurrentIndex];
        if(!prod) return;
        toggleWishlist({ stopPropagation: () => {} }, prod.id);
        updateFullscreenUI();
    };

    window.fsViewDetail = () => {
        const prod = fsContextList[fsCurrentIndex];
        if(!prod) return;
        closeFullscreenViewer();
        setTimeout(() => openProductDetail(prod.id), 220);
    };
    const animateFullscreenProductSwap = (direction) => {
        const animationClass = Number(direction || 0) >= 0 ? 'fs-product-slide-next' : 'fs-product-slide-prev';
        ['fs-img-container', 'fs-info-panel', 'fs-thumb-strip'].forEach((id) => {
            const element = document.getElementById(id);
            if(!element) return;
            element.classList.remove('fs-product-slide-next', 'fs-product-slide-prev');
            void element.offsetWidth;
            element.classList.add(animationClass);
            setTimeout(() => element.classList.remove(animationClass), 420);
        });
    };
    window.changeFullscreenProduct = (direction) => {
        if(!Array.isArray(fsContextList) || !fsContextList.length) return;
        const nextIndex = fsCurrentIndex + Number(direction || 0);
        if(nextIndex < 0 || nextIndex >= fsContextList.length) return;
        fsCurrentIndex = nextIndex;
        fsCurrentImageIndex = 0;
        updateFullscreenUI();
        notifyFullscreenEndReached();
        requestAnimationFrame(() => animateFullscreenProductSwap(direction));
    };

    window.fsAddToCart = () => {
        const prod = fsContextList[fsCurrentIndex];
        if(!prod) return;
        if(!isProductInStock(prod)) return showToast('Sản phẩm hiện đã hết hàng.', 'warning');
        const qty = Math.max(getProductMinQty(prod), window.sanitizeQtyInput('fs-qty', getProductMinQty(prod)));
        let varsText = '';

        if(prod.variants && prod.variants.length > 0) {
            const autoSelected = {};
            prod.variants.forEach(v => { autoSelected[v.name] = v.options[0]; });
            varsText = Object.entries(autoSelected).map(([k, v]) => `${k}: ${v}`).join(' | ');
        }

        if(typeof window.addToCartLogic === 'function') window.addToCartLogic(prod, qty, varsText);
        if(varsText) showToast(`Đã thêm vào giỏ với phân loại mặc định: ${varsText}`, 'success');
        else showToast('Đã thêm vào giỏ hàng!', 'success');
        closeFullscreenViewer();
    };


    const categoryTree = [
        { id: 'c1', name: 'Đồ chơi', banner: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=500&q=80', subCats: [{ name: 'Xếp hình', img: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=400&q=80' }, { name: 'Nhồi bông', img: 'https://images.unsplash.com/photo-1559418612-4cf4e723528b?auto=format&fit=crop&w=400&q=80' }] },
        { id: 'c2', name: 'Sơ sinh & Sữa', banner: 'https://images.unsplash.com/photo-1522771930-78848d92871d?auto=format&fit=crop&w=500&q=80', subCats: [{ name: 'Quần áo', img: 'https://images.unsplash.com/photo-1522771930-78848d92871d?auto=format&fit=crop&w=400&q=80' }, { name: 'Sữa công thức', img: 'https://images.unsplash.com/photo-1629815049386-5386f78cc73d?auto=format&fit=crop&w=400&q=80' }] },
        { id: 'c3', name: 'Xe đẩy', banner: 'https://images.unsplash.com/photo-1512413914619-74d32e60086c?auto=format&fit=crop&w=500&q=80', subCats: [{ name: 'Du lịch', img: 'https://images.unsplash.com/photo-1512413914619-74d32e60086c?auto=format&fit=crop&w=400&q=80' }] }
    ];
    
    window.renderCatContent = (id) => {
        const selected = categoryTree.find(c => c.id === id);
        if(!selected) return;
        document.getElementById("cat-content").innerHTML = `
            <div class="w-full h-28 md:h-40 rounded-lg overflow-hidden mb-4 shadow-sm relative">
                <img src="${getOptimizedImageUrl(selected.banner, 'w1200')}" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/20 flex items-center justify-center"><span class="text-white font-bold tracking-widest text-sm md:text-lg">${selected.name.toUpperCase()}</span></div>
            </div>
            <div class="grid grid-cols-3 md:grid-cols-4 gap-3">
                ${selected.subCats.map(sub => `
                    <div class="flex flex-col items-center cursor-pointer group">
                        <img src="${getOptimizedImageUrl(sub.img, 'w400')}" loading="lazy" decoding="async" class="w-14 h-14 md:w-20 md:h-20 object-cover rounded-full border border-gray-100 group-hover:border-babyPink mb-1.5 shadow-sm transition-colors" />
                        <span class="text-[9px] md:text-xs text-center text-gray-600 font-medium">${sub.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const renderCatSidebar = () => {
        document.getElementById("cat-sidebar").innerHTML = categoryTree.map((cat, index) => {
            const isActive = index === 0 ? "bg-white border-babyPink text-babyPink font-bold" : "border-transparent text-gray-600";
            return `<div class="cat-item py-4 px-2 text-center text-[11px] md:text-sm border-l-4 cursor-pointer transition-colors ${isActive}" data-id="${cat.id}">${cat.name}</div>`;
        }).join('');
        
        document.querySelectorAll('.cat-item').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('.cat-item').forEach(i => i.className = "cat-item py-4 px-2 text-center text-[11px] md:text-sm border-l-4 cursor-pointer transition-colors border-transparent text-gray-600");
                this.className = "cat-item py-4 px-2 text-center text-[11px] md:text-sm border-l-4 cursor-pointer transition-colors bg-white border-babyPink text-babyPink font-bold";
                renderCatContent(this.getAttribute("data-id"));
            });
        });
        if(categoryTree.length > 0) renderCatContent(categoryTree[0].id);
    };

    

    // SỔ ĐỊA CHỈ TRONG SETTINGS (Hỗ trợ nhiều địa chỉ)
    window.openSettings = () => {
        if(!currentUser) return;
        currentUser = normalizeUserData(currentUser);
        const u = currentUser;
        let addressesHtml = `<p class="text-sm text-gray-500 text-center py-4">Bạn chưa có địa chỉ nào.</p>`;
        
        if(u.addresses && u.addresses.length > 0) {
            addressesHtml = u.addresses.map((addr) => `
                <div class="bg-white rounded-2xl shadow-sm border ${addr.isDefault ? 'border-babyPink bg-pink-50/30' : 'border-gray-200'} p-4 mb-3 relative">
                    ${addr.isDefault ? '<div class="absolute top-3 right-3 text-[9px] font-bold bg-babyPink text-white px-2 py-1 rounded-full shadow-sm">Mặc định</div>' : ''}
                    <p class="text-sm text-gray-700 font-semibold pr-16 leading-6">${addr.text}</p>
                    <div class="flex gap-3 mt-3 pt-3 border-t border-dashed">
                        ${!addr.isDefault ? `<button onclick="setAddressDefault('${addr.id}')" class="text-xs text-blue-500 font-bold hover:underline">Đặt mặc định</button>` : ''}
                        <button onclick="deleteAddress('${addr.id}')" class="text-xs text-red-500 font-bold hover:underline ml-auto"><i class="fa-solid fa-trash"></i> Xóa</button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('settings-content').innerHTML = `
            <div id="settings-view" class="space-y-4">
<section class="rounded-2xl md:rounded-[28px] bg-white p-4 md:p-5 shadow-sm border border-gray-100">
                    <div class="rounded-[24px] bg-gray-50 p-5 text-center">
                        <div class="w-24 h-24 rounded-full bg-white border border-gray-200 mx-auto overflow-hidden flex items-center justify-center text-babyPink text-3xl shadow-sm">
                            ${u.avatar ? `<img src="${getOptimizedImageUrl(u.avatar, 'w300')}" loading="lazy" decoding="async" class="w-full h-full object-cover"/>` : `<i class="fa-regular fa-user"></i>`}
                        </div>
                        <button class="mt-4 text-sm font-bold text-gray-600 inline-flex items-center gap-2" onclick="openProfileFieldEditor('avatar')"><i class="fa-regular fa-pen-to-square"></i> Sửa</button>
                    </div>
                </section>

                <section class="rounded-[28px] bg-white shadow-sm border border-gray-100 overflow-hidden">
                    <button class="w-full bg-gray-50 px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-pink-50 transition" onclick="openProfileFieldEditor('name')">
                        <div>
                            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Hồ sơ người dùng</p>
                            <h3 class="font-bold text-lg text-gray-800 mt-1">${u.name}</h3>
                            <p class="text-sm text-gray-500 mt-1 max-w-[80vw] md:max-w-[380px] truncate">${u.bio}</p>
                        </div>
                        <span class="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-babyPink shadow-sm">
                            <i class="fa-solid fa-angle-right"></i>
                        </span>
                    </button>
                    <div class="grid gap-px bg-gray-100">
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition" onclick="openProfileFieldEditor('bio')">
                            <span class="text-gray-600">Tiểu sử</span>
                            <span class="font-bold text-gray-800 flex items-center gap-2 max-w-[60%] text-right truncate">${u.bio}<i class="fa-solid fa-angle-right text-gray-300"></i></span>
                        </button>
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition" onclick="openProfileFieldEditor('gender')">
                            <span class="text-gray-600">Giới tính</span>
                            <span class="font-bold text-gray-800 flex items-center gap-2">${u.gender}<i class="fa-solid fa-angle-right text-gray-300"></i></span>
                        </button>
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition" onclick="openProfileFieldEditor('birthday')">
                            <span class="text-gray-600">Ngày sinh</span>
                            <span class="font-bold text-gray-800 flex items-center gap-2">${formatBirthdayDisplay(u.birthday)}<i class="fa-solid fa-angle-right text-gray-300"></i></span>
                        </button>
                        <button class="w-full bg-white px-4 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition" onclick="openProfileFieldEditor('personalInfo')">
                            <span class="text-gray-600">Thông tin cá nhân</span>
                            <span class="font-bold text-babyPink flex items-center gap-2">${u.personalInfo}<i class="fa-solid fa-angle-right text-gray-300"></i></span>
                        </button>
                    </div>
                </section>

                <section class="rounded-[28px] bg-white shadow-sm border border-gray-100 overflow-hidden">
                    <div class="grid gap-px bg-gray-100">
                        <div class="bg-white px-4 py-4 flex items-center justify-between gap-4">
                            <span class="text-gray-600">Số điện thoại</span>
                                <span class="font-bold text-gray-800">${u.phone || 'Chưa cập nhật'}</span>
                        </div>
                        <div class="bg-white px-4 py-4 flex items-center justify-between gap-4">
                            <span class="text-gray-600">Email</span>
                                <span class="font-bold text-gray-800">${u.email || 'Chưa cập nhật'}</span>
                        </div>
                    </div>
                </section>

                <div id="settings-editor-panel" class="fixed inset-0 z-[120] bg-black/50 modal-shell flex items-center justify-center p-4" onclick="if(event.target === this) closeProfileFieldEditor()">
                    <div class="modal-panel bg-white w-full max-w-md rounded-[28px] p-5 shadow-2xl" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-extrabold text-lg text-gray-800" id="settings-editor-title">Chỉnh sửa</h3>
                            <button class="text-gray-400 hover:text-gray-600" onclick="closeProfileFieldEditor()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div id="settings-editor-body"></div>
                        <div class="flex gap-3 mt-4">
                            <button onclick="closeProfileFieldEditor()" class="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition">Hủy</button>
                            <button onclick="saveProfileField()" class="flex-1 bg-babyPink text-white py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition">OK</button>
                        </div>
                    </div>
                </div>
                
<section class="rounded-2xl md:rounded-[28px] bg-white p-4 md:p-5 shadow-sm border border-gray-100">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h3 class="font-extrabold text-lg text-gray-800">Sổ địa chỉ giao hàng</h3>
                            <p class="text-sm text-gray-500 mt-1">Quản lý địa chỉ nhận hàng nhanh ngay trong tài khoản.</p>
                        </div>
                        <button onclick="toggleAddAddress()" class="text-babyPink font-bold cursor-pointer bg-pink-50 px-3 py-2 rounded-2xl shadow-sm">+ Thêm mới</button>
                    </div>
                    ${addressesHtml}
                </section>
            </div>

<div id="settings-add-address" class="hidden rounded-2xl md:rounded-[28px] bg-white p-4 md:p-5 shadow-sm border border-gray-100">
                <h3 class="font-extrabold text-lg text-gray-800 mb-3">Thêm địa chỉ mới</h3>
                <textarea id="new-address-text" placeholder="Nhập Số nhà, Đường, Phường, Quận, Tỉnh/TP..." class="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm mb-3 h-24 focus:outline-babyPink shadow-sm"></textarea>
                <div class="flex items-center gap-2 mb-4">
                    <input type="checkbox" id="new-address-default" class="w-4 h-4 text-babyPink focus:ring-babyPink border-gray-300 rounded"/>
                    <label for="new-address-default" class="text-sm text-gray-700 font-semibold">Đặt làm mặc định</label>
                </div>
                <button onclick="saveAddress()" class="w-full bg-babyPink text-white py-3 rounded-2xl font-bold shadow-md hover:bg-pink-500 transition">Lưu địa chỉ</button>
                <button onclick="toggleAddAddress()" class="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold mt-2 hover:bg-gray-200 transition">Hủy</button>
            </div>
        `;
        document.getElementById('account-settings-page').classList.remove('translate-x-full');
    };

    window.closeSettings = () => { document.getElementById('account-settings-page').classList.add('translate-x-full'); };
    window.openProfileFieldEditor = (field) => {
        activeProfileField = field;
        const panel = document.getElementById('settings-editor-panel');
        const title = document.getElementById('settings-editor-title');
        const body = document.getElementById('settings-editor-body');
        if(!panel || !title || !body) return;

        const templates = {
            avatar: {
                title: 'Cập nhật ảnh đại diện',
                html: `
                    <input id="settings-field-input" value="${currentUser.avatar || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Dán URL ảnh đại diện" type="text"/>
                    <div class="relative mt-3">
                        <input id="settings-avatar-file" class="w-full bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" accept="image/*" type="file"/>
                    </div>
                    <p class="text-xs text-gray-500 mt-3 leading-5">
                        Chọn ảnh từ máy để upload lên thư mục cấu hình sẵn trong <code>upload-avatar.php</code>.
                    </p>
                `
            },
            name: {
                title: 'Sửa tên hiển thị',
                html: `<input id="settings-field-input" value="${currentUser.name}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Nhập tên hiển thị" type="text"/>`
            },
            bio: {
                title: 'Sửa tiểu sử',
                html: `<textarea id="settings-field-input" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm h-28 focus:outline-babyPink shadow-sm" placeholder="Viết ngắn gọn về cửa hàng hoặc nhu cầu của bạn">${currentUser.bio}</textarea>`
            },
            gender: {
                title: 'Chọn giới tính',
                html: `<select id="settings-field-input" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm"><option ${currentUser.gender === 'Nam' ? 'selected' : ''}>Nam</option><option ${currentUser.gender === 'Nữ' ? 'selected' : ''}>Nữ</option><option ${currentUser.gender === 'Khác' ? 'selected' : ''}>Khác</option><option ${currentUser.gender === 'Chưa cập nhật' ? 'selected' : ''}>Chưa cập nhật</option></select>`
            },
            birthday: {
                title: 'Chọn ngày sinh',
                html: `<input id="settings-field-input" value="${currentUser.birthday || ''}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" type="date"/>`
            },
            personalInfo: {
                title: 'Thông tin cá nhân',
                html: `<input id="settings-field-input" value="${currentUser.personalInfo === 'Thiết lập ngay' ? '' : currentUser.personalInfo}" class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:outline-babyPink shadow-sm" placeholder="Ví dụ: Mẹ bầu tháng 8, cần combo quà tặng..." type="text"/>`
            }
        };

        title.innerText = templates[field].title;
        body.innerHTML = templates[field].html;
        openModalShell('settings-editor-panel');
        setTimeout(() => {
            const input = document.getElementById('settings-field-input');
            if(input) input.focus();
        }, 40);
    };
    window.closeProfileFieldEditor = () => {
        activeProfileField = '';
        closeModalShell('settings-editor-panel');
    };
    window.saveProfileField = async () => {
        const input = document.getElementById('settings-field-input');
        if(!input || !activeProfileField) return;
        let value = input.value.trim();
        if(activeProfileField === 'name' && !value) return showToast("Tên hiển thị không được để trống.", 'warning');
        if(activeProfileField === 'bio' && !value) return showToast("Tiểu sử không được để trống.", 'warning');

        if(activeProfileField === 'avatar') {
            const fileInput = document.getElementById('settings-avatar-file');
            if(fileInput && fileInput.files && fileInput.files[0]) {
                try {
                    const formData = new FormData();
                    formData.append('avatar', fileInput.files[0]);
                    const uploadEndpoint = String(window.WEB_NEW_UPLOAD_ENDPOINT || 'upload-avatar.php').trim() || 'upload-avatar.php';
                    const response = await fetch(uploadEndpoint, { method: 'POST', body: formData });
                    const result = await response.json();
                    if(!response.ok || !result.url) {
                        throw new Error(result.message || 'UPLOAD_FAILED');
                    }
                    value = result.url;
                } catch(error) {
                    return showToast(`Upload ảnh thất bại. Kiểm tra endpoint ${String(window.WEB_NEW_UPLOAD_ENDPOINT || 'upload-avatar.php').trim() || 'upload-avatar.php'}.`, 'warning');
                }
            }
        }

        if(activeProfileField === 'personalInfo') currentUser.personalInfo = value || 'Thiết lập ngay';
        else currentUser[activeProfileField] = value;
        saveState();
        scheduleIdleTask(() => syncCurrentUserToCloud());
        closeProfileFieldEditor();
        openSettings();
        renderAccountTab();
        showToast("Hồ sơ cá nhân đã được cập nhật.", 'success');
    };
    window.toggleAddAddress = () => {
        const view = document.getElementById('settings-view');
        const addAddress = document.getElementById('settings-add-address');
        if(!view || !addAddress) return;
        const opening = addAddress.classList.contains('hidden');
        if(opening) {
            view.classList.add('hidden');
            addAddress.classList.remove('hidden');
        } else {
            addAddress.classList.add('hidden');
            view.classList.remove('hidden');
        }
    };

    window.saveAddress = () => {
        const txt = document.getElementById('new-address-text').value;
        const phoneInput = document.getElementById('new-address-phone');
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const isDefault = document.getElementById('new-address-default').checked;
        if(!txt.trim()) return showToast("Vui lòng nhập địa chỉ!", 'warning');
        if(!phone) return showToast("Vui lòng nhập số điện thoại giao hàng!", 'warning');
        
        if(!currentUser.addresses) currentUser.addresses = [];
        if(isDefault || currentUser.addresses.length === 0) {
            currentUser.addresses.forEach(a => a.isDefault = false);
        }
        
        currentUser.addresses.push({ id: 'addr_'+Date.now(), text: txt, phone: phone, isDefault: (isDefault || currentUser.addresses.length === 0) });
        saveState();
        scheduleIdleTask(() => syncCurrentUserToCloud());
        openSettings();
        showToast("Đã lưu địa chỉ giao hàng.", 'success');
    };

    window.setAddressDefault = (id) => {
        currentUser.addresses.forEach(a => { a.isDefault = (a.id === id); });
        saveState();
        scheduleIdleTask(() => syncCurrentUserToCloud());
        openSettings();
        showToast("Đã cập nhật địa chỉ mặc định.", 'success');
    };

    window.deleteAddress = (id) => {
        openConfirmModal("Bạn có chắc muốn xóa địa chỉ này?", () => {
            currentUser.addresses = currentUser.addresses.filter(a => a.id !== id);
            if(currentUser.addresses.length > 0 && !currentUser.addresses.find(a=>a.isDefault)) {
                currentUser.addresses[0].isDefault = true;
            }
            saveState();
            scheduleIdleTask(() => syncCurrentUserToCloud());
            openSettings();
            showToast("Đã xóa địa chỉ.", 'success');
        });
    };

    const getNormalizedWishlistIds = () => [...new Set([]
        .concat(Array.isArray(wishlistData) ? wishlistData : [])
        .concat(currentUser && Array.isArray(currentUser.favoriteProducts) ? currentUser.favoriteProducts : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean))];
    const syncWishlistState = () => {
        wishlistData = getNormalizedWishlistIds();
        if(currentUser) currentUser.favoriteProducts = wishlistData.slice();
    };
    window.toggleWishlist = (event, id) => {
        if(event && typeof event.stopPropagation === 'function') event.stopPropagation();
        const safeId = String(id || '').trim();
        if(!safeId) return;

        syncWishlistState();
        const wishedIds = new Set(wishlistData);
        if(wishedIds.has(safeId)) wishedIds.delete(safeId);
        else wishedIds.add(safeId);

        wishlistData = [...wishedIds];
        if(currentUser) currentUser.favoriteProducts = wishlistData.slice();
        saveState();
        if(currentUser) scheduleIdleTask(() => syncCurrentUserToCloud());

        if(document.getElementById('pd-name') && currentViewingProduct && String(currentViewingProduct.id || '') === safeId) {
            updatePDWishlistBtn(safeId);
        }
        if(document.getElementById('tab-account') && document.getElementById('tab-account').classList.contains('active') && typeof window.renderAccountTab === 'function') {
            window.renderAccountTab();
        }
        if(typeof window.renderWishlistUI === 'function') window.renderWishlistUI();
        if(document.getElementById('tab-products') && document.getElementById('tab-products').classList.contains('active') && typeof window.renderProductsTabContent === 'function') {
            window.renderProductsTabContent();
        }
        if(document.getElementById('tab-home') && document.getElementById('tab-home').classList.contains('active') && typeof window.renderHomeProductLists === 'function') {
            window.renderHomeProductLists(getFilteredProducts(shopProducts));
        }
    };

    const updatePDWishlistBtn = (id) => {
        const btn = document.getElementById('pd-wish-btn');
        if(!btn) return;
        syncWishlistState();
        if(wishlistData.includes(String(id || '').trim())) { btn.classList.add('text-red-500'); btn.classList.remove('text-gray-400'); }
        else { btn.classList.remove('text-red-500'); btn.classList.add('text-gray-400'); }
    };
    window.toggleDetailWishlist = () => { if(currentViewingProduct) toggleWishlist({ stopPropagation: () => {} }, currentViewingProduct.id); };

    window.openWishlist = () => { renderWishlistUI(); document.getElementById('wishlist-page').classList.remove('translate-x-full'); };
    window.closeWishlist = () => { document.getElementById('wishlist-page').classList.add('translate-x-full'); };

    window.renderWishlistUI = () => {
        const container = document.getElementById('wishlist-content');
        if(!container) return;
        
        syncWishlistState();
        if(wishlistData.length === 0) {
            container.innerHTML = `<div class='col-span-2 md:col-span-4 flex flex-col items-center justify-center py-20 text-gray-400'><i class='fa-regular fa-heart text-5xl mb-3 opacity-50'></i><p>Bạn chưa yêu thích sản phẩm nào.</p></div>`;
            return;
        }

        const wishedIds = new Set(wishlistData);
        const items = shopProducts.filter(p => wishedIds.has(String((p && p.id) || '').trim()));
        container.innerHTML = items.map(prod => `
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 relative group transition hover:shadow-md flex flex-col h-full overflow-hidden">
                <button onclick="toggleWishlist(event, '${prod.id}')" class="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-red-500 hover:text-gray-300 transition"><i class="fa-solid fa-heart"></i></button>
                <div onclick="openProductDetail('${prod.id}')" class="cursor-pointer">
                    <div class="relative overflow-hidden bg-gray-100 shadow-[inset_0_2px_5px_rgba(0,0,0,0.05)]">
                        ${renderProductBadges(prod)}
                        ${typeof window.renderResponsiveImageHtml === 'function'
                            ? window.renderResponsiveImageHtml(
                                prod.img,
                                'w600',
                                'w-full h-36 md:h-52 object-cover transition-transform duration-700 ease-out group-hover:scale-110',
                                {
                                    alt: getProductDisplayName(prod),
                                    loading: 'lazy',
                                    decoding: 'async',
                                    pictureClass: 'block'
                                }
                            )
                            : `<img src="${getOptimizedImageUrl(prod.img, 'w600')}" loading="lazy" decoding="async" class="w-full h-36 md:h-52 object-cover transition-transform duration-700 ease-out group-hover:scale-110" />`}
                    </div>
                    <div class="p-3">
                        <h4 class="text-sm font-bold text-gray-700 line-clamp-2 leading-tight mb-2 hover:text-babyPink transition">${getProductDisplayName(prod)}</h4>
                    </div>
                </div>
                <div class="flex justify-between items-end mt-auto px-3 pb-3">
                    <div>
                        <span class="text-babyPink font-extrabold text-sm block">${getProductPricingMeta(prod).currentText || formatProductPriceLabel(prod)}</span>
                        ${getProductPricingMeta(prod).hasSale ? `<span class="text-[11px] text-gray-400 line-through block mt-0.5">${getProductPricingMeta(prod).originalText}</span>` : ''}
                    </div>
                    <button onclick="${isProductInStock(prod) ? `openPopup('${prod.id}')` : `showToast('Sản phẩm hiện đã hết hàng.', 'warning')`}" class="${isProductInStock(prod) ? 'bg-babyPink text-white w-8 h-8 rounded-full shadow-md flex items-center justify-center hover:bg-pink-500 transition' : 'bg-gray-200 text-gray-400 w-8 h-8 rounded-full shadow-sm flex items-center justify-center opacity-60 cursor-not-allowed'}" ${isProductInStock(prod) ? '' : 'disabled'}><i class="fa-solid fa-cart-plus text-sm"></i></button>
                </div>
            </div>
        `).join('');
    };

    window.openOrders = async () => {
        await syncOrdersFromFirebase({ force: true });
        renderOrdersUI();
        document.getElementById('orders-page').classList.remove('translate-x-full');
    };
    window.closeOrders = () => {
        document.getElementById('orders-page').classList.add('translate-x-full');
        closeModalShell('order-detail-overlay');
    };
    window.closeOrderDetail = () => {
        activeOrderDetailId = null;
        closeModalShell('order-detail-overlay');
    };
    window.openOrderDetail = async (orderId) => {
        if(!currentUser || !currentUser.orders) return;
        await syncOrderDetailFromFirebase(orderId);
        const order = currentUser.orders.find(item => item.id === orderId);
        if(!order) return;
        activeOrderDetailId = orderId;
        const totals = getOrderTotals(order);
        const canCancelOrder = Number(order.rawStatus || 0) === 1;
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
                        <p class="text-xl font-extrabold text-babyPink">${formatMoney(totals.finalAmount)}</p>
                    </div>
                </div>
                ${canCancelOrder ? `
                    <button class="mt-4 w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold hover:bg-red-100 transition" onclick="cancelPendingOrder('${order.id}')">
                        Hủy đơn hàng này
                    </button>
                ` : ''}
            </div>
            <div class="space-y-3">
                ${(order.items || []).map(item => `
                    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3">
                        <img src="${getOptimizedImageUrl(item.img, 'w400')}" loading="lazy" decoding="async" class="w-20 h-20 object-cover rounded-xl border border-gray-100"/>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-sm text-gray-800 line-clamp-2">${getProductDisplayName(item)}</h4>
                            ${item.variantInfo ? `<p class="text-xs text-gray-500 mt-1">${item.variantInfo}</p>` : ''}
                            <div class="flex justify-between items-center mt-3 text-sm">
                                <span class="text-gray-500">SL: x${item.quantity}</span>
                                <span class="font-bold text-babyPink">${item.unit ? `${item.price} / ${item.unit}` : item.price}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        openModalShell('order-detail-overlay');
    };

    window.cancelPendingOrder = (orderId) => {
        if(!currentUser || !Array.isArray(currentUser.orders)) return;
        const order = currentUser.orders.find((entry) => String((entry && entry.id) || '') === String(orderId || ''));
        if(!order || Number(order.rawStatus || 0) !== 1) {
            showToast('Chỉ có thể hủy đơn ở trạng thái chờ xác nhận.', 'warning');
            return;
        }
        if(!window.retailFirebase || typeof window.retailFirebase.cancelOrder !== 'function') {
            showToast('Tính năng hủy đơn chưa sẵn sàng.', 'warning');
            return;
        }

        openConfirmModal('Bạn có chắc muốn hủy đơn hàng này?', async () => {
            try {
                const updated = await window.retailFirebase.cancelOrder(orderId);
                if(updated) {
                    currentUser = normalizeUserData({
                        ...currentUser,
                        orders: mergeOrdersById(currentUser.orders || [], [updated])
                    });
                    saveState();
                }
                renderOrdersUI();
                if(typeof window.renderAccountTab === 'function') window.renderAccountTab();
                closeOrderDetail();
                showToast('Đã hủy đơn hàng.', 'success');
            } catch(error) {
                console.warn('Khong huy duoc don hang:', error);
                showToast('Không thể hủy đơn hàng này. Vui lòng thử lại.', 'error');
            }
        });
    };

    window.renderOrdersUI = () => {
        const container = document.getElementById('orders-content');
        if(!container) return;
        if(!currentUser || !currentUser.orders || currentUser.orders.length === 0) {
            container.innerHTML = `<div class='flex flex-col items-center justify-center py-20 text-gray-400'><i class='fa-solid fa-box-open text-5xl mb-3 opacity-50'></i><p>Bạn chưa có đơn hàng nào.</p><button onclick='closeOrders(); goToTab("tab-home");' class='mt-4 border border-babyPink text-babyPink px-4 py-1.5 rounded-full text-sm font-bold'>Mua sắm ngay</button></div>`;
            return;
        }

        container.innerHTML = [...currentUser.orders].reverse().map(order => {
            const totals = getOrderTotals(order);
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
                        <span class="text-lg font-bold text-babyPink">${formatMoney(totals.finalAmount)}</span>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <button class="w-full bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-pink-50 hover:text-babyPink transition" onclick="openOrderDetail('${order.id}')">Xem chi tiết</button>
                    ${Number(order.rawStatus || 0) === 1
                        ? `<button class="w-full bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold hover:bg-red-100 transition" onclick="cancelPendingOrder('${order.id}')">Hủy đơn</button>`
                        : ``}
                </div>
            </div>`;
        }).join('');
    };

    const syncFilterDrawerUI = () => {
        const minEl = document.getElementById('filter-min-price');
        const maxEl = document.getElementById('filter-max-price');
        if(minEl) minEl.value = productFilters.minPrice;
        if(maxEl) maxEl.value = productFilters.maxPrice;
        document.querySelectorAll('.filter-flag-btn').forEach(btn => {
            const flag = btn.getAttribute('data-flag');
            const active = !!productFilters[flag];
            btn.classList.toggle('border-babyPink', active);
            btn.classList.toggle('text-babyPink', active);
            btn.classList.toggle('bg-pink-50', active);
        });
        document.querySelectorAll('.filter-sort-btn').forEach(btn => {
            const active = btn.getAttribute('data-sort') === productFilters.sort;
            btn.classList.toggle('border-babyPink', active);
            btn.classList.toggle('text-babyPink', active);
            btn.classList.toggle('bg-pink-50', active);
        });
    };
    window.openFilter = () => {
        syncFilterDrawerUI();
        openModalShell('filter-overlay');
    };
    window.closeFilter = () => { closeModalShell('filter-overlay'); };
    
    window.toggleFilterFlag = (btn, flag) => {
        productFilters[flag] = !productFilters[flag];
        btn.classList.toggle('border-babyPink', productFilters[flag]);
        btn.classList.toggle('text-babyPink', productFilters[flag]);
        btn.classList.toggle('bg-pink-50', productFilters[flag]);
    };
    window.selectSortOption = (btn, sortValue) => {
        productFilters.sort = sortValue;
        document.querySelectorAll('.filter-sort-btn').forEach(b => {
            b.classList.remove('border-babyPink', 'text-babyPink', 'bg-pink-50');
        });
        btn.classList.add('border-babyPink', 'text-babyPink', 'bg-pink-50');
    };
    window.resetFilter = () => {
        resetProductsFilters();
        closeFilter();
    };
    window.applyFilter = () => {
        productFilters.minPrice = document.getElementById('filter-min-price').value.trim();
        productFilters.maxPrice = document.getElementById('filter-max-price').value.trim();
        renderProductsTabContent();
        const filtered = getFilteredProducts(shopProducts);
        renderHomeProductLists(filtered);
        closeFilter();
    };

    window.openPopup = (id) => {
        const p = shopProducts.find(i=>i.id===id); if(!p) return;
        const minQty = getProductMinQty(p);
        currentViewingProduct = {...p, quantity: minQty, minQty};
        const inStock = isProductInStock(p);
        const pricingMeta = getProductPricingMeta(p);
        const popupBadges = [];
        if(pricingMeta.salePercent > 0) popupBadges.push({ label: `-${pricingMeta.salePercent}%`, className: 'bg-red-500 text-white' });
        (Array.isArray(p.badges) ? p.badges : []).forEach((badge) => {
            popupBadges.push({
                label: badge,
                className: badge === 'NEW'
                    ? 'bg-emerald-500 text-white'
                    : badge === 'HOT'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-400 text-white'
            });
        });
        const badgeHtml = popupBadges.length
            ? `<div class="flex justify-center gap-2 flex-wrap mb-3">${popupBadges.map((badge) => `<span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-[0.14em] shadow-sm ${badge.className}">${badge.label}</span>`).join('')}</div>`
            : '';
        document.getElementById('popup-body').innerHTML = `
            ${badgeHtml}
            ${typeof window.renderResponsiveImageHtml === 'function'
                ? window.renderResponsiveImageHtml(
                    p.img,
                    'w600',
                    'w-32 h-32 object-cover rounded-full mx-auto mb-4 border-4 border-pink-100 media-stable',
                    {
                        alt: getProductDisplayName(p),
                        loading: 'lazy',
                        decoding: 'async',
                        pictureClass: 'block mx-auto media-stable'
                    }
                )
                : `<img src="${getOptimizedImageUrl(p.img, 'w600')}" loading="lazy" decoding="async" class="w-32 h-32 object-cover rounded-full mx-auto mb-4 border-4 border-pink-100 media-stable"/>`}
            <h3 class="text-lg font-bold">${getProductDisplayName(p)}</h3>
            <div class="mt-2">
                <p class="text-babyPink text-xl font-extrabold">${pricingMeta.currentText || formatProductPriceLabel(p)}</p>
                ${pricingMeta.hasSale ? `<p class="text-sm text-gray-400 line-through mt-1">${pricingMeta.originalText}</p>` : ''}
            </div>
            ${(p.variants && p.variants.length) || minQty > 1 ? `<p class="text-xs text-gray-500 leading-5 mt-2">${[getProductVariantSummary(p), minQty > 1 ? `Mua tối thiểu ${minQty}${p.unit ? ` ${p.unit}` : ''}` : ''].filter(Boolean).join(' • ')}</p>` : ''}
            <div class="mt-4 flex items-center justify-center gap-3 ${inStock ? '' : 'opacity-50 pointer-events-none'}">
                        <span class="text-sm text-gray-500">Số lượng</span>
                <div class="qty-stepper qty-stepper-md">
                    <button class="qty-stepper-btn" onclick="popupChangeQty(-1)">-</button>
                    <input class="qty-stepper-input text-sm" id="popup-qty-input" inputmode="numeric" min="${minQty}" oninput="sanitizeQtyInput('popup-qty-input', ${minQty})" step="1" type="number" value="${minQty}"/>
                    <button class="qty-stepper-btn" onclick="popupChangeQty(1)">+</button>
                </div>
            </div>
        `;
        const popupAddBtn = document.getElementById('popup-add-btn');
        if(popupAddBtn) {
            popupAddBtn.disabled = !inStock;
            popupAddBtn.className = inStock
                ? 'flex-1 bg-babyPink text-white py-2.5 rounded-xl font-bold shadow-md hover:bg-pink-500 transition'
                : 'flex-1 bg-gray-200 text-gray-400 py-2.5 rounded-xl font-bold cursor-not-allowed opacity-60';
        popupAddBtn.innerText = inStock ? 'Thêm giỏ hàng' : 'Hết hàng';
        }
        document.getElementById('popup-overlay').classList.remove('opacity-0', 'pointer-events-none');
        document.getElementById('popup-content').classList.remove('scale-95'); document.getElementById('popup-content').classList.add('scale-100');
    };
    window.popupChangeQty = (delta) => {
        if(!isProductInStock(currentViewingProduct)) return;
        const input = document.getElementById('popup-qty-input');
        if(!input) return;
        const minQty = getProductMinQty(currentViewingProduct);
        const currentValue = window.sanitizeQtyInput('popup-qty-input', minQty);
        input.value = Math.max(minQty, currentValue + Number(delta || 0));
    };
    window.closePopup = () => {
        document.getElementById('popup-overlay').classList.add('opacity-0', 'pointer-events-none');
        document.getElementById('popup-content').classList.remove('scale-100'); document.getElementById('popup-content').classList.add('scale-95');
    };

    window.openProductDetail = (id) => {
        const p = shopProducts.find(i=>i.id===id); if(!p) return;
        currentViewingProduct = p;
        selectedVariants = {};
        const minQty = getProductMinQty(p);
        const detailQtyInput = document.getElementById('pd-qty-input');
        if(detailQtyInput) {
            detailQtyInput.min = String(minQty);
            detailQtyInput.value = String(minQty);
        }
        
        const imgArr = p.images || [p.img];
        document.getElementById('pd-img-slider').innerHTML = imgArr.map((src, index) => (
            typeof window.renderResponsiveImageHtml === 'function'
                ? window.renderResponsiveImageHtml(
                    src,
                    'w1200',
                    'w-full h-full object-contain shrink-0 snap-start media-stable',
                    {
                        id: `pd-img-${index}`,
                        alt: `Ảnh sản phẩm ${index + 1}`,
                        loading: index === 0 ? 'eager' : 'lazy',
                        decoding: 'async',
                        pictureClass: 'block w-full h-full shrink-0 snap-start media-stable'
                    }
                )
                : `<img id="pd-img-${index}" src="${getOptimizedImageUrl(src, 'w1200')}" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async" class="w-full h-full object-contain shrink-0 snap-start media-stable" />`
        )).join('');
        const thumbStrip = document.getElementById('pd-thumb-strip');
        if(thumbStrip) {
            thumbStrip.classList.toggle('hidden', imgArr.length <= 1);
            thumbStrip.classList.toggle('flex', imgArr.length > 1);
            thumbStrip.innerHTML = imgArr.map((src, index) => `
                <button class="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 ${index === 0 ? 'ring-2 ring-babyPink border-babyPink' : ''}" onclick="scrollProductDetailImage(${index})">
                    ${typeof window.renderResponsiveImageHtml === 'function'
                        ? window.renderResponsiveImageHtml(
                            src,
                            'w300',
                            'w-full h-full object-contain bg-white media-stable',
                            {
                                alt: `Thumbnail sản phẩm ${index + 1}`,
                                loading: 'lazy',
                                decoding: 'async',
                                pictureClass: 'block w-full h-full media-stable'
                            }
                        )
                        : `<img src="${getOptimizedImageUrl(src, 'w300')}" loading="lazy" decoding="async" class="w-full h-full object-contain bg-white media-stable"/>`}
                </button>
            `).join('');
        }
        const sliderEl = document.getElementById('pd-img-slider');
        if(sliderEl) {
            sliderEl.onscroll = () => {
                const nextIndex = Math.round((sliderEl.scrollLeft || 0) / Math.max(sliderEl.clientWidth || 1, 1));
                document.querySelectorAll('#pd-thumb-strip button').forEach((thumb, thumbIndex) => {
                    thumb.classList.toggle('ring-2', thumbIndex === nextIndex);
                    thumb.classList.toggle('ring-babyPink', thumbIndex === nextIndex);
                    thumb.classList.toggle('border-babyPink', thumbIndex === nextIndex);
                });
            };
        }

        const detailPricingMeta = getProductPricingMeta(p);
        document.getElementById('pd-price').innerHTML = `
            <span class="block">${detailPricingMeta.currentText || formatProductPriceLabel(p)}</span>
            ${detailPricingMeta.hasSale ? `<span class="block text-sm text-gray-400 line-through mt-1">${detailPricingMeta.originalText}</span>` : ''}
        `;
        document.getElementById('pd-name').innerText = getProductDisplayName(p);
        const categoryChipEl = document.getElementById('pd-category-chip');
        if(categoryChipEl) categoryChipEl.innerText = getProductGroupName(p) || p.cat || 'Sản phẩm';
        const typeChipEl = document.getElementById('pd-type-chip');
        const variantSummary = getProductVariantSummary(p);
        if(typeChipEl) typeChipEl.innerText = variantSummary || 'Mặc định';
        const soldEl = document.getElementById('pd-sold');
        if(soldEl) soldEl.innerText = String(Number(p.sold || 0) || 0);
        const stockEl = document.getElementById('pd-stock-value');
        if(stockEl) stockEl.innerText = String(typeof p.availableStock === 'number' ? p.availableStock : (typeof p.stock === 'number' ? p.stock : 0));
        const warehouseEl = document.getElementById('pd-warehouse-value');
        if(warehouseEl) warehouseEl.innerHTML = `<i class='fa-solid fa-location-dot text-babyPink'></i> ${window.STORE_WAREHOUSE_LABEL || 'Dị Nậu - Xã Tây Phương - TP. Hà Nội'}`;
        const detailDescription = String(p.detail_desc || p.description || p.mo_ta || p.desc || '').trim();
        const detailMetaLine = [getProductGroupName(p) ? `Nhóm: ${getProductGroupName(p).toLocaleUpperCase('vi-VN')}` : '', `Kho: ${window.STORE_WAREHOUSE_LABEL || 'Dị Nậu - Xã Tây Phương - TP. Hà Nội'}`]
            .filter(Boolean)
            .join(' | ');
        document.getElementById('pd-desc').innerText = detailDescription
            ? (detailDescription.indexOf(detailMetaLine) === 0 ? detailDescription : `${detailMetaLine}\n${detailDescription}`)
            : detailMetaLine;
        const variantSummaryEl = document.getElementById('pd-variant-summary');
        if(variantSummaryEl) {
        const summaryText = [variantSummary, minQty > 1 ? `Mua tối thiểu ${minQty}${p.unit ? ` ${p.unit}` : ''}` : ''].filter(Boolean).join(' • ');
            variantSummaryEl.classList.toggle('hidden', !summaryText);
            variantSummaryEl.innerText = summaryText || '';
        }
        const inStock = isProductInStock(p);
        const pdAddBtn = document.getElementById('pd-add-btn');
        const pdQtyWrap = document.getElementById('pd-qty-wrap');
        if(pdAddBtn) {
            pdAddBtn.disabled = !inStock;
            pdAddBtn.className = inStock
                ? 'flex-1 bg-pink-50 text-babyPink border border-pink-200 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-pink-100 transition'
                : 'flex-1 bg-gray-100 text-gray-400 border border-gray-200 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 opacity-60 cursor-not-allowed';
        pdAddBtn.innerHTML = inStock ? `<i class="fa-solid fa-cart-plus"></i> Thêm giỏ` : `<i class="fa-solid fa-ban"></i> Hết hàng`;
        }
        if(pdQtyWrap) {
            pdQtyWrap.classList.toggle('opacity-50', !inStock);
            pdQtyWrap.classList.toggle('pointer-events-none', !inStock);
        }
        
        updatePDWishlistBtn(p.id);

        const varContainer = document.getElementById('pd-variants-container');
        const varList = document.getElementById('pd-variants-list');
        if(p.variants && p.variants.length > 0) {
            varContainer.classList.remove('hidden');
            varList.innerHTML = p.variants.map((variant, vIdx) => `
                <div>
                    <p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">${variant.name}</p>
                    <div class="flex flex-wrap gap-2">
                        ${variant.options.map((opt, oIdx) => `
                            <button onclick="selectVariant('${variant.name}', '${opt}')" id="var-${vIdx}-${oIdx}" class="variant-btn-${variant.name.replace(/\s/g,'')} px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:border-babyPink transition">${opt}</button>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            p.variants.forEach((v) => selectVariant(v.name, v.options[0]));
        } else {
            varContainer.classList.add('hidden');
        }

        openModalShell('product-detail-page');
    };

    window.closeProductDetail = () => { closeModalShell('product-detail-page'); };

    window.pdChangeQty = (delta) => {
        if(!isProductInStock(currentViewingProduct)) return;
        const input = document.getElementById('pd-qty-input');
        if(!input) return;
        const minQty = getProductMinQty(currentViewingProduct);
        const currentValue = window.sanitizeQtyInput('pd-qty-input', minQty);
        input.value = Math.max(minQty, currentValue + Number(delta || 0));
    };
    window.scrollProductDetailImage = (index) => {
        const slider = document.getElementById('pd-img-slider');
        const thumbs = document.querySelectorAll('#pd-thumb-strip button');
        if(!slider) return;
        slider.scrollTo({ left: slider.clientWidth * index, behavior: 'smooth' });
        thumbs.forEach((thumb, thumbIndex) => {
            thumb.classList.toggle('ring-2', thumbIndex === index);
            thumb.classList.toggle('ring-babyPink', thumbIndex === index);
            thumb.classList.toggle('border-babyPink', thumbIndex === index);
        });
    };

    window.selectVariant = (varName, optionValue) => {
        selectedVariants[varName] = optionValue;
        const safeClass = `variant-btn-${varName.replace(/\s/g,'')}`;
        document.querySelectorAll(`.${safeClass}`).forEach(btn => {
            if(btn.innerText === optionValue) {
                btn.classList.add('border-babyPink', 'text-babyPink', 'bg-pink-50');
                btn.classList.remove('border-gray-300', 'text-gray-600');
            } else {
                btn.classList.remove('border-babyPink', 'text-babyPink', 'bg-pink-50');
                btn.classList.add('border-gray-300', 'text-gray-600');
            }
        });
    };

    window.processAddToCartFromDetail = () => {
        if(!currentViewingProduct) return;
        if(!isProductInStock(currentViewingProduct)) return showToast("Sản phẩm hiện đã hết hàng.", 'warning');
        if(currentViewingProduct.variants && currentViewingProduct.variants.length > 0) {
            const requiredCount = currentViewingProduct.variants.length;
            if(Object.keys(selectedVariants).length < requiredCount) {
                return showToast("Vui lòng chọn đầy đủ phân loại sản phẩm!", 'warning');
            }
        }
        
        const qty = Math.max(getProductMinQty(currentViewingProduct), window.sanitizeQtyInput('pd-qty-input', getProductMinQty(currentViewingProduct)));
        let varsText = Object.entries(selectedVariants).map(([k,v]) => `${k}: ${v}`).join(' | ');
        
        if(typeof window.addToCartLogic === 'function') window.addToCartLogic(currentViewingProduct, qty, varsText);
        showToast("Thêm giỏ hàng thành công!", 'success');
        closeProductDetail();
    };

    const addToCartLogic = (product, qty, variantStr) => {
        const cartItemId = variantStr ? `${product.id}_${variantStr}` : product.id;
        const existing = cartData.find(item => item.cartId === cartItemId);
        if(existing) {
            existing.quantity += qty;
        } else {
            cartData.push({
                cartId: cartItemId,
                id: product.id,
                name: product.name,
                code: getProductCode(product),
                group: getProductGroupName(product),
                price: product.price,
                img: product.img,
                quantity: qty,
                variantInfo: variantStr
            });
        }
        saveState();
        if(typeof window.updateBadgeNumbers === 'function') window.updateBadgeNumbers();
        if(typeof window.renderCartUI === 'function') window.renderCartUI();
    };

    // GIỎ HÀNG THƯỜNG DÙNG TRÊN POPUP HOẶC KHÔNG PHÂN LOẠI
    window.processAddToCart = () => {
        if(!currentViewingProduct) return;
        if(!isProductInStock(currentViewingProduct)) return showToast('Sản phẩm hiện đã hết hàng.', 'warning');
        const qtyInput = document.getElementById('popup-qty-input');
        const qty = Math.max(1, parseInt(qtyInput?.value || currentViewingProduct.quantity || 1, 10) || 1);
        if(typeof window.addToCartLogic === 'function') window.addToCartLogic(currentViewingProduct, qty, '');
        showToast('Đã thêm sản phẩm vào giỏ hàng.', 'success');
        closePopup();
    };

    window.updateBadgeNumbers = () => {
        const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
        const badges = ['cart-count-badge', 'pd-cart-badge', 'acc-cart-badge', 'pc-cart-badge'];
        badges.forEach(id => {
            const b = document.getElementById(id);
            if(b) b.innerText = totalItems;
        });
    };

    window.openCart = () => {
        openModalShell('cart-overlay');
        if(typeof window.renderCartUI === 'function') window.renderCartUI();
    };
    window.closeCart = () => { closeModalShell('cart-overlay'); };
    
    window.updateCartQty = (cartId, delta) => {
        const item = cartData.find(i => i.cartId === cartId); if(!item) return;
        item.quantity += delta; if(item.quantity <= 0) cartData = cartData.filter(i => i.cartId !== cartId);
        saveState(); if(typeof window.renderCartUI === 'function') window.renderCartUI();
    };

    window.renderCartUI = () => {
        const container = document.getElementById('cart-items-container');
        if(cartData.length === 0) {
            container.innerHTML = `<div class='flex flex-col items-center justify-center h-full text-gray-400 gap-2 mt-20'><i class='fa-solid fa-basket-shopping text-5xl opacity-30'></i><p>Giỏ hàng đang trống</p><button onclick='closeCart(); goToTab("tab-products"); if(typeof window.ensureTabInitialized === "function") window.ensureTabInitialized("tab-products", true);' class='mt-4 border border-babyPink text-babyPink px-4 py-1.5 rounded-full text-sm font-bold'>Mua sắm ngay</button></div>`;
            document.getElementById('cart-subtotal').classList.add('hidden');
            document.getElementById('discount-alert').classList.add('hidden');
            document.getElementById('cart-total-price').innerText = '0đ';
            return;
        }

        let totalAmount = 0;
        container.innerHTML = cartData.map(item => {
            const numPrice = parseMoney(item.price);
            totalAmount += numPrice * item.quantity;
            const varHtml = item.variantInfo ? `<p class="text-[10px] text-gray-500 bg-gray-50 rounded px-1.5 py-0.5 inline-block mt-1">${item.variantInfo}</p>` : '';
            return `
            <div class="flex gap-3 bg-white p-3 rounded-xl border border-gray-100 relative">
                <button onclick="updateCartQty('${item.cartId}', -999)" class="absolute top-2 right-2 text-gray-300 hover:text-red-500"><i class="fa-solid fa-xmark"></i></button>
                <img src="${getOptimizedImageUrl(item.img, 'w400')}" loading="lazy" decoding="async" class="w-20 h-20 object-cover rounded-lg" />
                <div class="flex flex-col flex-1 py-1 pr-4">
                    <h4 class="font-bold text-sm line-clamp-2 leading-tight">${getProductDisplayName(item)}</h4>
                    ${varHtml}
                    <div class="flex justify-between items-center mt-auto pt-2">
                        <span class="font-bold text-babyPink">${item.unit ? `${item.price} / ${item.unit}` : item.price}</span>
                        <div class="flex items-center gap-2 border rounded-lg p-0.5">
                            <button class="w-6 h-6 bg-gray-50 flex items-center justify-center hover:bg-gray-200 transition" onclick="updateCartQty('${item.cartId}', -1)"><i class="fa-solid fa-minus text-[10px]"></i></button>
                            <span class="inline-flex min-w-[2rem] items-center justify-center px-1 text-center text-xs font-bold leading-none">${item.quantity}</span>
                            <button class="w-6 h-6 bg-gray-50 flex items-center justify-center hover:bg-gray-200 transition" onclick="updateCartQty('${item.cartId}', 1)"><i class="fa-solid fa-plus text-[10px]"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');

        let discountPercent = 0;
        if(totalAmount >= 10000000) discountPercent = 20;
        else if(totalAmount >= 5000000) discountPercent = 15;
        else if(totalAmount >= 2000000) discountPercent = 10;
        else if(totalAmount >= 1000000) discountPercent = 7;
        else if(totalAmount >= 500000) discountPercent = 5;

        const discountValue = (totalAmount * discountPercent) / 100;
        const finalAmount = totalAmount - discountValue;

        const alertEl = document.getElementById('discount-alert');
        const subtotalEl = document.getElementById('cart-subtotal');
        
        if(discountPercent > 0) {
            alertEl.classList.remove('hidden');
            alertEl.innerHTML = `<i class="fa-solid fa-tags"></i> Tuyệt vời! Bạn được giảm ${discountPercent}% hóa đơn (-${formatMoney(discountValue)})`;
            subtotalEl.classList.remove('hidden');
            subtotalEl.innerText = formatMoney(totalAmount);
        } else {
            alertEl.classList.add('hidden');
            subtotalEl.classList.add('hidden');
        }
        document.getElementById('cart-total-price').innerText = formatMoney(finalAmount);
    };


    window.setupSwipeGestures = () => {
        const swipeables = document.querySelectorAll('.swipeable');
        swipeables.forEach(el => {
            let startX = 0;
            el.addEventListener('touchstart', e => { startX = e.changedTouches[0].screenX; }, {passive: true});
            el.addEventListener('touchend', e => {
                const endX = e.changedTouches[0].screenX;
                if(Math.abs(endX - startX) > 80) { 
                    if(el.id === 'product-detail-page') closeProductDetail();
                    else if(el.id === 'account-settings-page') closeSettings();
                    else if(el.id === 'cart-drawer') closeCart();
                    else if(el.id === 'filter-drawer') closeFilter();
                    else if(el.id === 'auth-page') closeAuth();
                    else if(el.id === 'orders-page') closeOrders();
                    else if(el.id === 'wishlist-page') closeWishlist();
                }
            }, {passive: true});
        });
    };

    if(document.readyState !== 'loading') {
        if(typeof window.setupSwipeGestures === 'function') window.setupSwipeGestures();
        if(typeof window.initFullscreenSwipe === 'function') window.initFullscreenSwipe();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if(typeof window.setupSwipeGestures === 'function') window.setupSwipeGestures();
            if(typeof window.initFullscreenSwipe === 'function') window.initFullscreenSwipe();
        }, { once: true });
    }


