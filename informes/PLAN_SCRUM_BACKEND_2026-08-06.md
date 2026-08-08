# Plan Scrum Backend - CommerCity

**Lider backend (web):** Daniel Palacios
**Fecha:** 6 de agosto de 2026
**Entrega parcial:** Martes 11 de agosto de 2026
**Entrega final del proyecto:** \~26-27 de septiembre de 2026

***

## 1. Organigrama oficial del proyecto

| Area                              | Lider                |
| --------------------------------- | -------------------- |
| Director CommerCity               | Jose Yepes           |
| Lider backend (web)               | Yo - Daniel Palacios |
| Lider frontend (web)              | Diego Serna          |
| Lider Base de Datos               | Jorge Andres Meneses |
| Lider Escritorio                  | Sebastian            |
| Lider Movil                       | Jhon Parra           |
| Lider Documentacion Frontend      | Jose Yepes           |
| Lider UML backend                 | Jose Yepes           |
| Lider documentacion Base De Datos | Jorge Andres Meneses |

## 2. Linea de tiempo

| Hito                         | Fecha                           |
| ---------------------------- | ------------------------------- |
| Inicio del Sprint 1          | 6 de agosto de 2026             |
| Primer corte de avance (48h) | 8 de agosto de 2026, 6:00 PM    |
| **Entrega parcial backend**  | **Martes 11 de agosto de 2026** |
| Entrega final del proyecto   | \~26-27 de septiembre de 2026   |

## 3. Estado actual del backend (verificado)

| Modulo                                         | Estado                                      |
| ---------------------------------------------- | ------------------------------------------- |
| Carrito (4 endpoints, agrupacion por vendedor) | Completado por mi - 19 tests, cobertura 93% |
| Usuarios                                       | Placeholder                                 |
| Router base + carrito                          | Montados en `app.js`                        |
| Resto de modulos del equipo                    | Pendientes de desarrollo                    |

## 4. Modulos asignados al equipo backend

| Orden de integracion | Modulo                     | Integrante      | Depende de                          |
| -------------------- | -------------------------- | --------------- | ----------------------------------- |
| 1                    | Autenticacion (JWT + RBAC) | Diego Serna     | Ninguna (base de todo)              |
| 2                    | Catalogo / Producto        | Carlos Perea    | Autenticacion                       |
| 3                    | Pedidos y Pago             | Carlos Vidal    | Carrito + Catalogo                  |
| 4                    | Historial de compras       | Jary            | Pedidos                             |
| 5                    | Mi Tienda (90/10)          | Erick           | Pedidos + Catalogo                  |
| 6                    | Reportes                   | Mosquera Flor   | Productos + Usuarios                |
| 7                    | Panel Admin                | Juan Cabrera    | Todo                                |
| 8                    | Panel Principal + busqueda | Brandon         | Catalogo                            |
| 9                    | Perfil Vendedor            | Jose Yepes      | Autenticacion                       |
| 10                   | Perfil publico             | Cristian Rosero | Autenticacion                       |
| -                    | Carrito                    | Yo              | Autenticacion (para proteger rutas) |

## 5. Cronograma de sprints

| Sprint   | Fechas    | Objetivo                                                     |
| -------- | --------- | ------------------------------------------------------------ |
| Sprint 0 | 6-8 ago   | Protocolo de entrega, DoD, permisos, coordinacion inter-area |
| Sprint 1 | 11-17 ago | **Entrega parcial**: carrito + modulos recibidos integrados  |
| Sprint 2 | 18-24 ago | Completar los 10 modulos backend                             |
| Sprint 3 | 25-31 ago | Integracion total + validacion contra BD real                |
| Sprint 4 | 1-7 sep   | Testing + seguridad + rendimiento                            |
| Sprint 5 | 8-14 sep  | Integracion con frontend                                     |
| Sprint 6 | 15-21 sep | Pruebas integrales + correccion de bugs                      |
| Sprint 7 | 22-27 sep | Release candidate + documentacion final                      |

## 6. Definition of Done (DoD) - aplica a cada modulo

Yo reviso cada modulo recibido y debe cumplir antes de integrarlo:

