// ==========================================
//  THAI COSTUME SHOP - Main App Logic
// ==========================================

// ============ DATA ============
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'ชุดไทยหญิง สีชมพูทอง',
    category: 'thai-girl',
    gender: 'girl',
    desc: 'ชุดไทยซาบซึ้ง สีชมพูทองคำ ผ้าไหมเทียม ปักลายดอกไม้ไทย พร้อมชุดเครื่องประดับทอง เหมาะสำหรับงานไหว้ครู วันแม่ เทศกาลต่างๆ',
    image: 'img_thai_girl.png',
    priceRent: 250,
    priceBuy: 1200,
    stock: 5,
    sizes: [
      { label: 'S', age: '3-4ปี', stock: 2 },
      { label: 'M', age: '5-6ปี', stock: 2 },
      { label: 'L', age: '7-8ปี', stock: 1 },
      { label: 'XL', age: '9-10ปี', stock: 0 },
    ],
    badges: ['เช่าได้', 'ยอดนิยม'],
    isNew: false,
    isPopular: true,
  },
  {
    id: 2,
    name: 'ชุดไทยชาย สีน้ำเงินทอง',
    category: 'thai-boy',
    gender: 'boy',
    desc: 'ชุดไทยพระราชนิยม สีน้ำเงินทอง ผ้าไหม ตัดเย็บพิถีพิถัน พร้อมกางเกงจีบและเข็มขัดทอง สง่างามเหมาะแก่กาล',
    image: 'img_thai_boy.png',
    priceRent: 200,
    priceBuy: 1000,
    stock: 4,
    sizes: [
      { label: 'S', age: '3-4ปี', stock: 1 },
      { label: 'M', age: '5-6ปี', stock: 2 },
      { label: 'L', age: '7-8ปี', stock: 1 },
      { label: 'XL', age: '9-10ปี', stock: 0 },
    ],
    badges: ['เช่าได้'],
    isNew: false,
    isPopular: false,
  },
  {
    id: 3,
    name: 'ชุดนางเงือก มัจฉา',
    category: 'mermaid',
    gender: 'girl',
    desc: 'ชุดนางเงือกสีม่วงอมฟ้า มีความวาวพิเศษจากเลื่อมทะเล ชุดเดรสปลาแกะสลักงดงาม เหมาะสำหรับงานคาร์นิวัล ประกวดชุดแฟนซี',
    image: 'img_mermaid.png',
    priceRent: 350,
    priceBuy: 1500,
    stock: 3,
    sizes: [
      { label: 'S', age: '3-4ปี', stock: 1 },
      { label: 'M', age: '5-6ปี', stock: 1 },
      { label: 'L', age: '7-8ปี', stock: 1 },
      { label: 'XL', age: '9-10ปี', stock: 0 },
    ],
    badges: ['เช่าได้', 'ใหม่'],
    isNew: true,
    isPopular: false,
  },
  {
    id: 4,
    name: 'ชุดประกวดเจ้าหญิง มงกุฎทอง',
    category: 'princess',
    gender: 'girl',
    desc: 'ชุดบอลเกาวน์สีม่วงลาเวนเดอร์ ประดับคริสตัลระยิบระยับ กระโปรงฟูฟ่อง พร้อมมงกุฎคริสตัล เหมาะสำหรับงานประกวดทุกประเภท',
    image: 'img_princess.png',
    priceRent: 500,
    priceBuy: 2200,
    stock: 2,
    sizes: [
      { label: 'S', age: '3-4ปี', stock: 0 },
      { label: 'M', age: '5-6ปี', stock: 1 },
      { label: 'L', age: '7-8ปี', stock: 1 },
      { label: 'XL', age: '9-10ปี', stock: 0 },
    ],
    badges: ['เช่าได้', 'พรีเมียม'],
    isNew: false,
    isPopular: true,
  },
  {
    id: 5,
    name: 'ชุดกษัตริย์น้อย แดงทอง',
    category: 'prince',
    gender: 'boy',
    desc: 'ชุดกษัตริย์แบบยุโรป สีแดงทอง ผ้ากำมะหยี่คุณภาพสูง ติดเหรียญเกียรติยศ พร้อมมงกุฎทอง เหมาะสำหรับงานประกวดและกิจกรรมพิเศษ',
    image: 'img_prince.png',
    priceRent: 400,
    priceBuy: 1800,
    stock: 3,
    sizes: [
      { label: 'S', age: '3-4ปี', stock: 1 },
      { label: 'M', age: '5-6ปี', stock: 1 },
      { label: 'L', age: '7-8ปี', stock: 1 },
      { label: 'XL', age: '9-10ปี', stock: 0 },
    ],
    badges: ['เช่าได้'],
    isNew: true,
    isPopular: false,
  },
  {
    id: 6,
    name: 'ชุดไทยบรมพิมาน สีทอง',
    category: 'thai-girl',
    gender: 'girl',
    desc: 'ชุดไทยบรมพิมานสีทองหรูหรา ผ้าไหมทองแท้ ปักดิ้นลวดลายไทยโบราณ พร้อมชฎาทองและเครื่องประดับครบชุด ยอดเยี่ยมสำหรับงานพิเศษ',
    image: 'img_thai_gold.png',
    priceRent: 380,
    priceBuy: 1600,
    stock: 4,
    sizes: [
      { label: 'S', age: '3-4ปี', stock: 1 },
      { label: 'M', age: '5-6ปี', stock: 2 },
      { label: 'L', age: '7-8ปี', stock: 1 },
      { label: 'XL', age: '9-10ปี', stock: 0 },
    ],
    badges: ['เช่าได้', 'พรีเมียม'],
    isNew: false,
    isPopular: true,
  },
];

