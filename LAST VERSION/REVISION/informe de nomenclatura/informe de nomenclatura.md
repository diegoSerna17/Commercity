**Informe de Nomenclatura de los requerimientos que se implementaron por José yepes De parte del líder de Backend y Base de Datos.**

**RF54:** El sistema desactivara la cuenta del vendedor cuando este la elimine desde ajustes, conservando los historiales (pedidos, pagos, comisiones, reportes y calificaciones). Sus productos publicados quedarán suspendidos y fuera del catalogo. **( seccion vendedor )**

**RF46:** El vendedor publicara su producto con el precio final que ya incluye el IVA del 19% que el mismo vendedor debe calcular; el sistema desglosara el IVA en la pasarela de pago.

**RF72:** El sistema permitirá al administrador suspender productos publicados (eliminación lógica). El producto dejara de aparecer en el catálogo y no podrá agregarse al carrito, pero su historial (pedidos, reportes, calificaciones) se conservará.

**RF74:** Si el administrador banea a un vendedor, sus productos quedarán suspendidos y su cuenta inactiva. Los pedidos ya pagados se completarán (envío y desembolso incluidos); los pedidos en estado "Pendiente" se cancelarán restituyendo el stock al comprador.

**RF117:** Al confirmar el pago de un pedido, el sistema calculará en vuelo el IVA del 19% y el subtotal de cada producto y los mostrará en la pasarela, sin almacenarlos en la base de datos.

**RF134:** En la pasarela de pago, el sistema desglosara el IVA del 19% de cada producto de la siguiente manera: el subtotal se calculara como el precio publicado dividido entre 1.19 (subtotal = precio / 1.19) y el IVA como el subtotal multiplicado por 0.19 (IVA = subtotal x 0.19). El usuario pagará el precio publicado por el vendedor. Sobre el subtotal, el sistema asignará el 90% al vendedor (monto\_vendedor = subtotal x 0.90) y el 10% a CommerCity como comision (monto\_comision = subtotal x 0.10). El backend solo almacenará el subtotal en el detalle del pedido, y los montos del vendedor y de la comisión se calcularan automáticamente como columnas generadas de la base de datos.

**RF120:** El sistema descontará automáticamente la cantidad comprada del stock del producto una vez que el pago sea aprobado. **(sección carrito y pasarela de Pago).**

**RF109:** El sistema vaciara automáticamente los carritos de compra inactivos después de 7 días. **(sección carrito y pasarela de Pago).**