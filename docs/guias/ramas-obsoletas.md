# Higiene de ramas y peso del repositorio (2026-10-11)

> TASK-8.7 / TASK-8.8 del plan `fix-auditoria-preview-2026-10-11`.
> **Este documento NO borra ni modifica nada**: solo inventaria y propone. Cualquier
> borrado requiere aprobacion explicita del lider rama por rama (SEC-003) y se
> ejecutara en la Fase 10 (TASK-10.10), primero con tags `archive/<rama>`.
> Inventario generado con `git for-each-ref` + `git rev-list --count` contra
> `origin/PREVIEW`; los conteos se mueven mientras haya carriles trabajando.

## 1. Inventario (contra `origin/PREVIEW` = `ec482bb`)

### Integradas (0 commits unicos: todo su trabajo ya esta en `origin/PREVIEW`)

| Rama | Tip | Comentario |
|---|---|---|
| `feature/docs-api-zod-openapi` | `ec482bb` | Ya en PREVIEW (es la base actual). |
| `feature/seguidores-perfil-publico-tema` | `fe9fcf8` | Integrada 2026-10-07 (merge `4d1873c`). |
| `fix/auditoria-preview-2026-10-05` (local y `origin/`) | `7311839` | Lote anterior; ya integrado. |
| `PREVIEW` (local, puntero viejo) | `4d1873c` | La local quedo atras 15 commits de `origin/PREVIEW`; no es rama de trabajo. |
| `main` / `origin/main` | `2918566` | Commit de release; `PREVIEW` ya lo contiene. Segun DEC-008 `main` queda solo como puntero de release (no se cierra). |
| `commercycity/feature/borrar-ventana-de-vite`, `commercycity/feature/hero`, `commercycity/feature/navbar`, `commercycity/feature/web-integracion-api`, `commercycity/feature/seguidores-perfil-publico-tema`, `commercycity/master`, `commercycity/prueba-backend` | varios | 0 commits unicos; candidatas a cierre en el repo de Diego (solo se propone). |

### Duplicadas (mismo tip `b18d495`, 5 commits de agosto de Diego Serna)

| Rama | Comentario |
|---|---|
| `feature/api-rest`, `integrar-diego`, `commercycity`, `commercycity/feature/api-rest`, `commercycity/feature/editar-producto-drawer`, `commercycity/main` | Las seis apuntan al mismo commit `b18d495` (2026-08-28). El contenido de agosto no esta en PREVIEW; confirmar con Diego si se archiva (`archive/<rama>` + cierre). |

### Pendientes con trabajo propio (no integrado)

| Rama | Unicos | Tip | Propuesta |
|---|---|---|---|
| `commercycity/REVISION` | 6 | `840054d` (2026-09-23) | Descartada por contrato incompatible (informe 2026-10-05); proponer archivo al propietario. |
| `commercycity/backend` | 8 | `fddfae0` (2026-09-14) | Revisar con Diego antes de archivar (los fixes reales ya viven en PREVIEW). |
| `commercycity/limpiar-chat` | 1 | `d80f8c8` (2026-09-01) | Candidata a archivo (el chat ya sin adjuntos se cierra en TASK-7.8). |
| `commercycity/feature/frontend-modulos-s1` | 2 | `aaf6360` (2026-08-12) | Candidata a archivo. |
| `fix/command-code-write-eof-resiliente` | 2 | `cf9ab04` (2026-10-10) | Herramienta local del lider; decidir si se archiva. |
| `movil` / `movil/main` | 8 | `1db7aae` (2026-10-08) | Repo movil independiente: se congela tras TASK-10.3/10.5 (port a `apps/movil`). |
| `origin/preview-movil` | 11 | `2f55f33` (2026-10-09) | Fuente del port del movil (TASK-10.3); se archiva despues. |

### Ramas de trabajo del lote de auditoria (activas)

`fix/aud-p1-backend`, `fix/aud-p2-frontend`, `fix/aud-p3-apps`, `fix/aud-p4-bddocs`
y la integracion `fix/auditoria-preview-2026-10-11`: todas parten de `ec482bb`
y se integran por PR a `PREVIEW`; se borran al mergear (politica TASK-10.2).

## 2. Propuesta de cierre (a aprobar una por una)

1. En `origin` (repo propio): crear `archive/<rama>` y cerrar `PREVIEW` (local),
   `feature/docs-api-zod-openapi`, `feature/seguidores-perfil-publico-tema` y
   `fix/auditoria-preview-2026-10-05` una vez integradas; cerrar `preview-movil`
   tras TASK-10.3; `main` se mantiene como puntero de release (DEC-008).
2. En `commercycity` (repo de Diego): **solo se propone** la lista de la seccion 1
   (duplicadas + REVISION + backend + limpiar-chat + frontend-modulos-s1 +
   ramas `feature/*` y `master`); la decide y ejecuta su propietario.
3. En el repo movil (`BLACK-CODE-JSB`): congelar tras el port (TASK-10.5); su
   propietario pasa el repo a solo lectura/archivado.
4. Antes de cualquier borrado: tag `archive/<rama>` en el commit tip (reversible).

## 3. Peso del repositorio y `docs/DRIVE` (TASK-8.8)

Medicion al 2026-10-11 sobre esta rama (`git ls-tree -r -l HEAD docs/DRIVE`):

| Metrica | Valor |
|---|---|
| Archivos versionados en `docs/DRIVE` | **315** |
| Tamano en git | **~31 MB** (32,5 MB medidos en el checkout) |
| Ruta mas larga | **179 caracteres** (`docs/DRIVE/Documentacion/UML/UML (xml y png)/Diagramas de secuenciales/.../Historial de Compras y Devoluciones.drawio.png`) |

- **Impacto**: las rutas largas rompen el checkout en Windows sin `core.longpaths`
  (`git config --global core.longpaths true`) o sin clonar con sparse-checkout que
  excluya `docs/DRIVE` (la auditoria 2026-10-11 tuvo que usar checkout disperso).
- **Decision por defecto (TASK-8.8)**: NO quitarlo todavia; el equipo decide en la
  Fase 10. Si se decide quitarlo del indice (no del disco de nadie), hacerlo con
  `git rm -r --cached docs/DRIVE` + excepcion retirada del `.gitignore`, en un commit
  propio y con aprobacion.
- Existe tambien documentacion adjunta del equipo para defensa del proyecto: antes
  de retirarla, confirmar con el instructor que la copia de Drive les basta.

## 4. Notas

- Los commits duplicados por cherry-pick detectados por la auditoria (`5997ea3`=`3c501de`,
  `028ec9e`=`a7abf2c`) quedan documentados aqui; no se reescriben (DEC-006).
- Este documento se apoya en TASK-10.1 (`tools/ramas-estado.mjs`) cuando la Fase 10
  aporte la funcion de inventario automatizada; mientras tanto, los conteos de la
  seccion 1 salen de comandos `git` de solo lectura.
