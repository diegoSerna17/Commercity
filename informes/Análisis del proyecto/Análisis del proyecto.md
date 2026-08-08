He revisado el Documento de Proyecto Lectivo CommerCity v2.0 completo. El
diagnóstico siguiente parte de lo que realmente está deﬁnido en el documento y
separa claramente mis recomendaciones de arquitectura de lo que actualmente
dicen los RF/RNF.

Mi conclusión general es que el documento ya tiene suﬁciente alcance funcional
para diseñar una base de datos seria, pero todavía no conviene convertir los RF
directamente en tablas. Antes hay que corregir varias ambigüedades, especialmente
en roles, pedidos multi-vendedor, inventario, eliminación de datos, pagos, IVA y
distribución 90/10.

1. ANÁLISIS PARA LA BASE DE DATOS — MySQL

1.1 Entidades principales

Yo dividiría el modelo de CommerCity en estos grandes módulos:

Entidad

usuarios

roles

Propósito

Cuenta principal del sistema

Comprador, vendedor, administrador

usuario_roles

Relación N:M entre usuarios y roles

perﬁles

Foto, descripción y demás información pública

direcciones

Direcciones de envío del comprador

tiendas

Identidad comercial del vendedor

categorias

Clasiﬁcación global de productos

productos

Productos publicados por vendedores

producto_imagenes

Una o varias imágenes por producto

carritos

Carrito activo de cada comprador

carrito_items

Productos y cantidades del carrito

pedidos

Compra global realizada por el comprador

pedidos_vendedor

División del pedido por vendedor/tienda

Entidad

Propósito

pedido_items

Productos concretos comprados

pagos

Pago asociado al pedido

intentos_pago

Historial de pagos aprobados/rechazados

caliﬁcaciones

Evaluaciones realizadas después de una compra

notiﬁcaciones

Eventos enviados al usuario

reportes

Reportes sobre usuario/producto

reporte_evidencias

Imágenes adjuntas a reportes

conversaciones

Chat entre usuarios

mensajes

Mensajes de una conversación

mensaje_adjuntos

Fotos/archivos enviados en chat

seguimientos

Seguidores/seguidos

cuentas_bancarias

Información simulada del vendedor

movimientos_ﬁnancieros Comisión, valor vendedor, IVA, etc.

movimientos_inventario  Entradas/salidas/reposiciones

historial_estado_pedido  Auditoría de cambios de estado

El documento explícitamente contempla compradores, vendedores y
administradores; productos, categorías, pedidos, pagos simulados, reportes, chat,
seguidores, notiﬁcaciones, caliﬁcaciones y datos bancarios.

1.2 El modelo de roles no debería ser usuarios.rol

Este es uno de los puntos más importantes.

El documento dice:

•  RF7: comprador, vendedor y administrador.

•  RF8: todos los registrados son compradores incluso los vendedores.

•  RF10: los vendedores pueden vender y comprar.

•  RF43: el vendedor posee todas las funcionalidades del comprador.

Por ello recomiendo:

usuarios

   |

   | 1:N

   v

usuario_roles

   |

   | N:1

   v

roles

Ejemplo:

Jorge -> COMPRADOR

Jorge -> VENDEDOR

Mientras que:

Administrador -> ADMINISTRADOR

Esto es mucho más correcto que:

usuarios.rol = 'vendedor'

porque un vendedor realmente está desempeñando dos roles funcionales.

1.3 Estructura correcta del carrito multi-vendedor

RF111 establece que un carrito puede contener productos de diferentes vendedores.

Ese requerimiento cambia por completo la estructura de pedidos.

No recomiendo:

pedido

 ├── vendedor

 └── productos

porque un pedido puede involucrar varios vendedores.

Recomiendo:

PEDIDO #1001

Comprador: Juan

Total: $500.000

│

├── PEDIDO_VENDEDOR #1001-1

│   Vendedor A

│   ├── Producto A

│   └── Producto B

│

└── PEDIDO_VENDEDOR #1001-2

    Vendedor B

    ├── Producto C

    └── Producto D

En BD:

pedidos

    1

    |

    N

pedidos_vendedor

    1

    |

    N

pedido_items

Esto permite que cada vendedor vea solamente sus productos del pedido.

Además, cada pedido_vendedor puede tener su propio estado:

PENDIENTE

EN_CAMINO

