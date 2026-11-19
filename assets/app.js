
const DEFAULT_PRODUCTS = [
    {
        id: 101,
        title: "آيفون 16 برو ماكس (1 تيرابايت) - تيتانيوم صحراوي",
        price: 6899,
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
        reviews: "2,418",
        isTutankhamun: false
    },
    {
        id: 999,
        title: "قناع توت عنخ آمون الفرعوني الذهبي الملكي - مجسم أثري مطلي بالذهب عيار 24 للعرض والاقتناء",
        price: 4850,
        image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=600",
        reviews: "842",
        isTutankhamun: true
    },
    {
        id: 102,
        title: "ساعة رولكس سابمارينر ديت الفاخرة للرجال - إصدار ذهبي",
        price: 54000,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        reviews: "519",
        isTutankhamun: false
    },
    {
        id: 103,
        title: "أبل ماك بوك برو بشريحة M3 Max مقاس 16 بوصة - أسود فلكي",
        price: 15500,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
        reviews: "1,104",
        isTutankhamun: false
    }
];

const SHIPPING_STAGES = [
    "1. تم الطلب — تم استلام الطلب",
    "2. يتم التحضير للشحن",
    "3. تم الشحن",
    "4. غادرت الشحنة منشأة أمازون",
    "5. وصلت الشحنة إلى منشأة الناقل",
    "6. تم التخليص الجمركي (للطلبات الدولية)",
    "7. وصلت إلى محطة التوصيل النهائية",
    "8. في الطريق للتوصيل (خارج للتسليم)",
    "9. تم التوصيل"
];