- [ ] Endpoints REST en `routes/` y logica en `controllers/` (sin SQL en rutas)
- [ ] Validacion de entrada y consultas parametrizadas (`?` de mysql2)
- [ ] Tablas/columnas verificadas contra `schema_commercity.sql` (evitar brecha B1)
- [ ] Pruebas unitarias con Vitest + Supertest (mock de BD), cobertura >= 60%
- [ ] Probado contra la BD remota real `commercy_v2`
- [ ] Entrada en `informes/CHANGELOG.md`
- [ ] Commit atribuido al autor real (`--author`)

## 7. Protocolo de entrega de los integrantes

### 7.1 Flujo de entrega

**Los companeros NO hacen push al repositorio.** Cada integrante me entrega su
modulo a mi directamente, yo reviso el codigo, lo valido contra el esquema y
las reglas de seguridad, y yo realizo el commit y el push. Este flujo centralizado
garantiza que nada se suba al repositorio sin haber pasado mi revision.

```
Integrante ──(entrega ZIP / local)──▶ Yo (Daniel): reviso y valido
                                              │
                                              ├─(aprueba)──▶ commit + push
                                              └─(rechaza)──▶ devolucion con correcciones
```

### 7.2 Formato de entrega (ZIP por integrante)

```
<usuario>-<modulo>.zip
├── controllers/<modulo>.controllers.js
├── routes/<modulo>.routes.js
├── __tests__/<modulo>.test.js        (si aplica)
└── README.txt                        # endpoints creados + como probar
```

### 7.3 Prohibido en la entrega

- `.env` (credenciales)
- `node_modules/`
- Archivos temporales o logs

### 7.4 Fechas de entrega

- **Corte de avance (48h)**: viernes 8 de agosto, 6:00 PM (reporte de progreso, no codigo final)
- **Entrega final parcial**: martes 11 de agosto (ZIP completo)

### 7.5 Consecuencias

- Quien no entregue su modulo no quedara registrado en el acta como contribuyente del backend.
- Yo integro los trabajos terminados y los commits quedan atribuidos a su autor real (`--author`).

## 8. Decisiones de los lideres (2026-08-06)

Decisiones tomadas en el grupo de lideres que impactan el backend:

| Decision | Detalle | Impacto backend |
|---|---|---|
| **Precio unitario por cantidad** | En el detalle del pedido e historial se mostrara: cantidad, precio unitario y subtotal (precio x cantidad), mas el monto total | Ya soportado por `detalle_pedidos` (precio_unitario_historico, cantidad, subtotal). Sin migracion |
| **Pedidos multi-producto** | Un pedido puede contener varios productos | Ya soportado por `detalle_pedidos`. Yepes implemento el frontend |
| **IVA 19%** | Confirmado por Yepes: IVA de Colombia = 19% (resuelve inconsistencia 15% vs 19%) | **No existe columna/tabla de IVA**: Meneses debe crear la entidad IVA |
| **Comisiones 90/10** | Al generar el pedido se guardan: admin 10%, vendedor 90% | Ya existe en `detalle_pedidos` (monto_vendedor, monto_comision AS subtotal * 0.90 / 0.10) |
| **Cambio de rol** (comprador a vendedor) | Por el momento en ajustes; en registro al final del proyecto | Endpoint PATCH de rol + tabla `usuario_roles` |

### Decision oficial del IVA (confirmada con Yepes 2026-08-06 8:12 PM)

Regla unica y definitiva del proyecto:

1. **El precio que publica el vendedor ya incluye el IVA 19%** (precio final al consumidor). No se calcula ni descuenta nada al publicar.
2. **En el detalle del pedido se muestra solo el monto total**, sin desglose de IVA.
3. **Las comisiones (10% admin / 90% vendedor) se calculan sobre el subtotal SIN IVA** — estandar del e-commerce, ya soportado por las columnas calculadas de `detalle_pedidos`.

**Implicacion tecnica**: no se requiere tabla/columna IVA para el flujo de pedidos. El precio de `productos` es el final (con IVA). Meneses NO necesita crear entidad IVA para esta decision; solo se crearia si a futuro se exige desglose fiscal.

