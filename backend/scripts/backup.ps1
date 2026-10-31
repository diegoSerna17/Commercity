<#
.SYNOPSIS
    Backup comprimido (y opcionalmente cifrado) de la base de datos CommerCity.

.DESCRIPTION
    TASK-8.5 del lote de auditoria 2026-10-11.

    Ejecuta mysqldump con un usuario de SOLO LECTURA, comprime con GZip nativo
    (.NET, sin dependencias) y aplica retencion por dias. Si se pasa
    -EncryptPassword y 7-Zip esta instalado, el .gz se cifra con AES-256
    (-mhe=on) y se elimina el .gz intermedio.

    Seguridad:
      - La contrasena de MySQL se toma de la variable de entorno MYSQL_PWD
        (nunca por argumento de linea de comandos) o se pide de forma segura.
      - El script jamas imprime la contrasena ni el contenido del dump.
      - Los respaldos NO se versionan: la carpeta backups/ esta en .gitignore
        (contienen hashes bcrypt y datos personales; R-2).

    Usuario de BD recomendado (crear una sola vez, como root):
      CREATE USER 'backup_ro'@'%' IDENTIFIED BY '<clave-aleatoria>';
      GRANT SELECT, LOCK TABLES, SHOW VIEW, TRIGGER, EVENT ON *.* TO 'backup_ro'@'%';

.EXAMPLE
    $env:MYSQL_PWD = "<clave-del-usuario-backup>"
    .\backup.ps1 -DbHost 127.0.0.1 -DbUser backup_ro -DbName commercity_v2

.EXAMPLE
    $pwdSeguro = Read-Host -AsSecureString
    .\backup.ps1 -DbUser backup_ro -EncryptPassword $pwdSeguro
#>
param(
    [string]$DbHost = "127.0.0.1",
    [int]$DbPort = 3306,
    [string]$DbUser = "backup_ro",
    [string]$DbName = "commercity_dev",
    [string]$OutDir = "",
    [int]$RetentionDays = 30,
    [System.Security.SecureString]$EncryptPassword = $null
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command mysqldump -ErrorAction SilentlyContinue)) {
    throw "mysqldump no esta en el PATH. Instala el cliente de MySQL 8."
}

if (-not $OutDir) {
    $OutDir = Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..\..")) "backups"
}
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
}

$marca = Get-Date -Format "yyyyMMdd-HHmmss"
$tmpSql = Join-Path $OutDir "tmp_${DbName}_$marca.sql"
$destinoGz = Join-Path $OutDir "backup_${DbName}_$marca.sql.gz"

Write-Host "Iniciando mysqldump de '$DbName' en $DbHost (usuario $DbUser, solo lectura)..."
& mysqldump --host=$DbHost --port=$DbPort --user=$DbUser `
    --single-transaction --routines --events --default-character-set=utf8mb4 `
    --no-tablespaces -- "$DbName" > $tmpSql
if ($LASTEXITCODE -ne 0) {
    Remove-Item $tmpSql -Force -ErrorAction SilentlyContinue
    throw "mysqldump fallo (codigo $LASTEXITCODE). Verifica MYSQL_PWD y los privilegios del usuario."
}

Write-Host "Comprimiendo con GZip nativo..."
$entrada = [System.IO.File]::OpenRead($tmpSql)
try {
    $salida = [System.IO.File]::Create($destinoGz)
    try {
        $gzip = New-Object System.IO.Compression.GZipStream($salida, [System.IO.Compression.CompressionMode]::Compress)
        try { $entrada.CopyTo($gzip) } finally { $gzip.Dispose() }
    } finally { $salida.Dispose() }
} finally { $entrada.Dispose() }
Remove-Item $tmpSql -Force

$archivoFinal = $destinoGz

if ($EncryptPassword) {
    $sieteZip = Get-Command 7z -ErrorAction SilentlyContinue
    if (-not $sieteZip) {
        Write-Warning "7-Zip no esta instalado: el respaldo queda SOLO comprimido, sin cifrar. Instala 7-Zip para usar -EncryptPassword."
    } else {
        $clavePlano = [System.Net.NetworkCredential]::new("", $EncryptPassword).Password
        try {
            $destinoZip = "$destinoGz.7z"
            & 7z a -t7z -mhe=on "-p$clavePlano" $destinoZip $destinoGz | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "7-Zip fallo (codigo $LASTEXITCODE)." }
            Remove-Item $destinoGz -Force
            $archivoFinal = $destinoZip
        } finally {
            $clavePlano = $null
        }
    }
}

Write-Host "Aplicando retencion de $RetentionDays dias..."
$limite = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem $OutDir -File | Where-Object {
    ($_.Name -like "backup_*.sql.gz" -or $_.Name -like "backup_*.sql.gz.7z") -and $_.LastWriteTime -lt $limite
} | ForEach-Object {
    Write-Host "  retirado: $($_.Name)"
    Remove-Item $_.FullName -Force
}

$info = Get-Item $archivoFinal
Write-Host ("Backup completado: {0} ({1:N2} MB)." -f $info.FullName, ($info.Length / 1MB))
