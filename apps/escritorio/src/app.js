const { ipcRenderer } = require('electron');

// ═══════════════════════════════════════════════
//  CONSTANTES
// ═══════════════════════════════════════════════

const APP_PAGES = [
  'home','perfil','perfil-vendedor','tienda','carrito',
  'historial','pedidos','ajustes','mensajes','chat','admin','admin-ajustes'
];

let PRODUCTS = {
  zapatillas: { nombre:'Zapatillas Urban Red',          cat:'Calzado',    vendedor:'Carlos Martínez', precio:'$125.000', old:'$138.890', stock:'5 unidades', pct:'10%', img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',  txt:'Zapatillas de alto rendimiento con amortiguacion avanzada. Ideales para competencias de media distancia.' },
  audifonos:  { nombre:'Auriculares Studio Pro',        cat:'Tecnología', vendedor:'Elena Sanz',    precio:'$299.000', old:'',         stock:'12 unidades', pct:'0%',  img:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',  txt:'Auriculares profesionales con cancelación de ruido activa y sonido 360°.' },
  calzado:    { nombre:'Calzado Heritage High',         cat:'Calzado',    vendedor:'Carlos Martínez', precio:'$95.000',  old:'$126.670', stock:'20 unidades', pct:'25%', img:'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80',  txt:'Calzado casual de alta calidad con suela resistente y diseño urbano.' },
  mochila:    { nombre:'Mochila City Stealth',          cat:'Accesorios', vendedor:'Elena Sanz',    precio:'$79.000',  old:'$83.160',  stock:'30 unidades', pct:'5%',  img:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',  txt:'Mochila urbana de material resistente al agua. Compartimentos organizados.' },
  reloj:      { nombre:'Reloj Elitist Gold',            cat:'Accesorios', vendedor:'Elena Sanz',    precio:'$345.000', old:'',         stock:'Agotado',    pct:'0%',  img:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',  txt:'Reloj de lujo con acabados dorados y mecanismo suizo.' },
  planta:     { font:'Sora', nombre:'Set Botánico Urban', cat:'Hogar',      vendedor:'Carlos Martínez', precio:'$45.000',  old:'$56.250',  stock:'50 unidades', pct:'20%', img:'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&q=80', txt:'Set de plantas decorativas de interior. Incluye 3 variedades.' },
  bolso:      { nombre:'Bolso Boutique',                cat:'Accesorios', vendedor:'Elena Sanz',    precio:'$125.000', old:'$138.880', stock:'18 unidades', pct:'10%', img:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',  txt:'Bolso de cuero genuino con diseño moderno y elegante. Ideal para uso diario.' },
  cuadro:     { nombre:'Cuadro Decorativo',             cat:'Hogar',      vendedor:'Carlos Martínez', precio:'$25.000',  old:'$6.000',   stock:'40 unidades', pct:'25%', img:'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80', txt:'Cuadro decorativo minimalista para sala o habitación. Marco en madera natural.' },
  cuadromin:  { nombre:'Cuadro Decorativo Minimalista', cat:'Hogar',      vendedor:'Carlos Martínez', precio:'$29.000',  old:'',         stock:'25 unidades', pct:'0%',  img:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80', txt:'Cuadro minimalista de líneas limpias, perfect para espacios modernos.' },
  bascula:    { nombre:'Bascula de Oro',                cat:'Hogar',      vendedor:'Elena Sanz',    precio:'$40.000',  old:'$4.000',   stock:'15 unidades', pct:'20%', img:'https://images.unsplash.com/photo-1578898886225-c7c894047899?w=400&q=80',  txt:'Bascula decorativa premium con acabados dorados. Diseño elegante para el hogar.' },
};

// ── CATALOGO API ────────────────────────────────────────────────────
// PRODUCTS es caché local (fallback offline). cargarCatalogoDesdeAPI()
// lo reemplaza con datos reales de api.productos() (LISTADO usa `imagen`).
let PRODUCTOS_API = [];
let CATALOGO_API_OK = false;
function absImg(ref) {
  if (!ref) return '';
  if (/^https?:\/\//i.test(ref) || String(ref).startsWith('data:')) return ref;
  return API_URL + (String(ref).startsWith('/') ? ref : '/' + ref);
}
// Escapa texto/atributos de datos provenientes de la API antes de pintarlos en HTML.
function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// Limita el src de imágenes de la API a orígenes conocidos: http(s), data:image/*
// o ruta relativa que absImg() resuelve contra API_URL. Otro valor (p.ej. data:text/html
// o una cadena manipulada) devuelve '' en vez de inyectarla en el atributo.
function imgSrcSafe(ref) {
  const src = absImg(ref);
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  if (/^data:image\//i.test(src)) return src;
  if (src === API_URL || src.indexOf(API_URL + '/') === 0) return src;
  return '';
}
function mapProductoAPI(p) {
  const precioNum = Number(p.precio) || 0;
  const descPct = Number(p.descuento_porcentaje ?? p.descuento ?? 0) || 0;
  const precioFinal = descPct > 0 ? Math.round(precioNum * (1 - descPct / 100)) : precioNum;
  const stockNum = Number(p.stock ?? 0);
  return {
    _apiId: p.id,
    nombre: p.nombre || 'Producto',
    cat: p.categoria || 'General',
    vendedor: p.vendedor || 'CommerCity Store',
    vendedor_id: p.vendedor_id,
    precio: fmtCOP(precioFinal),
    old: descPct > 0 ? fmtCOP(precioNum) : '',
    stock: stockNum === 0 ? 'Agotado' : (stockNum + ' unidades'),
    pct: descPct > 0 ? (descPct + '%') : '0%',
    img: absImg(p.imagen ?? p.imagen_url),
    txt: p.descripcion || '',
  };
}
async function cargarCatalogoDesdeAPI(opts = {}) {
  const body = await api.productos({ page: 1, limit: 24, ...opts });
  const d = (body && body.data) || {};
  const list = Array.isArray(d.productos) ? d.productos : (Array.isArray(d) ? d : []);
  PRODUCTOS_API = list;
  if (!list.length) return list;
  const mapped = {};
  list.forEach(p => {
    mapped[String(p.id)] = mapProductoAPI(p);
    try { STOCK_PRODUCTOS[String(p.id)] = Number(p.stock ?? 0); } catch (e) {}
  });
  PRODUCTS = mapped;
  CATALOGO_API_OK = true;
  try { renderProductsHome(); } catch (e) {}
  return list;
}

// SESION — JWT real contra la API (sin credenciales hardcodeadas).
// El login/registro guardan { commerCity_token, commerCity_user } en localStorage.
function getSessionUser() {
  try { return JSON.parse(localStorage.getItem('commercity_user') || 'null'); } catch (e) { return null; }
}
function primaryRole(u) {
  if (!u) return null;
  if (u.role) return u.role;
  const roles = u.roles || [];
  if (roles.includes('administrador')) return 'admin';
  if (roles.includes('vendedor')) return 'vendedor';
  return 'comprador';
}
function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : (role === 'vendedor' ? 'Vendedor' : 'Comprador');
}
function displayName(u) {
  return (u && (u.nombre_completo || u.name)) || (currentUser && currentUser.name) || 'Usuario';
}
function saveSession(body) {
  const d = (body && body.data) || {};
  if (d.token) localStorage.setItem('commercity_token', d.token);
  const u = d.user || d.usuario || null;
  if (u) localStorage.setItem('commercity_user', JSON.stringify(u));
  return u;
}
function clearSession() {
  localStorage.removeItem('commercity_token');
  localStorage.removeItem('commercity_user');
}
function applySessionToUI(u) {
  const role = primaryRole(u) || 'comprador';
  const name = displayName(u);
  const label = roleLabel(role);
  currentUser = { role, label, name, username: (u && u.email) || name, id: u && u.id, email: u && u.email, roles: (u && u.roles) || [role] };
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('sb-user-initial', name[0] ? name[0].toUpperCase() : 'U');
  setTxt('sb-user-name', name);
  setTxt('sb-user-role', label);
  ['prof-name-display','prof-name-vendedor'].forEach(id => setTxt(id, name));
  ['prof-initial-comprador','prof-initial-vendedor'].forEach(id => setTxt(id, name[0] ? name[0].toUpperCase() : 'U'));
  const tbAv = document.getElementById('tb-avatar-home');
  if (tbAv) tbAv.textContent = name[0] ? name[0].toUpperCase() : 'U';
  applyRoleSidebar(role);
  return role;
}
function showAuthError(id, msg) {
  const errEl = document.getElementById(id);
  if (errEl) { errEl.textContent = msg || 'Ocurrió un error. Intenta de nuevo.'; errEl.style.display = 'block'; }
}
function hideAuthError(id) {
  const errEl = document.getElementById(id);
  if (errEl) errEl.style.display = 'none';
}

const SEGUIDOS = [
  { name:'Noth',                verified:true,  avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80' },
  { name:'Andrea Valdiri',      verified:false, avatar:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&q=80' },
  { name:'Paris Accesorios',    verified:false, avatar:'' },
  { name:'MARINO Cosme',        verified:false, avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80' },
  { name:'Alex Castillo',       verified:false, avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&q=80' },
  { name:'Asadero KIKE BRASAS', verified:false, avatar:'' },
  { name:'Lucas G.',            verified:false, avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&q=80' },
];

const REPORTES = {
  'mario-alberto': {
    tipo:'Usuario', tipoCls:'badge-orange',
    reportado:'Mario Alberto – Vendedor',
    reportadoPor:'Alexa Perez – Comprador',
    motivo:'El vendedor me trató de forma irrespetuosa y utilizó lenguaje ofensivo durante nuestra conversación.',
    estado:'Pendiente', estadoCls:'badge-orange',
    fecha:'20 Oct, 2026',
    evidencias:[
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=60',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=60',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=60',
    ],
    respuesta: null,
    acciones:'usuario',
  },
  'nike-fi': {
    tipo:'Producto', tipoCls:'badge-blue',
    reportado:'Zapatillas NIKE F1 – Multigangas',
    reportadoPor:'Luis Arango – Vendedor',
    motivo:'Me dijeron que las zapatillas eran originales pero cuando las compre resultaron ser una replica, quiero que se hagan cargo de este producto y lo revisen.',
    estado:'Resuelto', estadoCls:'badge-green',
    fecha:'19 Oct, 2026',
    evidencias:[
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=60',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=60',
    ],
    respuesta:'Hola Luis Arango claro revisaremos el producto y veremos las acciones que vamos a aplicar sobre el producto o el vendedor.',
    acciones:'producto',
  },
};

let currentUser = null;

// ═══════════════════════════════════════════════
//  CARRITO — Estado reactivo
// ═══════════════════════════════════════════════

let cartItems = [
  { id:'zapatillas', nombre:'Zapatos Deportivos', cat:'Calzado',
    precio:79000, precioOld:95000,
    img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
    qty:1 },
  { id:'audifonos', nombre:'Auriculares Studio Pro', cat:'Tecnología',
    precio:598000, precioOld:0,
    img:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
    qty:2 },
];

const IVA_RATE      = 0.19;   // RF47: IVA Colombia
const COMISION_RATE = 0.10;   // RF131: 10% CommerCity, 90% vendedor

function fmtCOP(n) {
  return '$' + Math.round(n).toLocaleString('es-CO');
}

function calcCart() {
  const subtotal   = cartItems.reduce((s, i) => s + i.precio * i.qty, 0);
  const descuento  = cartItems.reduce((s, i) => s + (i.precioOld ? (i.precioOld - i.precio) * i.qty : 0), 0);
  const baseIVA    = subtotal - descuento;
  const iva        = Math.round(baseIVA * IVA_RATE);
  const total      = baseIVA + iva;
  // RF131: distribución
  const comision   = Math.round(total * COMISION_RATE);
  const vendedorNet = total - comision;
  return { subtotal, descuento, iva, total, comision, vendedorNet };
}

// RF131: calcular ganancia vendedor de una venta
function calcVendedorGanancia(precioTotal) {
  const comision    = Math.round(precioTotal * COMISION_RATE);
  const neto        = precioTotal - comision;
  return { comision, neto };
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const emptyMsg  = document.getElementById('cart-empty');
  const summary   = document.getElementById('cart-summary-section');
  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = '';
    if (emptyMsg)  emptyMsg.style.display  = 'block';
    if (summary)   summary.style.display   = 'none';
    return;
  }

  if (emptyMsg) emptyMsg.style.display  = 'none';
  if (summary)  summary.style.display   = 'block';

  container.innerHTML = cartItems.map((item, idx) => `
    <div class="cart-item" id="cart-item-${idx}">
      <div class="cart-img"><img src="${item.img}" alt=""/></div>
      <div class="cart-info">
        <div class="cart-name">${item.nombre}</div>
        <div class="cart-cat">${item.cat}</div>
        <div class="cart-prices">
          ${item.precioOld ? `<div class="cart-old">${fmtCOP(item.precioOld)}</div>` : ''}
          <div class="cart-price">${fmtCOP(item.precio)}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;margin:0 8px">
        <span style="font-size:9px;font-weight:700;color:var(--text2);letter-spacing:.06em;text-transform:uppercase">CANTIDAD</span>
        <div class="cart-qty">
          <button onclick="cartQty(${idx}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="cartQty(${idx}, 1)">+</button>
        </div>
      </div>
      <button class="cart-del" onclick="cartRemove(${idx})" title="Eliminar">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
          <path d="M3 5h14M8 5V3h4v2M6 5l1 12h6l1-12"/>
        </svg>
      </button>
    </div>
  `).join('');

  const { subtotal, descuento, iva, total } = calcCart();
  const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  setTxt('sum-subtotal',  fmtCOP(subtotal));
  setTxt('sum-descuento', '– ' + fmtCOP(descuento));
  setTxt('sum-iva',       fmtCOP(iva));
  setTxt('sum-total',     fmtCOP(total));
}

// ── CARRITO API ─────────────────────────────────────────────────────
// Helpers de identidad contra la API (comprador_id sale de la sesión JWT).
function compradorIdActual() {
  const u = getSessionUser();
  return (u && u.id) ? Number(u.id) : null;
}
function apiIdDe(key) {
  const p = PRODUCTS[key];
  if (p && p._apiId) return Number(p._apiId);
  const n = Number(key);
  return (Number.isInteger(n) && n > 0) ? n : null;
}
async function refrescarCarritoDesdeAPI() {
  const cid = compradorIdActual();
  if (!cid) return;
  const body = await api.listarCarrito(cid);
  const d = (body && body.data) || {};
  const grupos = Array.isArray(d.por_vendedor) ? d.por_vendedor
    : (Array.isArray(d.items) ? [{ items: d.items }] : (Array.isArray(d) ? [{ items: d }] : []));
  const items = [];
  grupos.forEach(g => (g.items || []).forEach(i => {
    const pid = i.producto_id ?? i.id;
    const precioNum = Number(i.precio) || 0;
    const descPct = Number(i.descuento_porcentaje ?? 0) || 0;
    const precioFinal = descPct > 0 ? Math.round(precioNum * (1 - descPct / 100)) : precioNum;
    items.push({
      id: String(pid), _apiId: Number(pid),
      nombre: i.nombre || 'Producto', cat: i.categoria || '',
      precio: precioFinal, precioOld: descPct > 0 ? precioNum : 0,
      img: absImg(i.imagen_url || i.imagen), qty: Number(i.cantidad) || 1,
    });
  }));
  cartItems = items;
  renderCart();
}

async function cartQty(idx, delta) {
  const item = cartItems[idx];
  if (!item) return;
  const targetQty = Math.max(1, item.qty + delta);
  const cid = compradorIdActual();
  const pid = (item._apiId != null) ? Number(item._apiId) : apiIdDe(item.id);
  if (cid && pid) {
    try { await api.modificarCantidad(cid, pid, targetQty); }
    catch (e) {
      showToast('⚠️ ' + ((e && e.message) || 'No se pudo actualizar la cantidad.'));
      if (e && e.status === 401) navigate('login');
      return;
    }
    try { await refrescarCarritoDesdeAPI(); } catch (e) { item.qty = targetQty; renderCart(); }
    return;
  }
  const stock = STOCK_PRODUCTOS[item.id] !== undefined ? STOCK_PRODUCTOS[item.id] : 99;
  const targetLocal = item.qty + delta;
  if (targetLocal > stock) {
    showToast(`⚠️ Solo quedan ${stock} unidades disponibles de este producto.`);
    item.qty = stock;
  } else {
    item.qty = Math.max(1, targetLocal);
  }
  renderCart();
}

async function cartRemove(idx) {
  const item = cartItems[idx];
  const cid = compradorIdActual();
  const pid = item ? ((item._apiId != null) ? Number(item._apiId) : apiIdDe(item.id)) : null;
  if (cid && pid && item) {
    try { await api.eliminarCarrito(cid, pid); }
    catch (e) {
      showToast('⚠️ ' + ((e && e.message) || 'No se pudo eliminar el producto.'));
      if (e && e.status === 401) navigate('login');
      return;
    }
    try { await refrescarCarritoDesdeAPI(); } catch (e) { cartItems.splice(idx, 1); renderCart(); }
    return;
  }
  cartItems.splice(idx, 1);
  renderCart();
}

async function addToCart(productKey, qty = 1) {
  const p = PRODUCTS[productKey]; if (!p) return;
  const cid = compradorIdActual();
  const pid = apiIdDe(productKey);
  if (cid && pid) {
    try {
      await api.agregarCarrito(cid, pid, qty);
      showToast(`✅ Producto agregado al carrito.`);
    } catch (e) {
      showToast(`⚠️ ` + ((e && e.message) || 'No se pudo agregar al carrito.'));
      if (e && e.status === 401) navigate('login');
      return;
    }
    try { await refrescarCarritoDesdeAPI(); } catch (e) { renderCart(); }
    return;
  }
  const stock = STOCK_PRODUCTOS[productKey] !== undefined ? STOCK_PRODUCTOS[productKey] : 99;
  const existing = cartItems.find(i => i.id === productKey);
  const currentQty = existing ? existing.qty : 0;
  if (currentQty + qty > stock) {
    const allowed = stock - currentQty;
    if (allowed <= 0) {
      showToast(`⚠️ No puedes agregar más. Ya alcanzaste el stock disponible (${stock} uds).`);
      return;
    }
    if (existing) {
      existing.qty = stock;
    } else {
      cartItems.push({
        id: productKey, nombre: p.nombre, cat: p.cat,
        precio: parseInt(p.precio.replace(/[^0-9]/g,'')),
        precioOld: p.old ? parseInt(p.old.replace(/[^0-9]/g,'')) : 0,
        img: p.img, qty: stock
      });
    }
    showToast(`⚠️ Se limitó la cantidad al stock disponible de ${stock} unidades.`);
  } else {
    if (existing) {
      existing.qty += qty;
    } else {
      cartItems.push({
        id: productKey, nombre: p.nombre, cat: p.cat,
        precio: parseInt(p.precio.replace(/[^0-9]/g,'')),
        precioOld: p.old ? parseInt(p.old.replace(/[^0-9]/g,'')) : 0,
        img: p.img, qty
      });
    }
    showToast(`✅ Producto agregado al carrito.`);
  }
  renderCart();
}

// ── PASARELA ──────────────────────────────────────────────────────

function abrirPago() {
  if (cartItems.length === 0) return;
  const { total } = calcCart();
  const totalStr = fmtCOP(total);
  const btn  = document.getElementById('pago-btn-total');
  const disp = document.getElementById('pago-total-display');
  if (btn)  btn.textContent  = totalStr;
  if (disp) disp.textContent = totalStr;
  // Reset a estado formulario
  const formEl = document.getElementById('pago-form-state');
  const okEl   = document.getElementById('pago-ok-state');
  if (formEl) formEl.style.display = 'block';
  if (okEl)   okEl.style.display   = 'none';
  // Limpiar error
  const errEl = document.getElementById('pago-error');
  if (errEl) errEl.style.display = 'none';
  document.getElementById('pago-overlay').classList.add('show');
}



function formatExpiry(inp) {
  let v = inp.value.replace(/\D/g,'').slice(0,4);
  if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2);
  inp.value = v;
}

function confirmarPago() {
  // RF116: solo número de tarjeta y nombre del titular
  const num    = document.getElementById('pago-numero')?.value.replace(/\D/g,'');
  const nombre = document.getElementById('pago-nombre')?.value.trim();
  const errEl  = document.getElementById('pago-error');

  if (!num || num.length < 16) {
    if (errEl) { errEl.textContent = 'Ingresa un número de tarjeta válido (16 dígitos).'; errEl.style.display = 'block'; }
    return;
  }
  if (!nombre) {
    if (errEl) { errEl.textContent = 'Ingresa el nombre del titular de la tarjeta.'; errEl.style.display = 'block'; }
    return;
  }
  if (errEl) errEl.style.display = 'none';

  const { total } = calcCart();
  const totalStr = fmtCOP(total);
  const cartItemsSnapshot = [...cartItems]; // guardar para historial

  // Mostrar estado confirmado
  const formEl = document.getElementById('pago-form-state');
  const okEl   = document.getElementById('pago-ok-state');
  const okTot  = document.getElementById('pago-ok-total');
  if (formEl) formEl.style.display = 'none';
  if (okEl)   okEl.style.display   = 'block';
  if (okTot)  okTot.textContent    = totalStr;

  // Vaciar carrito y agregar al historial (RF27)
  agregarCompraAlHistorial([...cartItemsSnapshot]);
  cartItems = [];
  renderCart();
}





// ═══════════════════════════════════════════════
//  SIDEBAR
// ═══════════════════════════════════════════════

function applyRoleSidebar(role) {
  ['sb-sec-principal','sb-sec-cuenta','sb-sec-admin','nav-tienda','nav-pedidos','nav-admin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  if (role === 'admin') {
    ['sb-sec-admin','nav-admin'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = id === 'nav-admin' ? 'flex' : 'block';
    });
  } else {
    ['sb-sec-principal','sb-sec-cuenta'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    });
    if (role === 'vendedor') {
      ['nav-tienda','nav-pedidos'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'flex';
      });
    }
  }
}

// ═══════════════════════════════════════════════
//  LOGIN / LOGOUT
// ═══════════════════════════════════════════════

async function doRegistro() {
  const userOrEmail = document.getElementById('reg-user').value.trim();
  const emailInput  = document.getElementById('reg-email')?.value.trim() || '';
  const email       = (emailInput || userOrEmail).toLowerCase();
  const pass        = document.getElementById('reg-pass').value;
  const confirmEl   = document.getElementById('reg-confirm');
  const confirm     = confirmEl ? confirmEl.value : pass;
  const esVend      = document.getElementById('reg-vendedor').checked;

  if (!email || !email.includes('@')) { showAuthError('reg-error', 'Ingresa un correo electrónico válido.'); return; }
  if (pass.length < 4) { showAuthError('reg-error', 'La contraseña debe tener al menos 4 caracteres.'); return; }
  if (pass !== confirm) { showAuthError('reg-error', 'Las contraseñas no coinciden.'); return; }
  hideAuthError('reg-error');

  try {
    const body = await api.register(email, pass, userOrEmail || email);
    const u = saveSession(body);
    ['reg-user','reg-pass','reg-confirm'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    const emailReg = document.getElementById('reg-email'); if (emailReg) emailReg.value = '';
    // El registro crea rol comprador; si marcó vendedor, pedir cambio de rol.
    let role = applySessionToUI(u);
    if (esVend && role === 'comprador') {
      try { const r = await api.cambiarRol('vendedor'); const u2 = saveSession(r); role = applySessionToUI(u2); }
      catch (e) { showToast('⚠️ Cuenta creada. Solicita el rol vendedor desde Ajustes.'); }
    }
    navigate(role === 'admin' ? 'admin' : (role === 'vendedor' ? 'perfil-vendedor' : 'home'));
    try { await cargarCatalogoDesdeAPI(); } catch (e) {}
  } catch (e) {
    showAuthError('reg-error', (e && e.message) || 'No se pudo crear la cuenta.');
  }
}

async function doLogin() {
  const email = document.getElementById('login-user').value.trim().toLowerCase();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showAuthError('login-error', 'Ingresa tu correo y contraseña.'); return; }
  hideAuthError('login-error');
  try {
    const body = await api.login(email, pass);
    const u = saveSession(body);
    const role = applySessionToUI(u);
    applyRoleSidebar(role);
    navigate(role === 'admin' ? 'admin' : 'home');
    try { await cargarCatalogoDesdeAPI(); } catch (e) {}
    try { await cargarCategoriasFiltro(); } catch (e) {}
    try { await refrescarCarritoDesdeAPI(); } catch (e) {}
    try { await cargarNotificaciones(); } catch (e) {}
    try { await actualizarBadgeNoLeidas(); } catch (e) {}
  } catch (e) {
    if (e && e.status === 401) clearSession();
    showAuthError('login-error', (e && e.message) || 'Usuario o contraseña incorrectos.');
  }
}


async function doLogout() {
  try { await api.logout(); } catch (e) { /* sesion local se limpia igual */ }
  clearSession();
  currentUser = null;
  const lu = document.getElementById('login-user');
  const lp = document.getElementById('login-pass');
  if (lu) lu.value = '';
  if (lp) lp.value = '';
  // Reset avatares
  ['comprador','vendedor'].forEach(t => {
    const img  = document.getElementById('prof-img-' + t);
    const init = document.getElementById('prof-initial-' + t);
    if (img)  { img.src = ''; img.style.display = 'none'; }
    if (init) init.style.display = 'flex';
  });
  // Reset sb-avatar
  const sbAv = document.querySelector('.sb-avatar');
  if (sbAv) { sbAv.innerHTML = ''; sbAv.textContent = 'J'; }
  document.getElementById('sidebar').classList.remove('show');
  navigate('login');
}


async function convertirAVendedor() {
  if (!currentUser && !localStorage.getItem('commercity_token')) { navigate('login'); return; }
  try {
    const body = await api.cambiarRol('vendedor');
    const u = saveSession(body);
    const role = applySessionToUI(u || getSessionUser());
    navigate('perfil-vendedor');
    showToast('✅ Ahora eres vendedor en CommerCity.');
  } catch (e) {
    showToast('⚠️ ' + ((e && e.message) || 'No se pudo cambiar a vendedor.'));
  }
}

async function guardarPerfil() {
  const nombreInput = document.querySelector('#page-ajustes input[type="text"]');
  const emailInput  = document.querySelector('#page-ajustes input[type="email"]');
  const payload = {};
  if (nombreInput && nombreInput.value.trim()) payload.nombre_completo = nombreInput.value.trim();
  if (emailInput && emailInput.value.trim()) payload.email = emailInput.value.trim();
  if (!Object.keys(payload).length) { showToast('⚠️ Sin cambios para guardar.'); return; }
  try {
    const body = await api.actualizarPerfil(payload);
    const u = saveSession(body) || getSessionUser();
    if (u) applySessionToUI(u); else if (payload.nombre_completo) applySessionToUI({ ...getSessionUser(), nombre_completo: payload.nombre_completo });
    showToast('✅ Perfil actualizado.');
  } catch (e) {
    showToast('⚠️ ' + ((e && e.message) || 'No se pudo actualizar el perfil.'));
  }
}

async function eliminarCuenta() {
  if (!confirm('¿Eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) return;
  try {
    await api.eliminarCuenta();
  } catch (e) {
    showToast('⚠️ ' + ((e && e.message) || 'No se pudo eliminar la cuenta.'));
    return;
  }
  clearSession();
  await doLogout();
}

async function guardarDireccion() {
  const dir = document.getElementById('ajustes-dir')?.value.trim() || '';
  if (dir.length < 5) { showToast('⚠️ Ingresa una dirección válida.'); return; }
  try {
    await api.actualizarPerfil({ direccion_envio: dir });
    showToast('✅ Dirección actualizada.');
  } catch (e) {
    showToast('⚠️ ' + ((e && e.message) || 'No se pudo guardar la dirección.'));
  }
}

// ═══════════════════════════════════════════════
//  NAVEGACIÓN
// ═══════════════════════════════════════════════

async function navigate(page) {
  const role = currentUser?.role;

  // Vendedor va a su perfil correcto
  if (page === 'perfil' && role === 'vendedor') page = 'perfil-vendedor';

  // Protecciones
  if (page === 'admin' && role !== 'admin') return;
  if (role === 'admin' && !['admin','admin-ajustes','login'].includes(page)) return;
  if (role === 'comprador' && ['tienda','pedidos','perfil-vendedor'].includes(page)) return;

  // Cerrar todos los overlays al navegar
  ['prod-overlay','pago-overlay','detalle-overlay','reporte-overlay',
   'modal-producto','seguidores-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  });

  // Activar página
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  // Sidebar — admin nunca
  const sb = document.getElementById('sidebar');
  if (APP_PAGES.includes(page) && !['admin','admin-ajustes'].includes(page)) {
    sb.classList.add('show');
  } else {
    sb.classList.remove('show');
  }

  // Nav activo
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  const navMap = {
    home:'nav-home', carrito:'nav-carrito',
    perfil:'nav-perfil', 'perfil-vendedor':'nav-perfil',
    tienda:'nav-tienda', pedidos:'nav-pedidos',
    historial:'nav-historial', ajustes:'nav-ajustes',
    admin:'nav-admin', 'admin-ajustes':'nav-admin',
    mensajes:'nav-perfil', chat:'nav-perfil',
  };
  const activeNav = document.getElementById(navMap[page]);
  if (activeNav) activeNav.classList.add('active');

  document.getElementById('notif-panel')?.classList.remove('show');
  // Renderizar vistas reactivas al navegar (datos vivos de la API + fallback local)
  if (page === 'carrito')   { try { await refrescarCarritoDesdeAPI(); } catch (e) {} renderCart(); }
  if (page === 'historial') { try { await cargarHistorialDesdeAPI(); } catch (e) {} renderHistorial(); }
  if (page === 'pedidos')   { try { await renderPedidos(); } catch (e) {} }
  if (page === 'tienda')    { try { await renderTiendaStats(); } catch (e) { renderTiendaStatsLocal(); } try { await cargarMisProductos(); } catch (e) {} try { await precargarCuentaBancaria(); } catch (e) {} }
  if (page === 'admin-ajustes') { try { await precargarCuentaAdmin(); } catch (e) {} }
  if (page === 'admin')     { try { await renderAdminStats(); } catch (e) {} try { await cargarAdminTablas(); } catch (e) {} }
  if (page === 'mensajes')  { try { await cargarConversaciones(); } catch (e) {} try { await cargarNotificaciones(); } catch (e) {} renderNotifPanel(); }
  if (page === 'home')      { actualizarBadgeNoLeidas().catch(() => {}); }
}

// ═══════════════════════════════════════════════
//  SEGUIDORES / SIGUIENDO
// ═══════════════════════════════════════════════

async function openSeguidores(tab) {
  const modal  = document.getElementById('seguidores-modal');
  const tabSeg = document.getElementById('tab-seguidores');
  const tabSig = document.getElementById('tab-siguiendo');
  const list   = document.getElementById('seguidores-list');
  if (!modal || !list) return;

  tabSeg.classList.toggle('active', tab === 'seguidores');
  tabSig.classList.toggle('active', tab === 'siguiendo');

  // Listas reales (api.seguidores / api.siguiendo) con fallback local.
  try {
    const body = tab === 'siguiendo' ? await api.siguiendo() : await api.seguidores();
    const d = (body && body.data) || {};
    const users = Array.isArray(d.usuarios) ? d.usuarios
      : (Array.isArray(d.siguiendo) ? d.siguiendo : (Array.isArray(d.seguidores) ? d.seguidores : (Array.isArray(d) ? d : [])));
    if (users.length || true) {
      list.innerHTML = users.map(u => {
        const name = u.nombre_completo || u.nombre || u.email || 'Usuario';
        const av = u.foto_perfil ? absImg(u.foto_perfil) : '';
        return `<div class="seg-row">
          <div class="seg-av">${av ? `<img src="${escHtml(imgSrcSafe(av))}" alt=""/>` : escHtml(name[0].toUpperCase())}</div>
          <span class="seg-name">${escHtml(name)}</span>
        </div>`;
      }).join('') || '<div style="padding:24px;text-align:center;color:var(--text2);font-size:13px">Sin usuarios por aquí todavía</div>';
      modal.classList.add('show');
      return;
    }
  } catch (e) {
    if (e && e.status === 401) { navigate('login'); return; }
    /* fallback local */
  }

  const data = tab === 'siguiendo' ? SEGUIDOS : SEGUIDOS.slice(0, 4);
  list.innerHTML = data.map(u => `
    <div class="seg-row">
      <div class="seg-av">${u.avatar ? `<img src="${u.avatar}" alt=""/>` : u.name[0]}</div>
      <span class="seg-name">${u.name}${u.verified ? ' 🟡' : ''}</span>
    </div>
  `).join('');

  modal.classList.add('show');
}

function closeSeguidores(e) {
  const modal = document.getElementById('seguidores-modal');
  if (!e || e.target === modal) modal.classList.remove('show');
}

// ═══════════════════════════════════════════════
//  ADMIN — REPORTES
// ═══════════════════════════════════════════════

function openReporte(key) {
  const r = REPORTES[key];
  if (!r) return;
  window._reporteActual = r;

  document.getElementById('rp-tipo').textContent       = r.tipo;
  document.getElementById('rp-tipo').className         = `badge ${r.tipoCls}`;
  document.getElementById('rp-reportado').textContent  = r.reportado;
  document.getElementById('rp-rep-por').textContent    = r.reportadoPor;
  document.getElementById('rp-motivo').textContent     = r.motivo;
  document.getElementById('rp-estado').textContent     = r.estado;
  document.getElementById('rp-estado').className       = `badge ${r.estadoCls}`;
  document.getElementById('rp-fecha').textContent      = r.fecha;
  document.getElementById('rp-evidencias').innerHTML   = r.evidencias
    .map(s => `<div class="rp-ev-thumb"><img src="${s}" alt=""/></div>`).join('');

  const respBox = document.getElementById('rp-respuesta-box');
  const respTxt = document.getElementById('rp-respuesta-txt');
  const respEnv = document.getElementById('rp-respuesta-enviada');
  if (r.respuesta) {
    respBox.style.display = 'none';
    respEnv.style.display = 'block';
    respTxt.textContent   = r.respuesta;
  } else {
    respBox.style.display = 'block';
    respEnv.style.display = 'none';
    respTxt.textContent   = '';
  }

  document.getElementById('rp-acciones-usuario').style.display  = r.acciones==='usuario'  ? 'block':'none';
  document.getElementById('rp-acciones-producto').style.display = r.acciones==='producto' ? 'block':'none';

  document.getElementById('reporte-overlay').classList.add('show');

  // Refrescar desde la API cuando el reporte es real (api.adminReporte).
  if (r._apiId != null) {
    api.adminReporte(r._apiId).then(body => {
      const d = (body && body.data) || {};
      const rep = d.reporte || d;
      if (rep && (rep.motivo || rep.respuesta_admin)) {
        if (rep.motivo) document.getElementById('rp-motivo').textContent = rep.motivo;
        if (rep.respuesta_admin) {
          document.getElementById('rp-respuesta-box').style.display = 'none';
          document.getElementById('rp-respuesta-enviada').style.display = 'block';
          document.getElementById('rp-respuesta-txt').textContent = rep.respuesta_admin;
          r.respuesta = rep.respuesta_admin;
        }
      }
    }).catch(() => {});
  }
}

function closeReporte(e) {
  const o = document.getElementById('reporte-overlay');
  if (!e || e.target === o) o.classList.remove('show');
}


function cambiarFotoPerfil(event, tipo) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const url = e.target.result;
    // Aplicar a ambos perfiles (comprador y vendedor comparten imagen)
    ['comprador','vendedor'].forEach(t => {
      const img  = document.getElementById('prof-img-' + t);
      const init = document.getElementById('prof-initial-' + t);
      if (img)  { img.src = url; img.style.display = 'block'; }
      if (init) init.style.display = 'none';
    });
    // Actualizar avatar del sidebar
    const sbAv = document.getElementById('sb-user-initial');
    if (sbAv && sbAv.tagName !== 'IMG') {
      // Cambiar el sb-avatar a imagen
      const sbAvDiv = document.querySelector('.sb-avatar');
      if (sbAvDiv) {
        sbAvDiv.innerHTML = '';
        const imgEl = document.createElement('img');
        imgEl.src = url;
        imgEl.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%';
        sbAvDiv.appendChild(imgEl);
      }
    }
  };
  reader.readAsDataURL(file);
}

// ═══════════════════════════════════════════════
//  MISC UI
// ═══════════════════════════════════════════════

function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}


function closeProd(e)      { if (e.target === document.getElementById('prod-overlay')) closeProdDirect(); }
function closeProdDirect() { document.getElementById('prod-overlay').classList.remove('show'); }

function addToCartAndClose() {
  const key = document.getElementById("pd-nombre")?.textContent;
  const found = Object.entries(PRODUCTS).find(([k,v]) => v.nombre === key);
  if (found) addToCart(found[0], parseInt(document.getElementById("pd-qty")?.textContent || "1"));
  closeProdDirect();
}

function openDetalle()   { document.getElementById('detalle-overlay').classList.add('show'); }
function closeDetalle(e) { if (!e || e.target===document.getElementById('detalle-overlay')) document.getElementById('detalle-overlay').classList.remove('show'); }

// confirmPago reemplazado por confirmarPago (sistema dinámico)

function openMensajes() { navigate('mensajes'); }

// ── CONVERSACIONES REALES (api.conversaciones + api.directorio) ─────
// page-mensajes se pinta con ids resolubles; el HTML estático se conserva
// solo como fallback cuando la API no responde.
let _usuariosChat = {};

function _listaDe(body, clave) {
  const d = (body && body.data) || {};
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d[clave])) return d[clave];
  return [];
}

function _registrarUsuarioChat(u) {
  if (!u) return null;
  const id = Number(u.id);
  if (!Number.isFinite(id)) return null;
  if (!_usuariosChat[id]) {
    _usuariosChat[id] = {
      id,
      nombre: u.nombre_completo || u.nombre || 'Usuario',
      foto: absImg(u.foto_perfil || u.foto || u.avatar),
    };
  } else if (u.foto_perfil && !_usuariosChat[id].foto) {
    _usuariosChat[id].foto = absImg(u.foto_perfil);
  }
  return _usuariosChat[id];
}

function horaDeMensaje(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';
  const seg = (Date.now() - d.getTime()) / 1000;
  if (seg < 60) return 'Ahora';
  if (seg < 3600) return Math.floor(seg / 60) + ' min';
  if (seg < 86400) return Math.floor(seg / 3600) + ' h';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

async function cargarConversaciones() {
  const cont = document.querySelector('#page-mensajes .main-scroll');
  if (!cont) return null;
  const [rc, rd] = await Promise.allSettled([api.conversaciones(), api.directorio()]);
  // API inaccesible: se conserva el marcado estático de la página (fallback local).
  if (rc.status !== 'fulfilled' && rd.status !== 'fulfilled') return null;

  const convs = rc.status === 'fulfilled' ? _listaDe(rc.value, 'conversaciones') : [];
  const dir   = rd.status === 'fulfilled' ? _listaDe(rd.value, 'usuarios') : [];
  if (dir.length) _directorioCache = dir;

  const fila = (uid, preview, hora, noLeidos) => {
    const u = _usuariosChat[Number(uid)] || { id: Number(uid), nombre: 'Usuario', foto: '' };
    const nombre = u.nombre || 'Usuario';
    const sinLeer = Number(noLeidos) || 0;
    return `<div class="msg-row ${sinLeer ? 'unread' : ''}" onclick="openChatPorId(${u.id})">
      <div class="msg-av">${u.foto ? `<img src="${escHtml(u.foto)}" alt=""/>` : escHtml(nombre[0].toUpperCase())}</div>
      <div class="msg-info"><div class="msg-name">${escHtml(nombre)}</div><div class="msg-preview">${escHtml(preview)}</div></div>
      <div class="msg-meta">${hora ? `<span class="msg-time-lbl">${escHtml(hora)}</span>` : ''}${sinLeer ? `<span class="msg-unread-dot">${sinLeer}</span>` : ''}</div>
    </div>`;
  };

  const idsConversacion = new Set();
  const filasConvs = convs.map(c => {
    const u = _registrarUsuarioChat(c && c.usuario);
    if (!u) return '';
    idsConversacion.add(u.id);
    const um = c.ultimo_mensaje || {};
    const preview = um.mensaje || (um.archivo_url ? '📎 Archivo' : 'Sin mensajes');
    return fila(u.id, preview, horaDeMensaje(um.enviado_at), c.no_leidos);
  }).join('');

  const filasDir = dir.map(u => _registrarUsuarioChat(u))
    .filter(u => u && !idsConversacion.has(u.id))
    .map(u => fila(u.id, 'Iniciar conversación', '', 0))
    .join('');

  const seccion = (titulo, filas) => filas
    ? `<div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--text3);padding:10px 6px 4px">${titulo}</div>${filas}`
    : '';

  const html = seccion('CONVERSACIONES', filasConvs) + seccion('DIRECTORIO', filasDir);
  cont.innerHTML = html ||
    '<div style="padding:32px 16px;text-align:center;color:var(--text2);font-size:13px">Aún no tienes conversaciones. Abre un producto y escribe al vendedor.</div>';

  return { conversaciones: idsConversacion.size, directorio: dir.length };
}

// Abre un chat con el id real del usuario (resuelto en cargarConversaciones).
function openChatPorId(userId) {
  const u = _usuariosChat[Number(userId)];
  if (!u) return;
  const nombre = u.nombre || 'Usuario';
  openChat(nombre, nombre[0] ? nombre[0].toUpperCase() : 'U', '', '', '', u.id);
}

async function openChat(name, avatar, img, prod, price, userId) {
  // Reset completo del chat para permitir re-entrar siempre
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = (val == null ? '' : String(val)); };
  setTxt('chat-user-name', name);
  setTxt('chat-user-av', avatar);
  const prodImg = document.getElementById('chat-prod-img');
  if (prodImg && img) prodImg.src = img;
  setTxt('chat-prod-name', prod);
  setTxt('chat-prod-price', price);
  const inp0 = document.getElementById('chat-input');
  if (inp0) inp0.value = '';
  // Resolver el receptor y cargar historial real (api.mensajes).
  // userId real (fila de page-mensajes) tiene prioridad; si no, se resuelve por nombre.
  window._chatReceptorId = null;
  let historial = null;
  let receptorId = null;
  try {
    const rid = (userId != null && userId !== '') ? Number(userId) : await resolverUsuarioId(name);
    if (rid && Number.isFinite(rid)) {
      receptorId = rid;
      window._chatReceptorId = rid;
      const body = await api.mensajes(rid);
      const d = (body && body.data) || {};
      historial = Array.isArray(d.mensajes) ? d.mensajes : (Array.isArray(d) ? d : []);
    }
  } catch (e) { historial = null; }

  const cardHtml = (img || prod) ? `
    <div class="prod-card-msg">
      <img src="${escHtml(img || '')}" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block"/>
      <div class="prod-card-msg-body">
        <div class="prod-card-msg-name">${escHtml(prod || '')}</div>
        <div class="prod-card-msg-price">${escHtml(price || '')}</div>
        <button class="btn btn-orange btn-full btn-sm">Ver Producto</button>
      </div>
    </div>` : '';

  let html = cardHtml;
  if (receptorId != null && historial !== null) {
    // Modo API: historial real (aunque esté vacío en una conversación nueva).
    const yo = compradorIdActual();
    html += historial.map(m => {
      const mio = yo != null ? (Number(m.emisor_id) === yo) : !!m.enviado_por_mi;
      const archivo = m.archivo_url ? `<div class="msg-text"><img src="${escHtml(absImg(m.archivo_url))}" style="max-width:180px;border-radius:8px"/></div>` : '';
      return `<div class="msg-bubble ${mio ? 'msg-out' : 'msg-in'}">${archivo}<div class="msg-text">${escHtml(m.mensaje || '')}</div><div class="msg-time">${escHtml(String(m.enviado_at || '').slice(11, 16))}</div></div>`;
    }).join('');
    if (!historial.length) {
      html += '<div style="text-align:center;color:var(--text3);font-size:12px;padding:16px">Sin mensajes todavía. ¡Saluda!</div>';
    }
    // Marcar como leídos los entrantes (api.marcarLeido).
    try {
      historial.filter(m => !m.leido && (yo == null || Number(m.emisor_id) !== yo) && m.id != null)
        .forEach(m => api.marcarLeido(m.id).catch(() => {}));
    } catch (e) {}
  } else {
    // Fallback local: burbujas de ejemplo solo cuando no hay id/API resoluble.
    html += `
    <div class="msg-bubble msg-in"><div class="msg-text">Hola, ¿todavía está disponible el teclado?</div><div class="msg-time">12:03 AM</div></div>
    <div class="msg-bubble msg-out"><div class="msg-text">Si, aún tenemos stock disponible.</div><div class="msg-time">12:31 AM</div></div>
    <div class="msg-bubble msg-in"><div class="msg-text">¿Tiene garantía?</div><div class="msg-time">12:03 AM</div></div>
    <div class="msg-bubble msg-out"><div class="msg-text">Si, garantía de 6 meses.</div><div class="msg-time">12:23 AM</div></div>
  `;
  }
  const contMensajes = document.getElementById('chat-messages');
  if (contMensajes) contMensajes.innerHTML = html;
  // Activar chat directamente sin usar navigate() para evitar bloqueos
  // Esto garantiza que siempre funciona sin importar el estado previo
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const chatPage = document.getElementById('page-chat');
  if (chatPage) chatPage.classList.add('active');

  // Asegurar sidebar visible con perfil activo
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.add('show');
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  const navPerfil = document.getElementById('nav-perfil');
  if (navPerfil) navPerfil.classList.add('active');

  // Scroll al fondo del chat
  const msgs = document.getElementById('chat-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;

  // Cerrar notif si está abierto
  document.getElementById('notif-panel')?.classList.remove('show');
}

async function sendMsg() {
  const inp = document.getElementById('chat-input');
  const txt = inp.value.trim(); if (!txt) return;
  // Envío real (multipart; el backend deriva texto/imagen y notifica).
  if (window._chatReceptorId != null) {
    try {
      const fd = new FormData();
      fd.append('receptor_id', String(window._chatReceptorId));
      fd.append('mensaje', txt);
      const fileInput = document.getElementById('chat-archivo');
      if (fileInput && fileInput.files && fileInput.files[0]) fd.append('archivo', fileInput.files[0]);
      await api.enviarMensaje(fd);
    } catch (e) {
      showToast('⚠️ ' + ((e && e.message) || 'No se pudo enviar el mensaje.'));
      if (e && e.status === 401) navigate('login');
      return;
    }
  }
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg-bubble msg-out';
  div.innerHTML = `<div class="msg-text">${escHtml(txt)}</div><div class="msg-time">Ahora</div>`;
  container.appendChild(div);
  inp.value = '';
  container.scrollTop = container.scrollHeight;
}

// ═══════════════════════════════════════════════
//  EVENTOS GLOBALES
// ═══════════════════════════════════════════════

document.addEventListener('click', e => {
  const panel = document.getElementById('notif-panel');
  if (panel?.classList.contains('show') && !panel.contains(e.target) && !e.target.closest('.tb-icon-btn')) {
    panel.classList.remove('show');
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('page-chat')?.classList.contains('active')) sendMsg();
});

// ════════════════════════════════════════════════════════════
// RF3/4 — Recuperar y restablecer contraseña
// ════════════════════════════════════════════════════════════

let recoveryToken = null;

async function doRecuperar() {
  const email = document.getElementById('rec-user')?.value.trim().toLowerCase();
  const errEl    = document.getElementById('rec-error');
  const formEl   = document.getElementById('rec-form');
  const okEl     = document.getElementById('rec-ok');
  if (!email || !email.includes('@')) {
    if (errEl) { errEl.textContent = 'Ingresa un correo electrónico válido.'; errEl.style.display = 'block'; } return;
  }
  try {
    const body = await api.recover(email);
    // En desarrollo la API puede devolver el token de reseteo en data.
    recoveryToken = (body && body.data && (body.data.token || body.data.reset_token)) || null;
    if (recoveryToken) { try { localStorage.setItem('commercity_recovery', recoveryToken); } catch (e) {} }
  } catch (e) {
    if (errEl) { errEl.textContent = (e && e.message) || 'No se pudo iniciar la recuperación.'; errEl.style.display = 'block'; } return;
  }
  if (errEl)  errEl.style.display  = 'none';
  if (formEl) formEl.style.display = 'none';
  if (okEl)   okEl.style.display   = 'block';
}

function checkPasswordStrength(pass) {
  const bars  = ['str-1','str-2','str-3'].map(id => document.getElementById(id));
  const label = document.getElementById('str-label');
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 10) score++;
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
  const colors = ['var(--red)','var(--orange)','var(--green)'];
  const labels = ['Débil','Regular','Fuerte'];
  bars.forEach((b, i) => { if (b) b.style.background = i < score ? colors[score-1] : 'var(--bg4)'; });
  if (label) { label.textContent = pass ? labels[score-1]||'Débil' : 'Ingresa una contraseña'; label.style.color = pass ? colors[score-1] : 'var(--text3)'; }
}

async function doRestablecer() {
  const p1    = document.getElementById('reset-p1')?.value;
  const p2    = document.getElementById('reset-p2')?.value;
  const errEl = document.getElementById('reset-error');
  if (!p1 || p1.length < 6) { if (errEl) { errEl.textContent='La contraseña debe tener al menos 6 caracteres.'; errEl.style.display='block'; } return; }
  if (p1 !== p2)             { if (errEl) { errEl.textContent='Las contraseñas no coinciden.'; errEl.style.display='block'; } return; }
  const token = recoveryToken || (() => { try { return localStorage.getItem('commercity_recovery'); } catch (e) { return null; } })();
  if (!token) { if (errEl) { errEl.textContent='Sesión de recuperación expirada. Solicita un nuevo correo.'; errEl.style.display='block'; } return; }
  try {
    await api.resetPassword(token, p1);
  } catch (e) {
    if (errEl) { errEl.textContent = (e && e.message) || 'No se pudo restablecer la contraseña.'; errEl.style.display='block'; } return;
  }
  if (errEl) errEl.style.display = 'none';
  recoveryToken = null;
  try { localStorage.removeItem('commercity_recovery'); } catch (e) {}
  document.getElementById('reset-p1').value = '';
  document.getElementById('reset-p2').value = '';
  ['str-1','str-2','str-3'].forEach(id => { const el=document.getElementById(id); if(el) el.style.background='var(--bg4)'; });
  recoveryToken = null;
  showToast('✅ Contraseña restablecida. Ya puedes iniciar sesión.');
  navigate('login');
}

// ════════════════════════════════════════════════════════════
// RF16/17 — Editar descripción personal del perfil
// ════════════════════════════════════════════════════════════

function toggleBioEdit(tipo) {
  const editDiv = document.getElementById('bio-edit-' + tipo);
  const bioTxt  = document.getElementById(tipo === 'comprador' ? 'prof-bio-display' : 'prof-bio-vendedor');
  const input   = document.getElementById('bio-input-' + tipo);
  if (!editDiv) return;
  const isOpen = editDiv.style.display !== 'none';
  editDiv.style.display = isOpen ? 'none' : 'block';
  if (!isOpen && input && bioTxt) input.value = bioTxt.textContent;
}

function guardarBio(tipo) {
  const input  = document.getElementById('bio-input-' + tipo);
  const val    = input?.value.trim();
  if (!val) { showToast('⚠️ La descripción no puede estar vacía'); return; }
  document.querySelectorAll('.prof-bio-txt').forEach(el => el.textContent = val);
  const ajustesBio = document.getElementById('ajustes-bio');
  if (ajustesBio) ajustesBio.value = val;
  userBio = val;
  toggleBioEdit(tipo);
  showToast('✅ Descripción actualizada');
}

// ════════════════════════════════════════════════════════════
// RF59 / RF141 — Base de Datos de Ganancias, IVA y Auditoría Fiscal
// ════════════════════════════════════════════════════════════

const ADMIN_DB = {
  vendedoresTotales: 1248,
  compradoresTotales: 8902,
  comisionesTotales: 45280050, // en COP (10% de ventas)
  ivaTotal: 86032095,          // en COP (19% de IVA recaudado)
  devolucionesTotal: 0,
  transacciones: [
    { id:'TX-091', ref:'HC-001', concepto:'Venta MacBook Air (Alex Rivera)', fecha:'24 Oct, 2026', bruto:1299000, iva:246810, comision:154581, estado:'Liquidado' },
    { id:'TX-090', ref:'HC-002', concepto:'Venta TV LG 45 pulgadas (Elena Sanz)', fecha:'23 Oct, 2026', bruto:1900000, iva:361000, comision:226100, estado:'En tránsito' },
    { id:'TX-089', ref:'HC-003', concepto:'Venta iPhone 15 Pro (Julian Thorne)', fecha:'22 Oct, 2026', bruto:3000000, iva:570000, comision:357000, estado:'Liquidado' },
    { id:'TX-088', ref:'HC-004', concepto:'Venta iPad Pro 11" (Marco Rossi)', fecha:'21 Oct, 2026', bruto:2799000, iva:531810, comision:333081, estado:'Pendiente' },
  ]
};

async function renderAdminStats() {
  // Stats reales del admin (fallback: ADMIN_DB local).
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  try {
    const body = await api.adminStats();
    const s = (body && body.data) || {};
    set('admin-stat-vendedores', Number(s.totalVendedores ?? 0).toLocaleString('es-CO'));
    set('admin-stat-compradores', Number(s.totalCompradores ?? 0).toLocaleString('es-CO'));
    set('admin-stat-comisiones', fmtCOP(Number(s.totalComisiones ?? 0)));
  } catch (e) {
    if (e && e.status === 401) { navigate('login'); return; }
    set('admin-stat-vendedores', ADMIN_DB.vendedoresTotales.toLocaleString('es-CO'));
    set('admin-stat-compradores', ADMIN_DB.compradoresTotales.toLocaleString('es-CO'));
    set('admin-stat-comisiones', fmtCOP(ADMIN_DB.comisionesTotales));
  }
  set('admin-stat-iva', fmtCOP(ADMIN_DB.ivaTotal));
  set('admin-stat-devoluciones', fmtCOP(ADMIN_DB.devolucionesTotal));

  const tbody = document.getElementById('admin-ganancias-tbody');
  if (tbody) {
    tbody.innerHTML = ADMIN_DB.transacciones.map(t => {
      const isDev = t.estado === 'Reembolsado' || t.comision < 0;
      const cls = isDev ? 'badge-red' : (t.estado === 'Liquidado' ? 'badge-green' : 'badge-orange');
      return `<tr>
        <td style="font-family:monospace;font-weight:700">${t.id} <span style="font-size:10px;color:var(--text3)">(${t.ref})</span></td>
        <td style="font-size:12px;font-weight:600">${t.concepto}</td>
        <td style="font-size:11px;color:var(--text2)">${t.fecha}</td>
        <td style="font-size:12px;${isDev ? 'color:var(--red)' : ''}">${isDev ? '– ' + fmtCOP(Math.abs(t.bruto)) : fmtCOP(t.bruto)}</td>
        <td style="font-size:12px;color:var(--orange);${isDev ? 'text-decoration:line-through' : ''}">${isDev ? '– ' + fmtCOP(Math.abs(t.iva)) : fmtCOP(t.iva)}</td>
        <td style="font-size:12px;font-weight:700;${isDev ? 'color:var(--red)' : 'color:var(--green)'}">${isDev ? '– ' + fmtCOP(Math.abs(t.comision)) : fmtCOP(t.comision)}</td>
        <td><span class="badge ${cls}" style="font-size:10px">${t.estado}</span></td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--text2)">Sin registros fiscales</td></tr>';
  }
}

// ════════════════════════════════════════════════════════════
// RF27-31 — Historial de compras dinámico con IVA
// ════════════════════════════════════════════════════════════

let historialCompras = [
  { id:'HC-001', pedidoId:'PED-002', productKeys:[{key:'mochila', qty:1, precio:1299000, nombre:'MacBook Air'}], vendedor:'Alex Rivera',   av:'AR', producto:'MacBook Air',       dir:'Cll 80 # 45-12, Bogotá',        fecha:'24 Oct, 2026', estado:'Entregado', qty:1, precioUnit:1299000, subtotal:1299000, iva:246810, total:1545810 },
  { id:'HC-002', pedidoId:'PED-001', productKeys:[{key:'audifonos', qty:2, precio:950000, nombre:'TV LG 45 pulgadas'}], vendedor:'Elena Sanz',    av:'ES', producto:'TV LG 45 pulgadas', dir:'Carrera 7 # 12-34, Medellín',   fecha:'23 Oct, 2026', estado:'En Camino', qty:2, precioUnit:950000,  subtotal:1900000, iva:361000, total:2261000 },
  { id:'HC-003', pedidoId:'PED-004', productKeys:[{key:'zapatillas', qty:1, precio:3000000, nombre:'iPhone 15 Pro'}], vendedor:'Julian Thorne', av:'JT', producto:'iPhone 15 Pro',     dir:'Cll 10 # 5-20, Cali',           fecha:'22 Oct, 2026', estado:'Entregado', qty:1, precioUnit:3000000, subtotal:3000000, iva:570000, total:3570000 },
  { id:'HC-004', pedidoId:'PED-003', productKeys:[{key:'cuadromin', qty:1, precio:2799000, nombre:'iPad Pro 11"'}], vendedor:'Marco Rossi',   av:'MR', producto:'iPad Pro 11"',      dir:'Av. El Dorado # 68-10, Bogotá', fecha:'21 Oct, 2026', estado:'Pendiente', qty:1, precioUnit:2799000, subtotal:2799000, iva:531810, total:3330810 },
];
let histFiltroActual = 'Todo';

// fmtCOP definido en línea 93

function renderHistorial() {
  const tbody = document.getElementById('historial-tbody');
  if (!tbody) return;
  const data = histFiltroActual === 'Todo' ? historialCompras : historialCompras.filter(h => h.estado === histFiltroActual);
  tbody.innerHTML = data.map(h => {
    const subtotal = h.subtotal || (h.precioUnit * h.qty);
    const iva   = h.iva || Math.round(subtotal * IVA_RATE);
    const total = h.total || (subtotal + iva);
    const cls   = h.estado==='Entregado'?'badge-green':h.estado==='En Camino'?'badge-orange':'badge-red';
    
    // RF35: Botón Cancelar solo visible cuando el estado es 'Pendiente'
    const cancelBtn = h.estado === 'Pendiente'
      ? `<button class="btn btn-sm" style="background:var(--red-bg);color:var(--red);border:1px solid rgba(239,68,68,.3);padding:4px 8px;font-size:11px" onclick="cancelarPedidoComprador('${h.id}')" title="Cancelar pedido y recibir devolución">Cancelar</button>`
      : '';

    return `<tr>
      <td><div class="seller-cell"><div class="seller-av">${h.av}</div>${h.vendedor}</div></td>
      <td style="font-size:13px;font-weight:600">${h.producto}</td>
      <td style="font-size:11px;color:var(--text2);max-width:130px">${h.dir}</td>
      <td style="font-size:11px;color:var(--text2)">${h.fecha}</td>
      <td><span class="badge ${cls}">${h.estado}</span></td>
      <td style="text-align:center">${h.qty}</td>
      <td style="font-size:12px;color:var(--text2)">${fmtCOP(h.precioUnit)}</td>
      <td style="font-size:12px;color:var(--orange)">${fmtCOP(iva)}</td>
      <td style="font-weight:700">${fmtCOP(total)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:11px" onclick="verDetalleHistorial('${h.id}')">Ver</button>
          ${cancelBtn}
        </div>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text2)">Sin compras en este filtro</td></tr>';
}

function filtroHistorial(estado, el) {
  histFiltroActual = estado;
  document.querySelectorAll('.hist-ftab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderHistorial();
}

function verDetalleHistorial(id) {
  const h = historialCompras.find(x => x.id === id);
  if (!h) return;
  const subtotal = h.subtotal || (h.precioUnit * h.qty);
  const desc     = Math.round(subtotal * 0.05);
  const iva      = h.iva || Math.round((subtotal - desc) * 0.19);
  const total    = h.total || (subtotal - desc + iva);
  const cls      = h.estado==='Entregado'?'badge-green':h.estado==='En Camino'?'badge-orange':'badge-red';
  const body     = document.getElementById('hist-detalle-body');
  const actions  = document.getElementById('hist-detalle-actions');
  if (!body) return;
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div><div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Pedido</div><div style="font-size:13px;font-weight:600">${h.id}</div></div>
      <div><div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Estado</div><span class="badge ${cls}">${h.estado}</span></div>
      <div><div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Vendedor</div><div style="font-size:13px">${h.vendedor}</div></div>
      <div><div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Fecha</div><div style="font-size:13px;color:var(--text2)">${h.fecha}</div></div>
      <div style="grid-column:1/-1"><div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Dirección</div><div style="font-size:13px;color:var(--text2)">${h.dir}</div></div>
      <div style="grid-column:1/-1"><div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Producto</div><div style="font-size:13px;font-weight:600">${h.producto} × ${h.qty}</div></div>
    </div>
    <div style="background:var(--bg3);border-radius:12px;padding:14px 16px">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><span style="color:var(--text2)">Subtotal</span><span>${fmtCOP(subtotal)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><span style="color:var(--text2)">Descuento (5%)</span><span style="color:var(--blue)">– ${fmtCOP(desc)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px"><span style="color:var(--text2)">IVA (19%)</span><span style="color:var(--orange)">${fmtCOP(iva)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;font-family:var(--font);border-top:1px solid var(--border);padding-top:10px"><span>Total pagado</span><span style="color:var(--orange)">${fmtCOP(total)}</span></div>
    </div>`;

  if (actions) {
    if (h.estado === 'Pendiente') {
      actions.innerHTML = `
        <button class="btn btn-sm" style="background:var(--red-bg);color:var(--red);border:1px solid rgba(239,68,68,.3);padding:10px;font-weight:700;font-size:13px" onclick="cancelarPedidoComprador('${h.id}')">
          ✕ Cancelar Pedido y Solicitar Devolución
        </button>
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('hist-detalle-overlay').classList.remove('show')">Cerrar</button>
      `;
    } else {
      actions.innerHTML = `
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('hist-detalle-overlay').classList.remove('show')">Cerrar</button>
      `;
    }
  }

  document.getElementById('hist-detalle-overlay')?.classList.add('show');
}

// ════════════════════════════════════════════════════════════
// RF35, RF36, RF59, RF89, RF129, RF137, RF141 — Cancelación de Pedidos Pendientes
// ════════════════════════════════════════════════════════════

// ── HISTORIAL API ────────────────────────────────────────────────
// Historial real del comprador (api.historialCompras) + cancelación con
// reembolso (api.cancelarCompra). Fallback: caché local.
function inicialesDe(nombre) {
  return String(nombre || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

async function cargarHistorialDesdeAPI() {
  const estadoSrv = (histFiltroActual && histFiltroActual !== 'Todo') ? histFiltroActual : undefined;
  const body = await api.historialCompras(estadoSrv);
  const d = (body && body.data) || {};
  const pedidos = Array.isArray(d.pedidos) ? d.pedidos : (Array.isArray(d) ? d : []);
  const filas = [];
  pedidos.forEach(ped => {
    (ped.items || []).forEach(it => {
      const sub = Number(it.subtotal ?? 0);
      const iva = Number(it.iva ?? Math.round(sub * IVA_RATE));
      filas.push({
        id: 'HC-' + ped.pedido_id + '-' + it.detalle_id,
        _pedidoId: ped.pedido_id,
        _detalleId: it.detalle_id,
        pedidoId: 'PED-' + ped.pedido_id,
        vendedor: it.vendedor || (ped.vendedores || []).join(', ') || '—',
        av: inicialesDe(it.vendedor || (ped.vendedores || [])[0]),
        producto: it.producto || '—',
        dir: ped.direccion || '—',
        fecha: String(ped.fecha || '').slice(0, 10),
        estado: it.estado || ped.estado || 'Pendiente',
        qty: Number(it.cantidad ?? 1),
        precioUnit: Number(it.precio_unitario ?? 0),
        subtotal: sub,
        iva,
        total: Number(it.total ?? (sub + iva)),
      });
    });
  });
  if (filas.length) historialCompras = filas;
  renderHistorial();
  return filas;
}

async function cancelarPedidoComprador(id) {
  const h = historialCompras.find(x => x.id === id);
  if (!h) {
    showToast('⚠️ No se encontró el pedido.');
    return;
  }

  // RF35: Solo si se encuentra en estado "Pendiente"
  if (h.estado !== 'Pendiente') {
    showToast(`⚠️ Solo se pueden cancelar pedidos en estado 'Pendiente'. (Estado actual: ${h.estado})`);
    return;
  }

  // Cancelación real en el servidor (reembolso + restitución de stock).
  if (h._detalleId) {
    try {
      await api.cancelarCompra(h._detalleId);
    } catch (e) {
      showToast(`⚠️ ` + ((e && e.message) || 'No se pudo cancelar el pedido.'));
      if (e && e.status === 401) navigate('login');
      return;
    }
    document.getElementById('hist-detalle-overlay')?.classList.remove('show');
    try { await cargarHistorialDesdeAPI(); } catch (e) { historialCompras = historialCompras.filter(x => x.id !== id); renderHistorial(); }
    try { await renderTiendaStats(); } catch (e) {}
    try { await renderAdminStats(); } catch (e) {}
    try { await cargarNotificaciones(); } catch (e) {}
    showToast(`✅ Pedido ${h.id} cancelado con éxito. Reembolso completado y stock restituido.`);
    return;
  }

  // Fallback local (entradas semilla sin _detalleId): réplica offline del reembolso.
  const subtotal = h.subtotal || (h.precioUnit * h.qty);
  const iva = h.iva || Math.round(subtotal * IVA_RATE);
  const total = h.total || (subtotal + iva);
  const comision = Math.round(total * COMISION_RATE);
  if (h.productKeys && Array.isArray(h.productKeys)) {
    h.productKeys.forEach(pk => {
      if (STOCK_PRODUCTOS[pk.key] !== undefined) STOCK_PRODUCTOS[pk.key] += pk.qty;
    });
  }
  historialCompras = historialCompras.filter(x => x.id !== id);
  if (h.pedidoIds && Array.isArray(h.pedidoIds)) {
    pedidosVendedor = pedidosVendedor.filter(p => !h.pedidoIds.includes(p.id));
  } else if (h.pedidoId) {
    pedidosVendedor = pedidosVendedor.filter(p => p.id !== h.pedidoId);
  }
  ADMIN_DB.comisionesTotales = Math.max(0, ADMIN_DB.comisionesTotales - comision);
  ADMIN_DB.devolucionesTotal += total;
  ADMIN_DB.ivaTotal = Math.max(0, ADMIN_DB.ivaTotal - iva);
  ADMIN_DB.transacciones.unshift({
    id: 'DEV-' + String(ADMIN_DB.transacciones.length + 100).padStart(3, '0'),
    ref: h.id,
    concepto: `Devolución/Cancelación de pedido (${h.producto})`,
    fecha: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
    bruto: -subtotal, iva: -iva, comision: -comision, estado: 'Reembolsado'
  });
  document.getElementById('hist-detalle-overlay')?.classList.remove('show');
  try { await renderTiendaStats(); } catch (e) { renderTiendaStatsLocal(); }
  try { await renderPedidos(); } catch (e) {}
  renderHistorial();
  try { await renderAdminStats(); } catch (e) {}
  renderProductsHome();
  renderNotifPanel();
  showToast(`✅ Pedido ${h.id} cancelado con éxito. Reembolso de ${fmtCOP(total)} completado y stock restituido.`);
}

// ════════════════════════════════════════════════════════════
// RF47/131 — IVA_RATE y COMISION_RATE definidos en línea 90-91
// calcCart() y calcVendedorGanancia() definidos en línea 97-114
// ════════════════════════════════════════════════════════════

function renderTiendaStatsLocal() {
  // RF126-130 + RF47/131: comisión 10% CommerCity, 90% vendedor (fallback offline)
  const vendidas       = pedidosVendedor.reduce((s, p) => s + p.qty, 0);
  const ingresosBrutos = pedidosVendedor
    .filter(p => p.estado !== 'Pendiente')
    .reduce((s, p) => s + p.precio * p.qty, 0);
  const comision      = Math.round(ingresosBrutos * COMISION_RATE);  // RF131: 10%
  const ingresosNetos = ingresosBrutos - comision;                    // RF131: 90%
  const entregados    = pedidosVendedor.filter(p => p.estado === 'Entregado').length;
  const pendientes    = pedidosVendedor.filter(p => p.estado === 'Pendiente').length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('tienda-ventas',     vendidas);
  set('tienda-ingresos',   fmtCOP(ingresosNetos));
  set('tienda-comision',   fmtCOP(comision));
  set('tienda-entregados', entregados);
  set('tienda-pendientes', pendientes);
}

// ════════════════════════════════════════════════════════════
// RF80 — Verificar stock al cambiar cantidad
// ════════════════════════════════════════════════════════════

const STOCK_PRODUCTOS = {
  zapatillas:5, audifonos:12, calzado:20, mochila:30, reloj:0, planta:50, bolso:18, cuadro:40, cuadromin:25, bascula:15
};

function changeQty(d) {
  const el  = document.getElementById('pd-qty');
  const key = document.getElementById('pd-nombre')?.dataset.key || '';
  const maxStock = STOCK_PRODUCTOS[key] !== undefined ? STOCK_PRODUCTOS[key] : 99;
  const cur = parseInt(el.textContent) || 1;
  const next = Math.max(1, Math.min(maxStock, cur + d));
  el.textContent = next;
  if (next >= maxStock && d > 0) showToast(`⚠️ Solo quedan ${maxStock} unidades en stock`);
}

// ════════════════════════════════════════════════════════════
// RF102 — Seguir y dejar de seguir a otros usuarios
// ════════════════════════════════════════════════════════════

async function toggleFollowSeller(sellerName) {
  if (!sellerName) return;
  // Seguir/dejar de seguir en el servidor (se resuelve el id por directorio).
  try {
    const uid = await resolverUsuarioId(sellerName);
    if (uid) {
      const siguiendo = await estaSiguiendo(uid);
      if (siguiendo) {
        try { await api.dejarSeguir(uid); }
        catch (e) { /* reintento silencioso */ }
        showToast(`Dejaste de seguir a ${sellerName}`);
      } else {
        try { await api.seguir(uid); }
        catch (e) {
          // `api.seguir` ya envía {seguido_id}: este reintento queda como redudancia
          // por si el body llegara mal formado (400 de validación zod).
          if (e && (e.code === 'VALIDATION_ERROR' || e.status === 400)) {
            await apiRequest('/api/seguidores', { method: 'POST', body: JSON.stringify({ seguido_id: uid }) });
          } else throw e;
        }
        showToast(`Ahora sigues a ${sellerName} 🎉`);
      }
      updateFollowButton(sellerName);
      return;
    }
  } catch (e) {
    if (e && e.status === 401) { navigate('login'); return; }
    /* fallback local */
  }
  const index = SEGUIDOS.findIndex(s => s.name.toLowerCase() === sellerName.toLowerCase());
  if (index !== -1) {
    SEGUIDOS.splice(index, 1);
    showToast(`Dejaste de seguir a ${sellerName}`);
  } else {
    SEGUIDOS.push({ name: sellerName, verified: false, avatar: '' });
    showToast(`Ahora sigues a ${sellerName} 🎉`);
  }
  updateFollowButton(sellerName);
}

function updateFollowButton(sellerName) {
  const btn = document.getElementById('pd-follow-btn');
  if (!btn) return;
  const isFollowing = SEGUIDOS.some(s => s.name.toLowerCase() === sellerName.toLowerCase());
  btn.textContent = isFollowing ? 'Siguiendo' : 'Seguir';
  btn.className = isFollowing ? 'btn btn-orange btn-sm' : 'btn btn-ghost btn-sm';
}

// ── DIRECTORIO / SEGUIMIENTO ───────────────────────────────────────
// Resuelve nombre -> id para seguir/dejar de seguir y chatear.
let _directorioCache = null;
async function resolverUsuarioId(nombre) {
  if (!nombre) return null;
  // 1) vendedor del producto abierto (mapProductoAPI guarda vendedor_id).
  const keyActual = document.getElementById('pd-nombre')?.dataset.key || '';
  const pc = keyActual && PRODUCTS[keyActual];
  if (pc && pc._apiId == null && pc.vendedor_id && (pc.vendedor || '').toLowerCase() === nombre.toLowerCase()) {
    return Number(pc.vendedor_id);
  }
  if (pc && pc.vendedor_id && (pc.vendedor || '').toLowerCase() === nombre.toLowerCase()) {
    return Number(pc.vendedor_id);
  }
  // 2) directorio de usuarios.
  try {
    if (!_directorioCache) {
      const body = await api.directorio();
      const d = (body && body.data) || {};
      _directorioCache = Array.isArray(d.usuarios) ? d.usuarios : (Array.isArray(d) ? d : []);
    }
    const found = (_directorioCache || []).find(u =>
      ((u.nombre_completo || u.nombre || '') + '').toLowerCase() === nombre.toLowerCase());
    return found ? Number(found.id) : null;
  } catch (e) { return null; }
}

async function estaSiguiendo(usuarioId) {
  try {
    const body = await api.siguiendo();
    const d = (body && body.data) || {};
    const users = Array.isArray(d.usuarios) ? d.usuarios
      : (Array.isArray(d.siguiendo) ? d.siguiendo : (Array.isArray(d) ? d : []));
    return users.some(u => Number(u.id) === Number(usuarioId));
  } catch (e) { return SEGUIDOS.some(s => s._apiId != null && Number(s._apiId) === Number(usuarioId)); }
}

// ════════════════════════════════════════════════════════════
// RF82/83 — Reportar producto (campos obligatorios)
// ════════════════════════════════════════════════════════════

let reportedProductKey = '';
let reportedProductEvidencia = '';
let reportedProductFile = null;

function openReportarProducto() {
  reportedProductKey = document.getElementById('pd-nombre')?.dataset.key || '';
  reportedProductEvidencia = '';
  const ubox = document.querySelector('#reportar-overlay .upload-box');
  if (ubox) ubox.textContent = '📎 Adjuntar foto';
  const imgInput = document.querySelector('#reportar-overlay input[type="file"]');
  if (imgInput) imgInput.value = '';
  document.getElementById('rep-motivo').value = '';
  closeProdDirect();
  document.getElementById('reportar-overlay')?.classList.add('show');
}

function handleEvidenciaUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  reportedProductFile = file;
  const reader = new FileReader();
  reader.onload = function(e) {
    reportedProductEvidencia = e.target.result;
    const ubox = document.querySelector('#reportar-overlay .upload-box');
    if (ubox) ubox.textContent = `✓ Foto cargada (${file.name})`;
    showToast('✅ Evidencia cargada correctamente');
  };
  reader.readAsDataURL(file);
}

function closeReportarProducto(e) {
  const o = document.getElementById('reportar-overlay');
  if (!e || e.target === o) o?.classList.remove('show');
}

// ── ADMIN API ──────────────────────────────────────────────────────
// Tablas vivas: usuarios, productos y reportes del panel administrador.
function adminTableBodies() {
  const tables = document.querySelectorAll('.admin-table');
  return {
    usuarios: (tables[0] && tables[0].querySelector('tbody')) || null,
    productos: (tables[1] && tables[1].querySelector('tbody')) || null,
    reportes: (tables[2] && tables[2].querySelector('tbody')) || null,
  };
}

async function cargarAdminTablas() {
  const tb = adminTableBodies();
  const [uB, pB, rB] = await Promise.allSettled([api.adminUsuarios(), api.adminProductos(), api.adminReportes()]);
  if (uB.status === 'fulfilled' && tb.usuarios) {
    const d = (uB.value && uB.value.data) || {};
    const users = Array.isArray(d.usuarios) ? d.usuarios : (Array.isArray(d) ? d : []);
    if (users.length) {
      tb.usuarios.innerHTML = users.map(u => {
        const inicial = inicialesDe(u.nombre || u.email);
        const activo = (u.estado || 'activo') === 'activo';
        return `<tr>
          <td><div style="display:flex;align-items:center;gap:8px"><div class="seller-av">${escHtml(inicial)}</div>${escHtml(u.nombre || u.email)}</div></td>
          <td><span class="role-badge role-${escHtml((u.rol || 'comprador').toLowerCase())}">${escHtml(u.rol || 'Comprador')}</span></td>
          <td><span class="${activo ? 'status-active' : 'status-banned'}">${activo ? 'Activo' : 'Baneado'}</span></td>
          <td><div class="admin-btn-row">
            <button class="btn ${activo ? 'btn-ghost' : 'btn-orange'} btn-sm" style="padding:4px 10px;font-size:11px" onclick="adminCambiarEstadoUsuario('${u.id}','${activo ? 'baneado' : 'activo'}')">${activo ? 'Banear' : 'Activar'}</button>
            <button class="btn btn-sm" style="padding:4px 10px;font-size:11px;background:var(--red-bg);color:var(--red);border:1px solid rgba(239,68,68,.2)" onclick="adminEliminarUsuarioAccion('${u.id}')">Eliminar</button>
          </div></td>
        </tr>`;
      }).join('');
    }
  }
  if (pB.status === 'fulfilled' && tb.productos) {
    const d = (pB.value && pB.value.data) || {};
    const prods = Array.isArray(d.productos) ? d.productos : (Array.isArray(d) ? d : []);
    if (prods.length) {
      tb.productos.innerHTML = prods.map(p => `<tr>
        <td><div style="font-size:12px;font-weight:600">${escHtml(p.nombre || '—')}</div><div style="font-size:11px;color:var(--text2)">${p.precio != null ? fmtCOP(Number(p.precio)) : ''}</div></td>
        <td style="font-size:12px;color:var(--text2)">${escHtml(p.vendedor || '')}</td>
        <td><div style="display:flex;gap:6px">
          <button class="btn btn-sm" style="padding:4px 8px;font-size:11px;background:var(--red-bg);color:var(--red);border:1px solid rgba(239,68,68,.2)" onclick="adminEliminarProductoAccion('${p.id}')">🗑</button>
          ${p.eliminado ? `<button class="btn btn-orange btn-sm" style="padding:4px 8px;font-size:11px" onclick="adminRestaurarProductoAccion('${p.id}')">Restaurar</button>` : ''}
        </div></td>
      </tr>`).join('');
    }
  }
  if (rB.status === 'fulfilled') {
    const d = (rB.value && rB.value.data) || {};
    const reps = Array.isArray(d.reportes) ? d.reportes : (Array.isArray(d) ? d : []);
    reps.forEach(r => {
      const key = 'api-' + r.id;
      if (!REPORTES[key]) {
        const esProd = /producto/i.test(r.tipo_reporte || r.tipo || '');
        const resuelto = /resuelt/i.test(r.estado_reporte || r.estado || '');
        REPORTES[key] = {
          _apiId: r.id,
          // El backend expone `reportadoId` (producto_id | usuario_reportado_id según
          // `tipo`); sin estos ids, adminAccionReporte() caía siempre al fallback local.
          _usuarioId: esProd ? null : (r.reportadoId ?? null),
          _productoId: esProd ? (r.reportadoId ?? null) : null,
          tipo: esProd ? 'Producto' : 'Usuario',
          tipoCls: esProd ? 'badge-blue' : 'badge-orange',
          reportado: r.reportado || r.producto || r.usuario || ('Reporte #' + r.id),
          reportadoPor: r.informante || r.reportadoPor || '—',
          motivo: r.motivo || '',
          estado: resuelto ? 'Resuelto' : 'Pendiente',
          estadoCls: resuelto ? 'badge-green' : 'badge-orange',
          fecha: String(r.fecha_reporte || r.fecha || '').slice(0, 10),
          evidencias: r.evidencia_url ? [absImg(r.evidencia_url)] : [],
          respuesta: r.respuesta_admin || null,
          acciones: esProd ? 'producto' : 'usuario',
        };
      }
    });
    renderAdminReportesTable();
  }
}

async function adminCambiarEstadoUsuario(id, estado) {
  try { await api.adminCambiarEstado(id, estado); showToast(`✅ Usuario ${estado}.`); }
  catch (e) { showToast('⚠️ ' + ((e && e.message) || 'No se pudo cambiar el estado.')); return; }
  try { await cargarAdminTablas(); } catch (e) {}
}

async function adminEliminarUsuarioAccion(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  try { await api.adminEliminarUsuario(id); showToast('✅ Usuario eliminado.'); }
  catch (e) { showToast('⚠️ ' + ((e && e.message) || 'No se pudo eliminar.')); return; }
  try { await cargarAdminTablas(); } catch (e) {}
}

async function adminEliminarProductoAccion(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try { await api.adminEliminarProducto(id); showToast('✅ Producto eliminado.'); }
  catch (e) { showToast('⚠️ ' + ((e && e.message) || 'No se pudo eliminar.')); return; }
  try { await cargarAdminTablas(); } catch (e) {}
}

async function adminRestaurarProductoAccion(id) {
  try { await api.adminRestaurarProducto(id); showToast('✅ Producto restaurado.'); }
  catch (e) { showToast('⚠️ ' + ((e && e.message) || 'No se pudo restaurar.')); return; }
  try { await cargarAdminTablas(); } catch (e) {}
}

async function adminBuscar(q) {
  if (!q || !q.trim()) { try { await cargarAdminTablas(); } catch (e) {} return; }
  try {
    const body = await api.adminBusqueda(q.trim());
    const total = ((body && body.data) || {}).total;
    showToast(`🔎 Búsqueda: ${total ?? '—'} resultados.`);
  } catch (e) { showToast('⚠️ ' + ((e && e.message) || 'Búsqueda fallida.')); }
}

async function adminResponderReporte() {
  const actual = window._reporteActual;
  const textarea = document.querySelector('#rp-respuesta-box .rp-textarea');
  const respuesta = textarea?.value.trim() || '';
  if (!actual || actual._apiId == null) { showToast('⚠️ Reporte local: registrado en esta sesión.'); closeReporte(); return; }
  if (!respuesta) { showToast('⚠️ Escribe una respuesta primero.'); return; }
  try {
    // NOTA: el backend exige {respuesta} en el PATCH resolver; se envía vía apiRequest.
    await apiRequest('/api/admin/reportes/' + actual._apiId + '/resolver', { method: 'PATCH', body: JSON.stringify({ respuesta }) });
    showToast('✅ Reporte resuelto.');
  } catch (e) { showToast('⚠️ ' + ((e && e.message) || 'No se pudo resolver.')); return; }
  closeReporte();
  try { await cargarAdminTablas(); } catch (e) {}
}

async function adminAccionReporte(tipo) {
  const actual = window._reporteActual;
  if (!actual) return;
  try {
    if (tipo === 'banear-usuario' && actual._usuarioId) await api.adminCambiarEstado(actual._usuarioId, 'baneado');
    else if (tipo === 'eliminar-usuario' && actual._usuarioId) await api.adminEliminarUsuario(actual._usuarioId);
    else if (tipo === 'eliminar-producto' && actual._productoId) await api.adminEliminarProducto(actual._productoId);
    else if (tipo === 'eliminar-reporte' && actual._apiId) await api.adminEliminarReporte(actual._apiId);
    else { showToast('⚠️ Acción registrada localmente.'); closeReporte(); return; }
    showToast('✅ Acción aplicada.');
  } catch (e) { showToast('⚠️ ' + ((e && e.message) || 'No se pudo aplicar la acción.')); return; }
  closeReporte();
  try { await cargarAdminTablas(); } catch (e) {}
}

async function enviarReporte() {
  const motivo = document.getElementById('rep-motivo')?.value.trim();
  if (!motivo) { showToast('⚠️ Campo obligatorio: Ingresa el motivo del reporte'); return; }
  if (!reportedProductEvidencia && !reportedProductFile) { showToast('⚠️ Campo obligatorio: Adjunta una foto como evidencia'); return; }

  // Reporte real (multipart `evidencia`) cuando el producto es de la API.
  const pidReal = apiIdDe(reportedProductKey);
  if (pidReal && reportedProductFile) {
    try {
      const fd = new FormData();
      fd.append('tipo', 'Producto');
      fd.append('motivo', motivo);
      fd.append('producto_id', String(pidReal));
      fd.append('evidencia', reportedProductFile);
      await api.crearReporte(fd);
      document.getElementById('reportar-overlay')?.classList.remove('show');
      document.getElementById('rep-motivo').value = '';
      reportedProductFile = null;
      showToast('✅ Reporte enviado correctamente al administrador.');
      try { await cargarNotificaciones(); } catch (e) {}
      return;
    } catch (e) {
      showToast('⚠️ ' + ((e && e.message) || 'No se pudo enviar el reporte.'));
      if (e && e.status === 401) navigate('login');
      return;
    }
  }

  const p = PRODUCTS[reportedProductKey] || { nombre: 'Producto desconocido' };
  const key = 'rep-' + Date.now();
  REPORTES[key] = {
    tipo: 'Producto', tipoCls: 'badge-blue',
    reportedKey: reportedProductKey,
    reportado: `${p.nombre} – ${p.vendedor || 'Desconocido'}`,
    reportadoPor: (currentUser ? currentUser.name : 'Juan_Giraldo') + ' – Comprador',
    motivo: motivo,
    estado: 'Pendiente', estadoCls: 'badge-orange',
    fecha: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
    evidencias: [reportedProductEvidencia],
    respuesta: null,
    acciones: 'producto'
  };

  // Agregar notificación para Admin
  notifications.unshift({
    id: Date.now(),
    tipo: 'reporte',
    desc: `Nuevo reporte sobre "${p.nombre}"`,
    time: 'Ahora',
    read: false
  });
  renderNotifPanel();

  // Actualizar tabla admin si existe
  renderAdminReportesTable();

  document.getElementById('reportar-overlay')?.classList.remove('show');
  showToast('✅ Reporte enviado correctamente al administrador.');
}

function renderAdminReportesTable() {
  const tables = document.querySelectorAll('.admin-table');
  if (tables.length >= 3) {
    const reportesTable = tables[2];
    const tbody = reportesTable.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = Object.entries(REPORTES).map(([key, r]) => {
        return `
          <tr>
            <td><span class="badge ${r.tipoCls}" style="font-size:10px">${r.tipo}</span></td>
            <td style="font-size:12px">${escHtml(r.reportado)}</td>
            <td style="font-size:11px;color:var(--text2)">${escHtml(r.fecha)}</td>
            <td><span class="badge ${r.estadoCls}" style="font-size:10px">${r.estado}</span></td>
            <td><button class="btn btn-ghost btn-sm" style="padding:4px 12px;font-size:11px" onclick="openReporte('${key}')">${r.estado === 'Pendiente' ? 'Responder' : 'Ver'}</button></td>
          </tr>
        `;
      }).join('');
    }
  }
}

// ════════════════════════════════════════════════════════════
// RF85 — Deshabilitar "Agregar al carrito" si agotado
// ════════════════════════════════════════════════════════════

async function openProd(key) {
  const p = PRODUCTS[key]; if (!p) return;
  const stock = STOCK_PRODUCTOS[key] !== undefined ? STOCK_PRODUCTOS[key] : 99;
  const agotado = stock === 0;

  document.getElementById('pd-img-src').src          = p.img;
  document.getElementById('pd-nombre').textContent   = p.nombre;
  document.getElementById('pd-nombre').dataset.key   = key;
  document.getElementById('pd-cat').textContent      = p.cat;
  document.getElementById('pd-precio').textContent   = p.precio;
  document.getElementById('pd-old').textContent      = p.old || '';
  document.getElementById('pd-stock').textContent    = agotado ? '⚠️ Agotado' : `${stock} unidades`;
  document.getElementById('pd-stock').style.color    = agotado ? 'var(--red)' : 'var(--text)';
  document.getElementById('pd-desc-pct').textContent = p.pct || '0%';
  document.getElementById('pd-desc-txt').textContent = p.txt;
  document.getElementById('pd-qty').textContent      = '1';

  // Mostrar el vendedor y configurar follow button (RF102)
  const sellerName = p.vendedor || 'CommerCity Store';
  const sellerAv = document.querySelector('.pd-seller-av');
  const sellerSpan = document.querySelector('.pd-seller span');
  if (sellerAv) sellerAv.textContent = sellerName[0].toUpperCase();
  if (sellerSpan) sellerSpan.textContent = sellerName;
  
  // Agregar o actualizar botón de seguir
  let followBtn = document.getElementById('pd-follow-btn');
  if (!followBtn) {
    const sellerContainer = document.querySelector('.pd-seller');
    if (sellerContainer) {
      followBtn = document.createElement('button');
      followBtn.id = 'pd-follow-btn';
      followBtn.style.marginLeft = 'auto';
      sellerContainer.appendChild(followBtn);
    }
  }
  if (followBtn) {
    followBtn.onclick = () => toggleFollowSeller(sellerName);
    updateFollowButton(sellerName);
  }

  // Estado del botón agregar (RF85)
  const addBtn = document.querySelector('#prod-detail-card .pd-actions .btn-orange');
  if (addBtn) {
    addBtn.disabled = agotado;
    addBtn.textContent = agotado ? 'Sin stock disponible' : 'Agregar al carrito';
    addBtn.style.opacity = agotado ? '0.5' : '1';
    addBtn.style.cursor  = agotado ? 'not-allowed' : 'pointer';
  }

  // Botón reportar
  const rptBtn = document.getElementById('pd-report-btn');
  if (rptBtn) rptBtn.style.display = 'flex';

  document.getElementById('prod-overlay').classList.add('show');

  // Stock en vivo desde la API (detalle usa `imagen_url`, listado `imagen`)
  const pidVivo = apiIdDe(key);
  if (pidVivo) {
    try {
      const [det, stk] = await Promise.allSettled([
        api.producto(pidVivo),
        api.validarStock(pidVivo, parseInt(document.getElementById('pd-qty')?.textContent || '1')),
      ]);
      if (det.status === 'fulfilled') {
        const dp = ((det.value && det.value.data) || {});
        const imgViva = absImg(dp.imagen_url ?? dp.imagen);
        if (imgViva) document.getElementById('pd-img-src').src = imgViva;
        if (dp.descripcion) document.getElementById('pd-desc-txt').textContent = dp.descripcion;
      }
      if (stk.status === 'fulfilled') {
        const sd = ((stk.value && stk.value.data) || {});
        const n = Number(sd.stock ?? sd.disponible ?? sd.cantidad);
        if (Number.isFinite(n)) {
          STOCK_PRODUCTOS[key] = n;
          const agotadoVivo = n === 0;
          document.getElementById('pd-stock').textContent = agotadoVivo ? '⚠️ Agotado' : `${n} unidades`;
          document.getElementById('pd-stock').style.color = agotadoVivo ? 'var(--red)' : 'var(--text)';
          if (addBtn) {
            addBtn.disabled = agotadoVivo;
            addBtn.textContent = agotadoVivo ? 'Sin stock disponible' : 'Agregar al carrito';
            addBtn.style.opacity = agotadoVivo ? '0.5' : '1';
            addBtn.style.cursor  = agotadoVivo ? 'not-allowed' : 'pointer';
          }
        }
      }
    } catch (e) { /* fallback: se conserva el render local */ }
  }

  // Perfil público del vendedor (api.perfilPublico) al abrir el detalle.
  if (p.vendedor_id) {
    try {
      const pb = await api.perfilPublico(p.vendedor_id);
      pintarPerfilVendedor((pb && pb.data) || {}, sellerName);
    } catch (e) { /* fallback: se conserva el nombre del producto */ }
  }
}

// Pinta el bloque de vendedor del detalle con el perfil público real
// (nombre, foto de perfil y biografía de api.perfilPublico).
function pintarPerfilVendedor(pf, nombreFallback) {
  const fila = document.querySelector('.pd-seller');
  const av   = document.querySelector('.pd-seller-av');
  const nm   = document.querySelector('.pd-seller span');
  const nombre = (pf && pf.nombre) || nombreFallback || 'CommerCity Store';
  if (nm) {
    nm.textContent = nombre;
    if (pf && pf.biografia) nm.title = pf.biografia;
    else nm.removeAttribute('title');
  }
  if (av && pf && pf.avatar) {
    const src = absImg(pf.avatar);
    if (src) av.innerHTML = `<img src="${escHtml(src)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
  }
  if (fila) {
    let bio = document.querySelector('.pd-seller-bio');
    if (!bio) {
      bio = document.createElement('div');
      bio.className = 'pd-seller-bio';
      bio.style.cssText = 'padding:0 18px 12px;font-size:12px;line-height:1.5;color:var(--text2)';
      fila.insertAdjacentElement('afterend', bio);
    }
    const texto = (pf && pf.biografia) || '';
    bio.textContent = texto;
    bio.style.display = texto ? 'block' : 'none';
  }
  window._vendedorPerfil = (pf && pf.id != null) ? pf : null;
}

// ════════════════════════════════════════════════════════════
// RF95-100 — Notificaciones funcionales
// ════════════════════════════════════════════════════════════

let notifications = [
  { id:1, tipo:'🛒', desc:'Nueva compra recibida — "Reloj Casio" ha sido vendido', time:'Hace 5 min', read:false },
  { id:2, tipo:'💬', desc:'Nuevo mensaje de Juan — ¿Tienes stock del producto?',   time:'Hace 2 h',  read:false },
  { id:3, tipo:'📦', desc:'Pedido enviado — Audífonos Pro ya está en camino',       time:'1 día',     read:true  },
  { id:4, tipo:'🔒', desc:'Reporte de seguridad — inicio de sesión inusual',        time:'3 días',    read:true  },
];

// Conteo del badge del icono de notificaciones: fuente = api.notifsNoLeidas
// (fallback local con el conteo del panel cuando la API no responde).
let _notifsNoLeidas = null;

function pintarBadgeNoLeidas() {
  // Fuente principal: api.notifsNoLeidas; piso local para réplicas sin servidor.
  const total = Math.max(
    _notifsNoLeidas != null ? _notifsNoLeidas : 0,
    notifications.filter(n => !n.read).length
  );
  document.querySelectorAll('.notif-dot').forEach(d => {
    d.style.display = total > 0 ? 'block' : 'none';
  });
}

async function actualizarBadgeNoLeidas() {
  if (!localStorage.getItem('commercity_token')) {
    _notifsNoLeidas = null;
    pintarBadgeNoLeidas();
    return null;
  }
  try {
    const body = await api.notifsNoLeidas();
    const d = (body && body.data) || {};
    _notifsNoLeidas = Number(d.total_no_leidas ?? d.total ?? 0) || 0;
  } catch (e) { /* se conserva el último conteo conocido */ }
  pintarBadgeNoLeidas();
  return _notifsNoLeidas;
}

function renderNotifPanel() {
  const list   = document.getElementById('notif-list');
  pintarBadgeNoLeidas();
  if (!list) return;
  if (!notifications.length) {
    list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text2);font-size:13px">Sin notificaciones 🎉</div>';
    return;
  }
  list.innerHTML = notifications.map(n => `
    <div class="notif-item" style="${!n.read?'background:rgba(239,153,24,.05)':''}" onclick="clickNotif(${n.id})">
      <div class="notif-icon">${escHtml(n.tipo)}</div>
      <div style="flex:1;min-width:0">
        <div class="notif-text">${escHtml(n.desc)}</div>
        <div class="notif-time">${escHtml(n.time)}</div>
      </div>
      <button onclick="event.stopPropagation();deleteNotif(${n.id})"
        style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px;padding:2px 6px;border-radius:4px;transition:color .12s"
        onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--text3)'">✕</button>
    </div>`).join('');
}

// ── NOTIFICACIONES API ───────────────────────────────────────────
async function cargarNotificaciones() {
  const body = await api.notificaciones();
  const d = (body && body.data) || {};
  const arr = Array.isArray(d.notificaciones) ? d.notificaciones : (Array.isArray(d) ? d : []);
  notifications = arr.map(n => ({
    id: n.id,
    tipo: n.tipo || '🔔',
    desc: n.descripcion || n.desc || '',
    time: n.dias_horas || (n.fecha_hora ? String(n.fecha_hora).slice(0, 16).replace('T', ' ') : 'Ahora'),
    read: n.leida === true,
  }));
  renderNotifPanel();
  return notifications;
}

function toggleNotif() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  panel.classList.toggle('show');
  if (panel.classList.contains('show')) {
    // Marcar todas como leídas en el servidor (fallback local).
    api.marcarTodasLeidas()
      .then(() => {
        _notifsNoLeidas = 0;
        return cargarNotificaciones().catch(() => {});
      })
      .catch(() => {
        notifications.forEach(n => n.read = true);
        _notifsNoLeidas = 0;
        renderNotifPanel();
      });
  }
}

async function deleteNotif(id) {
  try { await api.eliminarNotif(id); }
  catch (e) { /* fallback local */ }
  notifications = notifications.filter(n => n.id !== id);
  if (_notifsNoLeidas != null) _notifsNoLeidas = Math.max(0, _notifsNoLeidas - 1);
  renderNotifPanel();
}

async function clearAllNotifs() {
  try { await api.eliminarTodasNotifs(); }
  catch (e) { /* fallback local */ }
  notifications = [];
  _notifsNoLeidas = 0;
  renderNotifPanel();
}

function clickNotif(id) {
  const n = notifications.find(x => x.id === id);
  if (!n) return;
  n.read = true;
  if (_notifsNoLeidas != null) _notifsNoLeidas = Math.max(0, _notifsNoLeidas - 1);
  api.marcarNotifLeida(id).then(() => actualizarBadgeNoLeidas()).catch(() => {});
  renderNotifPanel();
  document.getElementById('notif-panel')?.classList.remove('show');
  
  if (n.tipo === 'mensajes' || n.tipo === '💬') {
    navigate('mensajes');
  } else if (n.tipo === 'compra' || n.tipo === 'pedido' || n.tipo === '🛒' || n.tipo === '📦') {
    if (currentUser?.role === 'vendedor') navigate('pedidos');
    else navigate('historial');
  } else if (n.tipo === 'en camino' || n.tipo === 'entregado' || n.tipo === '✅') {
    navigate('historial');
  } else if (n.tipo === 'reporte' || n.tipo === '🔒') {
    if (currentUser?.role === 'admin') navigate('admin');
  }
}

// ════════════════════════════════════════════════════════════
// RF116 — Pasarela: solo número y nombre de tarjeta
// ════════════════════════════════════════════════════════════

function formatCardNumber(inp) {
  let v = inp.value.replace(/\D/g,'').slice(0,16);
  inp.value = v.match(/.{1,4}/g)?.join('-') || v;
}

async function abrirPago() {
  if (!cartItems || cartItems.length === 0) return;
  // Total del servidor (resumen del pedido) con fallback al cálculo local.
  let totalStr = fmtCOP(calcCart().total);
  try {
    const body = await api.resumenPedido();
    const d = (body && body.data) || {};
    const t = d.totales || d;
    const totalNum = Number(t.total ?? t.total_pagar ?? t.monto_total);
    if (Number.isFinite(totalNum)) totalStr = fmtCOP(totalNum);
    window._resumenVendedores = d.por_vendedor || [];
  } catch (e) { /* offline: se usa el total local */ }
  const btn  = document.getElementById('pago-btn-total');
  const disp = document.getElementById('pago-total-display');
  if (btn)  btn.textContent  = totalStr;
  if (disp) disp.textContent = totalStr;
  const formEl = document.getElementById('pago-form-state');
  const okEl   = document.getElementById('pago-ok-state');
  if (formEl) formEl.style.display = 'block';
  if (okEl)   okEl.style.display   = 'none';
  const errEl = document.getElementById('pago-error');
  if (errEl) errEl.style.display = 'none';
  
  // Reset rating interface
  const stars = document.querySelectorAll('.stars-rating span');
  stars.forEach(s => { s.textContent = '☆'; s.style.color = 'var(--text3)'; });
  const confirmMsg = document.getElementById('rating-confirm-msg');
  if (confirmMsg) confirmMsg.style.display = 'none';
  
  document.getElementById('pago-overlay').classList.add('show');
}

function cerrarPago(e) {
  if (!e || e.target === document.getElementById('pago-overlay'))
    document.getElementById('pago-overlay').classList.remove('show');
}

async function rateSeller(stars) {
  const starElements = document.querySelectorAll('.stars-rating span');
  starElements.forEach((el, i) => {
    el.textContent = i < stars ? '★' : '☆';
    el.style.color = i < stars ? 'var(--orange)' : 'var(--text3)';
  });
  const confirmMsg = document.getElementById('rating-confirm-msg');
  // Calificación real (exige pedido y vendedor de una compra auténtica).
  const pedidoId = window._ultimoPedidoId != null ? Number(window._ultimoPedidoId) : null;
  const vendedorId = window._ultimoVendedorId != null ? Number(window._ultimoVendedorId) : null;
  if (pedidoId && vendedorId) {
    try {
      await api.calificarVendedor({ pedido_id: pedidoId, vendedor_id: vendedorId, estrellas: stars });
      if (confirmMsg) {
        confirmMsg.textContent = `¡Gracias por calificar con ${stars} estrellas!`;
        confirmMsg.style.display = 'block';
      }
      showToast(`✅ Calificación de ${stars} estrellas registrada.`);
      return;
    } catch (e) {
      showToast('⚠️ ' + ((e && e.message) || 'No se pudo registrar la calificación.'));
      if (e && e.status === 401) navigate('login');
      return;
    }
  }
  if (confirmMsg) {
    confirmMsg.textContent = `¡Gracias por calificar con ${stars} estrellas!`;
    confirmMsg.style.display = 'block';
  }
  showToast(`✅ Calificación de ${stars} estrellas registrada.`);
}

async function confirmarPago() {
  const num    = document.getElementById('pago-numero')?.value.replace(/\D/g,'');
  const nombre = document.getElementById('pago-nombre')?.value.trim();
  const errEl  = document.getElementById('pago-error');
  if (!num || num.length < 16 || !nombre) {
    if (errEl) errEl.style.display = 'block'; return;
  }
  if (errEl) errEl.style.display = 'none';

  // Checkout real: direccion_envio + metodo_pago + tarjeta (RF116/RF118).
  const direccion = document.getElementById('ajustes-dir')?.value || 'Calle 123 # 45-67, Cali';
  let pagoBody = null;
  try {
    pagoBody = await api.confirmarPago({
      direccion_envio: direccion,
      metodo_pago: 'tarjeta',
      numero_tarjeta: num,
      nombre_tarjeta: nombre,
    });
  } catch (e) {
    if (errEl) { errEl.textContent = (e && e.message) || 'Pago rechazado. Verifica los datos.'; errEl.style.display = 'block'; }
    if (e && e.status === 401) navigate('login');
    return;
  }

  const d = (pagoBody && pagoBody.data) || {};
  const totalPagado = Number(d.total ?? d.total_pagar ?? d.monto_total ?? calcCart().total);
  // IDs para calificar al vendedor (calificación exige pedido + vendedor reales).
  window._ultimoPedidoId = d.pedido_id ?? d.pedidoId ?? d.id ?? d.pedido?.id ?? null;
  const pv = window._resumenVendedores || [];
  window._ultimoVendedorId = (pv[0] && (pv[0].vendedor_id ?? pv[0].vendedorId)) ?? null;

  // Refrescar vistas desde la API (carrito vaciado en el servidor).
  try { await refrescarCarritoDesdeAPI(); } catch (e) { cartItems = []; renderCart(); }
  try { await cargarHistorialDesdeAPI(); } catch (e) {}
  try { await renderTiendaStats(); } catch (e) {}
  try { await renderAdminStats(); } catch (e) {}
  try { renderProductsHome(); } catch (e) {}
  try { await cargarNotificaciones(); } catch (e) {}

  // Mostrar éxito
  const formEl = document.getElementById('pago-form-state');
  const okEl   = document.getElementById('pago-ok-state');
  const okTot  = document.getElementById('pago-ok-total');
  if (formEl) formEl.style.display = 'none';
  if (okEl)   okEl.style.display   = 'block';
  if (okTot)  okTot.textContent    = fmtCOP(totalPagado);
  cartItems = [];
  renderCart();
  renderProductsHome(); // Recargar grid para reflejar stock actualizado
  try { await renderAdminStats(); } catch (e) {}
  try { await renderTiendaStats(); } catch (e) {}
}

function descargarComprobante() {
  const txt = 'CommerCity — Comprobante de pago\nFecha: ' + new Date().toLocaleDateString('es-CO') + '\nEstado: APROBADO\n\n¡Gracias por tu compra!';
  const blob = new Blob([txt], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'comprobante-commercity.txt'; a.click();
}

function volverAlInicio() {
  document.getElementById('pago-overlay').classList.remove('show');
  navigate('home');
}

// ════════════════════════════════════════════════════════════
// RF126-130 — Estadísticas de ventas en Mi Tienda
// ════════════════════════════════════════════════════════════

let pedidosVendedor = [
  { id:'PED-001', cliente:'Elena Sanz',    dir:'Carrera 7 # 12-34, Apt 201, Medellín', fecha:'23 Oct, 2026', producto:'TV LG 45 pulgadas', productKey:'audifonos', qty:2, precio:950000,  estado:'En camino' },
  { id:'PED-002', cliente:'Alex Rivera',   dir:'Cll 80 # 45-12, Bogotá',              fecha:'24 Oct, 2026', producto:'MacBook Air',        productKey:'mochila',   qty:1, precio:1299000, estado:'Entregado' },
  { id:'PED-003', cliente:'Marco Rossi',   dir:'Av. El Dorado # 68-10, Bogotá',       fecha:'21 Oct, 2026', producto:'iPad Pro 11"',       productKey:'cuadromin', qty:1, precio:2799000, estado:'Pendiente' },
  { id:'PED-004', cliente:'Julian Thorne', dir:'Cll 10 # 5-20, Cali',                 fecha:'22 Oct, 2026', producto:'iPhone 15 Pro',      productKey:'zapatillas',qty:1, precio:3000000, estado:'Entregado' },
];

let pedidoFiltroActual = 'Todo';

async function renderTiendaStats() {
  // Panel real: statsTienda + ventas + ingresos + validacionTienda (fallback local).
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  try {
    const [statsB, ventasB, ingresosB, validB] = await Promise.all([
      api.statsTienda(),
      api.ventas({ pagina: 1, porPagina: 20 }).catch(() => null),
      api.ingresos({ pagina: 1, porPagina: 5 }).catch(() => null),
      api.validacionTienda().catch(() => null),
    ]);
    const t = ((statsB && statsB.data) || {}).tarjetas || {};
    set('tienda-ventas', Number(t.unidades_vendidas ?? t.total_ventas ?? 0));
    set('tienda-ingresos', fmtCOP(Number(t.total_neto_vendedor ?? 0)));
    set('tienda-comision', fmtCOP(Number(t.total_comision ?? 0)));
    const porEstado = ((statsB && statsB.data) || {}).por_estado || [];
    const cant = (est) => porEstado.filter(e => e.estado === est).reduce((s, e) => s + Number(e.cantidad || 0), 0);
    set('tienda-entregados', cant('Entregado'));
    set('tienda-pendientes', cant('Pendiente'));

    // Historial de ventas e ingresos (RF127, RF128, RF130)
    const vd = (ventasB && ventasB.data) || {};
    const itemsV = Array.isArray(vd.items) ? vd.items : (Array.isArray(vd.ventas) ? vd.ventas : (Array.isArray(vd) ? vd : []));
    const tbody = document.getElementById('tienda-ventas-tbody');
    if (tbody) {
      tbody.innerHTML = itemsV.map(v => {
        const bruto = Number(v.valor_subtotal ?? v.subtotal ?? 0);
        const com = Number(v.monto_comision ?? Math.round(bruto * COMISION_RATE));
        const neto = Number(v.monto_vendedor ?? (bruto - com));
        const est = v.estado_envio || v.estado || 'Pendiente';
        const cls = est === 'Entregado' ? 'badge-green' : (est === 'Cancelado' ? 'badge-red' : 'badge-orange');
        return `<tr>
          <td style="font-weight:600">${escHtml(v.nombre_producto || v.producto || '—')} ×${v.cantidad ?? 1}</td>
          <td>${escHtml(v.nombre_comprador || v.comprador || '—')}</td>
          <td style="color:var(--text2);font-size:11px">${escHtml(v.fecha_pedido || v.fecha || '')}</td>
          <td>${fmtCOP(bruto)}</td>
          <td style="color:var(--red);font-size:11px">${fmtCOP(com)}</td>
          <td style="color:var(--green);font-weight:700">${fmtCOP(neto)}</td>
          <td><span class="badge ${cls}">${est}</span></td>
        </tr>`;
      }).join('') || '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text2)">No hay ventas registradas</td></tr>';
    }

    // Validación de tienda: avisar si la cuenta bancaria está incompleta.
    const val = (validB && validB.data) || null;
    if (val && val.cuentaBancaria && val.cuentaBancaria.completa === false) {
      showToast('⚠️ Completa tu cuenta bancaria para recibir pagos de tus ventas.');
    }
    void ingresosB;
    return;
  } catch (e) {
    if (e && e.status === 401) { navigate('login'); return; }
    /* fallback local */
  }
  renderTiendaStatsLocal();
}

// Niveles de estado de envío (espejo de ESTADO_NIVEL en pedidos.controllers.js):
// el backend solo admite avanzar EXACTAMENTE +1 nivel y devuelve 409 en cualquier
// otra transición (p.ej. Pendiente→Entregado o re-seleccionar el estado actual).
const NIVEL_ESTADO_PEDIDO = { 'Pendiente': 0, 'En camino': 1, 'Entregado': 2 };

async function renderPedidos() {
  // Sincronizar pedidos del vendedor desde api.ventas (fallback: caché local).
  try {
    const body = await api.ventas({ pagina: 1, porPagina: 20 });
    const vd = (body && body.data) || {};
    const itemsV = Array.isArray(vd.items) ? vd.items : (Array.isArray(vd.ventas) ? vd.ventas : (Array.isArray(vd) ? vd : []));
    if (itemsV.length) {
      pedidosVendedor = itemsV.map(v => ({
        // Clave única por LÍNEA de pedido: `referencia_pedido` es por pedido y dos
        // líneas del mismo pedido compartirían id (updatePedidoEstado/openDetallePedido
        // resolvían siempre la primera fila). El sufijo es `dp.id` (detalle).
        id: 'PED-' + v.pedido_id + '-' + v.id,
        _pedidoId: v.pedido_id,
        _detalleId: v.id,
        cliente: v.nombre_comprador || v.comprador || '—',
        // `GET /api/tienda/ventas` no expone direccion_envio ni producto_id: no se
        // inventan valores (dir/productKey quedan solo en las semillas locales).
        fecha: (v.fecha_pedido || '').toString().slice(0, 10),
        producto: v.nombre_producto || v.producto || '—',
        qty: Number(v.cantidad ?? 1),
        precio: Number(v.valor_unitario ?? v.valor_subtotal ?? 0),
        estado: v.estado_envio || v.estado || 'Pendiente',
      }));
    }
  } catch (e) {
    if (e && e.status === 401) { navigate('login'); return; }
    /* fallback local */
  }
  const tbody = document.getElementById('pedidos-tbody');
  if (!tbody) return;
  const data = pedidoFiltroActual === 'Todo' ? pedidosVendedor : pedidosVendedor.filter(p => p.estado === pedidoFiltroActual);
  tbody.innerHTML = data.map(p => {
    const cls = p.estado==='Entregado'?'badge-green':p.estado==='En camino'?'badge-orange':'badge-red';
    const cliente = String(p.cliente || '?');
    const ini = cliente[0] + (cliente.split(' ')[1]?.[0] || '');
    // Solo se ofrece la transición nivel(actual)+1; el resto va `disabled` (409 del backend).
    const nivelActual = NIVEL_ESTADO_PEDIDO[p.estado];
    const nivelSiguiente = nivelActual === undefined ? -1 : nivelActual + 1;
    const opciones = nivelActual === undefined
      ? `<option value="" selected disabled>${escHtml(p.estado || '—')}</option>`
      : Object.keys(NIVEL_ESTADO_PEDIDO).map((e, i) =>
          `<option value="${e}"${e === p.estado ? ' selected' : ''}${i === nivelSiguiente ? '' : ' disabled'}>${e}</option>`
        ).join('');
    return `<tr>
      <td><div class="seller-cell"><div class="seller-av">${escHtml(ini)}</div>${escHtml(cliente)}</div></td>
      <td style="font-size:11px;color:var(--text2);max-width:130px">${escHtml(p.dir || '—')}</td>
      <td style="font-size:11px;color:var(--text2)">${escHtml(p.fecha)}</td>
      <td style="font-size:12px">${escHtml(p.producto)}</td>
      <td style="text-align:center">${p.qty}</td>
      <td><span class="badge ${cls}">${escHtml(p.estado)}</span></td>
      <td style="font-size:12px;color:var(--text2)">${fmtCOP(p.precio)}</td>
      <td style="font-weight:600">${fmtCOP(p.precio*p.qty)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <select onchange="updatePedidoEstado('${escHtml(p.id)}',this.value)"
            style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-size:11px;color:var(--text);font-family:var(--ui);cursor:pointer;outline:none">
            ${opciones}
          </select>
          <button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:11px" onclick="openDetallePedido('${escHtml(p.id)}')">Detalle</button>
        </div>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text2)">No hay pedidos</td></tr>';
}

function filtroPedido(estado, el) {
  pedidoFiltroActual = estado;
  document.querySelectorAll('.pedidos-ftab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderPedidos();
}

async function updatePedidoEstado(id, estado) {
  // `id` es la clave única por línea ('PED-<pedido_id>-<detalle_id>'), por lo que
  // dos líneas del mismo pedido ya no resuelven la primera fila por accidente.
  const p = pedidosVendedor.find(x => x.id === id);
  if (!p) return;
  // Estado real en el servidor (vendedor: "En camino" | "Entregado").
  if (p._pedidoId) {
    const nivelActual = NIVEL_ESTADO_PEDIDO[p.estado];
    if (nivelActual === undefined || NIVEL_ESTADO_PEDIDO[estado] !== nivelActual + 1) {
      showToast('⚠️ Transición inválida: el servidor solo admite avanzar un nivel.');
      return;
    }
    try {
      await api.actualizarEstadoPedido(p._pedidoId, estado, p._detalleId);
    } catch (e) {
      showToast(`⚠️ ` + ((e && e.message) || 'No se pudo actualizar el estado.'));
      if (e && e.status === 401) navigate('login');
      return;
    }
    await renderPedidos();
    await renderTiendaStats().catch(() => {});
    showToast(`✅ Estado actualizado a "${estado}"`);
    return;
  }
  p.estado = estado;
  renderPedidos();
  renderTiendaStatsLocal();
  notifications.unshift({ id:Date.now(), tipo: 'pedido', desc: `Pedido ${id} actualizado a "${estado}"`, time:'Ahora', read:false });
  renderNotifPanel();
  showToast(`✅ Estado actualizado a "${estado}"`);
}

function openDetallePedido(id) {
  // `id` = clave única por línea ('PED-<pedido_id>-<detalle_id>').
  const p = pedidosVendedor.find(x => x.id === id);
  if (!p) return;
  
  const overlay = document.getElementById('detalle-overlay');
  const panel = overlay.querySelector('.detalle-panel');
  const total = p.precio * p.qty;
  const cls = p.estado==='Entregado'?'badge-green':p.estado==='En camino'?'badge-orange':'badge-red';
  const cliente = String(p.cliente || '?');
  
  panel.innerHTML = `
    <div class="detalle-title">Detalle del pedido ${escHtml(p.id)} <span class="badge ${cls}" style="font-size:11px;margin-left:8px">${escHtml(p.estado)}</span></div>
    <div class="detalle-date">Fecha: ${escHtml(p.fecha)}</div>
    <div class="btn-seller-row">
      <div class="seller-av">${escHtml(cliente[0] || '?')}</div>
      <div><div style="font-size:13px;font-weight:600">${escHtml(cliente)}</div></div>
    </div>
    <div class="detalle-lbl">Comprador</div><div class="detalle-val">${escHtml(cliente)}</div>
    <div class="detalle-lbl">Dirección de envío</div><div class="detalle-val">${escHtml(p.dir || '—')}</div>
    <div class="detalle-lbl">Producto solicitado</div><div class="detalle-val">${escHtml(p.producto)}<br><span style="color:var(--text2)">Cantidad: ${p.qty} unidades</span></div>
    <div class="detalle-total">
      <span class="detalle-total-lbl">Precio total del pedido</span>
      <span class="detalle-total-val">${fmtCOP(total)}</span>
    </div>
    <button class="btn btn-ghost btn-full" onclick="closeDetalle()">Cerrar</button>
  `;
  overlay.classList.add('show');
}

// ── VENDEDOR / TIENDA API ──────────────────────────────────────────
// CRUD de productos (multipart `imagen`), cuenta bancaria y panel de tienda.
let editingProductId = null;

function leerFormProducto() {
  const v = (id) => document.getElementById(id)?.value.trim() ?? '';
  return {
    nombre: v('prod-nombre'),
    descripcion: v('prod-descripcion'),
    precio: v('prod-precio'),
    stock: v('prod-stock'),
    estado: document.getElementById('prod-estado')?.value || 'Disponible',
    descuento: v('prod-descuento'),
    categoria: v('prod-categoria'),
    imagenFile: document.getElementById('prod-imagen')?.files?.[0] || null,
  };
}

async function handleAddProduct() {
  const f = leerFormProducto();
  if (!f.nombre || !f.precio || !f.stock) { showToast('⚠️ Completa nombre, precio y stock.'); return; }
  const fd = new FormData();
  fd.append('nombre', f.nombre);
  fd.append('descripcion', f.descripcion);
  fd.append('precio', f.precio);
  fd.append('stock', f.stock);
  if (f.categoria) fd.append('categoria', f.categoria);
  if (f.descuento !== '') fd.append('descuento_porcentaje', f.descuento);
  if (f.imagenFile) fd.append('imagen', f.imagenFile);
  try {
    if (editingProductId) await api.editarProducto(editingProductId, fd);
    else await api.crearProducto(fd);
    showToast(editingProductId ? '✅ Producto actualizado.' : '✅ Producto creado.');
    editingProductId = null;
    document.getElementById('modal-producto')?.classList.remove('show');
    await cargarMisProductos();
    await cargarCatalogoDesdeAPI().catch(() => {});
  } catch (e) {
    showToast('⚠️ ' + ((e && e.message) || 'No se pudo guardar el producto.'));
    if (e && e.status === 401) navigate('login');
  }
}

function handleEditProduct(id) {
  editingProductId = id;
  const p = (window.MIS_PRODUCTOS || []).find(x => String(x.id) === String(id));
  if (p) {
    const set = (fid, val) => { const el = document.getElementById(fid); if (el) el.value = val ?? ''; };
    set('prod-nombre', p.nombre);
    set('prod-descripcion', p.descripcion);
    set('prod-precio', p.precio);
    set('prod-stock', p.stock);
    set('prod-categoria', p.categoria);
    const title = document.querySelector('#modal-producto .modal-title');
    if (title) title.textContent = 'Editar Producto';
  }
  document.getElementById('modal-producto')?.classList.add('show');
}

async function cargarMisProductos() {
  const body = await api.misProductos();
  const d = (body && body.data) || {};
  const list = Array.isArray(d.productos) ? d.productos : (Array.isArray(d) ? d : []);
  window.MIS_PRODUCTOS = list;
  const grid = document.getElementById('vendedor-grid');
  if (grid && list.length) {
    grid.innerHTML = list.map(p => {
      const img = absImg(p.imagen ?? p.imagen_url);
      const precioNum = Number(p.precio) || 0;
      const descPct = Number(p.descuento_porcentaje ?? 0) || 0;
      const final = descPct > 0 ? Math.round(precioNum * (1 - descPct / 100)) : precioNum;
      return `<div class="feed-card">
        ${img ? `<img src="${escHtml(imgSrcSafe(img))}" alt=""/>` : ''}
        <div class="feed-edit-btn" onclick="handleEditProduct('${p.id}')">✏</div>
        <div class="feed-card-body"><div class="feed-card-name">${escHtml(p.nombre || 'Producto')}</div>
        ${descPct > 0 ? `<div class="feed-card-old">${fmtCOP(precioNum)}</div>` : ''}
        <div class="feed-card-price">${fmtCOP(final)}</div></div>
      </div>`;
    }).join('');
  }
  return list;
}

// ── PRECARGA (SOLO LECTURA) DE CUENTA BANCARIA ─────────────────────
// Al abrir Tienda (bank-*) o Ajustes-admin (admin-bank-*) se LEEN los datos
// guardados con api.cuentaBancaria() / api.adminCuentaBancaria() y se pintan
// en el formulario. No se guarda nada aquí: el guardado sigue en guardarCuenta*.
function setSelectConValor(id, valor) {
  const sel = document.getElementById(id);
  if (!sel || valor == null || valor === '') return;
  const v = String(valor).trim();
  let opt = Array.from(sel.options).find(o => o.value === v || o.textContent.trim() === v);
  if (!opt) {
    // El banco puede no estar en la lista fija del select: se agrega para no perderlo.
    opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  }
  sel.value = v;
}

function pintarCuentaBancaria(prefijo, datos) {
  if (!datos) return false;
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val != null && val !== '') el.value = String(val);
  };
  set(prefijo + '-titular', datos.titular_nombre);
  setSelectConValor(prefijo + '-banco', datos.banco);
  // El backend guarda tipo_cuenta como "ahorros"|"corriente"; el select usa etiquetas.
  const tipo = String(datos.tipo_cuenta || '').toLowerCase();
  setSelectConValor(prefijo + '-tipo',
    tipo.startsWith('corr') ? 'Corriente' : (tipo.startsWith('ahorr') ? 'Ahorros' : datos.tipo_cuenta));
  set(prefijo + '-numero', datos.numero_cuenta);
  return true;
}

async function precargarCuentaBancaria() {
  const body = await api.cuentaBancaria();
  const d = (body && body.data) || {};
  return d.registrado === true ? pintarCuentaBancaria('bank', d.datos) : false;
}

async function precargarCuentaAdmin() {
  const body = await api.adminCuentaBancaria();
  const d = (body && body.data) || {};
  return d.registrado === true ? pintarCuentaBancaria('admin-bank', d.datos) : false;
}

function leerCuentaBancaria(prefijo) {
  const v = (id) => document.getElementById(id)?.value.trim() ?? '';
  const tipoRaw = v(prefijo + '-tipo') || document.getElementById(prefijo + '-tipo')?.value || '';
  const tipo = /corriente/i.test(tipoRaw) ? 'corriente' : (/ahorro/i.test(tipoRaw) ? 'ahorros' : tipoRaw.toLowerCase());
  return {
    titular_nombre: v(prefijo + '-titular'),
    banco: document.getElementById(prefijo + '-banco')?.value.trim() || v(prefijo + '-banco'),
    tipo_cuenta: tipo,
    numero_cuenta: v(prefijo + '-numero').replace(/\D/g, ''),
  };
}

async function guardarCuentaBancaria() {
  const datos = leerCuentaBancaria('bank');
  if (!datos.titular_nombre || !datos.banco || !datos.numero_cuenta) {
    showToast('⚠️ Completa titular, banco y número de cuenta.'); return;
  }
  // El placeholder del select ("Seleccionar tipo") no es un valor válido:
  // el backend responde 400 por z.enum(["ahorros","corriente"]).
  if (!/^(ahorros|corriente)$/.test(datos.tipo_cuenta || '')) {
    showToast('⚠️ Selecciona el tipo de cuenta (Ahorros o Corriente).'); return;
  }
  try {
    await api.guardarCuentaBancaria(datos);
    showToast('✅ Cuenta bancaria guardada de forma segura.');
  } catch (e) {
    showToast('⚠️ ' + ((e && e.message) || 'No se pudo guardar la cuenta.'));
    if (e && e.status === 401) navigate('login');
  }
}

async function guardarCuentaAdmin() {
  const datos = leerCuentaBancaria('admin-bank');
  if (!datos.titular_nombre || !datos.banco || !datos.numero_cuenta) {
    showToast('⚠️ Completa titular, banco y número de cuenta.'); return;
  }
  // Mismo control que guardarCuentaBancaria: el placeholder no pasa el z.enum del backend.
  if (!/^(ahorros|corriente)$/.test(datos.tipo_cuenta || '')) {
    showToast('⚠️ Selecciona el tipo de cuenta (Ahorros o Corriente).'); return;
  }
  try {
    await api.adminGuardarCuentaBancaria(datos);
    showToast('✅ Cuenta de CommerCity guardada.');
  } catch (e) {
    showToast('⚠️ ' + ((e && e.message) || 'No se pudo guardar la cuenta.'));
    if (e && e.status === 401) navigate('login');
  }
}

// ════════════════════════════════════════════════════════════
// TOAST global
// ════════════════════════════════════════════════════════════

function showToast(msg) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--bg2);border:1px solid var(--orange);border-radius:12px;padding:12px 22px;font-size:13px;color:var(--text);z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:opacity .3s;pointer-events:none;white-space:nowrap';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ════════════════════════════════════════════════════════════
// Render al navegar
// ════════════════════════════════════════════════════════════

let currentCategoryFilter = 'Todos';

function renderProductsHome(customList = null) {
  const grid = document.getElementById('home-prod-grid');
  if (!grid) return;
  
  const listToRender = customList || Object.entries(PRODUCTS).map(([key, value]) => ({ key, ...value }));
  
  grid.innerHTML = listToRender.map(p => {
    const stock = STOCK_PRODUCTOS[p.key] !== undefined ? STOCK_PRODUCTOS[p.key] : 99;
    const isAgotado = stock === 0;
    const oldPriceHtml = p.old ? `<div class="prod-old">${p.old}</div>` : '';
    const discountHtml = p.pct && p.pct !== '0%' ? `<span class="prod-badge">${p.pct} desc.</span>` : '';
    const agotadoLabel = isAgotado ? `<span class="prod-badge" style="background:var(--red);color:#fff">AGOTADO</span>` : '';
    
    return `
      <div class="prod-card" onclick="openProd('${p.key}')" style="${isAgotado ? 'opacity: 0.75;' : ''}">
        <div class="prod-img">
          <img src="${escHtml(imgSrcSafe(p.img))}" alt=""/>
          ${discountHtml}
          ${agotadoLabel}
        </div>
        <div class="prod-body">
          <div class="prod-name">${escHtml(p.nombre)}</div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:4px">Vendedor: ${escHtml(p.vendedor || 'CommerCity Store')}</div>
          ${oldPriceHtml}
          <div class="prod-price">${p.precio}</div>
        </div>
      </div>
    `;
  }).join('') || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text2)">No se encontraron productos.</div>';
}

async function filtrarProductos() {
  const q = document.getElementById('search-input')?.value.trim().toLowerCase() || '';
  const cat = document.getElementById('cat-filter')?.value || 'Todos';

  // Búsqueda en servidor cuando hay catálogo API (filtros nombre/categoria).
  if (CATALOGO_API_OK && (q || (cat && cat !== 'Todos' && cat !== 'Categoría'))) {
    try {
      const body = await api.productos({
        ...(q ? { nombre: q } : {}),
        ...(cat && cat !== 'Todos' && cat !== 'Categoría' ? { categoria: cat } : {}),
      });
      const d = (body && body.data) || {};
      const list = Array.isArray(d.productos) ? d.productos : [];
      if (list.length || q || cat) {
        renderProductsHome(list.map(p => ({ key: String(p.id), ...mapProductoAPI(p) })));
        return;
      }
    } catch (e) { /* fallback local */ }
  }
  
  const filtered = Object.entries(PRODUCTS).map(([key, value]) => ({ key, ...value })).filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(q) || 
                          p.cat.toLowerCase().includes(q) || 
                          (p.vendedor && p.vendedor.toLowerCase().includes(q));
    const matchesCat = (cat === 'Todos' || p.cat === cat);
    return matchesSearch && matchesCat;
  });
  
  renderProductsHome(filtered);
}

// Categorías del filtro del catálogo desde api.categorias (reemplaza la lista fija).
// Si la API no responde se conservan las opciones estáticas del select.
async function cargarCategoriasFiltro() {
  const sel = document.getElementById('cat-filter');
  if (!sel) return null;
  try {
    const body = await api.categorias();
    const d = (body && body.data) || {};
    const cats = Array.isArray(d) ? d : (Array.isArray(d.categorias) ? d.categorias : []);
    const nombres = cats
      .map(c => (typeof c === 'string' ? c : (c && (c.nombre || c.name)) || ''))
      .map(s => String(s).trim())
      .filter(Boolean);
    if (!nombres.length) return null;
    const previo = sel.value || 'Todos';
    sel.innerHTML = '<option value="Todos">Todas las categorías</option>' +
      nombres.map(n => `<option value="${escHtml(n)}">${escHtml(n)}</option>`).join('');
    sel.value = Array.from(sel.options).some(o => o.value === previo) ? previo : 'Todos';
    const txt = document.getElementById('cat-selected-text');
    if (txt && sel.value !== previo) txt.textContent = sel.value === 'Todos' ? 'Categoría' : sel.value;
    return nombres;
  } catch (e) { return null; }
}

function filtrarPorCategoria(cat) {
  const catText = document.getElementById('cat-selected-text');
  if (catText) {
    catText.textContent = cat === 'Todos' ? 'Categoría' : cat;
  }
  filtrarProductos();
}

document.addEventListener('DOMContentLoaded', () => {
  // Restaurar sesión JWT (si existe) y precargar datos vivos con fallback local.
  try {
    const u = getSessionUser();
    if (u && localStorage.getItem('commercity_token')) {
      applySessionToUI(u);
      api.me().then(body => {
        const nu = saveSession(body) || getSessionUser();
        if (nu) applySessionToUI(nu);
      }).catch(() => {});
    }
  } catch (e) {}
  renderNotifPanel();
  renderProductsHome();
  renderAdminStats();
  cargarCatalogoDesdeAPI().catch(() => {});
  cargarCategoriasFiltro().catch(() => {});
  if (localStorage.getItem('commercity_token')) {
    refrescarCarritoDesdeAPI().catch(() => {});
    cargarNotificaciones().catch(() => {});
    actualizarBadgeNoLeidas().catch(() => {});
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'reset-p1') checkPasswordStrength(e.target.value);
});
