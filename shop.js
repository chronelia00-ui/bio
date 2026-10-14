const marketList = document.getElementById('market-products');
const marketMessage = document.getElementById('market-message');
const checkout = document.getElementById('checkout');
const checkoutStatus = document.getElementById('checkout-status');
const slipForm = document.getElementById('slip-form');
const downloadLink = document.getElementById('download-link');
let currentOrder;
let selectedCategory = 'backgrounds';
const categories = {
  backgrounds: { name: 'พื้นหลังสำเร็จรูป', description: 'เลือกพื้นหลังสำหรับสตรีมและตกแต่งหน้าจอของคุณ', empty: 'ยังไม่มีพื้นหลังสำเร็จรูปในตอนนี้' },
  'background-commissions': { name: 'คอมมิชชั่นพื้นหลัง', description: 'พื้นหลังที่ออกแบบตามธีมและสไตล์ของคุณ', empty: 'ยังไม่เปิดรับคอมมิชชั่นพื้นหลังในตอนนี้' },
  'website-commissions': { name: 'คอมมิชชั่นเว็บไซต์', description: 'เว็บไซต์สำหรับแนะนำตัว รวมลิงก์ หรือแสดงผลงานของคุณ', empty: 'เปิดรับคอมมิชชั่นเว็บไซต์แล้ว' },
  live2d: { name: 'โมเดล Live2D สำเร็จรูป', description: 'เลือกโมเดล Live2D สำหรับตัวตนใหม่ของคุณ', empty: 'ยังไม่มีโมเดล Live2D สำเร็จรูปในตอนนี้' }
};
function filterProducts() {
  document.getElementById('website-commission-details').hidden = selectedCategory !== 'website-commissions';
  const category = categories[selectedCategory];
  document.getElementById('market-category-title').textContent = category.name;
  document.getElementById('market-category-description').textContent = category.description;
  let visible = 0;
  marketList.querySelectorAll('.product-card').forEach(card => {
    card.hidden = card.dataset.category !== selectedCategory;
    if (!card.hidden) visible++;
    else card.querySelectorAll('video').forEach(video => video.pause());
  });
  marketMessage.textContent = category.empty;
  marketMessage.hidden = visible > 0;
}
document.querySelectorAll('.market-category').forEach(button => button.addEventListener('click', () => {
  selectedCategory = button.dataset.category;
  document.querySelectorAll('.market-category').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  filterProducts();
}));
function showDownload(result) {
  if (result.paid && result.download) {
    slipForm.hidden = true;
    downloadLink.href = result.download;
    downloadLink.hidden = false;
    checkoutStatus.textContent = 'ตรวจชำระสำเร็จ ดาวน์โหลดได้ภายใน 15 นาที สูงสุด 3 ครั้ง';
  } else if (result.paid) {
    slipForm.hidden = true;
    checkoutStatus.textContent = 'ลิงก์ดาวน์โหลดหมดอายุ กรุณาติดต่อร้าน';
  }
}
async function api(route, body, token) {
  const response = await fetch(route, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'ระบบไม่พร้อม กรุณาติดต่อร้าน');
  return result;
}
function displayOrder(order) {
  currentOrder = order;
  checkout.hidden = false;
  slipForm.hidden = false;
  downloadLink.hidden = true;
  document.getElementById('checkout-name').textContent = order.name;
  document.getElementById('checkout-amount').textContent = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(order.amount);
  document.getElementById('payment-qr').src = order.qr;
  checkoutStatus.textContent = 'โอนตามยอดภายใน ' + new Date(order.expires).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }) + ' น. แล้วแนบสลิปเพื่อตรวจสอบ';
  checkout.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
slipForm.addEventListener('submit', async event => {
  event.preventDefault();
  const file = document.getElementById('slip-image').files[0];
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    checkoutStatus.textContent = 'เลือกรูป JPG, PNG หรือ WEBP ขนาดไม่เกิน 5 MB'; return;
  }
  const submit = slipForm.querySelector('button');
  submit.disabled = true;
  checkoutStatus.textContent = 'กำลังตรวจสลิป กรุณารอ…';
  try {
    const image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    showDownload(await api('/api/verify-slip', { orderId: currentOrder.id, image }, currentOrder.token));
  } catch (error) { checkoutStatus.textContent = error.message || 'ตรวจไม่สำเร็จ หากโอนแล้วอย่าโอนซ้ำ กรุณาติดต่อร้าน'; }
  finally { submit.disabled = false; }
});
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Catalog unavailable');
    const { products, checkoutEnabled } = await response.json();
    for (const product of products) {
      const card = document.createElement('article');
      card.className = 'product-card';
      card.dataset.category = product.category || 'backgrounds';
      if (typeof product.preview === 'string' && /^assets\/previews\/[a-zA-Z0-9_-]+\.mp4$/.test(product.preview)) {
        const video = document.createElement('video');
        video.src = product.preview;
        video.controls = true;
        video.controlsList = 'nodownload';
        video.preload = 'metadata';
        video.playsInline = true;
        card.append(video);
      }
      const name = document.createElement('h3');
      name.dataset.noTranslate = '';
      name.textContent = product.name;
      const description = document.createElement('p');
      description.dataset.noTranslate = '';
      description.textContent = product.description || '';
      const price = document.createElement('p');
      price.textContent = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(product.price);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'page-tab';
      const canBuy = checkoutEnabled && card.dataset.category === 'backgrounds';
      button.textContent = canBuy ? 'ซื้อคลิปนี้' : 'ยังไม่เปิดจำหน่าย';
      button.disabled = !canBuy;
      button.addEventListener('click', async () => {
        if (currentOrder && Date.now() < currentOrder.expires) {
          displayOrder(currentOrder);
          checkoutStatus.textContent += ' · คุณมีออเดอร์ที่ยังไม่หมดอายุอยู่แล้ว'; return;
        }
        button.disabled = true;
        try {
          const order = await api('/api/orders', { productId: product.id });
          try { sessionStorage.setItem('chronelia-order', JSON.stringify(order)); } catch {}
          displayOrder(order);
        } catch (error) { checkout.hidden = false; checkoutStatus.textContent = error.message; }
        finally { button.disabled = false; }
      });
      card.append(name, description, price, button);
      marketList.append(card);
    }
    filterProducts();
  } catch {
    filterProducts();
  }
}
loadProducts();
try {
  const saved = JSON.parse(sessionStorage.getItem('chronelia-order') || 'null');
  if (saved && /^assets\/[\w/-]+\.(png|jpg|webp)$/.test(saved.qr)) {
    displayOrder(saved);
    api('/api/order', { orderId: saved.id }, saved.token).then(showDownload).catch(error => { checkoutStatus.textContent = error.message; });
  }
} catch {}
