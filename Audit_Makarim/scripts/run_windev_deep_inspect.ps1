$outDir = Join-Path (Get-Location) "scripts\out_deep"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 1. Parse Flex PMS.REP for all tables and paths
$repLines = Get-Content ".\sources\Flex PMS 9\Flex PMS.REP"
$tablesFromRep = New-Object System.Collections.Generic.List[string]
foreach ($l in $repLines) {
    if ($l -match '^[^;].*=' -or $l -match '\.fic\b' -or $l -match '\[.*\]') {
        $tablesFromRep.Add($l)
    }
}
[System.IO.File]::WriteAllLines((Join-Path $outDir "rep_parsed.txt"), $tablesFromRep, [System.Text.Encoding]::UTF8)
Write-Output "REP lines parsed: $($tablesFromRep.Count)"

# 2. Deep scan of Flex PMS.wdl (19.67 MB) for:
#    - ALL FEN_ / ETAT_ / REQ_ (case-insensitive) in ASCII and UTF-16LE
#    - ALL embedded SQL queries (SELECT ... FROM ...) in ASCII and UTF-16LE
#    - ALL table names (F_*, P_*, T_*, COM_*, sys_*, GPU_*, etc.) and Table.Column references!
$wdlBytes = [System.IO.File]::ReadAllBytes(".\sources\Flex PMS 9\Flex PMS.wdl")
$wdlAsc = [System.Text.Encoding]::GetEncoding(1252).GetString($wdlBytes)
$wdlU16 = [System.Text.Encoding]::Unicode.GetString($wdlBytes)

# 2a. Case-insensitive FEN_, ETAT_, REQ_, COL_, PROC_, CL_
$rxObj = '(?i)\b((?:FEN|ETAT|REQ|COL|PROC|CL|MENU|COM)_[A-Za-z0-9_À-ÿ]{2,65})\b'
$o1 = [regex]::Matches($wdlAsc, $rxObj) | ForEach-Object { $_.Groups[1].Value }
$o2 = [regex]::Matches($wdlU16, $rxObj) | ForEach-Object { $_.Groups[1].Value }
$allObjs = ($o1 + $o2) | Sort-Object -Unique
[System.IO.File]::WriteAllLines((Join-Path $outDir "wdl_all_objects.txt"), $allObjs, [System.Text.Encoding]::UTF8)
Write-Output "WDL objects (FEN/ETAT/REQ/COL/COM...): $($allObjs.Count)"

# 2b. Table.Column references (e.g. F_RSV.IDGESTHOT, F_RML.NUM_CHAMBRE, P_SERVICES.CODE_SRV, etc.)
$rxTabCol = '\b([A-Za-zÀ-ÿ][A-Za-z0-9_À-ÿ]{1,35})\.([A-Za-zÀ-ÿ][A-Za-z0-9_À-ÿ]{1,40})\b'
$tc1 = [regex]::Matches($wdlAsc, $rxTabCol) | ForEach-Object { "$($_.Groups[1].Value).$($_.Groups[2].Value)" }
$tc2 = [regex]::Matches($wdlU16, $rxTabCol) | ForEach-Object { "$($_.Groups[1].Value).$($_.Groups[2].Value)" }
$allTabCol = ($tc1 + $tc2) | Where-Object {
    $_ -notmatch '(?i)\.(dll|exe|wdl|wde|wdw|wdr|wdd|wda|fic|ndx|mmo|ini|xml|xsl|jpg|jpeg|png|gif|bmp|ico|pdf|rtf|xls|xlsx|doc|docx|txt|sql|com|ma|fr|net|org|html|htm|css|js|cur|ani|wav|mp3|zip|cab|msi|ocx|tlb|lib|h|cpp|c|cs|vb|java|py|rb|php|asp|aspx|jsp|cfm|cgi|pl|sh|bat|cmd|ps1|vbs|reg|inf|sys|drv|vxd|386|fon|ttf|otf|pfm|pfb|afm|eot|woff|svg|eps|ai|psd|xcf|tif|tiff|tga|pcx|ppm|pgm|pbm|pnm|webp|avif|heic|heif|ico|icns|raw|cr2|nef|orf|sr2|arw|dng|rw2|pef|raf|3fr|fff|iiq|k25|kdc|mrw|nrw|ptx|pxn|r3d|rwl|rwz|srf|x3f)$' -and
    $_ -notmatch '^[0-9]' -and
    $_ -notmatch '(?i)^(System|Microsoft|Windows|WinDev|PCSoft|WD|HF|SQL|OLE|ActiveX|COM|HTTP|HTTPS|FTP|SMTP|POP3|IMAP|LDAP|XML|JSON|HTML|CSS|JS|DOM|UI|GUI|API|SDK|IDE|OS|CPU|GPU|RAM|ROM|BIOS|UEFI|PCI|USB|TCP|UDP|IP|DNS|DHCP|ARP|ICMP|MAC|VLAN|VPN|SSL|TLS|SSH|RDP|VNC|SMB|CIFS|NFS|AFP|WebDAV|REST|SOAP|RPC|gRPC|GraphQL|OAuth|JWT|SAML|OIDC|RBAC|ABAC|ACL|MFA|2FA|SSO|PKI|CA|CSR|CRL|OCSP|HSM|TPM|KMS|AES|RSA|ECDSA|SHA|MD5|HMAC|PBKDF2|Bcrypt|Scrypt|Argon2)\.'
} | Sort-Object -Unique
[System.IO.File]::WriteAllLines((Join-Path $outDir "wdl_table_columns.txt"), $allTabCol, [System.Text.Encoding]::UTF8)
Write-Output "WDL Table.Column refs: $($allTabCol.Count)"

