// =========================================================
// Capa de datos. Hoy guarda todo en el navegador (localStorage).
// Toda la app lee y escribe SOLO a través de este módulo, así
// que pasar a una base en la nube (Supabase/Firebase) significa
// reemplazar load()/save() sin tocar las pantallas.
// =========================================================
const Store = (() => {
  const KEY = 'gestion-perfumes-v1';

  const empty = () => ({
    settings: {
      businessName: 'Mi Perfumería',
      tagline: 'Fragancias que fluyen con vos.',
      whatsapp: '',
      currency: 'USD',
      locale: 'es-AR',
      receiptNote: '¡Gracias por tu compra!',
      pin: '',
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
      alert('No hay espacio para guardar. Probá con fotos más livianas o exportá un respaldo.');
      return false;
    }
  }

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const localISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => localISO(new Date());

  // ---------- Datos de ejemplo ----------
  function seed() {
    db = empty();
    db.settings.businessName = 'Esencia Proveedor';
    const P = (name, category, family, notes, price, cost, stock, min = 3, badge = '') =>
      ({ id: uid(), name, category, family, notes, price, cost, stock, minStock: min, badge, image: '', inCatalog: true, createdAt: today() });
    db.products = [
      P('Extracto tipo Sauvage 30 ml', 'Extractos', 'acuatico', 'Bergamota · Pimienta · Ambroxan', 12, 5, 24, 5, 'Más vendido'),
      P('Extracto tipo Good Girl 30 ml', 'Extractos', 'oriental', 'Almendra · Tuberosa · Cacao', 12, 5, 18, 5),
      P('Extracto tipo Light Blue 30 ml', 'Extractos', 'acuatico', 'Limón · Manzana · Cedro', 12, 5, 2, 5),
      P('Extracto tipo La Vie Est Belle', 'Extractos', 'floral', 'Iris · Praliné · Pachulí', 12, 5, 15, 5, 'Nuevo'),
      P('Original árabe Lattafa 100 ml', 'Originales', 'oriental', 'Oud · Vainilla · Ámbar', 35, 22, 6, 2),
      P('Original árabe Afnan 9pm', 'Originales', 'nocturno', 'Manzana · Canela · Lavanda', 38, 24, 4, 2),
      P('Body splash Vainilla 250 ml', 'Body splash', 'floral', 'Vainilla · Coco · Almizcle', 8, 3, 30, 6),
      P('Body splash Té verde', 'Body splash', 'verde', 'Té verde · Menta · Limón', 8, 3, 1, 6),
      P('Frasco atomizador 10 ml', 'Insumos', 'amaderado', 'Vidrio · Recargable', 2, 0.6, 120, 20),
    ];
    const C = (name, phone, type = 'cliente') => ({ id: uid(), name, phone, type, notes: '', createdAt: today() });
    db.contacts = [
      C('Lucía Méndez', '5491155551111'), C('Tomás Ríos', '5491155552222'), C('Camila Sosa', '5491155553333'),
      C('Distribuidora Aromas', '5491155554444', 'proveedor'), C('Envases del Sur', '5491155555555', 'proveedor'),
    ];
    const [lu, to, ca, dist, env] = db.contacts;
    const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return localISO(x); };
    const pr = db.products;
    const sale = (days, lines, method, contact, paid = true, abonos = []) => {
      const items = lines.map(([p, q]) => ({ productId: p.id, name: p.name, qty: q, price: p.price, cost: p.cost }));
      const total = items.reduce((s, i) => s + i.qty * i.price, 0);
      db.movements.push({ id: uid(), type: 'venta', date: d(days), items, total, method, contactId: contact?.id || '', concept: '', category: 'Ventas', paid: paid ? total : abonos.reduce((s, a) => s + a.amount, 0), payments: paid ? [{ date: d(days), amount: total, method }] : abonos, number: db.settings.nextReceipt++, createdAt: d(days) });
    };
    const exp = (days, amount, category, concept, contact, paid = true) =>
      db.movements.push({ id: uid(), type: 'gasto', date: d(days), items: [], total: amount, method: 'transferencia', contactId: contact?.id || '', concept, category, paid: paid ? amount : 0, payments: paid ? [{ date: d(days), amount, method: 'transferencia' }] : [], number: 0, createdAt: d(days) });

    sale(0, [[pr[0], 2], [pr[8], 2]], 'efectivo', lu);
    sale(0, [[pr[4], 1]], 'transferencia', to);
    sale(1, [[pr[1], 3]], 'transferencia', ca, false, [{ date: d(1), amount: 15, method: 'efectivo' }]);
    sale(2, [[pr[6], 4], [pr[3], 1]], 'tarjeta', null);
    sale(3, [[pr[5], 1], [pr[0], 1]], 'efectivo', lu);
    sale(4, [[pr[2], 2]], 'transferencia', to, false);
    sale(5, [[pr[0], 3], [pr[7], 2]], 'efectivo', null);
    sale(6, [[pr[4], 2]], 'transferencia', ca);
    sale(9, [[pr[3], 2], [pr[6], 2]], 'efectivo', null);
    sale(14, [[pr[0], 4]], 'transferencia', lu);
    exp(1, 120, 'Mercadería', 'Compra de esencias', dist, false);
    exp(2, 18, 'Envíos', 'Envíos de la semana', null);
    exp(4, 45, 'Insumos', 'Frascos y atomizadores', env);
    exp(6, 25, 'Publicidad', 'Anuncios en Instagram', null);
    exp(12, 60, 'Servicios', 'Internet y teléfono', null);
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
