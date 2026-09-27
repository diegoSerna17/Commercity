# Guia de Integracion Mobile - CommerCity

- **Fecha:** 2026-09-25
- **Autor:** Daniel Palacios
- **Estado:** Emitida para integracion (destinatario: Jhon Parra, repo `COMMERCITY-2.0-MOBILE-`)
- **Base de verificacion:** codigo real del backend (`backend/src/server/`) y del repo movil `https://github.com/BLACK-CODE-JSB/COMMERCITY-2.0-MOBILE-` (Ionic Capacitor 8.4.0, HTML/CSS/JS puro en `www/`). Todo endpoint y campo de este documento fue extraido del codigo fuente; lo no verificado esta marcado con `[VERIFICAR]`.

---

## 1. Objetivo y alcance

Conectar la app movil de Jhon Parra a la API REST del backend CommerCity (Express 5, puerto 3000) con un alcance minimo: **login y registro reales contra la API + catalogo de productos real desde la API**. El resto de modulos de la app (carrito, pedidos, chat, recuperacion de contrasena) permanece con su logica mock actual y queda fuera de este alcance.

| Modulo | Estado en este alcance | Detalle |
|---|---|---|
| Login real | **Incluido** | `POST /api/usuarios/login` con JWT Bearer |
| Registro real | **Incluido** | `POST /api/usuarios/register` (siempre crea rol "comprador") |
| Catalogo de productos real | **Incluido** | `GET /api/productos` (+ `GET /api/categorias`, `GET /api/vendedores` como apoyo) |
| Sesion (localStorage) | **Incluido** | Se llenan las claves que la app ya usa, con el rol REAL de la API |
| Recuperacion de contrasena | Mock (sin cambios) | La API ya expone `/recover` y `/reset-password` para un siguiente paso |
| Carrito, pedidos, chat, perfil | Mock (sin cambios) | Fuera de alcance; requieren RF/aval para ser implementados |

Beneficio formativo (SENA): esta integracion evidencia consumo de API REST con autenticacion JWT, manejo de errores de red y contrato de datos, competencias del programa que deben ser defendibles ante el instructor con las evidencias de la seccion 5.

## 2. Contrato de la API

### 2.1 Base URL y convenciones

- **Base URL del backend:** `http://<host>:3000`
  - Emulador Android: `http://10.0.2.2:3000` (10.0.2.2 es el alias del localhost del PC host).
  - Dispositivo fisico: `http://<IP-LAN-del-PC>:3000`.
- **Formato de respuesta uniforme:**
  - Exito: `{ "success": true, "message": "...", "data": { ... } }`
  - Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": [...] } }`
  - Codigos de error estandarizados: 400 `VALIDATION_ERROR`, 401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 404 `NOT_FOUND`, el resto `INTERNAL_ERROR`.
- **Autenticacion:** header `Authorization: Bearer <token>`. El token es un JWT que **expira en 7 dias**. En este alcance minimo, los endpoints que la app consume (login, register, catalogo) son publicos, pero el token se guarda para uso futuro.
- **Validacion (zod):** cuando falla, la API responde 400 con `message: "Datos invalidos"` y `details: [{ "campo": "...", "mensaje": "..." }]`.

### 2.2 Endpoints (extraidos del codigo real)

