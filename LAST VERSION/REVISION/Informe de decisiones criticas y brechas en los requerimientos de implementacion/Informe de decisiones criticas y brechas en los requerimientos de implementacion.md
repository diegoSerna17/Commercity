**Informe de Decisiones Críticas y Brechas en los Requerimientos**

Este es un informe de las decisiones críticas y brechas a la hora de implementar algunos de los requerimientos, de los líderes de Backend y base de datos.

* hay un requerimiento en rojo que implemente pero los líderes de backend y base de datos deben definir una propuesta y plan de trabajo
* hay un requerimiento en morado que no implemente de momento y abajo explico el porqué.

**RF46:** El vendedor publicara su producto con el precio final que ya incluye el IVA del 19% que el mismo vendedor debe calcular; el sistema desglosara el IVA en la pasarela de pago.

**Nota RF46:** Este requerimiento lo implemente con esta frase extra (que el mismo vendedor debe calcular) para que en regla del negocio se entienda mucho mejor que es el vendedor el que implementa el precio final con iva de su propio producto a la hora de publicarlo.

**RF74:** Si el administrador banea a un vendedor, sus productos quedarán suspendidos y su cuenta inactiva. Los pedidos ya pagados se completarán (envío y desembolso incluidos); los pedidos en estado "Pendiente" se cancelarán restituyendo el stock al comprador.

**Nota RF74:** sobre este requerimiento lo pondré en rojo porque se debe definir cómo se va a implementar hay que restar la comisión del vendedor y del admin y también la devolución del iva, y definir cómo se verá reflejado el delete en la interfaz pedidos y Historial Compras ese requerimiento está sujeto a muchas condiciones, debemos tener en cuenta la dificultad de los requerimientos y una propuesta y plan de implementación para que no se retrase mucho el backend. (En caso de no definir bien el plan de implementación será sustituido por el requerimiento pasado).

**RF135:** El sistema permitirá cancelar un pedido si se encuentra en estado "Pendiente", restituyendo automáticamente el stock.

**Nota RF135:**  Este requerimiento no se implementará de momento, ya que no hay una propuesta y el plan de trabajo para implementar este requerimiento. Habría que modificar el backend, hacer una maquetación web en historial de compras para que el usuario pueda cancelar el pedido pendiente, montar consultas SQL supongo. si se habla bien eso con el grupo de corazon yo los apoyo hasta hago la maquetación web, pero si ponemos requerimientos que alarguen el proceso sin una propuesta de implementación ni plan de trabajo y sin consultar bien con el grupo, la cojeran en contra mía como siempre, es mejor hablarlo para que ellos tengan paciencia e implementar eso en todas la áreas.

.