(() => {
  const translations = {
    'ตัวอย่างที่ 3 — Hongthai Bio': 'Example 3 — Hongthai Bio',
    'เปิดดูตัวอย่างที่ 3': 'Open example 3',
    'ตัวอย่างที่ 1 — Elune Bio': 'Example 1 — Elune Bio',
    'ตัวอย่างที่ 1': 'Example 1',
    'เร็ว ๆ นี้': 'Coming soon',
    'ตัวอย่างที่ 2 — Lucien Bio': 'Example 2 — Lucien Bio',
    'เปิดดูตัวอย่างที่ 2': 'Open example 2',
    'ดูตัวอย่างเว็บคอมมิชชั่น': 'View website commission examples',
    'ตัวอย่างที่ 1 — Chronelia Bio': 'Example 1 — Chronelia Bio',
    'เว็บนี้: หน้าแนะนำตัว รวมโซเชียลและหน้าตลาด': 'This website: a profile page with social links and a shop.',
    'เปิดดูตัวอย่างที่ 1': 'Open example 1',
    'ดูตัวอย่างเว็บไซต์ Bio': 'View example Bio website',
    'เปิดรับคอมมิชชั่นเว็บไซต์แล้ว': 'Website commissions are now open.',
    'รายละเอียดคอมมิชชั่นเว็บไซต์': 'Website commission details',
    'เว็บไซต์ในสไตล์ของคุณ': 'A website in your style',
    'รับทำหน้าแนะนำตัว หน้ารวมลิงก์ และเว็บไซต์แสดงผลงาน พร้อมปรับให้ใช้งานได้ทั้งบนคอมและมือถือ': 'Commission a profile page, link page, or portfolio website designed for desktop and mobile.',
    'ส่งรายละเอียดงาน ตัวอย่างที่ชอบ และกำหนดเวลาที่ต้องการ เพื่อคุยขอบเขตงานและประเมินราคาก่อนเริ่ม': 'Share your brief, references, and preferred deadline so we can agree on the scope and quote before starting.',
    'ติดต่อสั่งทำเว็บไซต์ผ่าน Discord': 'Request a website via Discord',
    'ภาวนาแด่โครเนเลีย(ให้ตัง)': 'Pray Chronelia now', 'ฟรีวอเปเปอร์': 'Wallpaper free',
    'ลิงก์': 'Links', 'ตลาด': 'Shop', 'ตลาดของ Chronelia': 'Chronelia Shop',
    'เลือกภาษา': 'Select language', 'ภาษาไทย': 'Thai', 'หน้าของ Chronelia': 'Chronelia pages',
    'เลือกหมวดสินค้าและบริการ': 'Choose a product or service category',
    'พื้นหลังสำเร็จรูป': 'Ready-made backgrounds',
    'คอมมิชชั่นพื้นหลัง': 'Background commissions',
    'คอมมิชชั่นเว็บไซต์': 'Website commissions',
    'โมเดล Live2D สำเร็จรูป': 'Ready-made Live2D models',
    'เลือกพื้นหลังสำหรับสตรีมและตกแต่งหน้าจอของคุณ': 'Choose a background for your streams and screens.',
    'พื้นหลังที่ออกแบบตามธีมและสไตล์ของคุณ': 'Custom backgrounds designed for your theme and style.',
    'เว็บไซต์สำหรับแนะนำตัว รวมลิงก์ หรือแสดงผลงานของคุณ': 'A website for your profile, links, or portfolio.',
    'เลือกโมเดล Live2D สำหรับตัวตนใหม่ของคุณ': 'Find a Live2D model for your new persona.',
    'ยังไม่มีพื้นหลังสำเร็จรูปในตอนนี้': 'Ready-made backgrounds are coming soon.',
    'ยังไม่เปิดรับคอมมิชชั่นพื้นหลังในตอนนี้': 'Background commissions are not open yet.',
    'ยังไม่เปิดรับคอมมิชชั่นเว็บไซต์ในตอนนี้': 'Website commissions are not open yet.',
    'ยังไม่มีโมเดล Live2D สำเร็จรูปในตอนนี้': 'Ready-made Live2D models are coming soon.',
    'ยังไม่เปิดจำหน่าย': 'Not available yet', 'ซื้อคลิปนี้': 'Buy this clip',
    'ชำระเงินและรับคลิป': 'Payment and download', 'ชำระเงินผ่านแม่มณี': 'Pay with Mae Manee',
    'QR รับเงินแม่มณีของร้าน': 'Shop Mae Manee payment QR',
    'สแกนจ่ายผ่านแอปธนาคาร แล้วแนบสลิปเพื่อรับคลิป': 'Scan with your banking app, then upload your receipt to get the clip.',
    'รูปสลิป (JPG, PNG, WEBP ไม่เกิน 5 MB)': 'Receipt image (JPG, PNG, WEBP, up to 5 MB)',
    'สลิปจะส่งให้ SlipOK เพื่อตรวจสอบการชำระเงิน': 'Your receipt will be sent to SlipOK to verify payment.',
    'ตรวจสลิปและรับคลิป': 'Verify receipt and get clip', 'ดาวน์โหลดคลิปเต็ม': 'Download full clip',
    'ตรวจชำระสำเร็จ ดาวน์โหลดได้ภายใน 15 นาที สูงสุด 3 ครั้ง': 'Payment verified. Download within 15 minutes, up to 3 times.',
    'ลิงก์ดาวน์โหลดหมดอายุ กรุณาติดต่อร้าน': 'Your download link has expired. Please contact the shop.',
    'เลือกรูป JPG, PNG หรือ WEBP ขนาดไม่เกิน 5 MB': 'Choose a JPG, PNG or WEBP image up to 5 MB.',
    'กำลังตรวจสลิป กรุณารอ…': 'Verifying your receipt. Please wait…',
    'ระบบไม่พร้อม กรุณาติดต่อร้าน': 'The service is unavailable. Please contact the shop.',
    'ตรวจไม่สำเร็จ หากโอนแล้วอย่าโอนซ้ำ กรุณาติดต่อร้าน': 'Verification failed. If you have paid, do not pay again. Please contact the shop.',
    'โอนตามยอดภายใน ': 'Pay the exact amount by ',
    ' น. แล้วแนบสลิปเพื่อตรวจสอบ': ' (Bangkok time), then upload your receipt.',
    ' · คุณมีออเดอร์ที่ยังไม่หมดอายุอยู่แล้ว': ' · You already have an active order.',
    'ร้านยังไม่เปิดรับชำระเงิน': 'The shop is not accepting payments yet.',
    'ยอดเงินไม่ตรงกับออเดอร์': 'The payment amount does not match your order.',
    'บัญชีผู้รับเงินไม่ตรงกับร้าน': 'The recipient account does not match the shop.',
    'สลิปนี้ถูกใช้แล้ว หากเป็นออเดอร์ของคุณกรุณาติดต่อร้าน': 'This receipt has already been used. Contact the shop if it is yours.',
    'ธนาคารยังไม่พร้อมยืนยันสลิป กรุณารอสักครู่แล้วลองใหม่': 'The bank cannot confirm this receipt yet. Please wait and try again.',
    'ธนาคารขัดข้อง กรุณาตรวจใหม่ภายหลัง': 'The bank is unavailable. Please try again later.',
    'ตรวจสลิปไม่ผ่าน กรุณาตรวจรูปและติดต่อร้านหากโอนแล้ว': 'Receipt verification failed. Check the image and contact the shop if you have paid.',
    'ตรวจสลิปไม่สำเร็จ หากโอนแล้วอย่าโอนซ้ำ กรุณาติดต่อร้าน': 'Verification failed. Do not pay again if you have already paid. Contact the shop.',
    'บริการตรวจสลิปไม่พร้อม กรุณาติดต่อร้าน': 'Receipt verification is unavailable. Please contact the shop.',
    'ออเดอร์หมดอายุ หากโอนแล้วกรุณาติดต่อร้าน': 'Your order has expired. Contact the shop if you have paid.',
    'กรุณารอสักครู่แล้วลองใหม่': 'Please wait a moment and try again.',
    'ไม่มีสิทธิ์เข้าถึงออเดอร์': 'You cannot access this order.',
    'กำลังตรวจสลิปนี้อยู่': 'This receipt is being verified.',
    'รูปสลิปไม่ถูกต้อง': 'Invalid receipt image.',
    'รองรับรูป JPG, PNG, WEBP ไม่เกิน 5 MB': 'Upload a JPG, PNG or WEBP image up to 5 MB.',
    'ยอดเงินหรือผู้รับไม่ตรงกับร้าน กรุณาติดต่อร้าน': 'The amount or recipient does not match. Please contact the shop.',
    'เวลาจ่ายไม่ตรงกับออเดอร์ กรุณาติดต่อร้าน': 'The payment time does not match your order. Please contact the shop.',
    'สลิปนี้ใช้กับออเดอร์อื่นแล้ว กรุณาติดต่อร้าน': 'This receipt was used for another order. Please contact the shop.',
    'ระบบยังไม่พร้อม กรุณาติดต่อร้าน หากโอนแล้วอย่าโอนซ้ำ': 'The service is unavailable. Contact the shop; do not pay again if you have paid.',
    'ไฟล์สินค้ายังไม่พร้อม': 'The product file is not ready.',
    'ไม่พบสินค้าที่เปิดจำหน่าย': 'This product is not available.'
  };
  let language = 'th';
  try { if (localStorage.getItem('chronelia-language') === 'en') language = 'en'; } catch {}
  const textSources = new WeakMap(), attributeSources = new WeakMap();
  const phrases = Object.keys(translations).sort((a, b) => b.length - a.length);
  function translate(source) {
    if (language === 'th') return source;
    if (translations[source]) return translations[source];
    // Dynamic payment messages include the time alongside these fixed phrases.
    if (source.startsWith('โอนตามยอดภายใน ')) return source.replace('โอนตามยอดภายใน ', translations['โอนตามยอดภายใน ']).replace(' น. แล้วแนบสลิปเพื่อตรวจสอบ', translations[' น. แล้วแนบสลิปเพื่อตรวจสอบ']).replace(' · คุณมีออเดอร์ที่ยังไม่หมดอายุอยู่แล้ว', translations[' · คุณมีออเดอร์ที่ยังไม่หมดอายุอยู่แล้ว']);
    const trimmed = source.trim();
    if (phrases.includes(trimmed)) return source.replace(trimmed, translations[trimmed]);
    return source;
  }
  function render() {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.parentElement.closest('script, style, [data-no-translate]')) continue;
      let state = textSources.get(node);
      if (!state || node.nodeValue !== state.rendered) state = { source: node.nodeValue };
      const rendered = translate(state.source);
      if (node.nodeValue !== rendered) node.nodeValue = rendered;
      textSources.set(node, { source: state.source, rendered });
    }
    document.querySelectorAll('[aria-label], [alt]').forEach(element => {
      const original = attributeSources.get(element) || {};
      for (const attribute of ['aria-label', 'alt']) {
        if (!element.hasAttribute(attribute)) continue;
        if (!(attribute in original)) original[attribute] = element.getAttribute(attribute);
        element.setAttribute(attribute, translate(original[attribute]));
      }
      attributeSources.set(element, original);
    });
  }
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
    language = button.dataset.language;
    try { localStorage.setItem('chronelia-language', language); } catch {}
    render();
  }));
  render();
  const observer = new MutationObserver(() => { observer.disconnect(); render(); observer.observe(document.body, { childList: true, characterData: true, subtree: true }); });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true });
})();
