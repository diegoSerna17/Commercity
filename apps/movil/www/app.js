let currentAdminTarget = null;
/* =========================================================
   COMMERCITY — app.js (Complete Rewrite)
   ========================================================= */
/* =========================================================
   COMMERCITY — app.js (Complete Rewrite)
   ========================================================= */

let ipcRenderer;
try { ipcRenderer = require('electron').ipcRenderer; } catch(e) {}

const AUTH_PAGES = ['login','registro','recuperar','restablecer','terminos'];
const APP_PAGES  = ['home','carrito','perfil','tienda','pedidos','historial','ajustes','mensajes','chat','admin','ajustes-admin'];

let PRODUCTS = {};
/* Catálogo local de contingencia (solo si la API no responde). */
const FALLBACK_PRODUCTS = {
  watch:   { name:'Reloj Elitret Gold',    cat:'Relojes',     price:345000, stock:18, disc:0,  img:'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&q=80', vendor:'Juan_Giraldo', desc:'Elegante reloj dorado de colección limitada. Ideal para ocasiones especiales o como regalo de lujo.' },
  sneaker: { name:'Zapatos Deportivos',    cat:'Calzado',     price:79000,  stock:45, disc:20, img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',  vendor:'Juan_Giraldo', desc:'Zapatillas de alto rendimiento con amortiguación avanzada, ideales para competencias de media distancia. Diseño ergonómico y materiales transpirables.' },
  earbuds: { name:'Auriculares Studio Pro',cat:'Tecnología',  price:388000, stock:12, disc:15, img:'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',  vendor:'Juan_Giraldo', desc:'Auriculares inalámbricos con cancelación activa de ruido y calidad de sonido studio.' },
  backpack:{ name:'Mochila City Stealth',  cat:'Accesorios',  price:79000,  stock:30, disc:0,  img:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80', vendor:'Juan_Giraldo', desc:'Mochila urbana resistente al agua, con compartimentos para laptop y accesorios.' },
  cam1: { name:'Cámara DSLR Pro', cat:'Tecnología', price:2500000, stock:5, disc:0, img:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80', vendor:'FotoMundo', desc:'Cámara profesional DSLR para fotografía de alta calidad.' },
  lentes1: { name:'Gafas de Sol Clásicas', cat:'Accesorios', price:120000, stock:20, disc:10, img:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80', vendor:'StyleCo', desc:'Gafas de sol con protección UV400 y diseño clásico.' },
  reloj2: { name:'Smartwatch V2', cat:'Tecnología', price:450000, stock:15, disc:0, img:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', vendor:'TechHub', desc:'Reloj inteligente con monitor de ritmo cardíaco y notificaciones.' },
  zapatos2: { name:'Tenis Urbanos', cat:'Calzado', price:180000, stock:35, disc:0, img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', vendor:'ZapaTrend', desc:'Tenis cómodos para el uso diario en la ciudad.' },
  bolso2: { name:'Bolso de Cuero', cat:'Accesorios', price:350000, stock:8, disc:0, img:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', vendor:'LeatherCraft', desc:'Bolso de cuero genuino hecho a mano.' },
  audifonos2: { name:'Auriculares In-Ear', cat:'Tecnología', price:299000, stock:25, disc:10, img:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', vendor:'AudioMaster', desc:'Auriculares in-ear con sonido estéreo y bajos profundos.' }
};

/* Mapeo API -> UI: {name,cat,price,stock,disc,img:API_URL+imagen,vendor,desc} */
function mapProductoAPI(p) {
  const imgRel = p.imagen || p.imagen_url || '';
  const cat = (typeof p.categoria === 'string') ? p.categoria
    : ((p.categoria && p.categoria.nombre) || p.categoria_nombre || 'General');
  return {
    id: p.id,
    name: p.nombre || 'Producto',
    cat: cat,
    price: Number(p.precio) || 0,
    stock: Number(p.stock) || 0,
    disc: Number(p.descuento_porcentaje ?? p.descuento ?? 0) || 0,
    img: imgRel ? (String(imgRel).startsWith('http') ? imgRel : apiBaseUrl() + imgRel) : '',
    vendor: p.vendedor || p.vendedor_nombre || 'Vendedor',
    vendorId: p.vendedor_id,
    desc: p.descripcion || 'Sin descripción.'
  };
}

async function cargarCatalogoDesdeAPI() {
  if (!apiReady()) {
    if (!Object.keys(PRODUCTS).length) PRODUCTS = { ...FALLBACK_PRODUCTS };
    renderHomeGrid();
    return;
  }
  try {
    const body = await api.productos({ page: 1, limit: 24 });
    const raw = body.data;
    const lista = Array.isArray(raw) ? raw : (raw && (raw.productos || raw.items || raw.data)) || [];
    if (!lista.length) throw new Error('empty');
    const next = {};
    lista.forEach(p => { next[String(p.id)] = mapProductoAPI(p); });
    PRODUCTS = next;
  } catch (e) {
    if (!Object.keys(PRODUCTS).length) PRODUCTS = { ...FALLBACK_PRODUCTS };
    toast('⚠️ Sin conexión con la API: catálogo local');
  }
  renderHomeGrid();
  const tabMis = document.getElementById('tab-mis-prod');
  if (tabMis && tabMis.classList.contains('active')) renderMisProductos();
}

function productCardHTML(key, p, withEdit) {
  const badge = (p.disc > 0) ? `<div class="prod-badge disc-badge">-${p.disc}%</div>` : '';
  const old = (p.disc > 0) ? `<div class="prod-price-old">${fmtCOP(Math.round(p.price / (1 - p.disc / 100)))}</div>` : '';
  const edit = withEdit ? `<button class="prod-edit-btn seller-only" onclick="event.stopPropagation(); openEditProductModal('${escAttr(key)}')" title="Editar producto">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
  </button>` : '';
  const img = p.img ? `<img src="${escAttr(p.img)}" alt="${escAttr(p.name)}" class="prod-img" style="object-fit:cover;" />`
    : `<div style="width:100%;aspect-ratio:1;background:var(--bg-input);display:flex;align-items:center;justify-content:center;font-size:48px;">📦</div>`;
  return `<div class="prod-card" style="animation:fadeIn 0.3s ease;" onclick="openProductDetail('${escAttr(key)}')">
    ${badge}${edit}${img}
    <div class="prod-info"><div class="prod-name">${escAttr(p.name)}</div>${old}<div class="prod-price">${fmtCOP(p.price)}</div></div>
  </div>`;
}

function renderHomeGrid() {
  const grid = document.getElementById('home-prod-grid');
  if (!grid) return;
  const entries = Object.entries(PRODUCTS);
  if (!entries.length) {
    grid.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);">Sin productos disponibles</div>';
    return;
  }
  grid.innerHTML = entries.map(([key, p]) => productCardHTML(key, p, false)).join('');
}

async function renderMisProductos() {
  const grid = document.getElementById('perfil-prod-grid');
  if (!grid) return;
  let cards = [];
  if (apiReady() && localStorage.getItem('commercity_token')) {
    try {
      const body = await api.misProductos();
      const raw = body.data;
      const lista = Array.isArray(raw) ? raw : (raw && (raw.productos || raw.items || raw.data)) || [];
      cards = lista.map(p => {
        const m = mapProductoAPI(p);
        const key = (m.id != null) ? String(m.id) : null;
        if (key) PRODUCTS[key] = m;
        return key ? productCardHTML(key, m, true) : '';
      });
    } catch (e) { cards = []; }
  }
  if (!cards.length) cards = Object.entries(PRODUCTS).map(([key, p]) => productCardHTML(key, p, true));
  grid.innerHTML = cards.join('') || '<div style="text-align:center;padding:32px;color:var(--text-muted);">Aún no publicas productos</div>';
}

/* ORDER_DATA (mock del modal de pedido) ELIMINADO: openOrderDetail() ahora
   resuelve el pedido con api.historialCompras + api.ventas (ver más abajo). */

let cart = [];        // espejo local [{ key, qty, producto_id }]
let cartServer = [];  // líneas crudas del servidor
// Cache local de SOLO LECTURA del carrito (fallback offline, residual REVIEW
// 2026-09-28). La fuente de verdad sigue siendo el servidor: saveCart() solo se
// invoca tras una carga exitosa de la API y este cache JAMAS se envia al backend.
function saveCart() {
  try {
    localStorage.setItem('commercity_cart', JSON.stringify({ v: 2, cart, cartServer }));
  } catch (e) { /* sin storage: seguir sin cache */ }
}
function loadCartFallback() {
  cart = [];
  cartServer = [];
  try {
    const raw = localStorage.getItem('commercity_cart');
    if (!raw) return;
    const d = JSON.parse(raw);
    if (!d || d.v !== 2 || !Array.isArray(d.cart)) return;
    cart = d.cart;
    cartServer = Array.isArray(d.cartServer) ? d.cartServer : [];
  } catch (e) { /* cache corrupto: ignorar */ }
}
let pdQty = 1;
let pdKey = null;

let isSeller = false;
let isAdmin = false;

function setRole(seller, admin = false) {
  isSeller = seller;
  isAdmin = admin;
  if (isSeller) {
    document.body.classList.add('role-seller');
  } else {
    document.body.classList.remove('role-seller');
  }
  if (isAdmin) {
    document.body.classList.add('role-admin');
  } else {
    document.body.classList.remove('role-admin');
  }
}

/* =========================================================
   Integración API CommerCity — RAMA móvil (2026-09-27)
   Los mocks locales fueron reemplazados por llamadas JWT
   reales (api.js). El servidor es la fuente de verdad.
   ========================================================= */
let currentReportTarget = null;   // { tipo:'Producto'|'Usuario', id }
let currentChatUserId = null;     // destinatario del chat abierto
let currentRatingContext = null;  // { pedido_id, vendedor_id }
let HISTORIAL_LINEAS = [];        // líneas de api.historialCompras (pedido_id, detalle_id, vendedor_id)
let VENTAS_LINEAS = [];           // líneas de api.ventas del vendedor autenticado
let MAPA_VENDEDORES = {};         // nombre normalizado de vendedor -> usuario id
let MAPA_VENDEDORES_CARGADO = false;
let MAPA_DIRECTORIO_CARGADO = false;
let CHAT_LISTA = [];              // filas reales del listado de mensajes
let CHAT_FALLBACK_HTML = null;    // HTML estático de page-mensajes (fallback offline)

function apiReady() { return (typeof api !== 'undefined'); }
function apiBaseUrl() { try { return (typeof API_URL !== 'undefined' && API_URL) || 'http://10.0.2.2:3000'; } catch (e) { return 'http://10.0.2.2:3000'; } }
function apiErrorMessage(err) {
  if (!err) return 'Error desconocido';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  return 'Error HTTP ' + (err.status || 'desconocido');
}
function currentRoles() {
  try { return JSON.parse(localStorage.getItem('commercity_roles') || '[]'); } catch (e) { return []; }
}
function getCompradorId() {
  const v = Number(localStorage.getItem('commercity_user_id'));
  return (Number.isInteger(v) && v > 0) ? v : null;
}
function saveSessionFromAuth(data) {
  if (!data) return;
  if (data.token) localStorage.setItem('commercity_token', data.token);
  const u = data.user || data.usuario || {};
  if (u.id != null) localStorage.setItem('commercity_user_id', String(u.id));
  const nombre = u.nombre_completo || u.nombre || '';
  if (nombre) localStorage.setItem('commercity_user', nombre);
  if (u.email) localStorage.setItem('commercity_email', u.email);
  const roles = Array.isArray(u.roles) ? u.roles : (u.rol ? [u.rol] : []);
  applyRoles(roles);
  localStorage.setItem('commercity_logged_in', 'true');
  updateProfileUI();
}
function applyRoles(roles) {
  const list = Array.isArray(roles) ? roles : [];
  localStorage.setItem('commercity_roles', JSON.stringify(list));
  const seller = list.includes('vendedor');
  const admin = list.includes('administrador');
  localStorage.setItem('commercity_is_seller', String(seller));
  localStorage.setItem('commercity_is_admin', String(admin));
  setRole(seller, admin);
}
function clearSession() {
  ['commercity_token','commercity_user_id','commercity_roles','commercity_logged_in',
   'commercity_is_seller','commercity_is_admin','commercity_rem_pass'].forEach(k => {
    try { localStorage.removeItem(k); } catch (e) {}
  });
}
function fmtCOP(n) { return '$' + Number(n || 0).toLocaleString('es-CO'); }

/* ---- Helpers de render (estados, avatares, escape) ---- */
function claveEstado(est) {
  const e = String(est || '').toLowerCase();
  if (e.includes('entreg')) return 'entregado';
  if (e.includes('camino') || e.includes('ruta')) return 'camino';
  if (e.includes('cancel')) return 'cancelado';
  return 'pendiente';
}
function claseBadge(est) {
  const k = claveEstado(est);
  return k === 'entregado' ? 'badge-green' : (k === 'camino' ? 'badge-orange' : 'badge-red');
}
function normalizarNombre(s) { return String(s == null ? '' : s).trim().toLowerCase(); }
function escAttr(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function filaVacia(colspan, texto) {
  return `<tr><td colspan="${colspan}" style="text-align:center;padding:26px 12px;color:var(--text-muted);">${texto}</td></tr>`;
}
function letraAvatar(nombre) {
  const n = String(nombre || '').trim();
  return (n ? n.charAt(0) : '?').toUpperCase();
}
function colorAvatar(nombre) {
  const colores = ['#7c3aed', '#0891b2', '#be185d', '#374151', '#f59e0b', '#22c55e', '#3b82f6'];
  const n = String(nombre || '');
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return colores[h % colores.length];
}
function horaCorta(fecha) {
  try { return new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return String(fecha || ''); }
}

/* ---- Resolución de ids ----
   api.historialCompras devuelve el nombre del vendedor pero NO su id, así que
   se mapea nombre -> id con /api/vendedores (y /api/usuarios/directorio como
   respaldo). El catálogo en memoria se usa como último recurso. */
function mergeUsuariosAlMapa(lista, campoNombre) {
  (Array.isArray(lista) ? lista : []).forEach(u => {
    if (!u) return;
    const id = u.id ?? u.usuario_id;
    const nom = u[campoNombre] || u.nombre || u.nombre_completo;
    if (id != null && nom) MAPA_VENDEDORES[normalizarNombre(nom)] = Number(id);
  });
}

function dataLista(raw, claves) {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  for (const k of claves) if (Array.isArray(raw[k])) return raw[k];
  return [];
}

async function cargarMapaVendedores(conDirectorio) {
  // Catálogo en memoria (vendorId real de /api/productos): sin llamada de red.
  Object.values(PRODUCTS).forEach(p => {
    if (p && p.vendorId != null && p.vendor) MAPA_VENDEDORES[normalizarNombre(p.vendor)] = Number(p.vendorId);
  });
  if (!apiReady() || !localStorage.getItem('commercity_token')) return MAPA_VENDEDORES;
  if (!MAPA_VENDEDORES_CARGADO) {
    MAPA_VENDEDORES_CARGADO = true;
    try {
      const r = await api.vendedores();
      mergeUsuariosAlMapa(dataLista(r.data, ['vendedores', 'items', 'data']), 'nombre');
    } catch (e) { MAPA_VENDEDORES_CARGADO = false; }
  }
  if (conDirectorio && !MAPA_DIRECTORIO_CARGADO) {
    MAPA_DIRECTORIO_CARGADO = true;
    try {
      const r = await api.directorio();
      mergeUsuariosAlMapa(dataLista(r.data, ['usuarios', 'items', 'data']), 'nombre_completo');
    } catch (e) { MAPA_DIRECTORIO_CARGADO = false; }
  }
  return MAPA_VENDEDORES;
}

/* Último recurso: el vendedor de la línea se deduce del producto del catálogo. */
function vendedorIdPorProducto(nombreProducto) {
  const k = normalizarNombre(nombreProducto);
  if (!k) return null;
  const hit = Object.values(PRODUCTS).find(p => p && p.vendorId != null && normalizarNombre(p.name) === k);
  return hit ? Number(hit.vendorId) : null;
}

async function resolverVendedorId(nombre) {
  const k = normalizarNombre(nombre);
  if (!k) return null;
  await cargarMapaVendedores(false);
  if (MAPA_VENDEDORES[k] != null) return MAPA_VENDEDORES[k];
  await cargarMapaVendedores(true);
  return MAPA_VENDEDORES[k] != null ? MAPA_VENDEDORES[k] : null;
}

/* ---- Cargadores de secciones (llamadas reales, fallan en silencio) ---- */
async function cargarTienda() {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return;
  try {
    const s = (await api.statsTienda()).data || {};
    // GET /api/tienda/dashboard/stats -> { tarjetas:{...}, por_estado:[...], ultimos_6_meses:[...] }
    const t = s.tarjetas || {};
    const vals = document.querySelectorAll('.tienda-stat-val');
    const unidades = t.unidades_vendidas ?? s.ventas_totales ?? s.total_ventas;
    const neto = t.total_neto_vendedor ?? s.dinero_recaudado ?? s.total_ingresos ?? s.ingresos_totales;
    if (vals[0] && unidades != null) vals[0].textContent = unidades;
    if (vals[1] && neto != null) vals[1].textContent = fmtCOP(neto);
    const setStat = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.textContent = val; };
    setStat('tienda-comision', fmtCOP(t.total_comision ?? 0));
    const porEstado = Array.isArray(s.por_estado) ? s.por_estado : [];
    const cantEstado = (est) => porEstado.filter(e => e && e.estado === est)
      .reduce((a, e) => a + Number(e.cantidad || 0), 0);
    setStat('tienda-entregados', cantEstado('Entregado'));
    setStat('tienda-pendientes', cantEstado('Pendiente'));
  } catch (e) {}
  try {
    const c = (await api.cuentaBancaria()).data || {};
    if (c.titular_nombre) { const el = document.getElementById('bank-name'); if (el && !el.value) el.value = c.titular_nombre; }
    if (c.banco) { const el = document.getElementById('bank-select'); if (el && !el.value) el.value = c.banco; }
    if (c.tipo_cuenta) { const el = document.getElementById('bank-type'); if (el && !el.value) el.value = c.tipo_cuenta; }
    if (c.numero_cuenta) { const el = document.getElementById('bank-number'); if (el && !el.value) el.value = c.numero_cuenta; }
  } catch (e) {}
  try { await api.validacionTienda(); } catch (e) {}
}

/* ---- Ventas del vendedor (Pedidos) ---- */
async function obtenerVentasLineas(force) {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return VENTAS_LINEAS;
  if (VENTAS_LINEAS.length && !force) return VENTAS_LINEAS;
  try {
    const body = await api.ventas({ pagina: 1, porPagina: 50 });
    VENTAS_LINEAS = dataLista(body.data, ['items', 'ventas', 'data']);
  } catch (e) { /* sin backend: se conserva el último snapshot */ }
  return VENTAS_LINEAS;
}

async function cargarPedidos() {
  const lista = await obtenerVentasLineas(true);
  const tb = document.getElementById('pedidos-tbody');
  if (!tb) return;
  if (!lista.length) { tb.innerHTML = filaVacia(6, 'Aún no tienes pedidos'); return; }
  tb.innerHTML = lista.map(v => {
    const est = v.estado_envio || v.estado || 'Pendiente';
    const k = claveEstado(est);
    const pedidoId = v.pedido_id ?? null;
    const detalleId = v.detalle_id ?? v.id ?? null;
    const acc = [];
    if (pedidoId != null && Number.isFinite(Number(pedidoId))) {
      acc.push(`<button class="btn-ver" style="margin-right:4px;" onclick="openOrderDetail(${Number(pedidoId)},${detalleId != null ? Number(detalleId) : 'null'})">Ver detalle</button>`);
      if (k === 'pendiente') {
        acc.push(`<button class="btn-ver" style="color:var(--orange);border-color:rgba(245,166,35,0.5);" onclick="actualizarEstadoPedido(${Number(pedidoId)},'En camino')">Enviar</button>`);
      } else if (k === 'camino') {
        acc.push(`<button class="btn-ver" style="color:#22c55e;border-color:rgba(34,197,94,0.5);" onclick="actualizarEstadoPedido(${Number(pedidoId)},'Entregado')">Entregado</button>`);
      }
    } else {
      acc.push('—');
    }
    const comprador = v.nombre_comprador || v.comprador || v.cliente || 'Cliente';
    return `<tr data-estado="${k}">
        <td><div class="tbl-user"><div class="tbl-ava" style="background:${colorAvatar(comprador)};">${letraAvatar(comprador)}</div>${escAttr(comprador)}</div></td>
        <td>${escAttr(v.nombre_producto || v.producto || v.producto_nombre || '—')}</td>
        <td>${escAttr(v.fecha || v.fecha_pedido || '—')}</td>
        <td><span class="badge ${claseBadge(est)}">${escAttr(est)}</span></td>
        <td>${acc.join('')}</td>
        <td>${fmtCOP(v.valor_subtotal || v.total || v.monto || v.monto_vendedor)}</td>
      </tr>`;
  }).join('');
}

/* RF122-RF124: el vendedor avanza la línea un nivel (Pendiente -> En camino -> Entregado). */
async function actualizarEstadoPedido(pedidoId, estado) {
  if (!apiReady() || !localStorage.getItem('commercity_token')) { toast('⚠️ API no disponible (falta api.js)'); return; }
  if (pedidoId == null) { toast('⚠️ Pedido sin identificador'); return; }
  try {
    await api.actualizarEstadoPedido(Number(pedidoId), estado);
    toast(`✅ Pedido #${pedidoId}: ${estado}`);
    await cargarPedidos();
  } catch (err) { toast('⚠️ ' + apiErrorMessage(err)); }
}

/* ---- Compras del comprador (Historial) ---- */
function aplanarHistorial(raw) {
  const pedidos = dataLista(raw, ['compras', 'pedidos', 'items', 'data']);
  const lineas = [];
  const push = (p, it) => {
    if (!it) return;
    const pedidoId = it.pedido_id ?? (p && p.pedido_id) ?? null;
    lineas.push({
      pedido_id: pedidoId != null ? Number(pedidoId) : null,
      detalle_id: it.detalle_id ?? it.detalle_pedido_id ?? it.id ?? null,
      producto: it.producto || it.producto_nombre || '—',
      vendedor: it.vendedor || (Array.isArray(p && p.vendedores) ? p.vendedores[0] : '') || '—',
      vendedor_id: it.vendedor_id != null ? Number(it.vendedor_id) : null,
      estado: it.estado || (p && p.estado) || 'Pendiente',
      cantidad: Number(it.cantidad || 1),
      total: Number(it.total ?? it.subtotal ?? 0),
      fecha: it.fecha || (p && p.fecha) || '',
      direccion: it.direccion || (p && p.direccion) || ''
    });
  };
  pedidos.forEach(p => {
    if (p && Array.isArray(p.items) && p.items.length) p.items.forEach(it => push(p, it));
    else push(p, p);
  });
  return lineas;
}

async function obtenerHistorialLineas(force) {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return HISTORIAL_LINEAS;
  if (HISTORIAL_LINEAS.length && !force) return HISTORIAL_LINEAS;
  try {
    const body = await api.historialCompras();
    const lineas = aplanarHistorial(body.data);
    for (const l of lineas) {
      if (l.vendedor_id == null && l.vendedor && l.vendedor !== '—') l.vendedor_id = await resolverVendedorId(l.vendedor);
      if (l.vendedor_id == null) l.vendedor_id = vendedorIdPorProducto(l.producto);
    }
    HISTORIAL_LINEAS = lineas;
  } catch (e) { /* sin backend: se conserva el último snapshot */ }
  return HISTORIAL_LINEAS;
}

async function cargarHistorial() {
  const lineas = await obtenerHistorialLineas(true);
  const tb = document.getElementById('historial-tbody');
  if (!tb) return;
  if (!lineas.length) { tb.innerHTML = filaVacia(7, 'Aún no tienes compras registradas'); return; }
  tb.innerHTML = lineas.map((l, i) => {
    const k = claveEstado(l.estado);
    const acciones = [`<button class="btn-ver" style="margin-right:4px;" onclick="abrirCalificacion(${i})">Calificar</button>`];
    if (k === 'pendiente' && l.detalle_id != null) {
      acciones.push(`<button class="btn-ver" style="color:var(--danger);border-color:rgba(239,68,68,0.45);" onclick="cancelarCompraLinea(${i})">Cancelar</button>`);
    }
    return `<tr data-estado="${k}">
        <td><div class="tbl-user"><div class="tbl-ava" style="background:${colorAvatar(l.vendedor)};">${letraAvatar(l.vendedor)}</div>${escAttr(l.vendedor)}</div></td>
        <td>${escAttr(l.producto)}</td><td>${escAttr(l.fecha || '—')}</td>
        <td><span class="badge ${claseBadge(l.estado)}">${escAttr(l.estado)}</span></td>
        <td>${l.cantidad}</td><td>${fmtCOP(l.total)}</td>
        <td>${acciones.join('')}</td>
      </tr>`;
  }).join('');
}

/* RF84/RF103: el modal de calificación se abre con los ids REALES de la línea. */
async function abrirCalificacion(idx) {
  const l = HISTORIAL_LINEAS[idx];
  if (!l) return;
  if (l.pedido_id == null) { toast('⚠️ Esta línea no tiene pedido asociado'); return; }
  if (l.vendedor_id == null) l.vendedor_id = await resolverVendedorId(l.vendedor);
  if (l.vendedor_id == null) l.vendedor_id = vendedorIdPorProducto(l.producto);
  if (l.vendedor_id == null) { toast('⚠️ No se pudo identificar al vendedor de esta compra'); return; }
  openRatingModal(l.vendedor, l.vendedor_id, l.pedido_id);
}

/* RF135: cancela una línea en estado Pendiente (devuelve stock + reembolso). */
async function cancelarCompraLinea(idx) {
  const l = HISTORIAL_LINEAS[idx];
  if (!l || l.detalle_id == null) { toast('⚠️ No se pudo identificar la línea a cancelar'); return; }
  if (!apiReady() || !localStorage.getItem('commercity_token')) { toast('⚠️ API no disponible (falta api.js)'); return; }
  if (!confirm(`¿Cancelar la compra de "${l.producto}"? Se reembolsará el pago.`)) return;
  try {
    await api.cancelarCompra(Number(l.detalle_id));
    toast('✅ Compra cancelada');
    await cargarHistorial();
  } catch (err) { toast('⚠️ ' + apiErrorMessage(err)); }
}

async function cargarMensajes(uid) {
  const bodyEl = document.getElementById('chat-body');
  if (!bodyEl || !apiReady()) return;
  try {
    const res = await api.mensajes(uid);
    const raw = res.data;
    const lista = Array.isArray(raw) ? raw : (raw && (raw.mensajes || raw.data)) || [];
    const yo = getCompradorId();
    const porLeer = [];
    const html = lista.map(m => {
      const out = (yo != null && Number(m.emisor_id) === yo);
      if (!out && m.id != null && Number(m.leido) === 0) porLeer.push(Number(m.id));
      return `<div class="msg-wrap ${out ? 'outgoing' : 'incoming'}">
        <div class="msg-bubble">${escAttr(m.mensaje || '')}${m.archivo_url ? `<br><a href="${escAttr(apiBaseUrl() + m.archivo_url)}" target="_blank">📎 archivo</a>` : ''}</div>
        <div class="msg-time">${horaCorta(m.enviado_at || m.fecha)}</div>
      </div>`;
    }).join('');
    bodyEl.querySelectorAll('.msg-wrap').forEach(n => n.remove());
    if (html) bodyEl.insertAdjacentHTML('beforeend', html);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    // RF101: al abrir el chat se marcan como leídos los mensajes recibidos.
    porLeer.slice(0, 20).forEach(id => api.marcarLeido(id).catch(() => {}));
  } catch (e) { /* sin historial remoto: se conservan las burbujas locales */ }
}

async function cargarNotificaciones() {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return;
  const panel = document.getElementById('notifs-panel');
  if (!panel) return;
  let lista = [];
  try {
    const res = await api.notificaciones();
    const raw = res.data;
    lista = Array.isArray(raw) ? raw : (raw && (raw.notificaciones || raw.items || raw.data)) || [];
  } catch (e) { return; } // sin backend: se conservan las filas estáticas
  panel.querySelectorAll('.notif-row').forEach(r => r.remove());
  const footer = panel.querySelector('.notifs-footer-lnk');
  if (!lista.length) {
    const vacia = document.createElement('div');
    vacia.className = 'notif-row';
    vacia.innerHTML = '<div class="notif-txt"><div class="notif-desc">No tienes notificaciones</div></div>';
    if (footer) panel.insertBefore(vacia, footer); else panel.appendChild(vacia);
    return;
  }
  lista.forEach(n => {
    const row = document.createElement('div');
    row.className = 'notif-row';
    if (n.leida) row.style.opacity = '0.6';
    row.innerHTML = `<div class="notif-ico" style="background:rgba(245,166,35,0.2);">🔔</div>
        <div class="notif-txt"><div class="notif-title">${escAttr(n.titulo || n.tipo || 'Notificación')}</div>
        <div class="notif-desc">${escAttr(n.mensaje || n.descripcion || '')}</div>
        <div class="notif-time">${escAttr(n.dias_horas || n.fecha_hora || n.fecha || '')}</div></div>
        <button class="notif-x">✕</button>`;
    row.querySelector('.notif-x').onclick = (ev) => { ev.stopPropagation(); eliminarNotif(n.id, row); };
    // Al abrir una notificación se marca como leída en el servidor.
    row.onclick = () => {
      row.style.opacity = '0.6';
      if (n.id && !n.leida) { n.leida = true; api.marcarNotifLeida(n.id).catch(() => {}); }
    };
    if (footer) panel.insertBefore(row, footer); else panel.appendChild(row);
  });
}

async function eliminarNotif(id, rowEl) {
  if (!apiReady() || id == null) { if (rowEl) rowEl.remove(); return; }
  try { await api.eliminarNotif(id); if (rowEl) rowEl.remove(); }
  catch (err) { toast('⚠️ ' + apiErrorMessage(err)); }
}

async function toggleFollow(usuarioId, siguiendo) {
  if (!apiReady()) return;
  try {
    if (siguiendo) await api.dejarSeguir(usuarioId);
    else await api.seguir(Number(usuarioId));
    renderFollowersList(currentFollowTab);
    toast(siguiendo ? '👋 Dejaste de seguir' : '✅ Ahora sigues a este usuario');
  } catch (err) { toast('⚠️ ' + apiErrorMessage(err)); }
}

async function saveAdminBankAccount() {
  const name = document.getElementById('admin-bank-name')?.value.trim();
  const bank = document.getElementById('admin-bank-select')?.value;
  const type = document.getElementById('admin-bank-type')?.value;
  const number = document.getElementById('admin-bank-number')?.value.trim();
  if (!name || !bank || !type || !number) { toast('⚠️ Completa todos los campos'); return; }
  const payload = { titular_nombre: name, banco: bank, tipo_cuenta: String(type).toLowerCase(), numero_cuenta: String(number).replace(/\D/g, '') };
  if (!/^\d+$/.test(payload.numero_cuenta)) { toast('⚠️ El número de cuenta solo admite dígitos'); return; }
  try {
    await api.adminGuardarCuentaBancaria(payload);
    toast('✅ Cuenta bancaria guardada');
  } catch (err) { toast('⚠️ ' + apiErrorMessage(err)); }
}

async function refreshPerfilDesdeAPI() {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return;
  try {
    const body = await api.me();
    const u = (body.data && (body.data.user || body.data.usuario)) || body.data || {};
    if (u.nombre_completo) localStorage.setItem('commercity_user', u.nombre_completo);
    if (u.email) localStorage.setItem('commercity_email', u.email);
    if (Array.isArray(u.roles)) applyRoles(u.roles);
    updateProfileUI();
    loadBankFromAPI();
  } catch (e) {
    if (e && e.status === 401) { clearSession(); setRole(false, false); navigate('login'); }
  }
}

async function loadBankFromAPI() {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return;
  try {
    const c = (await api.cuentaBancaria()).data || {};
    if (c.titular_nombre) { const el = document.getElementById('bank-name'); if (el && !el.value) el.value = c.titular_nombre; }
    if (c.banco) { const el = document.getElementById('bank-select'); if (el && !el.value) el.value = c.banco; }
    if (c.tipo_cuenta) { const el = document.getElementById('bank-type'); if (el && !el.value) el.value = c.tipo_cuenta; }
    if (c.numero_cuenta) { const el = document.getElementById('bank-number'); if (el && !el.value) el.value = c.numero_cuenta; }
  } catch (e) {}
}

function updateProfileUI() {
  const user = localStorage.getItem('commercity_user');
  if (!user) return;
  const initial = user.charAt(0).toUpperCase();

  const perfilName = document.querySelector('.perfil-name');
  if (perfilName) perfilName.textContent = user;

  const avaText = document.getElementById('perfil-ava-text');
  if (avaText) avaText.textContent = initial;

  const sidebarUser = document.querySelector('.sidebar-username');
  if (sidebarUser) sidebarUser.textContent = user;

  const sidebarAvatar = document.querySelector('.sidebar-avatar');
  if (sidebarAvatar) sidebarAvatar.textContent = initial;

  const ajUser = document.getElementById('aj-user');
  if (ajUser) ajUser.value = user;
  const ajEmail = document.getElementById('aj-email');
  const savedEmail = localStorage.getItem('commercity_email');
  if (ajEmail && savedEmail) ajEmail.value = savedEmail;
}

let introTimer = null;
let introAudioPlayed = false;

function skipIntro() {
  if (introTimer) clearInterval(introTimer);
  const audio = document.getElementById('intro-audio');
  if (audio) { audio.pause(); audio.currentTime = 0; }
  
  const ls = document.getElementById('loading-screen');
  if (ls && ls.style.display !== 'none') {
    ls.classList.add('fade-out');
    setTimeout(() => {
      ls.style.display = 'none';
      finishAppInit();
    }, 400);
  }
}

function finishAppInit() {
  if (localStorage.getItem('commercity_logged_in') === 'true' && localStorage.getItem('commercity_token')) {
    updateProfileUI();
    const sellerStatus = localStorage.getItem('commercity_is_seller') === 'true';
    const adminStatus = localStorage.getItem('commercity_is_admin') === 'true';
    setRole(sellerStatus, adminStatus);
    cargarCatalogoDesdeAPI();
    if (adminStatus) {
      navigate('admin');
    } else {
      navigate('home');
    }
  } else {
    clearSession();
    navigate('login');
  }
}

// RF109: Limpieza de carritos inactivos tras 7 días (604,800,000 ms)
function checkCartExpiration() {
  try {
    const lastTime = localStorage.getItem('commercity_cart_time');
    if (lastTime) {
      const diff = Date.now() - parseInt(lastTime, 10);
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      if (diff > SEVEN_DAYS_MS) {
        cart = [];
        localStorage.removeItem('commercity_cart');
        localStorage.removeItem('commercity_cart_time');
      }
    }
  } catch(e) {}
}

window.addEventListener('load', () => {
  checkCartExpiration();

  try { localStorage.removeItem('commercity_rem_pass'); } catch (e) {}
  const remEmail = localStorage.getItem('commercity_rem_email');
  if (remEmail) {
    const elEmail = document.getElementById('login-email');
    const elRem = document.getElementById('login-remember');
    if (elEmail) elEmail.value = remEmail;
    if (elRem) elRem.checked = true;
  }

  const audio = document.getElementById('intro-audio');
  const progressBar = document.getElementById('intro-progress');
  const label = document.getElementById('intro-label');

  let duration = 3.2; // Duración por defecto si no se leen metadatos de audio

  if (audio) {
    audio.loop = false;
    
    // Al terminar la pista de audio completamente, avanzar suavemente
    audio.onended = () => {
      skipIntro();
    };

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        duration = audio.duration;
      }
    };

    audio.volume = 1.0;
    audio.currentTime = 0;
    audio.play().catch(err => {
      console.log('Autoplay handled silently:', err);
    });
  }

  // Actualizador continuo de barra de progreso y etiquetas
  const intervalMs = 50;
  introTimer = setInterval(() => {
    let pct = 0;
    if (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
      pct = Math.min(100, (audio.currentTime / audio.duration) * 100);
    } else {
      let elapsed = (parseInt(progressBar?.dataset?.elapsed || '0') + intervalMs);
      if (progressBar) progressBar.dataset.elapsed = elapsed;
      pct = Math.min(100, (elapsed / (duration * 1000)) * 100);
    }

    if (progressBar) progressBar.style.width = pct + '%';
    if (label) {
      if (pct < 35) label.textContent = 'Iniciando CommerCity...';
      else if (pct < 75) label.textContent = 'Cargando comunidad y productos...';
      else label.textContent = '¡Bienvenido!';
    }

    if (pct >= 100) {
      clearInterval(introTimer);
      setTimeout(() => skipIntro(), 300);
    }
  }, intervalMs);
});

function navigate(page) {
  if (page === 'admin' && !isAdmin) {
    navigate('home');
    return;
  }
  if (page === 'ajustes-admin' && !isAdmin) {
    navigate('home');
    return;
  }

  const target = document.getElementById('page-' + page);
  const current = document.querySelector('.page.active');

  if (current && current !== target) {
    current.classList.add('page-exit');
    setTimeout(() => {
      current.classList.remove('active', 'page-exit');
    }, 350);
  }

  if (target) {
    if (current && current !== target) {
      target.classList.add('page-enter');
      setTimeout(() => {
        target.classList.remove('page-enter');
      }, 350);
    }
    target.classList.add('active');
    target.scrollTop = 0;
  }

  const isAuth = AUTH_PAGES.includes(page);
  const isAdminPage = (page === 'admin' || page === 'ajustes-admin');
  const isMobile = window.innerWidth <= 860;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.style.display = (!isAuth && !isMobile && !isAdminPage) ? 'flex' : 'none';
    if (!isAuth && !isMobile && !isAdminPage) sidebar.style.flexDirection = 'column';
  }

  const bnav = document.getElementById('bottom-nav');
  if (bnav) {
    bnav.classList.toggle('hidden', isAuth || page === 'chat' || isAdminPage);
  }

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const sideItem = document.getElementById('nav-' + page);
  if (sideItem) sideItem.classList.add('active');

  document.querySelectorAll('.bnav-item').forEach(i => i.classList.remove('active'));
  const bnavItem = document.getElementById('bnav-' + page);
  if (bnavItem) bnavItem.classList.add('active');

  closeNotifs();
  closeMoreMenu();
  closeCatMenu();
  updateCartBadge();
  if (page === 'carrito') renderCart();
  if (page === 'home' && !Object.keys(PRODUCTS).length) cargarCatalogoDesdeAPI();
  if (page === 'admin') cargarAdminDashboard();
  if (page === 'tienda') cargarTienda();
  if (page === 'pedidos') cargarPedidos();
  if (page === 'historial') cargarHistorial();
  if (page === 'mensajes') cargarConversaciones();
}

async function handleLogin() {
  const email = document.getElementById('login-email')?.value.trim();
  const pass  = document.getElementById('login-password')?.value;
  if (!email || !pass) { toast('⚠️ Completa todos los campos'); return; }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }

  try {
    const body = await api.login(email, pass);
    saveSessionFromAuth(body.data);

    const rem = document.getElementById('login-remember')?.checked;
    if (rem) localStorage.setItem('commercity_rem_email', email);
    else localStorage.removeItem('commercity_rem_email');

    const roles = currentRoles();
    toast(roles.includes('administrador') ? '🛡️ ¡Bienvenido Administrador!' : '✅ ¡Bienvenido de vuelta!');
    await cargarCatalogoDesdeAPI();
    setTimeout(() => navigate(roles.includes('administrador') ? 'admin' : 'home'), 900);
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
  }
}

async function handleRegistro() {
  const u = document.getElementById('reg-username')?.value.trim();
  const e = document.getElementById('reg-email')?.value.trim();
  const p = document.getElementById('reg-password')?.value;
  const wantToSell = document.getElementById('reg-seller')?.checked;
  const acceptedTerms = document.getElementById('reg-terms')?.checked;

  if (!u || !e || !p) { toast('⚠️ Completa todos los campos'); return; }
  if (!acceptedTerms) { toast('⚠️ Debes aceptar los Términos y Condiciones'); return; }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }

  try {
    const body = await api.register(e, p, u);
    saveSessionFromAuth(body.data);
    if (wantToSell) {
      try {
        const r = await api.cambiarRol('vendedor');
        if (r.data && Array.isArray(r.data.roles)) applyRoles(r.data.roles);
        else applyRoles(['vendedor']);
      } catch (err2) { toast('⚠️ Cuenta creada, pero no se pudo activar el rol vendedor: ' + apiErrorMessage(err2)); }
    }
    await cargarCatalogoDesdeAPI();
    toast('✅ ¡Cuenta creada exitosamente!');
    setTimeout(() => navigate('home'), 900);
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
  }
}

async function handleRecuperar() {
  const e = document.getElementById('rec-email')?.value.trim();
  if (!e) { toast('⚠️ Ingresa tu correo electrónico'); return; }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }
  try {
    const body = await api.recover(e);
    toast('📧 ' + (body.message || 'Enlace enviado a tu correo'));
    setTimeout(() => navigate('login'), 1400);
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
  }
}

async function handleRestablecer() {
  const a = document.getElementById('new-pass')?.value;
  const b = document.getElementById('new-pass2')?.value;
  if (!a || !b) { toast('⚠️ Completa todos los campos'); return; }
  if (a !== b) { toast('⚠️ Las contraseñas no coinciden'); return; }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }
  const token = new URLSearchParams(window.location.search).get('token')
    || localStorage.getItem('commercity_reset_token');
  if (!token) { toast('⚠️ Abre el enlace de recuperación de tu correo para obtener el token'); return; }
  try {
    await api.resetPassword(token, a);
    try { localStorage.removeItem('commercity_reset_token'); } catch (e) {}
    toast('✅ ¡Contraseña restablecida!');
    setTimeout(() => navigate('login'), 900);
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
  }
}

