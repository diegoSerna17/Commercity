**Documento De Proyecto Lectivo CommerCity**

**Proyecto:** Plataforma marketPlace

**Versión:** 2.0

**fecha:** 12/05/2026

**INTRODUCCIÓN**

## **1.1 Propósito**

El propósito de este documento es describir los requisitos del sistema CommerCity, una plataforma web tipo marketplace que permitirá a los usuarios publicar, comprar y vender productos nuevos o usados desde cualquier dispositivo de forma fácil con conexión a internet.

Este documento está dirigido al equipo desarrollador ADSO 35, evaluadores académicos y futuros administradores del sistema, con el fin de establecer de manera clara las funcionalidades y características que deberá cumplir la aplicación.

## **1.2 Ámbito del Sistema**

El sistema será una plataforma web intermediaria entre compradores y vendedores donde los usuarios podrán:

* Entrar como Invitados y Registrarse e iniciar sesión.
* Crear perfiles como comprador, vendedor, administrador.
* Publicar productos en distintas categorías.
* Buscar y filtrar productos.
* Comunicarse mediante chat interno.
* Agregar productos al carrito de compras.
* Generar pedidos.
* Realizar pagos en entorno de simulación académica.
* Calificar y seguir vendedores mediante sistema de reputación.

Los beneficiarios principales serán emprendedores, vendedores independientes, empresas emergentes y clientes que deseen comprar de forma organizada y segura en un mismo entorno digital.

# **2. Descripción General**

## **2.1 Perspectiva del Producto**

Commercity es una plataforma de E-Commerce diseñada para generar identidad y pertenencia entre sus usuarios. Su nombre refleja la idea de formar una gran comunidad de negocios digitales, en la que compradores y vendedores puedan interactuar de manera fluida y confiable.

El sistema se centra en la comunicación y la interactividad, incorporando herramientas como chat interno, seguimiento de usuarios y sistema de calificaciones. La meta es que Commercity funcioneno solo como una tienda en línea, sino también como una red social de ventas, donde la experiencia de compra y venta sea dinámica, social y confiable.

## **2.2 Funciones del Producto**

El sistema permitirá:

* Gestión de cuentas de usuario con distintos roles.
* Publicación y administración de productos.
* Clasificación por categorías con interfaces intuitivas y amigables.
* Búsqueda y filtrado de productos.
* Comunicación entre comprador y vendedor mediante chat interno.
* Carrito de compras y generación de pedidos.
* Simulación de pago para validación académica.
* Sistema de reputación basado en calificaciones y seguimientos .
* Panel administrativo para control del sistema.

## **2.3 Características De Los Usuarios**

**Compradores:** Usuarios registrados que pueden comprar, chatear y calificar vendedores.

### **Vendedores:**

Usuarios registrados con capacidad de publicar productos y gestionar pedidos dentro de la plataforma.
El sistema no establecerá diferencias funcionales entre persona natural y empresa; ambos tendrán los mismos permisos y responsabilidades dentro del marketplace.

**Administrador:** Encargado de supervisar el sistema, moderar publicaciones y gestionar usuarios.

## **2.4 Restricciones**

* El sistema funcionará únicamente mediante conexión a internet.
* Será accesible desde navegadores actualizados.
* El módulo de pagos funcionará a modo de simulación académica.
* El sistema será desarrollado bajo un entorno local de pruebas.

## **2.5 Suposiciones y Dependencias**

* Los usuarios tendrán conocimientos muy Básicos de navegación web.
* El sistema dependerá de un servidor de base de datos relacional.
* El correcto funcionamiento estará ligado al entorno de ejecución del servidor local.

# **3.0 Requisitos Específicos**

# **3.1 Requerimientos Funcionales**

# **Gestión de usuarios**

**RF1:** El sistema permitirá el registro de usuarios por medio de correo electrónico.

**RF2:** El sistema permitirá iniciar y cerrar sesión.

**RF3:** El sistema permitirá que el usuario recupere su cuenta por medio de correo electrónico cuando se le olvide la contraseña, en recuperar contraseña.

**RF4:** Restablecer contraseña el usuario solicita el restablecimiento con su correo electrónico y recibe un link de un solo uso. El link expira a los 5 minutos de emitido al vencer, el usuario debe solicitar uno nuevo.

**RF5:** El sistema le mostrará al usuario los términos y condiciones.

**RF6**: El registro tendrá un input donde el usuario acepta los términos y condiciones.

**RF7:** El sistema gestionará diferentes roles de usuario: comprador, vendedor y administrador.

