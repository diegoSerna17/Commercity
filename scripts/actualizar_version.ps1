# ============================================================
# scripts/actualizar_version.ps1 — Actualiza el archivo VERSION
# de la raiz del proyecto (SemVer X.Y.Z) sin que la IA tenga
# que leer/reescribir el archivo (ahorro de tokens).
#
# Adaptado del proyecto NOC (2026-08-21): el USUARIO ejecuta el
# comando con la version YA decidida. Con -DryRun solo muestra
# el resultado sin escribir. -Ruta permite apuntar a otra copia
# (pruebas).
#
# Uso:
#   .\scripts\actualizar_version.ps1 -Version "1.1.0"
#   .\scripts\actualizar_version.ps1 -Version "1.1.0" -DryRun
# ============================================================

param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string]$Version,

    [Parameter(Mandatory = $false)]
    [switch]$DryRun,

    [Parameter(Mandatory = $false)]
    [string]$Ruta = ""
)

$ErrorActionPreference = "Stop"

# Ruta del VERSION relativa al script (raiz del proyecto), salvo -Ruta
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
if ($Ruta) {
    $VersionFile = $Ruta
} else {
    $VersionFile = Join-Path $ProjectRoot "VERSION"
}

if (-not (Test-Path $VersionFile)) {
    Write-Error "No existe el archivo VERSION en: $VersionFile"
    exit 2
}

$Actual = (Get-Content -Path $VersionFile -Raw).Trim()
if ($Actual -eq $Version) {
    Write-Warning "La version $Version ya es la actual. No se actualiza (evitaria duplicado)."
    exit 1
}

if ($DryRun) {
    Write-Host "[VERSION-DRYRUN] VERSION quedaria: $Version (actual: $Actual)"
    exit 0
}

# Escribir con UTF-8 sin BOM y salto de linea final
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($VersionFile, $Version + [Environment]::NewLine, $Utf8NoBom)

Write-Host "[VERSION] VERSION actualizada de $Actual a $Version en $VersionFile"
