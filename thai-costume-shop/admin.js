// ==========================================
//  THAI COSTUME SHOP - Admin Logic
// ==========================================

// ============ AUTH ============
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };
let currentPage = 'dashboard';
let editingOrderId = null;
let productImgDataUrl = null;

document.addEventListener('DOMContentLoaded', () => {
  setTopbarDate();
  if (isLoggedIn()) showAdminApp();
});

function isLoggedIn() {
  return sessionStorage.getItem('tcs_admin_logged') === 'true';
}

function doLogin(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem('tcs_admin_logged', 'true');
    showAdminApp();
  } else {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('loginPass').value = '';
  }
}

function showAdminApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
  document.getElementById('mobileMenuBtn').style.display = 'none';
  loadAdminData();
  showPage('dashboard');
  // Responsive
  if (window.innerWidth <= 768) {
    document.getElementById('mobileMenuBtn').style.display = 'block';
  }
}

function doLogout() {
  if (!confirm('ต้องการออกจากระบบหรือไม่?')) return;
  sessionStorage.removeItem('tcs_admin_logged');
  document.getElementById('adminApp').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

function goToStore() {
  window.open('index.html', '_blank');
}

// ============ DATA ============
let adminProducts = [];
let adminOrders = [];

function loadAdminData() {
  const stored = localStorage.getItem('tcs_products');
  if (!stored) {
    // Load defaults from app.js concept - hardcoded here
    adminProducts = getDefaultProducts();
    localStorage.setItem('tcs_products', JSON.stringify(adminProducts));
  } else {
    adminProducts = JSON.parse(stored);
  }
  adminOrders = JSON.parse(localStorage.getItem('tcs_orders') || '[]');
}

function getDefaultProducts() {
  return [
    { id: 1, name: 'ชุดไทยหญิง สีชมพูทอง', category: 'thai-girl', gender: 'girl', desc: 'ชุดไทยซาบซึ้ง สีชมพูทองคำ ผ้าไหมเทียม ปักลายดอกไม้ไทย พร้อมชุดเครื่องประดับทอง', image: 'img_thai_girl.png', priceRent: 250, priceBuy: 1200, stock: 5, sizes: [{label:'S',age:'3-4ปี',stock:2},{label:'M',age:'5-6ปี',stock:2},{label:'L',age:'7-8ปี',stock:1},{label:'XL',age:'9-10ปี',stock:0}], isNew: false, isPopular: true, badges: [] },
    { id: 2, name: 'ชุดไทยชาย สีน้ำเงินทอง', category: 'thai-boy', gender: 'boy', desc: 'ชุดไทยพระราชนิยม สีน้ำเงินทอง ผ้าไหม พร้อมกางเกงจีบและเข็มขัดทอง', image: 'img_thai_boy.png', priceRent: 200, priceBuy: 1000, stock: 4, sizes: [{label:'S',age:'3-4ปี',stock:1},{label:'M',age:'5-6ปี',stock:2},{label:'L',age:'7-8ปี',stock:1},{label:'XL',age:'9-10ปี',stock:0}], isNew: false, isPopular: false, badges: [] },
    { id: 3, name: 'ชุดนางเงือก มัจฉา', category: 'mermaid', gender: 'girl', desc: 'ชุดนางเงือกสีม่วงอมฟ้า เลื่อมทะเล เหมาะสำหรับงานคาร์นิวัล', image: 'img_mermaid.png', priceRent: 350, priceBuy: 1500, stock: 3, sizes: [{label:'S',age:'3-4ปี',stock:1},{label:'M',age:'5-6ปี',stock:1},{label:'L',age:'7-8ปี',stock:1},{label:'XL',age:'9-10ปี',stock:0}], isNew: true, isPopular: false, badges: [] },
    { id: 4, name: 'ชุดประกวดเจ้าหญิง มงกุฎทอง', category: 'princess', gender: 'girl', desc: 'ชุดบอลเกาวน์สีม่วง ประดับคริสตัล พร้อมมงกุฎ', image: 'img_princess.png', priceRent: 500, priceBuy: 2200, stock: 2, sizes: [{label:'S',age:'3-4ปี',stock:0},{label:'M',age:'5-6ปี',stock:1},{label:'L',age:'7-8ปี',stock:1},{label:'XL',age:'9-10ปี',stock:0}], isNew: false, isPopular: true, badges: [] },
    { id: 5, name: 'ชุดกษัตริย์น้อย แดงทอง', category: 'prince', gender: 'boy', desc: 'ชุดกษัตริย์แบบยุโรป สีแดงทอง ผ้ากำมะหยี่ พร้อมมงกุฎทอง', image: 'img_prince.png', priceRent: 400, priceBuy: 1800, stock: 3, sizes: [{label:'S',age:'3-4ปี',stock:1},{label:'M',age:'5-6ปี',stock:1},{label:'L',age:'7-8ปี',stock:1},{label:'XL',age:'9-10ปี',stock:0}], isNew: true, isPopular: false, badges: [] },
    { id: 6, name: 'ชุดไทยบรมพิมาน สีทอง', category: 'thai-girl', gender: 'girl', desc: 'ชุดไทยบรมพิมาน สีทอง ผ้าไหมทองแท้ ปักดิ้น พร้อมชฎาทอง', image: 'img_thai_gold.png', priceRent: 380, priceBuy: 1600, stock: 4, sizes: [{label:'S',age:'3-4ปี',stock:1},{label:'M',age:'5-6ปี',stock:2},{label:'L',age:'7-8ปี',stock:1},{label:'XL',age:'9-10ปี',stock:0}], isNew: false, isPopular: true, badges: [] },
  ];
}

function saveAdminProducts() {
  localStorage.setItem('tcs_products', JSON.stringify(adminProducts));
}
function saveAdminOrders() {
  localStorage.setItem('tcs_orders', JSON.stringify(adminOrders));
}

// ============ NAVIGATION ============
const PAGES = ['dashboard', 'orders', 'products', 'stock', 'contacts'];

function showPage(page) {
  currentPage = page;
  PAGES.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.toggle('hidden', p !== page);
    const nav = document.getElementById(`nav${p.charAt(0).toUpperCase() + p.slice(1)}`);
    if (nav) nav.classList.toggle('active', p === page);
  });

  const titles = {
    dashboard: '📊 แผงควบคุม',
    orders: '📋 คำสั่งซื้อ / จอง',
    products: '👗 จัดการสินค้า',
    stock: '📦 จัดการสต็อก',
    contacts: '📩 ข้อความลูกค้า',
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  loadAdminData();
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'orders': renderOrdersPage(); break;
    case 'products': renderProductsTable(); break;
    case 'stock': renderStockTable(); break;
    case 'contacts': renderContactsPage(); break;
  }
  // Close mobile sidebar
  document.getElementById('adminSidebar').classList.remove('mobile-open');
  document.getElementById('adminOverlay').classList.remove('show');
}