**RF8:** El sistema asignará por defecto el rol de comprador a todos los usuarios registrados incluso a los vendedores excepto los administradores.

**RF9:** Eladministrador no venderá ni comprará productos solo supervisará Commercity.

**RF10:** EL sistema permitirá a los vendedores, vender y comprar productos.

**RF11:** El sistema proporcionará a los usuarios un perfil personal.

**RF12:** El sistema proporcionará a los vendedores un perfil personal.

**RF13:** El sistema proporcionará al administrador un panel administrativo.

**PERFIL COMPRADOR (usuario)**

**RF14:** El sistema permitirá al comprador añadir una foto de perfil.

**RF15:** El sistema permitirá al comprador editar su foto de perfil.

**RF16:** El sistema permitirá al comprador añadir una descripción personal.

**RF17:** El sistema permitirá al comprador editar su descripción personal.

**RF18:** El sistema permitirá al comprador visualizar la cantidad de seguidores que tiene.

**RF19:** El sistema permitirá al comprador visualizar la cantidad de usuarios que sigue.

**RF20:** El sistema permitirá al comprador acceder a la lista de seguidores.

**RF21:** El sistema permitirá al comprador acceder a la lista de usuarios seguidos.

**RF22:** El comprador tendrá una sección dentro de su perfil que se llamara Mi feed ahi podra scrollear productos.

**RF23:** El sistema permitirá al comprador ver y scrollear productos desde su perfi en la seccion mi feed.

**RF24:** El sistema permitirá al comprador acceder a su carrito de compras desde su barra lateral

**RF25:** El sistema permitirá al comprador acceder a la campana de notificaciones desde el topbar

**RF26:** El sistema permitirá al comprador acceder al historial de compras desde el sidebar.

**RF27:** El sistema permitirá al comprador visualizar los productos que ha comprado en la sección de historial de compras.

**RF28:** El sistema permitirá al comprador visualizar el estado de sus pedidos en la sección de historial de compras.

**RF29:**El estado de los pedidos será (Pendiente/ En camino/ Entregado).

**RF30:** El comprador podrá filtrar pedidos.

**RF31:** El historial de compras tendrá los siguientes datos del pedido.

* vendedor (Nombre del que vende el producto)
* productos ( pueden haber varios productos en una sola compra o pedido )
* Dirección ( La dirección del comprador a la hora de pagar los productos )
* fecha
* estado (Pendiente/ En camino/ Entregado).
* cantidad
* precio unitario de cada producto por su cantidad
* Iva del %19 aplicado
* Precio total
* Imagen del Producto

**RF32:** El comprador podra ver un resumen de sus productos comprados o el detalle.

**RF33:** El sistema permitirá al comprador acceder a la sección de chat por medio de su perfil.

**RF34:** El sistema permitirá al comprador acceder a la sección ajustes desde la barra lateral.

**RF35:** El sistema permitirá al comprador visualizar sus datos personales registrados en la sección de ajustes.

**RF36:** El sistema permitirá al comprador editar sus datos personales en la sección de ajustes.

**RF37:** El sistema permitirá que el comprador ingrese su dirección a la sección de ajustes.

**RF38**: El sistema permitirá que los usuarios hagan compras después de que registren su dirección en la sección ajustes.

**RF39:** El sistema permitirá al comprador cerrar sesión por medio de la sección ajustes.

**RF40:** El sistema permitirá al comprador eliminar su cuenta en la sección de ajustes.

**RF41:** El sistema borrará todos los datos del vendedor después de que elimine su cuenta, menos las cosas relacionadas con historiales como pedidos y reportes.

**RF42:** El sistema permitirá al comprador pasarse a vendedor en sección de ajustes.

**PERFIL VENDEDOR**

**RF43:** El sistema definirá que los usuarios con rol de vendedor poseen por defecto todas las funcionalidades del comprador.

**RF44:**El sistema permitirá a los usuarios con rol de vendedor contar con funcionalidades adicionales.

**RF45:** El sistema permitirá al vendedor agregar productos por medio de un botón eso desplegará el formulario en el perfil del vendedor para que el vendedor agregue su producto.

**RF46:** El formulario para agregar productos tendrá campos como nombre, descripción, imagen, stock, descuento, estado, precio, categoría y fecha.

**RF47:** El vendedor publicará su producto teniendo en cuenta que el debe hacer el cálculo adicional del IVA del %19.

**RF48:** El sistema permitirá al vendedor guardar la información del producto al hacer clic en “agregar producto”.

**RF49:** El formulario podrá ser reutilizado para editar un producto existente, mostrando los datos previamente ingresados.