// ============ STATE ============
let products = [];
let cart = [];
let currentCategory = 'all';
let currentGender = 'all';
let currentSearch = '';
let currentSort = 'default';
let selectedProduct = null;
let selectedType = 'rent';
let selectedSize = null;
let checkoutStep = 1;
let slipDataUrl = null;
let orderCounter = 1;

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderProducts();
  updateCategoryCounts();
  renderCart();
  setMinDates();
});

function loadData() {
  const stored = localStorage.getItem('tcs_products');
  products = stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  const cartStored = localStorage.getItem('tcs_cart');
  cart = cartStored ? JSON.parse(cartStored) : [];
  const orderCountStored = localStorage.getItem('tcs_order_counter');
  orderCounter = orderCountStored ? parseInt(orderCountStored) : 1;
}

function saveProducts() {
  localStorage.setItem('tcs_products', JSON.stringify(products));
}
function saveCart() {
  localStorage.setItem('tcs_cart', JSON.stringify(cart));
}

// ============ PRODUCTS ============
function getFilteredProducts() {
  let list = [...products];
  if (currentCategory !== 'all') {
    list = list.filter(p => p.category === currentCategory);
  }
  if (currentGender !== 'all') {
    list = list.filter(p => p.gender === currentGender || p.gender === 'unisex');
  }
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase().trim();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q) ||
      p.category.includes(q)
    );
  }
  switch (currentSort) {
    case 'price-asc': list.sort((a, b) => a.priceRent - b.priceRent); break;
    case 'price-desc': list.sort((a, b) => b.priceRent - a.priceRent); break;
    case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name, 'th')); break;
    case 'stock-desc': list.sort((a, b) => b.stock - a.stock); break;
  }
  return list;
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const noProducts = document.getElementById('noProducts');
  const list = getFilteredProducts();
  if (list.length === 0) {
    grid.innerHTML = '';
    noProducts.classList.remove('hidden');
    return;
  }
  noProducts.classList.add('hidden');
  grid.innerHTML = list.map(p => renderProductCard(p)).join('');
}

