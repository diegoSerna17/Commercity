---
description: Regla obligatoria de memoria del proyecto CommerCity: mantener project_memory.md y topics.md actualizados al cerrar cada tarea y al finalizar el turno
globs: "*"
alwaysApply: true
---

# Memoria del Proyecto (Proyecto CommerCity)

Regla obligatoria: la memoria del proyecto debe reflejar SIEMPRE el estado real y
actualizado del proyecto. La memoria es la fuente de continuidad entre sesiones:
si no esta al dia, la siguiente sesion trabaja con contexto viejo.

## 1. Ubicacion de la memoria (rutas exactas)

- **Memoria global del proyecto (RUTA QUE LEE EL SISTEMA — mantener SIEMPRE)**: `c:\Users\dpalaciosr\.trae\memory\projects\-c-Users-dpalaciosr-OneDrive---Ufinet-Latam-Escritorio-COMMER-CITY--p2-d7c54e11eef53a50ea45\project_memory.md`
- **Temas y progreso por fecha (RUTA QUE LEE EL SISTEMA)**: `c:\Users\dpalaciosr\.trae\memory\projects\-c-Users-dpalaciosr-OneDrive---Ufinet-Latam-Escritorio-COMMER-CITY--p2-d7c54e11eef53a50ea45\<YYYYMMDD>\topics.md`
- **Respaldo (misma info, ruta sin sufijo p2)**: `c:\Users\dpalaciosr\.trae\memory\projects\-c-Users-dpalaciosr-OneDrive---Ufinet-Latam-Escritorio-COMMER-CITY\project_memory.md`
- **Reglas del proyecto**: carpeta `.trae/rules/` del working tree (versionadas en origin/ECOMMERCE).
- La memoria del proyecto NO se versiona en git (esta fuera del working tree).
- Al actualizar la memoria, escribir SIEMPRE en la ruta con sufijo p2 (la que lee el sistema) y replicar en la ruta sin sufijo para mantener ambos sincronizados.

## 2. Cuando actualizar la memoria (obligatorio)

Actualizar `project_memory.md` en CADA uno de estos momentos:

1. **Al cerrar una tarea** (fix, feature, integracion de modulo, revision de entrega, decision con el Director): agregar el resultado en la seccion "Estado <fecha>" correspondiente y limpiar el pendiente de la lista.
2. **Al finalizar el turno / resumen de cierre**: agregar entrada de "Estado YYYY-MM-DD" con lo ejecutado, lo verificado y lo pendiente, aunque no haya cambiado el codigo.
3. **Cuando cambia un cierre del Director o una decision de BD/RF**: actualizar de inmediato la seccion de decisiones (RF140, RF141, RF46/RF47, RF48, etc.) para que la regla `revision-requerimientos.md` y la memoria coincidan.
4. **Cuando cambia la numeracion oficial de requerimientos**: actualizar la linea del documento oficial y el mapeo RF/RNF.
5. **Cuando cambia el estado de una entrega de integrante**: mover el modulo de "Pendientes" a "Verificado/Integrado" con la evidencia (conteo de tests, capturas).

## 3. Estructura minima de project_memory.md

| Seccion | Contenido |
|---|---|
| Contexto del Proyecto | Nombre, documento oficial vigente (con fecha), fuente de verdad (`LAST VERSION/`) |
| Reglas Tecnicas y Decisiones | IVA, comisiones, borrado logico, seguridad, contrato API, decisiones cerradas del Director |
| Versionado | Remotos, politica de push (nunca automatico), destino de cada remoto |
| Lecciones Aprendidas | Errores repetidos y soluciones (no duplicar la misma leccion) |
| Estado YYYY-MM-DD | Por cada dia de trabajo: cierres, modulos integrados/verificados con evidencia, pendientes actualizados |

Reglas de contenido de la seccion "Estado":
- Cada entrada de dia agrega una subseccion `## Estado YYYY-MM-DD` (la mas reciente al final, en orden cronologico).
- Incluir SIEMPRE: cierres del Director, modulos integrados con conteo de tests verificado, entregas revisadas (con veredicto), decisiones de BD/RF, y la lista de pendientes actualizada.
- Citar evidencia verificable (conteo passed, capturas, SHOW CREATE TABLE, consultas contra BD real). NUNCA inventar numeros ni estados.

## 4. Reglas de aislamiento

- NO almacenar en la memoria de CommerCity datos, rutas ni decisiones de OTROS proyectos (regla `aislamiento-proyecto.md`).
- NO versionar la memoria en git (queda fuera del working tree).
- Si la informacion pegada pertenece a otro repositorio, no se escribe en esta memoria.

## 5. Checklist de cierre de turno (obligatorio)

Antes de dar por terminada la sesion o una tarea, verificar:

- [ ] `project_memory.md` actualizado con el estado del dia (seccion `Estado YYYY-MM-DD`)
- [ ] Pendientes actualizados (sin items ya resueltos, sin items nuevos sin registrar)
- [ ] Decisiones del Director/RF reflejadas en memoria Y en `.trae/rules/revision-requerimientos.md`
- [ ] Cambios de codigo documentados en `informes/CHANGELOG.md` (regla documentacion-cambios.md)
- [ ] No se mezclo informacion de otros proyectos
- [ ] Working tree listo sin commits no autorizados (regla git-autorizacion-versionado.md)
