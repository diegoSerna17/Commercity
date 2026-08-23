# Ahorro de Tokens — Actualizacion Manual del CHANGELOG.md (Proyecto CommerCity)

- **OBLIGATORIO**: la IA NO lee ni reescribe `informes/CHANGELOG.md` completo mediante Read + SearchReplace/Write del archivo entero cuando se trata de agregar una entrada nueva. La actualizacion se hace EXCLUSIVAMENTE con el script [scripts/actualizar_changelog.ps1](../scripts/actualizar_changelog.ps1), que inserta una entrada nueva al inicio (antes de la primera fecha existente) sin que la IA lea el archivo completo.
- Esta regla complementa a [documentacion-cambios.md](documentacion-cambios.md) (plantilla y checklist de la entrada): la IA genera el bloque Markdown y lo inserta por comando.

## Flujo obligatorio (nueva entrada)

1. La IA redacta el bloque de la entrada con el formato canonico de CommerCity:
   - Encabezado `## YYYY-MM-DD - TAG: descripcion corta` (obligatorio, el script lo valida).
   - Bullets: `- **Autor**`, `- **Archivos**`, `- **Descripcion**`, `- **Motivo**`, `- **Requerimientos**`, `- **Evidencia**`, `- **Estado**` (regla documentacion-cambios.md).
   - Idioma: espanol, sin emojis. Se permiten VARIAS entradas el mismo dia con TAG distintos (no son duplicados).
2. La IA entrega el comando exacto con el bloque **YA redactado** (nunca un placeholder), para que el USUARIO lo ejecute en consola:

```powershell
.\scripts\actualizar_changelog.ps1 -Bloque @"
## 2026-MM-DD - TAG: descripcion corta

- **Autor**: Nombre
- **Archivos**: rutas de archivos modificados
- **Descripcion**: que se hizo
- **Motivo**: por que se hizo
- **Requerimientos**: RF### / RNF## o N/A
- **Evidencia**: resultado de prueba o consulta
- **Estado**: Completado
"@
```

3. La IA NO bloquea su turno esperando: indica que queda PENDIENTE la actualizacion manual y entrega el comando.
4. El usuario ejecuta el comando en su consola y pega la salida (o el `[CHANGELOG] Entrada YYYY-MM-DD insertada correctamente`).
5. Si el usuario no pega salida, el cambio queda en estado `PENDIENTE CHANGELOG MANUAL` y NO se reporta como terminado.

## Verificacion (bajo consumo de tokens)

- La IA verifica con Grep SOLO el encabezado insertado (nunca leyendo el archivo completo):
  - `Grep pattern="## YYYY-MM-DD - TAG"` path="informes/CHANGELOG.md" -> debe devolver 1 coincidencia (la entrada nueva).
  - `Grep pattern="<palabra_clave_del_cambio>"` path="informes/CHANGELOG.md" -> confirma el contenido de la entrada.
- Verificar persistencia OneDrive: si el Grep no encuentra la entrada, el cambio fue revertido silenciosamente -> re-entregar el comando.

## Reglas de ejecucion

- El script rechaza (exit 1) encabezados duplicados (fecha + TAG): si el Grep ya encuentra `## YYYY-MM-DD - TAG`, NO re-ejecutar el comando con el mismo encabezado.
- El bump de version en el archivo `VERSION` sigue su propio flujo ([ahorro-tokens-version-manual.md](ahorro-tokens-version-manual.md)); esta regla cubre SOLO el CHANGELOG.
- El commit/push NUNCA se ejecuta automaticamente (ver [ahorro-tokens-git-manual.md](ahorro-tokens-git-manual.md)).

## Excepciones (la IA SI puede editar directamente)

- Correcciones menores de formato/ortografia en entradas YA existentes (edicion puntual con SearchReplace sobre pocas lineas, sin leer el archivo completo).
- Si el script falla por causas ambientales (permisos, OneDrive), la IA puede entregar el comando manual equivalente (PowerShell de insercion) en lugar de leer y reescribir el archivo.