| Metodo | Path | Auth | Body (JSON) / Query | Respuesta exitosa (`data`) | Codigos |
|---|---|---|---|---|---|
| POST | `/api/usuarios/login` | No | `{ email, password }` (password min 6) | `{ token, user: { id, email, nombre_completo, foto_perfil, roles: [...] } }` | 200; 400 VALIDATION_ERROR; 401 "Credenciales invalidas"; 401 "Usuario inactivo"; 429 (rate limit); 500 |
| POST | `/api/usuarios/register` | No | `{ email, password, nombre_completo? }` (nombre_completo min 2, opcional) | `{ token, user: { id, email, nombre_completo, roles: ["comprador"] } }` | 201; 400 "El email ya esta registrado"; 400 VALIDATION_ERROR |
| POST | `/api/usuarios/recover` | No | `{ email }` | Mensaje uniforme anti-enumeracion: "Si el correo existe, recibiras un enlace para restablecer tu contrasena." | 200; 429 (rate limit) |
| POST | `/api/usuarios/reset-password` | No | `{ token, password }` | "Contrasena restablecida correctamente. Ya puedes iniciar sesion." | 200; 400 "El enlace es invalido o ya fue utilizado"; 400 VALIDATION_ERROR |
| GET | `/api/productos` | No (publico) | Query: `page` (def 1), `limit` (def 4, max 100, se recorta sin error), `nombre`, `categoria`, `vendedor` (todos filtros LIKE) | `{ pagina, limite, totalProductos, totalPaginas, hayPaginaAnterior, hayPaginaSiguiente, productos: [...] }` | 200 |
| GET | `/api/productos/:id` | No (publico) | - | Detalle normalizado del producto (ver 2.3) | 200; 404 "Producto no encontrado" |
| GET | `/api/categorias` | No | - | Lista de categorias | 200 |
| GET | `/api/vendedores` | No | - | Lista de vendedores | 200 |

Notas importantes:

- **Roles reales en BD:** los valores de `roles` son `"comprador"`, `"vendedor"`, `"administrador"`. Usar exactamente esos strings.
- **Rate limit:** login y recover estan limitados a **10 intentos por minuto por IP**. El cuerpo exacto del 429 `[VERIFICAR]` (puede diferir del contrato estandar).
- **Campos del item de producto en el LISTADO** (`productos[]` de `GET /api/productos`), verificados con alias SQL en el controller:

```json
{
  "id": 5,
  "vendedor_id": 2,
  "nombre": "Nombre del producto",
  "descripcion": "Descripcion del producto",
  "precio": 25000.0,
  "stock": 10,
  "imagen": "/uploads/1690000000000-foto.jpg",
  "fecha_creacion": "2026-08-01T12:00:00.000Z",
  "descuento_porcentaje": 10.0,
  "categoria": "Tecnologia",
  "vendedor": "Nombre del vendedor",
  "vendedor_foto": "/uploads/..."
}
```

- **OJO con la imagen:** en el LISTADO el campo se llama `imagen`; en el DETALLE (`GET /api/productos/:id`) se llama `imagen_url`. La API devuelve la ruta relativa `/uploads/<archivo>`, servida por el backend como estatico. La URL completa que debe usar la app movil es `API_URL + p.imagen`.
- El detalle ademas devuelve numeros normalizados (`precio`, `stock`, `descuento_porcentaje` como number), `categoria: { id, nombre }` y `vendedor: { id, nombre, foto, calificacion_promedio, total_calificaciones }`.
- El catalogo solo incluye productos con estado `'Disponible'` y no eliminados por admin (comportamiento correcto del backend, borrado logico).

## 3. Codigo listo para pegar

### 3.1 Mini cliente API: crear `www/api.js`

Crear el archivo `www/api.js` con este contenido (puede copiarse tal cual; solo ajustar `API_URL`):

