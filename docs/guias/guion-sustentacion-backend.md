# Guion de sustentacion - Backend y API REST de CommerCity

**Version del producto:** 1.3.4
**Fecha:** 2026-10-31 (corte de la evidencia: 2026-10-30)
**Duracion objetivo:** 12 a 15 minutos (10 de exposicion + 5 de demo)
**Audiencia:** instructor SENA
**Presentacion:** `docs/presentaciones/CommerCity_Sustentacion_Backend_API_10.pptx` (10 diapositivas)
**Documento de apoyo:** `docs/informes/MATRIZ_RF_ENDPOINTS_2026-10-30.md`

---

## 1. Que se va a demostrar

Cinco cosas, en este orden:

1. El backend esta **organizado por capas y por modulo**, con un router por dominio.
2. La API es **REST con contrato uniforme** y codigos HTTP coherentes.
3. La base de datos se crea con **esquema y migraciones versionadas**, no a mano.
4. La seguridad no es decorativa: **JWT, roles, validacion y errores controlados**.
5. Hay **pruebas automatizadas** y evidencia ejecutada, con limites declarados.

Lo que **no** se va a demostrar: que el sistema este listo para produccion, que los tres
clientes esten integrados o que exista una certificacion de seguridad. Si el jurado lo
pregunta, se responde con la seccion 7.

## 1.1 Mapa de las 10 diapositivas

| # | Diapositiva | Idea que sostiene | Apoyo en este guion |
|---|---|---|---|
| 1 | Portada | Version 1.3.4 y corte del 30-oct | - |
| 2 | Resumen | 74 operaciones, 13 routers, 539 pruebas, 97,02 % de lineas y 10/10 de notificaciones | Seccion 1 |
| 3 | Arquitectura | Monolito modular con un router por dominio | Paradas 1 y 2 |
| 4 | Contrato de la API | Respuesta uniforme, codigos HTTP y paginacion declarada | Parada 5 |
| 5 | Seguridad | Sesion revocable, roles, propiedad del recurso y datos cifrados | Parada 3 |
| 6 | Reglas de negocio | Checkout transaccional, IVA y comision 90/10 | Parada 6 |
| 7 | Persistencia | 19 tablas, 12 migraciones y ledger SHA-256 | Parada 7 |
| 8 | Calidad | 539/539, cobertura sobre umbrales y E2E pendiente en las notas | Seccion 5 |
| 9 | Trazabilidad | 112 de 141 RF con endpoint identificado | Seccion 7.6 |
| 10 | Cierre | Pendientes priorizados y demo de 5 minutos | Secciones 4, 5 y 8 |

Las diapositivas de inventario por modulo, evidencia por modulo y estado del sprint se
retiraron para dejar diez. El detalle por modulo sigue en la matriz RF y en el CHANGELOG;
la evidencia E2E pendiente y la coleccion Postman quedaron en las notas de la diapositiva 8.

## 2. Antes de empezar (checklist de 5 minutos)

| # | Verificacion | Comando o accion | Resultado esperado |
|---|---|---|---|
| 1 | Base de datos de desarrollo arriba | MySQL en `127.0.0.1:3306`, base `commercity_dev` | Conecta sin error |
| 2 | Variables de entorno cargadas | `backend/.env` con `DB_NAME=commercity_dev` | El servidor arranca |
| 3 | Servidor corriendo | `cd backend` y `npm start` | Banner `Commercity API v1` y puerto 3000 |
| 4 | Salud del servicio | `GET http://localhost:3000/health` | `status: ok`, `db: ok` |
| 5 | Documentacion viva | Abrir `http://localhost:3000/api/docs` | Interfaz Scalar con las 74 operaciones |
| 6 | Postman abierto | Coleccion `docs/api/postman/CommerCity.postman_collection.json` | Importa sin errores |
| 7 | Editor con archivos fijados | Pestanas abiertas de la seccion 3 | Cambio rapido entre paradas |
| 8 | Terminal en `backend/` | Lista para `npm test` | Sin procesos previos colgados |

**Regla de oro:** si algo falla en vivo, no se improvisa. Se muestra la evidencia ya
registrada (CHANGELOG, matriz, capturas) y se explica que la corrida en vivo fallo por
entorno. Nunca se inventa un resultado.

