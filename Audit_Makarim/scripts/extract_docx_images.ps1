Add-Type -AssemblyName System.IO.Compression.FileSystem

$srcDir = Join-Path (Get-Location) "sources\Manuel de formation"
$outBase = Join-Path (Get-Location) "scripts\out_manuels\images"
New-Item -ItemType Directory -Force -Path $outBase | Out-Null

Get-ChildItem -Path $srcDir -Filter "*.docx" | ForEach-Object {
    $sub = Join-Path $outBase $_.BaseName
    New-Item -ItemType Directory -Force -Path $sub | Out-Null
    $z = [System.IO.Compression.ZipFile]::OpenRead($_.FullName)
    try {
        # Map rId -> Target from word/_rels/document.xml.rels
        $relsEntry = $z.GetEntry("word/_rels/document.xml.rels")
        $sr = New-Object System.IO.StreamReader($relsEntry.Open(), [System.Text.Encoding]::UTF8)
        [xml]$relsXml = $sr.ReadToEnd(); $sr.Close()
        $relMap = @{}
        foreach ($r in $relsXml.Relationships.Relationship) {
            $relMap[$r.Id] = $r.Target
        }

        # Extract images in order of appearance with nearest preceding heading
        $docEntry = $z.GetEntry("word/document.xml")
        $sr2 = New-Object System.IO.StreamReader($docEntry.Open(), [System.Text.Encoding]::UTF8)
        [xml]$docXml = $sr2.ReadToEnd(); $sr2.Close()
        $ns = New-Object System.Xml.XmlNamespaceManager($docXml.NameTable)
        $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
        $ns.AddNamespace("a", "http://schemas.openxmlformats.org/drawingml/2006/main")
        $ns.AddNamespace("r", "http://schemas.openxmlformats.org/officeDocument/2006/relationships")
        $ns.AddNamespace("v", "urn:schemas-microsoft-com:vml")

        $idx = 0
        $lastText = "Debut"
        $mapLines = New-Object System.Collections.Generic.List[string]
        foreach ($p in $docXml.SelectNodes("//w:body/w:p", $ns)) {
            $t = (($p.SelectNodes(".//w:t", $ns) | ForEach-Object { $_.'#text' }) -join "").Trim()
            if ($t.Length -gt 0) { $lastText = $t }
            $blips = $p.SelectNodes(".//a:blip/@r:embed | .//v:imagedata/@r:id", $ns)
            foreach ($b in $blips) {
                $rid = $b.Value
                if ($relMap.ContainsKey($rid)) {
                    $target = "word/" + ($relMap[$rid] -replace '^/', '')
                    $imgEntry = $z.GetEntry($target)
                    if ($imgEntry) {
                        $idx++
                        $ext = [System.IO.Path]::GetExtension($target)
                        $fname = "{0:D2}_{1}{2}" -f $idx, [System.IO.Path]::GetFileNameWithoutExtension($target), $ext
                        $dest = Join-Path $sub $fname
                        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($imgEntry, $dest, $true)
                        $mapLines.Add("$fname | Context: $lastText")
                    }
                }
            }
        }
        [System.IO.File]::WriteAllLines((Join-Path $sub "_index.txt"), $mapLines, [System.Text.Encoding]::UTF8)
        Write-Output "$($_.Name): extracted $idx images"
    }
    finally {
        $z.Dispose()
    }
}
