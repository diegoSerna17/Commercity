# INFORME DEL DOCUMENTO "COMMERCITY 2.0 (OPTIMIZADO)"

**Fecha:** 2026-07-30
**Fuente:** `Commercity 2.0 (optimizado).docx` (enviado por el lider de desarrollo)
**Estado:** Documento de requerimientos verificado y analizado

---

## 1. Resultado de la conversion

| Atributo | Valor |
|---|---|
| **Archivo fuente** | `Commercity 2.0 (optimizado).docx` (796 KB) |
| **Archivo convertido** | `Commercity 2.0 (optimizado)/Commercity 2.0 (optimizado).md` |
| **Lineas totales** | 510 |
| **Imagenes** | Sin imagenes embebidas (no se creo carpeta img/) |
| **Estado** | Completo, sin contenido perdido |

## 2. Verificacion de integridad del contenido

| Seccion | Rango | Cantidad | Estado |
|---------|-------|:--------:|--------|
| Gestion de usuarios | RF1-RF13 | 13 | Completo |
| Perfil comprador | RF14-RF40 | 27 | Completo |
| Perfil vendedor | RF41-RF51 | 11 | Completo |
| Panel administrativo | RF52-RF73 | 22 | Completo |
| Productos | RF74-RF82 | 9 | Completo |
| Panel principal | RF83-RF90 | 8 | Completo |
| Notificaciones | RF91-RF96 | 6 | Completo |
| Interaccion comprador-vendedor | RF97-RF102 | 6 | Completo |
| Compra (carrito) | RF103-RF110 | 8 | Completo |
| Pedidos | RF111-RF114 | 4 | Completo |
| Mi tienda | RF115-RF123 | 9 | Completo |
| Ganancias | RF124-RF125 | 2 | Completo |
| **TOTAL RF** | | **125** | **Completo** |
| Requerimientos no funcionales | RNF1-RNF20 | 20 | Completo |

**Total: 145 requerimientos** (125 funcionales + 20 no funcionales).

Nota: se detecto un caracter suelto ("b") en la linea 508 del original, no afecta el contenido.

## 3. Resumen ejecutivo del documento

**Tipo de proyecto:** Marketplace web (E-Commerce tipo red social de ventas).
**Version:** 2.0 | **Fecha:** 12/05/2026 | **Equipo:** ADSO 35.
**Modelo de negocio:** Comision del 10% por venta para CommerCity, 90% para el vendedor.

### Roles definidos
- **Comprador** (rol por defecto): compra, chatea, califica, sigue vendedores.
- **Vendedor**: hereda todo lo del comprador + publica productos, gestiona pedidos, tiene tienda propia, registra cuenta bancaria.
- **Administrador**: no compra ni vende; supervisa, modera reportes, gestiona usuarios/productos, ve estadisticas e ingresos.

### Modulos funcionales (12)
1. Autenticacion y roles (RF1-RF13)
2. Perfil comprador con feed social (RF14-RF40)
3. Perfil vendedor con CRUD de productos (RF41-RF51)
4. Panel admin con reportes y comisiones (RF52-RF73)
5. Catalogo con detalle y reporte de productos (RF74-RF82)
6. Panel principal con busqueda y filtros (RF83-RF90)
7. Notificaciones con indicador (RF91-RF96)
8. Chat interno + seguidores + reputacion (RF97-RF102)
9. Carrito y pasarela de pago simulada (RF103-RF110)
10. Pedidos con estados (RF111-RF114)
11. Mi tienda con cuenta bancaria y estadisticas (RF115-RF123)
12. Calculo automatico de ganancias 90/10 (RF124-RF125)

### Tecnologias definidas por el lider
| Capa | Web | Movil |
|------|-----|-------|
| Frontend | React / Tailwind / HTML | React Native |
| Backend | Node.js / Express.js | Node.js |
| BD | MySQL | MySQL |

### Innovaciones propuestas (IA)
- ChatBots en el chat
- Buscador inteligente (texto natural)
- Recomendador de productos
- Descripciones automaticas para vendedores

## 4. Implicaciones para el backend

| Aspecto | Requerimiento | Impacto backend |
|---------|---------------|-----------------|
| **Auth** | RF1-RF6, RNF8 | JWT + bcrypt + recuperacion por email |
| **Roles** | RF7-RF10 | RBAC: comprador/vendedor/admin (roles en tabla usuarios) |
| **Cuenta bancaria** | RF72, RF116-RF118 | Tabla cuenta_bancaria cifrada (RNF11) |
| **Comisiones** | RF53, RF124-RF125 | Logica 90/10 automatica en cada transaccion |
| **Pedidos y estados** | RF29, RF112-RF114 | Tabla pedidos + historial de estados |
| **Reportes** | RF57-RF63 | Tabla reportes (usuario/producto) con evidencias |
| **Chat** | RF97 | Tabla mensajes (o WebSockets a futuro) |
| **Reputacion** | RF47, RF80, RF99 | Tabla calificaciones 1-5 estrellas |
| **Seguridad** | RNF8-RNF11 | Consultas parametrizadas, cifrado, validacion |

## 5. Aspectos pendientes de aclarar con el lider

1. **Recuperacion de contrasena** (RF3-RF4): requiere envio de email (Nodemailer/Resend) - no especifica servicio.
2. **Almacenamiento de imagenes** (evidencias, productos): no especifica (local, S3, Cloudinary).
3. **Chat en tiempo real**: no especifica WebSockets o polling.
4. **Pasarela de pago simulada** (RF108-RF110): solo pide numero y nombre de tarjeta - no hay proveedor definido.

---

*Documento generado el 2026-07-30 a partir del archivo enviado por el lider de desarrollo.*
