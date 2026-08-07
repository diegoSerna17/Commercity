# Changelog de Cambios - CommerCity

Registro central de cambios (según regla `documentacion-cambios.md`). Entradas de la mas reciente a la mas antigua.

---

## 2026-08-06 - CHORE: pruebas de la tarea de Cristian con capturas de evidencia

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore; AVANCES/CRISTIAN ROSERO/PRUEBAS/ (1_pantalla_ide.png, 2_evidencia_resultados.png, 2_pantalla_ide_tests.png, 3_log_tests.txt, 4_log_cobertura.txt, 5_log_endpoint_real.txt, 6_cobertura_html.png, 7_video_prueba.mp4, 8_video_trae_preview.mp4, evidencia_prueba.html); scripts/captura_pantalla.py; scripts/grabar_pantalla.py
- **Descripcion**: se agrego `docs/` al .gitignore (documentos fuente Word y conversiones locales no se versionan). Se ejecuto la prueba de la tarea de Cristian Rosero (modulo perfil publico) y se guardaron capturas de pantalla, videos y evidencia en la ruta solicitada: tests unitarios 26/26 (7 del perfil publico + 19 del carrito), cobertura 94.16% statements / 100% functions, prueba funcional del endpoint real GET /api/usuarios/perfil-publico/3 contra la BD remota (200 OK) y casos 404 (inexistente) / 400 (id invalido). Se grabo video de pantalla mientras el navegador mostraba el endpoint real y el HTML de evidencia (7_video_prueba.mp4) y mientras el preview de Trae IA mostraba la respuesta JSON (8_video_trae_preview.mp4).
- **Motivo**: el usuario pidio ignorar docs/ del repo y generar evidencia visual de las pruebas para Cristian en AVANCES/CRISTIAN ROSERO/PRUEBAS.
- **Requerimientos**: RF109, RFX (REVISION)
- **Evidencia**: logs en AVANCES/CRISTIAN ROSERO/PRUEBAS/ (26 tests passed, cobertura 94.16%, endpoint 200 OK con datos reales de commercy_v2).
- **Estado**: Completado

---

## 2026-08-06 - DOCS: decision oficial IVA 19% confirmada en plan Scrum

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md
- **Descripcion**: se registro la decision oficial del IVA confirmada con Yepes: (1) el precio publicado por el vendedor ya incluye el IVA 19% (precio final, sin calcular nada al publicar); (2) el detalle del pedido muestra solo el monto total, sin desglose; (3) las comisiones 10/90 se calculan sobre el subtotal SIN IVA. Implicacion tecnica: NO se requiere tabla/columna IVA para el flujo de pedidos; Meneses no necesita migracion por esta decision. Se actualizo el alcance de Carlos Vidal, Jary, Meneses y Yepes.
- **Motivo**: resolver la inconsistencia del porcentaje del IVA (15% vs 19%) y las vueltas de Yepes sobre el desglose, para desbloquear el desarrollo de pedidos e historial.
- **Requerimientos**: RF104, RFX (REVISION), RF76 (base)
- **Evidencia**: confirmacion de Yepes en el grupo de lideres (8:05 PM: "19% en colombia") y mensaje enviado por Daniel (8:12 PM).
- **Estado**: Completado

---

## 2026-08-06 - DOCS: decisiones de lideres en plan Scrum (IVA 19%, precio unitario, multi-producto)

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md
- **Descripcion**: se agrego la seccion 8 "Decisiones de los lideres (2026-08-06)" al plan Scrum: precio unitario por cantidad, pedidos multi-producto, IVA 19% (confirmado por Yepes, resolviendo la inconsistencia 15% vs 19% del audio 4), comisiones 90/10 y cambio de rol en ajustes. Se documento el alcance ampliado: Carlos Vidal (IVA + comisiones en pedidos), Jary (multi-producto con precio unitario), Meneses (crear entidad IVA) y Yepes (19% al publicar producto). Se renumeraron las secciones 9 y 10.
- **Motivo**: registrar las decisiones criticas del grupo de lideres que afectan el backend antes de que los integrantes avancen en sus modulos.
- **Requerimientos**: RF104, RFX (REVISION), RF76 (base)
- **Evidencia**: transcripcion del audio 4 + confirmacion de Yepes en el grupo (19%).
- **Estado**: Completado

---

## 2026-08-06 - CHORE: ampliar gitignore (Python, IDEs, sistema, Office, env.local)

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore
- **Descripcion**: se agregaron al .gitignore: bytecode de Python (`__pycache__/`, `*.py[cod]`), configuraciones de IDEs (`.vscode/`, `.idea/`), archivos de sistema (Thumbs.db, Desktop.ini, .DS_Store), temporales de Office (`~$*`) y `*.env.local`. `frontend/dist/` no se agrego porque ya esta cubierto por la entrada global `dist`.
- **Motivo**: mantener el repositorio limpio de artefactos locales generados por scripts Python, IDEs y el sistema operativo.
- **Requerimientos**: N/A (configuracion)
- **Evidencia**: .gitignore verificado (entrada global `dist` en linea 100 cubre frontend/dist).
- **Estado**: Completado