**RF50:** El vendedor podrá visualizar sus calificaciones de su perfil de 1 a 5 estrellas.

**RF51:** El vendedor podrá acceder por medio de la barra lateral a mi tienda.

**RF52:** El vendedor podrá acceder por medio de la barra lateral a la sección pedidos.

**RF53:** El sistema permitirá a los usuarios visualizar los productos que el vendedor ha publicado en su perfil igual que en el panel principal.

**RF54:** El vendedor tendrá en su perfil una sección llamada mis productos en esa seccion podra ver y gestionar sus productos publicados.

**PANEL ADMINISTRATIVO**

**RF55:** El administrador podrá ver estadísticas

**RF56:** El sistema permitirá al administrador visualizar el historial de ingresos de CommerCity, correspondientes al 10% de comisión sobre las ventas realizadas por los vendedores.

**RF57:** El administrador podrá visualizar la cantidad de compradores que hay en Commercity.

**RF58:** El administrador podrá visualizar la cantidad de vendedores que hay en Commercity.

**RF59:** El administrador podrá visualizar la cantidad de productos publicados en Commercity.

**RF60:** El sistema permitirá al administrador acceder a una sección de reportes del panel.

**RF61:** El administrador podrá visualizar reportes.

**RF62:** El administrador recibirá los reportes de usuarios reportados en la sección de reportes.

**RF63**:Los reportes de usuarios tendrán los siguientes datos y acciones.

* tipo (usuario)
* estado (Resuelto / Pendiente)
* fecha
* usuario reportado
* usuario reportante
* motivo (Descripción del reporte)
* evidencias (imagen)
* respuesta del administrador

**RF64:** El administrador recibirá los reportes de los productos reportados en la sección de reportes.

**RF65:** Los reportes de productos tendrán los siguientes datos y acciones.

* tipo (Producto)
* estado (Resuelto / Pendiente)
* fecha
* producto reportado
* usuario del que publicó el producto.
* usuario reportante
* motivo (Descripción del reporte)
* evidencias (imagen)
* respuesta del administrador

**RF66:** El administrador podrá responder a los reportes mediante mensajes dentro del detalle del reporte.

**RF67:** El administrador podrá gestionar usuarios.

**RF68:** El administrador podrá gestionar productos.

**RF69:** El administrador tendrá un buscador en su panel administrativo.

**RF70:** El administrador podrá buscar usuarios por medio del buscador.

**RF71:** El administrador podrá buscar productos por medio del buscador.

**RF72:** El sistema permitirá al administrador eliminar productos publicados.

**RF73:** El sistema permitirá al administrador Banear/Activar o Eliminar usuarios.

**RF74:** Si el administrador Banea a un vendedor sus productos quedaran suspendidos y también su cuenta.

**RF75:** El administrador tendrá una sección de ajustes.

**RF76:** El administrador en la sección ajustes podrá registrar la cuenta bancaria de Commercity

**RF77:** El administrador en la sección ajustes podrá cerrar sesión.

## **productos**

**RF78:** El sistema permitirá al comprador acceder a la vista de detalle de un producto haciendo clic sobre él desde la lista de productos en la ventana principal.

**RF79:** La vista de detalle mostrará la información completa del producto seleccionado:

* Nombre del producto
* Imagen
* Descripción completa
* Precio y descuento si aplica
* Stock disponible
* Estado (Disponible / Agotado)
* Categoría

**RF80:** El sistema permitirá al comprador seleccionar la cantidad de unidades que desea comprar, verificando que no supere el stock disponible.

**RF81:** El sistema permitirá al comprador agregar el producto al carrito.

**RF82:** El sistema permitirá al usuario reportar el producto por medio de un menú eso desplegará un formulario con campos obligatorios.

**RF83**: El formulario de reportar productos tendrá los siguientes campos.

* Motivo (Agrega descripción del producto).
* Evidencia ( Agrega imagenes )

**RF84:** El sistema permitirá al comprador después de haber pagado el producto calificar al vendedor de 1 a 5 estrellas.

**RF85:** El sistema deshabilitará la opción de agregar al carrito si el producto está agotado y mostrará un mensaje indicando que no está disponible.

**RF86:** El sistema mostrará los productos en el panel principal y en el perfil del respectivo vendedor que publicó el producto.

**Panel Principal**

**RF87:** El sistema mostrará un panel principal al iniciar sesión donde los usuarios podrán visualizar y scrollear productos publicados por los vendedores.

**RF88:** El panel principal permitirá al usuario acceder a la barra de búsqueda para buscar productos por nombre, categoría o vendedor.

