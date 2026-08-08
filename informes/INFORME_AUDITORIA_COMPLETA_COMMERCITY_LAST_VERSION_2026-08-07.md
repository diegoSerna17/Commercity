# INFORME DE AUDITORIA COMPLETA DEL PROYECTO COMMERCITY (LAST VERSION)

**Autor:** Daniel Palacios (Lider backend web)
**Fecha:** 2026-08-07
**Dirigido a:** Jose Yepes (Director), Jorge Meneses (BD), Diego Serna (Frontend) y todos los integrantes (todas las areas)
**Fuentes auditadas (UNICAS):** carpeta `LAST VERSION`
**Estado:** Auditoria general de todas las areas (requerimientos, BD, semilla, backend, frontend)

***

## 1. Contexto

Como lider backend y coordinador de la auditoria general, recibi la instruccion de
revisar **solamente** la carpeta `LAST VERSION` (las ultimas versiones oficiales
subidas por el grupo) y auditar el proyecto completo cruzando todas las areas,
porque los requerimientos cambiaron varias veces y el equipo necesita una unica
fuente de verdad para avanzar sin bloqueos.

Archivos auditados:

| Archivo | Contenido | Estado |
|---|---|---|
| `LAST VERSION/Commercity (optimizado).docx` | Requerimientos oficiales (portada "Version 2.0"): **RF1-RF133 + RNF1-RNF19** | Convertido a .md y leido completo. Equivale al `optimizado 6` |
| `LAST VERSION/schema_commercity_3.sql` | Esquema BD v3: **19 tablas** + seeders de roles | Leido completo (DDL) |
| `LAST VERSION/seed_commercity.sql` | Semilla re-ejecutable (TRUNCATE + re-insert) | Leido completo (18 secciones de datos) |

Metodologia: cruce 1 a 1 de cada RF/RNF contra las columnas del schema v3 y contra
los datos de la semilla, mas el estado actual de los modulos backend ya integrados.

***

## 2. Resultado global (resumen ejecutivo)

| Area | Estado general | Brechas criticas |
|---|---|---|
| Requerimientos (RF/RNF) | Documento coherente como base, pero con 2 conflictos internos y 3 vacios de negocio | CRITICO: RF47 vs RF132 (IVA); RF116 vs RF132 (almacenar IVA); vacios en eliminacion/suspension de productos |
| Base de datos (schema v3) | Esquema solido (19 tablas, FKs con indice, utf8mb4) | CRITICO: `notificaciones.tipo` ENUM incompatible con la semilla; faltan columnas de RF4, RF120 (imagen) y carritos abandonados; DEFAULT de pago incorrecto |
| Semilla (seed) | Cubre la mayoria de tablas con datos utiles | CRITICO: `notificaciones.tipo='pedido enviado'` NO existe en el ENUM v3 (el INSERT falla); falta `producto_variantes`; reportes sin `estado_reporte='Resuelto'` cuando ya tienen respuesta |
| Backend | Carrito y perfil publico integrados; autenticacion revisada con pendientes | ALTA: expiracion token RF4, checklist de seguridad, contrato de respuesta, RF116/RF47 bloquean checkout |
| Frontend | No auditable aun desde LAST VERSION (no hay codigo FE oficial en la carpeta) | Dependencias de RF120 (imagen en pedidos) y RF47/RF132 |

**Veredicto**: el proyecto esta **estructuralmente sano pero bloqueado por 3
conflictos de requerimientos** que deben resolverse ANTES de que Meneses autorice
el esquema y la semilla (como el mismo dijo en el audio 18). Hay ademas 4
correcciones de BD/semilla necesarias para que el seed sea ejecutable.

***

## 3. Auditoria por area

### 3.1 Requerimientos (RF1-RF133, RNF1-RNF19)

Hallazgos del documento oficial de LAST VERSION:

