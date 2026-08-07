# Protocolo de Entrega - Equipo Backend

**Para:** Compañeros del equipo backend
**De:** Daniel Palacios (Lider backend web)
**Fecha:** 6 de agosto de 2026

***

Hola compañeros, les escribo como lider de backend para definir la entrega del
modulo asignado a cada uno.

**FECHA DE ENTREGA: MARTES 11 DE AGOSTO**

### 1. Como funciona la entrega (importante)

- **USTEDES NO hacen push ni commit al repositorio.**
- Me entregan su modulo a mi (por ZIP o por la carpeta compartida) y **yo reviso el codigo, lo valido contra el esquema y las reglas de seguridad, y yo hago el commit y el push**.
- Asi garantizamos que nada se suba sin mi revision y evitamos errores en el repositorio.

### 2. Que deben entregar

Un ZIP con su modulo, con esta estructura exacta:

```
<nombre>-<modulo>.zip
|-- controllers/<modulo>.controllers.js
|-- routes/<modulo>.routes.js
|-- __tests__/<modulo>.test.js     (si pueden, si no yo lo hago)
`-- README.txt                     (endpoints creados y como probarlos)
```

### 3. Que NO debe ir en el ZIP

- El archivo .env (tiene credenciales, no se comparte)
- La carpeta node\_modules
- Informes, logs o archivos temporales

### 4. Fechas importantes

- **VIERNES 8 de agosto, 6:00 PM**: me mandan un mensaje corto con su avance
  (ej: "ya tengo el registro, me falta el login"). No necesitan mandar codigo,
  solo el estado.
- **MARTES 11 de agosto**: entrega final del ZIP.

### 5. Reglas tecnicas del proyecto (importantes)

- Las consultas a la base de datos deben ser PARAMETRIZADAS (con `?`),
  nunca concatenar strings.
- Las tablas y columnas deben ser las del esquema oficial (schema\_commercity.sql).
  Si no estan seguros de una tabla, preguntenme antes de entregar.
- Los endpoints van en `routes/` y la logica en `controllers/`, sin SQL en las rutas.
- Respuestas en formato: `{ "success": true, "data": ... }`.

### 6. Que pasa si no entregan

Para el acta del proyecto solo quedara registrado como contribuyente del backend
quien entregue su modulo completo. Si tienen inconvenientes, avisenme ANTES del
martes y buscamos solucion juntos.

***