## 3. Recorrido por el codigo (5 minutos, 7 paradas)

Cada parada tiene un archivo, una linea y una frase. No se lee codigo completo: se senala y
se explica.

### Parada 1 - Estructura de carpetas (30 s)

Abrir el arbol de `backend/src/server/`.

> "El servidor esta separado en capas. `app.js` arma la aplicacion y `server.js` la levanta;
> esa separacion permite probar la app con Supertest sin abrir un puerto. `routes/` tiene 13
> routers, uno por modulo. `controllers/` tiene la logica y el acceso a datos.
> `middleware/` tiene autenticacion, roles, validacion, origen y errores. `schemas/` tiene 15
> archivos de validacion Zod. `utils/` concentra finanzas, reembolsos, cifrado y respuestas.
> `config/` tiene el pool de MySQL y la carga de archivos. `db/` tiene las 12 migraciones."

Frase de cierre: "No hay carpeta `models/` porque no usamos ORM; el SQL vive en los
controladores y se explica en la parada 6."

### Parada 2 - Montaje de la aplicacion (40 s)

Abrir `backend/src/server/app.js`, lineas 27 a 36 y 168 a 183.

> "Aqui se ve el orden de la cadena: primero se desactiva la cabecera que revela la
> tecnologia, luego Helmet, luego el limite de cuerpo JSON de 100 kilobytes. Mas abajo se
> montan los routers: cada `app.use` asocia un prefijo con un modulo."

Senalar `app.js:199`: "y al final el manejador de errores, que es el unico que responde 500".

### Parada 3 - Una ruta protegida (40 s)

Abrir `backend/src/server/routes/admin.routes.js`, linea 32.

> "Todas las rutas de administracion pasan por dos middleware. `authRequired` valida el JWT;
> `requireRoles` exige el rol administrador. Si el token falta, responde 401. Si el token es
> valido pero el rol no alcanza, responde 403. Son dos cosas distintas y el codigo las
> separa."

Abrir `backend/src/server/middleware/auth.middleware.js`, lineas 44 a 48 y 95 a 100.

> "La verificacion fija el algoritmo HS256, el emisor y la audiencia. Ademas consulta en una
> sola query si el token esta revocado, si la cuenta sigue activa y si la version del token
> coincide. Si la base de datos falla, el middleware responde 500 y no deja pasar: falla
> cerrado."

### Parada 4 - Validacion de entrada (30 s)

Abrir `backend/src/server/schemas/auth.schemas.js`, lineas 20 a 36.

> "El registro usa un esquema Zod estricto. `strict()` rechaza campos que no estan declarados,
> asi que un cliente no puede inyectar `rol: administrador` en el cuerpo. La contrasena exige
> ocho caracteres, letra y numero, y se rechaza si supera 72 bytes porque bcrypt ignora el
> resto."

### Parada 5 - Contrato de respuesta y errores (30 s)

Abrir `backend/src/server/utils/response.js`, lineas 5 a 38.

> "Todas las respuestas salen por dos funciones. Exito: `success: true` con `data` y mensaje
> opcional. Error: `success: false` con `error.code`, `error.message` y detalles opcionales.
> El codigo se deriva del estado HTTP, por eso 401 siempre es `UNAUTHORIZED` y 400 siempre es
> `VALIDATION_ERROR`."

Abrir `backend/src/server/middleware/error.middleware.js`, lineas 13 a 26.

> "El manejador central respeta el estado que trae el error, pero nunca devuelve el stack. Un
> error inesperado se convierte en 500 con mensaje generico."

### Parada 6 - Transaccion de compra (60 s, la mas importante)

Abrir `backend/src/server/controllers/pedidos.controllers.js`, lineas 134 a 200.

> "El checkout abre una transaccion, bloquea las filas de producto con `FOR UPDATE`, valida
> stock y recalcula el precio desde la base de datos. El precio que manda el cliente no se
> usa para cobrar. Si el stock no alcanza, revierte y responde 400."

Senalar lineas 272 y 291: "commit si todo salio bien, rollback ante cualquier fallo".

