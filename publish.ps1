Write-Host ""
Write-Host "=== PUBLICADOR OTD DASHBOARD ==="

# 1 - Verifica se esta em modo administrador
$adminCheck = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $adminCheck) {
    Write-Host ""
    Write-Host "ERRO: Execute o PowerShell como Administrador."
    exit
}

# 2 - Verifica token
if (-not $env:GH_TOKEN) {
    Write-Host ""
    Write-Host "ERRO: Variavel GH_TOKEN nao definida."
    Write-Host "Configure com:  setx GH_TOKEN SEU_TOKEN_AQUI"
    exit
}

# 3 - Caminho do package.json
$packagePath = "package.json"

if (-not (Test-Path $packagePath)) {
    Write-Host "ERRO: package.json nao encontrado."
    exit
}

# 4 - Carrega o package.json
$json = Get-Content $packagePath | ConvertFrom-Json

$oldVersion = $json.version

# Incremento automatico: apenas patch (x.y.Z)
$parts = $oldVersion.Split(".")
$parts[2] = [int]$parts[2] + 1
$newVersion = "$($parts[0]).$($parts[1]).$($parts[2])"

$json.version = $newVersion

# 5 - Salva o package.json atualizado
$json | ConvertTo-Json -Depth 20 | Set-Content $packagePath -Encoding UTF8

Write-Host ""
Write-Host "Versao atualizada: $oldVersion -> $newVersion"

# 6 - Git: commit e push
Write-Host ""
Write-Host "Enviando arquivos para o GitHub..."

git add .
git commit -m "Versao $newVersion"
git push

# 7 - Gera o instalador e publica no GitHub Releases
Write-Host ""
Write-Host "Gerando build e publicando..."
npm run publish # <-- CORRETO: Usa o comando que publica os artefatos!

Write-Host ""
Write-Host "Publicacao concluida."
Write-Host "Versao publicada: $newVersion"
Write-Host "Acesse o Release no GitHub."
