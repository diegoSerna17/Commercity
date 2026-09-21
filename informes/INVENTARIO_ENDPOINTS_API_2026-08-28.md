# Inventario consolidado de endpoints API REST

- **Fecha de consolidación**: 2026-09-21 09:01
- **Autor**: Daniel Palacios
- **Base local**: `http://localhost:3000`
- **Autenticación**: `Authorization: Bearer <token>` cuando la ruta requiere sesión
- **Contrato de éxito**: `{ success: true, data }`
- **Contrato de error**: `{ success: false, error: { code, message, details? } }`

## Routers registrados

| Prefijo | Router | Estado |
|---|---|---|
| `/` | `routes.js` | Registrado |
| `/api/carrito` | `carrito.routes.js` | Registrado |
| `/api/usuarios` | `usuarios.routes.js` | Registrado |
| `/api/historial` | `historial.routes.js` | Registrado |
| `/api/pedidos` | `pedidos.routes.js` | Registrado |
| `/api/tienda` | `tienda.routes.js` | Registrado |
| `/api/admin` | `admin.routes.js` | Registrado |
| `/api/reportes` | `reportes.routes.js` | Registrado |
| `/api/chat` | `chat.routes.js` | Registrado |
| `/api/notificaciones` | `notificaciones.routes.js` | Registrado |
| `/api/seguidores` | `seguidores.routes.js` | Reincorporado en esta tarea |
| `/api` | `productos.routes.js` | Registrado |

## Módulo Seguidores RF106

| Método | Ruta | Acceso | Propósito |
|---|---|---|---|
| GET | `/api/seguidores/siguiendo` | JWT | Lista de usuarios seguidos |
| GET | `/api/seguidores/seguidores` | JWT | Lista de seguidores |
| POST | `/api/seguidores` | JWT | Crea seguimiento con `{ seguido_id }` |
| DELETE | `/api/seguidores/:id` | JWT | Elimina seguimiento del usuario autenticado |

## Reglas de validación

- `seguido_id` debe ser entero positivo.
- Está prohibido seguirse a sí mismo.
- Un usuario inexistente devuelve 404.
- Un seguimiento duplicado devuelve 409.
- Todas las consultas usan parámetros del driver MySQL.
- Los tokens revocados se rechazan mediante `authRequired`.

## Nota de verificación

Este inventario consolida las rutas registradas en el código actual. La cobertura E2E completa de los endpoints permanece pendiente de ejecución manual y no se declara aprobada por este documento.