Abrir `backend/src/server/utils/finanzas.js` (o `controllers/pedidos.controllers.js`, lineas
193 a 199).

> "El IVA se calcula dividiendo el precio publicado entre 1,19. El 90 % del subtotal es del
> vendedor y el 10 % es comision. Solo se guarda el subtotal; el IVA no se almacena."

### Parada 7 - Base de datos y migraciones (40 s)

Abrir `backend/scripts/aplicar-migraciones.mjs`, lineas 32 a 42.

> "Las migraciones se aplican en orden, se registran en una tabla ledger y se valida el
> SHA-256 de cada archivo: si una migracion ya aplicada cambia de contenido, el script aborta.
> Ademas se niega a ejecutarse contra una base compartida salvo autorizacion explicita."

Senalar `db/` y explicar: "el esquema base esta en `schema_commercity.sql`, en la raiz, y las
migraciones cubren desde la 008. Las migraciones 001 a 007 se absorbieron en el esquema base
cuando el proyecto se consolido; por eso el numero no empieza en 001."

## 4. Demo en Postman (4 minutos)

Abrir la coleccion `CommerCity`, carpeta `00 - Demo sustentacion`. Ejecutar en este orden.

| # | Caso | Metodo y ruta | Cuerpo | Resultado esperado | Que decir |
|---|---|---|---|---|---|
| 1 | Login correcto | `POST /api/usuarios/login` | `{"email":"<cuenta de prueba>","password":"<clave>"}` | 200, `success: true`, `data.token` | "La API entrega un JWT y tambien fija una cookie httpOnly." |
| 2 | Login incorrecto | `POST /api/usuarios/login` | misma cuenta, clave errada | 401, `UNAUTHORIZED` | "No revela si el correo existe: mismo mensaje para cuenta y clave." |
| 3 | Rol insuficiente | `GET /api/admin/stats` con token de comprador | - | 403, `FORBIDDEN` | "Autenticado no es autorizado. El 403 viene del middleware de roles." |
| 4 | Cuerpo invalido | `POST /api/usuarios/register` | `{"email":"no-es-correo","password":"123"}` | 400, `VALIDATION_ERROR` con `details` | "Zod rechaza antes de tocar la base de datos." |
| 5 | Recurso inexistente | `GET /api/productos/999999` | - | 404, `NOT_FOUND` | "El 404 es uniforme y no expone la consulta." |
| 6 | Documentacion | `GET /api/docs` en el navegador | - | HTML de Scalar | "La documentacion se genera desde los esquemas Zod, no se escribe a mano." |

**Preparacion de tokens:** guardar el token de administrador y el de comprador en dos
variables de la coleccion (`{{tokenAdmin}}` y `{{tokenComprador}}`). No mostrarlos en pantalla
durante la sustentacion.

**Si el login falla en vivo:** no insistir. Abrir la pestana de `/api/docs`, mostrar el
contrato y pasar a la evidencia registrada. Un fallo de entorno no invalida el diseno.

## 5. Demo de pruebas (2 minutos)

Ejecutar en la terminal, desde `backend/`:

```powershell
$env:ALLOW_DESKTOP_ORIGINS='false'
npm test
```

Resultado esperado (539/539, confirmado el 2026-10-31; cifra registrada en el CHANGELOG de la version publicada el 30-oct):

```text
Test Files  36 passed (36)
     Tests  539 passed (539)
```

> "Son 539 pruebas unitarias en 36 archivos, mas dos archivos de integracion que se ejecutan
> aparte contra MySQL real. El caso H6 de CORS depende de la configuracion local; por eso
> `ALLOW_DESKTOP_ORIGINS` se fija en `false` para la corrida. Es una dependencia de entorno
> conocida, no una prueba desactivada."

Si el jurado pide cobertura, mostrar la corrida registrada: lineas 97,02 %, ramas 88,17 %,
funciones 99,57 %, sentencias 96,51 %, todas por encima de los umbrales 97/88/99/96.

**No ejecutar** `npm run test:integration` en vivo sin una base desechable y las variables
`TEST_DB_*`; la suite se salta los casos si no las encuentra y una corrida con casos saltados
no es evidencia.

