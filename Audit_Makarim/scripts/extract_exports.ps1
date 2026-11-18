$outDir = Join-Path (Get-Location) "scripts\out_exports"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 1. Inspect RTF files (strip RTF control words to get readable headers/structure)
$rtfFiles = Get-ChildItem -Path ".\sources\Flex PMS 9" -Filter "*.rtf" | Sort-Object LastWriteTime -Descending
$rtfSb = New-Object System.Text.StringBuilder
foreach ($rf in $rtfFiles) {
    $raw = [System.IO.File]::ReadAllText($rf.FullName, [System.Text.Encoding]::GetEncoding(1252))
    # Remove large embedded binary/hex picture blocks {\pict ...}
    $clean = [regex]::Replace($raw, '\{\\pict[^{}]*(\{[^{}]*\}[^{}]*)*\}', ' [IMAGE] ')
    $clean = [regex]::Replace($clean, '\\''([0-9a-fA-F]{2})', { param($m) [char][Convert]::ToInt32($m.Groups[1].Value, 16) })
    $clean = [regex]::Replace($clean, '\\(par|row|line)\b', "`n")
    $clean = [regex]::Replace($clean, '\\cell\b', " | ")
    $clean = [regex]::Replace($clean, '\\[a-zA-Z]+-?\d* ?', '')
    $clean = $clean -replace '[\{\}]', ''
    $lines = ($clean -split "`r?`n") | ForEach-Object { ($_ -replace '\s+', ' ').Trim() } | Where-Object { $_.Length -ge 2 -and $_ -notmatch '^(Arial|Times New Roman|Calibri|Tahoma|Verdana|Symbol|Wingdings|MS Sans Serif|;)+$' }
    $preview = ($lines | Select-Object -First 45) -join "`n"
    [void]$rtfSb.AppendLine("=== RTF: $($rf.Name) ($($rf.Length) bytes, $($rf.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))) ===")
    [void]$rtfSb.AppendLine($preview)
    [void]$rtfSb.AppendLine("")
}
[System.IO.File]::WriteAllText((Join-Path $outDir "rtf_summary.txt"), $rtfSb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Analyzed $($rtfFiles.Count) RTF files."

# 2. Inspect XLS files (extract readable strings/column headers safely without requiring Excel)
# Check first if Excel COM or OLEDB is available, otherwise extract BIFF8 SST/labels via binary scan
$xlsFiles = @(Get-ChildItem -Path ".\sources\Flex PMS 9" -Filter "*.xls") + @(Get-ChildItem -Path ".\sources\Etats et requêtes" -Recurse -Filter "*.xls")
$xlsFiles = $xlsFiles | Sort-Object LastWriteTime -Descending

$xlsSb = New-Object System.Text.StringBuilder
$useExcel = $false
try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $useExcel = $true
    Write-Output "Excel COM available!"
} catch {
    Write-Output "Excel COM not available; using binary/BIFF string scanner."
}

if ($useExcel) {
    try {
        foreach ($xf in $xlsFiles) {
            $rel = $xf.FullName.Substring((Get-Location).Path.Length + 1)
            [void]$xlsSb.AppendLine("=== XLS: $rel ($($xf.Length) bytes, $($xf.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))) ===")
            try {
                $wb = $excel.Workbooks.Open($xf.FullName, 0, $true)
                foreach ($ws in $wb.Worksheets) {
                    $used = $ws.UsedRange
                    $rows = $used.Rows.Count
                    $cols = $used.Columns.Count
                    [void]$xlsSb.AppendLine("  Sheet: $($ws.Name) ($rows rows x $cols cols)")
                    $maxR = [Math]::Min($rows, 6)
                    $maxC = [Math]::Min($cols, 25)
                    for ($r = 1; $r -le $maxR; $r++) {
                        $vals = @()
                        for ($c = 1; $c -le $maxC; $c++) {
                            $v = $ws.Cells.Item($r, $c).Text
                            if ($v -ne $null) { $v = ($v -replace "[\r\n]+", " ").Trim() }
                            $vals += $v
                        }
                        if (($vals -join "").Trim().Length -gt 0) {
                            [void]$xlsSb.AppendLine("    R${r}: " + ($vals -join " | "))
                        }
                    }
                }
                $wb.Close($false)
            } catch {
                [void]$xlsSb.AppendLine("  ERROR reading via Excel: $($_.Exception.Message)")
            }
            [void]$xlsSb.AppendLine("")
        }
    } finally {
        $excel.Quit()
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    }
} else {
    foreach ($xf in $xlsFiles) {
        $rel = $xf.FullName.Substring((Get-Location).Path.Length + 1)
        $bytes = [System.IO.File]::ReadAllBytes($xf.FullName)
        $ascii = [System.Text.Encoding]::GetEncoding(1252).GetString($bytes)
        $utf16 = [System.Text.Encoding]::Unicode.GetString($bytes)
        $m1 = [regex]::Matches($ascii, '[A-Za-zÀ-ÿ0-9_\-\./°% ]{4,60}') | ForEach-Object { $_.Value.Trim() }
        $m2 = [regex]::Matches($utf16, '[A-Za-zÀ-ÿ0-9_\-\./°% ]{4,60}') | ForEach-Object { $_.Value.Trim() }
        $strs = ($m1 + $m2) | Where-Object { $_ -match '[A-Za-zÀ-ÿ]{3,}' -and $_ -notmatch '^(Root Entry|Workbook|SummaryInformation|DocumentSummaryInformation|Arial|Calibri|Tahoma|Microsoft)' } | Select-Object -Unique -First 60
        [void]$xlsSb.AppendLine("=== XLS: $rel ($($xf.Length) bytes, $($xf.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))) ===")
        [void]$xlsSb.AppendLine("  Strings: " + ($strs -join " | "))
        [void]$xlsSb.AppendLine("")
    }
}
[System.IO.File]::WriteAllText((Join-Path $outDir "xls_summary.txt"), $xlsSb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Analyzed $($xlsFiles.Count) XLS files."