async function handleLogout() {
  if (apiReady() && localStorage.getItem('commercity_token')) {
    try { await api.logout(); } catch (e) { /* token expirado o sin red: se cierra igual en local */ }
  }
  setRole(false, false);
  clearSession();
  toast('👋 Sesión cerrada');
  setTimeout(() => navigate('login'), 700);
}

function togglePwd(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁️' : '🙈';
}

async function toggleNotifs(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('notifs-panel');
  const overlay = document.getElementById('notifs-overlay');
  if (panel) {
    const willOpen = !panel.classList.contains('open');
    panel.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
    if (willOpen) {
      // Al abrir el panel se marcan todas como leídas (PATCH /api/notificaciones/leidas).
      // Se AWAITA antes de repintar para que la lista no muestre filas no leídas
      // mientras el PATCH sigue en vuelo.
      if (apiReady() && localStorage.getItem('commercity_token')) {
        try { await api.marcarTodasLeidas(); } catch (err) { /* best-effort */ }
      }
      await cargarNotificaciones();
    }
  }
}
function closeNotifs() {
  const panel = document.getElementById('notifs-panel');
  const overlay = document.getElementById('notifs-overlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}
async function clearNotifs(e) {
  if (e) e.stopPropagation();
  if (apiReady() && localStorage.getItem('commercity_token')) {
    try { await api.eliminarTodasNotifs(); }
    catch (err) { toast('⚠️ ' + apiErrorMessage(err)); return; }
  }
  document.querySelectorAll('.notif-row').forEach(r => r.remove());
  toast('🗑️ Notificaciones limpiadas');
}

function toggleCatMenu(e) {
  if (e) e.stopPropagation();
  const dd = document.getElementById('cat-dropdown');
  if (dd) dd.classList.toggle('open');
}
function closeCatMenu() {
  const dd = document.getElementById('cat-dropdown');
  if (dd) dd.classList.remove('open');
}

async function openProductDetail(key) {
  const p = PRODUCTS[key];
  if (!p) return;
  pdKey = key; pdQty = 1;

  document.getElementById('pd-img').src = p.img;
  document.getElementById('pd-img').alt = p.name;
  document.getElementById('pd-name').textContent = p.name;
  document.getElementById('pd-cat').textContent = p.cat || 'Categoría';

  const priceEl = document.getElementById('pd-price');
  const oldPriceEl = document.getElementById('pd-price-old');

  priceEl.textContent = '$' + p.price.toLocaleString('es-CO');

  if (p.disc && p.disc > 0) {
    const oldP = Math.round(p.price / (1 - p.disc / 100));
    oldPriceEl.textContent = '$' + oldP.toLocaleString('es-CO');
    oldPriceEl.style.display = 'block';
    document.getElementById('pd-disc').textContent = '-' + p.disc + '%';
  } else {
    oldPriceEl.style.display = 'none';
    document.getElementById('pd-disc').textContent = '—';
  }

  const stockEl = document.getElementById('pd-stock');
  if (stockEl) stockEl.textContent = p.stock || '10';

  document.getElementById('pd-desc').textContent = p.desc || 'Descripción no disponible.';
  document.getElementById('pd-vendor').textContent = p.vendor || 'Vendedor';
  const avaEl = document.getElementById('pd-vendor-ava');
  if (avaEl && p.vendor) {
    avaEl.textContent = p.vendor.charAt(0).toUpperCase();
  }

  document.getElementById('pd-qty').textContent = 1;

  document.getElementById('pd-modal').classList.add('open');

  const pid = (p.id != null) ? p.id : key;
  if (apiReady() && /^\d+$/.test(String(pid))) {
    try {
      const res = await api.validarStock(pid, 1);
      const d = res.data || {};
      const stockEl = document.getElementById('pd-stock');
      if (stockEl && d.stock_disponible !== undefined) stockEl.textContent = d.stock_disponible;
      if (d.disponible === false) toast('⚠️ ' + (d.mensaje || 'Sin stock disponible'));
    } catch (e) { /* se conserva el stock del catálogo */ }
  }
}

function closePd() { document.getElementById('pd-modal').classList.remove('open'); }
function closePdOnOverlay(e) { if (e.target.id === 'pd-modal' || e.target.classList.contains('modal-overlay')) closePd(); }

function changeQty(d) {
  pdQty = Math.max(1, pdQty + d);
  document.getElementById('pd-qty').textContent = pdQty;
}

async function addToCart() {
  if (!pdKey) return;
  const cid = getCompradorId();
  if (!cid) { toast('⚠️ Inicia sesión para agregar al carrito'); return; }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }
  const p = PRODUCTS[pdKey];
  const pid = (p && p.id != null) ? p.id : pdKey;
  if (!/^\d+$/.test(String(pid))) { toast('⚠️ Producto no disponible en el servidor'); return; }
  try {
    if (pdQty > 1) await api.validarStock(pid, pdQty);
    await api.agregarCarrito(cid, Number(pid), pdQty);
    closePd();
    await renderCart();
    updateCartBadge();
    toast('🛒 ¡Producto agregado al carrito!');
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
  }
}

function updateCartBadge() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  const badge = document.getElementById('sidebar-cart-badge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
  const dot1 = document.getElementById('nav-cart-dot');
  if (dot1) dot1.style.display = total > 0 ? 'block' : 'none';
  const dot2 = document.getElementById('bnav-cart-dot');
  if (dot2) dot2.style.display = total > 0 ? 'block' : 'none';
}

async function renderCart() {
  const container = document.getElementById('carrito-items');
  if (!container) return;
  const emptyHTML = '<div style="text-align:center;padding:48px;color:var(--text-muted);font-size:15px;">🛒 Tu carrito está vacío</div>';
  const cid = getCompradorId();
  const offline = !cid || !apiReady();
  if (offline) {
    loadCartFallback(); // residual REVIEW: cache local de solo lectura
  }

  if (!offline) try {
    const body = await api.listarCarrito(cid);
    const raw = body.data;
    const items = Array.isArray(raw) ? raw : (raw && (raw.items || raw.lineas || raw.data)) || [];
    cartServer = items;
    cart = items.map(it => ({
      key: String(it.producto_id ?? it.id),
      qty: Number(it.cantidad) || 1,
      producto_id: it.producto_id ?? it.id
    }));
    saveCart(); // cache local tras carga exitosa (solo lectura, no viaja al backend)
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
    loadCartFallback(); // fallo de API: cae al cache local (solo lectura)
  }

  if (cart.length === 0) {
    container.innerHTML = emptyHTML;
    setCartSummary(0, 0);
    return;
  }

  container.innerHTML = cart.map((item, idx) => {
    const line = cartServer[idx] || {};
    const p = PRODUCTS[item.key] || {};
    const nombre = line.nombre || line.producto_nombre || p.name || 'Producto';
    const precio = Number(line.precio ?? line.precio_unitario ?? line.precio_final ?? p.price ?? 0);
    const disc = Number(line.descuento_porcentaje ?? line.descuento ?? p.disc ?? 0);
    const imgRel = line.imagen || line.imagen_url || '';
    const img = imgRel ? (String(imgRel).startsWith('http') ? imgRel : apiBaseUrl() + imgRel) : (p.img || '');
    const cat = line.categoria || p.cat || '';
    const base  = precio * item.qty;
    const damt  = disc > 0 ? Math.round(base * disc / 100) : 0;
    const final = base - damt;
    return `
      <div class="cart-item">
        <div class="cart-item-main">
          <img src="${escAttr(img)}" alt="${escAttr(nombre)}" class="cart-item-img" />
          <div class="cart-item-info">
            <div class="cart-item-name">${escAttr(nombre)}</div>
            <div class="cart-item-cat">${escAttr(cat)}</div>
            <div class="cart-item-prices">
              <span class="cart-item-price">$${final.toLocaleString('es-CO')}</span>
              ${damt > 0 ? `<span class="cart-item-old">$${base.toLocaleString('es-CO')}</span>` : ''}
            </div>
          </div>
        </div>
        <button class="trash-btn" onclick="cartRemove(${idx})" title="Eliminar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
        <div class="cart-item-right">
          <span class="qty-label">CANTIDAD</span>
          <button class="qty-btn-sm" onclick="cartQty(${idx},-1)">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn-sm" onclick="cartQty(${idx},1)">+</button>
        </div>
      </div>`;
  }).join('');

  updateCartSummary();
}

async function cartQty(idx, d) {
  const item = cart[idx];
  if (!item) return;
  const cid = getCompradorId();
  if (!cid || !apiReady()) return;
  const nueva = Math.max(1, item.qty + d);
  try {
    await api.modificarCantidad(cid, item.producto_id, nueva);
    item.qty = nueva;
    renderCart(); updateCartBadge();
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
  }
}

async function cartRemove(idx) {
  const item = cart[idx];
  if (!item) return;
  const cid = getCompradorId();
  if (!cid || !apiReady()) return;
  try {
    await api.eliminarCarrito(cid, item.producto_id);
    toast('🗑️ Producto eliminado del carrito');
    renderCart(); updateCartBadge();
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
  }
}

function updateCartSummary() {
  let sumBase = 0, sumDisc = 0;
  cart.forEach((item, idx) => {
    const line = cartServer[idx] || {};
    const p = PRODUCTS[item.key] || {};
    const precio = Number(line.precio ?? line.precio_unitario ?? line.precio_final ?? p.price ?? 0);
    const desc = Number(line.descuento_porcentaje ?? line.descuento ?? p.disc ?? 0);
    const b = precio * item.qty;
    const d = desc > 0 ? Math.round(b * desc / 100) : 0;
    sumBase += b; sumDisc += d;
  });
  setCartSummary(sumBase, sumDisc);
}

function setCartSummary(base, disc) {
  const fmt = n => '$' + n.toLocaleString('es-CO');
  const ti = document.getElementById('sum-total-items');
  const td = document.getElementById('sum-discount');
  const tt = document.getElementById('sum-total');
  if (ti) ti.textContent = fmt(base);
  if (td) td.textContent = '-' + fmt(disc);
  if (tt) tt.textContent = fmt(base - disc);
}

function getCartTotal() {
  return cart.reduce((sum, item, idx) => {
    const line = cartServer[idx] || {};
    const p = PRODUCTS[item.key] || {};
    const precio = Number(line.precio ?? line.precio_unitario ?? line.precio_final ?? p.price ?? 0);
    const desc = Number(line.descuento_porcentaje ?? line.descuento ?? p.disc ?? 0);
    const b = precio * item.qty;
    return sum + b - (desc > 0 ? Math.round(b * desc / 100) : 0);
  }, 0);
}

async function openPasarela() {
  if (cart.length === 0) { toast('⚠️ Tu carrito está vacío'); return; }

  // RF38: Verificar que el comprador haya registrado su dirección antes de hacer compras
  const userAddr = localStorage.getItem('commercity_addr');
  if (!userAddr) {
    toast('⚠️ Registra tu dirección en Ajustes antes de comprar');
    setTimeout(() => navigate('ajustes'), 1200);
    return;
  }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }

  // IVA y totales oficiales del servidor (GET /api/pedidos/resumen)
  let subtotal, iva, total;
  try {
    const body = await api.resumenPedido();
    // El backend devuelve { comprador_id, por_vendedor, totales:{subtotal,iva,total} }
    const t = (body.data || {}).totales || body.data || {};
    subtotal = Number(t.subtotal ?? t.sub_total ?? t.subTotal ?? 0) || 0;
    iva = Number(t.iva ?? t.monto_iva ?? t.montoIva ?? 0) || 0;
    total = Number(t.total ?? t.total_con_iva ?? t.totalConIva ?? (subtotal + iva)) || (subtotal + iva);
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
    return;
  }

  const fmt = '$' + total.toLocaleString('es-CO');
  const fmtSub = '$' + subtotal.toLocaleString('es-CO');
  const fmtIva = '$' + iva.toLocaleString('es-CO');

  document.getElementById('pas-title').textContent = 'Pasarela de Pago';
  document.getElementById('pas-lbl').textContent = 'Total a pagar';
  document.getElementById('pas-amount').textContent = fmt;
  document.getElementById('pas-subtotal').textContent = fmtSub;
  document.getElementById('pas-iva').textContent = fmtIva;
  
  document.getElementById('pas-subtotal-row').style.display = 'flex';
  document.getElementById('pas-iva-row').style.display = 'flex';
  document.getElementById('pas-total-row').style.display = 'none';

  document.getElementById('pay-btn-amt').textContent = fmt;
  document.getElementById('pas-pay-area').style.display = 'block';
  document.getElementById('pas-done-area').style.display = 'none';
  document.getElementById('card-num').readOnly = false;
  document.getElementById('card-holder').readOnly = false;
  document.getElementById('card-num').value = '';
  document.getElementById('card-holder').value = '';

  const btn = document.getElementById('pay-btn');
  btn.textContent = ''; btn.disabled = false;
  btn.innerHTML = 'Pagar <span id="pay-btn-amt">' + fmt + '</span>';

  document.getElementById('pasarela-modal').classList.add('open');
}