function renderProductCard(p) {
  const stockClass = p.stock === 0 ? 'out-stock' : p.stock <= 2 ? 'low-stock' : 'in-stock';
  const stockLabel = p.stock === 0 ? 'หมดชั่วคราว' : p.stock <= 2 ? `เหลือ ${p.stock} ชิ้น` : `มีสต็อก ${p.stock} ชิ้น`;
  const badgesHtml = [
    p.isNew ? '<span class="badge badge-new">✨ ใหม่</span>' : '',
    p.isPopular ? '<span class="badge badge-popular">🔥 ยอดนิยม</span>' : '',
    p.stock === 0 ? '<span class="badge badge-out">หมดแล้ว</span>' : '',
    p.stock > 0 && p.stock <= 2 ? '<span class="badge badge-low">⚠️ เหลือน้อย</span>' : '',
  ].filter(Boolean).join('');
  const catLabel = getCatLabel(p.category);
  return `
    <div class="product-card" onclick="openProduct(${p.id})">
      <div class="product-image-wrap">
        <img src="${p.image}" alt="${p.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22><rect fill=%22%23F2E8D5%22 width=%22300%22 height=%22300%22/><text x=%22150%22 y=%22155%22 text-anchor=%22middle%22 fill=%22%23C4527A%22 font-size=%2264%22>👗</text></svg>'">
        <div class="product-badges">${badgesHtml}</div>
        <button class="product-wishlist" onclick="event.stopPropagation(); toggleWishlist(this)" title="บันทึก">🤍</button>
      </div>
      <div class="product-info">
        <div class="product-category">${catLabel}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-sizes">
          ${p.sizes.map(s => `<span class="size-chip">${s.label}(${s.age})</span>`).join('')}
        </div>
        <div class="product-pricing">
          <div class="price-rent">เช่า <span>฿${p.priceRent.toLocaleString()}</span>/วัน</div>
          <div class="price-buy">ซื้อ <span>฿${p.priceBuy.toLocaleString()}</span></div>
        </div>
        <div class="stock-indicator">
          <span class="stock-dot ${stockClass}"></span>
          <span style="font-size:12px;color:var(--text-muted);">${stockLabel}</span>
        </div>
        <div class="product-actions">
          <button class="btn btn-wine btn-sm" onclick="event.stopPropagation(); quickAddToCart(${p.id})" ${p.stock === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
            🛒 ${p.stock === 0 ? 'หมดแล้ว' : 'เพิ่มในตะกร้า'}
          </button>
          <button class="btn btn-outline-gold btn-sm btn-icon" onclick="event.stopPropagation(); openProduct(${p.id})" title="ดูรายละเอียด">👁️</button>
        </div>
      </div>
    </div>
  `;
}

function getCatLabel(cat) {
  const map = {
    'thai-girl': '🌸 ชุดไทยหญิง',
    'thai-boy': '👦 ชุดไทยชาย',
    'mermaid': '🧜 ชุดนางเงือก',
    'princess': '👸 ชุดประกวด',
    'prince': '🤴 ชุดกษัตริย์',
  };
  return map[cat] || '👗 ชุด';
}

function updateCategoryCounts() {
  const cats = ['thai-girl', 'thai-boy', 'mermaid', 'princess', 'prince'];
  document.getElementById('count-all').textContent = products.length;
  cats.forEach(c => {
    const el = document.getElementById('count-' + c);
    if (el) el.textContent = products.filter(p => p.category === c).length;
  });
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    document.querySelectorAll('.cat-tab').forEach(t => {
      if (t.dataset.cat === cat) t.classList.add('active');
    });
  }
  renderProducts();
  scrollToProducts();
}

function filterGender(val) {
  currentGender = val;
  renderProducts();
}

function searchProducts(val) {
  currentSearch = val;
  renderProducts();
}

function sortProducts(val) {
  currentSort = val;
  renderProducts();
}

