// FLUIR PARFUM — interacciones
(() => {
  const products = [
    { name: 'Marea Petróleo', family: 'acuatico', label: 'Acuática', notes: 'Sal marina · Bergamota · Ambroxan', price: 89000, badge: 'Más vendido' },
    { name: 'Bruma Lavanda', family: 'floral', label: 'Floral', notes: 'Iris · Lavanda · Almizcle blanco', price: 92000, badge: 'Nuevo' },
    { name: 'Vino de Medianoche', family: 'oriental', label: 'Oriental', notes: 'Ciruela · Pimienta rosa · Oud', price: 105000 },
    { name: 'Grafito', family: 'amaderado', label: 'Amaderada', notes: 'Cedro · Vetiver · Incienso', price: 96000 },
    { name: 'Higuera Oliva', family: 'verde', label: 'Verde', notes: 'Hoja de higo · Té verde · Musgo', price: 88000, badge: 'Edición limitada' },
    { name: 'Azul Noche', family: 'amaderado', label: 'Amaderada', notes: 'Cuero suave · Sándalo · Ámbar gris', price: 99000, tone: 'noche' },
    { name: 'Peonía Perla', family: 'floral', label: 'Floral', notes: 'Peonía · Pera · Cachemira', price: 90000 },
    { name: 'Corriente', family: 'acuatico', label: 'Acuática', notes: 'Pomelo · Menta · Madera flotante', price: 85000 },
  ];

  const fmt = n => '$ ' + n.toLocaleString('es-AR');
  const bottle = () => `
    <div class="bottle">
      <div class="bottle__cap"></div><div class="bottle__neck"></div>
      <div class="bottle__body"><div class="bottle__liquid"></div><div class="bottle__shine"></div></div>
      <span class="bottle__label">FLUIR</span>
    </div>`;

  const grid = document.getElementById('products');
  grid.innerHTML = products.map((p, i) => `
    <article class="card tone-${p.tone || p.family} reveal" data-delay="${i % 4}" data-family="${p.family}">
      <div class="card__media">
        ${p.badge ? `<span class="card__badge">${p.badge}</span>` : ''}
        <button class="card__fav" aria-label="Agregar ${p.name} a favoritos">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/></svg>
        </button>
        ${bottle()}
        <button class="card__quick" data-name="${p.name}">Agregar al carrito</button>
      </div>
      <div class="card__body">
        <span class="card__family">${p.label}</span>
        <h3 class="card__name">${p.name}</h3>
        <p class="card__notes">${p.notes}</p>
        <div class="card__foot"><span class="card__price">${fmt(p.price)}</span><span class="card__ml">Extrait · 100 ml</span></div>
      </div>
    </article>`).join('');

  // Header al hacer scroll
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menú móvil
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('menuToggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false');
  }));

  // Reveal
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Filtros
  document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const f = chip.dataset.filter;
    grid.querySelectorAll('.card').forEach(card => {
      card.classList.toggle('is-hidden', f !== 'all' && card.dataset.family !== f);
    });
  }));

  // Toast
  const toast = document.getElementById('toast');
  let t;
  const showToast = msg => {
    toast.textContent = msg; toast.classList.add('is-visible');
    clearTimeout(t); t = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };

  // Carrito y favoritos
  const count = document.getElementById('cartCount');
  let items = 0;
  grid.addEventListener('click', e => {
    const quick = e.target.closest('.card__quick');
    const fav = e.target.closest('.card__fav');
    if (quick) { count.textContent = ++items; showToast(`${quick.dataset.name} se agregó al carrito`); }
    if (fav) { const on = fav.classList.toggle('is-on'); showToast(on ? 'Guardado en favoritos' : 'Quitado de favoritos'); }
  });

  // Newsletter
  const form = document.getElementById('newsForm');
  const msg = document.getElementById('newsMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.style.color = 'var(--borgona)'; msg.textContent = 'Ingresá un email válido.'; return; }
    msg.style.color = ''; msg.textContent = '¡Bienvenida/o al Club Fluir! Revisá tu bandeja de entrada.';
    form.reset();
  });
})();