| # | Hallazgo | Tipo | Recomendacion |
|---|---|---|---|
| R1 | **RF47** dice "el vendedor debe hacer el calculo adicional del IVA del %19" pero **RF132** (cerrado) dice que el vendedor publica precio CON IVA incluido y el sistema desglosa | CONFLICTO | Corregir redaccion de RF47: el vendedor considera el IVA al fijar su precio; el sistema desglosa. Confirmar con Yepes |
| R2 | **RF116** exige "registrar el IVA de cada producto para su almacenamiento" pero **RF132** lo calcula en vuelo (sin columna) | CONFLICTO | Decidir: (a) se persiste IVA por linea (columna `monto_iva`/`subtotal_con_iva` en detalle_pedidos) o (b) se mantiene desglose en vuelo. BLOQUEA checkout |
| R3 | **RF72** permite eliminar productos, **RF73** eliminar usuarios, pero NO se define que pasa con los productos si tienen **reportes pendientes o compras en proceso** (pregunta del grupo 7/08) | VACIO | Regla propuesta: los productos NO se eliminan fisicamente; se suspenden (`eliminado_por_admin=1` o `suspendido=1`) y quedan fuera de catalogo/carrito; los reportes y pedidos historicos se conservan |
| R4 | **RF74** banea al vendedor y suspende productos, pero NO define que pasa con sus **pedidos ya pagados en curso** | VACIO | Definir maquina de estados: los pedidos pagados se completan; los pendientes se cancelan con restitucion de stock; o interviene el admin |
| R5 | **RF41** "borrar datos del vendedor menos historiales" sin definir el destino de sus productos | VACIO | Aplicar la misma regla de suspension (R3): la cuenta se desactiva (borrado logico) y sus productos se suspenden |
| R6 | **No existe RF que ordene descontar stock** tras la compra (RF80/RF85 solo verifican) | VACIO | Aceptar el RF sugerido en el docx SUGERENCIAS: descontar stock al aprobar pago, con transaccion |
| R7 | **No existe RF de cancelaciones/devoluciones** ni de carritos abandonados | VACIO | Aceptar sugerencias del docx (cancelacion solo en "Pendiente", restitucion de stock; vaciar carritos tras 7 dias) |
| R8 | **RNF8-RNF11** son genericos; faltan RNF explicitos de **JWT con expiracion/firma, transacciones ACID y sanitizacion Zod** | VACIO | Aceptar sugerencias del docx; ya implementado parcialmente en reglas del proyecto |
| R9 | Numeracion: no existe RF6 (salta de RF5 a RF7); RF122 escrito "RF 122" | MENOR | Unificar numeracion al versionar la proxima revision |

**Coherente**: RF111 carrito multi-vendedor, RF112, RF115, RF119-RF122 (estados
por linea), RF125/RF126 cuenta bancaria, RF131 90% vendedor, RF133 moneda COP.

### 3.2 Base de datos (schema v3)

Brechas del esquema contra los requerimientos:

| # | Tabla | Brecha | RF afectado | Severidad | Solucion |
|---|---|---|---|---|---|
| B1 | `usuarios` | Falta `token_recuperacion_expiracion DATETIME NULL` | RF4 (link 5 min) | ALTA | `ALTER TABLE usuarios ADD COLUMN token_recuperacion_expiracion DATETIME NULL` |
| B2 | `notificaciones` | `tipo ENUM('compra','mensajes','reporte','pedido','en camino','entregado')` **NO contiene 'pedido enviado'** que usa la semilla; y en la BD real ya es VARCHAR(50) | RF97 + seed | **CRITICA** | `tipo` debe ser VARCHAR(50) (como ya hizo Meneses en la BD real) y el schema v3 debe reflejarlo |
| B3 | `notificaciones` | `estado ENUM('leído','no leído')` con acentos: correcto en DDL, pero la BD real tiene mojibake (`le├¡do`) | RF97 | CRITICA | Ejecutar `ALTER TABLE notificaciones MODIFY estado ENUM('leido','no leido') NULL` en la BD real |
| B4 | `pagos_simulados` | `estado DEFAULT 'Aprobado'` - el pago debe nacer 'Pendiente' hasta confirmarse | RF114 | MEDIA | `ALTER TABLE pagos_simulados ALTER estado SET DEFAULT 'Pendiente'` |
| B5 | `carrito_items` | Sin `updated_at`/`actualizado_en` | Carritos abandonados (sugerencia docx) | MEDIA | Agregar `updated_at TIMESTAMP` para poder vaciar carritos inactivos |
| B6 | `detalle_pedidos` | Sin **imagen del producto** (snapshot) | RF120 (lista de pedidos del vendedor muestra imagen) | MEDIA | Agregar `imagen_url VARCHAR(500) NULL` (copia al comprar, no depende del producto vivo) |
| B7 | `detalle_pedidos` | Sin columnas de IVA (`monto_iva`/`subtotal_con_iva`) | RF116 (pendiente decision) | ALTA (si se confirma RF116) | Esperar decision del Director (R2) antes de migrar |
| B8 | `productos` | `eliminado_por_admin TINYINT(1)` existe (OK), pero no hay regla/estado para "suspendido por baneo del vendedor" | RF73/RF74 | MEDIA | Usar `eliminado_por_admin` (y filtrarlo en catalogo/carrito) o agregar `suspendido` |
| B9 | `productos`/`usuarios` | Sin indice FULLTEXT para el buscador por nombre/categoria/vendedor | RF88, RF70, RF71 | MEDIA (rendimiento) | `FULLTEXT` en `productos.nombre`/`descripcion` (o indice compuesto) al crecer el catalogo |
| B10 | `productos` | Comentario del DDL: "cumplir RF47 (Variantes)" - RF47 ya NO es variantes (es IVA) | N/A | MENOR | Corregir comentarios del schema para no confundir al equipo |