ENTREGADO

CANCELADO

Así puede ocurrir:

Compra #1001

Tienda A -> ENTREGADO

Tienda B -> EN_CAMINO

Tienda C -> PENDIENTE

El documento actual no contempla bien esta situación.

1.4 El pedido debe guardar "fotografías históricas" de los datos

RF31 y RF119 quieren mostrar posteriormente:

•  producto;

•  vendedor;

•  dirección;

•  cantidad;

•  precio;

•

•

•

IVA;

total;

fecha;

•  estado.

No se debe depender únicamente de:

pedido_items.producto_id

porque mañana el vendedor podría cambiar:

Nombre

Precio

Descuento

IVA

Por tanto pedido_items debería guardar valores históricos:

producto_id

nombre_producto_snapshot

precio_unitario

cantidad

descuento_aplicado

subtotal

tasa_iva

valor_iva

comision_porcentaje

comision_valor

valor_vendedor

total

Lo mismo con la dirección.

No recomiendo simplemente:

pedido.direccion_id

sino guardar:

direccion_envio

ciudad_envio

departamento_envio

...

como snapshot.

Así, si el comprador cambia posteriormente su dirección, el pedido histórico no
cambia.

1.5 Inventario: uno de los mayores cuellos de botella

RF80 veriﬁca que la cantidad no supere el stock y RF85 impide agregar productos
agotados.

Pero falta el problema real:

¿Qué ocurre si quedan 2 unidades y dos compradores intentan comprar 2 unidades
simultáneamente?

Los dos podrían consultar:

stock = 2

y ambos pensar que pueden comprar.

Esto debe resolverse en el backend + MySQL mediante una transacción.

Conceptualmente:

START TRANSACTION;

SELECT stock

FROM productos

WHERE id = ?

FOR UPDATE;

-- veriﬁcar stock

UPDATE productos

SET stock = stock - ?

WHERE id = ?;

-- crear pedido

-- crear items

-- registrar pago

COMMIT;

O mediante una actualización atómica condicionada:

UPDATE productos

SET stock = stock - 2

WHERE id = 10

  AND stock >= 2;

Si no se actualiza ninguna ﬁla:

Stock insuﬁciente

Esto debería convertirse en un RF/RNF explícito.

1.6 Historial de pagos simulados

RF113 solo dice:

el sistema simulará el pago.

RF115 dice que se registrará IVA y RF116 solicita número y nombre de tarjeta.

Eso resulta insuﬁciente.

Un pedido podría tener:

Intento 1 -> RECHAZADO

Intento 2 -> RECHAZADO

Intento 3 -> APROBADO

Por tanto recomiendo:

pagos

y

intentos_pago

Por ejemplo:

intento_pago

--------------

id

pedido_id

estado

monto

referencia

ultimos_4

fecha

codigo_respuesta

Nunca almacenaría en la BD:

4111111111111111

completo.

Incluso siendo una simulación académica, lo correcto sería guardar:

**** **** **** 1111

o simplemente:

last4 = 1111

y trabajar exclusivamente con tarjetas ﬁcticias.

1.7 Sistema de caliﬁcaciones

RF84 y RF103 permiten caliﬁcar al vendedor después de una compra.

Pero debería existir una relación veriﬁcable:

Comprador

    ↓

Pedido pagado

    ↓

Producto / vendedor

    ↓

Caliﬁcación

No basta:

caliﬁcaciones(

 usuario_id,

 vendedor_id,

 estrellas

)

porque un comprador podría caliﬁcar inﬁnitamente.

Preferiría:

caliﬁcaciones

--------------

id

comprador_id

pedido_vendedor_id

vendedor_id

puntuacion

comentario

created_at

y una restricción:

UNIQUE (comprador_id, pedido_vendedor_id)

Además:

CHECK (puntuacion BETWEEN 1 AND 5)

Recomendaría permitir caliﬁcar solamente cuando:

pedido_vendedor.estado = ENTREGADO

y no simplemente después de haber iniciado el pago.

1.8 Restricciones críticas para RNF13 y RNF14

El documento exige consistencia, relaciones válidas y ausencia de duplicados en
registros críticos.

Por eso no basta con validaciones en Express.

También deben existir restricciones MySQL.

Usuarios

email VARCHAR(254) NOT NULL UNIQUE