---

## 2026-08-06 - CHORE: gitignore de entregas/audios/scripts y transcripcion de audio 4

- **Autor**: Daniel Palacios
- **Archivos**: .gitignore, Audios/4.txt (nuevo), scripts/transcribir_audio.py, scripts/ffmpeg/ffmpeg.exe
- **Descripcion**: se agregaron al .gitignore las carpetas AVANCES/ (entregas de integrantes), Audios/ (audios y transcripciones) y scripts/ (herramientas locales). Se transcribio el audio 4 de Yepes (modelo small, 1004 chars): confirma el precio unitario por cantidad en el mockup de Figma, la implementacion del IVA (15%) pendiente de Meneses en la BD y las comisiones 90/10 en pedidos.
- **Motivo**: las entregas de los integrantes y los audios del grupo no deben versionarse en el repositorio; la transcripcion del audio 4 registra decisiones criticas de backend (IVA y comisiones).
- **Requerimientos**: N/A (gestion de proyecto)
- **Evidencia**: transcripcion en Audios/4.txt; .gitignore verificado.
- **Estado**: Completado

---

## 2026-08-06 - CHORE: instalar openai-whisper para transcripcion de audio

- **Autor**: Daniel Palacios
- **Archivos**: entorno Python (paquete openai-whisper instalado via pip)
- **Descripcion**: se instalo openai-whisper (modelo de transcripcion de audio de OpenAI) para transcribir audios a texto localmente (ej: audios de voz de WhatsApp del grupo de lideres). Complementa el flujo de la skill automate-this (extraer audio con ffmpeg + transcribir con whisper).
- **Motivo**: el lider de backend necesita transcribir los audios de voz del grupo de lideres (Yepes y otros) para registrar las decisiones sin perder contexto.
- **Requerimientos**: N/A (herramienta de soporte)
- **Evidencia**: verificado `import whisper` -> OK.
- **Estado**: Completado

---

## 2026-08-06 - CHORE: skills de conversion de documentos y generacion de PDF

- **Autor**: Daniel Palacios
- **Archivos**: .agents/skills/convert-documents-to-markdown/ (nuevo), .agents/skills/huashu-md-to-pdf/ (nuevo), scripts/md_to_html.py (nuevo), informes/INFORME_ENTREGA_CRISTIAN_ROSERO_2026-08-06.pdf (nuevo)
- **Descripcion**: se instalo la skill de Firecrawl anydoc (convert-documents-to-markdown) para convertir documentos (Word, PDF, etc.) a Markdown, y la skill huashu-md-to-pdf para la direccion inversa (Markdown a PDF). Como WeasyPrint (dependencia de huashu-md-to-pdf) falla en Windows por falta de GTK/Pango, se creo el script scripts/md_to_html.py (markdown2) y se uso Edge headless para generar el PDF del informe de Cristian Rosero.
- **Motivo**: el equipo necesita convertir informes .md a PDF para enviarlos a los integrantes; anydoc complementa la conversion de documentos del proyecto a Markdown.
- **Requerimientos**: N/A (herramientas de soporte)
- **Evidencia**: PDF generado (158 KB) para INFORME_ENTREGA_CRISTIAN_ROSERO_2026-08-06.md.
- **Estado**: Completado

---

## 2026-08-06 - DOCS: informe de entrega de Cristian Rosero (perfil publico)

- **Autor**: Daniel Palacios
- **Archivos**: informes/INFORME_ENTREGA_CRISTIAN_ROSERO_2026-08-06.md (nuevo)
- **Descripcion**: se documento la entrega de Cristian Rosero (modulo perfil publico de usuario, RF104): lo que desarrollo, las 8 correcciones aplicadas por el lider (pool real de config/db.js, validacion de id, respuesta estructurada, no exposicion de error.message, exclusion del email, verificacion de usuario activo, estructura del proyecto y montaje en /api/usuarios), los 7 tests creados, el resultado de cobertura (94.16%) y la limpieza de la carpeta de entrega.
- **Motivo**: dejar evidencia trazable de la revision e integracion de cada modulo del equipo backend.
- **Requerimientos**: RF104 (REVISION)
- **Evidencia**: informe con detalle de correcciones, contrato del endpoint y resultados de testing.
- **Estado**: Completado

---

## 2026-08-06 - CHORE: depurar carpeta de entrega de Cristian Rosero

- **Autor**: Daniel Palacios
- **Archivos**: AVANCES/CRISTIAN ROSERO/ (se elimino Commercity-main/ completo; quedaron solo backend/src/server/controllers/usuarios.controllers.js, backend/src/server/routes/routes.js y Documentacion.txt)
- **Descripcion**: se depuro la carpeta de entrega de Cristian Rosero: el envio incluia el proyecto completo clonado (frontend con node_modules, package.json, db.js, server.js, etc.). Se conservaron unicamente los archivos de su modulo asignado (perfil publico de usuario: controlador, ruta y documentacion) y se elimino el resto.
- **Motivo**: directiva del lider de backend de recibir solo los archivos que corresponden al modulo de cada integrante, no el proyecto entero.
- **Requerimientos**: RF104 (REVISION)
- **Evidencia**: estructura final verificada con LS (solo 3 archivos del modulo).
- **Estado**: Completado

