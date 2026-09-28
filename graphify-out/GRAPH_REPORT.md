# Graph Report - .  (2026-09-27)

## Corpus Check
- 171 files · ~101,437 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 770 nodes · 1596 edges · 63 communities (42 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Backend DB Utilities
- Frontend API Client
- Express App Bootstrap
- Admin UI Components
- Bank Account Form
- Header Notifications UI
- ESLint Toolchain
- Bank Account API
- Seller Product UI
- Orders Cancellation Flow
- Frontend Dependencies
- Product Detail History
- Cart Checkout UI
- Backend Dependencies
- Database Schema Tables
- Vitest Coverage Config
- Architecture Concepts
- Package Metadata
- Test Dev Dependencies
- Hero Artwork Design
- NPM Scripts
- Chat Uploads Multer
- Product API Helpers
- Bank Account Tests
- Notifications Tests
- Seller Products Tests
- Code Comment Prefixes
- Logo Variants Identity
- Purchase History Data
- Admin Controller Tests
- Ratings Controller Tests
- Chat Controller Tests
- Orders Controller Tests
- Reports Controller Tests
- Vite Setup Guide
- Product UI Mappers
- Resend Mailer
- Zod Validation
- Refund Migration SQL
- Auth Tokens Migration
- Images Migration SQL
- Followers Tests
- Chat Mock Data
- Product Seed Data
- Brand Identity Concept
- Cart City Icon
- Brand Color Scheme
- Wordmark Gradient Logo
- Git Workflow Guide

## God Nodes (most connected - your core abstractions)
1. `request()` - 77 edges
2. `successResponse()` - 65 edges
3. `errorResponse()` - 47 edges
4. `pool` - 23 edges
5. `getCurrentUser()` - 22 edges
6. `validarId()` - 20 edges
7. `authRequired()` - 13 edges
8. `usuarios` - 13 edges
9. `PerfilVendedor()` - 12 edges
10. `formatPrice()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `NPM dev build preview lint scripts` --semantically_similar_to--> `Vite install dependencies via npm`  [INFERRED] [semantically similar]
  Scripts.txt → frontend/instalar.txt
- `index.html root div main.jsx entry` --conceptually_related_to--> `React SPA Vite port 5173`  [INFERRED]
  frontend/index.html → README.md
- `obtenerProducto()` --calls--> `request()`  [EXTRACTED]
  frontend/src/services/productos.service.js → frontend/src/api/client.js
- `Git unversioning of scripts rules reports` --references--> `CommerCity ecommerce platform`  [EXTRACTED]
  TEST.MD → README.md
- `getReportes()` --indirect_call--> `mapearReporte()`  [INFERRED]
  backend/src/server/controllers/admin/reportes.controllers.js → backend/src/server/controllers/admin/admin.utils.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pipeline de peticion autenticada Express** — readme_auth_middleware_jwt, readme_rbac_roles, readme_validacion_zod [EXTRACTED 0.75]

## Communities (63 total, 21 thin omitted)

### Community 0 - "Backend DB Utilities"
Cohesion: 0.06
Nodes (76): pool, capitalizar(), escapeLike(), formatFecha(), mapearReporte(), validarId(), buscarAdmin(), destinoPedidosVendedor() (+68 more)

### Community 1 - "Frontend API Client"
Cohesion: 0.06
Nodes (45): clearToken(), getCurrentUser(), getToken(), setCurrentUser(), setToken(), App(), NAV_SECTIONS, Navbar() (+37 more)

### Community 2 - "Express App Bootstrap"
Cohesion: 0.06
Nodes (43): app, CORS_ORIGINS, __dirname, opcionesRateLimit, __dirname, FORMATOS_PERMITIDOS, storage, upload (+35 more)

### Community 3 - "Admin UI Components"
Cohesion: 0.08
Nodes (21): BadgeComision(), BadgeEstadoReporte(), BadgeEstadoUsuario(), BadgeTipo(), IconClose(), IconImage(), IconProduct(), IconSearch() (+13 more)

### Community 4 - "Bank Account Form"
Cohesion: 0.08
Nodes (33): ACCOUNT_TYPE_OPTIONS, BANK_OPTIONS, BANK_VALIDATORS, BankAccountForm(), fieldClasses(), SelectField(), TextField(), fmt() (+25 more)

### Community 5 - "Header Notifications UI"
Cohesion: 0.12
Nodes (32): request(), Header(), mapearRuta(), NotificacionesDropdown(), tiempoRelativo(), mapearRuta(), NotificacionesEnVivo(), AjustesAdministrador() (+24 more)

### Community 6 - "ESLint Toolchain"
Cohesion: 0.06
Nodes (35): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks (+27 more)

### Community 7 - "Bank Account API"
Cohesion: 0.14
Nodes (28): bancoSchema, buildMaskedRecord(), buildRecord(), buscarCuentaCommercity(), getMiCuentaBancaria(), getMiCuentaBancariaMasked(), upsertMiCuentaBancaria(), bancoSchema (+20 more)

### Community 8 - "Seller Product UI"
Cohesion: 0.12
Nodes (26): AgregarProducto(), formatearPrecio(), valoresIniciales(), SeguidoresModal(), formatSocialCount(), perfilVendedorSocial, extraerListaProductos(), formatearPrecio() (+18 more)

### Community 9 - "Orders Cancellation Flow"
Cohesion: 0.13
Nodes (23): cancelarPedidoComprador(), estadoPredominante(), getHistorialComprasComprador(), NORMALIZAR_ESTADO(), actualizarEstado(), confirmarPago(), confirmarPagoSchema, ESTADO_NIVEL (+15 more)

### Community 10 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (27): framer-motion, dependencies, framer-motion, lucide-react, react, react-dom, react-router-dom, swiper (+19 more)

### Community 11 - "Product Detail History"
Cohesion: 0.13
Nodes (20): buscarPedidoDelVendedor(), FichaProducto(), formatearPrecio(), DetalleCompras(), ETIQUETA_ESTADO, etiquetaEstado(), FILTERS, formatearFecha() (+12 more)

### Community 12 - "Cart Checkout UI"
Cohesion: 0.16
Nodes (12): Carrito(), formatPeso(), carritoVacio, mockPasarelaPago, formatPeso(), PasarelaPago(), totales, eliminarProducto() (+4 more)

### Community 13 - "Backend Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, bcrypt, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken (+11 more)

### Community 14 - "Database Schema Tables"
Cohesion: 0.25
Nodes (18): calificaciones_productos, calificaciones_vendedores, carrito_items, categorias, datos_bancarios, detalle_pedidos, etiquetas, mensajes_chat (+10 more)

### Community 15 - "Vitest Coverage Config"
Cohesion: 0.17
Nodes (12): include, provider, thresholds, coverage, environment, branches, functions, lines (+4 more)

### Community 16 - "Architecture Concepts"
Cohesion: 0.20
Nodes (11): index.html root div main.jsx entry, API REST Express port 3000, JWT Bearer auth middleware with blacklist, CommerCity ecommerce platform, MySQL 8 connection pool, RBAC buyer seller admin roles, React SPA Vite port 5173, Resend transactional mail fail-soft (+3 more)

### Community 17 - "Package Metadata"
Cohesion: 0.22
Nodes (8): author, description, keywords, license, main, name, type, version

### Community 18 - "Test Dev Dependencies"
Cohesion: 0.22
Nodes (9): devDependencies, nodemon, supertest, vitest, @vitest/coverage-v8, vitest, @vitest/coverage-v8, nodemon (+1 more)

### Community 19 - "Hero Artwork Design"
Cohesion: 0.33
Nodes (7): fondo_City_Black background artwork, ecommerce growth design rationale, blue growth arrow motif, hero background usage, optimistic night commerce mood, night cityscape backdrop, orange shopping cart motif

### Community 20 - "NPM Scripts"
Cohesion: 0.33
Nodes (6): scripts, dev, start, test, test:coverage, test:watch

### Community 21 - "Chat Uploads Multer"
Cohesion: 0.33
Nodes (5): __dirname, FORMATOS_PERMITIDOS, storage, uploadChat, UPLOADS_DIR

### Community 23 - "Product API Helpers"
Cohesion: 0.70
Nodes (4): listarProductos(), manejarRespuesta(), obtenerProducto(), validarStockProducto()

### Community 24 - "Bank Account Tests"
Cohesion: 0.50
Nodes (3): filaCifrada, tokenAdmin, tokenVendedor

### Community 27 - "Code Comment Prefixes"
Cohesion: 0.50
Nodes (4): Code documentation guide with prefixes, JS prefix logic handlers static data, RE prefix React hooks and JSX sections, TW prefix Tailwind styles tokens

### Community 28 - "Logo Variants Identity"
Cohesion: 0.50
Nodes (4): Commercity Black Background Logo, Commercity brand identity, Light logo usage on light vs dark backgrounds, Commercity light variant logo

### Community 29 - "Purchase History Data"
Cohesion: 0.50
Nodes (3): estadosHistorial, filtrosHistorial, historialCompras

### Community 35 - "Vite Setup Guide"
Cohesion: 0.67
Nodes (3): Vite install dependencies via npm, Vite React template with HMR ESLint, NPM dev build preview lint scripts

## Knowledge Gaps
- **169 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `request()` connect `Header Notifications UI` to `Frontend API Client`, `Bank Account Form`, `Seller Product UI`, `Product Detail History`, `Cart Checkout UI`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `successResponse()` connect `Backend DB Utilities` to `Orders Cancellation Flow`, `Bank Account API`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `pool` connect `Backend DB Utilities` to `Orders Cancellation Flow`, `Express App Bootstrap`, `Bank Account API`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend DB Utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.061275831087151844 - nodes in this community are weakly interconnected._
- **Should `Frontend API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.061458718992965566 - nodes in this community are weakly interconnected._
- **Should `Express App Bootstrap` be split into smaller, more focused modules?**
  _Cohesion score 0.05764411027568922 - nodes in this community are weakly interconnected._