password_hash VARCHAR(255) NOT NULL

Roles

UNIQUE (nombre)

Usuario/Rol

UNIQUE (usuario_id, rol_id)

Seguimientos

UNIQUE (seguidor_id, seguido_id)

CHECK (seguidor_id <> seguido_id)

Carrito

UNIQUE (carrito_id, producto_id)

Productos

precio DECIMAL(14,2) NOT NULL CHECK (precio >= 0)

stock INT UNSIGNED NOT NULL

Cantidades

cantidad INT UNSIGNED NOT NULL CHECK (cantidad > 0)

Caliﬁcación

puntuacion TINYINT UNSIGNED

CHECK (puntuacion BETWEEN 1 AND 5)

Porcentajes

DECIMAL(5,2)

Nunca usaría:

FLOAT

DOUBLE

para dinero.

Para COP recomiendo:

DECIMAL(14,2)

aunque en el proyecto se trabajen valores normalmente sin centavos.

1.9 Claves foráneas

Ejemplos críticos:

productos.tienda_id

    -> tiendas.id

productos.categoria_id

    -> categorias.id

direcciones.usuario_id

    -> usuarios.id

pedido_items.pedido_vendedor_id

    -> pedidos_vendedor.id

pedidos_vendedor.pedido_id

    -> pedidos.id

pedidos.comprador_id

    -> usuarios.id

caliﬁcaciones.comprador_id

    -> usuarios.id

Pero no utilizaría indiscriminadamente:

ON DELETE CASCADE

en entidades históricas.

Por ejemplo, eliminar un usuario no debería eliminar:

Pedidos

Pagos

Comisiones

Reportes

Historial

2. CORRECCIÓN DE REQUERIMIENTOS RF Y RNF

Hay bastantes RF válidos, pero varios describen más la pantalla que el
comportamiento del sistema.

2.1 Requisitos redundantes

Algunos casos claros:

RF

Problema

RF11 / RF12

Perﬁl de usuario y perﬁl vendedor redundantes

RF14 / RF15

Agregar/editar foto podrían ser un solo RF

RF16 / RF17

Agregar/editar descripción

RF22 / RF23

Prácticamente duplicados

RF24 / RF91

Acceso al carrito

RF25 / RF95

Acceso a notiﬁcaciones

RF45 / RF48

Agregar producto

RF60 / RF61

Acceder/ver reportes

RF69 / RF70 / RF71 Buscador administrativo excesivamente fragmentado

RF78 / RF94

Acceso al detalle del producto

RF81 / RF107

Agregar al carrito

RF84 / RF103

Caliﬁcar vendedores

También existe:

RFX: El usuario podrá modiﬁcar la cantidad...

Eso rompe la numeración y debería convertirse en un RF oﬁcial.

2.2 RF redactados como interfaz gráﬁca

Por ejemplo:

“por medio de la barra lateral”

“desde el topbar”

“por medio de un botón”

“eso desplegará el formulario”

“hacer clic en agregar producto”

“las tarjetas mostrarán…”

“podrá scrollear…”

Estos detalles aparecen repetidamente entre RF22–25, RF45, RF48, RF51–52, RF87–
95, etc.

Eso debería ir a:

•  guía UI/UX;

•  prototipo;

•  criterios de aceptación;

•  diseño de interfaces.

Un RF debería decir:

El sistema permitirá al vendedor registrar productos asociados a su tienda.

No:

El vendedor presionará un botón que desplegará un formulario...

Porque mañana se puede cambiar el botón por un modal o una página independiente
y el requerimiento de negocio continúa siendo exactamente el mismo.

2.3 Problema en RF40 y RF41

RF40 habla de:

comprador elimina su cuenta.

Pero RF41 dice:

“El sistema borrará todos los datos del vendedor después de que elimine su
cuenta...”

Hay una inconsistencia de sujeto.

Además, borrar todos los datos es problemático para integridad.

Recomendaría:

El sistema permitirá desactivar/eliminar lógicamente una cuenta, conservando de
forma anonimizada o histórica los registros necesarios para pedidos, pagos, reportes
y auditoría.

Implementación:

estado = ELIMINADO

deleted_at = fecha

en lugar de:

DELETE FROM usuarios;

2.4 Eliminar productos también es peligroso

RF72 permite al administrador eliminar productos.

Yo cambiaría:

eliminar

