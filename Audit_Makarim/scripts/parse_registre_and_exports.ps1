# Clean up any orphaned hidden Excel process from prior run if any
Get-Process EXCEL -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue

Add-Type -AssemblyName System.Windows.Forms

$outDir = Join-Path (Get-Location) "scripts\out_exports"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 1. Clean RTF extraction using RichTextBox
$rtfFiles = Get-ChildItem -Path ".\sources\Flex PMS 9" -Filter "*.rtf" | Sort-Object LastWriteTime -Descending
$rtfSb = New-Object System.Text.StringBuilder
$rtb = New-Object System.Windows.Forms.RichTextBox
foreach ($rf in $rtfFiles) {
    [void]$rtfSb.AppendLine("=== RTF: $($rf.Name) ($($rf.Length) bytes, $($rf.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))) ===")
    try {
        $rtb.LoadFile($rf.FullName, [System.Windows.Forms.RichTextBoxStreamType]::RichText)
        $txt = $rtb.Text
        $lines = ($txt -split "`r?`n") | ForEach-Object { ($_ -replace '\s+', ' ').Trim() } | Where-Object { $_.Length -gt 0 }
        [void]$rtfSb.AppendLine("  Total non-empty lines: $($lines.Count)")
        foreach ($l in ($lines | Select-Object -First 40)) {
            [void]$rtfSb.AppendLine("  $l")
        }
        if ($lines.Count -gt 40) {
            [void]$rtfSb.AppendLine("  ... [tail] ...")
            foreach ($l in ($lines | Select-Object -Last 10)) {
                [void]$rtfSb.AppendLine("  $l")
            }
        }
    } catch {
        [void]$rtfSb.AppendLine("  ERROR: $($_.Exception.Message)")
    }
    [void]$rtfSb.AppendLine("")
}
$rtb.Dispose()
[System.IO.File]::WriteAllText((Join-Path $outDir "rtf_clean.txt"), $rtfSb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Extracted clean text from $($rtfFiles.Count) RTF files."

# 2. Clean XLS extraction using OLEDB (Jet/ACE) or pure BIFF8 SST/Label parser (zero Excel COM hang!)
$xlsFiles = @(Get-ChildItem -Path ".\sources\Flex PMS 9" -Filter "*.xls") + @(Get-ChildItem -Path ".\sources\Etats et requêtes" -Recurse -Filter "*.xls")
$xlsFiles = $xlsFiles | Sort-Object LastWriteTime -Descending

# Check available OLEDB providers
$oledbProvider = $null
try {
    $enum = [System.Data.OleDb.OleDbEnumerator]::GetRootEnumerator()
    while ($enum.Read()) {
        $name = $enum.GetValue(0).ToString()
        if ($name -like "Microsoft.ACE.OLEDB.*" -or $name -like "Microsoft.Jet.OLEDB.*") {
            Write-Output "Found OLEDB provider: $name"
            if (-not $oledbProvider -or $name -like "Microsoft.ACE.OLEDB.12*") { $oledbProvider = $name }
        }
    }
} catch {}

function Parse-Biff8Strings {
    param([byte[]]$bytes)
    # Extract OLE2 Workbook/Book stream or scan BIFF8 records directly
    # First check if it's plain HTML/XML/TSV disguised as .xls (common in exports)
    $head = [System.Text.Encoding]::ASCII.GetString($bytes[0..([Math]::Min(64, $bytes.Length-1))])
    if ($head -match '<html|<table|<\?xml') {
        return @("[HTML/XML format] " + ([System.Text.Encoding]::UTF8.GetString($bytes) -replace '<[^>]+>', ' ' -replace '\s+', ' ').Substring(0, [Math]::Min(600, $bytes.Length)))
    }
    # Scan for BIFF8 SST (0x00FC) or LABEL (0x0204) / LABELSST strings + readable UTF-16/CP1252 tokens
    $out = New-Object System.Collections.Generic.List[string]
    # Also scan clean ASCII & UTF-16LE tokens excluding OLE boilerplate
    $ascii = [System.Text.Encoding]::GetEncoding(1252).GetString($bytes)
    $utf16 = [System.Text.Encoding]::Unicode.GetString($bytes)
    $rx = '[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 _\-\./°:%\(\)''€]{2,70}'
    $m1 = [regex]::Matches($ascii, $rx) | ForEach-Object { $_.Value.Trim() }
    $m2 = [regex]::Matches($utf16, $rx) | ForEach-Object { $_.Value.Trim() }
    $combined = ($m1 + $m2) | Where-Object {
        $_ -match '[A-Za-zÀ-ÿ]{2,}' -and
        $_ -notmatch '^(Root Entry|Workbook|SummaryInformation|DocumentSummaryInformation|Arial|Calibri|Tahoma|Verdana|Times New Roman|Microsoft|Standard|Normal|Feuil|Sheet|General|CompObj|Biff|Windev|PC SOFT|Table\d*)' -and
        $_ -notmatch '[Þßðþýÿ]'
    } | Select-Object -Unique -First 55
    return $combined
}

$xlsSb = New-Object System.Text.StringBuilder
foreach ($xf in $xlsFiles) {
    $rel = $xf.FullName.Substring((Get-Location).Path.Length + 1)
    [void]$xlsSb.AppendLine("=== XLS: $rel ($($xf.Length) bytes, $($xf.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))) ===")
    $parsedViaOleDb = $false
    if ($oledbProvider) {
        try {
            $connStr = "Provider=$oledbProvider;Data Source=`"$($xf.FullName)`";Extended Properties=`"Excel 8.0;HDR=NO;IMEX=1`";"
            $conn = New-Object System.Data.OleDb.OleDbConnection($connStr)
            $conn.Open()
            $schema = $conn.GetOleDbSchemaTable([System.Data.OleDb.OleDbSchemaGuid]::Tables, $null)
            foreach ($row in $schema.Rows) {
                $tname = $row["TABLE_NAME"].ToString()
                if ($tname -notlike "*$") { continue }
                $cmd = $conn.CreateCommand()
                $cmd.CommandText = "SELECT * FROM [$tname]"
                $da = New-Object System.Data.OleDb.OleDbDataAdapter($cmd)
                $dt = New-Object System.Data.DataTable
                [void]$da.Fill($dt)
                [void]$xlsSb.AppendLine("  Sheet: $tname ($($dt.Rows.Count) rows x $($dt.Columns.Count) cols)")
                $maxR = [Math]::Min($dt.Rows.Count, 5)
                for ($r = 0; $r -lt $maxR; $r++) {
                    $vals = @()
                    for ($c = 0; $c -lt [Math]::Min($dt.Columns.Count, 28); $c++) {
                        $v = $dt.Rows[$r][$c].ToString().Trim() -replace "[\r\n]+", " "
                        $vals += $v
                    }
                    if (($vals -join "").Trim().Length -gt 0) {
                        [void]$xlsSb.AppendLine("    R$($r+1): " + ($vals -join " | "))
                    }
                }
            }
            $conn.Close()
            $parsedViaOleDb = $true
        } catch {
            # Fallback to binary scanner
        }
    }
    if (-not $parsedViaOleDb) {
        $b = [System.IO.File]::ReadAllBytes($xf.FullName)
        $strs = Parse-Biff8Strings -bytes $b
        [void]$xlsSb.AppendLine("  [Binary Scan] " + ($strs -join " | "))
    }
    [void]$xlsSb.AppendLine("")
}
[System.IO.File]::WriteAllText((Join-Path $outDir "xls_clean.txt"), $xlsSb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Analyzed $($xlsFiles.Count) XLS files -> xls_clean.txt"

# 3. Also extract ordered records from sys_registre.FIC + sys_registre.mmo to map EVERY menu label to its FEN_* command!
$regFic = [System.IO.File]::ReadAllBytes(".\sources\Flex PMS 9\commun\configuration\sa\sys_registre.FIC")
$regMmo = [System.IO.File]::ReadAllBytes(".\sources\Flex PMS 9\commun\configuration\sa\sys_registre.mmo")

# HFSQL .FIC files store fixed-length records after header; let's locate records containing 'Module' or 'Administration,' etc.
$mmoAsc = [System.Text.Encoding]::GetEncoding(1252).GetString($regMmo)
$cmdMatches = [regex]::Matches($mmoAsc, '(?i)(Ouvre(?:Fille)?\([^\)]+\)|HSupprimeTout\([^\)]+\)[^\x00]{0,60}|FEN_[A-Za-z0-9_]+)') | ForEach-Object { $_.Value.Trim() } | Select-Object -Unique
[System.IO.File]::WriteAllLines((Join-Path (Get-Location) "scripts\out_windev\registre_commands.txt"), $cmdMatches, [System.Text.Encoding]::UTF8)
Write-Output "Extracted $($cmdMatches.Count) unique WLanguage commands/FENs from sys_registre.mmo"
