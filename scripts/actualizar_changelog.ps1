# ============================================================
# scripts/actualizar_changelog.ps1 — Inserta una entrada nueva
# al inicio de informes/CHANGELOG.md (formato CommerCity:
# "## YYYY-MM-DD - TAG: descripcion").
#
# Adaptado del proyecto NOC (2026-08-21): permite actualizar el
# CHANGELOG sin que la IA lea/reescriba el archivo completo
# (ahorro de tokens): la IA entrega el bloque Markdown de la
# entrada y el USUARIO ejecuta este comando.
#
# Uso:
#   .\scripts\actualizar_changelog.ps1 -Bloque @"
#   ## 2026-08-21 - FEAT: descripcion del cambio
#
#   - **Autor**: Nombre
#   - **Archivos**: rutas
#   - **Descripcion**: que se hizo
#   - **Motivo**: por que
#   - **Requerimientos**: RF### o N/A
#   - **Evidencia**: resultado
#   - **Estado**: Completado
#   "@
#
# El bloque se inserta ANTES de la primera entrada existente
# (linea "## YYYY-MM-DD"). Si el encabezado (fecha + TAG) ya
# existe, NO se duplica (warning y exit 1). Se permiten varias
# entradas el mismo dia con TAG distintos.
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$Bloque,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun,

    [Parameter(Mandatory = $false)]
    [string]$Ruta = ""
)

$ErrorActionPreference = "Stop"

# Ruta del CHANGELOG relativa al script (raiz del proyecto)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
if ($Ruta) {
    $Changelog = $Ruta
} else {
    $Changelog = Join-Path $ProjectRoot "informes\CHANGELOG.md"
}

if (-not (Test-Path $Changelog)) {
    Write-Error "No existe CHANGELOG.md en: $Changelog"
    exit 2
}

$Bloque = $Bloque.Trim()
if (-not $Bloque) {
    Write-Error "El bloque esta vacio."
    exit 2
}

# Extraer el encabezado de fecha del bloque (## YYYY-MM-DD)
$m = [regex]::Match($Bloque, '^##\s+(\d{4}-\d{2}-\d{2})', 'Multiline')
if (-not $m.Success) {
    Write-Error "El bloque debe empezar con '## YYYY-MM-DD' (encabezado de fecha)."
    exit 2
}
$Fecha = $m.Groups[1].Value

# Primera linea del bloque (encabezado completo fecha + TAG) para duplicados
$HeaderLine = ($Bloque -split "`r?`n")[0].Trim()

# Leer el archivo actual
$Content = Get-Content -Path $Changelog -Raw -Encoding UTF8

# Verificar que el encabezado (fecha + TAG) no exista ya (evita duplicados)
if ($Content -match [regex]::Escape($HeaderLine)) {
    Write-Warning "El encabezado '$HeaderLine' ya existe en el CHANGELOG. No se inserta (evitaria duplicado)."
    exit 1
}

# Localizar la primera entrada existente ("## YYYY-MM-DD")
$MatchStart = [regex]::Match($Content, '(?m)^##\s+\d{4}-\d{2}-\d{2}')
if (-not $MatchStart.Success) {
    # No hay entradas previas: simplemente concatenar el bloque
    $Nuevo = $Bloque + "`r`n`r`n" + $Content
} else {
    # Insertar el bloque + separador antes de la primera entrada
    $Index = $MatchStart.Index
    $Nuevo = $Content.Substring(0, $Index) + "`r`n" + $Bloque + "`r`n`r`n" + $Content.Substring($Index)
    # Si la posicion anterior al bloque no termina con separador ---, agregarlo
    $Prev = $Nuevo.Substring(0, $Nuevo.IndexOf($Bloque))
    if ($Prev -notmatch "---\s*$") {
        $Nuevo = $Content.Substring(0, $Index) + "`r`n---`r`n`r`n" + $Bloque + "`r`n`r`n" + $Content.Substring($Index)
    }
}

if ($DryRun) {
    Write-Host "[CHANGELOG-DRYRUN] La entrada $Fecha quedaria insertada al inicio de $Changelog"
    exit 0
}

# Escribir con UTF-8 sin BOM (preservar la codificacion del archivo)
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($Changelog, $Nuevo, $Utf8NoBom)

Write-Host "[CHANGELOG] Entrada $Fecha insertada correctamente en $Changelog"