por:

suspender, desactivar o eliminar lógicamente.

Porque un producto puede estar referenciado por:

pedido_items

reportes

caliﬁcaciones

pagos

La historia comercial debe conservarse.

2.5 Estados del pedido incompletos

Actualmente solo:

PENDIENTE

EN CAMINO

ENTREGADO

RF29, RF119 y RF120 utilizan esos tres estados.

Faltan como mínimo:

PENDIENTE_PAGO

PAGADO

PREPARANDO

EN_CAMINO

ENTREGADO

CANCELADO

Si posteriormente implementan devoluciones:

DEVOLUCION_SOLICITADA

DEVUELTO

REEMBOLSADO

Además, el vendedor no debería poder hacer:

PENDIENTE -> ENTREGADO -> PENDIENTE

arbitrariamente.

Hay que deﬁnir una máquina de estados.

2.6 RF74: vendedor baneado

RF74 establece:

si se banea al vendedor, sus productos quedan suspendidos.

Correcto como concepto, pero falta deﬁnir:

¿Qué ocurre con sus pedidos actualmente pagados?

Este es un vacío considerable.

El sistema debería especiﬁcar si:

•  deben completarse;

•  se cancelan;

•

interviene el administrador;

•  se reembolsa al comprador.

2.7 Dirección del comprador

RF37 permite ingresar “su dirección” y RF38 exige dirección para comprar.

Sería mejor hablar de:

una o varias direcciones.

Ejemplo:

Casa

Trabajo

Casa de familiar

y seleccionar una durante checkout.

Además, como señalé anteriormente, se debe guardar un snapshot dentro del
pedido.

2.8 Pago demasiado ambiguo

RF113:

“El sistema simulará el pago”.

Faltan:

APROBADO

RECHAZADO

PENDIENTE

y las consecuencias de cada estado.

Por ejemplo:

APROBADO

Crear/conﬁrmar pedido

Descontar stock

Registrar comisión

Notiﬁcar vendedores

RECHAZADO

No descontar stock

No generar ingresos

Permitir nuevo intento

2.9 Contradicción matemática del IVA

Aquí se encuentra el error más importante del documento.

RF31 dice:

IVA 19%.

RF114 dice:

IVA aplicado del 19%.

RF115 vuelve a hablar del IVA.

Pero RF131 establece:

90% vendedor + 10% CommerCity + 15% IVA.

Matemáticamente:

90% + 10% + 15% = 115%

Por tanto RF131 es inconsistente.

Además contradice directamente el 19% establecido anteriormente.

2.10 Fórmula recomendada

Para efectos académicos, propongo deﬁnir expresamente:

IVA = 19%

Comisión CommerCity = 10%

Vendedor = 90%

Pero la comisión 90/10 debe aplicarse sobre una base deﬁnida, no sumarse al IVA.

Un modelo sencillo sería:

Supongamos:

Producto antes de IVA = $100.000

Entonces:

Subtotal          $100.000

IVA 19%            $19.000

Total comprador   $119.000

Distribución sobre la base:

Vendedor 90%       $90.000

CommerCity 10%     $10.000

IVA                 $19.000

---------------------------

Total              $119.000

Ahora sí:

90.000 + 10.000 + 19.000 = 119.000

La fórmula queda coherente.

Alternativa si el precio publicado YA incluye IVA

Si un producto aparece como:

$119.000 IVA incluido

entonces:

Base = 119.000 / 1,19

Base = 100.000

IVA = 19.000

Después:

Vendedor = 100.000 × 90% = 90.000

CommerCity = 100.000 × 10% = 10.000

Lo importante es elegir uno de los dos modelos y documentarlo.

En este momento el documento no indica claramente si:

precio del vendedor

es:

precio antes de IVA

o

precio IVA incluido

Eso debe resolverse antes de construir la BD.

3. SUGERENCIAS DE AGREGADOS Y MEJORAS

3.1 RF faltante — control de inventario transaccional

RF133 propuesto

El sistema deberá validar nuevamente el stock disponible de cada producto
inmediatamente antes de conﬁrmar el pago.

RF134

El sistema deberá descontar el inventario únicamente cuando el pago sea aprobado.

RF135

El sistema deberá evitar que dos compras simultáneas generen un stock negativo.

3.2 RF — cancelación y reposición

Actualmente falta completamente.