### 5.1 Evidencia E2E por modulo (opcional, antes de la sustentacion)

El runner HTTP recorre los 13 modulos y genera un informe legible. **No** se conecta a la base
por su cuenta: usa la que tenga el servidor en su `.env`. Por eso el requisito es que el
servidor apunte a una base de desarrollo.

Precondiciones:

1. Servidor corriendo con `DB_NAME=commercity_dev` (nunca la base compartida).
2. Variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` de una cuenta administradora de prueba, solo en
   la sesion de la terminal. No se escriben en el guion ni en el repositorio.
3. Unos 5 minutos y conexion a la base.

Comando:

```powershell
cd C:\PROYECTOS\COMMER CITY
$env:ADMIN_EMAIL='<cuenta administradora de prueba>'
$env:ADMIN_PASSWORD='<clave de esa cuenta>'
node docs\AVANCES\PRUEBAS\ejecutar_pruebas.mjs
```

Si el servidor no esta en el puerto 3000: `$env:BASE_URL='http://localhost:3001'`.

Salida esperada al final: `RESULTADO GLOBAL: X/69 OK`. El script escribe `resultados.json` e
`INFORME_PRUEBAS.md` en el directorio desde donde se ejecuta.

Que hace con los datos: crea usuarios efimeros con correo con marca de tiempo, un producto de
prueba (que suspende al final), un reporte y un pedido. No renombra, no cambia el rol y no
desactiva cuentas reales. Aun asi, **solo se ejecuta contra una base desechable**.

Si no se ejecuta antes de la sustentacion, las notas de la diapositiva 8 (CALIDAD) declaran
el E2E como pendiente y la demo se apoya en Postman. No se inventa un resultado.

## 6. Mapa de archivos para responder rapido

| Pregunta probable | Archivo y linea |
|---|---|
| Donde se monta cada modulo | `backend/src/server/app.js:168-183` |
| Como se valida el JWT | `backend/src/server/middleware/auth.middleware.js:44-48` |
| Como se aplican los roles | `backend/src/server/middleware/role.middleware.js:10-31` |
| Como se valida la entrada | `backend/src/server/schemas/*.schema.js` y `middleware/validate.middleware.js` |
| Donde se centralizan los errores | `backend/src/server/middleware/error.middleware.js:13-26` |
| Como se define el contrato | `backend/src/server/utils/response.js:5-38` |
| Donde se conecta MySQL | `backend/src/server/config/db.js:24-33` |
| Donde se calcula el IVA y la comision | `backend/src/server/utils/finanzas.js` |
| Donde se bloquea el stock | `backend/src/server/controllers/pedidos.controllers.js:148-178` |
| Donde se restituye el stock | `backend/src/server/controllers/compras.controllers.js:243-245` |
| Donde se aplican las migraciones | `backend/scripts/aplicar-migraciones.mjs:32-42` |
| Donde se genera OpenAPI | `backend/scripts/gen-openapi.mjs` y `backend/src/server/docs/` |

## 7. Preguntas probables y respuestas preparadas

### 7.1 Sobre arquitectura

**"Usan MVC?"**
> "Usamos una separacion por capas inspirada en MVC, sin la capa de modelos: router,
> controlador, esquema de validacion y utilidades. El acceso a datos esta en el controlador
> porque usamos SQL directo con `mysql2`, no un ORM. Es un monolito modular: un proceso, 13
> modulos de dominio y una base comun."

**"Por que no hay capa de servicios o repositorios?"**
> "Es una decision consciente de alcance. Con 74 operaciones y un equipo pequeno, una capa
> intermedia agregaba indireccion sin un beneficio medible. El costo es que los controladores
> grandes concentran muchas consultas: el de pedidos tiene alrededor de 600 lineas. Esta
> identificado como deuda tecnica y la salida natural es extraer repositorios por modulo, no
> reescribir."

**"Por que no usan un ORM?"**
> "Porque el proyecto depende de bloqueos `FOR UPDATE` y de columnas generadas que el ORM
> tiende a ocultar. Con SQL explicito el jurado y el equipo ven exactamente que consulta se
> ejecuta y cuando se abre la transaccion. El costo es escribir mas SQL y validar a mano; por
> eso todas las consultas usan parametros `?`."

**"El nombre `getUsuarios` en la ruta raiz es confuso."**
> "Si. Ese controlador devuelve el estado del servidor, no una lista de usuarios. Revisamos que
> no expone datos personales: solo mensaje, estado, marca de tiempo y version. El nombre quedo
> de una version anterior. Esta en la lista de correcciones de nomenclatura, junto con
> `routes/routes.js`, que deberia llamarse `estado.routes.js`. No lo cambiamos antes de la
> sustentacion para no introducir riesgo sin necesidad."

### 7.2 Sobre la API

**"Por que `query` y no `execute`?"**
> "`query` envia el SQL y los parametros por separado, y el driver los escapa en el cliente;
> `execute` prepara la sentencia en el servidor. Ambos evitan inyeccion cuando se usan con
> parametros. Elegimos `query` por compatibilidad con el pool y con las consultas dinamicas
> que solo concatenan fragmentos fijos. Ningun valor del usuario se concatena."

**"Por que no todos los endpoints tienen validacion Zod?"**
> "El inventario lo dice con precision: 8 endpoints tienen esquema centralizado o de query, 9
> usan esquemas inline y el resto valida a mano con `Number()` y comprobaciones de tipo. La
> cobertura de validacion es una brecha declarada, no un cumplimiento total. La prioridad son
> las escrituras."

**"Por que la paginacion cambia entre modulos?"**
> "Porque los modulos se desarrollaron en momentos distintos. Catalogo usa `page` y `limit`;
> admin, chat e historial usan `pagina` y `por_pagina`, con tope de 100. Es una inconsistencia
> de contrato que documentamos; unificarla rompe clientes y requiere versionado."

**"Que pasa si mando un campo extra?"**
> "En los esquemas `.strict()` la respuesta es 400 con `VALIDATION_ERROR`. En los que no son
> estrictos, el campo se ignora. La diferencia esta en el inventario por endpoint."

### 7.3 Sobre la base de datos

**"Por que las migraciones empiezan en 008?"**
> "Porque las migraciones 001 a 007 se absorbieron en `schema_commercity.sql` cuando el
> proyecto se consolido en una sola linea base. El ledger arranca en la 008 y llega a la 018.
> El esquema base mas las migraciones producen las 19 tablas documentadas."

**"Cuantas tablas hay?"**
> "El esquema base declara 17 y las migraciones agregan dos al inventario documental, para 19.
> Esa cifra es del repositorio, no de un conteo de la base compartida: no se consulto."

**"`productos.estado` se puede actualizar?"**
> "No. Es una columna generada a partir del stock. El backend la lee y nunca la escribe, y la
> base rechaza un `UPDATE` sobre ella."

**"Como evitan corrupcion de datos en la compra?"**
> "Con una transaccion y bloqueo pesimista. Se leen las filas con `FOR UPDATE`, se valida el
> stock y se calcula el precio dentro de la transaccion. Si algo falla, rollback completo. Eso
> protege la consistencia; no es una prueba de comportamiento bajo cualquier nivel de
> concurrencia, y asi se declara."

### 7.4 Sobre seguridad

**"Donde esta el JWT?"**
> "Se emite en el login con HS256, emisor y audiencia fijos, y siete dias de vigencia. Viaja
> en `Authorization: Bearer` o en una cookie httpOnly con SameSite Lax. El middleware verifica
> firma, algoritmo, emisor, audiencia, expiracion, lista negra y version del token."

**"Guardan el numero de tarjeta?"**
> "No. El contrato solo acepta los ultimos cuatro digitos, la marca y el nombre del titular. El
> esquema rechaza cualquier campo con el numero completo. Eso reduce la exposicion, pero no es
> una certificacion PCI-DSS y no lo presentamos como tal. Es una desviacion deliberada del
> RF122, que pedia el numero completo: se resolvio por seguridad."

**"Los datos bancarios estan cifrados?"**
> "Si, con AES-256-GCM, derivacion HKDF-SHA256 y datos adicionales autenticados por usuario. La
> respuesta por defecto va enmascarada. El cifrado exige una estrategia de respaldo y rotacion
> de claves que todavia no esta implementada."

**"Por que el limite general afecta lecturas?"**
> "Porque el limitador esta montado sobre `/api/` sin filtrar metodo, aunque el comentario lo
> llame de escritura. Es una imprecision de nombre y de alcance, documentada. No se corrigio
> antes de la sustentacion."

### 7.5 Sobre pruebas y calidad

**"Cuantas pruebas tienen?"**
> "539 unitarias en 36 archivos. Ademas hay dos archivos de integracion: dinero, con 5 casos, y
> notificaciones, con 10. Las de integracion no corren con `npm test`; se ejecutan aparte y
> requieren MySQL real."

**"Que cubre la cobertura?"**
> "Lineas 97,02 %, ramas 88,17 %, funciones 99,57 %, sentencias 96,51 %. Mide codigo
> ejecutado, no requisitos cumplidos. Un endpoint puede estar cubierto y aun asi incumplir una
> regla de negocio."

**"Tienen pruebas E2E?"**
> "Hay un runner HTTP de 69 pasos que recorre los 13 modulos y genera un informe. La corrida
> contra la base de desarrollo esta pendiente y se presenta como pendiente. La coleccion de
> Postman de los 74 endpoints queda lista para ejecutarla."

**"Por que falla un caso de CORS con la configuracion local?"**
> "Porque el archivo local tiene `ALLOW_DESKTOP_ORIGINS=true` para probar los clientes de
> escritorio, y el caso H6 espera el valor por defecto. No se desactivo el control: se fija la
> variable en `false` solo para el proceso de prueba. El resultado es 539 de 539."

### 7.6 Preguntas incomodas

**"Esto esta listo para produccion?"**
> "No, y no lo afirmamos. Falta validar la base compartida, cerrar los E2E de los clientes,
> revisar la proteccion de ramas y definir operacion. Lo que si esta listo es el backend como
> base funcional y probada."

**"Cuantos requerimientos cumplen?"**
> "112 de 141 tienen al menos un endpoint identificado; 29 no lo necesitan o son brecha
> declarada. La matriz RF esta en el repositorio y se puede consultar RF por RF. No es una
> certificacion de cumplimiento: es trazabilidad."

**"Que es lo mas debil?"**
> "Tres cosas: la validacion de entrada no cubre el 100 % de los endpoints, los controladores
> concentran demasiada responsabilidad y la integracion con la base compartida no esta
> verificada. Las tres estan documentadas con su plan de correccion."

**"Que harian con dos semanas mas?"**
> "Primero, validar la base compartida en solo lectura y agregar una guarda que impida que las
> pruebas apunten a ella. Segundo, completar la validacion Zod de las escrituras. Tercero,
> extraer repositorios de los cuatro controladores grandes. Cuarto, dejar los E2E corriendo en
> CI."

## 8. Cierre (30 s)

> "En resumen: CommerCity tiene un backend modular con 74 operaciones, un contrato uniforme,
> autenticacion y permisos verificables, compras transaccionales y una base de datos versionada.
> Tiene 539 pruebas unitarias aprobadas y evidencia de integracion real en notificaciones y
> dinero. Lo que falta esta identificado y priorizado. Gracias."

## 9. Plan B si algo no funciona

| Falla | Que hacer |
|---|---|
| El servidor no arranca | Mostrar `GET /health` de una corrida previa y explicar el chequeo; continuar con el codigo |
| MySQL no conecta | Saltar la demo de escritura; mostrar la coleccion de Postman y el contrato en `/api/docs` |
| Postman no importa | Usar `curl` con un caso de login y mostrar la respuesta en consola |
| `npm test` tarda | No esperar en silencio: explicar mientras corre; si supera 90 s, cancelar y mostrar la salida registrada |
| Pregunta que no se sabe | "No lo tengo verificado; lo dejo como pendiente y lo confirmo por escrito" |

## 10. Frases que no se deben decir

- "Esta listo para produccion."
- "Esta blindado" o "es 100 % seguro".
- "Cumple todos los requerimientos".
- "No tiene vulnerabilidades".
- "Los tres clientes estan integrados".

Todas contradicen la evidencia del repositorio y son la forma mas rapida de perder credibilidad
en la sustentacion.