---

## 2026-08-06 - FEAT: integrar modulo perfil publico (Cristian Rosero) con correcciones de seguridad

- **Autor**: Daniel Palacios (integracion); Cristian Rosero (desarrollo original)
- **Archivos**: backend/src/server/controllers/usuarios.controllers.js, backend/src/server/routes/usuarios.routes.js (nuevo), backend/src/server/app.js, backend/src/server/__tests__/usuarios.controllers.test.js (nuevo)
- **Descripcion**: se integro el modulo de perfil publico de usuario entregado por Cristian Rosero (GET /api/usuarios/perfil-publico/:id). Se corrigieron brechas frente a las reglas del proyecto: uso del pool real de config/db.js (eliminando credenciales hardcodeadas), validacion de id entero positivo, respuesta estructurada { success, error }, no exposicion de error.message en 500, exclusion del email del perfil publico, verificacion de usuario activo (baneado = 404) y endpoint montado en /api/usuarios.
- **Motivo**: como lider de backend, integrar la entrega de un integrante del equipo validandola contra el esquema y las reglas de seguridad (api-seguridad.md, backend-estructura.md).
- **Requerimientos**: RF104 (REVISION)
- **Evidencia**: 26/26 tests en verde (19 carrito + 7 perfil publico); cobertura Statements 94.16%, Branches 87.3%, Functions 100%, Lines 94.11% (umbral 60 superado, mejora vs 93% previo).
- **Estado**: Completado

---

## 2026-08-06 - DOCS: plan Scrum backend y protocolo de entrega del equipo (correccion)

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md, informes/PROTOCOLO_ENTREGA_BACKEND_2026-08-06.md
- **Descripcion**: se corrigieron los documentos del plan Scrum y el protocolo de entrega: se elimino toda referencia al repositorio de trabajo ECOMMERCE, se reescribio el plan en primera persona y se explicitio el flujo centralizado (los companeros entregan su modulo al lider, el lider revisa, valida y realiza el commit y el push).
- **Motivo**: directiva del usuario: el informe no debe mencionar el repositorio de trabajo, debe estar en primera persona e indicar que las entregas se reciben, revisan y pushean por el lider de backend.
- **Requerimientos**: N/A (gestion de proyecto)
- **Evidencia**: grep verificado sin coincidencias de ECOMMERCE en el informe.
- **Estado**: Completado

---

## 2026-08-06 - DOCS: plan Scrum backend y protocolo de entrega del equipo

- **Autor**: Daniel Palacios
- **Archivos**: informes/PLAN_SCRUM_BACKEND_2026-08-06.md (nuevo), informes/PROTOCOLO_ENTREGA_BACKEND_2026-08-06.md (nuevo)
- **Descripcion**: se creo el plan Scrum del backend con organigrama oficial (Director: Jose Yepes), linea de tiempo (entrega parcial 11 de agosto, final ~27 de septiembre), cronograma de 8 sprints, Definition of Done, protocolo de entrega (formato ZIP, prohibiciones, fechas de corte) y coordinacion inter-area. Se creo el mensaje de protocolo listo para enviar al grupo.
- **Motivo**: como lider de backend se requiere un plan formal para coordinar la entrega del martes 11 de agosto y la gestion del equipo.
- **Requerimientos**: N/A (gestion de proyecto)
- **Evidencia**: documentos creados en informes/.
- **Estado**: Completado

---

## 2026-08-06 - CHORE: cubrir brechas de skills para apoyar areas externas

- **Autor**: Daniel Palacios
- **Archivos**: .agents/skills/vercel-react-native-skills/ (nuevo), .agents/skills/flutter-*/ (nuevo, 10 skills), .agents/skills/selenium-automation/ (nuevo), .trae/rules/skill-triggers.md
- **Descripcion**: se instalaron skills del ecosistema abierto (skills.sh) para cubrir las brechas de apoyo a otras areas: `vercel-react-native-skills` (React Native/Expo, repo vercel-labs), `flutter-*` (10 skills del repo oficial flutter/skills) y `selenium-automation` (mindrally/skills). Se amplio skill-triggers.md con 3 secciones nuevas: Movil, Escritorio y UML (activacion automatica por frases clave).
- **Motivo**: como lider de backend, se requiere capacidad de apoyo a las areas de movil (Jhon Parra), escritorio (Sebastian) y UML (Jose Yepes); antes el catalogo del proyecto solo tenia batch-files para escritorio y generate-mini-app (Taro) para movil, que no cubre desarrollo nativo.
- **Requerimientos**: N/A (herramientas de soporte)
- **Evidencia**: `npx skills` (v CLI) detecto agente TRAE, instalacion completada en .agents/skills/ con symlink a Trae y Claude Code; mapeo agregado y verificado en skill-triggers.md.
- **Estado**: Completado

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
