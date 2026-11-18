$outDir = Join-Path (Get-Location) "scripts\out_windev"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Clean-Strings {
    param([byte[]]$bytes)
    $ascii = [System.Text.Encoding]::GetEncoding(1252).GetString($bytes)
    $utf16 = [System.Text.Encoding]::Unicode.GetString($bytes)
    # Match clean human-readable strings (letters, spaces, accents, punctuation, no garbage high bytes mixed randomly)
    $rx = '[A-Za-z0-9_À-ÿ][A-Za-z0-9_À-ÿ \-\.\:/\(\)''°&,@\+=\*%\[\]\{\}<>]{3,250}'
    $m1 = [regex]::Matches($ascii, $rx) | ForEach-Object { $_.Value.Trim() }
    $m2 = [regex]::Matches($utf16, $rx) | ForEach-Object { $_.Value.Trim() }
    $all = ($m1 + $m2) | Where-Object {
        # Filter out binary noise: must have at least 3 consecutive ASCII/French letters
        $_ -match '[A-Za-zÀ-ÿ]{3,}' -and $_ -notmatch '[Þßðþýÿ]{2,}'
    } | Select-Object -Unique
    return $all
}

# 1. Extract sys_registre, Lng, P_DOSSIER, P_SECURITE
$targets = @(
    ".\sources\Flex PMS 9\commun\configuration\sa\sys_registre.FIC",
    ".\sources\Flex PMS 9\commun\configuration\sa\sys_registre.mmo",
    ".\sources\Flex PMS 9\commun\configuration\sa\Lng.fic",
    ".\sources\Flex PMS 9\P_DOSSIER.FIC",
    ".\sources\Flex PMS 9\P_SECURITE.FIC",
    ".\sources\Flex PMS 9\P_SECURITEJNL.FIC"
)

$sb = New-Object System.Text.StringBuilder
foreach ($t in $targets) {
    if (Test-Path $t) {
        $b = [System.IO.File]::ReadAllBytes($t)
        $s = Clean-Strings -bytes $b
        [void]$sb.AppendLine("=== $t ($($b.Length) bytes, $($s.Count) strings) ===")
        foreach ($x in $s) { [void]$sb.AppendLine("  $x") }
        [void]$sb.AppendLine("")
    }
}
[System.IO.File]::WriteAllText((Join-Path $outDir "registre_and_config.txt"), $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Extracted registre_and_config.txt"

# 2. Check zlib / deflate decompression on WDE and WDD and WDL header
function Try-ZlibScan {
    param([string]$filePath, [int]$maxStreams = 50)
    $b = [System.IO.File]::ReadAllBytes($filePath)
    $found = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt ($b.Length - 6); $i++) {
        if ($b[$i] -eq 0x78 -and ($b[$i+1] -eq 0x9C -or $b[$i+1] -eq 0xDA -or $b[$i+1] -eq 0x01)) {
            try {
                $ms = New-Object System.IO.MemoryStream($b, $i + 2, $b.Length - $i - 2)
                $ds = New-Object System.IO.Compression.DeflateStream($ms, [System.IO.Compression.CompressionMode]::Decompress)
                $outMs = New-Object System.IO.MemoryStream
                $buf = New-Object byte[] 4096
                while (($read = $ds.Read($buf, 0, $buf.Length)) -gt 0) {
                    $outMs.Write($buf, 0, $read)
                    if ($outMs.Length -gt 2097152) { break }
                }
                $ds.Close(); $ms.Close()
                if ($outMs.Length -gt 32) {
                    $dec = $outMs.ToArray()
                    $strs = Clean-Strings -bytes $dec
                    if ($strs.Count -gt 0) {
                        $found.Add("--- Stream @ offset $i (decompressed $($dec.Length) bytes, $($strs.Count) strings) ---")
                        foreach ($st in ($strs | Select-Object -First 80)) {
                            $found.Add("  $st")
                        }
                    }
                    if ($found.Count -gt $maxStreams * 20) { break }
                }
            } catch {
                # Not a valid deflate stream at this offset
            }
        }
    }
    return $found
}

# Test zlib scan on FlexPMS.wdd and a few .wde files
$testFiles = @(
    ".\sources\Flex PMS 9\FlexPMS.wdd",
    ".\sources\Etats et requêtes\ETAT_FACTURE.wde",
    ".\sources\Etats et requêtes\Fiche_police.wde",
    ".\sources\Etats et requêtes\Reservation\Confirmation_Reservation.wde",
    ".\sources\Etats et requêtes\Reservation\Fiche_de_bienvenue_mAKARIM.wde"
)
$zsb = New-Object System.Text.StringBuilder
foreach ($tf in $testFiles) {
    if (Test-Path $tf) {
        $res = Try-ZlibScan -filePath $tf -maxStreams 20
        [void]$zsb.AppendLine("=== ZLIB SCAN: $tf (lines: $($res.Count)) ===")
        foreach ($l in $res) { [void]$zsb.AppendLine($l) }
        [void]$zsb.AppendLine("")
    }
}
[System.IO.File]::WriteAllText((Join-Path $outDir "zlib_test.txt"), $zsb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Completed zlib_test.txt"

# 3. Dump first 512 bytes hex+ascii of Flex PMS.wdl and ETAT_FACTURE.wde to inspect WINDEV header structure
$wdlBytes = [System.IO.File]::ReadAllBytes(".\sources\Flex PMS 9\Flex PMS.wdl")
$hdrHex = ($wdlBytes[0..255] | ForEach-Object { $_.ToString("X2") }) -join " "
$hdrAsc = ([System.Text.Encoding]::ASCII.GetString($wdlBytes[0..255]) -replace '[^\x20-\x7E]', '.')
Write-Output "WDL HEADER ASCII: $hdrAsc"
# Also search for all .wdw / .wde / FEN_ / F_ / W_ / WIN_ / E_ patterns in WDL
$wdlAscii = [System.Text.Encoding]::GetEncoding(1252).GetString($wdlBytes)
$allWins = [regex]::Matches($wdlAscii, '\b((?:FEN|WIN|FRM|F|W|E|G|P|M)_[A-Za-z0-9_]{3,50})\b') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
[System.IO.File]::WriteAllLines((Join-Path $outDir "wdl_all_prefixes.txt"), $allWins, [System.Text.Encoding]::UTF8)
Write-Output "Found $($allWins.Count) prefixed identifiers in WDL."
