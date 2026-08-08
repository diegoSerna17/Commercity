# Informe de Entrega - Cristian Rosero (Perfil Publico de Usuario)

**Para:** Cristian Rosero
**De:** Daniel Palacios (Lider backend)
**Modulo asignado:** Ver perfil publico de un usuario (item 58 de la metodologia)
**Fecha de revision:** 6 de agosto de 2026
**Requerimiento:** RF106 (REVISION) - segun documento oficial `Commercity 2.0 (optimizado 6)`: "El sistema permitirá a los usuarios visualizar el perfil público de los vendedores y compradores"
**Estado:** Entregado e integrado con correcciones

---

## 1. Resumen

Cristian, recibí tu trabajo del modulo de **perfil publico de usuario**. Lo revise completo, lo probe y lo integre al backend real del proyecto. Tu modulo funciona y cumple el requerimiento **RF106** (perfil publico de vendedores y compradores). Aplique algunas correcciones de seguridad y estructura para que cumpla las reglas del proyecto; en esta nota te explico que hiciste bien y que ajuste.

## 2. Lo que hiciste bien

1. **Endpoint funcional**: implementaste `GET /perfil-publico/:id` consultando la tabla `usuarios` por id.
2. **Consulta parametrizada**: usaste `?` en el SQL, sin concatenar strings. Correcto, eso evita SQL injection.
3. **Exclusion de datos sensibles**: tu SELECT no incluia `password`, `token_recuperacion` ni `direccion_envio`. Muy bien.
4. **Mapeo de campos correcto**: las columnas que usaste (`nombre_completo`, `foto_perfil`, `descripcion_personal`) existen en el esquema oficial `commercy_v2`. Lo verifique contra el schema. Esto evita la brecha critica B1 que tuvimos con el carrito.
5. **Conexion con el frontend**: el componente PerfilVendedor consume tu endpoint con `fetch` y `useParams`. Correcto.

## 3. Correcciones que aplique a tu entrega

Tu trabajo estaba bien encaminado, pero le hice estos ajustes para cumplir las reglas del proyecto:

| Lo que tenias | Lo que ajuste | Por que |
|---|---|---|
| Credenciales de BD hardcodeadas en `db.js` (`localhost/root`) | Uso del pool real de `config/db.js` (credenciales desde `.env`) | Las credenciales nunca van en el codigo; se leen del entorno |
| En el error 500 devolvias `error.message` al cliente | Lo dejo en log interno y devuelvo respuesta generica | No se exponen detalles internos del servidor en produccion |
| Respuesta plana `{ mensaje: ... }` | Formato estandar `{ success, data }` y `{ success, error: { code, message } }` | Todos los endpoints del proyecto usan este contrato |
| Parametro `id` sin validar | Valido que sea entero positivo (400 `VALIDATION_ERROR`) | Evita peticiones invalidas |
| Exponias el `email` en el perfil publico | Lo elimine del perfil publico | El email es dato sensible; el perfil publico no debe mostrarlo |
| Usuarios baneados se veian | Si `activo = 0` devuelvo 404 | Un usuario baneado no tiene perfil publico visible |
| Traias `db.js` y `server.js` propios | No los integre; use la estructura del proyecto (`config/db.js`, `app.js`) | Cada integrante entrega solo su modulo, no la infraestructura |
| Ruta montada en la raiz | La monto en `/api/usuarios/perfil-publico/:id` | Convencion de rutas del proyecto (prefijo `/api`) |

### Archivos que modifique en el backend

| Archivo | Cambio |
|---|---|
| `backend/src/server/controllers/usuarios.controllers.js` | Tu `getPerfilPublico` corregido con validacion y seguridad |
| `backend/src/server/routes/usuarios.routes.js` | Router del modulo usuarios |
| `backend/src/server/app.js` | Montaje de `/api/usuarios` |
| `backend/src/server/__tests__/usuarios.controllers.test.js` | 7 tests unitarios |

## 4. Testing de tu modulo

Cree 7 tests unitarios (Vitest + Supertest, mock de BD sin conexion real):

| Caso probado | Resultado |
|---|---|
| id no entero positivo (`abc`) | 400 VALIDATION_ERROR |
| usuario inexistente (999) | 404 NOT_FOUND |
| usuario baneado (`activo = 0`) | 404 NOT_FOUND |
| perfil publico correcto | 200 con nombre, biografia, avatar |
| avatar por defecto sin foto | 200 con placeholder |
| fallo de BD | 500 INTERNAL_ERROR sin detalles |
| consulta parametrizada | `WHERE id = ?` con parametro `[42]` |

### Resultado global

```
Test Files  2 passed (2)
     Tests  26 passed (26)     (19 carrito + 7 tuyos)

Statements : 94.16%   Branches : 87.3%
Functions  : 100%     Lines    : 94.11%
```

La cobertura del proyecto subio de 93% a 94.16% con tu modulo (minimo exigido: 60%).

## 5. Contrato del endpoint final

```
GET /api/usuarios/perfil-publico/:id
```

Respuesta exitosa (200):

```json
{
  "success": true,
  "data": {
    "id": 7,
    "nombre": "Maria Lopez",
    "biografia": "Vendedora de accesorios",
    "avatar": "https://img.com/maria.png"
  }
}
```

Errores:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "El id debe ser un entero positivo" } }
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Usuario no encontrado" } }
{ "success": false, "error": { "code": "INTERNAL_ERROR", "message": "Error al obtener el perfil" } }
```

## 6. Tu entrega quedo ordenada

Tu carpeta original tenia el proyecto completo clonado (frontend con `node_modules`, etc.). La organice dejando solo tu modulo:

```
AVANCES/CRISTIAN ROSERO/
├── backend/
│   └── src/
│       └── server/
│           ├── controllers/usuarios.controllers.js
│           └── routes/routes.js
└── Documentacion.txt
```

## 7. Conclusion

Tu modulo quedo integrado, probado y registrado en el changelog del proyecto, con el commit atribuido a tu nombre. Las correcciones fueron de seguridad y estructura; tu trabajo funcional se mantuvo intacto. Cualquier duda me escribes.

## 8. Actualizacion 2026-08-07 - checklist de revision contra el optimizado 6

Se actualizo este informe para alinearlo con el documento oficial de
requerimientos `Commercity 2.0 (optimizado 6)` y con la regla del proyecto
`revision-requerimientos.md`. Cambios:

1. **RF corregido**: el modulo de perfil publico corresponde al **RF106** del
   optimizado 6 (antes se citaba RF104 de una version anterior).
2. **Checklist de revision aplicado** (verificado contra el codigo integrado):

| Checklist (regla revision-requerimientos.md) | Estado del modulo integrado |
|---|---|
| Contrato de respuesta `{ success, data/error }` | CUMPLE |
| Consultas parametrizadas (`?` de mysql2) | CUMPLE |
| No exponer datos sensibles (email fuera del perfil publico) | CUMPLE |
| Usuarios baneados/inactivos no visibles (activo = 0 -> 404) | CUMPLE |
| Validacion de entrada (id entero positivo, 400 VALIDATION_ERROR) | CUMPLE |
| No DELETE fisico de historiales | CUMPLE (endpoint de solo lectura) |
| Cobertura de tests no menor a la existente | CUMPLE (94.16% global) |

**Conclusion de la actualizacion**: el modulo de Cristian sigue cumpliendo los
requerimientos oficiales vigentes y no requiere nuevas correcciones.

---

*Informe original 2026-08-06, actualizado el 2026-08-07 (v1.1) con la numeracion
oficial del `Commercity 2.0 (optimizado 6)` y el checklist de revision.*
