// =========================================================
// Datos de la tienda: Todooriginalshop.
// Lo usan el panel (para crear el inventario la primera vez) y el
// catálogo (para que cualquier cliente vea los productos aunque el
// panel todavía no esté conectado a la nube).
// =========================================================
const TIENDA = {
  settings: {
    businessName: 'Todooriginalshop',
    tagline: 'Perfumes originales y decants de 5 ml.',
    whatsapp: '',
    currency: 'USD',
    locale: 'es-AR',
  },
  // [nombre, marca, archivo de foto, precio, decant 5 ml, agotado]
  rows: [
    ['Afnan 9AM Dive', 'Afnan', 'afnan-9am-dive', 34, '7.000'],
    ['Afnan 9AM For Men', 'Afnan', 'afnan-9am-for-men', 33, '7.000'],
    ['Afnan 9AM Pour Femme', 'Afnan', 'afnan-9am-pour-femme', 35, '7.000'],
    ['Afnan 9PM EDP', 'Afnan', 'afnan-9pm-edp', 32, '7.000'],
    ['Afnan 9PM Elixir', 'Afnan', 'afnan-9pm-elixir', 40, '7.000'],
    ['Afnan 9PM Night Out', 'Afnan', 'afnan-9pm-night-out', 48, '8.500'],
    ['Afnan 9PM Pour Femme', 'Afnan', 'afnan-9pm-pour-femme', 33, '7.000'],
    ['Afnan 9PM Rebel', 'Afnan', 'afnan-9pm-rebel', 47, '8.500'],
    ['Afnan Historic Olmeda', 'Afnan', 'afnan-historic-olmeda', 33, '7.000'],
    ['Afnan Supremacy Collector\'s Edition', 'Afnan', 'afnan-supremacy-collectors', 62, '8.500'],
    ['Afnan Turathi Blue', 'Afnan', 'afnan-turathi-blue', 0, '7.000', 1],
    ['Afnan Turathi Electric', 'Afnan', 'afnan-turathi-electric', 37, '7.000'],
    ['Afnan Turathi Femme', 'Afnan', 'afnan-turathi-red', 37, '7.000'],
    ['Afnan Supremacy In Heaven', 'Afnan', 'afnan-supremacy-in-heaven', 0, '7.000', 1],
    ['Al Haramain Amber Oud Aqua Dubai', 'Al Haramain', 'ah-amber-oud-aqua-dubai', 48, '8.500'],
    ['Al Haramain Amber Oud Carbon Edition', 'Al Haramain', 'ah-amber-oud-carbon', 49, '8.500'],
    ['Al Haramain Amber Oud Dubai Night', 'Al Haramain', 'ah-amber-oud-dubai-night', 0, '8.500', 1],
    ['Al Haramain Amber Oud Gold Edition', 'Al Haramain', 'ah-amber-oud-gold', 51, '8.500'],
    ['Al Haramain Amber Oud Private Edition', 'Al Haramain', 'ah-amber-oud-private', 0, '8.500', 1],
    ['Al Haramain Amber Oud Ruby Edition', 'Al Haramain', 'ah-amber-oud-ruby', 59, '8.500'],
    ['Al Haramain Amber Oud Ultra Violet', 'Al Haramain', 'ah-amber-oud-ultra-violet', 52, '8.500'],
    ['Al Haramain Conception', 'Al Haramain', 'ah-conception', 0, '8.500', 1],
    ['Al Haramain Leif EDP', 'Al Haramain', 'ah-leif', 0, '8.500', 1],
    ['Al Haramain Olaf', 'Al Haramain', 'ah-olaf', 0, '7.000', 1],
    ['Al Haramain Oud Nomad EDP', 'Al Haramain', 'ah-oud-nomad', 0, '8.500', 1],
    ['Al Wataniah Ameerati', 'Al Wataniah', 'aw-ameerati', 26, '7.000'],
    ['Al Wataniah Sabah Al Ward (violeta)', 'Al Wataniah', 'aw-sabah-al-ward-violeta', 26, '7.000'],
    ['Al Wataniah Sabah Al Ward', 'Al Wataniah', 'aw-sabah-al-ward', 26, '7.000'],
    ['Al Wataniah Sabah Al Ward (rosa)', 'Al Wataniah', 'aw-sabah-al-ward-rosa', 26, '7.000'],
    ['Al Wataniah Sabah Al Ward Valentine', 'Al Wataniah', 'aw-sabah-al-ward-valentine', 29, '7.000'],
    ['Armaf Bon Bon', 'Armaf', 'armaf-bon-bon', 46, '8.500'],
    ['Armaf Club de Nuit Bling', 'Armaf', 'armaf-cdn-bling', 43, '9.000'],
    ['Armaf Club de Nuit Iconic', 'Armaf', 'armaf-cdn-iconic', 38, '8.500'],
    ['Armaf Club de Nuit Intenso Fuego', 'Armaf', 'armaf-cdn-intenso-fuego', 0, '10.000', 1],
  ],
  products() {
    return this.rows.map(([name, category, img, price, decant, out], i) => ({
      id: 'p' + String(i + 1).padStart(2, '0'), name, category,
      notes: `Decant 5 ml $${decant}`, price, inStock: !out, image: `img/productos/${img}.jpg`,
    }));
  },
};