```js
// www/api.js - Cliente minimo de la API CommerCity
// IMPORTANTE: en www/index.html, cargar este archivo ANTES de app.js:
//   <script src="api.js"></script>
//   <script src="app.js"></script>

// Emulador Android: http://10.0.2.2:3000
// Dispositivo fisico: http://<IP-LAN-del-PC>:3000 (misma red WiFi)
const API_URL = "http://10.0.2.2:3000";

async function apiRequest(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };

    const token = localStorage.getItem("commercity_token");
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    let response;
    try {
        response = await fetch(API_URL + path, { ...options, headers });
    } catch (networkError) {
        // Sin conexion: backend apagado, URL equivocada o permisos de red
        throw {
            status: 0,
            code: "NETWORK",
            message: "No se pudo conectar con el servidor. Verifica que la API este activa y que API_URL sea correcta (" + API_URL + ")."
        };
    }

    let body = null;
    try {
        body = await response.json();
    } catch (e) {
        body = null;
    }

    if (!response.ok || !body || body.success !== true) {
        const errorInfo = (body && body.error) || {};
        throw {
            status: response.status,
            code: errorInfo.code || "UNKNOWN",
            message: errorInfo.message || "Error inesperado (HTTP " + response.status + ").",
            details: errorInfo.details || []
        };
    }

    return body; // { success: true, message, data }
}

// ---- Auth ----

// POST /api/usuarios/login  ->  data: { token, user: { id, email, nombre_completo, foto_perfil, roles: [] } }
async function apiLogin(email, password) {
    const res = await apiRequest("/api/usuarios/login", {
        method: "POST",
        body: JSON.stringify({ email: email, password: password })
    });
    return res.data;
}

// POST /api/usuarios/register  ->  data: { token, user: { id, email, nombre_completo, roles: ["comprador"] } }
async function apiRegistro(email, password, nombreCompleto) {
    const payload = { email: email, password: password };
    if (nombreCompleto) {
        payload.nombre_completo = nombreCompleto;
    }
    const res = await apiRequest("/api/usuarios/register", {
        method: "POST",
        body: JSON.stringify(payload)
    });
    return res.data;
}

// ---- Catalogo ----

// GET /api/productos  ->  data: { pagina, limite, totalProductos, totalPaginas, hayPaginaAnterior, hayPaginaSiguiente, productos: [...] }
async function apiProductos(page, limit) {
    const res = await apiRequest("/api/productos?page=" + (page || 1) + "&limit=" + (limit || 100));
    return res.data;
}
```

### 3.2 Reemplazo de `handleLogin()` y `handleRegistro()` en `www/app.js`

Reemplazar COMPLETAMENTE las funciones mock actuales (incluido el admin hardcodeado `admin@gmail.com/admin123` y la deteccion de vendedor por substring del email) por estas versiones. Los IDs de los inputs se mantienen igual (`login-email`, `login-password`, `reg-username`, `reg-email`, `reg-password`, `reg-terms`, verificados en `www/index.html`).

```js
async function handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Ingresa tu email y tu contrasena.");
        return;
    }

    try {
        const data = await apiLogin(email, password);

        // Token para futuras peticiones autenticadas (clave nueva)
        localStorage.setItem("commercity_token", data.token);

        // Claves que la app YA usa (no cambiar los nombres)
        localStorage.setItem("commercity_user", data.user.nombre_completo || data.user.email);
        localStorage.setItem("commercity_email", data.user.email);
        localStorage.setItem("commercity_logged_in", "true");
        localStorage.setItem("commercity_is_seller", data.user.roles.includes("vendedor") ? "true" : "false");
        localStorage.setItem("commercity_is_admin", data.user.roles.includes("administrador") ? "true" : "false");

        alert("Bienvenido, " + (data.user.nombre_completo || data.user.email));
        // TODO Jhon: aqui va tu redireccion a la pantalla principal (el mismo flujo que tenias con el login simulado)
    } catch (err) {
        alert(err.message || "No se pudo iniciar sesion.");
    }
}

async function handleRegistro() {
    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const terms = document.getElementById("reg-terms").checked;

    if (!email || !password || !terms) {
        alert("Completa email, contrasena (minimo 6 caracteres) y acepta los terminos.");
        return;
    }

    try {
        const data = await apiRegistro(email, password, username);

        localStorage.setItem("commercity_token", data.token);
        localStorage.setItem("commercity_user", data.user.nombre_completo || data.user.email);
        localStorage.setItem("commercity_email", data.user.email);
        localStorage.setItem("commercity_logged_in", "true");
        // El registro por API siempre crea rol "comprador" en este alcance (ver Limitaciones)
        localStorage.setItem("commercity_is_seller", "false");
        localStorage.setItem("commercity_is_admin", "false");

        alert("Registro exitoso. Ya puedes comprar.");
        // TODO Jhon: redirigir a la pantalla principal
    } catch (err) {
        // Validaciones de zod llegan en err.details: [{ campo, mensaje }]
        if (err.details && err.details.length) {
            alert(err.details.map(function (d) { return d.campo + ": " + d.mensaje; }).join("\n"));
        } else {
            alert(err.message || "No se pudo registrar.");
        }
    }
}
```