// ============ DASHBOARD ============
function renderDashboard() {
  const orders = adminOrders;
  const products = adminProducts;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const lowStockProducts = products.filter(p => p.stock <= 2);

  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statOrdersTrend').textContent = pendingOrders.length > 0 ? `⏳ รอ ${pendingOrders.length} รายการ` : '✅ ทั้งหมด';
  document.getElementById('statRevenue').textContent = `฿${totalRevenue.toLocaleString()}`;
  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statLowStock').textContent = lowStockProducts.length;
  document.getElementById('lowStockTrend').textContent = lowStockProducts.length > 0 ? `⚠️ ต้องเติม` : '✅ ปกติ';

  // Pending badge
  document.getElementById('pendingBadge').textContent = pendingOrders.length;

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 5);
  document.getElementById('recentOrdersTable').innerHTML = recentOrders.length === 0
    ? '<div style="padding:24px;text-align:center;color:var(--text-muted);">ยังไม่มีคำสั่งซื้อ</div>'
    : `<table class="data-table">
        <tbody>
          ${recentOrders.map(o => `
            <tr onclick="viewOrder('${o.id}')" style="cursor:pointer;">
              <td><span class="order-id">#${o.id}</span></td>
              <td>${o.customer.firstName} ${o.customer.lastName}</td>
              <td><span class="status-badge ${getStatusClass(o.status)}">${getStatusLabel(o.status)}</span></td>
              <td style="font-weight:700;color:var(--wine);">฿${o.total.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;

  // Low stock
  document.getElementById('lowStockTable').innerHTML = lowStockProducts.length === 0
    ? '<div style="padding:24px;text-align:center;color:var(--success);">✅ สต็อกปกติทุกรายการ</div>'
    : `<table class="data-table">
        <tbody>
          ${lowStockProducts.map(p => `
            <tr>
              <td><img src="${p.image}" class="product-thumb" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23F2E8D5%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23C4527A%22 font-size=%2232%22>👗</text></svg>'"></td>
              <td>${p.name}</td>
              <td>
                <div class="stock-bar" style="width:80px;"><div class="stock-fill ${p.stock === 0 ? 'low' : 'medium'}" style="width:${Math.min(100, p.stock * 20)}%"></div></div>
                <span style="font-size:12px;color:${p.stock === 0 ? 'var(--danger)' : 'var(--warning)'};">${p.stock} ชิ้น</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;

  // Recent contacts
  const contacts = JSON.parse(localStorage.getItem('tcs_contacts') || '[]').slice(0, 3);
  document.getElementById('recentContacts').innerHTML = contacts.length === 0
    ? '<div style="padding:24px;text-align:center;color:var(--text-muted);">ยังไม่มีข้อความ</div>'
    : `<table class="data-table">
        <tbody>
          ${contacts.map(c => `
            <tr>
              <td><strong>${c.name}</strong></td>
              <td>${c.phone}</td>
              <td>${c.msg}</td>
              <td style="font-size:12px;color:var(--text-muted);">${formatDate(c.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
}

// ============ ORDERS ============
function renderOrdersPage() {
  const filterStatus = document.getElementById('orderStatusFilter').value;
  const searchQ = (document.getElementById('orderSearch').value || '').toLowerCase().trim();
  let orders = [...adminOrders];
  if (filterStatus !== 'all') orders = orders.filter(o => o.status === filterStatus);
  if (searchQ) orders = orders.filter(o =>
    o.id.toLowerCase().includes(searchQ) ||
    `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(searchQ) ||
    o.customer.phone.includes(searchQ)
  );

  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = orders.length === 0
    ? '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted);">ไม่พบรายการ</td></tr>'
    : orders.map(o => `
      <tr>
        <td><span class="order-id">#${o.id}</span></td>
        <td><strong>${o.customer.firstName} ${o.customer.lastName}</strong><br><small style="color:var(--text-muted);">${o.customer.childName ? '👶 ' + o.customer.childName : ''}</small></td>
        <td>${o.customer.phone}<br><small>${o.customer.line ? '💬 ' + o.customer.line : ''}</small></td>
        <td>${o.items.length} รายการ</td>
        <td style="font-weight:800;color:var(--wine);">฿${o.total.toLocaleString()}</td>
        <td><span class="status-badge ${getStatusClass(o.status)}">${getStatusLabel(o.status)}</span></td>
        <td style="font-size:13px;">${formatDate(o.createdAt)}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn action-btn-view" onclick="viewOrder('${o.id}')" title="ดูรายละเอียด">👁️</button>
            <button class="action-btn action-btn-delete" onclick="deleteOrder('${o.id}')" title="ลบ">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
}

function viewOrder(id) {
  const order = adminOrders.find(o => o.id === id);
  if (!order) return;
  editingOrderId = id;

  const body = document.getElementById('orderDetailBody');
  body.innerHTML = `
    <div class="order-info-grid">
      <div class="order-info-item">
        <div class="order-info-label">หมายเลขออเดอร์</div>
        <div class="order-info-value" style="font-family:monospace;color:var(--wine);font-size:18px;">#${order.id}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">วันที่สั่ง</div>
        <div class="order-info-value">${formatDate(order.createdAt)}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">ชื่อลูกค้า</div>
        <div class="order-info-value">${order.customer.firstName} ${order.customer.lastName}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">เบอร์โทร / LINE</div>
        <div class="order-info-value">${order.customer.phone} ${order.customer.line ? '/ ' + order.customer.line : ''}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">ชื่อเด็ก</div>
        <div class="order-info-value">${order.customer.childName || '-'}</div>
      </div>
      <div class="order-info-item">
        <div class="order-info-label">ที่อยู่จัดส่ง</div>
        <div class="order-info-value" style="font-size:13px;">${order.customer.address || '-'}</div>
      </div>
    </div>
    ${order.customer.note ? `<div style="background:rgba(212,175,55,0.08);border-radius:var(--radius-md);padding:12px;margin-bottom:16px;font-size:14px;"><strong>📝 หมายเหตุ:</strong> ${order.customer.note}</div>` : ''}

    <div style="margin-bottom:16px;">
      <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:var(--wine);">🛒 รายการสินค้า</div>
      ${order.items.map(item => `
        <div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--cream-dark);">
          <img src="${item.image}" style="width:52px;height:52px;border-radius:var(--radius-sm);object-fit:cover;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23F2E8D5%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23C4527A%22 font-size=%2232%22>👗</text></svg>'">
          <div style="flex:1;">
            <div style="font-weight:700;font-size:14px;">${item.name}</div>
            <div style="font-size:12px;color:var(--text-muted);">${item.meta}</div>
          </div>
          <div style="font-weight:800;color:var(--wine);">฿${item.price.toLocaleString()}</div>
        </div>
      `).join('')}
      <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;padding-top:12px;color:var(--text-dark);">
        <span>รวมทั้งหมด</span>
        <span style="color:var(--wine);">฿${order.total.toLocaleString()}</span>
      </div>
    </div>

    ${order.slip ? `
      <div>
        <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:var(--wine);">📸 สลิปโอนเงิน</div>
        <img src="${order.slip}" class="slip-img" alt="สลิป">
      </div>
    ` : '<div style="color:var(--text-muted);font-size:14px;">⚠️ ยังไม่มีสลิปโอนเงิน</div>'}
  `;

  document.getElementById('orderStatusUpdate').value = order.status;
  document.getElementById('orderDetailModal').classList.remove('hidden');
}

function closeOrderModal(e) {
  if (e && e.target !== document.getElementById('orderDetailModal')) return;
  document.getElementById('orderDetailModal').classList.add('hidden');
  editingOrderId = null;
}

function updateOrderStatus() {
  if (!editingOrderId) return;
  const newStatus = document.getElementById('orderStatusUpdate').value;
  const idx = adminOrders.findIndex(o => o.id === editingOrderId);
  if (idx !== -1) {
    adminOrders[idx].status = newStatus;
    saveAdminOrders();
    showAdminToast(`อัปเดตสถานะออเดอร์ #${editingOrderId} เป็น "${getStatusLabel(newStatus)}" แล้ว`, 'success');
    closeOrderModal();
    renderOrdersPage();
    renderDashboard();
  }
}

function deleteOrder(id) {
  if (!confirm(`ต้องการลบออเดอร์ #${id} หรือไม่?`)) return;
  adminOrders = adminOrders.filter(o => o.id !== id);
  saveAdminOrders();
  showAdminToast('ลบออเดอร์แล้ว', 'info');
  renderOrdersPage();
  renderDashboard();
}

function getStatusClass(status) {
  const map = { pending: 'status-pending', confirmed: 'status-confirmed', delivered: 'status-delivered', completed: 'status-completed', cancelled: 'status-cancelled', rental: 'status-rental' };
  return map[status] || 'status-pending';
}
function getStatusLabel(status) {
  const map = { pending: '⏳ รอยืนยัน', confirmed: '✅ ยืนยันแล้ว', delivered: '🚚 จัดส่งแล้ว', completed: '✔️ เสร็จสิ้น', cancelled: '❌ ยกเลิก' };
  return map[status] || status;
}

// ============ PRODUCTS ============
function renderProductsTable() {
  const q = (document.getElementById('productSearch').value || '').toLowerCase().trim();
  let products = adminProducts;
  if (q) products = products.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q));
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = products.length === 0
    ? '<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-muted);">ไม่พบสินค้า</td></tr>'
    : products.map(p => {
      const stockClass = p.stock === 0 ? 'status-cancelled' : p.stock <= 2 ? 'status-rental' : 'status-confirmed';
      const stockLabel = p.stock === 0 ? 'หมดสต็อก' : p.stock <= 2 ? `เหลือ ${p.stock}` : `มี ${p.stock} ชิ้น`;
      return `
      <tr>
        <td><img src="${p.image}" class="product-thumb" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23F2E8D5%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23C4527A%22 font-size=%2232%22>👗</text></svg>'"></td>
        <td>
          <strong>${p.name}</strong>
          <div style="display:flex;gap:4px;margin-top:4px;">
            ${p.isNew ? '<span class="badge badge-new" style="font-size:10px;">ใหม่</span>' : ''}
            ${p.isPopular ? '<span class="badge badge-popular" style="font-size:10px;">ยอดนิยม</span>' : ''}
          </div>
        </td>
        <td>${getCatLabelAdmin(p.category)}</td>
        <td style="font-weight:700;color:var(--wine);">฿${p.priceRent.toLocaleString()}</td>
        <td style="font-weight:700;color:var(--gold-dark);">฿${p.priceBuy.toLocaleString()}</td>
        <td>
          <div class="stock-bar"><div class="stock-fill ${p.stock === 0 ? 'low' : p.stock <= 2 ? 'medium' : 'good'}" style="width:${Math.min(100, p.stock * 14)}%;"></div></div>
          <small>${p.stock} ชิ้น</small>
        </td>
        <td><span class="status-badge ${stockClass}">${stockLabel}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn action-btn-edit" onclick="editProduct(${p.id})" title="แก้ไข">✏️</button>
            <button class="action-btn action-btn-delete" onclick="deleteProduct(${p.id})" title="ลบ">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
}

function getCatLabelAdmin(cat) {
  const map = { 'thai-girl': '🌸 ไทยหญิง', 'thai-boy': '👦 ไทยชาย', 'mermaid': '🧜 นางเงือก', 'princess': '👸 ประกวด', 'prince': '🤴 กษัตริย์' };
  return map[cat] || cat;
}

function openAddProduct() {
  document.getElementById('editProductId').value = '';
  document.getElementById('productFormTitle').textContent = '➕ เพิ่มสินค้าใหม่';
  document.getElementById('pName').value = '';
  document.getElementById('pCategory').value = 'thai-girl';
  document.getElementById('pGender').value = 'girl';
  document.getElementById('pPriceRent').value = '';
  document.getElementById('pPriceBuy').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('stockS').value = 0;
  document.getElementById('stockM').value = 0;
  document.getElementById('stockL').value = 0;
  document.getElementById('stockXL').value = 0;
  document.getElementById('pIsNew').checked = false;
  document.getElementById('pIsPopular').checked = false;
  document.getElementById('productImgData').value = '';
  document.getElementById('productImgPreview').style.display = 'none';
  document.getElementById('currentImgNote').textContent = '';
  productImgDataUrl = null;
  document.getElementById('productFormModal').classList.remove('hidden');
}

function editProduct(id) {
  const p = adminProducts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('editProductId').value = id;
  document.getElementById('productFormTitle').textContent = '✏️ แก้ไขสินค้า';
  document.getElementById('pName').value = p.name;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pGender').value = p.gender;
  document.getElementById('pPriceRent').value = p.priceRent;
  document.getElementById('pPriceBuy').value = p.priceBuy;
  document.getElementById('pDesc').value = p.desc;
  const szMap = { S: 0, M: 0, L: 0, XL: 0 };
  p.sizes.forEach(s => { szMap[s.label] = s.stock; });
  document.getElementById('stockS').value = szMap.S;
  document.getElementById('stockM').value = szMap.M;
  document.getElementById('stockL').value = szMap.L;
  document.getElementById('stockXL').value = szMap.XL;
  document.getElementById('pIsNew').checked = p.isNew;
  document.getElementById('pIsPopular').checked = p.isPopular;
  document.getElementById('currentImgNote').textContent = `รูปปัจจุบัน: ${p.image}`;
  productImgDataUrl = null;
  document.getElementById('productImgPreview').style.display = 'none';
  document.getElementById('productFormModal').classList.remove('hidden');
}

function closeProductForm(e) {
  if (e && e.target !== document.getElementById('productFormModal')) return;
  document.getElementById('productFormModal').classList.add('hidden');
}

function previewProductImg(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = e => {
    productImgDataUrl = e.target.result;
    const preview = document.getElementById('productImgPreview');
    document.getElementById('productImgPreviewImg').src = productImgDataUrl;
    preview.style.display = 'block';
    document.getElementById('productImgData').value = productImgDataUrl;
  };
  reader.readAsDataURL(file);
}

function saveProduct() {
  const name = document.getElementById('pName').value.trim();
  const category = document.getElementById('pCategory').value;
  const gender = document.getElementById('pGender').value;
  const priceRent = parseFloat(document.getElementById('pPriceRent').value);
  const priceBuy = parseFloat(document.getElementById('pPriceBuy').value);
  const desc = document.getElementById('pDesc').value.trim();
  const stockS = parseInt(document.getElementById('stockS').value) || 0;
  const stockM = parseInt(document.getElementById('stockM').value) || 0;
  const stockL = parseInt(document.getElementById('stockL').value) || 0;
  const stockXL = parseInt(document.getElementById('stockXL').value) || 0;
  const isNew = document.getElementById('pIsNew').checked;
  const isPopular = document.getElementById('pIsPopular').checked;

  if (!name) { showAdminToast('กรุณากรอกชื่อสินค้า', 'error'); return; }
  if (!priceRent || !priceBuy) { showAdminToast('กรุณากรอกราคา', 'error'); return; }

  const sizes = [
    { label: 'S', age: '3-4ปี', stock: stockS },
    { label: 'M', age: '5-6ปี', stock: stockM },
    { label: 'L', age: '7-8ปี', stock: stockL },
    { label: 'XL', age: '9-10ปี', stock: stockXL },
  ];
  const totalStock = sizes.reduce((s, x) => s + x.stock, 0);

  const editId = document.getElementById('editProductId').value;
  if (editId) {
    // Update
    const idx = adminProducts.findIndex(p => p.id === parseInt(editId));
    if (idx !== -1) {
      const currentImg = adminProducts[idx].image;
      adminProducts[idx] = {
        ...adminProducts[idx],
        name, category, gender, priceRent, priceBuy, desc, sizes, stock: totalStock, isNew, isPopular,
        image: productImgDataUrl || currentImg,
      };
      showAdminToast('บันทึกข้อมูลสินค้าแล้ว ✅', 'success');
    }
  } else {
    // Add new
    const newId = Date.now();
    const defaultImages = { 'thai-girl': 'img_thai_girl.png', 'thai-boy': 'img_thai_boy.png', 'mermaid': 'img_mermaid.png', 'princess': 'img_princess.png', 'prince': 'img_prince.png' };
    adminProducts.push({
      id: newId, name, category, gender, priceRent, priceBuy, desc, sizes, stock: totalStock, isNew, isPopular, badges: [],
      image: productImgDataUrl || defaultImages[category] || 'img_thai_girl.png',
    });
    showAdminToast('เพิ่มสินค้าใหม่แล้ว ✅', 'success');
  }

  saveAdminProducts();
  closeProductForm();
  renderProductsTable();
  renderDashboard();
}

function deleteProduct(id) {
  if (!confirm('ต้องการลบสินค้านี้หรือไม่?')) return;
  adminProducts = adminProducts.filter(p => p.id !== id);
  saveAdminProducts();
  showAdminToast('ลบสินค้าแล้ว', 'info');
  renderProductsTable();
  renderDashboard();
}

// ============ STOCK ============
function renderStockTable() {
  const tbody = document.getElementById('stockTableBody');
  tbody.innerHTML = adminProducts.map(p => {
    const sizeMap = {};
    p.sizes.forEach(s => { sizeMap[s.label] = s; });
    const totalStock = p.stock;
    return `
      <tr>
        <td><img src="${p.image}" class="product-thumb" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23F2E8D5%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23C4527A%22 font-size=%2232%22>👗</text></svg>'"></td>
        <td><strong>${p.name}</strong></td>
        ${['S','M','L','XL'].map(sz => {
          const s = sizeMap[sz] || { stock: 0 };
          return `<td>
            <input type="number" min="0" value="${s.stock}"
              style="width:60px;padding:6px;border:1px solid var(--cream-dark);border-radius:6px;text-align:center;font-family:'Sarabun',sans-serif;"
              onchange="updateSizeStock(${p.id}, '${sz}', this.value)">
          </td>`;
        }).join('')}
        <td>
          <strong style="font-size:16px;${totalStock === 0 ? 'color:var(--danger)' : totalStock <= 2 ? 'color:var(--warning)' : 'color:var(--success)'};">${totalStock}</strong>
        </td>
        <td>
          <span class="status-badge ${totalStock === 0 ? 'status-cancelled' : totalStock <= 2 ? 'status-rental' : 'status-confirmed'}">
            ${totalStock === 0 ? 'หมดสต็อก' : totalStock <= 2 ? 'เกือบหมด' : 'ปกติ'}
          </span>
        </td>
      </tr>`;
  }).join('');
}

function updateSizeStock(productId, sizeLabel, newVal) {
  const pIdx = adminProducts.findIndex(p => p.id === productId);
  if (pIdx === -1) return;
  const sIdx = adminProducts[pIdx].sizes.findIndex(s => s.label === sizeLabel);
  if (sIdx === -1) return;
  adminProducts[pIdx].sizes[sIdx].stock = parseInt(newVal) || 0;
  adminProducts[pIdx].stock = adminProducts[pIdx].sizes.reduce((s, x) => s + x.stock, 0);
  saveAdminProducts();
  showAdminToast(`อัปเดตสต็อก ${sizeLabel} แล้ว`, 'success');
}

// ============ CONTACTS ============
function renderContactsPage() {
  const contacts = JSON.parse(localStorage.getItem('tcs_contacts') || '[]');
  const tbody = document.getElementById('contactsTableBody');
  tbody.innerHTML = contacts.length === 0
    ? '<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text-muted);">ยังไม่มีข้อความ</td></tr>'
    : contacts.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.phone}</td>
        <td>${c.msg}</td>
        <td style="font-size:12px;color:var(--text-muted);">${formatDate(c.createdAt)}</td>
      </tr>
    `).join('');
}

function clearContacts() {
  if (!confirm('ต้องการล้างข้อความทั้งหมดหรือไม่?')) return;
  localStorage.removeItem('tcs_contacts');
  renderContactsPage();
  showAdminToast('ล้างข้อความทั้งหมดแล้ว', 'info');
}

// ============ HELPERS ============
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function setTopbarDate() {
  const el = document.getElementById('topbarDate');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}

function toggleMobileSidebar() {
  document.getElementById('adminSidebar').classList.toggle('mobile-open');
  document.getElementById('adminOverlay').classList.toggle('show');
}

function showAdminToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('adminToastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Responsive check
window.addEventListener('resize', () => {
  if (isLoggedIn()) {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) mobileBtn.style.display = window.innerWidth <= 768 ? 'block' : 'none';
  }
});