**RF89:** El panel principal permitirá al usuario filtrar y navegar por categorías de productos.

**RF90:** El Topbar permitira al usuario ingresar a su perfil

**RF91:** El sidebar permitirá al usuario acceder a su carrito de compras por medio de la barra lateral.

**RF92:** El sistema permitirá al panel principal mostrar las tarjetas de los productos

**RF93**: las tarjetas de los productos mostrará información resumida del producto.

**RF94:** El panel principal permitirá al usuario hacer clic en la tarjeta de un producto para acceder a la vista de detalle del mismo.

**NOTIFICACIONES**

**RF95:** El sistema permitirá al usuario acceder a la sección de notificaciones desde el ícono de la campana en el topbar.

**RF96:** El sistema mostrará una lista de notificaciones recientes, ordenadas de más recientes a más antiguas.

**RF97:** Cada notificación mostrará información resumida sobre el evento, incluyendo:

* Tipo de notificación (compra, mensajes, reporte, pedido, en camino, entregado.)
* Breve descripción (“tu pedido ha sido enviado”)
* dias y hora

**RF98:** El sistema permitirá al usuario eliminar notificaciones individuales o limpiar todas las notificaciones de manera masiva.

**RF99:** El sistema permitirá al usuario hacer clic en una notificación para ir directamente a la sección correspondiente.

**RF100:** El sistema mostrará un indicador de nueva notificaciones sobre ícono de la campana.

## **Interacción comprador-vendedor**

**RF101:** El sistema permitirá a los usuarios comunicarse mediante un chat interno para enviar y recibir mensajes, fotos y archivos.

**RF102:** El sistema permitirá a los usuarios seguir y dejar de seguir a otros usuarios dentro de la plataforma.

**RF103:** El sistema permitirá a los compradores calificar a los vendedores de 1 a 5 estrellas después de realizar una compra.

**RF104:** El sistema permitirá a los usuarios reportar por medio del chat a vendedores o compradores por comportamiento inapropiado.

**RF105:** El reporte de (usuarios) compradores y vendedores tendrá los siguientes campos

* Motivo (Agrega descripción del usuario).
* Evidencia ( Agregar imagenes )

**RF106:** El sistema permitirá a los usuarios visualizar el perfil público de los vendedores y compradores.

## **Compra (carrito)**

**RF107:**El sistema permitirá al usuario agregar productos al carrito de compras.

**RF108:**El sistema permitirá al usuario visualizar los productos agregados al carrito de compras.

**RF109:** El usuario podrá eliminar productos del carrito de compras.

**RF110:**El usuario podrá modificar la cantidad de cada producto en el carrito de compras.

**RF111:** El sistema permitirá generar pedidos a partir del carrito de compras.

**RF112:** El sistema permitirá que el carrito almacene varios productos de varios vendedores a la hora de hacer el pago, los productos se enviaran a cada vendedor.

**RF113:** Antes de generar el pedido, el sistema mostrará un resumen con cantidad, precio y descuentos si aplican, envío gratis siempre y total.

**RF114:** El sistema simulará el pago del pedido (forma académica)

**RF115:** El sistema le mostrará al usuario en la pasarela de pago el subtotal y el iva desglosado del %19.

**RF116:** Al confirmar el pago de un pedido, el sistema identificará y registrará el valor correspondiente al IVA de cada producto para su almacenamiento.

**RF117:** El sistema pedirá los siguientes datos en la pasarela de pago (forma académica)

* Número de la tarjeta
* Nombre de la tarjeta

**RF118:** El sistema en la pasarela de pago mostrará el total del pedido.

**pedidos**

**RF119:** El sistema permitirá al vendedor acceder a la sección Pedidos por medio de la barra lateral.

**RF120:** La lista de pedidos mostrará la información mínima necesaria para enviar los productos:

* Nombre del comprador
* Dirección de envío cuando se pagó los productos.
* Fecha del pedido
* producto o Productos solicitados
* Cantidad
* Estado del pedido (Pendiente, En camino, Entregado)
* Precio unitario de cada producto multiplicado por su cantidad.
* Precio total
* Imagen del producto

**RF121:** El sistema permitirá al vendedor actualizar el estado de cada pedido (Pendiente → En camino→Entregado).

**RF 122:** El sistema permitirá al vendedor revisar el historial de pedidos y sus filtros (Pendiente, En camino, Entregado)

**mi tienda**

**RF123:** El vendedor tendrá una sección en su perfil llamada mi tienda

**RF124:** El vendedor en tienda registrará su cuenta bancaria (Forma Académica)

**RF125:** El vendedor en tienda registrará los siguientes datos de su cuenta bancaria.