Mapeo de sesion (claves localStorage que la app ya usa, verificado en `www/app.js`):

| Clave localStorage | Valor con la API real |
|---|---|
| `commercity_token` | `data.token` (JWT, clave NUEVA que se agrega) |
| `commercity_user` | `data.user.nombre_completo || data.user.email` |
| `commercity_email` | `data.user.email` |
| `commercity_logged_in` | `"true"` al iniciar sesion o registrarse |
| `commercity_is_seller` | `data.user.roles.includes("vendedor")` |
| `commercity_is_admin` | `data.user.roles.includes("administrador")` |

### 3.3 Carga del catalogo: reemplazo de la constante `PRODUCTS`

El mock usa un diccionario `PRODUCTS` con claves string y campos `{ name, cat, price, stock, disc, img, vendor, desc }` (verificado en `www/app.js`). Reemplazar la constante por una carga desde la API que construya el MISMO diccionario, de modo que `openProductDetail(key)` y el render actual sigan funcionando sin cambios.

```js
// En app.js: QUITAR la constante PRODUCTS mock y dejar el diccionario vacio;
// se llena desde la API al iniciar la app.
let PRODUCTS = {};

async function cargarCatalogoDesdeAPI(page, limit) {
    try {
        const data = await apiProductos(page, limit);

        PRODUCTS = {};
        data.productos.forEach(function (p) {
            PRODUCTS[String(p.id)] = {
                name: p.nombre,
                cat: p.categoria,
                price: p.precio,
                stock: p.stock,
                disc: p.descuento_porcentaje,
                img: API_URL + p.imagen,   // p.imagen es "/uploads/archivo.jpg" -> URL completa
                vendor: p.vendedor,
                desc: p.descripcion
            };
        });

        // TODO Jhon: volver a pintar tu catalogo aqui con tu render actual de PRODUCTS
        // (y/o wherever llamas hoy a la funcion que dibuja las tarjetas).
    } catch (err) {
        alert(err.message || "No se pudo cargar el catalogo.");
    }
}

// Llamar al iniciar la app (donde hoy se pinta el catalogo mock):
// cargarCatalogoDesdeAPI(1, 100);
```

Tabla de mapeo campo-backend -> campo-mock:

| Campo de la API (`productos[]`) | Campo mock (`PRODUCTS`) | Nota |
|---|---|---|
| `id` | clave del diccionario `String(p.id)` | El mock usa claves string; conservar el id real para poder validar stock despues con `GET /api/productos/:id/validar-stock` |
| `nombre` | `name` | Texto |
| `categoria` | `cat` | Nombre de la categoria (texto) |
| `precio` | `price` | Number (decimal(12,2) en BD) |
| `stock` | `stock` | Number (int en BD) |
| `descuento_porcentaje` | `disc` | Number; si tu render de tarjetas espera texto (ej. "-10%"), formatéalo a partir de este numero. `[VERIFICAR]` el formato exacto que tu render usa para `disc` |
| `imagen` | `img` | La API devuelve ruta relativa `/uploads/<archivo>`; componer `img: API_URL + p.imagen` |
| `vendedor` | `vendor` | Nombre completo del vendedor |
| `descripcion` | `desc` | Texto |
| `vendedor_foto` | (sin uso en el mock) | Queda disponible para futuro |
| `fecha_creacion` | (sin uso en el mock) | Queda disponible para futuro |