function closePas() { document.getElementById('pasarela-modal').classList.remove('open'); }
function closePasOnOverlay(e) { if (e.target === document.getElementById('pasarela-modal')) closePas(); }

function fmtCard(input) {
  let v = input.value.replace(/\D/g,'').slice(0,16);
  input.value = v.match(/.{1,4}/g)?.join('-') || v;
}

async function processPago() {
  const num  = document.getElementById('card-num')?.value.replace(/\D/g, '');
  const name = document.getElementById('card-holder')?.value.trim();
  if (!num || num.length < 13 || num.length > 19 || !name) { toast('⚠️ Tarjeta inválida (13-19 dígitos) y titular requerido'); return; }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }

  const btn = document.getElementById('pay-btn');
  btn.textContent = '⏳ Procesando...';
  btn.disabled = true;

  const addr = localStorage.getItem('commercity_addr') || '';
  const city = localStorage.getItem('commercity_city') || '';
  const dept = localStorage.getItem('commercity_dept') || '';
  try {
    await api.confirmarPago({
      direccion_envio: [addr, city, dept].filter(Boolean).join(', '),
      metodo_pago: 'tarjeta',
      numero_tarjeta: num,
      nombre_tarjeta: name
    });
    document.getElementById('pas-title').textContent = '¡Pago Exitoso! ✅';
    document.getElementById('pas-lbl').textContent = 'Total ya pagado';
    document.getElementById('pas-subtotal-row').style.display = 'none';
    document.getElementById('pas-iva-row').style.display = 'none';
    document.getElementById('pas-total-row').style.display = 'flex';
    document.getElementById('card-num').readOnly = true;
    document.getElementById('card-holder').readOnly = true;
    document.getElementById('pas-pay-area').style.display = 'none';
    document.getElementById('pas-done-area').style.display = 'block';
    cart = [];
    cartServer = [];
    updateCartBadge();
    renderCart();
    toast('✅ ¡Pago realizado con éxito!');
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = 'Pagar <span id="pay-btn-amt">' + (document.getElementById('pas-amount').textContent || '') + '</span>';
    toast('⚠️ ' + apiErrorMessage(err));
  }
}

