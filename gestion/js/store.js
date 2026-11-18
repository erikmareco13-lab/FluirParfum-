// =========================================================
// Capa de datos. Hoy guarda todo en el navegador (localStorage).
// Toda la app lee y escribe SOLO a través de este módulo, así
// que pasar a una base en la nube (Supabase/Firebase) significa
// reemplazar load()/save() sin tocar las pantallas.
// =========================================================
const Store = (() => {
  const KEY = 'gestion-perfumes-v2';

  const empty = () => ({
    settings: {
      businessName: 'Mi Perfumería',
      tagline: 'Fragancias que fluyen con vos.',
      whatsapp: '',
      currency: 'USD',
      locale: 'es-AR',
      receiptNote: '¡Gracias por tu compra!',
      pin: '',
      theme: 'auto',
      nextReceipt: 1,
    },
    products: [],
    contacts: [],
    movements: [],
  });

  let db = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const base = empty();
        return { ...base, ...data, settings: { ...base.settings, ...data.settings } };
      }
    } catch (e) { console.warn('No se pudieron leer los datos', e); }
    return null;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) {
      window.dispatchEvent(new Event('store-full'));
      return false;
    }
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const localISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => localISO(new Date());

  // ---------- Datos iniciales: catálogo de Todooriginalshop ----------
  // Productos tomados del catálogo actual del negocio. Las ventas, gastos y
  // contactos son de ejemplo (settings.demo) y se borran desde el panel.

  function seed() {
    db = empty();
    Object.assign(db.settings, TIENDA.settings, { demo: true });
    db.products = TIENDA.products().map(p => ({
      ...p, family: 'oriental', cost: 0, stock: p.inStock ? 4 : 0, minStock: 1,
      badge: '', inCatalog: true, createdAt: today(),
    }));
    const C = (name, phone, type = 'cliente') => ({ id: uid(), name, phone, type, notes: '', createdAt: today() });
    db.contacts = [C('Cliente de ejemplo 1', ''), C('Cliente de ejemplo 2', ''), C('Proveedor de ejemplo', '', 'proveedor')];
    const [c1, c2, prov] = db.contacts;
    const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return localISO(x); };
    const P = id => db.products.find(p => p.id === id);
    const sale = (days, lines, method, contact, paid = true, abonos = []) => {
      const items = lines.map(([id, q]) => { const p = P(id); return { productId: p.id, name: p.name, qty: q, price: p.price, cost: p.cost }; });
      const total = items.reduce((s, i) => s + i.qty * i.price, 0);
      db.movements.push({ id: uid(), type: 'venta', date: d(days), items, total, method, contactId: contact?.id || '', concept: '', category: 'Ventas', payments: paid ? [{ date: d(days), amount: total, method }] : abonos, number: db.settings.nextReceipt++, createdAt: d(days), demo: true });
    };
    const exp = (days, amount, category, concept, contact, paid = true) =>
      db.movements.push({ id: uid(), type: 'gasto', date: d(days), items: [], total: amount, method: 'transferencia', contactId: contact?.id || '', concept, category, payments: paid ? [{ date: d(days), amount, method: 'transferencia' }] : [], number: 0, createdAt: d(days), demo: true });
    sale(0, [['p01', 1]], 'transferencia', c1);
    sale(1, [['p20', 1]], 'efectivo', null);
    sale(2, [['p26', 2]], 'transferencia', c2, false, [{ date: d(2), amount: 20, method: 'efectivo' }]);
    sale(3, [['p05', 1], ['p04', 1]], 'transferencia', c1);
    sale(5, [['p31', 1]], 'qr', null);
    sale(6, [['p15', 1]], 'efectivo', c2);
    exp(2, 150, 'Mercadería', 'Compra de perfumes', prov, false);
    exp(4, 12, 'Envíos', 'Envíos de la semana', null);
    db.movements.forEach(m => { m.paid = m.payments.reduce((s, p) => s + p.amount, 0); });
    save();
  }

  // Borra ventas, gastos y contactos de ejemplo, y deja los productos.
  function clearDemo() {
    db.movements = db.movements.filter(m => !m.demo);
    db.contacts = db.contacts.filter(c => !/de ejemplo/.test(c.name));
    db.settings.demo = false;
    db.settings.nextReceipt = 1 + db.movements.filter(m => m.type === 'venta').reduce((n, m) => Math.max(n, m.number), 0);
    save();
  }

  if (!db) seed();

  // ---------- Consultas ----------
  const paidOf = m => (m.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const balanceOf = m => Math.max(0, round(m.total - paidOf(m)));
  const round = n => Math.round(n * 100) / 100;

  return {
    get data() { return db; },
    get settings() { return db.settings; },
    uid, today, localISO, round, paidOf, balanceOf,
    save,
    reseed() { seed(); },
    clearDemo,
    wipe() { db = empty(); save(); },

    // Productos
    product: id => db.products.find(p => p.id === id),
    upsertProduct(p) {
      const i = db.products.findIndex(x => x.id === p.id);
      if (i >= 0) db.products[i] = { ...db.products[i], ...p };
      else db.products.unshift({ id: uid(), createdAt: today(), inCatalog: true, ...p });
      return save();
    },
    deleteProduct(id) { db.products = db.products.filter(p => p.id !== id); save(); },

    // Contactos
    contact: id => db.contacts.find(c => c.id === id),
    upsertContact(c) {
      const i = db.contacts.findIndex(x => x.id === c.id);
      if (i >= 0) db.contacts[i] = { ...db.contacts[i], ...c };
      else { c = { id: uid(), createdAt: today(), ...c }; db.contacts.unshift(c); }
      save(); return c;
    },
    deleteContact(id) { db.contacts = db.contacts.filter(c => c.id !== id); save(); },

    // Movimientos (ventas y gastos)
    movement: id => db.movements.find(m => m.id === id),
    addMovement(m) {
      m = { id: uid(), createdAt: new Date().toISOString(), payments: [], ...m };
      if (m.type === 'venta') {
        m.number = db.settings.nextReceipt++;
        m.items.forEach(it => { const p = this.product(it.productId); if (p) p.stock = round(p.stock - it.qty); });
      }
      if (m.type === 'gasto' && m.restock) {
        m.items.forEach(it => { const p = this.product(it.productId); if (p) p.stock = round(p.stock + it.qty); });
      }
      m.paid = paidOf(m);
      db.movements.push(m);
      save(); return m;
    },
    deleteMovement(id, restoreStock = true) {
      const m = this.movement(id);
      if (!m) return;
      if (restoreStock && m.type === 'venta') m.items.forEach(it => { const p = this.product(it.productId); if (p) p.stock = round(p.stock + it.qty); });
      if (restoreStock && m.type === 'gasto' && m.restock) m.items.forEach(it => { const p = this.product(it.productId); if (p) p.stock = round(p.stock - it.qty); });
      db.movements = db.movements.filter(x => x.id !== id);
      save();
    },
    addPayment(id, amount, method = 'efectivo', date = today()) {
      const m = this.movement(id);
      if (!m) return;
      m.payments.push({ date, amount: round(Number(amount)), method });
      m.paid = paidOf(m);
      save();
    },

    // Respaldo
    exportJSON: () => JSON.stringify(db, null, 2),
    importJSON(text) {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.products) || !Array.isArray(data.movements)) throw new Error('Archivo inválido');
      const base = empty();
      db = { ...base, ...data, settings: { ...base.settings, ...data.settings } };
      save();
    },
  };
})();