### 3.4 Manejo de errores: mostrar `message`

Todas las respuestas de error de la API traen `error.message` en espanol listo para mostrar al usuario. Reglas:

- Mostrar SIEMPRE `err.message` del catch (nunca mensajes genericos que oculten la causa real).
- Si `err.status === 0`: problema de red/conectividad (API apagada, `API_URL` incorrecta, dispositivo sin red).
- Si `err.status === 400` y `err.details` tiene elementos: errores de campo de validacion (`[{ campo, mensaje }]`), mostrarlos juntos.
- Si `err.status === 429`: superaste el rate limit de login/recover (10 por minuto); esperar un momento.
- Si `err.status === 401` con mensaje "Token expirado..." o "Token revocado...": limpiar `commercity_token` y enviar al usuario a login (relevante cuando se agreguen endpoints protegidos).

## 4. Conectividad

### 4.1 Levantar el backend (requisito previo)

```bash
cd backend
npm install
copy .env.example .env   # y completar DB_* y JWT_SECRET (obligatorio: el servidor no arranca sin JWT_SECRET)
npm run dev              # o npm start
```

El backend escucha en el puerto 3000 (`PORT` de `.env`, default 3000). Verificar con el navegador: `http://localhost:3000/api/productos` debe devolver `{"success":true,...}`.

### 4.2 Emulador Android

- Usar `API_URL = "http://10.0.2.2:3000"`. La IP especial `10.0.2.2` del emulador apunta al localhost del PC host.
- No usar `http://localhost:3000` dentro del emulador: apunta al propio emulador, no al PC.

### 4.3 Dispositivo fisico

- PC y celular en la misma red WiFi.
- Obtener la IP LAN del PC: `ipconfig` (adaptador Wi-Fi, campo "Direccion IPv4", ej. `192.168.1.50`).
- Usar `API_URL = "http://192.168.1.50:3000"` (la IP real del PC).
- Permitir el puerto 3000 en el firewall de Windows si el dispositivo no conecta (regla de entrada solo en la red privada).
- Advertencia: exponer el backend en LAN es para desarrollo local; no dejar el puerto abierto en redes publicas.

### 4.4 CORS: ya resuelto (no requiere accion)

El backend permite los origenes de la WebView Capacitor (cambio aplicado y registrado en `informes/CHANGELOG.md` con fecha 2026-09-25):

- `FRONTEND_URL` del `.env` (default `http://localhost:5173`),
- `https://localhost`,
- `http://localhost`,
- `capacitor://localhost` (iOS).

El APK de Android navega con Origin `https://localhost` porque Capacitor 8 usa el esquema `https` por defecto (`capacitor.config.json` del repo movil no define `androidScheme`, verificado). Por lo tanto **el CORS ya acepta las peticiones del APK sin ningun cambio adicional**.

## 5. Reconstruccion de la APK y criterios de aceptacion

### 5.1 Pasos

1. Crear `www/api.js` (seccion 3.1) y agregar el `<script src="api.js"></script>` en `www/index.html` antes de `app.js`.
2. Reemplazar `handleLogin()`, `handleRegistro()` y la carga de `PRODUCTS` (secciones 3.2 y 3.3).
3. Ajustar `API_URL` en `api.js` segun el entorno (emulador `10.0.2.2`, fisico IP LAN).
4. Sincronizar el proyecto nativo:

```bash
npx cap sync android
```

5. Abrir Android Studio (o `npx cap open android`) y compilar: Build > Build Bundle(s)/APK(s) > Build APK(s).
6. Instalar la APK y ejecutar los criterios de aceptacion.

(Para iOS seria `npx cap sync ios`, pero este alcance se limita a Android.)

### 5.2 Criterios de aceptacion (checklist de evidencias)

