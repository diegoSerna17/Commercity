# Changelog de Cambios - CommerCity

Registro central de cambios (según regla `documentacion-cambios.md`). Entradas de la mas reciente a la mas antigua.

---

## 2026-08-05 - DOCS: informe de pruebas del modulo carrito

- **Autor**: Daniel Palacios
- **Archivos**: informes/INFORME_PRUEBAS_CARRITO_2026-08-05.md
- **Descripcion**: se documento el informe de pruebas del carrito: 19 tests unitarios (Vitest + Supertest, cobertura 93% stmts / 92.92% lines) y prueba funcional en vivo de 8 pasos contra la BD real commercy_v2, con verificacion de agrupacion por vendedor y calculo con descuento.
- **Motivo**: dejar evidencia estructurada de la validacion de la tarea del carrito.
- **Requerimientos**: RF103, RF104, RF105, RFX, RF109 (REVISION)
- **Evidencia**: resultados detallados en el informe.
- **Estado**: Completado

---

## 2026-08-05 - FEAT: testing backend (Vitest + Supertest) y 19 tests del carrito

- **Autor**: Daniel Palacios
- **Archivos**: backend/package.json, backend/src/server/app.js (nuevo), backend/src/server/server.js, backend/src/server/__tests__/carrito.controllers.test.js (nuevo)
- **Descripcion**: se configuro Vitest + Supertest con umbral de cobertura 60 (thresholds en package.json); se refactorizo la app Express a `app.js` (exporta la app sin listen) y `server.js` (solo arranca) para testabilidad; se escribieron 19 tests del controlador carrito con mock `vi.mock('mysql2/promise')`.
- **Motivo**: cumplir la politica post-cambio de testing-commercity.md (mantener cobertura >= 60) tras implementar el carrito.
- **Requerimientos**: RF103, RF104, RF105, RFX, RF109 (REVISION)
- **Evidencia**: 19/19 tests OK; cobertura Statements 93%, Branches 84.9%, Functions 100%, Lines 92.92% (umbral 60 superado).
- **Estado**: Completado

---

## 2026-08-05 - DOCS: flujo post-cambio obligatorio para mantener cobertura

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/testing-commercity.md (local, no versionado)
- **Descripcion**: se agrego la seccion "Post-cambio obligatorio": al terminar cualquier cambio de codigo se deben identificar funciones afectadas, crear/actualizar tests (patron por controlador/componente), ejecutar cobertura (/coverage-be, /coverage-fe), verificar umbral fail_under=60 y registrar evidencia en el changelog. Excepciones: solo archivos de documentacion/configuracion sin logica.
- **Motivo**: directiva del usuario de mantenerse actualizados en cobertura tras cada cambio.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: regla vinculada a testing-commercity.md y documentacion-cambios.md.
- **Estado**: Completado

---

## 2026-08-05 - FEAT: prueba en vivo del carrito contra la BD real (flujo completo)

- **Autor**: Daniel Palacios
- **Archivos**: ninguno (prueba funcional)
- **Descripcion**: se valido el flujo completo del carrito contra `commercy_v2` con datos semilla temporales: agregar (201), acumular por upsert (2+3=5), validacion de stock (400 INSUFFICIENT_STOCK), listado agrupado por vendedor con precio final con descuento (90000 de 100000 con 10%) y resumen (total 450000), modificar cantidad (200), eliminar (200). Datos de prueba eliminados al final (LIMPIEZA OK).
- **Motivo**: confirmar que la tarea asignada (carrito) cumple RF103, RF104, RF105, RFX y la agrupacion por vendedor (RF109 REVISION).
- **Requerimientos**: RF103, RF104, RF105, RFX, RF109 (REVISION)
- **Evidencia**: servidor en puerto 5000; respuestas JSON estructuradas correctas en los 8 pasos del flujo.
- **Estado**: Completado

---

## 2026-08-05 - CHORE: verificacion de configs del carrito contra la BD real

- **Autor**: Daniel Palacios
- **Archivos**: backend/src/server/server.js (mensaje de arranque con puerto real)
- **Descripcion**: se verificaron los 4 endpoints del carrito contra la BD remota commercy_v2 con el puerto 5000 del .env: GET / 200, GET carrito 200 (tablas vacias), validaciones 400 correctas (comprador_id). Correccion cosmetica del console.log del servidor (mostraba el puerto real).
- **Motivo**: confirmar que la tarea asignada (carrito) quedo aplicada tras la correccion B1.
- **Requerimientos**: RF103, RF104, RF105, RFX
- **Evidencia**: prueba con servidor en puerto 5000; respuestas JSON estructuradas correctas contra MySQL real.
- **Estado**: Completado

---

## 2026-08-05 - DOCS: regla de autorizacion para commit y push

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/git-autorizacion-versionado.md (local, no versionado)
- **Descripcion**: nueva regla que prohibe ejecutar `git add`, `git commit` o `git push` automaticamente; solo se ejecutan con orden explicita del usuario (commit, push, go, procede, sube, o comandos git concretos). Sin autorizacion, el working tree queda listo sin commitear y se notifica.
- **Motivo**: directiva del usuario de no versionar nada automaticamente.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: aplicada junto a git-push-politica.md (checklist y unico destino de push ECOMMERCE).
- **Estado**: Completado

---

## 2026-08-05 - DOCS: ampliar activacion automatica de skills por frases clave

- **Autor**: Daniel Palacios
- **Archivos**: .trae/rules/skill-triggers.md (local, no versionado)
- **Descripcion**: se amplio el mapeo de frases clave -> skills de 10 a 14 areas: se agregaron mysql/mysql-design (BD), swagger-gen (doc API), error-handling-patterns, zod-validation-expert, ascii-flow/brainstorming (diagramas), git-commit-organizer (versionado), frontend-design y vercel-react-best-practices (rendimiento). Se agrego regla general de catalogo completo + verificacion de cobertura.
- **Motivo**: directiva del usuario: usar todas las skills disponibles segun las frases de cada consulta o actualizacion.
- **Requerimientos**: N/A (proceso)
- **Evidencia**: revision de .trae/skills, .agents/skills y .claude/skills confirma que las skills referenciadas estan disponibles.
- **Estado**: Completado

---

## 2026-08-05 - DOCS: informes versionables subidos a ECOMMERCE

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore, informes/ (15 archivos: auditoria, requerimientos, brechas, changelog y documentos convertidos del lider)
- **Descripcion**: se quito `informes/` del .gitignore para versionar los informes en ECOMMERCE; los temporales `informes/_*` (logs de prueba) siguen excluidos. Commit c38a4da pusheado.
- **Motivo**: directiva del usuario: los informes si se suben al repositorio de trabajo ECOMMERCE.
- **Requerimientos**: N/A (documentacion)
- **Evidencia**: `git push 5fb600e..c38a4da`; `git check-ignore` confirma `backend/.env` y `informes/_*.log` excluidos; grep sin credenciales en informes/.
- **Estado**: Completado

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