# 2c. Embedded SQL snippets in WDL (SELECT ... FROM ..., INSERT INTO ..., UPDATE ... SET ..., DELETE FROM ...)
$rxSql = '(?is)(?:SELECT\s+[^\x00]{10,1200}?\s+FROM\s+[^\x00]{3,600}|INSERT\s+INTO\s+[^\x00]{5,400}|UPDATE\s+[A-Za-z0-9_]+\s+SET\s+[^\x00]{5,400}|DELETE\s+FROM\s+[^\x00]{3,300})'
$s1 = [regex]::Matches($wdlAsc, $rxSql) | ForEach-Object { ($_.Value -replace '[\r\n\t]+', ' ' -replace '[^\x20-\x7E\xC0-\xFF]', ' ' -replace '\s+', ' ').Trim() }
$s2 = [regex]::Matches($wdlU16, $rxSql) | ForEach-Object { ($_.Value -replace '[\r\n\t]+', ' ' -replace '[^\x20-\x7E\xC0-\xFF]', ' ' -replace '\s+', ' ').Trim() }
$allSql = ($s1 + $s2) | Where-Object { $_.Length -ge 18 -and $_ -match '(?i)\b(FROM|INTO|SET)\s+[A-Za-z_]' } | Sort-Object -Unique
[System.IO.File]::WriteAllLines((Join-Path $outDir "wdl_embedded_sql.txt"), $allSql, [System.Text.Encoding]::UTF8)
Write-Output "WDL embedded SQL snippets: $($allSql.Count)"

# 3. Inspect COM_TICKET_TO_PMS.fic, COM_CHAMBRE_DISPO.fic, tmp_Planning.fic, Journal*.FIC, FlexPMS.wdd, FlexPMS.wda
$binTargets = @(
    ".\sources\Flex PMS 9\COM_TICKET_TO_PMS.fic",
    ".\sources\Flex PMS 9\COM_TICKET_TO_PMS.ndx",
    ".\sources\Flex PMS 9\COM_CHAMBRE_DISPO.fic",
    ".\sources\Flex PMS 9\COM_CHAMBRE_DISPO.ndx",
    ".\sources\Flex PMS 9\tempo\tmp_Planning.fic",
    ".\sources\Flex PMS 9\JournalIdentification.FIC",
    ".\sources\Flex PMS 9\JournalOperation.FIC",
    ".\sources\Flex PMS 9\FlexPMS.wdd",
    ".\sources\Flex PMS 9\FlexPMS.wda",
    ".\sources\Flex PMS 9\backup\FlexPMS.wdd"
)
$bsb = New-Object System.Text.StringBuilder
foreach ($bt in $binTargets) {
    if (Test-Path $bt) {
        $b = [System.IO.File]::ReadAllBytes($bt)
        $a = [System.Text.Encoding]::GetEncoding(1252).GetString($b)
        $u = [System.Text.Encoding]::Unicode.GetString($b)
        $rx = '[A-Za-z0-9_À-ÿ][A-Za-z0-9_À-ÿ \-\.\:/\(\)''°,@\+]{3,120}'
        $m1 = [regex]::Matches($a, $rx) | ForEach-Object { $_.Value.Trim() }
        $m2 = [regex]::Matches($u, $rx) | ForEach-Object { $_.Value.Trim() }
        $clean = ($m1 + $m2) | Where-Object { $_ -match '[A-Za-zÀ-ÿ]{3,}' -and $_ -notmatch '[Þßðþýÿ]' } | Select-Object -Unique
        [void]$bsb.AppendLine("=== $bt ($($b.Length) B, $($clean.Count) clean strings) ===")
        foreach ($x in ($clean | Select-Object -First 150)) {
            [void]$bsb.AppendLine("  $x")
        }
        [void]$bsb.AppendLine("")
    }
}
[System.IO.File]::WriteAllText((Join-Path $outDir "bin_targets_strings.txt"), $bsb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Wrote bin_targets_strings.txt"