- [ ] El backend esta corriendo y `GET http://<API_URL>/api/productos` devuelve `{"success":true,...}` desde el navegador del PC.
- [ ] `www/api.js` existe y `index.html` lo carga ANTES de `app.js`.
- [ ] Login con un usuario REAL de la BD: devuelve token y se llenan las claves `commercity_user`, `commercity_email`, `commercity_logged_in`, `commercity_is_seller`, `commercity_is_admin` con el rol real (verificar en DevTools/`chrome://inspect`).
- [ ] Login con credenciales malas muestra "Credenciales invalidas" (mensaje de la API, no un generico).
- [ ] El admin hardcodeado `admin@gmail.com/admin123` ya NO inicia sesion (el codigo mock fue eliminado).
- [ ] Registro con un email nuevo: crea el usuario, inicia sesion y `commercity_is_seller = "false"` (rol comprador).
- [ ] Registro con email duplicado muestra "El email ya esta registrado".
- [ ] Registro con contrasena de menos de 6 caracteres muestra el error de validacion (400 con details).
- [ ] El catalogo muestra productos REALES de la BD con imagenes visibles (URL compuesta `API_URL + /uploads/...`).
- [ ] `openProductDetail(key)` sigue funcionando con el diccionario PRODUCTS generado desde la API.
- [ ] Con la API apagada, el login y el catalogo muestran el mensaje de red de la seccion 3.4 (sin crash de JS en consola).
- [ ] El resto de modulos mock (carrito, chat, pedidos) sigue funcionando sin errores de JavaScript en consola.
- [ ] `npx cap sync android` ejecutado antes de compilar la APK.
- [ ] Probado en emulador (10.0.2.2) y, si es posible, en dispositivo fisico (IP LAN).

## 6. Limitaciones conocidas

1. **Registro siempre como comprador:** el backend fija el rol "comprador" en `POST /api/usuarios/register`. El checkbox "Quiero vender" (`reg-seller`) del formulario movil NO tiene efecto real en este alcance; la app lo ignora. Promocionar a vendedor requiere RF/aval (control de scope SENA).
2. **Recuperacion de contrasena sigue mock:** la pantalla de recuperar/restablecer no se conecta en este alcance (la API ya expone `/recover` y `/reset-password` para un siguiente paso con RF).
3. **Token sin refresh:** el JWT expira en 7 dias; no hay refresh token. En este alcance no hay pantallas que consuman endpoints protegidos, asi que el impacto es bajo; cuando se agreguen, al recibir 401 "Token expirado" se debe volver al login.
4. **Rate limit en login:** 10 intentos por minuto por IP; en pruebas masivas puede aparecer 429. Formato exacto del cuerpo 429 `[VERIFICAR]`.
5. **Dependencia de la API para imagenes:** las imagenes del catalogo se sirven desde `/uploads` del backend; si la API no esta activa, las imagenes no cargan.
6. **API_URL manual:** cambiar de emulador a dispositivo fisico exige editar la constante `API_URL` en `api.js` y re-sincronizar. Detectarla automaticamente queda como mejora futura.
7. **Campos del listado sin uso:** `vendedor_foto` y `fecha_creacion` llegan en la respuesta pero el mock actual no los consume.
8. **Formato de `disc`:** la API envia `descuento_porcentaje` numerico; el formato exacto que el render de tarjetas del mock espera para `disc` no fue verificado en esta revision `[VERIFICAR]`.
9. **Filtros del catalogo:** `GET /api/productos` admite `nombre`, `categoria` y `vendedor` (busqueda LIKE); la barra de busqueda de la app puede conectarse despues sin cambios de backend.

---

Fin del documento. Cualquier duda sobre un campo o endpoint debe resolverse contra el codigo fuente citado (`backend/src/server/routes/usuarios.routes.js`, `backend/src/server/controllers/usuarios.controllers.js`, `backend/src/server/routes/productos.routes.js`, `backend/src/server/controllers/productos.controllers.js`, `backend/src/server/utils/response.js`).
