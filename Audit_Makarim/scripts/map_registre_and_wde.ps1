# Parse sys_registre.FIC records sequentially and align with sys_registre.mmo + inventory all .wde files
$regPath = ".\sources\Flex PMS 9\commun\configuration\sa\sys_registre.FIC"
$mmoPath = ".\sources\Flex PMS 9\commun\configuration\sa\sys_registre.mmo"
$bytes = [System.IO.File]::ReadAllBytes($regPath)
$mmoBytes = [System.IO.File]::ReadAllBytes($mmoPath)

# Find offsets of 'Administration,' or 'Réservation,' or 'Etats,' etc. in sys_registre.FIC to determine exact record stride
$asc = [System.Text.Encoding]::GetEncoding(1252).GetString($bytes)
$hits = [regex]::Matches($asc, '(?:Administration|Réservation|Front Office|Main courante|Caisse|Gouvernante|Etats|Back Office|Add-on),[^\x00]{0,60}')
$offsets = $hits | ForEach-Object { $_.Index }
Write-Output "Total menu category occurrences in sys_registre.FIC: $($offsets.Count)"
if ($offsets.Count -ge 2) {
    $diffs = @()
    for ($i = 1; $i -lt [Math]::Min(15, $offsets.Count); $i++) { $diffs += ($offsets[$i] - $offsets[$i-1]) }
    Write-Output "Sample offset diffs: $($diffs -join ', ')"
}

# Dump every record around each hit (window [-250..+200] bytes) to see exact label + parent menu + icon/shortcut
$sb = New-Object System.Text.StringBuilder
foreach ($h in $hits) {
    $start = [Math]::Max(0, $h.Index - 220)
    $len = [Math]::Min(420, $bytes.Length - $start)
    $chunk = [System.Text.Encoding]::GetEncoding(1252).GetString($bytes, $start, $len)
    $tokens = [regex]::Matches($chunk, '[A-Za-z0-9_À-ÿ][A-Za-z0-9_À-ÿ \-\.\:/\(\)''°&,\+]{2,80}') | ForEach-Object { $_.Value.Trim() } | Where-Object { $_ -match '[A-Za-zÀ-ÿ]{3,}' -and $_ -notmatch '[Þßðþýÿ]' }
    [void]$sb.AppendLine("@$($h.Index) [$($h.Value)] => " + ($tokens -join " || "))
}
[System.IO.File]::WriteAllText(".\scripts\out_windev\registre_records.txt", $sb.ToString(), [System.Text.Encoding]::UTF8)

# Also list ALL .wde files with internal report name from header + SHA256 hash to detect duplicates across folders
$wdeSb = New-Object System.Text.StringBuilder
$allWde = Get-ChildItem -Path ".\sources" -Recurse -Filter "*.wde" | Sort-Object FullName
foreach ($w in $allWde) {
    $rel = $w.FullName.Substring((Get-Location).Path.Length + 1)
    $b = [System.IO.File]::ReadAllBytes($w.FullName)
    $hdr = [System.Text.Encoding]::GetEncoding(1252).GetString($b, 0, [Math]::Min(256, $b.Length))
    $hdrStrs = [regex]::Matches($hdr, '[A-Za-z0-9_À-ÿ \-\.]{3,60}') | ForEach-Object { $_.Value.Trim() } | Select-Object -First 4
    $hash = (Get-FileHash -Path $w.FullName -Algorithm MD5).Hash.Substring(0,8)
    [void]$wdeSb.AppendLine("$rel | $($w.Length) B | $($w.LastWriteTime.ToString('dd/MM/yyyy HH:mm')) | MD5:$hash | Hdr: $($hdrStrs -join ' ; ')")
}
[System.IO.File]::WriteAllText(".\scripts\out_windev\wde_inventory.txt", $wdeSb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Wrote registre_records.txt and wde_inventory.txt ($($allWde.Count) .wde files)"