function downloadReceipt() {
  toast('📄 Comprobante descargado');
  closePas();
}

/* Detalle del pedido con datos REALES (ORDER_DATA mock eliminado):
   - línea del comprador -> api.historialCompras (dirección, producto, total, fecha)
   - venta del vendedor  -> api.ventas (comprador, estado, montos)              */
async function openOrderDetail(pedidoId, detalleId) {
  const pid = Number(pedidoId);
  const did = (detalleId == null || detalleId === 'null') ? null : Number(detalleId);
  if (!Number.isFinite(pid)) { toast('⚠️ Selecciona un pedido de la tabla'); return; }

  const [lineas, ventas] = await Promise.all([obtenerHistorialLineas(), obtenerVentasLineas()]);
  const h = lineas.find(l => l.pedido_id === pid && (did == null || Number(l.detalle_id) === did))
    || lineas.find(l => l.pedido_id === pid);
  const v = ventas.find(x => Number(x.pedido_id) === pid && (did == null || Number(x.id) === did))
    || ventas.find(x => Number(x.pedido_id) === pid);
  if (!h && !v) { toast('⚠️ Pedido #' + pid + ' no encontrado'); return; }

  const yo = localStorage.getItem('commercity_user') || '—';
  const comprador = (v && v.nombre_comprador) || yo;
  const vendedor = (h && h.vendedor && h.vendedor !== '—') ? h.vendedor : (v ? yo : '—');
  const producto = (h && h.producto) || (v && v.nombre_producto) || '—';
  const cantidad = Number((h && h.cantidad) ?? (v && v.cantidad) ?? 1);
  const total = h ? h.total : Number((v && (v.valor_subtotal || v.monto_vendedor)) || 0);
  const estado = (h && h.estado) || (v && v.estado_envio) || '—';
  const fecha = (h && h.fecha) || (v && v.fecha_pedido) || '';
  const direccion = (h && h.direccion) || '—';

  const ava = document.getElementById('od-ava');
  ava.textContent = letraAvatar(comprador);
  ava.style.background = colorAvatar(comprador);
  document.getElementById('od-buyer').textContent = comprador;
  document.getElementById('od-addr').textContent = direccion;
  const vend = document.getElementById('od-vendedor');
  if (vend) vend.textContent = vendedor;
  document.getElementById('od-prod').textContent = producto;
  document.getElementById('od-qty').textContent = 'Cantidad: ' + cantidad + ' unidad' + (cantidad !== 1 ? 'es' : '');
  document.getElementById('od-total').textContent = fmtCOP(total);
  document.getElementById('od-status').textContent = estado;
  document.getElementById('od-date').textContent = 'Fecha: ' + (fecha || '—');
  document.getElementById('od-modal').classList.add('open');
}
function closeOd() { document.getElementById('od-modal').classList.remove('open'); }
function closeOdOnOverlay(e) { if (e.target === document.getElementById('od-modal')) closeOd(); }