RF136

El sistema permitirá cancelar un pedido mientras no haya sido enviado, según las
reglas deﬁnidas por el sistema.

RF137

Cuando un pedido pagado sea cancelado, el sistema deberá reponer
automáticamente al inventario las unidades correspondientes.

Esto debería generar:

movimientos_inventario

por ejemplo:

VENTA       -2

CANCELACION +2

3.3 RF — historial de inventario

RF138

El sistema registrará los movimientos de inventario generados por ventas,
cancelaciones y ajustes manuales realizados por el vendedor.

Muy útil tanto académicamente como para auditoría.

3.4 RF — historial de estados

RF139

El sistema registrará la fecha, hora, usuario responsable, estado anterior y nuevo
estado de cada cambio realizado sobre un pedido.

Tabla:

pedido_estado_historial

Esto aumenta considerablemente la trazabilidad.

3.5 RF — devoluciones

Falta un módulo esencial.

Propongo:

El comprador podrá solicitar una devolución de un producto entregado indicando
motivo y evidencia.

Estados:

SOLICITADA

EN_REVISION

APROBADA

RECHAZADA

COMPLETADA

Además:

Una devolución aprobada deberá generar el ajuste ﬁnanciero e inventario
correspondiente según las reglas de negocio.

3.6 RF — pagos

Agregar:

El sistema registrará cada intento de pago con su resultado, fecha, monto y
referencia.

Un pago rechazado no modiﬁcará inventario, ganancias ni estado deﬁnitivo del
pedido.

Un pago aprobado no podrá procesarse dos veces.

Este último punto es particularmente importante.

3.7 RF — idempotencia

Imagine que el usuario presiona dos veces:

PAGAR

PAGAR

El backend no puede crear dos pedidos.

Debería existir:

El sistema deberá impedir el procesamiento duplicado de una misma operación de
compra.

Esto puede implementarse mediante:

idempotency_key

con:

UNIQUE

3.8 RF — reputación veriﬁcable

Cambiaría RF84/RF103 por algo más preciso:

El sistema permitirá al comprador caliﬁcar una única vez al vendedor asociado a un
pedido que haya alcanzado el estado Entregado.

Eso evita caliﬁcaciones falsas.

3.9 RF — categorías

Extrañamente, el documento utiliza categorías extensamente, pero no deﬁne un
CRUD administrativo completo para ellas.

Añadiría:

El administrador podrá crear, editar, activar y desactivar categorías.

Y:

No podrá eliminarse físicamente una categoría asociada a productos históricos.

3.10 RF — productos suspendidos

Añadir:

Los productos suspendidos, eliminados lógicamente o pertenecientes a vendedores
baneados no deberán aparecer en el catálogo público ni podrán agregarse al carrito.

3.11 RNF faltantes para Node.js/Express

Los actuales RNF8-RNF11 de seguridad son correctos como principio, pero
demasiado generales.

Yo agregaría:

Autenticación

RNF21

La API deberá utilizar autenticación basada en tokens seguros y veriﬁcar la identidad
del usuario antes de ejecutar operaciones protegidas.

Autorización

RNF22

La API deberá aplicar control de acceso basado en roles y veriﬁcar además la
propiedad de los recursos.

Esto último es muy importante:

Ser vendedor no signiﬁca que pueda modiﬁcar:

/products/987

si el producto pertenece a otro vendedor.

Contraseñas

RNF23

Las contraseñas deberán almacenarse exclusivamente mediante algoritmos de
hashing adecuados; nunca en texto plano ni mediante cifrado reversible.

Rate limiting

RNF24

Los endpoints sensibles como inicio de sesión, recuperación de contraseña y registro
deberán aplicar limitación de solicitudes.

Evita fuerza bruta.

Validación

RNF25

Todos los datos recibidos por la API deberán ser validados y saneados en el servidor
independientemente de las validaciones realizadas por el frontend.

SQL Injection

RNF26

Todas las consultas a MySQL deberán realizarse mediante consultas parametrizadas
o mecanismos equivalentes, evitando concatenación directa de entrada
proporcionada por usuarios.

Datos sensibles

RNF27

El sistema no almacenará números completos de tarjetas, códigos de seguridad ni
credenciales bancarias reales.

Para CommerCity académico es particularmente importante.

HTTPS

RNF28

