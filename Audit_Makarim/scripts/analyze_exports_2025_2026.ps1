$outPath = Join-Path (Get-Location) "scripts\out_exports\deep_2025_2026.txt"
$sb = New-Object System.Text.StringBuilder

$files = Get-ChildItem -Path ".\sources\Flex PMS 9" -File | Where-Object {
    $_.LastWriteTime.Year -ge 2025 -and $_.Extension -in @(".xls", ".rtf", ".pdf")
} | Sort-Object LastWriteTime -Descending

[void]$sb.AppendLine("TOTAL 2025-2026 EXPORT FILES: $($files.Count)")
foreach ($f in $files) {
    [void]$sb.AppendLine("  - $($f.Name) | $($f.Extension) | $($f.Length) B | $($f.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))")
}
[void]$sb.AppendLine("")

$xls2526 = $files | Where-Object { $_.Extension -eq ".xls" }

$provider = "Microsoft.ACE.OLEDB.12.0"

foreach ($xf in $xls2526) {
    [void]$sb.AppendLine("======================================================================")
    [void]$sb.AppendLine("FILE: $($xf.Name) | $($xf.Length) B | Modif: $($xf.LastWriteTime.ToString('dd/MM/yyyy HH:mm'))")
    try {
        $connStr = "Provider=$provider;Data Source=`"$($xf.FullName)`";Extended Properties=`"Excel 8.0;HDR=NO;IMEX=1`";"
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

            [void]$sb.AppendLine("  Sheet: $tname | Rows: $($dt.Rows.Count) | Cols: $($dt.Columns.Count)")
            # Header row(s)
            $headers = @()
            for ($c = 0; $c -lt $dt.Columns.Count; $c++) {
                $h = $dt.Rows[0][$c].ToString().Trim() -replace "[\r\n]+", " "
                $headers += "C$($c+1):$h"
            }
            [void]$sb.AppendLine("  Headers: " + ($headers -join " | "))

            # Inspect last 4 rows (to capture totals / summary lines)
            [void]$sb.AppendLine("  Last 4 rows:")
            $startTail = [Math]::Max(1, $dt.Rows.Count - 4)
            for ($r = $startTail; $r -lt $dt.Rows.Count; $r++) {
                $vals = @()
                for ($c = 0; $c -lt $dt.Columns.Count; $c++) {
                    $v = $dt.Rows[$r][$c].ToString().Trim() -replace "[\r\n]+", " "
                    if ($v.Length -gt 0) { $vals += "C$($c+1)=$v" }
                }
                [void]$sb.AppendLine("    R$($r+1): " + ($vals -join " | "))
            }

            # Column profiling for key columns
            if ($dt.Columns.Count -ge 20) {
                # 27-col raw REQ_DOC
                $pieces = @(); $comptes = @(); $etats = @(); $facPerm = @(); $solder = @(); $folios = @(); $createurs = @(); $fermer = @(); $facturer = @(); $dates = @(); $nums = @(); $years = @()
                $mathCheck = @()
                for ($r = 1; $r -lt $dt.Rows.Count; $r++) {
                    $num = $dt.Rows[$r][0].ToString().Trim()
                    $yr = $dt.Rows[$r][1].ToString().Trim()
                    $pc = $dt.Rows[$r][2].ToString().Trim()
                    $dtVal = $dt.Rows[$r][3].ToString().Trim()
                    if ($pc -eq "" -and $num -eq "") { continue }
                    if ($num -match '^\d+$') { $nums += [int]$num }
                    if ($yr) { $years += $yr }
                    if ($pc) { $pieces += $pc }
                    if ($dtVal) { $dates += $dtVal }
                    $etats += $dt.Rows[$r][4].ToString().Trim()
                    $comptes += $dt.Rows[$r][8].ToString().Trim()
                    $facPerm += $dt.Rows[$r][9].ToString().Trim()
                    $solder += $dt.Rows[$r][10].ToString().Trim()
                    $folios += $dt.Rows[$r][19].ToString().Trim()
                    $createurs += $dt.Rows[$r][20].ToString().Trim()
                    if ($dt.Columns.Count -gt 24) { $fermer += $dt.Rows[$r][24].ToString().Trim() }
                    if ($dt.Columns.Count -gt 25) { $facturer += $dt.Rows[$r][25].ToString().Trim() }

                    # Sample math check on first 3 rows
                    if ($r -le 3) {
                        $ht = $dt.Rows[$r][5].ToString().Trim()
                        $tva = $dt.Rows[$r][6].ToString().Trim()
                        $ttc = $dt.Rows[$r][7].ToString().Trim()
                        $pay = $dt.Rows[$r][11].ToString().Trim()
                        $tax = $dt.Rows[$r][12].ToString().Trim()
                        $ext = $dt.Rows[$r][13].ToString().Trim()
                        $heb = $dt.Rows[$r][14].ToString().Trim()
                        $mathCheck += "R$($r+1): HT=$ht | TVA=$tva | TTC=$ttc | Pay=$pay | Tax=$tax | Ext=$ext | Heb=$heb"
                    }
                }
                [void]$sb.AppendLine("  Profile (27-col REQ_DOC):")
                if ($nums.Count -gt 0) {
                    $minN = ($nums | Measure-Object -Minimum).Minimum
                    $maxN = ($nums | Measure-Object -Maximum).Maximum
                    [void]$sb.AppendLine("    Doc count: $($nums.Count) | Num range: $minN..$maxN | Suffixes: $((($years | Select-Object -Unique) -join ', '))")
                }
                [void]$sb.AppendLine("    Pieces: $((($pieces | Select-Object -Unique) -join ', '))")
                [void]$sb.AppendLine("    Dates (first/last): $($dates | Select-Object -First 1) .. $($dates | Select-Object -Last 1)")
                [void]$sb.AppendLine("    Comptes ($((($comptes | Where-Object {$_} | Select-Object -Unique).Count))): $((($comptes | Where-Object {$_} | Select-Object -Unique | Select-Object -First 15) -join ', '))")
                [void]$sb.AppendLine("    Etat: $((($etats | Select-Object -Unique) -join ',')) | FacPerm: $((($facPerm | Select-Object -Unique) -join ',')) | Solder: $((($solder | Select-Object -Unique) -join ',')) | Folio: $((($folios | Select-Object -Unique) -join ',')) | Fermer: $((($fermer | Select-Object -Unique) -join ',')) | Facturer: $((($facturer | Select-Object -Unique) -join ','))")
                [void]$sb.AppendLine("    Createurs: $((($createurs | Where-Object {$_} | Select-Object -Unique) -join ', '))")
                foreach ($mc in $mathCheck) { [void]$sb.AppendLine("    Math $mc") }
            }
            elseif ($dt.Columns.Count -ge 9 -and $dt.Columns.Count -le 15) {
                # 10-col accounting recap
                $modes = @(); $iceCount = 0; $totalRows = 0; $nums = @(); $years = @(); $dates = @()
                for ($r = 1; $r -lt $dt.Rows.Count; $r++) {
                    $num = $dt.Rows[$r][0].ToString().Trim()
                    if ($num -match '^\d+$') {
                        $totalRows++
                        $nums += [int]$num
                        $years += $dt.Rows[$r][1].ToString().Trim()
                        $dates += $dt.Rows[$r][3].ToString().Trim()
                        $ice = $dt.Rows[$r][8].ToString().Trim()
                        if ($ice.Length -gt 0) { $iceCount++ }
                        if ($dt.Columns.Count -gt 9) {
                            $m = $dt.Rows[$r][9].ToString().Trim()
                            if ($m.Length -gt 0) { $modes += $m }
                        }
                    }
                }
                [void]$sb.AppendLine("  Profile (Accounting Recap):")
                if ($nums.Count -gt 0) {
                    $minN = ($nums | Measure-Object -Minimum).Minimum
                    $maxN = ($nums | Measure-Object -Maximum).Maximum
                    [void]$sb.AppendLine("    Invoice rows: $totalRows | Num range: $minN..$maxN | Suffixes: $((($years | Select-Object -Unique) -join ', ')) | ICE filled: $iceCount / $totalRows")
                }
                $modeGroups = $modes | Group-Object | Sort-Object Count -Descending | ForEach-Object { "$($_.Name)($($_.Count))" }
                [void]$sb.AppendLine("    Modes de paiement: $($modeGroups -join ', ')")
            }
            elseif ($dt.Columns.Count -eq 7) {
                # Occupancy stats
                $dates = @()
                for ($r = 1; $r -lt $dt.Rows.Count; $r++) {
                    $d = $dt.Rows[$r][0].ToString().Trim()
                    if ($d) { $dates += $d }
                }
                [void]$sb.AppendLine("  Profile (Occupancy): $($dates.Count) rows | First: $($dates | Select-Object -First 1) | Last: $($dates | Select-Object -Last 1)")
            }
        }
        $conn.Close()
    } catch {
        [void]$sb.AppendLine("  ERROR: $($_.Exception.Message)")
    }
    [void]$sb.AppendLine("")
}

[System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Wrote deep analysis of $($xls2526.Count) XLS files to $outPath"