function filterTab(btn, tbodyId, status) {
  btn.closest('.filter-tabs').querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const rows = document.querySelectorAll('#' + tbodyId + ' tr');
  rows.forEach(row => {
    row.style.display = (status === 'todo' || row.dataset.estado === status) ? '' : 'none';
  });
}

function filterHTab(btn, status) {
  btn.closest('.filter-tabs').querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#historial-tbody tr').forEach(row => {
    row.style.display = (status === 'todo' || row.dataset.estado === status) ? '' : 'none';
  });
}

function openAddProductModal() { document.getElementById('add-prod-modal').classList.add('open'); }
function closeAddProd() { document.getElementById('add-prod-modal').classList.remove('open'); }
function closeAddProdOnOverlay(e) { if (e.target === document.getElementById('add-prod-modal')) closeAddProd(); }

async function handleAddProduct(e) {
  e.preventDefault();
  const name  = document.getElementById('np-name')?.value.trim();
  const price = document.getElementById('np-price')?.value;
  const stock = document.getElementById('np-stock')?.value;
  const cat   = document.getElementById('np-cat')?.value.trim();
  const desc  = document.getElementById('np-desc')?.value.trim() || '';
  const disc  = parseInt(document.getElementById('np-disc')?.value) || 0;

  if (!name) { toast('⚠️ Ingresa el nombre del producto'); return; }
  if (!price || parseInt(price) <= 0) { toast('⚠️ Ingresa un precio válido'); return; }
  if (!stock || parseInt(stock) < 0) { toast('⚠️ Ingresa el stock del producto'); return; }
  if (!cat) { toast('⚠️ Ingresa la categoría del producto'); return; }
  const imgInput = document.getElementById('np-image');
  if (!imgInput || !imgInput.files || !imgInput.files[0]) { toast('⚠️ La imagen del producto es obligatoria'); return; }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }

  const fd = new FormData();
  fd.append('nombre', name);
  fd.append('descripcion', desc || name);
  fd.append('precio', String(parseInt(price)));
  fd.append('stock', String(parseInt(stock)));
  fd.append('descuento', String(disc));
  fd.append('categoria', cat);
  fd.append('imagen', imgInput.files[0]);

  try {
    await api.crearProducto(fd);
    closeAddProd();
    e.target.reset();
    document.getElementById('img-upload-text').textContent = '+ Cargar Imagen';
    const preview = document.getElementById('np-image-preview');
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    await cargarCatalogoDesdeAPI();
    await renderMisProductos();
    toast('✅ ¡Producto agregado exitosamente!');
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
  }
}

function previewUpload(input) {
  const text = document.getElementById('img-upload-text');
  const preview = document.getElementById('np-image-preview');
  if (input.files && input.files[0]) {
    text.textContent = '✅ ' + input.files[0].name.substring(0, 15) + '...';
    if (preview) {
      preview.src = URL.createObjectURL(input.files[0]);
      preview.style.display = 'block';
    }
  } else {
    text.textContent = '+ Cargar Imagen';
    if (preview) {
      preview.style.display = 'none';
      preview.src = '';
    }
  }
}

/* ---- Listado de page-mensajes: conversaciones reales + directorio ---- */
function chatRowHTML(f, i) {
  const nombre = String(f.nombre || 'Usuario');
  const color = colorAvatar(nombre);
  const tiempo = f.tiempo ? `<div class="chat-li-time">${escAttr(f.tiempo)}</div>` : '';
  const dot = f.unread ? '<div class="unread-dot"></div>' : '';
  return `<div class="chat-li${f.unread ? ' unread' : ''}" onclick="abrirChatLista(${i})">
            <div class="chat-li-ava" style="background:linear-gradient(135deg,${color},${color}99);">${letraAvatar(nombre)}</div>
            <div class="chat-li-body">
              <div class="chat-li-name">${escAttr(nombre)}</div>
              <div class="chat-li-preview">${escAttr(f.preview || 'Iniciar conversación')}</div>
            </div>
            <div class="chat-li-meta">${tiempo}${dot}</div>
          </div>`;
}

function abrirChatLista(i) {
  const c = CHAT_LISTA[i];
  if (!c) return;
  openChat(c.nombre, letraAvatar(c.nombre), colorAvatar(c.nombre), c.id);
}

async function cargarConversaciones() {
  const list = document.querySelector('#page-mensajes .chat-list');
  if (!list) return;
  if (CHAT_FALLBACK_HTML === null) CHAT_FALLBACK_HTML = list.innerHTML;
  if (!apiReady() || !localStorage.getItem('commercity_token')) return; // fallback local
  try {
    const r = await api.conversaciones();
    const convs = dataLista(r.data, ['conversaciones', 'items', 'data']);
    let dir = [];
    try {
      const dr = await api.directorio();
      dir = dataLista(dr.data, ['usuarios', 'items', 'data']);
    } catch (e) { /* directorio opcional */ }

    const vistos = new Set();
    const filas = [];
    convs.forEach(c => {
      const u = (c && c.usuario) || {};
      const id = u.id ?? u.usuario_id;
      if (id == null) return;
      vistos.add(Number(id));
      const um = (c && c.ultimo_mensaje) || {};
      filas.push({
        id: Number(id),
        nombre: u.nombre_completo || 'Usuario',
        preview: um.mensaje || (um.archivo_url ? '📎 Archivo' : 'Sin mensajes'),
        tiempo: um.enviado_at ? horaCorta(um.enviado_at) : '',
        unread: Number(c.no_leidos || 0) > 0
      });
    });
    dir.forEach(u => {
      const id = u.id ?? u.usuario_id;
      if (id == null || vistos.has(Number(id))) return;
      vistos.add(Number(id));
      filas.push({ id: Number(id), nombre: u.nombre_completo || 'Usuario', preview: 'Iniciar conversación', tiempo: '', unread: false });
    });
    if (!filas.length) { list.innerHTML = CHAT_FALLBACK_HTML || ''; return; } // sin datos: fallback local
    CHAT_LISTA = filas;
    list.innerHTML = filas.map((f, i) => chatRowHTML(f, i)).join('');
  } catch (e) { /* sin API: se conserva la lista local */ }
}