Toda comunicación entre clientes y API en un entorno publicado deberá realizarse
mediante HTTPS.

Variables sensibles

RNF29

Credenciales de base de datos, secretos de autenticación y demás claves sensibles
deberán almacenarse fuera del código fuente mediante variables de entorno.

3.12 RNF para transacciones MySQL

Esto debería ser obligatorio.

RNF30

Las operaciones que involucren simultáneamente pedidos, pagos, inventario y
distribución ﬁnanciera deberán ejecutarse mediante transacciones ACID.

Es decir:

BEGIN

   crear pedido

   crear subpedidos

   crear items

   validar stock

   descontar stock

   registrar pago

   registrar comisión

COMMIT

Si algo falla:

ROLLBACK

Nunca debería quedar:

Pago = aprobado

Pedido = creado

Stock = sin descontar

o:

Stock = descontado

Pedido = no creado

3.13 RNF de concurrencia

RNF31

El sistema deberá controlar accesos concurrentes al inventario de forma que el stock
almacenado nunca pueda resultar negativo.

Esto es fundamental para MySQL.

3.14 RNF de auditoría

RNF32

El sistema registrará eventos críticos tales como inicio de sesión, cambio de rol,
baneo de usuarios, suspensión de productos, cambios de estado de pedidos y
operaciones administrativas.

Tabla:

audit_logs

con:

usuario

accion

entidad

entidad_id

fecha

ip

resultado

3.15 RNF de respaldo

Falta completamente.

RNF33

La base de datos deberá contar con un procedimiento periódico de respaldo y
recuperación.

Aunque sea un proyecto académico, es un muy buen RNF.

Arquitectura de datos que recomiendo ﬁnalmente

El núcleo debería quedar conceptualmente así:

USUARIOS

   │

   ├──── USUARIO_ROLES ──── ROLES

   │

   ├──── DIRECCIONES

   │

   ├──── PERFILES

   │

   ├──── SEGUIMIENTOS

   │

   ├──── NOTIFICACIONES

   │

   └──── TIENDAS

              │

              └──── PRODUCTOS ──── CATEGORIAS

                         │

                         └──── PRODUCTO_IMAGENES

COMPRADOR

   │

   └──── CARRITO

             │

             └──── CARRITO_ITEMS

                       │

                       └──── PRODUCTOS

PEDIDOS

   │

   ├──── PEDIDOS_VENDEDOR

   │          │

   │          └──── PEDIDO_ITEMS

   │

   ├──── PAGOS

   │          └──── INTENTOS_PAGO

   │

   ├──── HISTORIAL_ESTADOS

   │

   └──── MOVIMIENTOS_FINANCIEROS

PEDIDO_ITEMS

      │

      ├──── MOVIMIENTOS_INVENTARIO

      └──── CALIFICACIONES

Diagnóstico ﬁnal

Yo evaluaría el documento actual así:

Área

Estado

Usuarios y autenticación � Bien encaminado

Roles

� Necesita aclaración N:M

Productos

� Base suﬁciente

Categorías

� Falta gestión

Inventario

� Faltan reglas transaccionales

Carrito multi-vendedor  � Concepto correcto, modelo incompleto

Pedidos

� Necesita subpedidos por vendedor

Pagos sandbox

� Demasiado ambiguo

IVA

� Contradicción 19% / 15%

Comisión 90/10

� Falta deﬁnir base de cálculo

Caliﬁcaciones

� Falta compra veriﬁcada y unicidad

Cancelaciones

� No deﬁnido

Devoluciones

� No deﬁnido

Seguridad API

� RNF demasiado generales

Transacciones MySQL  � No deﬁnidas

Auditoría

� No deﬁnida

Integridad histórica  � Debe reforzarse

La corrección más urgente antes de crear las tablas es RF131. No conviene
comenzar a implementar la parte ﬁnanciera mientras el documento diga
simultáneamente IVA 19%, IVA 15%, 90% vendedor y 10% CommerCity, porque esa
contradicción terminaría reﬂejándose en las columnas, procedimientos y código del
backend.

Después de corregir eso, la decisión arquitectónica más importante sería adoptar
desde el comienzo Pedido maestro → Pedido por vendedor → Detalle de productos,
porque esa estructura resuelve correctamente el carrito multi-vendedor y evita tener
que rediseñar toda la base posteriormente.