### Alcance ampliado por las decisiones

| Integrante | Modulo | Cambio de alcance |
|---|---|---|
| Carlos Vidal | Pedidos y Pago | Generar pedido multi-producto: subtotal por linea, comisiones 90/10 sobre subtotal; **precio ya incluye IVA 19%** (sin desglose) |
| Jary | Historial de compras | Multi-producto por pedido con precio unitario por cantidad (precio_unitario_historico, subtotal); mostrar solo monto total |
| Meneses | Base de Datos | **Sin migracion de IVA** (decision oficial: precio final con IVA incluido). Solo confirmar comisiones existentes |
| Yepes | Perfil Vendedor | El vendedor publica el precio final (ya incluye 19%); sin calculo extra |

### Novedades 2026-08-06 (9 PM - grupo de lideres)

| Novedad | Quien | Estado / Accion |
|---|---|---|
| Proveedor de correo confirmado: **Resend** | Diego Serna | CERRADO - se usa Resend para el envio de links de recuperacion de contrasena |
| Requerimientos oficiales: **`Commercity 2.0 Final (optimizado).docx`** (flujo de IVA desde que el vendedor publica el producto) | Yepes | OFICIAL - documento de referencia del proyecto. Pendiente: recibir la actualizacion de optimizacion que Yepes subira a la carpeta del proyecto y revisar errores |
| Mockup Figma actualizado (cantidad x precio unitario del vendedor) | Yepes | DISPONIBLE - link oficial: https://www.figma.com/design/WeJbbg2MZuwRddWf2TCkOa/commercity-2.0?node-id=445-2&t=aRqva6MCQNtK6RSK-1 (node 445-2). Requiere sesion de Figma. No bloquea backend; el contrato ya esta soportado por `detalle_pedidos` |
| Expiracion del token (link 5 min) | Meneses/Yepes | REQUERIMIENTO YA DEFINIDO (RF4 del docx optimizado4: link de un solo uso, expira a los 5 min). PENDIENTE en BD: `usuarios.token_recuperacion_expiracion DATETIME NULL` |
| IVA (RF132) | Yepes | **RESUELTO (7/08 9:10 AM)**: el vendedor publica el precio con IVA 19% incluido; la pasarela saca el 19% del precio base (subtotal = precio/1.19) y del subtotal sale 90% vendedor / 10% CommerCity. Sin columna de IVA. Yepes actualizo Figma y agrego el dato imagen del producto |
| Pedidos N a 1 | Meneses | IMPLEMENTADO en BD (7/08): `detalle_pedidos` gano `estado_envio`, `estado_pago_vendedor`, `fecha_desembolso`; `pedidos.estado_pedido` eliminado (estado por linea/vendedor). Impacta RF119/RF120 |
| Seed de datos | Meneses | **RESUELTO (7/08)**: 20 usuarios (1 admin, 10 vendedores, 9 compradores), 82 productos, 16 categorias, 8 pedidos, 6 datos bancarios. Contrasena 123456 (Bcrypt). Correos reales: admin carlos.munoz@commercity.com, vendedor juan.giraldo@commercity.com, comprador camila.torres@commercity.com (los anunciados admin@/vendedor1@/comprador1@ NO existen) |
| Foto/imagen en pedidos | Meneses | PENDIENTE en BD: Meneses anuncio agregar el dato foto a pedidos; aun no existe columna en `pedidos`/`detalle_pedidos` (`productos.imagen_url` si existe) |

### Revision de requerimientos (documento oficial: Commercity 2.0 Final (optimizado))

Hallazgos al revisar el documento oficial (132 RF + 20 RNF; contenido equivalente al docx "3.0" recibido ~9:50 PM):