function openChat(name, ava, color, userId) {
  const nameEl = document.getElementById('chat-name');
  const avaEl  = document.getElementById('chat-ava');
  if (nameEl) nameEl.textContent = name;
  if (avaEl) {
    avaEl.textContent = ava || (name ? name[0] : '?');
    avaEl.style.background = color ? `linear-gradient(135deg, ${color}, ${color}99)` : 'var(--orange)';
  }
  currentChatUserId = (userId != null && userId !== '') ? Number(userId) : null;
  if (currentChatUserId) {
    currentReportTarget = { tipo: 'Usuario', id: currentChatUserId };
    // Limpia las burbujas de la conversación anterior; el historial real llega después.
    document.querySelectorAll('#chat-body .msg-wrap').forEach(n => n.remove());
    cargarMensajes(currentChatUserId);
  }
  navigate('chat');
}

function pintarBurbujaLocal(msg) {
  const body = document.getElementById('chat-body');
  if (!body) return;
  body.insertAdjacentHTML('beforeend',
    `<div class="msg-wrap outgoing"><div class="msg-bubble">${escAttr(msg)}</div><div class="msg-time">Ahora</div></div>`);
  body.scrollTop = body.scrollHeight;
}

async function savePersonalInfo() {
  const user = document.getElementById('aj-user').value.trim();
  const email = document.getElementById('aj-email').value.trim();
  if (!user || !email) { toast('⚠️ Completa los campos'); return; }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }
  try {
    await api.actualizarPerfil({ nombre_completo: user });
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
    return;
  }
  localStorage.setItem('commercity_user', user);
  localStorage.setItem('commercity_email', email);

  const desc = document.getElementById('aj-desc')?.value.trim();
  if (desc !== undefined) {
    localStorage.setItem('commercity_desc', desc || 'Hola,Soy nuevo');
    const perfilDesc = document.getElementById('perfil-desc');
    if (perfilDesc) perfilDesc.textContent = desc || 'Hola,Soy nuevo';
  }

  const perfilName = document.querySelector('.perfil-name');
  if (perfilName) perfilName.textContent = user;

  toast('✅ Información personal guardada');
}
function saveAddress() {
  const addr = document.getElementById('aj-addr')?.value.trim();
  const city = document.getElementById('aj-city')?.value.trim();
  const dept = document.getElementById('aj-dept')?.value.trim();
  if (!addr || !city || !dept) { toast('⚠️ Completa la dirección'); return; }
  localStorage.setItem('commercity_addr', addr);
  localStorage.setItem('commercity_city', city);
  localStorage.setItem('commercity_dept', dept);
  toast('✅ Dirección de entrega guardada');
}

async function saveBankAccount() {
  const name   = document.getElementById('bank-name')?.value.trim();
  const bank   = document.getElementById('bank-select')?.value;
  const type   = document.getElementById('bank-type')?.value;
  const number = document.getElementById('bank-number')?.value.trim();
  if (!name || !bank || !type || !number) { toast('⚠️ Completa todos los campos'); return; }
  // El backend exige z.enum(["ahorros","corriente"]): el placeholder del select
  // ("Selecciona tipo") u otro valor no válido deben rechazarse en cliente.
  const tipoCuenta = String(type).trim().toLowerCase();
  if (/^seleccion/i.test(tipoCuenta) || !['ahorros', 'corriente'].includes(tipoCuenta)) {
    toast('⚠️ Selecciona un tipo de cuenta válido (Ahorros o Corriente)');
    return;
  }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }
  const payload = {
    titular_nombre: name,
    banco: bank,
    tipo_cuenta: tipoCuenta,
    numero_cuenta: String(number).replace(/\D/g, '')
  };
  if (!/^\d+$/.test(payload.numero_cuenta)) { toast('⚠️ El número de cuenta solo admite dígitos'); return; }
  try {
    await api.guardarCuentaBancaria(payload);
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
    return;
  }
  localStorage.setItem('commercity_bank_name', name);
  localStorage.setItem('commercity_bank', bank);
  localStorage.setItem('commercity_bank_type', type);
  localStorage.setItem('commercity_bank_num', number);
  toast('✅ Cuenta bancaria guardada exitosamente');
}
async function becomeSeller() {
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }
  try {
    const body = await api.cambiarRol('vendedor');
    if (body.data && Array.isArray(body.data.roles)) applyRoles(body.data.roles);
    else applyRoles(['vendedor']);
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
    return;
  }
  toast('🎉 ¡Felicidades! Ahora eres vendedor');
  setTimeout(() => navigate('tienda'), 500);
}
async function confirmDelete() {
  if (!confirm('¿Estás seguro de eliminar tu cuenta? Esta acción es irreversible.')) return;
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }
  try {
    await api.eliminarCuenta();
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
    return;
  }
  clearSession();
  setRole(false, false);
  toast('⚠️ Cuenta eliminada');
  setTimeout(() => navigate('login'), 800);
}

function toggleMoreMenu() {
  document.getElementById('more-drawer')?.classList.toggle('active');
  document.getElementById('more-overlay')?.classList.toggle('active');
}
function closeMoreMenu() {
  document.getElementById('more-drawer')?.classList.remove('active');
  document.getElementById('more-overlay')?.classList.remove('active');
}

