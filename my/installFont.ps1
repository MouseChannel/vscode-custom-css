$fontName = "JetBrainsMono"
$LocalAppData = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::LocalApplicationData)
$DestinationFolder = Join-Path -Path $LocalAppData -ChildPath "Microsoft\Windows\Fonts\$fontName"
$Temp = $env:TEMP
if (-not (Test-Path $DestinationFolder)) {
    New-Item -ItemType Directory -Path $DestinationFolder | Out-Null
} 

Write-Host "Extracting $fontName..." -ForegroundColor DarkCyan
Expand-Archive -Path "$Temp\$fontName.zip" -DestinationPath $DestinationFolder -Force
$fontFiles = Get-ChildItem -Path $DestinationFolder -Include '*.ttf', '*.otf' -Recurse
$fileCount = $fontFiles.Count
$counter = 1
Write-Host $counter $DestinationFolder
foreach ($file in $fontFiles) {
    $fontFilePath = $file.FullName
    $fontFileName = $file.Name
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts" -Name $fontFileName -Value $fontFilePath
    Start-Sleep -Milliseconds 100
    $counter++
    Write-Host $counter $fileCount
}