| # | Hallazgo | Impacto | Accion |
|---|---|---|---|
| 1 | **RF115**: "registrar el valor correspondiente al IVA de cada producto para su almacenamiento" | Contradice la decision 8:12 PM (sin columna IVA). Reactiva columnas `iva` / `monto_iva` en `detalle_pedidos` | Confirmar con Yepes y Meneses; de aprobarse, Meneses genera migracion |
| 2 | **RF131**: "90% vendedor, 10% comision commercity y 15% al iva" | ERROR de redaccion: 15% contradice el 19% (RF114/RF115); 90+10+15=115% no cierra | Avisar a Yepes para corregir el RF131 |
| 3 | **RF3/RF4** (recuperacion de contrasena) | NO mencionan expiracion del link/token (falta regla de negocio) | Proponer texto del RF (informe BD seccion 6) |
| 4 | **RFX** (modificar cantidad en carrito) | RF sin numero (nomenclatura pendiente, Yepes lo confirmo) | Esperar la nomenclatura de Yepes |
| 5 | **RF31** (historial): "Iva del %19 aplicado" | Refuerza almacenar/calcular IVA por linea | Mismo caso que RF115 |
| 6 | **RF97** (notificaciones): tipos compra/mensajes/reporte/pedido/en camino/entregado | ENUM actual de BD `notificaciones.tipo` = ('compra','mensajes','reporte','pedido enviado') desalineado | Ajustar ENUM con Meneses |
| 7 | Metadatos del docx | Dice version 2.0 / fecha 12/05/2026 (es el 3.0) | Yepes corrige portada |

### Novedades 2026-08-07 (noche - ultima version de requerimientos: optimizado 6)

El Director compartio la ultima version oficial `Commercity 2.0 (optimizado 6)`
y el docx `SUGERENCIAS DE AGREGADOS Y MEJORAS`. Revisados y cruzados con el
esquema real:

| # | Hallazgo | Impacto | Accion |
|---|---|---|---|
| 1 | **RF116** (opt.6): "registrar el valor del IVA de cada producto para su almacenamiento" | **CONFLICTO con RF132** (desglose en vuelo). Requiere `monto_iva`/`subtotal_con_iva` en `detalle_pedidos` o `iva_porcentaje` en `productos` | Confirmar con Yepes si se persiste el IVA o se mantiene el desglose (bloquea checkout). Informe BD v1.5 |
| 2 | **RF47** (opt.6): "el vendedor debe hacer el calculo adicional del IVA del %19" | **CONTRADICE RF132** (precio publicado CON IVA incluido; el vendedor NO calcula) | Aclarar redaccion con Yepes (interpretacion: el vendedor considera el IVA al fijar su precio). Informe BD v1.5 |
| 3 | RF4 (5 min) y RF132 | Se mantienen identicos en el optimizado 6 | Sin cambio |
| 4 | No existe RF que ordene **descontar stock** tras la compra | `productos.stock` existe; RF80/RF85 solo verifican | Propuesto como RF nuevo en las sugerencias del docx |
| 5 | Sugerencias docx: RF inventario, RF cancelaciones ("Pendiente" + restitucion stock), RF carritos abandonados (7 dias), RNF JWT, RNF ACID, RNF sanitizacion | Impacto en BD: stock, cancelaciones y `actualizado_en` en `carrito_items` | Recomendado aceptar; numeros definitivos los asigna Yepes. Informe BD v1.5 seccion 3.8 |
| 6 | `productos.estado` = enum('Disponible','Agotado') **STORED GENERATED** | El seed no lo inserta (correcto); backend solo lee | Documentado en informe v1.5 (sin accion) |

## 9. Coordinacion inter-area

| Area                | Contacto      | Accion                                                                      |
| ------------------- | ------------- | --------------------------------------------------------------------------- |
| Base de Datos       | Jorge Meneses | Confirmar tablas de pedidos/reportes en `commercy_v2` o generar migraciones |
| Frontend            | Diego Serna   | Acordar contrato de respuesta `{ success, data, error }`                    |
| Director + UML      | Jose Yepes    | Entregar flujos backend para el diagrama secuencial                         |
| Repositorio oficial | Director      | Gestionar el push del trabajo integrado al repositorio oficial              |

## 10. Versionado y gobernanza

- Formato de commits: `TAG: descripcion` (FEAT, FIX, REFACTOR, STYLE, DOCS, CHORE)
- **Solo yo realizo los commits y el push** del backend, tras la revision de cada modulo.
- Push solo con autorizacion explicita del Director.
- Nunca push directo a la rama principal del repositorio oficial.

