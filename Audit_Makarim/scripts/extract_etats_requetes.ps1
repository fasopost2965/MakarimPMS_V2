$outDir = Join-Path (Get-Location) "scripts\out_windev"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Extract-StringsFromBytes {
    param([byte[]]$bytes, [int]$minLen = 4)
    $results = New-Object System.Collections.Generic.List[string]
    
    # ASCII / Latin-1 printable strings
    $asciiText = [System.Text.Encoding]::GetEncoding(1252).GetString($bytes)
    $mAscii = [regex]::Matches($asciiText, '[\x20-\x7E\xC0-\xFF]{' + $minLen + ',}')
    foreach ($m in $mAscii) {
        $v = $m.Value.Trim()
        if ($v.Length -ge $minLen) { $results.Add($v) }
    }

    # UTF-16LE printable strings (French + ASCII)
    $utf16Text = [System.Text.Encoding]::Unicode.GetString($bytes)
    $mUtf = [regex]::Matches($utf16Text, '[\x20-\x7E\xC0-\xFF]{' + $minLen + ',}')
    foreach ($m in $mUtf) {
        $v = $m.Value.Trim()
        if ($v.Length -ge $minLen) { $results.Add($v) }
    }
    return $results
}

# 1. SQL files
$sqlOut = New-Object System.Text.StringBuilder
$sqlFiles = Get-ChildItem -Path ".\sources" -Recurse -Filter "*.sql"
foreach ($sf in $sqlFiles) {
    [void]$sqlOut.AppendLine("=== $($sf.FullName) ===")
    [void]$sqlOut.AppendLine([System.IO.File]::ReadAllText($sf.FullName, [System.Text.Encoding]::GetEncoding(1252)))
    [void]$sqlOut.AppendLine("")
}
[System.IO.File]::WriteAllText((Join-Path $outDir "sql_files.txt"), $sqlOut.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Extracted $($sqlFiles.Count) SQL files."

# 2. All .wde files in sources\Etats et requêtes
$wdeOut = New-Object System.Text.StringBuilder
$wdeFiles = Get-ChildItem -Path ".\sources\Etats et requêtes" -Recurse -Filter "*.wde" | Sort-Object FullName
foreach ($wf in $wdeFiles) {
    $rel = $wf.FullName.Substring((Get-Location).Path.Length + 1)
    $bytes = [System.IO.File]::ReadAllBytes($wf.FullName)
    $strs = Extract-StringsFromBytes -bytes $bytes -minLen 4
    $uniq = $strs | Select-Object -Unique
    # Filter interesting tokens: titles, labels, REQ_, ETAT_, table/field names, SQL keywords
    $interesting = $uniq | Where-Object {
        $_ -match '(?i)(REQ_|ETAT_|FEN_|SELECT |FROM |WHERE |FACTURE|NOTE|POLICE|BIENVEN|BULLETIN|RESERV|CHAMBRE|CLIENT|ARRANG|TOTAL|TVA|TAXE|SOLDE|REGLEMENT|DATE|GROUPE|DETAIL|STANDARD|MAKARIM|HOTEL|MONTANT|TARIF|NUIT|ADULTE|ENFANT|PASSEPORT|CIN|NATIONAL|ADRESSE|SOCIETE|ICE|RC|PATENTE|LIB_|RUB_|ID_|F_|T_)' -or
        ($_.Length -ge 6 -and $_.Length -le 90 -and $_ -match '^[A-Za-zÀ-ÿ0-9 _\-\.\:/°''\(\)%]+$')
    } | Select-Object -First 120

    [void]$wdeOut.AppendLine("=== $rel ($($wf.Length) bytes, $($wf.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))) ===")
    foreach ($s in $interesting) {
        [void]$wdeOut.AppendLine("  $s")
    }
    [void]$wdeOut.AppendLine("")
}
[System.IO.File]::WriteAllText((Join-Path $outDir "wde_metadata.txt"), $wdeOut.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Extracted metadata from $($wdeFiles.Count) .wde files."

# 3. Inspect Flex PMS.wdl header/entries & WINDEV object names (FEN_, ETAT_, REQ_, etc.)
$wdlPath = ".\sources\Flex PMS 9\Flex PMS.wdl"
$wdlBytes = [System.IO.File]::ReadAllBytes($wdlPath)
Write-Output "Loaded Flex PMS.wdl ($($wdlBytes.Length) bytes)"

# Extract WINDEV object filenames and identifiers from ASCII and UTF-16LE
$wdlAscii = [System.Text.Encoding]::GetEncoding(1252).GetString($wdlBytes)
$wdlUtf16 = [System.Text.Encoding]::Unicode.GetString($wdlBytes)

$objRegex = '(?i)\b([A-Za-z0-9_]+\.(?:wdw|wde|wdr|wdg|wdc|wdi|wdk|wdt|wdm|sql|rpt))\b'
$m1 = [regex]::Matches($wdlAscii, $objRegex) | ForEach-Object { $_.Groups[1].Value }
$m2 = [regex]::Matches($wdlUtf16, $objRegex) | ForEach-Object { $_.Groups[1].Value }
$wdlFilesList = ($m1 + $m2) | Sort-Object -Unique

$identRegex = '\b((?:FEN|ETAT|REQ|PROC|COL|CL|C_|MOD|MENU|RPT)_[A-Za-z0-9_]{2,60})\b'
$i1 = [regex]::Matches($wdlAscii, $identRegex) | ForEach-Object { $_.Groups[1].Value }
$i2 = [regex]::Matches($wdlUtf16, $identRegex) | ForEach-Object { $_.Groups[1].Value }
$wdlIdents = ($i1 + $i2) | Sort-Object -Unique

[System.IO.File]::WriteAllLines((Join-Path $outDir "wdl_objects.txt"), $wdlFilesList, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllLines((Join-Path $outDir "wdl_identifiers.txt"), $wdlIdents, [System.Text.Encoding]::UTF8)
Write-Output "WDL objects found: $($wdlFilesList.Count), identifiers found: $($wdlIdents.Count)"

# 4. Extract strings from key .fic / .mmo config files (MODEL_IMPRESSION, sys_requetes, sys_explorer, sys_groupe, sys_services, GPU_Element, GPU_Cible, GPU_Groupe, sys_registre)
$ficTargets = @(
    ".\sources\Flex PMS 9\commun\configuration\sa\MODEL_IMPRESSION.fic",
    ".\sources\Flex PMS 9\commun\configuration\sa\sys_requetes.fic",
    ".\sources\Flex PMS 9\commun\configuration\sa\sys_requetes.mmo",
    ".\sources\Flex PMS 9\commun\configuration\sa\sys_param_req.fic",
    ".\sources\Flex PMS 9\commun\configuration\sa\sys_explorer.FIC",
    ".\sources\Flex PMS 9\commun\configuration\sa\sys_groupe.FIC",
    ".\sources\Flex PMS 9\commun\configuration\sa\sys_services.FIC",
    ".\sources\Flex PMS 9\commun\configuration\sa\sys_composants.FIC",
    ".\sources\Flex PMS 9\commun\configuration\sa\P_RACCOURCI.fic",
    ".\sources\Flex PMS 9\commun\GPU_Element.FIC",
    ".\sources\Flex PMS 9\commun\GPU_Cible.FIC",
    ".\sources\Flex PMS 9\commun\GPU_Groupe.FIC",
    ".\sources\Flex PMS 9\commun\GPU_Utilisateur.FIC",
    ".\sources\Flex PMS 9\FlexPMS.wdd",
    ".\sources\Flex PMS 9\FlexPMS.wda"
)

$ficOut = New-Object System.Text.StringBuilder
foreach ($ft in $ficTargets) {
    if (Test-Path $ft) {
        $b = [System.IO.File]::ReadAllBytes($ft)
        $s = Extract-StringsFromBytes -bytes $b -minLen 4 | Where-Object {
            $_.Length -le 200 -and $_ -match '[A-Za-zÀ-ÿ]{3,}'
        } | Select-Object -Unique
        [void]$ficOut.AppendLine("=== $ft ($($b.Length) bytes, $($s.Count) unique strings) ===")
        foreach ($line in $s) {
            [void]$ficOut.AppendLine("  $line")
        }
        [void]$ficOut.AppendLine("")
    }
}
[System.IO.File]::WriteAllText((Join-Path $outDir "fic_wdd_strings.txt"), $ficOut.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Extracted strings from FIC/WDD/WDA targets."
