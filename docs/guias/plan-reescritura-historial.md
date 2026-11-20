# Plan de reescritura del historial con git filter-repo (SOLO PLAN — NO EJECUTAR)

> TASK-8.9 / DEC-006 del plan `fix-auditoria-preview-2026-10-11` (R-2 / M-GIT-1).
> **Prohibido ejecutarlo como parte del lote de auditoria.** Requiere aprobacion
> explicita del lider, ventana de congelamiento y coordinacion de todos los
> colaboradores (SEC-003). Este documento no contiene secretos.

## 1. Que se purgaria (objetos sensibles o pesados del historial)

| Ruta en el historial | Origen | Motivo |
|---|---|---|
| `LAST VERSION/2/commercity_v2.sql` (~345 KB) | commit `e6355a8` (2026-08-10) | Volcado con PII: 183 usuarios con hash bcrypt, datos bancarios, mensajes, pedidos con direcciones (R-2). |
| `LAST VERSION/seed_commercity.sql`, `LAST VERSION/schema_commercity_3.sql` | commits de agosto | Copias historicas del seed/esquema; la contrasena trivial quedo publicada en su dia. |
| `backend/node_modules/**` (3866 archivos) | commit `3dbcf53` | Dependencias completas versionadas por error (peso). |
| `backend/src/server/uploads/**` | varios | Imagenes/PDF subidos por usuarios (posible PII). |
| `docs/DRIVE/**` (315 archivos, ~31 MB) — opcional | 2026-03 | Peso y rutas largas; solo si el equipo decide que no debe vivir en el repo (TASK-8.8). |
| Credenciales historicas (usuario/clave de BD en textos, contrasenas de firma Android del repo movil) | varios | Ya mitigadas con rotacion (Fase 0); la reescritura evita su permanencia publica. |

## 2. Compuerta de aprobacion (todas obligatorias)

1. **Rotacion hecha** (Fase 0 del plan): rotar contrasenas de admin/seed, `DB_PASSWORD`, `JWT_SECRET` (con respaldo previo de datos bancarios), firma Android. La reescritura NO protege lo ya clonado o forkeado; la rotacion es la mitigacion real.
2. **Aprobacion explicita del lider** por escrito (SEC-003), con confirmacion del propietario de cada remoto (`commercycity`, repo movil, `origin`).
3. **Ventana de congelamiento**: nadie hace push durante la operacion.
4. **Backup espejo** antes de tocar: `git clone --mirror <url> respaldo-commercity.git` (+ copia en almacenamiento externo cifrado). Verificar con `git fsck` en el espejo.
5. **Todos los colaboradores re-clonan** despues (los clones viejos conservan los objetos eliminados y no deben seguir pusheando).
6. **Force-push coordinado**: solo a los remotos aprobados, jamas a un repo ajeno sin su dueño.
7. **PRs/fork: cerrar o portar** antes; los tags `archive/*` (si ya existen) se recrean tras la reescritura.
8. **Avisar**: los hashes de commit citados en `docs/CHANGELOG.md` e informes quedaran obsoletos; publicar el `commit-map` generado por la herramienta o aceptar la obsolescencia documentada.

## 3. Procedimiento tecnico propuesto (referencia; NO ejecutado)

```bash
# 0) Version exacta de la herramienta (SEC-002: sin pipes de instalacion).
python -m pip install --user git-filter-repo==2.47.0

# 1) Espejo de trabajo (nunca sobre el clon en uso).
git clone --mirror git@github.com:<org>/Commercity.git commercycity-purga.git
cd commercycity-purga.git

# 2) Metricas antes (opcional): git filter-repo --analyze

# 3) Purga por rutas.
git filter-repo --force --invert-paths \
  --path "LAST VERSION/" \
  --path "backend/node_modules" \
  --path "backend/src/server/uploads" \
  # --path "docs/DRIVE"   # solo si el equipo lo aprueba

# 4) Verificacion.
git log --all --oneline -- "LAST VERSION"          # debe salir vacio
git log --all --oneline -- backend/node_modules    # debe salir vacio
git count-objects -vH                              # peso antes/despues
git fsck --full

# 5) Publicacion (solo con la compuerta aprobada).
git push --force --mirror <url-aprobada>

# 6) Re-clonado general + CI verde sobre el historial nuevo.
```

Notas tecnicas:
- `git filter-repo` conserva un `commit-map` en `.git/filter-repo/`; guardarlo para remapear citas de CHANGELOG.
- Reescribir invalida TODAS las ramas y tags; por eso la Fase 10 (consolidacion) va **antes** y esto queda como **ultima** operacion (RISK-013 del plan).
- Alternativa sin reescritura (la vigente por defecto): mantener la rotacion + `docs/informes` y dumps fuera del arbol; el riesgo residual es la permanencia de PII en el historial publico si el repositorio es publico (ASSUMPTION-002).

## 4. Estado

**NO EJECUTADO.** Este plan queda listo para cuando el lider abra la compuerta; cualquier ejecucion fuera de la ventana seria un incidente de coordinacion.