function scrollToProducts() {
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function toggleWishlist(btn) {
  btn.classList.toggle('active');
  btn.textContent = btn.classList.contains('active') ? '❤️' : '🤍';
  showToast(btn.classList.contains('active') ? 'เพิ่มในรายการโปรดแล้ว ❤️' : 'นำออกจากรายการโปรดแล้ว', 'info');
}

// ============ PRODUCT DETAIL MODAL ============
function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  selectedProduct = p;
  selectedType = 'rent';
  selectedSize = null;

  document.getElementById('pdModalTitle').textContent = p.name;
  document.getElementById('pdMainImg').src = p.image;
  document.getElementById('pdCategory').textContent = getCatLabel(p.category);
  document.getElementById('pdName').textContent = p.name;
  document.getElementById('pdDesc').textContent = p.desc;
  document.getElementById('rentPrice').innerHTML = `฿${p.priceRent.toLocaleString()}<small>/วัน</small>`;
  document.getElementById('buyPrice').textContent = `฿${p.priceBuy.toLocaleString()}`;

  // Stock indicator
  const stockClass = p.stock === 0 ? 'out-stock' : p.stock <= 2 ? 'low-stock' : 'in-stock';
  const stockLabel = p.stock === 0 ? 'หมดชั่วคราว' : `มีสต็อก ${p.stock} ชิ้น`;
  document.getElementById('pdStock').innerHTML = `
    <span class="stock-dot ${stockClass}"></span>
    <span>${stockLabel}</span>
  `;

  // Sizes
  const sizeContainer = document.getElementById('sizeOptions');
  sizeContainer.innerHTML = p.sizes.map((s, i) => `
    <button class="size-opt ${s.stock === 0 ? 'disabled' : ''}"
      onclick="${s.stock > 0 ? `selectSize(${i})` : ''}"
      data-index="${i}" ${s.stock === 0 ? 'disabled' : ''}>
      ${s.label}
      <span class="size-age">${s.age}</span>
    </button>
  `).join('');

  // Default to rent
  selectType('rent');
  document.getElementById('typeRent').classList.add('active');
  document.getElementById('typeBuy').classList.remove('active');

  document.getElementById('productModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProductModal(e) {
  if (e && e.target !== document.getElementById('productModal')) return;
  document.getElementById('productModal').classList.add('hidden');
  document.body.style.overflow = '';
}

function selectType(type) {
  selectedType = type;
  const rentSection = document.getElementById('rentDateSection');
  if (type === 'rent') {
    document.getElementById('typeRent').classList.add('active');
    document.getElementById('typeBuy').classList.remove('active');
    rentSection.style.display = 'block';
  } else {
    document.getElementById('typeBuy').classList.add('active');
    document.getElementById('typeRent').classList.remove('active');
    rentSection.style.display = 'none';
  }
}

function selectSize(index) {
  selectedSize = index;
  document.querySelectorAll('.size-opt').forEach((el, i) => {
    el.classList.toggle('selected', i === index);
  });
}

function setMinDates() {
  const today = new Date().toISOString().split('T')[0];
  const rentStart = document.getElementById('rentStart');
  const rentEnd = document.getElementById('rentEnd');
  if (rentStart) rentStart.min = today;
  if (rentEnd) rentEnd.min = today;
}

function calcRentDays() {
  const start = document.getElementById('rentStart').value;
  const end = document.getElementById('rentEnd').value;
  const summaryDiv = document.getElementById('rentSummary');
  if (start && end && selectedProduct) {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    if (days > 0) {
      const total = days * selectedProduct.priceRent;
      document.getElementById('rentDays').textContent = days;
      document.getElementById('rentTotal').textContent = `฿${total.toLocaleString()}`;
      summaryDiv.style.display = 'block';
    } else {
      summaryDiv.style.display = 'none';
    }
  }
}

function addToCartFromModal() {
  if (!selectedProduct) return;
  if (selectedSize === null) {
    showToast('กรุณาเลือกขนาด/ไซส์ก่อนครับ', 'warning');
    return;
  }
  const sz = selectedProduct.sizes[selectedSize];
  let price, meta;
  if (selectedType === 'rent') {
    const start = document.getElementById('rentStart').value;
    const end = document.getElementById('rentEnd').value;
    if (!start || !end) {
      showToast('กรุณาเลือกวันเช่า-คืนก่อนครับ', 'warning');
      return;
    }
    const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      showToast('วันคืนต้องอยู่หลังวันเช่า', 'error');
      return;
    }
    price = days * selectedProduct.priceRent;
    meta = `เช่า ${days} วัน (${start} ถึง ${end}) · ไซส์ ${sz.label}`;
  } else {
    price = selectedProduct.priceBuy;
    meta = `ซื้อ · ไซส์ ${sz.label} (${sz.age})`;
  }
  addToCart({
    productId: selectedProduct.id,
    name: selectedProduct.name,
    image: selectedProduct.image,
    type: selectedType,
    price,
    meta,
    size: sz.label,
  });
  closeProductModal();
}

function quickAddToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || p.stock === 0) return;
  // Find first available size
  const availSize = p.sizes.find(s => s.stock > 0);
  addToCart({
    productId: p.id,
    name: p.name,
    image: p.image,
    type: 'rent',
    price: p.priceRent,
    meta: `เช่า/วัน · ไซส์ ${availSize ? availSize.label : 'M'}`,
    size: availSize ? availSize.label : 'M',
  });
  openCart();
}