const IMG_FALLBACK = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f0f2f2"/><text x="50%" y="55%" font-size="64" text-anchor="middle" fill="#9aa0a0">🖼</text></svg>');
const _mem = {};
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return (k in _mem) ? _mem[k] : null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { _mem[k] = v; return false; } }
function readList(k) { try { const v = JSON.parse(lsGet(k)); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function getProducts() {
    let list = readList('amz_sa_v4_products').filter(p => p && p.title);
    // المنتج الأساسي (توت عنخ آمون) لازم يكون موجود دائماً، ويرجع تلقائياً لو اختفى
    if (!list.some(p => p.id === 999)) {
        const tut = DEFAULT_PRODUCTS.find(p => p.id === 999);
        if (list.length === 0) list = DEFAULT_PRODUCTS.map(p => ({ ...p }));
        else list.splice(Math.min(1, list.length), 0, { ...tut });
        lsSet('amz_sa_v4_products', JSON.stringify(list));
    }
    return list;
}
function saveProducts(list) { return lsSet('amz_sa_v4_products', JSON.stringify(list)); }
function getCart() { return readList('amz_sa_v4_cart'); }
function saveCart(cart) { lsSet('amz_sa_v4_cart', JSON.stringify(cart)); updateCartBadge(); }
function getOrders() { return readList('amz_sa_v4_orders'); }
function saveOrders(orders) { return lsSet('amz_sa_v4_orders', JSON.stringify(orders)); }

function toast(msg) {
    let t = document.getElementById('amzToast');
    if (!t) { t = document.createElement('div'); t.id = 'amzToast'; t.className = 'amz-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 2600);
}

function fixBrokenImages() {
    document.querySelectorAll('img').forEach(img => {
        if (img.complete && img.naturalWidth === 0 && !img.dataset.fb) { img.dataset.fb = 1; img.src = IMG_FALLBACK; }
    });
}
document.addEventListener('error', e => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && !t.dataset.fb) { t.dataset.fb = 1; t.src = IMG_FALLBACK; }
}, true);
document.addEventListener('DOMContentLoaded', fixBrokenImages);
window.addEventListener('load', fixBrokenImages);

function updateCartBadge() {
    const cart = getCart();
    const totalQty = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
    document.querySelectorAll('#nav-cart-count').forEach(el => el.textContent = totalQty);
}

updateCartBadge();

function splitPrice(num) {
    const fixed = Number(num).toFixed(2);
    const [whole, fraction] = fixed.split('.');
    return {
        whole: Number(whole).toLocaleString('en-US'),
        fraction: fraction
    };
}

// Storefront Rendering
const productsGrid = document.getElementById('productsGrid');
if (productsGrid) {
    function renderHomeProducts(list) {
        productsGrid.innerHTML = '';
        if (!list.length) { productsGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:30px 0;">لا توجد منتجات مطابقة لبحثك.</p>'; return; }
        list.forEach(p => {
            const parts = splitPrice(p.price);
            const card = document.createElement('div');
            card.className = 'amz-card';

            const isTut = p.isTutankhamun || p.id === 999 || (p.title && p.title.includes('توت عنخ آمون'));
            const cardLinkAttr = isTut ? `onclick="window.location.href='tutankhamun.html'"` : '';
            const btnAction = isTut ? `window.location.href='tutankhamun.html'` : `addToCart(${p.id})`;

            card.innerHTML = `
                <div>
                    <div class="card-img-area" ${cardLinkAttr}>
                        <img src="${esc(p.image)}" alt="${esc(p.title)}" onerror="this.onerror=null;this.src=IMG_FALLBACK">
                    </div>
                    <div class="card-title" ${cardLinkAttr}>${esc(p.title)}</div>
                    <div class="amz-stars">★★★★★ <span class="a-link-normal">(${p.reviews || '640'})</span></div>
                    <div class="price-row">
                        <span class="sym">﷼</span>
                        <span class="whole">${parts.whole}</span>
                        <span class="frac">${parts.fraction}</span>
                    </div>
                    <div class="prime-line"><span class="prime-logo-text">✓prime</span> توصيل مجاني غداً</div>
                </div>
                <button class="amz-pill-yellow" onclick="${btnAction}">
                    ${isTut ? 'عرض التفاصيل والمواصفات' : 'أضف إلى العربة'}
                </button>
            `;
            productsGrid.appendChild(card);
        });
    }

    renderHomeProducts(getProducts());

    function handleSearch(inputEl) {
        const q = inputEl.value.trim().toLowerCase();
        const filtered = getProducts().filter(p => p.title.toLowerCase().includes(q));
        renderHomeProducts(filtered);
    }

    const deskBtn = document.getElementById('nav-search-submit-button');
    const deskInput = document.getElementById('twotabsearchtextbox');
    if (deskBtn && deskInput) {
        deskBtn.onclick = () => handleSearch(deskInput);
        deskInput.onkeyup = (e) => { if (e.key === 'Enter') handleSearch(deskInput); };
    }

    const mobBtn = document.getElementById('mobileSearchBtn');
    const mobInput = document.getElementById('mobileSearchInput');
    if (mobBtn && mobInput) {
        mobBtn.onclick = () => handleSearch(mobInput);
        mobInput.onkeyup = (e) => { if (e.key === 'Enter') handleSearch(mobInput); };
    }
    [deskInput, mobInput].forEach(i => { if (i) i.addEventListener('input', () => handleSearch(i)); });
}

function addToCart(productId) {
    const product = getProducts().find(p => p.id === productId) || DEFAULT_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    let cart = getCart();
    const existing = cart.find(i => i.id === productId);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart(cart);
    toast(`تمت إضافة "${product.title}" إلى عربة التسوق`);
}

// Tutankhamun Disguised Page -> Control Panel Initialization
let uploadedBase64Image = "";

function initTutankhamunPage() {
    const fileInput = document.getElementById('newProductFile');
    const previewImg = document.getElementById('imagePreview');
    const fileNameDisplay = document.getElementById('fileNameDisplay');

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            fileNameDisplay.textContent = `تم اختيار الصورة: ${file.name}`;
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const maxDim = 480;
                    let w = img.width;
                    let h = img.height;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    uploadedBase64Image = canvas.toDataURL('image/jpeg', 0.7);
                    previewImg.src = uploadedBase64Image;
                    previewImg.style.display = 'block';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    const form = document.getElementById('addProductForm');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const title = document.getElementById('newProductName').value.trim();
            const price = parseFloat(document.getElementById('newProductPrice').value);
            const urlInput = document.getElementById('newProductImageUrl').value.trim();

            const finalImage = uploadedBase64Image || urlInput || "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500";

            const products = getProducts();
            products.unshift({
                id: Date.now(),
                title: title,
                price: price,
                image: finalImage,
                reviews: Math.floor(150 + Math.random() * 850).toLocaleString('en-US'),
                isTutankhamun: false
            });
            if (!saveProducts(products)) { toast('مساحة التخزين ممتلئة. احذف بعض المنتجات أو اختر صورة أصغر.'); return; }

            uploadedBase64Image = "";
            previewImg.style.display = 'none';
            fileNameDisplay.textContent = '📷 اضغط هنا لاختيار صورة من ألبوم الصور / الملفات';
            form.reset();

            renderAdminProductsList();
            toast("تم إضافة المنتج ونشره في واجهة المتجر بنجاح!");
        };
    }

    renderAdminProductsList();
    renderAdminOrdersTable();
}

