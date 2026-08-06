# Changelog de Cambios - CommerCity

Registro central de cambios (según regla `documentacion-cambios.md`). Entradas de la mas reciente a la mas antigua.

---

## 2026-08-05 - CHORE: repositorio de trabajo ECOMMERCE + politica de push

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore, .trae/rules/git-push-politica.md, backend/.env.example, backend/src/server/server.js, backend/src/server/config/db.js, backend/src/server/controllers/carrito.controllers.js, backend/src/server/routes/carrito.routes.js, schema_commercity.sql
- **Descripcion**: origin ahora apunta a `danielpalacios665-sys/ECOMMERCE` (unico destino de push); `commercycity` (diegoSerna17/Commercity) queda solo para pull de actualizaciones del equipo. Commit inicial 5fb600e pusheado a ECOMMERCE con el modulo carrito alineado al esquema y la config de BD remota.
- **Motivo**: directiva del usuario: los trabajos se entregan al lider, quien revisa y hace push al proyecto original. Regla nueva `git-push-politica.md`.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: `git push -u origin main` -> `[new branch] main -> main`; `git status`: working tree limpio, rama main sincronizada con origin/main.
- **Estado**: Completado

---

## 2026-08-05 - FEAT: configuracion de entorno para BD remota del equipo

- **Autor**: Daniel Palacios
- **Archivos**: backend/.env, backend/.env.example, backend/src/server/config/db.js, backend/src/server/server.js
- **Descripcion**: se creo backend/.env con los datos del lider (PORT=5000, DB_HOST=149.130.178.228, DB_NAME=commercity_v2); se agrego lectura de DB_PORT en el pool; se agrego dotenv.config() en server.js (antes importaba dotenv sin configurarlo).
- **Motivo**: directiva del lider (Yepes) para conectar todo el grupo backend a una BD compartida.
- **Requerimientos**: N/A (infraestructura)
- **Evidencia**: conexion verificada contra la BD remota (SHOW DATABASES + SHOW TABLES); GET /api/carrito -> 200 contra MySQL real.
- **Estado**: Completado

## 2026-08-05 - FIX: alinear controlador carrito al esquema real (brecha B1)

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/controllers/carrito.controllers.js
- **Descripcion**: se elimino la tabla `carrito` intermedia; parametro `comprador_id`; upsert `ON DUPLICATE KEY UPDATE` con `uq_comprador_producto`; columnas `imagen_url`, `descuento_porcentaje`, `nombre_completo`; precio final con descuento; transacciones con `FOR UPDATE`; redondeo monetario a 2 decimales.
- **Motivo**: el controlador referenciaba tablas/columnas inexistentes en el esquema oficial (tabla `carrito`, `precio_original`, `imagen`, `u.nombre`). Informe: `informes/INFORME_CRITICO_INCOMPATIBILIDAD_CARRITO_2026-08-05.md`.
- **Requerimientos**: RF103, RF104, RF105, RFX (REVISION)
- **Evidencia**: node --check OK; GET /api/carrito -> 200 contra BD real; validacion 400 con `comprador_id`.
- **Estado**: Completado

## 2026-08-05 - CHORE: carpetas locales fuera del repositorio

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore
- **Descripcion**: se ignoraron las carpetas `.trae/`, `.agents/`, `.claude/` e `informes/` (configuracion del entorno y documentos locales).
- **Motivo**: mantener el repositorio limpio de configuracion local y documentacion interna.
- **Requerimientos**: N/A
- **Evidencia**: `git check-ignore .trae .agents .claude informes` devuelve las 4 carpetas; ninguna trackeada.
- **Estado**: Completado

## 2026-08-05 - DOCS: informes de requerimientos, base de datos y brechas

- **Autor**: Daniel Palacios
- **Archivos**: informes/INFORME_REQUERIMIENTOS_BACKEND_BD_2026-08-05.md, informes/INFORME_CRITICO_INCOMPATIBILIDAD_CARRITO_2026-08-05.md
- **Descripcion**: informe completo que cruza 125 RF + 20 RNF con las 18 tablas del esquema y el estado del backend por modulo del equipo; informe critico de la incompatibilidad del carrito (B1) con plan de correccion aplicado.
- **Motivo**: documentar el estado real del proyecto para el equipo y dejar trazabilidad de la brecha B1.
- **Requerimientos**: todos (125 RF + 20 RNF)
- **Evidencia**: revision cruzada de schema_commercity.sql, documento "Commercity 2.0 (optimizado)" y backend/src/server.
- **Estado**: Completado

## 2026-08-05 - DOCS: reglas y skills para el stack del proyecto

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/ (mysql-convenciones.md, backend-estructura.md, documentacion-cambios.md, entre otras), .trae/AGENTS.md
- **Descripcion**: reglas de convenciones MySQL, estructura de backend Express, documentacion de cambios; mapeo automatico de skills por area (frontend, backend, BD, testing, arquitectura); 16 skills instaladas en .agents/skills/.
- **Motivo**: estandarizar el desarrollo del equipo y activar las skills relevantes al stack React/Express/MySQL.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: verificacion de directorios .trae/skills, .agents/skills y .claude/skills.
- **Estado**: Completado
