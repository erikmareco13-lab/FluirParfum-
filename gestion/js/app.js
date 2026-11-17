// =========================================================
// Panel de gestión: ventas, gastos, balance, inventario,
// deudas (fiado), contactos, reportes, recibos y ajustes.
// =========================================================
(() => {
  const S = Store;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const view = $('#view');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : 0; };

  const money = n => {
    const { currency, locale } = S.settings;
    const d = Number.isInteger(Math.round((n || 0) * 100) / 100) ? 0 : 2;
    try { return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0); }
    catch { return '$ ' + (n || 0).toFixed(2); }
  };
  const dateLabel = iso => {
    const t = S.today(), y = shiftDate(t, -1);
    if (iso === t) return 'Hoy';
    if (iso === y) return 'Ayer';
    const [Y, M, D] = iso.split('-').map(Number);
    return new Date(Y, M - 1, D).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const shortDate = iso => { const [Y, M, D] = iso.split('-').map(Number); return new Date(Y, M - 1, D).toLocaleDateString('es', { day: 'numeric', month: 'short' }); };
  function shiftDate(iso, days) { const [Y, M, D] = iso.split('-').map(Number); const d = new Date(Y, M - 1, D + days); return S.localISO(d); }
  const initials = name => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const waLink = (phone, text) => `https://wa.me/${String(phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

  // ---------- Iconos ----------
  const I = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    debt: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    store: '<path d="M4 9h16l-1-5H5L4 9Z"/><path d="M5 9v11h14V9M9 20v-6h6v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    back: '<path d="M15 18 9 12l6-6"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M5 12l7 7 7-7"/>',
    wa: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Z"/><path d="M9 9.5c.5 2.5 2.5 4.5 5 5l1.2-1.2 2 1-.5 1.5c-3.5.5-8-4-7.5-7.5l1.5-.5 1 2L9 9.5Z"/>',
    print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><path d="M6 14h12v7H6z"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  };
  const icon = (name, size = 20, sw = 1.6) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

  const bottle = (family, h = 72) => `<div class="bottle tone-${esc(family || 'floral')}" style="--h:${h}px"><div class="bottle__cap"></div><div class="bottle__neck"></div><div class="bottle__body"><div class="bottle__liquid"></div></div></div>`;
  const productThumb = (p, h = 30) => p?.image ? `<img src="${p.image}" alt="">` : bottle(p?.family, h);

  // ---------- Toast y hoja modal ----------
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
  }
  const sheet = $('#sheet'), backdrop = $('#backdrop');
  function openSheet(html, mount) {
    sheet.innerHTML = html; sheet.hidden = backdrop.hidden = false;
    requestAnimationFrame(() => { sheet.classList.add('is-on'); backdrop.classList.add('is-on'); });
    mount?.(sheet);
    const f = sheet.querySelector('input:not([type=radio]):not([type=checkbox]), select'); if (f && matchMedia('(min-width: 700px)').matches) f.focus();
  }
  function closeSheet() {
    sheet.classList.remove('is-on'); backdrop.classList.remove('is-on');
    setTimeout(() => { sheet.hidden = backdrop.hidden = true; sheet.innerHTML = ''; }, 300);
  }
  backdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
  const confirmAsk = msg => window.confirm(msg);

  // ---------- Navegación ----------
  const NAV = [
    { r: 'inicio', label: 'Balance', icon: 'home' },
    { r: 'movimientos', label: 'Movimientos', icon: 'list' },
    { r: 'inventario', label: 'Inventario', icon: 'box' },
    { r: 'deudas', label: 'Deudas', icon: 'debt' },
    { r: 'contactos', label: 'Contactos', icon: 'users' },
    { r: 'reportes', label: 'Reportes', icon: 'chart' },
    { r: 'ajustes', label: 'Ajustes', icon: 'gear' },
  ];
  function renderNav(route) {
    const group = { venta: 'inicio', gasto: 'inicio', mov: 'movimientos', producto: 'inventario', contacto: 'contactos', mas: 'mas' }[route] || route;
    $('#sidebar').innerHTML = `
      <div class="brand">${esc(S.settings.businessName)}</div>
      <div class="brand-sub">Panel de gestión</div>
      ${NAV.map(n => `<a href="#/${n.r}" class="${group === n.r ? 'is-active' : ''}">${icon(n.icon)}${n.label}</a>`).join('')}
      <a href="catalogo.html" target="_blank" rel="noopener">${icon('store')}Ver catálogo</a>
      <a href="#/venta" class="side-cta">${icon('plus', 18, 2)}Nueva venta</a>
      <div class="side-foot">Datos guardados en este dispositivo</div>`;
    const inMore = ['deudas', 'contactos', 'reportes', 'ajustes', 'mas'].includes(group);
    $('#tabbar').innerHTML = `
      <a href="#/inicio" class="${group === 'inicio' ? 'is-active' : ''}">${icon('home')}Balance</a>
      <a href="#/movimientos" class="${group === 'movimientos' ? 'is-active' : ''}">${icon('list')}Movim.</a>
      <a href="#/venta" class="fab" aria-label="Nueva venta">${icon('plus', 26, 2)}</a>
      <a href="#/inventario" class="${group === 'inventario' ? 'is-active' : ''}">${icon('box')}Inventario</a>
      <a href="#/mas" class="${inMore ? 'is-active' : ''}">${icon('more')}Más</a>`;
  }

  const topbar = (title, sub = '', opts = {}) => `
    <header class="topbar">
      <div style="display:flex;align-items:center;gap:10px;min-width:0">
        ${opts.back ? `<a class="icon-btn" href="${opts.back}" aria-label="Volver">${icon('back')}</a>` : ''}
        <div style="min-width:0">${sub ? `<div class="sub">${esc(sub)}</div>` : ''}<h1>${title}</h1></div>
      </div>
      ${opts.action || ''}
    </header>`;

  // ---------- Periodos ----------
  const state = { period: 'semana', movFilter: 'todos', movSearch: '', invFilter: 'todos', invSearch: '', debtTab: 'cobrar', contactTab: 'cliente', saleCart: new Map(), saleCat: 'Todas', saleSearch: '' };
  const PERIODS = { hoy: 'Hoy', semana: '7 días', mes: 'Este mes', anio: 'Este año', todo: 'Todo' };
  function range(p) {
    const t = S.today();
    if (p === 'hoy') return [t, t];
    if (p === 'semana') return [shiftDate(t, -6), t];
    if (p === 'mes') return [t.slice(0, 8) + '01', t];
    if (p === 'anio') return [t.slice(0, 5) + '01-01', t];
    return ['0000-00-00', '9999-12-31'];
  }
  const inRange = (m, [a, b]) => m.date >= a && m.date <= b;
  const periodBar = (cur, key = 'period') => `<div class="segmented" data-seg="${key}">${Object.entries(PERIODS).map(([k, v]) => `<button data-v="${k}" class="${cur === k ? 'is-active' : ''}">${v}</button>`).join('')}</div>`;
  function bindSeg(root, onChange) {
    $$('.segmented[data-seg]', root).forEach(seg => seg.addEventListener('click', e => {
      const b = e.target.closest('button[data-v]'); if (!b) return;
      state[seg.dataset.seg] = b.dataset.v; onChange();
    }));
  }

  function metrics(movs) {
    const ventas = movs.filter(m => m.type === 'venta'), gastos = movs.filter(m => m.type === 'gasto');
    const sum = (arr, f) => S.round(arr.reduce((s, x) => s + f(x), 0));
    const totalV = sum(ventas, m => m.total), totalG = sum(gastos, m => m.total);
    const costo = sum(ventas, m => m.items.reduce((s, i) => s + i.qty * (i.cost || 0), 0));
    return {
      ventas, gastos, totalV, totalG, costo,
      balance: S.round(totalV - totalG),
      bruta: S.round(totalV - costo),
      porCobrar: sum(ventas, S.balanceOf),
      porPagar: sum(gastos, S.balanceOf),
      ticket: ventas.length ? S.round(totalV / ventas.length) : 0,
    };
  }

  // ---------- Gráfico de barras: ventas vs gastos ----------
  function buckets(p) {
    const t = S.today(), out = [];
    if (p === 'anio' || p === 'todo') {
      const [Y, M] = t.split('-').map(Number);
      const n = p === 'anio' ? M : 12;
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(Y, M - 1 - i, 1);
        const key = S.localISO(d).slice(0, 7);
        out.push({ key, label: d.toLocaleDateString('es', { month: 'short' }).replace('.', ''), test: m => m.date.slice(0, 7) === key });
      }
    } else {
      const days = p === 'mes' ? Number(t.slice(8, 10)) : 7;
      for (let i = days - 1; i >= 0; i--) {
        const key = shiftDate(t, -i);
        const [Y, M, D] = key.split('-').map(Number);
        const label = days > 10 ? String(D) : new Date(Y, M - 1, D).toLocaleDateString('es', { weekday: 'short' }).replace('.', '');
        out.push({ key, label, test: m => m.date === key });
      }
    }
    return out;
  }
  function drawChart(el, p) {
    const bs = buckets(p).map(b => {
      const ms = S.data.movements.filter(b.test);
      return { ...b, v: S.round(ms.filter(m => m.type === 'venta').reduce((s, m) => s + m.total, 0)), g: S.round(ms.filter(m => m.type === 'gasto').reduce((s, m) => s + m.total, 0)) };
    });
    const W = Math.max(280, el.clientWidth), H = 190, padL = 44, padB = 22, padT = 8;
    const max = Math.max(1, ...bs.flatMap(b => [b.v, b.g]));
    const step = niceStep(max / 3), top = Math.ceil(max / step) * step;
    const y = v => padT + (H - padT - padB) * (1 - v / top);
    const colW = (W - padL) / bs.length;
    const barW = Math.max(2, Math.min(18, (colW - 8) / 2 - 1));
    const bar = (x, v, cls) => {
      if (v <= 0) return '';
      const y0 = y(0), y1 = y(v), r = Math.min(4, barW / 2, y0 - y1);
      return `<path class="${cls}" d="M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + barW - r} Q${x + barW},${y1} ${x + barW},${y1 + r} V${y0} Z"/>`;
    };
    const ticks = []; for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
    const every = bs.length > 16 ? Math.ceil(bs.length / 8) : 1;
    el.innerHTML = `
      <svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Ventas y gastos por periodo">
        <defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#A8475A" opacity=".55"/><rect width="2.5" height="5" fill="#A8475A"/></pattern></defs>
        <g class="grid">${ticks.map(v => `<line x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
        <g class="axis">${ticks.map(v => `<text x="${padL - 8}" y="${y(v) + 3}" text-anchor="end">${compact(v)}</text>`).join('')}
          ${bs.map((b, i) => i % every === 0 ? `<text x="${padL + colW * i + colW / 2}" y="${H - 6}" text-anchor="middle">${esc(b.label)}</text>` : '').join('')}</g>
        ${bs.map((b, i) => {
          const cx = padL + colW * i + colW / 2;
          return `<g class="col" data-i="${i}"><rect class="hl" x="${padL + colW * i}" y="${padT}" width="${colW}" height="${H - padT - padB}" rx="6"/>
            ${bar(cx - barW - 1, b.v, 'bar-v')}${bar(cx + 1, b.g, 'bar-g')}
            <rect class="hit" x="${padL + colW * i}" y="0" width="${colW}" height="${H}"/></g>`;
        }).join('')}
      </svg><div class="tooltip" id="tip"></div>`;
    const tip = $('#tip', el);
    const show = g => {
      $$('.col', el).forEach(c => c.classList.toggle('is-hover', c === g));
      const b = bs[g.dataset.i];
      tip.innerHTML = `<b>${esc(b.key.length === 7 ? b.label : dateLabel(b.key))}</b><br>Ventas ${money(b.v)}<br>Gastos ${money(b.g)}`;
      tip.style.left = Math.min(W - 70, Math.max(70, padL + colW * g.dataset.i + colW / 2)) + 'px';
      tip.style.top = Math.max(40, y(Math.max(b.v, b.g))) + 'px';
      tip.classList.add('is-on');
    };
    $$('.col', el).forEach(g => { g.addEventListener('mouseenter', () => show(g)); g.addEventListener('click', () => show(g)); });
    el.addEventListener('mouseleave', () => { tip.classList.remove('is-on'); $$('.col', el).forEach(c => c.classList.remove('is-hover')); });
  }
  function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  const compact = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '') + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1).replace('.0', '') + 'k' : String(Math.round(v));

  // ---------- Fila de movimiento ----------
  function movRow(m) {
    const c = S.contact(m.contactId);
    const isV = m.type === 'venta';
    const due = S.balanceOf(m);
    const title = isV ? (m.items.length ? m.items.map(i => `${i.qty}× ${i.name}`).join(', ') : (m.concept || 'Venta')) : (m.concept || m.category);
    const meta = [isV ? `Venta #${m.number}` : m.category, c?.name, methodLabel(m.method)].filter(Boolean).join(' · ');
    return `<a class="item" href="#/mov/${m.id}">
      <div class="item__icon ${isV ? 'is-sale' : 'is-expense'}">${icon(isV ? 'up' : 'down', 18, 2)}</div>
      <div class="item__body"><div class="item__title">${esc(title)}</div><div class="item__meta">${esc(meta)}</div></div>
      <div class="item__end"><b class="${isV ? 'amount-in' : 'amount-out'}">${isV ? '+' : '−'}${money(m.total)}</b>${due > 0 ? `<span class="tag tag--debt">Debe ${money(due)}</span>` : ''}</div>
    </a>`;
  }
  const METHODS = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta', qr: 'QR / billetera', otro: 'Otro' };
  const methodLabel = k => METHODS[k] || '';
  const sortDesc = (a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt);

  // =========================================================
  // VISTAS
  // =========================================================
  const views = {};

  // ---------- Balance ----------
  views.inicio = () => {
    const r = range(state.period);
    const movs = S.data.movements.filter(m => inRange(m, r));
    const k = metrics(movs);
    const low = S.data.products.filter(p => p.stock <= (p.minStock || 0));
    const recent = [...S.data.movements].sort(sortDesc).slice(0, 6);
    view.innerHTML = `
      ${topbar(`Hola, <em>${esc(S.settings.businessName)}</em>`, new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }), { action: `<a class="icon-btn hide-desk" href="#/ajustes" aria-label="Ajustes">${icon('gear')}</a>` })}
      ${periodBar(state.period)}
      <section class="hero-balance">
        <div class="label">Balance · ${PERIODS[state.period]}</div>
        <div class="big">${money(k.balance)}</div>
        <div class="row">
          <div class="pill"><span>Ventas</span><b>${money(k.totalV)}</b></div>
          <div class="pill"><span>Gastos</span><b>${money(k.totalG)}</b></div>
        </div>
      </section>
      <div class="quick">
        <a class="btn btn--sale" href="#/venta">${icon('plus', 18, 2)}Nueva venta</a>
        <a class="btn btn--expense" href="#/gasto">${icon('down', 18, 2)}Nuevo gasto</a>
      </div>

      <div class="stats mt">
        <div class="stat"><span>Ganancia bruta</span><b>${money(k.bruta)}</b><small>Ventas − costo de lo vendido</small></div>
        <div class="stat"><span>N.º de ventas</span><b>${k.ventas.length}</b><small>Ticket promedio ${money(k.ticket)}</small></div>
        <a class="stat" href="#/deudas" style="text-decoration:none"><span>Te deben</span><b class="amount-out">${money(k.porCobrar)}</b><small>Ventas fiadas del periodo</small></a>
        <a class="stat" href="#/deudas" style="text-decoration:none"><span>Debés</span><b>${money(k.porPagar)}</b><small>Gastos sin pagar</small></a>
      </div>

      <div class="section-title"><h2>Ventas y gastos</h2></div>
      <div class="card">
        <div class="legend"><span><i class="lv"></i>Ventas</span><span><i class="lg"></i>Gastos</span></div>
        <div class="chart-wrap" id="chart"></div>
      </div>

      ${low.length ? `<div class="section-title"><h2>Stock bajo</h2><a href="#/inventario" data-low>Ver inventario →</a></div>
      <div class="list">${low.slice(0, 4).map(p => `<a class="item" href="#/producto/${p.id}"><div class="item__icon">${productThumb(p)}</div><div class="item__body"><div class="item__title">${esc(p.name)}</div><div class="item__meta">Mínimo sugerido: ${p.minStock}</div></div><div class="item__end"><span class="tag ${p.stock <= 0 ? 'tag--debt' : 'tag--warn'}">${p.stock <= 0 ? 'Agotado' : `Quedan ${p.stock}`}</span></div></a>`).join('')}</div>` : ''}

      <div class="section-title"><h2>Últimos movimientos</h2><a href="#/movimientos">Ver todos →</a></div>
      <div class="list">${recent.length ? recent.map(movRow).join('') : `<div class="empty"><b>Todavía no hay movimientos</b>Registrá tu primera venta con el botón +</div>`}</div>`;
    bindSeg(view, () => views.inicio());
    drawChart($('#chart'), state.period);
    $('[data-low]', view)?.addEventListener('click', () => { state.invFilter = 'bajo'; });
  };

  // ---------- Movimientos ----------
  views.movimientos = () => {
    const r = range(state.period);
    const q = state.movSearch.toLowerCase();
    let movs = S.data.movements.filter(m => inRange(m, r));
    if (state.movFilter === 'ventas') movs = movs.filter(m => m.type === 'venta');
    if (state.movFilter === 'gastos') movs = movs.filter(m => m.type === 'gasto');
    if (state.movFilter === 'deuda') movs = movs.filter(m => S.balanceOf(m) > 0);
    if (q) movs = movs.filter(m => [m.concept, m.category, S.contact(m.contactId)?.name, ...m.items.map(i => i.name), '#' + m.number].join(' ').toLowerCase().includes(q));
    movs.sort(sortDesc);
    const k = metrics(movs);
    const byDay = {};
    movs.forEach(m => (byDay[m.date] ||= []).push(m));
    view.innerHTML = `
      ${topbar('Movimientos', 'Ventas y gastos', { action: `<a class="btn btn--sm" href="#/gasto">${icon('down', 16, 2)}Gasto</a>` })}
      ${periodBar(state.period)}
      <div class="segmented" data-seg="movFilter">${[['todos', 'Todos'], ['ventas', 'Ventas'], ['gastos', 'Gastos'], ['deuda', 'Con deuda']].map(([v, l]) => `<button data-v="${v}" class="${state.movFilter === v ? 'is-active' : ''}">${l}</button>`).join('')}</div>
      <div class="search">${icon('search', 18)}<input class="input" id="q" type="search" placeholder="Buscar por producto, cliente o N.º" value="${esc(state.movSearch)}"></div>
      <div class="stats">
        <div class="stat"><span>Ventas</span><b class="amount-in">${money(k.totalV)}</b></div>
        <div class="stat"><span>Gastos</span><b class="amount-out">${money(k.totalG)}</b></div>
      </div>
      ${Object.keys(byDay).length ? Object.entries(byDay).map(([d, ms]) => {
        const net = ms.reduce((s, m) => s + (m.type === 'venta' ? m.total : -m.total), 0);
        return `<div class="day-head"><span>${dateLabel(d)}</span><span>${net >= 0 ? '+' : '−'}${money(Math.abs(net))}</span></div><div class="list">${ms.map(movRow).join('')}</div>`;
      }).join('') : `<div class="list mt"><div class="empty"><b>Sin movimientos</b>Probá con otro periodo o filtro.</div></div>`}`;
    bindSeg(view, () => views.movimientos());
    const qi = $('#q'); qi.addEventListener('input', debounce(() => { state.movSearch = qi.value; views.movimientos(); const n = $('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250));
  };

  // ---------- Detalle de movimiento / recibo ----------
  views.mov = id => {
    const m = S.movement(id);
    if (!m) { location.hash = '#/movimientos'; return; }
    const c = S.contact(m.contactId);
    const isV = m.type === 'venta';
    const due = S.balanceOf(m);
    const st = S.settings;
    view.innerHTML = `
      ${topbar(isV ? `Venta <em>#${m.number}</em>` : esc(m.concept || m.category), isV ? 'Recibo' : 'Gasto', { back: '#/movimientos' })}
      <div class="receipt" id="receipt">
        <div class="receipt__brand">${esc(st.businessName)}</div>
        <div class="receipt__sub">${isV ? `Comprobante de venta N.º ${m.number}` : 'Comprobante de gasto'}</div>
        <div class="receipt__row"><span>Fecha</span><span>${shortDate(m.date)} ${m.date.slice(0, 4)}</span></div>
        ${c ? `<div class="receipt__row"><span>${isV ? 'Cliente' : 'Proveedor'}</span><span>${esc(c.name)}</span></div>` : ''}
        <div class="receipt__row"><span>Medio de pago</span><span>${methodLabel(m.method)}</span></div>
        <hr>
        ${m.items.length ? m.items.map(i => `<div class="receipt__row"><span>${i.qty} × ${esc(i.name)}</span><span>${money(i.qty * i.price)}</span></div>`).join('') : `<div class="receipt__row"><span>${esc(m.concept || m.category)}</span><span>${money(m.total)}</span></div>`}
        ${m.discount ? `<div class="receipt__row"><span>Descuento</span><span>−${money(m.discount)}</span></div>` : ''}
        <div class="receipt__row total"><span>Total</span><span>${money(m.total)}</span></div>
        <div class="receipt__row"><span>Pagado</span><span>${money(S.paidOf(m))}</span></div>
        ${due > 0 ? `<div class="receipt__row" style="color:var(--borgona);font-weight:700"><span>Saldo pendiente</span><span>${money(due)}</span></div>` : ''}
        ${m.note ? `<hr><div class="receipt__row"><span class="muted">${esc(m.note)}</span></div>` : ''}
        ${isV ? `<div class="receipt__note">${esc(st.receiptNote)}</div>` : ''}
      </div>
      <div class="btn-row mt">
        ${isV ? `<a class="btn" target="_blank" rel="noopener" href="${waLink(c?.phone, receiptText(m))}">${icon('wa', 18)}Enviar por WhatsApp</a>` : ''}
        <button class="btn btn--soft" id="print">${icon('print', 18)}Imprimir</button>
        ${due > 0 ? `<button class="btn btn--ghost" id="pay">Registrar abono</button>` : ''}
        ${due > 0 && isV && c?.phone ? `<a class="btn btn--soft" target="_blank" rel="noopener" href="${waLink(c.phone, `Hola ${c.name.split(' ')[0]}, te recuerdo que tenés un saldo pendiente de ${money(due)} con ${st.businessName} (venta #${m.number}). ¡Gracias!`)}">Recordar deuda</a>` : ''}
      </div>
      ${m.payments.length ? `<div class="section-title"><h2>Pagos registrados</h2></div><div class="list">${m.payments.map(p => `<div class="item"><div class="item__body"><div class="item__title">${money(p.amount)}</div><div class="item__meta">${dateLabel(p.date)} · ${methodLabel(p.method)}</div></div></div>`).join('')}</div>` : ''}
      <button class="btn btn--danger btn--block mt-l" id="del">${icon('trash', 18)}Eliminar ${isV ? 'venta' : 'gasto'}</button>`;
    $('#print').onclick = () => window.print();
    $('#pay')?.addEventListener('click', () => paySheet(m, () => views.mov(id)));
    $('#del').onclick = () => {
      if (!confirmAsk(`¿Eliminar este ${isV ? 'registro de venta' : 'gasto'}? ${isV || m.restock ? 'El stock se va a ajustar.' : ''}`)) return;
      S.deleteMovement(id); toast('Eliminado'); location.hash = '#/movimientos';
    };
  };
  function receiptText(m) {
    const st = S.settings, c = S.contact(m.contactId);
    const lines = m.items.length ? m.items.map(i => `• ${i.qty} × ${i.name} — ${money(i.qty * i.price)}`) : [`• ${m.concept || 'Venta'} — ${money(m.total)}`];
    const due = S.balanceOf(m);
    return [`*${st.businessName}*`, `Comprobante N.º ${m.number} · ${shortDate(m.date)}`, c ? `Cliente: ${c.name}` : '', '', ...lines,
      m.discount ? `Descuento: −${money(m.discount)}` : '', `*Total: ${money(m.total)}*`, `Pagado: ${money(S.paidOf(m))}`, due > 0 ? `Saldo pendiente: ${money(due)}` : '', '', st.receiptNote].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
  }
  function paySheet(m, done) {
    const due = S.balanceOf(m);
    openSheet(`
      <h3>Registrar abono</h3>
      <p class="muted" style="margin-bottom:14px">Saldo pendiente: <b>${money(due)}</b></p>
      <form id="payForm">
        <div class="field"><label for="pAmt">Monto</label><input class="input input--big" id="pAmt" inputmode="decimal" value="${due}" required></div>
        <div class="field"><span class="label-sm">Medio de pago</span><div class="choice">${methodChoices('pm', 'efectivo')}</div></div>
        <div class="field"><label for="pDate">Fecha</label><input class="input" id="pDate" type="date" value="${S.today()}"></div>
        <button class="btn btn--block" type="submit">Guardar abono</button>
      </form>`, root => {
      $('#payForm', root).onsubmit = e => {
        e.preventDefault();
        const amt = Math.min(due, num($('#pAmt', root).value));
        if (amt <= 0) return toast('Ingresá un monto válido');
        S.addPayment(m.id, amt, $('input[name=pm]:checked', root).value, $('#pDate', root).value || S.today());
        closeSheet(); toast(amt >= due ? 'Deuda saldada' : 'Abono registrado'); done();
      };
    });
  }
  const methodChoices = (name, cur) => Object.entries(METHODS).map(([k, v]) => `<input type="radio" name="${name}" id="${name}-${k}" value="${k}" ${k === cur ? 'checked' : ''}><label for="${name}-${k}">${v}</label>`).join('');
  const contactOptions = (type, cur) => `<option value="">— Sin ${type === 'cliente' ? 'cliente' : 'proveedor'} —</option>${S.data.contacts.filter(c => c.type === type).map(c => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}<option value="__new">+ Crear nuevo…</option>`;
  function bindContactSelect(sel, type) {
    sel.addEventListener('change', () => {
      if (sel.value !== '__new') return;
      const name = prompt(`Nombre del ${type}`);
      if (!name) { sel.value = ''; return; }
      const phone = prompt('WhatsApp (con código de país, opcional)') || '';
      const c = S.upsertContact({ name: name.trim(), phone: phone.trim(), type, notes: '' });
      sel.innerHTML = contactOptions(type, c.id);
    });
  }

  // ---------- Nueva venta ----------
  views.venta = () => {
    const cart = state.saleCart;
    const cats = ['Todas', ...new Set(S.data.products.map(p => p.category).filter(Boolean))];
    const q = state.saleSearch.toLowerCase();
    const prods = S.data.products.filter(p => (state.saleCat === 'Todas' || p.category === state.saleCat) && (!q || p.name.toLowerCase().includes(q)));
    const total = [...cart.entries()].reduce((s, [id, qty]) => s + qty * (S.product(id)?.price || 0), 0);
    const units = [...cart.values()].reduce((s, n) => s + n, 0);
    view.innerHTML = `
      ${topbar('Nueva <em>venta</em>', 'Elegí los productos', { back: '#/inicio', action: `<button class="btn btn--sm btn--soft" id="free">Venta libre</button>` })}
      <div class="search">${icon('search', 18)}<input class="input" id="q" type="search" placeholder="Buscar producto" value="${esc(state.saleSearch)}"></div>
      <div class="segmented" id="cats">${cats.map(c => `<button data-c="${esc(c)}" class="${state.saleCat === c ? 'is-active' : ''}">${esc(c)}</button>`).join('')}</div>
      ${prods.length ? `<div class="pick-grid">${prods.map(p => {
        const n = cart.get(p.id) || 0;
        return `<button class="pick ${n ? 'is-in' : ''}" data-id="${p.id}">
          ${n ? `<span class="pick__qty">${n}</span>` : ''}
          <div class="pick__media">${productThumb(p, 76)}</div>
          <div class="pick__name">${esc(p.name)}</div>
          <div class="row-between"><span class="pick__price">${money(p.price)}</span><span class="pick__stock">${p.stock <= 0 ? '<span class="tag tag--debt">Agotado</span>' : `Stock ${p.stock}`}</span></div>
        </button>`;
      }).join('')}</div>` : `<div class="list"><div class="empty"><b>No hay productos</b>Cargalos en Inventario o usá “Venta libre”.</div></div>`}
      ${units ? `<div class="cartbar"><div><small>${units} ${units === 1 ? 'producto' : 'productos'}</small><b>${money(total)}</b></div><div class="btn-row"><button class="btn btn--sm" style="background:transparent;color:var(--lavanda-2)" id="clear">Vaciar</button><button class="btn" id="next">Continuar</button></div></div><div style="height:90px"></div>` : ''}`;
    const qi = $('#q');
    qi.addEventListener('input', debounce(() => { state.saleSearch = qi.value; views.venta(); const n = $('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200));
    $('#cats').onclick = e => { const b = e.target.closest('[data-c]'); if (b) { state.saleCat = b.dataset.c; views.venta(); } };
    $$('.pick').forEach(b => b.onclick = () => {
      const p = S.product(b.dataset.id); const n = (cart.get(p.id) || 0) + 1;
      if (n > p.stock && !confirmAsk(`Solo hay ${p.stock} en stock de “${p.name}”. ¿Vender igual?`)) return;
      cart.set(p.id, n); const y = scrollY; views.venta(); scrollTo(0, y);
    });
    $('#clear')?.addEventListener('click', () => { cart.clear(); views.venta(); });
    $('#next')?.addEventListener('click', () => checkoutSheet());
    $('#free').onclick = () => checkoutSheet(true);
  };

  function checkoutSheet(free = false) {
    const cart = state.saleCart;
    const lines = () => [...cart.entries()].map(([id, qty]) => ({ p: S.product(id), qty })).filter(l => l.p);
    openSheet(`
      <h3>${free ? 'Venta libre' : 'Confirmar venta'}</h3>
      <form id="co">
        ${free ? `
          <div class="field"><label for="fAmt">Monto</label><input class="input input--big" id="fAmt" inputmode="decimal" placeholder="0" required></div>
          <div class="field"><label for="fCon">Concepto</label><input class="input" id="fCon" placeholder="Ej.: Decant 5 ml"></div>` : `
          <div class="list" id="lines"></div>
          <div class="field mt"><label for="disc">Descuento</label><input class="input" id="disc" inputmode="decimal" placeholder="0"></div>`}
        <div class="field"><label for="cli">Cliente</label><select class="input" id="cli">${contactOptions('cliente')}</select></div>
        <div class="field"><span class="label-sm">Medio de pago</span><div class="choice">${methodChoices('m', 'efectivo')}</div></div>
        <div class="field"><span class="label-sm">Estado</span><div class="choice">
          <input type="radio" name="st" id="st-p" value="pagada" checked><label for="st-p">Pagada</label>
          <input type="radio" name="st" id="st-d" value="deuda"><label for="st-d">Fiado / a crédito</label></div></div>
        <div class="field" id="abonoF" hidden><label for="abono">Pago inicial (opcional)</label><input class="input" id="abono" inputmode="decimal" placeholder="0"></div>
        <div class="grid-2">
          <div class="field"><label for="dt">Fecha</label><input class="input" id="dt" type="date" value="${S.today()}"></div>
          <div class="field"><label for="nt">Nota</label><input class="input" id="nt" placeholder="Opcional"></div>
        </div>
        <div class="row-between" style="margin:4px 0 14px"><span class="label-sm">Total</span><b id="tot" style="font-size:1.5rem;font-family:var(--f-display);font-weight:400"></b></div>
        <button class="btn btn--block" type="submit">Registrar venta</button>
      </form>`, root => {
      const calc = () => {
        if (free) return S.round(num($('#fAmt', root).value));
        const sub = lines().reduce((s, l) => s + l.qty * l.p.price, 0);
        return Math.max(0, S.round(sub - num($('#disc', root).value)));
      };
      const paint = () => { $('#tot', root).textContent = money(calc()); };
      const drawLines = () => {
        const box = $('#lines', root); if (!box) return;
        box.innerHTML = lines().map(({ p, qty }) => `<div class="item"><div class="item__icon">${productThumb(p)}</div>
          <div class="item__body"><div class="item__title">${esc(p.name)}</div><div class="item__meta">${money(p.price)} c/u</div></div>
          <div class="qty" data-id="${p.id}"><button type="button" data-d="-1" aria-label="Quitar uno">−</button><input value="${qty}" inputmode="numeric" aria-label="Cantidad"><button type="button" data-d="1" aria-label="Agregar uno">+</button></div></div>`).join('') || '<div class="empty">Sin productos</div>';
        $$('.qty', box).forEach(q => {
          const id = q.dataset.id;
          q.onclick = e => { const d = e.target.dataset.d; if (!d) return; const n = (cart.get(id) || 0) + Number(d); n <= 0 ? cart.delete(id) : cart.set(id, n); drawLines(); paint(); };
          $('input', q).onchange = e => { const n = Math.max(0, Math.round(num(e.target.value))); n ? cart.set(id, n) : cart.delete(id); drawLines(); paint(); };
        });
      };
      drawLines(); paint();
      root.addEventListener('input', paint);
      bindContactSelect($('#cli', root), 'cliente');
      $$('input[name=st]', root).forEach(r => r.onchange = () => { $('#abonoF', root).hidden = r.value !== 'deuda' || !r.checked; });
      $('#co', root).onsubmit = e => {
        e.preventDefault();
        const total = calc();
        if (total <= 0) return toast('El total tiene que ser mayor a cero');
        const items = free ? [] : lines().map(({ p, qty }) => ({ productId: p.id, name: p.name, qty, price: p.price, cost: p.cost || 0 }));
        if (!free && !items.length) return toast('Agregá al menos un producto');
        const status = $('input[name=st]:checked', root).value;
        const cli = $('#cli', root).value;
        if (status === 'deuda' && !cli) return toast('Para fiar, elegí o creá un cliente');
        const method = $('input[name=m]:checked', root).value;
        const date = $('#dt', root).value || S.today();
        const first = status === 'pagada' ? total : Math.min(total, num($('#abono', root).value));
        const m = S.addMovement({
          type: 'venta', date, items, total, method, contactId: cli, category: 'Ventas',
          concept: free ? ($('#fCon', root).value.trim() || 'Venta libre') : '',
          discount: free ? 0 : num($('#disc', root).value), note: $('#nt', root).value.trim(),
          payments: first > 0 ? [{ date, amount: first, method }] : [],
        });
        cart.clear(); state.saleSearch = '';
        closeSheet(); toast(`Venta #${m.number} registrada`);
        location.hash = '#/mov/' + m.id;
      };
    });
  }

  // ---------- Nuevo gasto ----------
  const EXP_CATS = ['Mercadería', 'Insumos', 'Envíos', 'Publicidad', 'Servicios', 'Alquiler', 'Sueldos', 'Impuestos', 'Otros'];
  views.gasto = () => {
    view.innerHTML = `
      ${topbar('Nuevo <em>gasto</em>', 'Registrá una salida de dinero', { back: '#/inicio' })}
      <form class="card" id="gf">
        <div class="field"><label for="gAmt">Monto</label><input class="input input--big" id="gAmt" inputmode="decimal" placeholder="0" required></div>
        <div class="field"><span class="label-sm">Categoría</span><div class="choice">${EXP_CATS.map((c, i) => `<input type="radio" name="gc" id="gc${i}" value="${c}" ${i === 0 ? 'checked' : ''}><label for="gc${i}">${c}</label>`).join('')}</div></div>
        <div class="field"><label for="gCon">Concepto</label><input class="input" id="gCon" placeholder="Ej.: Compra de esencias"></div>
        <div id="restockBox">
          <label class="switch"><span><b style="font-size:.9rem">Sumar al inventario</b><br><small class="muted">Es una compra de productos que vas a vender</small></span><input type="checkbox" id="rs"></label>
          <div id="rsLines" hidden></div>
        </div>
        <div class="field mt"><label for="prov">Proveedor</label><select class="input" id="prov">${contactOptions('proveedor')}</select></div>
        <div class="field"><span class="label-sm">Medio de pago</span><div class="choice">${methodChoices('gm', 'transferencia')}</div></div>
        <div class="field"><span class="label-sm">Estado</span><div class="choice">
          <input type="radio" name="gs" id="gs-p" value="pagado" checked><label for="gs-p">Pagado</label>
          <input type="radio" name="gs" id="gs-d" value="deuda"><label for="gs-d">Lo debo</label></div></div>
        <div class="field"><label for="gDt">Fecha</label><input class="input" id="gDt" type="date" value="${S.today()}"></div>
        <button class="btn btn--expense btn--block" type="submit">Guardar gasto</button>
      </form>`;
    const rsLines = $('#rsLines');
    const lineHTML = () => `<div class="grid-2 rs-line" style="grid-template-columns:1fr 90px;margin-top:10px"><select class="input">${S.data.products.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select><input class="input" inputmode="numeric" placeholder="Cant."></div>`;
    const toggleRestock = () => { $('#restockBox').hidden = $('input[name=gc]:checked').value !== 'Mercadería' || !S.data.products.length; };
    $$('input[name=gc]').forEach(r => r.onchange = toggleRestock); toggleRestock();
    $('#rs').onchange = e => {
      rsLines.hidden = !e.target.checked;
      if (e.target.checked && !rsLines.children.length) rsLines.innerHTML = lineHTML() + `<button type="button" class="link mt" id="addLine" style="display:block">+ Agregar otro producto</button>`;
      $('#addLine')?.addEventListener('click', ev => ev.target.insertAdjacentHTML('beforebegin', lineHTML()));
    };
    bindContactSelect($('#prov'), 'proveedor');
    $('#gf').onsubmit = e => {
      e.preventDefault();
      const total = S.round(num($('#gAmt').value));
      if (total <= 0) return toast('Ingresá el monto del gasto');
      const restock = $('#rs').checked && !$('#restockBox').hidden;
      const items = restock ? $$('.rs-line').map(l => {
        const p = S.product($('select', l).value), qty = Math.round(num($('input', l).value));
        return p && qty > 0 ? { productId: p.id, name: p.name, qty, price: 0, cost: p.cost || 0 } : null;
      }).filter(Boolean) : [];
      const status = $('input[name=gs]:checked').value, method = $('input[name=gm]:checked').value, date = $('#gDt').value || S.today();
      if (status === 'deuda' && !$('#prov').value) return toast('Para registrar una deuda, elegí un proveedor');
      const category = $('input[name=gc]:checked').value;
      const m = S.addMovement({
        type: 'gasto', date, items, restock: items.length > 0, total, method, contactId: $('#prov').value, category,
        concept: $('#gCon').value.trim() || category, payments: status === 'pagado' ? [{ date, amount: total, method }] : [],
      });
      toast(items.length ? 'Gasto guardado y stock actualizado' : 'Gasto guardado');
      location.hash = '#/mov/' + m.id;
    };
  };

  // ---------- Inventario ----------
  views.inventario = () => {
    const ps = S.data.products;
    const cats = [...new Set(ps.map(p => p.category).filter(Boolean))];
    const q = state.invSearch.toLowerCase();
    let list = ps.filter(p => !q || [p.name, p.category, p.notes].join(' ').toLowerCase().includes(q));
    if (state.invFilter === 'bajo') list = list.filter(p => p.stock <= (p.minStock || 0));
    else if (state.invFilter !== 'todos') list = list.filter(p => p.category === state.invFilter);
    const units = ps.reduce((s, p) => s + Math.max(0, p.stock), 0);
    const valCost = ps.reduce((s, p) => s + Math.max(0, p.stock) * (p.cost || 0), 0);
    const valSale = ps.reduce((s, p) => s + Math.max(0, p.stock) * p.price, 0);
    const lowN = ps.filter(p => p.stock <= (p.minStock || 0)).length;
    view.innerHTML = `
      ${topbar('Inventario', `${ps.length} productos`, { action: `<a class="btn btn--sm" href="#/producto/nuevo">${icon('plus', 16, 2)}Producto</a>` })}
      <div class="stats">
        <div class="stat"><span>Unidades</span><b>${units}</b></div>
        <div class="stat"><span>Stock bajo</span><b class="${lowN ? 'amount-out' : ''}">${lowN}</b></div>
        <div class="stat"><span>Valor a costo</span><b>${money(valCost)}</b></div>
        <div class="stat"><span>Valor a la venta</span><b>${money(valSale)}</b><small>Ganancia potencial ${money(valSale - valCost)}</small></div>
      </div>
      <div class="search mt">${icon('search', 18)}<input class="input" id="q" type="search" placeholder="Buscar producto" value="${esc(state.invSearch)}"></div>
      <div class="segmented" id="ifl">${[['todos', 'Todos'], ['bajo', 'Stock bajo'], ...cats.map(c => [c, c])].map(([v, l]) => `<button data-v="${esc(v)}" class="${state.invFilter === v ? 'is-active' : ''}">${esc(l)}</button>`).join('')}</div>
      <div class="list">${list.length ? list.map(p => {
        const margin = p.price ? Math.round((1 - (p.cost || 0) / p.price) * 100) : 0;
        const tag = p.stock <= 0 ? '<span class="tag tag--debt">Agotado</span>' : p.stock <= (p.minStock || 0) ? `<span class="tag tag--warn">Bajo · ${p.stock}</span>` : `<span class="tag tag--ok">${p.stock} u.</span>`;
        return `<a class="item" href="#/producto/${p.id}"><div class="item__icon">${productThumb(p)}</div>
          <div class="item__body"><div class="item__title">${esc(p.name)}</div><div class="item__meta">${esc(p.category || 'Sin categoría')} · Margen ${margin}%${p.inCatalog ? '' : ' · Oculto en catálogo'}</div></div>
          <div class="item__end"><b>${money(p.price)}</b>${tag}</div></a>`;
      }).join('') : `<div class="empty"><b>Sin productos</b>${ps.length ? 'Probá con otra búsqueda.' : 'Agregá tu primer producto.'}</div>`}</div>
      <div class="btn-row mt"><button class="btn btn--soft btn--sm" id="csv">Exportar inventario (CSV)</button></div>`;
    const qi = $('#q'); qi.addEventListener('input', debounce(() => { state.invSearch = qi.value; views.inventario(); const n = $('#q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250));
    $('#ifl').onclick = e => { const b = e.target.closest('[data-v]'); if (b) { state.invFilter = b.dataset.v; views.inventario(); } };
    $('#csv').onclick = () => downloadCSV('inventario', [['Producto', 'Categoría', 'Precio', 'Costo', 'Stock', 'Stock mínimo', 'En catálogo'], ...ps.map(p => [p.name, p.category, p.price, p.cost, p.stock, p.minStock, p.inCatalog ? 'Sí' : 'No'])]);
  };

  const FAMILIES = { acuatico: 'Acuática / fresca', amaderado: 'Amaderada', oriental: 'Oriental / dulce', floral: 'Floral', verde: 'Verde / cítrica', nocturno: 'Nocturna / intensa' };
  views.producto = id => {
    const isNew = id === 'nuevo';
    const p = isNew ? { name: '', category: '', family: 'floral', notes: '', price: '', cost: '', stock: '', minStock: 3, badge: '', image: '', inCatalog: true } : S.product(id);
    if (!p) { location.hash = '#/inventario'; return; }
    const cats = [...new Set(S.data.products.map(x => x.category).filter(Boolean))];
    const sold = isNew ? 0 : S.data.movements.filter(m => m.type === 'venta').reduce((s, m) => s + m.items.filter(i => i.productId === id).reduce((a, i) => a + i.qty, 0), 0);
    view.innerHTML = `
      ${topbar(isNew ? 'Nuevo <em>producto</em>' : esc(p.name), isNew ? 'Inventario' : `${sold} unidades vendidas`, { back: '#/inventario' })}
      <form class="card" id="pf">
        <div class="field" style="justify-items:center">
          <label for="img" style="cursor:pointer;display:grid;justify-items:center;gap:8px;text-transform:none;letter-spacing:0">
            <div id="imgPrev" style="width:140px;height:140px;border-radius:18px;background:var(--hueso-2);display:grid;place-items:center;overflow:hidden">${p.image ? `<img src="${p.image}" alt="" style="width:100%;height:100%;object-fit:cover">` : bottle(p.family, 96)}</div>
            <span class="link">${icon('camera', 16)} ${p.image ? 'Cambiar foto' : 'Agregar foto'}</span>
          </label>
          <input id="img" type="file" accept="image/*" hidden>
          ${p.image ? '<button type="button" class="link" id="rmImg" style="color:var(--borgona)">Quitar foto</button>' : ''}
        </div>
        <div class="field"><label for="pn">Nombre</label><input class="input" id="pn" value="${esc(p.name)}" required placeholder="Ej.: Extracto tipo Sauvage 30 ml"></div>
        <div class="grid-2">
          <div class="field"><label for="pc">Categoría</label><input class="input" id="pc" list="catl" value="${esc(p.category)}" placeholder="Extractos"><datalist id="catl">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
          <div class="field"><label for="pfa">Familia (color)</label><select class="input" id="pfa">${Object.entries(FAMILIES).map(([k, v]) => `<option value="${k}" ${p.family === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="pno">Notas / descripción</label><input class="input" id="pno" value="${esc(p.notes)}" placeholder="Bergamota · Pimienta · Ambroxan"></div>
        <div class="grid-2">
          <div class="field"><label for="pp">Precio de venta</label><input class="input" id="pp" inputmode="decimal" value="${p.price}" required></div>
          <div class="field"><label for="pco">Costo</label><input class="input" id="pco" inputmode="decimal" value="${p.cost}"></div>
        </div>
        <p class="muted" id="mg" style="font-size:.82rem;margin:-6px 0 14px"></p>
        <div class="grid-2">
          <div class="field"><label for="ps">Stock actual</label><input class="input" id="ps" inputmode="decimal" value="${p.stock}"></div>
          <div class="field"><label for="pmi">Avisar si baja de</label><input class="input" id="pmi" inputmode="numeric" value="${p.minStock}"></div>
        </div>
        <div class="field"><label for="pb">Etiqueta en catálogo</label><input class="input" id="pb" value="${esc(p.badge)}" placeholder="Ej.: Nuevo, Más vendido (opcional)"></div>
        <label class="switch"><span><b style="font-size:.9rem">Mostrar en el catálogo</b><br><small class="muted">Visible para tus clientes</small></span><input type="checkbox" id="pic" ${p.inCatalog ? 'checked' : ''}></label>
        <button class="btn btn--block mt" type="submit">${isNew ? 'Crear producto' : 'Guardar cambios'}</button>
        ${isNew ? '' : '<button class="btn btn--danger btn--block mt" type="button" id="pdel">Eliminar producto</button>'}
      </form>`;
    let image = p.image;
    const mg = () => { const pr = num($('#pp').value), co = num($('#pco').value); $('#mg').textContent = pr ? `Ganás ${money(pr - co)} por unidad · margen ${Math.round((1 - co / pr) * 100)}%` : ''; };
    mg(); $('#pp').oninput = $('#pco').oninput = mg;
    $('#pfa').onchange = () => { if (!image) $('#imgPrev').innerHTML = bottle($('#pfa').value, 96); };
    $('#img').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      image = await resizeImage(f, 640, .78);
      $('#imgPrev').innerHTML = `<img src="${image}" alt="" style="width:100%;height:100%;object-fit:cover">`;
    };
    $('#rmImg')?.addEventListener('click', () => { image = ''; $('#imgPrev').innerHTML = bottle($('#pfa').value, 96); });
    $('#pf').onsubmit = e => {
      e.preventDefault();
      const data = {
        name: $('#pn').value.trim(), category: $('#pc').value.trim(), family: $('#pfa').value, notes: $('#pno').value.trim(),
        price: S.round(num($('#pp').value)), cost: S.round(num($('#pco').value)), stock: num($('#ps').value), minStock: num($('#pmi').value),
        badge: $('#pb').value.trim(), image, inCatalog: $('#pic').checked,
      };
      if (!data.name) return toast('Poné un nombre');
      if (!isNew) data.id = id;
      if (S.upsertProduct(data)) { toast(isNew ? 'Producto creado' : 'Cambios guardados'); location.hash = '#/inventario'; }
    };
    $('#pdel')?.addEventListener('click', () => {
      if (!confirmAsk(`¿Eliminar “${p.name}”? Las ventas pasadas se conservan.`)) return;
      S.deleteProduct(id); toast('Producto eliminado'); location.hash = '#/inventario';
    });
  };
  function resizeImage(file, max, quality) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = rej; img.src = url;
    });
  }

  // ---------- Deudas ----------
  views.deudas = () => {
    const tab = state.debtTab;
    const type = tab === 'cobrar' ? 'venta' : 'gasto';
    const open = S.data.movements.filter(m => m.type === type && S.balanceOf(m) > 0).sort(sortDesc);
    const groups = {};
    open.forEach(m => (groups[m.contactId || '_'] ||= []).push(m));
    const total = open.reduce((s, m) => s + S.balanceOf(m), 0);
    const other = S.data.movements.filter(m => m.type !== type && S.balanceOf(m) > 0).reduce((s, m) => s + S.balanceOf(m), 0);
    view.innerHTML = `
      ${topbar('Deudas', 'Fiados y cuentas pendientes')}
      <div class="segmented" data-seg="debtTab"><button data-v="cobrar" class="${tab === 'cobrar' ? 'is-active' : ''}">Me deben</button><button data-v="pagar" class="${tab === 'pagar' ? 'is-active' : ''}">Debo</button></div>
      <section class="hero-balance" style="${tab === 'pagar' ? 'background:linear-gradient(135deg,#141B2B,#4A1E33 60%,#6B2333 120%)' : ''}">
        <div class="label">${tab === 'cobrar' ? 'Total por cobrar' : 'Total por pagar'}</div>
        <div class="big">${money(total)}</div>
        <div class="row"><div class="pill"><span>${tab === 'cobrar' ? 'Clientes' : 'Proveedores'}</span><b>${Object.keys(groups).length}</b></div><div class="pill"><span>${tab === 'cobrar' ? 'Vos debés' : 'Te deben'}</span><b>${money(other)}</b></div></div>
      </section>
      ${Object.keys(groups).length ? Object.entries(groups).map(([cid, ms]) => {
        const c = S.contact(cid); const due = ms.reduce((s, m) => s + S.balanceOf(m), 0);
        const remind = tab === 'cobrar' && c?.phone ? `<a class="btn btn--sm btn--soft" target="_blank" rel="noopener" href="${waLink(c.phone, `Hola ${c.name.split(' ')[0]}, te escribo de ${S.settings.businessName}. Te recuerdo que tenés un saldo pendiente de ${money(due)}. ¡Muchas gracias!`)}">${icon('wa', 16)}Recordar</a>` : '';
        return `<div class="day-head" style="align-items:center"><span>${esc(c?.name || 'Sin contacto')} · ${money(due)}</span>${remind}</div><div class="list">${ms.map(movRow).join('')}</div>`;
      }).join('') : `<div class="list mt"><div class="empty"><b>¡Todo al día!</b>${tab === 'cobrar' ? 'Nadie te debe plata.' : 'No tenés cuentas por pagar.'}</div></div>`}`;
    bindSeg(view, () => views.deudas());
  };

  // ---------- Contactos ----------
  views.contactos = () => {
    const t = state.contactTab;
    const list = S.data.contacts.filter(c => c.type === t);
    const balance = c => S.data.movements.filter(m => m.contactId === c.id).reduce((s, m) => s + S.balanceOf(m), 0);
    view.innerHTML = `
      ${topbar('Contactos', 'Clientes y proveedores', { action: `<button class="btn btn--sm" id="nc">${icon('plus', 16, 2)}Nuevo</button>` })}
      <div class="segmented" data-seg="contactTab"><button data-v="cliente" class="${t === 'cliente' ? 'is-active' : ''}">Clientes</button><button data-v="proveedor" class="${t === 'proveedor' ? 'is-active' : ''}">Proveedores</button></div>
      <div class="list">${list.length ? list.map(c => {
        const b = balance(c);
        return `<a class="item" href="#/contacto/${c.id}"><div class="item__icon">${esc(initials(c.name))}</div><div class="item__body"><div class="item__title">${esc(c.name)}</div><div class="item__meta">${esc(c.phone || 'Sin teléfono')}</div></div><div class="item__end">${b > 0 ? `<span class="tag tag--debt">${t === 'cliente' ? 'Debe' : 'Le debés'} ${money(b)}</span>` : '<span class="tag tag--ok">Al día</span>'}</div></a>`;
      }).join('') : `<div class="empty"><b>Sin ${t === 'cliente' ? 'clientes' : 'proveedores'}</b>Agregalos para fiar, enviar recibos y recordatorios.</div>`}</div>`;
    bindSeg(view, () => views.contactos());
    $('#nc').onclick = () => contactSheet({ type: t });
  };
  function contactSheet(c) {
    openSheet(`
      <h3>${c.id ? 'Editar contacto' : 'Nuevo contacto'}</h3>
      <form id="cf">
        <div class="field"><span class="label-sm">Tipo</span><div class="choice"><input type="radio" name="ct" id="ct-c" value="cliente" ${c.type !== 'proveedor' ? 'checked' : ''}><label for="ct-c">Cliente</label><input type="radio" name="ct" id="ct-p" value="proveedor" ${c.type === 'proveedor' ? 'checked' : ''}><label for="ct-p">Proveedor</label></div></div>
        <div class="field"><label for="cn">Nombre</label><input class="input" id="cn" value="${esc(c.name)}" required></div>
        <div class="field"><label for="cp">WhatsApp</label><input class="input" id="cp" inputmode="tel" value="${esc(c.phone)}" placeholder="Con código de país, ej.: 5491155551111"></div>
        <div class="field"><label for="cno">Notas</label><textarea class="input" id="cno">${esc(c.notes)}</textarea></div>
        <button class="btn btn--block" type="submit">Guardar</button>
      </form>`, root => {
      $('#cf', root).onsubmit = e => {
        e.preventDefault();
        const name = $('#cn', root).value.trim(); if (!name) return;
        const saved = S.upsertContact({ ...(c.id ? { id: c.id } : {}), name, phone: $('#cp', root).value.trim(), notes: $('#cno', root).value.trim(), type: $('input[name=ct]:checked', root).value });
        closeSheet(); toast('Contacto guardado');
        state.contactTab = saved.type || state.contactTab;
        c.id ? views.contacto(c.id) : views.contactos();
      };
    });
  }
  views.contacto = id => {
    const c = S.contact(id);
    if (!c) { location.hash = '#/contactos'; return; }
    const ms = S.data.movements.filter(m => m.contactId === id).sort(sortDesc);
    const total = ms.reduce((s, m) => s + m.total, 0), due = ms.reduce((s, m) => s + S.balanceOf(m), 0);
    view.innerHTML = `
      ${topbar(esc(c.name), c.type === 'cliente' ? 'Cliente' : 'Proveedor', { back: '#/contactos', action: `<button class="icon-btn" id="ed" aria-label="Editar">${icon('edit')}</button>` })}
      <div class="stats">
        <div class="stat"><span>${c.type === 'cliente' ? 'Compras' : 'Compras a él'}</span><b>${money(total)}</b><small>${ms.length} movimientos</small></div>
        <div class="stat"><span>Saldo pendiente</span><b class="${due > 0 ? 'amount-out' : ''}">${money(due)}</b></div>
      </div>
      ${c.notes ? `<p class="card mt muted">${esc(c.notes)}</p>` : ''}
      <div class="btn-row mt">
        ${c.phone ? `<a class="btn" target="_blank" rel="noopener" href="${waLink(c.phone, `Hola ${c.name.split(' ')[0]}!`)}">${icon('wa', 18)}WhatsApp</a>` : ''}
        ${due > 0 && c.phone && c.type === 'cliente' ? `<a class="btn btn--soft" target="_blank" rel="noopener" href="${waLink(c.phone, `Hola ${c.name.split(' ')[0]}, te escribo de ${S.settings.businessName}. Te recuerdo que tenés un saldo pendiente de ${money(due)}. ¡Muchas gracias!`)}">Recordar deuda</a>` : ''}
      </div>
      <div class="section-title"><h2>Historial</h2></div>
      <div class="list">${ms.length ? ms.map(movRow).join('') : '<div class="empty">Sin movimientos todavía.</div>'}</div>
      <button class="btn btn--danger btn--block mt-l" id="cdel">Eliminar contacto</button>`;
    $('#ed').onclick = () => contactSheet(c);
    $('#cdel').onclick = () => {
      if (due > 0 && !confirmAsk('Este contacto tiene saldo pendiente. ¿Eliminar igual? Los movimientos quedan sin contacto.')) return;
      if (due <= 0 && !confirmAsk(`¿Eliminar a ${c.name}?`)) return;
      S.deleteContact(id); toast('Contacto eliminado'); location.hash = '#/contactos';
    };
  };

  // ---------- Reportes ----------
  views.reportes = () => {
    const r = range(state.period);
    const movs = S.data.movements.filter(m => inRange(m, r));
    const k = metrics(movs);
    const byProd = {};
    k.ventas.forEach(m => m.items.forEach(i => { const e = byProd[i.name] ||= { units: 0, total: 0, profit: 0 }; e.units += i.qty; e.total += i.qty * i.price; e.profit += i.qty * (i.price - (i.cost || 0)); }));
    const top = Object.entries(byProd).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
    const byMethod = {}; k.ventas.forEach(m => byMethod[methodLabel(m.method)] = (byMethod[methodLabel(m.method)] || 0) + m.total);
    const byCat = {}; k.gastos.forEach(m => byCat[m.category] = (byCat[m.category] || 0) + m.total);
    const byClient = {}; k.ventas.filter(m => m.contactId).forEach(m => { const n = S.contact(m.contactId)?.name || '—'; byClient[n] = (byClient[n] || 0) + m.total; });
    const hbars = (obj, color) => {
      const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]); const max = Math.max(1, ...rows.map(r => r[1]));
      return rows.length ? `<div class="hbar">${rows.map(([l, v]) => `<div class="hbar__row"><span>${esc(l)}</span><b>${money(v)}</b><div class="hbar__track"><div class="hbar__fill" style="width:${(v / max) * 100}%;${color ? `background:${color}` : ''}"></div></div></div>`).join('')}</div>` : '<p class="muted">Sin datos en este periodo.</p>';
    };
    view.innerHTML = `
      ${topbar('Reportes', 'Cómo va tu negocio')}
      ${periodBar(state.period)}
      <div class="stats">
        <div class="stat"><span>Ventas</span><b>${money(k.totalV)}</b><small>${k.ventas.length} ventas</small></div>
        <div class="stat"><span>Gastos</span><b>${money(k.totalG)}</b><small>${k.gastos.length} gastos</small></div>
        <div class="stat"><span>Balance</span><b class="${k.balance < 0 ? 'amount-out' : 'amount-in'}">${money(k.balance)}</b><small>Ventas − gastos</small></div>
        <div class="stat"><span>Ganancia bruta</span><b>${money(k.bruta)}</b><small>Margen ${k.totalV ? Math.round(k.bruta / k.totalV * 100) : 0}%</small></div>
      </div>
      <div class="section-title"><h2>Productos más vendidos</h2></div>
      <div class="card">${top.length ? `<div class="hbar">${top.map(([n, e]) => `<div class="hbar__row"><span>${esc(n)}</span><b>${money(e.total)}</b><div class="hbar__track"><div class="hbar__fill" style="width:${(e.total / top[0][1].total) * 100}%"></div></div><small class="muted" style="grid-column:1/-1">${e.units} u. · ganancia ${money(e.profit)}</small></div>`).join('')}</div>` : '<p class="muted">Sin ventas de productos en este periodo.</p>'}</div>
      <div class="section-title"><h2>Ventas por medio de pago</h2></div>
      <div class="card">${hbars(byMethod)}</div>
      <div class="section-title"><h2>Mejores clientes</h2></div>
      <div class="card">${hbars(byClient)}</div>
      <div class="section-title"><h2>Gastos por categoría</h2></div>
      <div class="card">${hbars(byCat, 'var(--serie-gastos)')}</div>
      <div class="section-title"><h2>Descargar</h2></div>
      <div class="btn-row"><button class="btn btn--soft btn--sm" id="xv">Ventas (CSV)</button><button class="btn btn--soft btn--sm" id="xg">Gastos (CSV)</button></div>
      <p class="muted mt" style="font-size:.8rem">Los archivos CSV se abren en Excel o Google Sheets.</p>`;
    bindSeg(view, () => views.reportes());
    $('#xv').onclick = () => downloadCSV('ventas', [['N.º', 'Fecha', 'Cliente', 'Productos', 'Medio de pago', 'Total', 'Pagado', 'Saldo'], ...k.ventas.sort(sortDesc).map(m => [m.number, m.date, S.contact(m.contactId)?.name || '', m.items.map(i => `${i.qty}x ${i.name}`).join(' | ') || m.concept, methodLabel(m.method), m.total, S.paidOf(m), S.balanceOf(m)])]);
    $('#xg').onclick = () => downloadCSV('gastos', [['Fecha', 'Categoría', 'Concepto', 'Proveedor', 'Medio de pago', 'Total', 'Pagado', 'Saldo'], ...k.gastos.sort(sortDesc).map(m => [m.date, m.category, m.concept, S.contact(m.contactId)?.name || '', methodLabel(m.method), m.total, S.paidOf(m), S.balanceOf(m)])]);
  };
  function downloadCSV(name, rows) {
    const csv = '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    download(`${name}-${S.today()}.csv`, csv, 'text/csv;charset=utf-8');
  }
  function download(filename, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type })); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- Más (móvil) ----------
  views.mas = () => {
    view.innerHTML = `${topbar('Más', S.settings.businessName)}
      <div class="list">
        ${[['deudas', 'debt', 'Deudas', 'Fiados y cuentas por pagar'], ['contactos', 'users', 'Contactos', 'Clientes y proveedores'], ['reportes', 'chart', 'Reportes', 'Más vendidos, medios de pago, CSV'], ['gasto', 'down', 'Nuevo gasto', 'Registrar una salida de dinero'], ['ajustes', 'gear', 'Ajustes', 'Datos del negocio, respaldo, PIN']]
          .map(([r, ic, t, d]) => `<a class="item" href="#/${r}"><div class="item__icon">${icon(ic)}</div><div class="item__body"><div class="item__title">${t}</div><div class="item__meta">${d}</div></div></a>`).join('')}
        <a class="item" href="catalogo.html" target="_blank" rel="noopener"><div class="item__icon">${icon('store')}</div><div class="item__body"><div class="item__title">Ver catálogo</div><div class="item__meta">Tu tienda para compartir con clientes</div></div></a>
      </div>`;
  };

  // ---------- Ajustes ----------
  const CURRENCIES = { USD: 'Dólar (USD)', ARS: 'Peso argentino (ARS)', COP: 'Peso colombiano (COP)', MXN: 'Peso mexicano (MXN)', PEN: 'Sol (PEN)', CLP: 'Peso chileno (CLP)', PYG: 'Guaraní (PYG)', UYU: 'Peso uruguayo (UYU)', BOB: 'Boliviano (BOB)', VES: 'Bolívar (VES)', EUR: 'Euro (EUR)' };
  views.ajustes = () => {
    const st = S.settings;
    const catalogURL = new URL('catalogo.html', location.href).href;
    view.innerHTML = `
      ${topbar('Ajustes', 'Tu negocio')}
      <form class="card" id="sf">
        <div class="field"><label for="bn">Nombre del negocio</label><input class="input" id="bn" value="${esc(st.businessName)}" required></div>
        <div class="field"><label for="bt">Frase del catálogo</label><input class="input" id="bt" value="${esc(st.tagline)}"></div>
        <div class="field"><label for="bw">WhatsApp para pedidos</label><input class="input" id="bw" inputmode="tel" value="${esc(st.whatsapp)}" placeholder="Con código de país, ej.: 5491155551111"></div>
        <div class="field"><label for="bc">Moneda</label><select class="input" id="bc">${Object.entries(CURRENCIES).map(([k, v]) => `<option value="${k}" ${st.currency === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="field"><label for="br">Mensaje en recibos</label><input class="input" id="br" value="${esc(st.receiptNote)}"></div>
        <div class="field"><label for="bp">PIN de acceso (opcional)</label><input class="input" id="bp" inputmode="numeric" maxlength="6" value="${esc(st.pin)}" placeholder="4 a 6 números"><small class="muted">Pide el PIN al abrir el panel en este dispositivo.</small></div>
        <button class="btn btn--block" type="submit">Guardar</button>
      </form>

      <div class="section-title"><h2>Catálogo</h2></div>
      <div class="card">
        <p class="muted" style="font-size:.88rem;margin-bottom:12px">Tus clientes eligen productos y te mandan el pedido por WhatsApp. Se muestran los productos marcados como visibles.</p>
        <div class="btn-row"><a class="btn btn--sm" href="catalogo.html" target="_blank" rel="noopener">${icon('store', 16)}Abrir catálogo</a><button class="btn btn--sm btn--soft" id="cpy">Copiar enlace</button></div>
        <button class="btn btn--sm btn--ghost mt" id="pub">Generar archivo del catálogo</button>
        <p class="muted" style="font-size:.78rem;margin-top:8px">Guardá ese archivo como <b>catalogo.json</b> junto a la web publicada para que tus clientes vean tus productos y precios actualizados desde cualquier celular.</p>
      </div>

      <div class="section-title"><h2>Respaldo</h2></div>
      <div class="card">
        <p class="muted" style="font-size:.88rem;margin-bottom:12px">Tus datos se guardan en este dispositivo. Descargá un respaldo seguido y usalo para pasar la información a otro equipo.</p>
        <div class="btn-row"><button class="btn btn--sm" id="exp">Descargar respaldo</button><label class="btn btn--sm btn--soft" for="imp" style="cursor:pointer">Restaurar respaldo</label><input type="file" id="imp" accept="application/json,.json" hidden></div>
      </div>

      <div class="section-title"><h2>Zona de cuidado</h2></div>
      <div class="btn-row"><button class="btn btn--sm btn--soft" id="seed">Cargar datos de ejemplo</button><button class="btn btn--sm btn--danger" id="wipe">Borrar todos los datos</button></div>`;
    $('#sf').onsubmit = e => {
      e.preventDefault();
      const pin = $('#bp').value.trim();
      if (pin && !/^\d{4,6}$/.test(pin)) return toast('El PIN debe tener de 4 a 6 números');
      Object.assign(st, { businessName: $('#bn').value.trim() || st.businessName, tagline: $('#bt').value.trim(), whatsapp: $('#bw').value.replace(/\D/g, ''), currency: $('#bc').value, receiptNote: $('#br').value.trim(), pin });
      S.save(); if (pin) sessionStorage.setItem('unlocked', '1');
      toast('Ajustes guardados'); render();
    };
    $('#cpy').onclick = () => navigator.clipboard?.writeText(catalogURL).then(() => toast('Enlace copiado'), () => prompt('Copiá el enlace:', catalogURL));
    $('#pub').onclick = () => {
      const pub = { settings: { businessName: st.businessName, tagline: st.tagline, whatsapp: st.whatsapp, currency: st.currency, locale: st.locale },
        products: S.data.products.filter(p => p.inCatalog).map(({ id, name, category, family, notes, price, stock, badge, image }) => ({ id, name, category, family, notes, price, inStock: stock > 0, badge, image })), updatedAt: new Date().toISOString() };
      download('catalogo.json', JSON.stringify(pub), 'application/json');
    };
    $('#exp').onclick = () => download(`respaldo-${S.today()}.json`, S.exportJSON(), 'application/json');
    $('#imp').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      if (!confirmAsk('Esto reemplaza todos los datos actuales por los del respaldo. ¿Continuar?')) return;
      try { S.importJSON(await f.text()); toast('Respaldo restaurado'); render(); } catch { toast('El archivo no es un respaldo válido'); }
    };
    $('#seed').onclick = () => { if (confirmAsk('Se reemplazan tus datos por datos de ejemplo. ¿Continuar?')) { S.reseed(); toast('Datos de ejemplo cargados'); location.hash = '#/inicio'; } };
    $('#wipe').onclick = () => { if (confirmAsk('¿Borrar TODOS los datos? Esto no se puede deshacer. Descargá un respaldo antes.')) { S.wipe(); toast('Datos borrados'); location.hash = '#/inicio'; } };
  };

  // ---------- Router ----------
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function render() {
    const [route = 'inicio', arg] = location.hash.replace(/^#\/?/, '').split('/');
    const fn = views[route] || views.inicio;
    renderNav(route);
    if (!sheet.hidden) closeSheet();
    fn(arg);
    document.title = `${S.settings.businessName} — Gestión`;
  }
  window.addEventListener('hashchange', () => { render(); scrollTo(0, 0); });
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const c = $('#chart'); if (c) drawChart(c, state.period); }, 200); });

  // ---------- Bloqueo con PIN ----------
  function lockScreen() {
    const el = document.createElement('div');
    el.className = 'lock';
    el.innerHTML = `<form>${icon('lock', 34, 1.4)}<h2>${esc(S.settings.businessName)}</h2><p style="opacity:.75">Ingresá tu PIN</p><input class="input" type="password" inputmode="numeric" maxlength="6" autocomplete="off" aria-label="PIN" autofocus><p id="lm" style="min-height:1.4em;color:var(--lavanda-2)"></p><button class="btn" style="background:var(--hueso);color:var(--noche)">Entrar</button></form>`;
    document.body.appendChild(el);
    $('form', el).onsubmit = e => {
      e.preventDefault();
      if ($('input', el).value === S.settings.pin) { sessionStorage.setItem('unlocked', '1'); el.remove(); }
      else { $('#lm', el).textContent = 'PIN incorrecto'; $('input', el).value = ''; }
    };
  }

  render();
  if (S.settings.pin && !sessionStorage.getItem('unlocked')) lockScreen();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