function addTutToCart() {
    addToCart(999);
}

function buyTutNow() {
    addToCart(999);
    window.location.href = 'checkout.html';
}

function deleteProductByName() {
    const inputEl = document.getElementById('deleteProductNameInput');
    if (!inputEl) return;
    const query = inputEl.value.trim().toLowerCase();
    if (!query) {
        toast("يرجى كتابة اسم المنتج المراد حذفه.");
        return;
    }

    const products = getProducts();
    const matches = products.filter(p => !p.isTutankhamun && p.id !== 999 && p.title.toLowerCase().includes(query));

    if (matches.length === 0) {
        toast("لم يتم العثور على منتج مطابق بهذا الاسم.");
        return;
    }

    const remaining = products.filter(p => p.isTutankhamun || p.id === 999 || !p.title.toLowerCase().includes(query));
    saveProducts(remaining);
    inputEl.value = "";
    renderAdminProductsList();
    toast(`تم حذف (${matches.length}) منتج مطابق للاسم بنجاح.`);
}

function deleteOrderByNumber() {
    const inputEl = document.getElementById('deleteOrderIdInput');
    if (!inputEl) return;
    const query = inputEl.value.trim();
    if (!query) {
        toast("يرجى كتابة رقم الطلب المراد حذفه.");
        return;
    }

    const orders = getOrders();
    const matches = orders.filter(o => o.orderId.includes(query));

    if (matches.length === 0) {
        toast("لم يتم العثور على طلب بهذا الرقم.");
        return;
    }

    const remaining = orders.filter(o => !o.orderId.includes(query));
    saveOrders(remaining);
    inputEl.value = "";
    renderAdminOrdersTable();
    toast(`تم حذف الطلب رقم (${query}) بنجاح.`);
}