**Coherente**: `detalle_pedidos` con `estado_envio`, `estado_pago_vendedor`,
`fecha_desembolso`, `monto_vendedor`/`monto_comision` GENERADAS (0.90/0.10);
`datos_bancarios.banco` (RF126); `mensajes_chat.tipo_mensaje`+`archivo_url`
(RF104); `reportes.evidencia_url`+`estado_reporte`+`respuesta_admin` (RF60-RF66);
`calificaciones_productos.respuesta_vendedor` (RF87); `producto_variantes`;
FK con `ON DELETE` explicito.

### 3.3 Semilla (seed)

| # | Tabla | Hallazgo | Severidad | Solucion |
|---|---|---|---|---|
| S1 | `notificaciones` | Inserta `tipo='pedido enviado'` (lineas 349, 357) que **NO existe en el ENUM del schema v3** -> el INSERT falla al ejecutar contra schema v3 | **CRITICA** | Alinear seed con `tipo VARCHAR(50)` (B2): cambiar 'pedido enviado' por 'pedido' o ampliar el ENUM |
| S2 | `notificaciones` | Inserta `estado='leído'/'no leído'` con acentos: correcto para schema v3, pero **falla contra la BD real** (ENUM con mojibake) | CRITICA | Aplicar B3 (corregir ENUM real) antes de re-ejecutar el seed |
| S3 | `reportes` | Los reportes con `respuesta_admin` y `respondido_at` (3 registros) no setean `estado_reporte='Resuelto'` (queda 'Pendiente' por default) | MEDIA | Marcar 'Resuelto' los reportes que ya tienen respuesta del admin |
| S4 | `producto_variantes` | Tabla sin datos de semilla (variantes tallas/colores vacias) | MEDIA | Agregar 2-3 variantes de ejemplo para probar RF47-variantes |
| S5 | `reportes` | `evidencia_url` NULL en todos (no se prueba el flujo de evidencias imagen) | BAJA | Agregar URLs de ejemplo en 2 reportes |
| S6 | `carrito_items` | Se deja vacio a proposito (OK) | INFO | - |
| S7 | `pedidos`/`detalle_pedidos` | `total_neto` y `subtotal` consistentes con precios y descuentos (verificado aritmeticamente) | INFO | - |
| S8 | `pagos_simulados` | Mezcla 'Aprobado'/'Pendiente' (util para pruebas) | INFO | - |

**Verificado**: 20 usuarios (1 admin, 10 vendedores, 9 compradores; password
`123456` Bcrypt; correos `nombre.apellido@commercity.com`), 82 productos, 16
categorias, 5 etiquetas, 8 pedidos, 10 detalle_pedidos, 13 reportes. Re-ejecutable
(TRUNCATE con FK_CHECKS=0).

### 3.4 Backend

| Modulo | Integrante | Estado | Pendientes |
|---|---|---|---|
| Autenticacion (JWT + RBAC) | Diego Serna | Revisado (informe v1.1) | RF4 expiracion 5 min, JWT_SECRET sin fallback, helmet/cors/rate-limit, Zod, transaccion en cambiarRol, contrato `{success,data/error}` |
| Carrito | Daniel Palacios | Integrado (19 tests) | Ninguno critico |
| Perfil publico | Cristian Rosero | Integrado (7 tests, RF106) | Ninguno |
| Catalogo / Producto | Carlos Perea | Pendiente de entrega | - |
| Pedidos y Pago | Carlos Vidal | Pendiente - **BLOQUEADO por RF116/RF47** | Esperar decision de IVA |
| Historial | Jary | Pendiente (plazo: corte 8/08, entrega 11/08) | - |
| Mi Tienda | Erick | Pendiente | - |
| Reportes | Mosquera Flor | Pendiente | - |
| Panel Admin | Juan Cabrera | Pendiente | RF73/RF74 requieren regla de suspension (R3/R4) |
| Panel Principal | Brandon | Pendiente | Buscador RF88 (FULLTEXT, B9) |
| Perfil Vendedor | Jose Yepes | Pendiente | RF47 redaccion, RF120 imagen |