function toast(msg) {
  let el = document.getElementById('app-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

function minimizeWindow() { if (ipcRenderer) ipcRenderer.send('minimize-window'); }
function maximizeWindow() { if (ipcRenderer) ipcRenderer.send('maximize-window'); }
function closeWindow()    { if (ipcRenderer) ipcRenderer.send('close-window'); }

document.addEventListener('click', (e) => {
  const panel = document.getElementById('notifs-panel');
  if (panel?.classList.contains('open')) {
    if (!panel.contains(e.target) && !e.target.closest('button[onclick*="toggleNotifs"]')) closeNotifs();
  }
  const catDd = document.getElementById('cat-dropdown');
  if (catDd?.classList.contains('open')) {
    if (!e.target.closest('.cat-wrap')) closeCatMenu();
  }
});

window.addEventListener('resize', () => {
  const active = document.querySelector('.page.active');
  if (!active) return;
  const page = active.id.replace('page-','');
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const isMobile = window.innerWidth <= 860;
  const isAuth   = AUTH_PAGES.includes(page);
  sidebar.style.display = (!isAuth && !isMobile) ? 'flex' : 'none';
  if (!isAuth && !isMobile) sidebar.style.flexDirection = 'column';
});

function changeProfilePic(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const avaText = document.getElementById('perfil-ava-text');
      const avaImg = document.getElementById('perfil-ava-img');
      if (avaText) avaText.style.display = 'none';
      if (avaImg) {
        avaImg.src = e.target.result;
        avaImg.style.display = 'block';
        localStorage.setItem('commercity_profile_pic', e.target.result);
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function loadProfilePic() {
  const pic = localStorage.getItem('commercity_profile_pic');
  if (pic) {
    const avaText = document.getElementById('perfil-ava-text');
    const avaImg = document.getElementById('perfil-ava-img');
    if (avaText) avaText.style.display = 'none';
    if (avaImg) {
      avaImg.src = pic;
      avaImg.style.display = 'block';
    }
  }
}

loadProfilePic();

function loadPersonalInfo() {
  const user = localStorage.getItem('commercity_user');
  const email = localStorage.getItem('commercity_email');
  const desc = localStorage.getItem('commercity_desc');
  if (user) {
    const perfilName = document.querySelector('.perfil-name');
    if (perfilName) perfilName.textContent = user;
    const ajUser = document.getElementById('aj-user');
    if (ajUser) ajUser.value = user;
  }
  if (email) {
    const ajEmail = document.getElementById('aj-email');
    if (ajEmail) ajEmail.value = email;
  }
  if (desc) {
    const ajDesc = document.getElementById('aj-desc');
    if (ajDesc) ajDesc.value = desc;
    const perfilDesc = document.getElementById('perfil-desc');
    if (perfilDesc) perfilDesc.textContent = desc;
  }

  const addr = localStorage.getItem('commercity_addr');
  const city = localStorage.getItem('commercity_city');
  const dept = localStorage.getItem('commercity_dept');
  if (addr) { const e=document.getElementById('aj-addr'); if(e) e.value = addr; }
  if (city) { const e=document.getElementById('aj-city'); if(e) e.value = city; }
  if (dept) { const e=document.getElementById('aj-dept'); if(e) e.value = dept; }

  const bName = localStorage.getItem('commercity_bank_name');
  const bBank = localStorage.getItem('commercity_bank');
  const bType = localStorage.getItem('commercity_bank_type');
  const bNum  = localStorage.getItem('commercity_bank_num');
  if (bName) { const e=document.getElementById('bank-name'); if(e) e.value = bName; }
  if (bBank) { const e=document.getElementById('bank-select'); if(e) e.value = bBank; }
  if (bType) { const e=document.getElementById('bank-type'); if(e) e.value = bType; }
  if (bNum)  { const e=document.getElementById('bank-number'); if(e) e.value = bNum; }
  refreshPerfilDesdeAPI();
}
loadPersonalInfo();

async function sendChatMessage() {
  const input = document.getElementById('chat-msg-input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  const conAPI = apiReady() && !!currentChatUserId && !!localStorage.getItem('commercity_token');
  if (conAPI) {
    input.value = '';
    try {
      const fd = new FormData();
      fd.append('receptor_id', String(currentChatUserId));
      fd.append('mensaje', val);
      await api.enviarMensaje(fd);
      await cargarMensajes(currentChatUserId); // la burbuja la pinta el servidor
      return;
    } catch (err) {
      toast('⚠️ ' + apiErrorMessage(err));
      input.value = val; // no se envió: se conserva para reintentar
      return;
    }
  }
  // Fallback local: chat sin API o abierto sin id real de destinatario.
  input.value = '';
  pintarBurbujaLocal(val);
}

let homePageLoaded = 0;
const EXTRA_PRODUCTS = [
  { id: 'cam1', name: 'Cámara DSLR Pro', price: '$2.500.000', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80', badge: 'Nuevo' },
  { id: 'lentes1', name: 'Gafas de Sol Clásicas', price: '$120.000', img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80', badge: 'Oferta' },
  { id: 'reloj2', name: 'Smartwatch V2', price: '$450.000', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', badge: '' },
  { id: 'zapatos2', name: 'Tenis Urbanos', price: '$180.000', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', badge: 'Nuevo' },
  { id: 'bolso2', name: 'Bolso de Cuero', price: '$350.000', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', badge: '' },
  { id: 'audifonos2', name: 'Auriculares In-Ear', price: '$299.000', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', badge: '10%' }
];

document.getElementById('page-home').addEventListener('scroll', function(e) {
  const el = e.target;
  if (el.scrollHeight - el.scrollTop <= el.clientHeight + 100) {
    if (homePageLoaded < 3) {
      homePageLoaded++;
      const grid = document.getElementById('home-prod-grid');
      if (grid) {
        EXTRA_PRODUCTS.forEach(p => {
          const html = `
            <div class="prod-card" style="animation:fadeIn 0.3s ease;" onclick="openProductDetail('${p.id}')">
              <img src="${p.img}" alt="${p.name}" class="prod-img" style="object-fit:cover;" />
              <div class="prod-info"><div class="prod-name">${p.name}</div><div class="prod-price">${p.price}</div></div>
            </div>
          `;
          grid.insertAdjacentHTML('beforeend', html);
        });
      }
    }
  }
});


const FOLLOWERS_DATA = [
  { name: 'Nath', type: 'Persona', color: '#F5A623', letter: 'N', verified: true },
  { name: 'Andrea Valdiri', type: 'Persona', color: '#be185d', letter: 'A', verified: false },
  { name: 'Paris Accesorios', type: 'Tienda', color: '#7c3aed', letter: '🛍️', verified: false },
  { name: 'MARINO Cosme', type: 'Vendedor', color: '#ef4444', letter: 'M', verified: false },
  { name: 'Alex Castillo', type: 'Persona', color: '#0891b2', letter: 'A', verified: false },
  { name: 'Asadero KIKE BRASAS', type: 'Tienda', color: '#f59e0b', letter: '🍗', verified: false },
  { name: 'Lucas G.', type: 'Persona', color: '#22c55e', letter: 'L', verified: false },
  { name: 'Diana Torres', type: 'Persona', color: '#8b5cf6', letter: 'D', verified: false },
  { name: 'ModaVIP Colombia', type: 'Tienda', color: '#ec4899', letter: 'M', verified: true },
  { name: 'Carlos Mendoza', type: 'Persona', color: '#14b8a6', letter: 'C', verified: false },
];

const FOLLOWING_DATA = [
  { name: 'Nath', type: 'Persona', color: '#F5A623', letter: 'N', verified: true },
  { name: 'Andrea Valdiri', type: 'Persona', color: '#be185d', letter: 'A', verified: false },
  { name: 'Paris Accesorios', type: 'Tienda', color: '#7c3aed', letter: '🛍️', verified: false },
  { name: 'MARINO Cosme', type: 'Vendedor', color: '#ef4444', letter: 'M', verified: false },
  { name: 'Alex Castillo', type: 'Persona', color: '#0891b2', letter: 'A', verified: false },
  { name: 'Asadero KIKE BRASAS', type: 'Tienda', color: '#f59e0b', letter: '🍗', verified: false },
  { name: 'Lucas G.', type: 'Persona', color: '#22c55e', letter: 'L', verified: false },
];

let currentFollowTab = 'seguidores';

function openFollowersModal(tab) {
  currentFollowTab = tab || 'seguidores';
  document.getElementById('followers-modal').classList.add('open');
  renderFollowersList(currentFollowTab);
  document.getElementById('tab-seguidores').classList.toggle('active', currentFollowTab === 'seguidores');
  document.getElementById('tab-siguiendo').classList.toggle('active', currentFollowTab === 'siguiendo');
}

function closeFollowersModal() {
  document.getElementById('followers-modal').classList.remove('open');
}

function closeFollowersOnOverlay(e) {
  if (e.target === document.getElementById('followers-modal')) closeFollowersModal();
}

function switchFollowTab(tab) {
  currentFollowTab = tab;
  document.getElementById('tab-seguidores').classList.toggle('active', tab === 'seguidores');
  document.getElementById('tab-siguiendo').classList.toggle('active', tab === 'siguiendo');
  renderFollowersList(tab);
}

async function renderFollowersList(tab) {
  const list = document.getElementById('followers-list');
  if (!list) return;
  if (apiReady() && localStorage.getItem('commercity_token')) {
    try {
      const body = tab === 'seguidores' ? await api.seguidores() : await api.siguiendo();
      const raw = body.data;
      const data = Array.isArray(raw) ? raw : (raw && (raw.usuarios || raw.data)) || [];
      if (data.length) {
        list.innerHTML = data.map(u => {
          const uid = u.id ?? u.usuario_id ?? u.seguidor_id ?? u.seguido_id;
          const nombre = u.nombre_completo || u.nombre || 'Usuario';
          const letter = escAttr((nombre.charAt(0) || '?').toUpperCase());
          const uidNum = Number(uid);
          const btn = Number.isFinite(uidNum) ? `<button class="btn-ghost" style="padding:4px 10px;font-size:11px;" onclick="toggleFollow(${uidNum}, ${tab === 'siguiendo'})">${tab === 'siguiendo' ? 'Dejar de seguir' : 'Seguir'}</button>` : '';
          return `
          <div class="follow-item">
            <div class="follow-ava" style="background:linear-gradient(135deg,#7c3aed,#7c3aed99);">${letter}</div>
            <div class="follow-info">
              <div class="follow-name">${escAttr(nombre)}</div>
              <div class="follow-type">${escAttr(u.rol || u.tipo || '')}</div>
            </div>${btn}
          </div>`;
        }).join('');
        return;
      }
    } catch (e) { /* contingencia local abajo */ }
  }
  const data = tab === 'seguidores' ? FOLLOWERS_DATA : FOLLOWING_DATA;
  list.innerHTML = data.map(u => {
    const letterIsEmoji = u.letter.length > 1;
    const avaStyle = letterIsEmoji
      ? `background:${u.color};`
      : `background:linear-gradient(135deg,${u.color},${u.color}99);`;
    return `
      <div class="follow-item">
        <div class="follow-ava" style="${avaStyle}">${u.letter}</div>
        <div class="follow-info">
          <div class="follow-name">${u.name}${u.verified ? ' <span style="color:var(--orange);font-size:13px;">✓</span>' : ''}</div>
          <div class="follow-type">${u.type}</div>
        </div>
      </div>`;
  }).join('');
}

let editProductKey = null;

function openEditProductModal(key) {
  const p = PRODUCTS[key];
  if (!p) return;
  editProductKey = key;

  document.getElementById('ep-name').value  = p.name || '';
  document.getElementById('ep-desc').value  = p.desc || '';
  document.getElementById('ep-price').value = p.price || '';
  document.getElementById('ep-stock').value = p.stock || '';
  document.getElementById('ep-disc').value  = p.disc || '';
  document.getElementById('ep-cat').value   = p.cat || '';

  const preview = document.getElementById('ep-image-preview');
  if (preview) { preview.style.display = 'none'; preview.src = ''; }
  document.getElementById('ep-img-upload-text').textContent = '+ Cambiar Imagen';

  document.getElementById('edit-prod-modal').classList.add('open');
}

function closeEditProd() {
  document.getElementById('edit-prod-modal').classList.remove('open');
  editProductKey = null;
}

function closeEditProdOnOverlay(e) {
  if (e.target === document.getElementById('edit-prod-modal')) closeEditProd();
}

async function handleEditProduct(e) {
  e.preventDefault();
  if (!editProductKey) return;

  const name  = document.getElementById('ep-name')?.value.trim();
  const desc  = document.getElementById('ep-desc')?.value.trim();
  const priceRaw = document.getElementById('ep-price')?.value;
  const stockRaw = document.getElementById('ep-stock')?.value;
  const disc  = parseInt(document.getElementById('ep-disc')?.value) || 0;
  const cat   = document.getElementById('ep-cat')?.value.trim();

  if (!name) { toast('⚠️ Ingresa el nombre del producto'); return; }
  if (!priceRaw || parseInt(priceRaw) <= 0) { toast('⚠️ Ingresa un precio válido'); return; }
  if (stockRaw === '' || stockRaw === null || stockRaw === undefined || parseInt(stockRaw) < 0) { toast('⚠️ Ingresa el stock del producto'); return; }
  if (!cat) { toast('⚠️ Ingresa la categoría del producto'); return; }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }

  const current = PRODUCTS[editProductKey] || {};
  const pid = (current.id != null) ? current.id : editProductKey;
  if (!/^\d+$/.test(String(pid))) { toast('⚠️ Producto no disponible en el servidor'); return; }

  const fd = new FormData();
  fd.append('nombre', name);
  fd.append('descripcion', desc || name);
  fd.append('precio', String(parseInt(priceRaw)));
  fd.append('stock', String(parseInt(stockRaw)));
  fd.append('descuento', String(disc));
  fd.append('categoria', cat);
  const imgInput = document.getElementById('ep-image');
  if (imgInput && imgInput.files && imgInput.files[0]) fd.append('imagen', imgInput.files[0]);

  try {
    await api.editarProducto(pid, fd);
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
    return;
  }

  const price = parseInt(priceRaw);
  const stock = parseInt(stockRaw);

  PRODUCTS[editProductKey] = { ...PRODUCTS[editProductKey], name, desc, price, stock, disc, cat };

  const grid = document.getElementById('perfil-prod-grid');
  if (grid) {
    const cards = grid.querySelectorAll('.prod-card');
    cards.forEach(card => {
      if (card.getAttribute('onclick') && card.getAttribute('onclick').includes(editProductKey)) {
        const nameEl = card.querySelector('.prod-name');
        const priceEl = card.querySelector('.prod-price');
        const oldPriceEl = card.querySelector('.prod-price-old');
        const badgeEl = card.querySelector('.prod-badge.disc-badge');
        if (nameEl) nameEl.textContent = name;
        if (priceEl) priceEl.textContent = '$' + price.toLocaleString('es-CO');
        if (disc > 0) {
          const originalPrice = Math.round(price / (1 - disc / 100));
          if (oldPriceEl) {
            oldPriceEl.textContent = '$' + originalPrice.toLocaleString('es-CO');
            oldPriceEl.style.display = '';
          }
          if (badgeEl) badgeEl.textContent = '-' + disc + '%';
        }
      }
    });
  }

  closeEditProd();
  toast('✅ ¡Producto actualizado exitosamente!');
}

function previewEditUpload(input) {
  const text = document.getElementById('ep-img-upload-text');
  const preview = document.getElementById('ep-image-preview');
  if (input.files && input.files[0]) {
    text.textContent = '✅ ' + input.files[0].name.substring(0, 15) + '...';
    if (preview) {
      preview.src = URL.createObjectURL(input.files[0]);
      preview.style.display = 'block';
    }
  } else {
    text.textContent = '+ Cambiar Imagen';
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
  }
}


function switchAdminTab(tabId) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
  const tBtn = document.getElementById('admin-tab-' + tabId);
  const tSec = document.getElementById('admin-sec-' + tabId);
  if(tBtn) tBtn.classList.add('active');
  if(tSec) tSec.classList.add('active');
  if (tabId === 'dashboard') cargarAdminDashboard();
  if (tabId === 'usuarios') cargarAdminUsuarios();
  if (tabId === 'productos') cargarAdminProductos();
  if (tabId === 'reportes') cargarAdminReportes();
}

async function cargarAdminDashboard() {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return;
  try {
    const s = (await api.adminStats()).data || {};
    const cards = document.querySelectorAll('#admin-sec-dashboard .admin-metric-value');
    const vals = [s.totalCompradores ?? s.compradores, s.totalVendedores ?? s.vendedores,
      s.productosPublicados ?? s.totalProductos ?? s.productos, s.comisionesTotales ?? s.comisiones ?? s.totalComisiones];
    cards.forEach((el, i) => { if (vals[i] != null) el.textContent = (i === 3 ? fmtCOP(vals[i]) : vals[i]); });
  } catch (e) {}
}

async function cargarAdminUsuarios() {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return;
  try {
    const body = await api.adminUsuarios();
    const raw = body.data;
    const lista = Array.isArray(raw) ? raw : (raw && (raw.usuarios || raw.data)) || [];
    if (!lista.length) return;
    const wrap = document.querySelector('#admin-sec-usuarios .admin-list');
    if (!wrap) return;
    wrap.innerHTML = lista.map(u => {
      const uid = u.id ?? u.usuario_id;
      const nombre = u.nombre || u.nombre_completo || 'Usuario';
      const rol = u.rol || 'Comprador';
      const estado = String(u.estado || (u.activo === 0 ? 'Baneado' : 'Activo'));
      const ban = /ban/i.test(estado);
      return `<div class="admin-list-card admin-user-card" data-user-id="${escAttr(uid)}" data-nombre="${escAttr(nombre)}" data-rol="${escAttr(rol)}" data-estado="${escAttr(estado)}" data-email="${escAttr(u.email || '')}" data-publicados="${escAttr(u.productos ?? u.publicados ?? 0)}" data-reportes="${escAttr(u.reportes ?? 0)}" onclick="currentAdminTarget=this; openAdminUserDetail(this.dataset.nombre,this.dataset.rol,this.dataset.estado,this.dataset.email,this.dataset.publicados,this.dataset.reportes)">
        <div class="admin-card-left"><div class="tbl-ava" style="background:#4b5563;">${escAttr(nombre.charAt(0))}</div>
          <div><div class="admin-card-title">${escAttr(nombre)}</div><div class="admin-card-sub">${escAttr(rol)}</div></div></div>
        <div class="admin-card-right"><span class="badge ${ban ? 'badge-red' : 'badge-green'}">${escAttr(estado)}</span>
          <button class="btn-ghost" style="padding:4px 8px;" onclick="event.stopPropagation(); currentAdminTarget=this.closest('.admin-list-card'); adminAction('${ban ? 'Activar' : 'Banear'}', null)">${ban ? 'Activar' : 'Banear'}</button>
          <button class="btn-ghost" style="padding:4px 8px; color:var(--danger);" onclick="event.stopPropagation(); currentAdminTarget=this.closest('.admin-list-card'); adminAction('Eliminar', null)">Eliminar</button>
        </div></div>`;
    }).join('');
  } catch (e) {}
}

async function cargarAdminProductos() {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return;
  try {
    const body = await api.adminProductos();
    const raw = body.data;
    const lista = Array.isArray(raw) ? raw : (raw && (raw.productos || raw.data)) || [];
    if (!lista.length) return;
    const wrap = document.querySelector('#admin-sec-productos .admin-list');
    if (!wrap) return;
    wrap.innerHTML = lista.map(p => {
      const pid = p.id ?? p.producto_id;
      const nombre = p.nombre || 'Producto';
      const vend = p.vendedor || p.vendedor_nombre || '—';
      return `<div class="admin-list-card admin-prod-card" data-product-id="${escAttr(pid)}" data-nombre="${escAttr(nombre)}" data-vendedor="${escAttr(vend)}" data-estado="${escAttr(p.estado || 'Activo')}" data-precio="${escAttr(fmtCOP(p.precio))}" data-reportes="${escAttr(p.reportes ?? 0)}" onclick="currentAdminTarget=this; openAdminProductDetail(this.dataset.nombre,this.dataset.vendedor,this.dataset.estado,this.dataset.precio,this.dataset.reportes)">
        <div class="admin-card-left"><div class="admin-prod-img-placeholder">📦</div>
          <div><div class="admin-card-title">${escAttr(nombre)}</div><div class="admin-card-sub">${escAttr(fmtCOP(p.precio))}</div></div></div>
        <div class="admin-card-right"><div class="admin-card-sub">${escAttr(vend)}</div>
          <button class="btn-ghost" style="padding:4px 8px; color:var(--danger);" onclick="event.stopPropagation(); currentAdminTarget=this.closest('.admin-list-card'); adminAction('Eliminar producto', null)">🗑️</button>
        </div></div>`;
    }).join('');
  } catch (e) {}
}

/* Cache de reportes admin: la tarjeta solo lleva el id numérico en su onclick
   (los campos con texto libre —motivo, reportado, fecha, estado— nunca se
   interpolan en el atributo, así que no pueden romperlo ni ejecutar código). */
const ADMIN_REPORTES_CACHE = Object.create(null);

function openAdminReportDetailById(rid) {
  const r = ADMIN_REPORTES_CACHE[String(rid)] || {};
  openAdminReportDetail(r.tipo || '', r.rep || '', r.by || '', r.motivo || '', r.fecha || '', r.estado || '');
}

async function cargarAdminReportes() {
  if (!apiReady() || !localStorage.getItem('commercity_token')) return;
  try {
    const body = await api.adminReportes();
    const raw = body.data;
    const lista = Array.isArray(raw) ? raw : (raw && (raw.reportes || raw.data)) || [];
    if (!lista.length) return;
    const wrap = document.querySelector('#admin-sec-reportes .admin-list');
    if (!wrap) return;
    wrap.innerHTML = lista.map(r => {
      const rid = r.id ?? r.reporte_id;
      const tipo = r.tipo_reporte || r.tipo || 'Usuario';
      const rep = r.usuario_reportado_nombre || r.producto_nombre || r.reportado || '—';
      const motivo = r.motivo || '';
      const fecha = r.fecha_reporte || r.fecha || '';
      const estado = r.estado || 'Pendiente';
      const res = /resuelto/i.test(estado);
      const ridNum = Number(rid);
      const ridArg = Number.isFinite(ridNum) ? ridNum : 'null';
      ADMIN_REPORTES_CACHE[String(rid)] = { tipo, rep, by: '', motivo, fecha, estado };
      return `<div class="admin-list-card admin-rep-card" data-report-id="${escAttr(rid)}" onclick="currentAdminTarget=this; openAdminReportDetailById(${ridArg})">
        <div class="admin-card-left" style="flex:1; flex-direction:column; align-items:flex-start;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span class="badge badge-red outline">${escAttr(tipo)}</span><div class="admin-card-title">${escAttr(rep)}</div></div>
          <div class="admin-card-sub" style="max-width:100%;">${escAttr(motivo)}</div></div>
        <div class="admin-card-right" style="flex-direction:column; align-items:flex-end; justify-content:center; gap:6px;">
          <div class="admin-card-sub" style="margin:0;">${escAttr(fecha)}</div>
          <div style="display:flex; gap:6px; align-items:center;"><span class="badge ${res ? 'badge-green' : 'badge-red'}">${escAttr(estado)}</span>
          <button class="btn-ghost" style="padding:4px 8px;" onclick="event.stopPropagation(); currentAdminTarget=this.closest('.admin-list-card'); adminAction('${res ? 'Ver' : 'Resolver'}', null)">${res ? 'Ver' : 'Resolver'}</button>
          </div></div></div>`;
    }).join('');
  } catch (e) {}
}

function filterAdminList(inputId, className) {
  const q = document.getElementById(inputId).value.toLowerCase();
  const items = document.querySelectorAll(className);
  items.forEach(item => {
    const text = item.innerText.toLowerCase();
    item.style.display = text.includes(q) ? 'flex' : 'none';
  });
}

function openAdminUserDetail(name, role, status, email, published, reports) {
  document.getElementById('admin-user-name').textContent = name;
  document.getElementById('admin-user-role').textContent = role;
  document.getElementById('admin-user-status').textContent = status;
  document.getElementById('admin-user-email').textContent = email;
  document.getElementById('admin-user-published').textContent = published;
  document.getElementById('admin-user-reports').textContent = reports;
  document.getElementById('admin-user-modal').classList.add('open');
}
function closeAdminUser() { document.getElementById('admin-user-modal').classList.remove('open'); }
function closeAdminUserOnOverlay(e) { if(e.target === document.getElementById('admin-user-modal')) closeAdminUser(); }

function openAdminProductDetail(name, vendor, status, price, reports) {
  document.getElementById('admin-prod-name').textContent = name;
  document.getElementById('admin-prod-vendor').textContent = vendor;
  document.getElementById('admin-prod-status').textContent = status;
  document.getElementById('admin-prod-price').textContent = price;
  document.getElementById('admin-prod-reports').textContent = reports;
  document.getElementById('admin-prod-modal').classList.add('open');
}
function closeAdminProduct() { document.getElementById('admin-prod-modal').classList.remove('open'); }
function closeAdminProductOnOverlay(e) { if(e.target === document.getElementById('admin-prod-modal')) closeAdminProduct(); }

function openAdminReportDetail(type, reported, by, reason, date, status) {
  document.getElementById('admin-rep-type').textContent = type;
  document.getElementById('admin-rep-reported').textContent = reported;
  document.getElementById('admin-rep-by').textContent = by;
  document.getElementById('admin-rep-reason').textContent = reason;
  document.getElementById('admin-rep-date').textContent = date;
  document.getElementById('admin-rep-status').textContent = status;
  document.getElementById('admin-rep-modal').classList.add('open');
}
function closeAdminReport() { document.getElementById('admin-rep-modal').classList.remove('open'); }
function closeAdminReportOnOverlay(e) { if(e.target === document.getElementById('admin-rep-modal')) closeAdminReport(); }

async function adminAction(action, modalIdToClose) {
  const a = String(action || '').toLowerCase();
  const raw = currentAdminTarget;
  const card = (raw && raw.closest) ? (raw.closest('.admin-list-card') || raw) : raw;
  const uid = card && card.dataset ? card.dataset.userId : undefined;
  const pid = card && card.dataset ? card.dataset.productId : undefined;
  const rid = card && card.dataset ? card.dataset.reportId : undefined;

  if (apiReady() && localStorage.getItem('commercity_token')) {
    try {
      if (a.includes('banear') && uid) await api.adminCambiarEstado(uid, 'baneado');
      else if (a.includes('activar') && uid) await api.adminCambiarEstado(uid, 'activo');
      else if (a.includes('eliminar') && uid && !pid && !rid) await api.adminEliminarUsuario(uid);
      else if ((a.includes('eliminar') || a.includes('suspender')) && pid) await api.adminEliminarProducto(pid);
      else if (a.includes('restaurar') && pid) await api.adminRestaurarProducto(pid);
      else if ((a.includes('resolver') || a.includes('responder')) && rid) await api.adminResolverReporte(rid);
      else if (a.includes('eliminar') && rid) await api.adminEliminarReporte(rid);
      else if (a === 'ver' && rid) { const r = await api.adminReporte(rid); void r; }
      else { toast('⚠️ Acción sin identificador en la tarjeta'); return; }
      toast(`✅ Acción '${action}' ejecutada con éxito`);
    } catch (err) {
      toast('⚠️ ' + apiErrorMessage(err));
      return;
    }
  } else {
    toast(`✅ Acción '${action}' ejecutada con éxito`);
  }

  if (currentAdminTarget) {
     let badge = currentAdminTarget.querySelector ? currentAdminTarget.querySelector('.badge:not(.outline)') : null;
     if (badge) {
        if (a.includes('eliminar') || a.includes('banear') || a.includes('suspender')) {
           badge.textContent = a.includes('eliminar') ? 'Eliminado' : (a.includes('banear') ? 'Baneado' : 'Suspendido');
           badge.className = 'badge badge-red';
        } else if (a.includes('activar')) {
           badge.textContent = 'Activo';
           badge.className = 'badge badge-green';
        } else if (a.includes('responder') || a.includes('resolver') || a.includes('ver')) {
           badge.textContent = 'Resuelto';
           badge.className = 'badge badge-green';
        }
     }
  }

  if (modalIdToClose) {
    const mel = document.getElementById(modalIdToClose);
    if (mel) mel.classList.remove('open');
  }
}

function openReportModal(tipo, id) {
  if (tipo) {
    currentReportTarget = { tipo: tipo, id: id };
  } else if (pdKey != null) {
    const p = PRODUCTS[pdKey];
    const pid = (p && p.id != null) ? p.id : pdKey;
    if (/^\d+$/.test(String(pid))) currentReportTarget = { tipo: 'Producto', id: pid };
  }
  document.getElementById('report-modal').classList.add('open');
}
function closeReportModal() {
  document.getElementById('report-modal').classList.remove('open');
}
function closeReportOnOverlay(e) {
  if (e.target === document.getElementById('report-modal')) closeReportModal();
}
async function submitReportModal() {
  const reason = document.getElementById('report-reason')?.value.trim();
  if (!reason) {
    toast('⚠️ Ingresa el motivo del reporte');
    return;
  }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }
  const t = currentReportTarget;
  if (!t || (t.tipo === 'Producto' && t.id == null) || (t.tipo === 'Usuario' && t.id == null)) {
    toast('⚠️ Abre el reporte desde un producto o una conversación');
    return;
  }
  const fd = new FormData();
  fd.append('tipo', t.tipo);
  fd.append('motivo', reason);
  if (t.tipo === 'Producto') fd.append('producto_id', String(t.id));
  else fd.append('usuario_reportado_id', String(t.id));
  const ev = document.getElementById('report-evidence');
  if (ev && ev.files && ev.files[0]) fd.append('evidencia', ev.files[0]);
  try {
    await api.crearReporte(fd);
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
    return;
  }
  toast('✅ Reporte enviado exitosamente');
  closeReportModal();
  if (document.getElementById('report-reason')) {
    document.getElementById('report-reason').value = '';
  }
  if (ev) ev.value = '';
}


// Interactive Stars Logic
async function rateProfile(rating) {
  const starsContainer = document.getElementById('perfil-stars');
  if(!starsContainer) return;
  const stars = starsContainer.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if(index < rating) {
      star.classList.add('filled');
    } else {
      star.classList.remove('filled');
    }
  });
  currentRatingValue = rating;
  if (currentRatingContext && currentRatingContext.vendedor_id && currentRatingContext.pedido_id) {
    await submitVendorRating();
  } else {
    toast(`⭐ ${rating}/5 — califica tras una compra para enviarla`);
  }
}

// RF22, RF23: Pestaña Mi Feed en Perfil de Comprador
function switchPerfilTab(tab) {
  const btnMisProd = document.getElementById('tab-mis-prod');
  const btnMiFeed  = document.getElementById('tab-mi-feed');
  const grid = document.getElementById('perfil-prod-grid');
  if (!grid) return;

  if (tab === 'mi-feed') {
    if (btnMisProd) btnMisProd.classList.remove('active');
    if (btnMiFeed) btnMiFeed.classList.add('active');

    // Render feed de productos recomendados
    const feedHtml = Object.keys(PRODUCTS).map(key => {
      const p = PRODUCTS[key];
      const fmtPrice = '$' + p.price.toLocaleString('es-CO');
      // Fix residual post-review: 'Mi Feed' pinta datos de la API -> escapar (XSS).
      return `
        <div class="prod-card" style="animation:fadeIn 0.3s ease;" onclick="openProductDetail('${escAttr(key)}')">
          ${p.disc > 0 ? `<div class="prod-badge disc-badge">-${Number(p.disc)}%</div>` : ''}
          <img src="${escAttr(p.img)}" alt="${escAttr(p.name)}" class="prod-img" style="object-fit:cover;" />
          <div class="prod-info">
            <div class="prod-name">${escAttr(p.name)}</div>
            <div class="prod-price">${fmtPrice}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Por ${escAttr(p.vendor)}</div>
          </div>
        </div>
      `;
    }).join('');
    grid.innerHTML = feedHtml;
  } else {
    if (btnMiFeed) btnMiFeed.classList.remove('active');
    if (btnMisProd) btnMisProd.classList.add('active');

    // Mis productos del vendedor (API; contingencia: catálogo en memoria)
    renderMisProductos();
  }
}

// RF84, RF103: Calificación de Vendedores tras realizar compra
let currentRatingValue = 5;
let currentVendorTarget = 'Alex Rivera';

function openRatingModal(vendorName, vendorId, pedidoId) {
  currentVendorTarget = vendorName || 'Alex Rivera';
  currentRatingContext = (vendorId && pedidoId) ? { vendedor_id: Number(vendorId), pedido_id: Number(pedidoId) } : null;
  const nameEl = document.getElementById('rate-vendor-name');
  if (nameEl) nameEl.textContent = currentVendorTarget;
  setVendorRating(5);
  document.getElementById('rating-modal')?.classList.add('open');
}

function closeRatingModal() {
  document.getElementById('rating-modal')?.classList.remove('open');
}

function setVendorRating(val) {
  currentRatingValue = val;
  const stars = document.querySelectorAll('#star-rating-select span');
  stars.forEach((star, idx) => {
    star.style.opacity = idx < val ? '1' : '0.3';
    star.style.transform = idx < val ? 'scale(1.1)' : 'scale(1)';
  });
}

async function submitVendorRating() {
  const comment = document.getElementById('rate-comment')?.value.trim() || '';
  const ctx = currentRatingContext || {};
  if (!ctx.vendedor_id || !ctx.pedido_id) {
    toast('⚠️ Solo puedes calificar tras una compra registrada');
    return;
  }
  if (!apiReady()) { toast('⚠️ API no disponible (falta api.js)'); return; }
  try {
    await api.calificarVendedor({ pedido_id: ctx.pedido_id, vendedor_id: ctx.vendedor_id, estrellas: currentRatingValue, comentario: comment || undefined });
  } catch (err) {
    toast('⚠️ ' + apiErrorMessage(err));
    return;
  }
  toast(`⭐ ¡Gracias! Has calificado a ${currentVendorTarget} con ${currentRatingValue} estrellas`);
  // pedido_id es UNIQUE en calificaciones_vendedores: se limpia el contexto para
  // que un segundo envío (estrellas del perfil o reenvío) no reutilice el mismo pedido.
  currentRatingContext = null;
  closeRatingModal();
  if (document.getElementById('rate-comment')) {
    document.getElementById('rate-comment').value = '';
  }
}