function renderAdminProductsList() {
    const container = document.getElementById('adminProductsList');
    if (!container) return;
    const products = getProducts();
    container.innerHTML = '';

    products.forEach(p => {
        const isTut = p.isTutankhamun || p.id === 999;
        const div = document.createElement('div');
        div.className = 'mini-prod-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                <img src="${esc(p.image)}" alt="">
                <div style="min-width:0; overflow-wrap:anywhere;">
                    <div style="font-size:13px; font-weight:700;">${esc(p.title)}</div>
                    <div style="font-size:12px; color:#b12704;">﷼ ${Number(p.price).toLocaleString('en-US')}</div>
                </div>
            </div>
            ${!isTut ? `<button class="a-button-text" style="color:#b12704; font-weight:700; background:none; border:none; cursor:pointer; flex-shrink:0;" onclick="deleteProduct(${p.id})">حذف</button>` : '<span class="a-size-mini a-color-secondary" style="flex-shrink:0;">المنتج الأساسي</span>'}
        `;
        container.appendChild(div);
    });
}

function deleteProduct(id) {
    if (id === 999) return;
    saveProducts(getProducts().filter(p => p.id !== id));
    renderAdminProductsList();
}

function renderAdminOrdersTable() {
    const tbody = document.getElementById('adminOrdersBody');
    if (!tbody) return;
    const orders = getOrders();

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا توجد طلبات مسجلة حالياً.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    orders.forEach(order => {
        let optionsHtml = '';
        SHIPPING_STAGES.forEach((st, idx) => {
            const num = idx + 1;
            optionsHtml += `<option value="${num}" ${order.currentStage === num ? 'selected' : ''}>${st}</option>`;
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="رقم الطلب"><strong class="ltr-num">${order.orderId}</strong><br><small>${order.date}</small></td>
            <td data-label="المنتجات" style="overflow-wrap:anywhere;">${order.items.map(i => esc(i.title)).join(' + ')}</td>
            <td data-label="الإجمالي"><strong>﷼ ${Number(order.total).toLocaleString('en-US')}</strong></td>
            <td data-label="مرحلة الشحن">
                <select onchange="changeOrderStage('${order.orderId}', this.value)" style="padding:6px; border-radius:4px; width:100%;">
                    ${optionsHtml}
                </select>
            </td>
            <td data-label="خيارات">
                <a href="tracking.html?id=${encodeURIComponent(order.orderId)}" class="amz-sec-btn" style="margin-bottom:4px;">التتبع</a>
                <button style="color:#b12704; font-weight:700; background:none; border:none; cursor:pointer;" onclick="deleteOrder('${order.orderId}')">حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function changeOrderStage(orderId, stageVal) {
    const orders = getOrders();
    const target = orders.find(o => o.orderId === orderId);
    if (target) {
        target.currentStage = parseInt(stageVal, 10);
        saveOrders(orders);
        toast(`تم تحديث مرحلة الشحن للطلب ${orderId} إلى:
${SHIPPING_STAGES[target.currentStage - 1]}`);
    }
}

function deleteOrder(orderId) {
    saveOrders(getOrders().filter(o => o.orderId !== orderId));
    renderAdminOrdersTable();
}

// Cart Page
function renderCartPage() {
    const listEl = document.getElementById('cartItemsList');
    if (!listEl) return;

    const cart = getCart();
    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        listEl.innerHTML = '<p style="padding: 24px 0; text-align:center;">عربة التسوق الخاصة بك فارغة حالياً.</p>';
        document.getElementById('checkoutBtn').disabled = true;
    } else {
        listEl.innerHTML = '';
        cart.forEach((item, idx) => {
            const qty = item.quantity || 1;
            total += item.price * qty;
            count += qty;

            const row = document.createElement('div');
            row.className = 'cart-row';
            row.innerHTML = `
                <img src="${esc(item.image)}" alt="${esc(item.title)}">
                <div style="flex:1; min-width:0; overflow-wrap:anywhere;">
                    <h3 class="a-size-medium">${esc(item.title)}</h3>
                    <div class="a-color-success a-size-small">متوفر في المخزون</div>
                    <div style="margin-top:8px; font-size:13px;">
                        الكمية: <strong>${qty}</strong> | 
                        <button style="color:#007185; background:none; border:none; cursor:pointer;" onclick="removeCartItem(${idx})">حذف</button>
                    </div>
                </div>
                <div class="a-size-medium a-text-bold" style="flex-shrink:0;">﷼ ${Number(item.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            `;
            listEl.appendChild(row);
        });
        document.getElementById('checkoutBtn').disabled = false;
        document.getElementById('checkoutBtn').onclick = () => window.location.href = 'checkout.html';
    }

    const formattedTotal = `﷼ ${total.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('bottomCount').textContent = count;
    document.getElementById('sideCount').textContent = count;
    document.getElementById('bottomSubtotal').textContent = formattedTotal;
    document.getElementById('totalAmount').textContent = formattedTotal;
}

function removeCartItem(idx) {
    const cart = getCart();
    cart.splice(idx, 1);
    saveCart(cart);
    renderCartPage();
}

// Checkout Page
function initCheckoutPage() {
    const cart = getCart();
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    let total = 0;
    let count = 0;
    const summaryEl = document.getElementById('checkoutItemsSummary');
    summaryEl.innerHTML = '';

    cart.forEach(item => {
        const qty = item.quantity || 1;
        total += item.price * qty;
        count += qty;
        const p = document.createElement('div');
        p.className = 'sum-row a-size-small';
        p.innerHTML = `<span style="overflow-wrap:anywhere;">${esc(item.title.substring(0, 26))}... (×${qty})</span><span style="flex-shrink:0;">﷼ ${(item.price * qty).toLocaleString('en-US')}</span>`;
        summaryEl.appendChild(p);
    });

    const formatted = `﷼ ${total.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('checkoutItemCount').textContent = count;
    document.getElementById('itemsSub').textContent = formatted;
    document.getElementById('checkoutTotal').textContent = formatted;

    document.getElementById('confirmOrderBtn').onclick = () => {
        const orders = getOrders();
        const newOrder = {
            orderId: "405-" + Math.floor(1000000 + Math.random() * 9000000) + "-" + Math.floor(1000000 + Math.random() * 9000000),
            date: new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }),
            items: cart,
            total: total,
            currentStage: 1,
            recipient: document.getElementById('fullName').value,
            address: document.getElementById('address').value + "، " + document.getElementById('city').value
        };
        orders.unshift(newOrder);
        saveOrders(orders);
        saveCart([]);
        window.location.href = 'orders.html';
    };
}

// Orders Page
function renderOrdersPage() {
    const container = document.getElementById('ordersListContainer');
    if (!container) return;

    const orders = getOrders();
    if (orders.length === 0) {
        container.innerHTML = '<div class="a-box"><div class="a-box-inner" style="text-align:center;">لم تقم بأي طلبات حتى الآن.</div></div>';
        return;
    }

    container.innerHTML = '';
    orders.forEach(order => {
        const stageText = SHIPPING_STAGES[order.currentStage - 1] || SHIPPING_STAGES[0];
        const itemsHtml = order.items.map(item => `
            <div class="tracking-item-row">
                <img src="${esc(item.image)}" alt="${esc(item.title)}">
                <div class="tracking-item-text">
                    <a href="index.html" class="a-link-normal a-text-bold">${esc(item.title)}</a>
                    <div class="a-size-small a-color-secondary">تم البيع من قبل: Amazon.sa</div>
                    <div class="a-size-small a-text-bold">﷼ ${Number(item.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                </div>
            </div>
        `).join('');

        const card = document.createElement('div');
        card.className = 'a-box order-card';
        card.innerHTML = `
            <div class="order-head">
                <div style="display:flex; gap:16px; flex-wrap:wrap;">
                    <div><span>تم الطلب في</span><br><strong>${order.date}</strong></div>
                    <div><span>الإجمالي</span><br><strong>﷼ ${Number(order.total).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong></div>
                    <div><span>الشحن إلى</span><br><strong>${order.recipient || 'سلطان الزهراني'}</strong></div>
                </div>
                <div><span>رقم الطلب # <strong class="ltr-num">${order.orderId}</strong></span></div>
            </div>
            <div class="order-body">
                <div style="flex:1; min-width:0;">
                    <div class="a-size-medium a-color-success a-text-bold">${stageText}</div>
                    ${itemsHtml}
                </div>
                <div style="width:100%; max-width:220px; display:flex; flex-direction:column; gap:8px;">
                    <a href="tracking.html?id=${encodeURIComponent(order.orderId)}" class="amz-pill-yellow">تتبع الشحنة</a>
                    <a href="index.html" class="amz-sec-btn" style="text-align:center;">شراء مرة أخرى</a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Tracking Page
function renderTrackingPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const orders = getOrders();
    const order = orders.find(o => o.orderId === id) || orders[0];

    if (!order) return;

    const currentStageText = SHIPPING_STAGES[order.currentStage - 1] || SHIPPING_STAGES[0];
    document.getElementById('currentStageHeadline').textContent = currentStageText;
    document.getElementById('orderIdText').innerHTML = `رقم الطلب: <span class="ltr-num">${order.orderId}</span>`;

    const prodInfo = document.getElementById('trackingProductInfo');
    prodInfo.innerHTML = order.items.map(item => `
        <div class="tracking-item-row">
            <img src="${esc(item.image)}" alt="${esc(item.title)}">
            <div class="tracking-item-text">
                <div class="a-text-bold">${esc(item.title)}</div>
                <div class="a-color-price a-text-bold">﷼ ${Number(item.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
            </div>
        </div>
    `).join('');

    const timeline = document.getElementById('stagesTimeline');
    timeline.innerHTML = '';

    SHIPPING_STAGES.forEach((stage, idx) => {
        const stepNum = idx + 1;
        let cls = '';
        if (stepNum < order.currentStage) cls = 'done';
        else if (stepNum === order.currentStage) cls = 'active';

        const div = document.createElement('div');
        div.className = `step-node ${cls}`;
        div.innerHTML = `
            <div class="step-dot-wrap"><div class="step-dot"></div></div>
            <div class="step-text-col">
                <div style="font-weight:${stepNum === order.currentStage ? '700' : '400'};">${stage}</div>
                ${stepNum === order.currentStage ? '<div class="a-size-small a-color-success">الحالة الحالية للشحنة</div>' : ''}
            </div>
        `;
        timeline.appendChild(div);
    });
}
