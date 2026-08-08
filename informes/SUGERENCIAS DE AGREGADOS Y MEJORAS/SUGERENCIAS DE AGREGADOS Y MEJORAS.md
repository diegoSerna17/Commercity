**SUGERENCIAS DE AGREGADOS Y MEJORAS**

Para que el desarrollo en Node.js, Express y React sea a prueba de fallos, te sugiero agregar los siguientes requerimientos:

**Requerimientos Funcionales (RF) Faltantes:**

* **RF Nuevo (Inventario):** *El sistema descontará automáticamente la cantidad comprada del stock del producto una vez que el pago simulado sea aprobado.* (Actualmente, el RF174 verifica el stock, pero no hay un RF explícito que ordene su reducción tras la compra).
* **RF Nuevo (Devoluciones/Cancelaciones):** *El sistema permitirá al comprador o al vendedor cancelar un pedido si este se encuentra en estado "Pendiente", restituyendo automáticamente el stock.*
* **RF Nuevo (Carritos Abandonados):** *El sistema vaciará automáticamente los carritos de compra inactivos después de 7 días.* (Evita saturar la base de datos).

**Requerimientos No Funcionales (RNF) Faltantes (Enfoque Node/Express/DB):**

* **RNF Nuevo (Seguridad de API / JWT):** *El sistema gestionará la autenticación de usuarios mediante JSON Web Tokens (JWT) con un tiempo de expiración definido y firmados criptográficamente.*
* **RNF Nuevo (Transacciones ACID):** *El sistema utilizará transacciones de base de datos para el proceso de compra. Si falla el registro de un detalle de pedido o el pago, se revertirá toda la operación (Rollback) para asegurar la integridad.*
* **RNF Nuevo (Sanitización):** *El sistema en el backend implementará validaciones estrictas (ej. librerías como Joi o Zod en Express) para sanitizar los inputs del usuario, previniendo ataques de inyección SQL y XSS, respaldando al RNF10*.