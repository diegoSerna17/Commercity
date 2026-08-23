# Ahorro de Tokens — Actualizacion Manual de VERSION (Proyecto CommerCity)

- **OBLIGATORIO**: la IA NO edita el archivo `VERSION` de la raiz mediante Write/SearchReplace del archivo completo. La actualizacion se hace EXCLUSIVAMENTE con el script [scripts/actualizar_version.ps1](../scripts/actualizar_version.ps1), que valida el formato SemVer (X.Y.Z), rechaza versiones duplicadas y escribe UTF-8 sin BOM, sin que la IA lea el archivo.
- Esta regla complementa a [documentacion-cambios.md](documentacion-cambios.md) (el changelog se actualiza por separado con [ahorro-tokens-changelog-manual.md](ahorro-tokens-changelog-manual.md)).

## Flujo obligatorio (bump de version)

1. La IA propone la nueva version SemVer (ej: 1.1.0 para feature, 1.0.1 para fix) y entrega el comando exacto para que el USUARIO lo ejecute en consola:

```powershell
.\scripts\actualizar_version.ps1 -Version "1.1.0"
```

2. Opcionalmente se puede previsualizar sin escribir agregando `-DryRun` al final del comando.
3. La IA NO bloquea su turno esperando: indica que queda PENDIENTE la actualizacion manual y entrega el comando.
4. El usuario ejecuta el comando y pega la salida (o el `[VERSION] VERSION actualizada de X.Y.Z a X.Y.Z`).
5. Si el usuario no pega salida, el cambio queda en estado `PENDIENTE VERSION MANUAL` y NO se reporta como terminado.

## Verificacion (bajo consumo de tokens)

- La IA verifica con Read del archivo `VERSION` (una sola linea, consumo minimo) que el valor sea el esperado.
- Verificar persistencia OneDrive: si el valor no coincide, el cambio fue revertido silenciosamente -> re-entregar el comando.

## Reglas de ejecucion

- El script rechaza (exit 1) si la version ya es la actual (evita duplicados).
- El CHANGELOG.md sigue su propio flujo (ahorro-tokens-changelog-manual.md); esta regla cubre SOLO el archivo `VERSION`.
- El commit/push NUNCA se ejecuta automaticamente (ver [ahorro-tokens-git-manual.md](ahorro-tokens-git-manual.md)).

## Excepciones (la IA SI puede editar directamente)

- Si el script falla por causas ambientales (permisos, OneDrive), la IA puede entregar el comando manual equivalente (Write de una linea) en lugar de editar de otra forma.