* Nombre del titular
* Banco
* Tipo de cuenta
* Numero de cuenta

**RF126:** El sistema permitirá al vendedor actualizar su cuenta bancaria.

**RF127:** El vendedor Podrá ver estadísticas

**RF128:** El vendedor podrá ver el historial de las ventas que ha hecho.

**RF129:** El vendedor podrá ver el historial del dinero que ha recaudado de sus ventas.

**RF130:** El sistema gestionará las ventas sin exponer la cuenta bancaria del vendedor.

**RF131:** El sistema permitirá al vendedor visualizar el historial de ingresos generados por sus ventas, correspondientes al 90% del valor de cada transacción.

**Ganancias**

**RF132:** El sistema en la pasarela de pago sacara primero el %19 del IVA del precio base y quedara el subtotal y del subtotal se sacara el %90 para el vendedor y el %10 para CommerCity.

**RF133:** El sistema usará la moneda colombiana COP. (simulado)

# **3.2 Requerimientos No Funcionales**

**Interfaz y Usabilidad**

**RNF1:** La interfaz del sistema será intuitiva, con diseños amigables y modernos.

**RNF2:** El sistema proporcionará mensajes claros ante errores o acciones realizadas por el usuario.

**RNF3:** El sistema mantendrá consistencia visual en todas las interfaces

.
 **RNF4:** El sistema permitirá una navegación sencilla e intuitiva entre las diferentes secciones.

**Rendimiento**

**RNF5:** El tiempo de carga del sistema no superará los 2 segundos en condiciones normales.

**RNF6:** El sistema soportará múltiples usuarios simultáneos sin afectar el rendimiento básico

.

**RNF7:** El sistema optimizará la carga de imágenes para mejorar el tiempo de respuesta.

**Seguridad**

**RNF8:** El sistema protegerá los datos de los usuarios mediante cifrado de contraseñas.

**RNF9:** El sistema garantizará que solo los usuarios autenticados puedan acceder a funcionalidades privadas según su rol.

**RNF10:** El sistema validará los datos ingresados por los usuarios para evitar entradas inválidas o maliciosas.

**RNF11:** El sistema protegerá la información sensible de los usuarios, como datos personales y bancarios.

**Disponibilidad**

**RNF12:** El sistema estará disponible mientras el servidor se encuentre activo.

**Integridad de datos**

**RNF13:** El sistema garantizará la consistencia y validez de los datos almacenados, evitando registros incompletos o relaciones inválidas entre entidades.

**RNF14:** El sistema evitará la duplicación de información en registros críticos como usuarios o pedidos.

**Compatibilidad**

**RNF15:** El sistema será responsive, permitiendo su uso en dispositivos móviles y de escritorio.

**RNF16:** El sistema será compatible con los principales navegadores web como Chrome, Edge y Firefox.

**Mantenibilidad y escalabilidad**

**RNF17:** El sistema estará estructurado de forma modular para facilitar futuras mejoras.

**RNF18:** El código del sistema será legible y organizado para facilitar su mantenimiento.

**RNF19:** El sistema permitirá la incorporación de nuevas funcionalidades sin afectar las existentes.

**Manejo de errores**

**RNF20:** El sistema gestionará los errores de forma controlada sin interrumpir la experiencia del usuario.

**4.0 Tecnologías a Utilizar**

**4.1 Página Web**

**Fronted:** HTML / Tailwind CSS / React / Responsive

**Backend:** [Node.JS](http://node.js) / Express.JS

**Base De Datos:** MySQL

**4.2 Móvil**

**Fronted:** React Native

**Backend:** Node.JS

**Base De Datos:** MySQL

**5.0 INNOVACIÓN**

En esta sección se incluyen ideas y propuestas para el Ecommerce, con el objetivo de hacer la plataforma más competitiva y atractiva y potenciar más su capacidad.

**integración de IA:** esta es una propuesta para incorporar IA al Ecommerce con el objetivo de facilitar más el uso de la plataforma y potenciar su productividad con:

* **ChatBots:** en el chat responden sobre dudas del producto eso mejora las respuestas y los clientes no deben esperar tanto por respuestas.
* **Buscador Inteligente:** entiende texto natural y filtra la información para dar respuestas precisas al producto que busca el cliente.
* **Recomendador:** sirve para recomendarle productos a los clientes en base a lo que ellos buscan y compran en el Ecommerce.

b

* **Descripciones Automáticas:** aquí el vendedor sube su producto alimenta a la IA con información sobre el producto y la IA sube el producto con una descripción organizada y profesional.