### 3.5 Frontend

No hay codigo frontend oficial en `LAST VERSION`, por lo que la auditoria de FE se
limita a dependencias: (1) la pasarela debe desglosar subtotal + IVA (RF115/RF132);
(2) la lista de pedidos del vendedor debe mostrar imagen del producto (RF120 ->
requiere B6); (3) la tarjeta de producto (RF93) y las notificaciones (RF97) ya
tienen soporte de datos.

***

## 4. Brechas criticas priorizadas (accion inmediata)

| Prioridad | Brecha | Area | Responsable | Accion |
|---|---|---|---|---|
| 1 | RF47 vs RF132 (quien calcula el IVA) | Requerimientos | Yepes + Daniel | Redactar RF47 final |
| 2 | RF116 vs RF132 (almacenar o no el IVA) | Requerimientos + BD | Yepes + Meneses | Decidir; si se almacena, migrar `monto_iva`/`subtotal_con_iva` |
| 3 | `notificaciones.tipo` ENUM vs seed ('pedido enviado') | BD + semilla | Meneses | `tipo VARCHAR(50)` en schema v3 + alinear seed |
| 4 | Mojibake `notificaciones.estado` en BD real | BD | Meneses | `ALTER TABLE ... ENUM('leido','no leido')` |
| 5 | Regla de eliminacion/suspension de productos (reportes pendientes, compras en curso) | Requerimientos + BD | Yepes + Daniel + Meneses | Definir y redactar (R3/R4) |
| 6 | RF4: `token_recuperacion_expiracion` | BD | Meneses | Migracion de 1 columna |
| 7 | RF120: imagen en `detalle_pedidos` | BD | Meneses | Migracion de 1 columna |
| 8 | `pagos_simulados.estado DEFAULT 'Pendiente'` | BD | Meneses | Migracion de 1 columna |
| 9 | Carritos abandonados: `carrito_items.updated_at` | BD | Meneses | Migracion (si se acepta la sugerencia) |
| 10 | Seed: `estado_reporte='Resuelto'` en reportes respondidos; variantes de ejemplo | Semilla | Meneses | Ajustar seed |

***

## 5. Plan de accion recomendado

1. **Hoy (8/08)**: Yepes confirma RF47 y RF116 (puntos 1-2 de la tabla). Daniel
   entrega el acta de decisiones al grupo.
2. **Hoy/Manana**: Meneses aplica las migraciones 3-4-6-7-8 y ajusta el seed
   (S1-S5), dejando `schema_commercity_3.sql` y `seed_commercity.sql` de LAST
   VERSION ejecutables y autorizados.
3. **Sprint 1 (11/08)**: Carlos Vidal (Pedidos/Pago) y Jary (Historial) entregan
   sus modulos; Daniel los integra contra el esquema v3 ya corregido.
4. **Continuo**: backend aplica la checklist de `revision-requerimientos.md` en
   cada entrega (contrato, IVA, token 5 min, estados por linea, sin DELETE fisico,
   cobertura de tests).

***

## 6. Conclusion

La auditoria completa confirma que **no hay un problema de arquitectura, sino de
falta de decision y de consistencia entre los 3 artefactos oficiales** (requerimientos,
esquema y semilla). Los puntos 1-2 (IVA) y el punto 5 (eliminacion/suspension)
deben cerrarse con Yepes; con eso, Meneses autoriza el schema v3 + seed corregidos
y el backend puede avanzar sin fricciones en todos los modulos pendientes. Esta
auditoria se convertira en la referencia unica para las revisiones del equipo.

---

*Informe generado el 2026-08-07 por Daniel Palacios a partir de la revision
exhaustiva de los 3 archivos de `LAST VERSION` (requerimientos RF1-RF133/RNF1-RNF19,
schema v3 de 19 tablas y seed), la transcripcion de los audios 18-20 y el cruce
con el estado del backend. No se modifico ningun archivo oficial; los cambios
propuestos quedan listos para aprobacion.*
