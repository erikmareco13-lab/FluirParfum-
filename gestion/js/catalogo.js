// =========================================================
// Catálogo público. Toma los productos de:
//  1) los datos del panel en este mismo dispositivo (vista previa del dueño), o
//  2) el archivo catalogo.json publicado junto a la web (lo que ven los clientes).
// El pedido se arma acá y se envía por WhatsApp al negocio.
// =========================================================
(async () => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FAM = { acuatico: 'Acuática', amaderado: 'Amaderada', oriental: 'Oriental', floral: 'Floral', verde: 'Verde', nocturno: 'Nocturna' };

  async function loadData() {
    try {
      const raw = localStorage.getItem('gestion-perfumes-v1');
      if (raw) {
        const db = JSON.parse(raw);
        return {
          settings: db.settings,
          products: db.products.filter(p => p.inCatalog).map(p => ({ ...p, inStock: p.stock > 0 })),
        };
      }
    } catch { /* sin datos locales */ }
    try {
      const r = await fetch('catalogo.json', { cache: 'no-cache' });
      if (r.ok) return await r.json();
    } catch { /* sin archivo publicado */ }
    return { settings: { businessName: 'Catálogo', tagline: '', whatsapp: '', currency: 'USD', locale: 'es-AR' }, products: [] };
  }

  const data = await loadData();
  const st = data.settings || {};
  const products = data.products || [];
  const money = n => { const d = Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2; try { return new Intl.NumberFormat(st.locale || 'es-AR', { style: 'currency', currency: st.currency || 'USD', minimumFractionDigits: d, maximumFractionDigits: d }).format(n); } catch { return '$ ' + n; } };

  // Marca
  document.title = `${st.businessName} — Catálogo`;
  $('#logo').textContent = st.businessName;
  $('#footBig').textContent = st.businessName;
  $('#foot').textContent = `© ${new Date().getFullYear()} ${st.businessName}`;
  $('#year').textContent = new Date().getFullYear();
  if (st.tagline) {
    // Pone en cursiva la palabra más larga de la frase, como en la web
    const words = st.tagline.split(' ');
    const k = words.reduce((best, w, i) => w.replace(/\W/g, '').length > words[best].replace(/\W/g, '').length ? i : best, 0);
    $('#tagline').innerHTML = words.map((w, i) => i === k ? `<em>${esc(w)}</em>` : esc(w)).join(' ');
  }
  const wa = String(st.whatsapp || '').replace(/\D/g, '');
  $('#footWa').href = wa ? `https://wa.me/${wa}` : '#';
  if (!wa) $('#footWa').hidden = true;

  const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
  $('#nProd').textContent = products.length;
  $('#nCat').textContent = cats.length;

  // Filtros
  let cat = 'Todas', q = '';
  const filters = $('#filters');
  filters.innerHTML = ['Todas', ...cats].map(c => `<button class="chip ${c === cat ? 'is-active' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
  filters.onclick = e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    cat = b.dataset.c; filters.querySelectorAll('.chip').forEach(x => x.classList.toggle('is-active', x === b)); draw();
  };
  $('#q').oninput = e => { q = e.target.value.toLowerCase(); draw(); };

  const bottle = () => '<div class="bottle"><div class="bottle__cap"></div><div class="bottle__neck"></div><div class="bottle__body"><div class="bottle__liquid"></div><div class="bottle__shine"></div></div></div>';
  const grid = $('#products');
  function draw() {
    const list = products.filter(p => (cat === 'Todas' || p.category === cat) && (!q || [p.name, p.notes, p.category].join(' ').toLowerCase().includes(q)));
    grid.innerHTML = list.length ? list.map(p => `
      <article class="card tone-${esc(p.family || 'floral')} ${p.inStock ? '' : 'is-out'}">
        <div class="card__media">
          ${p.inStock ? (p.badge ? `<span class="card__badge">${esc(p.badge)}</span>` : '') : '<span class="card__badge card__badge--out">Agotado</span>'}
          ${p.image ? `<img src="${p.image}" alt="${esc(p.name)}" loading="lazy">` : bottle()}
        </div>
        <div class="card__body">
          <span class="card__family">${esc(p.category || FAM[p.family] || '')}</span>
          <h3 class="card__name">${esc(p.name)}</h3>
          ${p.notes ? `<p class="card__notes">${esc(p.notes)}</p>` : ''}
          <div class="card__foot"><span class="card__price">${money(p.price)}</span>
            <button class="add" data-id="${esc(p.id)}" ${p.inStock ? '' : 'disabled'} aria-label="Agregar ${esc(p.name)} al pedido">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </button></div>
        </div>
      </article>`).join('') : `<div class="empty"><b>${products.length ? 'Sin resultados' : 'Catálogo en preparación'}</b>${products.length ? 'Probá con otra búsqueda.' : 'Muy pronto vas a ver nuestras fragancias acá.'}</div>`;
  }
  draw();

  // Pedido
  const CART_KEY = 'catalogo-pedido';
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { cart = {}; }
  const byId = id => products.find(p => p.id === id);
  Object.keys(cart).forEach(id => { if (!byId(id)) delete cart[id]; });
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* sin almacenamiento */ } };
  const total = () => Object.entries(cart).reduce((s, [id, n]) => s + n * (byId(id)?.price || 0), 0);
  const count = () => Object.values(cart).reduce((s, n) => s + n, 0);

  let tt;
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('is-on'), 2200); };
  function paintCount() {
    $('#cartCount').textContent = count();
    $('#floatTotal').textContent = money(total());
    $('#floatCart').classList.toggle('has-items', count() > 0);
  }
  function drawLines() {
    const ids = Object.keys(cart);
    $('#lines').innerHTML = ids.length ? ids.map(id => {
      const p = byId(id);
      return `<div class="line tone-${esc(p.family || 'floral')}"><div class="line__thumb">${p.image ? `<img src="${p.image}" alt="">` : bottle()}</div>
        <div class="line__info"><b>${esc(p.name)}</b><span>${money(p.price)}</span></div>
        <div class="qty" data-id="${esc(id)}"><button type="button" data-d="-1" aria-label="Quitar uno">−</button><span>${cart[id]}</span><button type="button" data-d="1" aria-label="Agregar uno">+</button></div></div>`;
    }).join('') : '<div class="empty" style="padding:3rem 0"><b>Tu pedido está vacío</b>Agregá fragancias desde el catálogo.</div>';
    $('#total').textContent = money(total());
    $('#orderForm').hidden = !ids.length;
  }
  $('#lines').onclick = e => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    const id = b.parentElement.dataset.id;
    cart[id] = (cart[id] || 0) + Number(b.dataset.d);
    if (cart[id] <= 0) delete cart[id];
    saveCart(); drawLines(); paintCount();
  };
  grid.onclick = e => {
    const b = e.target.closest('.add'); if (!b) return;
    const p = byId(b.dataset.id);
    cart[p.id] = (cart[p.id] || 0) + 1; saveCart(); paintCount();
    toast(`${p.name} se agregó al pedido`);
  };

  const drawer = $('#drawer'), backdrop = $('#backdrop');
  const open = () => { drawLines(); refreshLink(); drawer.hidden = backdrop.hidden = false; requestAnimationFrame(() => { drawer.classList.add('is-on'); backdrop.classList.add('is-on'); }); };
  const close = () => { drawer.classList.remove('is-on'); backdrop.classList.remove('is-on'); setTimeout(() => { drawer.hidden = backdrop.hidden = true; }, 400); };
  $('#cartBtn').onclick = open; $('#floatCart').onclick = open;
  $('#close').onclick = close; backdrop.onclick = close;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // El envío usa un enlace real: así abre WhatsApp en cualquier navegador o visor.
  const orderMsg = () => {
    const name = $('#cName').value.trim(), note = $('#cNote').value.trim();
    const lines = Object.entries(cart).map(([id, n]) => { const p = byId(id); return `• ${n} × ${p.name} — ${money(n * p.price)}`; });
    return [`Hola ${st.businessName}! Quiero hacer este pedido:`, '', ...lines, '', `*Total: ${money(total())}*`, '', `Nombre: ${name}`, ...(note ? [`Comentarios: ${note}`] : [])].join('\n');
  };
  const sendWa = $('#sendWa');
  const refreshLink = () => { sendWa.href = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(orderMsg())}` : '#'; };
  $('#orderForm').addEventListener('input', refreshLink);
  $('#orderForm').onsubmit = e => { e.preventDefault(); sendWa.click(); };
  sendWa.addEventListener('pointerenter', refreshLink);
  sendWa.addEventListener('focus', refreshLink);
  sendWa.onclick = e => {
    refreshLink();
    if (!wa) { e.preventDefault(); toast('El negocio todavía no cargó su WhatsApp'); return; }
    if (!$('#cName').value.trim()) { e.preventDefault(); toast('Escribí tu nombre para enviar el pedido'); $('#cName').focus(); return; }
    setTimeout(() => { cart = {}; saveCart(); paintCount(); close(); }, 300);
  };

  paintCount();
})();
