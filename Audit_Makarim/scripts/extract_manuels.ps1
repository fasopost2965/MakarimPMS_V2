Add-Type -AssemblyName System.IO.Compression.FileSystem

$srcDir = Join-Path (Get-Location) "sources\Manuel de formation"
$outDir = Join-Path (Get-Location) "scripts\out_manuels"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$files = Get-ChildItem -Path $srcDir -Filter "*.docx" | Sort-Object Name

foreach ($f in $files) {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($f.FullName)
    try {
        $entry = $zip.GetEntry("word/document.xml")
        $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
        $xmlContent = $reader.ReadToEnd()
        $reader.Close()

        [xml]$xml = $xmlContent
        $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
        $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

        $sb = New-Object System.Text.StringBuilder
        [void]$sb.AppendLine("=== FILE: $($f.Name) ($([math]::Round($f.Length/1KB,1)) KB) ===")

        $body = $xml.SelectSingleNode("//w:body", $ns)
        foreach ($node in $body.ChildNodes) {
            if ($node.LocalName -eq "p") {
                $pStyleNode = $node.SelectSingleNode("w:pPr/w:pStyle", $ns)
                $style = if ($pStyleNode) { $pStyleNode.GetAttribute("val", "http://schemas.openxmlformats.org/wordprocessingml/2006/main") } else { "" }
                $texts = $node.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.'#text' }
                $line = ($texts -join "").Trim()
                if ($line.Length -gt 0) {
                    if ($style) {
                        [void]$sb.AppendLine("[$style] $line")
                    } else {
                        [void]$sb.AppendLine($line)
                    }
                }
            }
            elseif ($node.LocalName -eq "tbl") {
                [void]$sb.AppendLine("--- TABLE ---")
                $rows = $node.SelectNodes("w:tr", $ns)
                foreach ($row in $rows) {
                    $cells = $row.SelectNodes("w:tc", $ns) | ForEach-Object {
                        $ct = $_.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.'#text' }
                        (($ct -join " ") -replace "\s+", " ").Trim()
                    }
                    [void]$sb.AppendLine("| " + ($cells -join " | ") + " |")
                }
                [void]$sb.AppendLine("--- END TABLE ---")
            }
        }

        $outPath = Join-Path $outDir ($f.BaseName + ".txt")
        [System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
        Write-Output "Extracted: $($f.Name) -> $outPath ($($sb.Length) chars)"
    }
    finally {
        $zip.Dispose()
    }
}