// ============ CART ============
function addToCart(item) {
  item.cartId = Date.now() + Math.random();
  cart.push(item);
  saveCart();
  renderCart();
  updateCartBadge();
  showToast(`เพิ่ม "${item.name}" ในตะกร้าแล้ว 🛒`, 'success');
}

function removeFromCart(cartId) {
  cart = cart.filter(i => i.cartId !== cartId);
  saveCart();
  renderCart();
  updateCartBadge();
}

function clearCart() {
  if (!confirm('ต้องการล้างตะกร้าทั้งหมดหรือไม่?')) return;
  cart = [];
  saveCart();
  renderCart();
  updateCartBadge();
  showToast('ล้างตะกร้าสินค้าแล้ว', 'info');
}

function renderCart() {
  const list = document.getElementById('cartItemsList');
  const footer = document.getElementById('cartFooter');
  const countLabel = document.getElementById('cartCountLabel');
  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <p>ยังไม่มีสินค้าในตะกร้า</p>
        <p style="font-size:13px;margin-top:8px;">เลือกชุดที่ชอบแล้วกดเพิ่มในตะกร้า</p>
      </div>`;
    footer.style.display = 'none';
    countLabel.textContent = '0 รายการ';
    return;
  }
  const total = cart.reduce((s, i) => s + i.price, 0);
  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22><rect fill=%22%23F2E8D5%22 width=%22300%22 height=%22300%22/><text x=%22150%22 y=%22155%22 text-anchor=%22middle%22 fill=%22%23C4527A%22 font-size=%2264%22>👗</text></svg>'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">${item.meta}</div>
        <span class="cart-item-type ${item.type}">${item.type === 'rent' ? '🎀 เช่า' : '💛 ซื้อ'}</span>
        <div class="cart-item-price">฿${item.price.toLocaleString()}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.cartId})">🗑️</button>
    </div>
  `).join('');
  document.getElementById('cartItemCount').textContent = `${cart.length} รายการ`;
  document.getElementById('cartTotal').textContent = `฿${total.toLocaleString()}`;
  footer.style.display = 'block';
  countLabel.textContent = `${cart.length} รายการ`;
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (cart.length > 0) {
    badge.style.display = 'flex';
    badge.textContent = cart.length;
  } else {
    badge.style.display = 'none';
  }
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
  if (sidebar.classList.contains('open')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function openCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  sidebar.classList.add('open');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// ============ CHECKOUT ============
function openCheckout() {
  if (cart.length === 0) { showToast('ตะกร้าว่างเปล่า', 'warning'); return; }
  // Close cart sidebar
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('show');
  checkoutStep = 1;
  updateCheckoutStep();
  renderCheckoutItems();
  document.getElementById('checkoutModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal(e) {
  if (e && e.target !== document.getElementById('checkoutModal')) return;
  document.getElementById('checkoutModal').classList.add('hidden');
  document.body.style.overflow = '';
  checkoutStep = 1;
}

function renderCheckoutItems() {
  const total = cart.reduce((s, i) => s + i.price, 0);
  document.getElementById('checkoutItemList').innerHTML = cart.map(item => `
    <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:14px;">
      <span>${item.name} <small style="color:var(--text-muted)">(${item.meta})</small></span>
      <span style="font-weight:700;">฿${item.price.toLocaleString()}</span>
    </div>
  `).join('');
  document.getElementById('checkoutTotal').textContent = `฿${total.toLocaleString()}`;
  document.getElementById('paymentAmount').textContent = `฿${total.toLocaleString()}`;
}

function updateCheckoutStep() {
  ['checkoutStep1', 'checkoutStep2', 'checkoutStep3'].forEach((id, i) => {
    document.getElementById(id).classList.toggle('hidden', i !== checkoutStep - 1);
  });
  ['step1Indicator', 'step2Indicator', 'step3Indicator'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove('active', 'done');
    if (i + 1 === checkoutStep) el.classList.add('active');
    if (i + 1 < checkoutStep) el.classList.add('done');
  });
  const backBtn = document.getElementById('checkoutBackBtn');
  const nextBtn = document.getElementById('checkoutNextBtn');
  backBtn.style.display = checkoutStep > 1 && checkoutStep < 3 ? 'block' : 'none';
  if (checkoutStep === 3) {
    nextBtn.textContent = '✅ ปิดหน้าต่าง';
    nextBtn.onclick = () => {
      document.getElementById('checkoutModal').classList.add('hidden');
      document.body.style.overflow = '';
      cart = [];
      saveCart();
      renderCart();
      updateCartBadge();
    };
  } else if (checkoutStep === 2) {
    nextBtn.textContent = '✅ ยืนยันการสั่งซื้อ';
    nextBtn.onclick = checkoutNext;
  } else {
    nextBtn.textContent = 'ถัดไป →';
    nextBtn.onclick = checkoutNext;
  }
}

function checkoutNext() {
  if (checkoutStep === 1) {
    if (!validateCustomerInfo()) return;
    checkoutStep = 2;
  } else if (checkoutStep === 2) {
    if (!slipDataUrl) {
      showToast('กรุณาอัปโหลดสลิปการโอนเงินก่อน', 'warning');
      return;
    }
    submitOrder();
    checkoutStep = 3;
  }
  updateCheckoutStep();
}

function checkoutBack() {
  if (checkoutStep > 1) checkoutStep--;
  updateCheckoutStep();
}

function validateCustomerInfo() {
  const firstName = document.getElementById('custFirstName').value.trim();
  const lastName = document.getElementById('custLastName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  if (!firstName || !lastName) { showToast('กรุณากรอกชื่อ-นามสกุล', 'error'); return false; }
  if (!phone) { showToast('กรุณากรอกเบอร์โทรศัพท์', 'error'); return false; }
  return true;
}

function submitOrder() {
  const orderId = 'TCS' + String(orderCounter).padStart(4, '0');
  orderCounter++;
  localStorage.setItem('tcs_order_counter', orderCounter);

  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    customer: {
      firstName: document.getElementById('custFirstName').value.trim(),
      lastName: document.getElementById('custLastName').value.trim(),
      phone: document.getElementById('custPhone').value.trim(),
      line: document.getElementById('custLine').value.trim(),
      childName: document.getElementById('custChildName').value.trim(),
      address: document.getElementById('custAddress').value.trim(),
      note: document.getElementById('custNote').value.trim(),
    },
    items: JSON.parse(JSON.stringify(cart)),
    total: cart.reduce((s, i) => s + i.price, 0),
    status: 'pending',
    slip: slipDataUrl,
  };

  // Save to localStorage
  const orders = JSON.parse(localStorage.getItem('tcs_orders') || '[]');
  orders.unshift(order);
  localStorage.setItem('tcs_orders', JSON.stringify(orders));

  document.getElementById('confirmOrderId').textContent = `#${orderId}`;
  showToast(`สั่งซื้อสำเร็จ! หมายเลข #${orderId}`, 'success');
  slipDataUrl = null;
  document.getElementById('slipPreview').style.display = 'none';
}

function previewSlip(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) {
    showToast('ขนาดไฟล์เกิน 5MB กรุณาลดขนาด', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    slipDataUrl = e.target.result;
    const preview = document.getElementById('slipPreview');
    preview.src = slipDataUrl;
    preview.style.display = 'block';
    document.getElementById('slipUploadArea').style.borderColor = 'var(--success)';
    showToast('อัปโหลดสลิปสำเร็จ ✅', 'success');
  };
  reader.readAsDataURL(file);
}

// ============ CONTACT ============
function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  const phone = document.getElementById('contactPhone').value;
  const msg = document.getElementById('contactMsg').value;
  // Save to localStorage for admin
  const contacts = JSON.parse(localStorage.getItem('tcs_contacts') || '[]');
  contacts.unshift({ name, phone, msg, createdAt: new Date().toISOString() });
  localStorage.setItem('tcs_contacts', JSON.stringify(contacts));
  showToast('ส่งข้อความสำเร็จ! เราจะติดต่อกลับเร็วๆ นี้ 📩', 'success');
  e.target.reset();
}

// ============ MOBILE NAV ============
function toggleMobileNav() {
  const nav = document.getElementById('mobileNav');
  const overlay = document.getElementById('mobileNavOverlay');
  const isOpen = nav.style.left === '0px';
  nav.style.left = isOpen ? '-100%' : '0px';
  overlay.classList.toggle('show', !isOpen);
}

// ============ TOAST ============
function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; toast.style.transition = 'all 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 3000);
}
