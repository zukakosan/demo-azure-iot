param(
    [string]$Presentation = (Join-Path $PSScriptRoot '03-iot-hub-basics-protocols.pptx'),
    [string]$Source = (Join-Path $PSScriptRoot 'slide.md'),
    [string]$Report = (Join-Path $PSScriptRoot 'verification/protocols/structure.json')
)

$ErrorActionPreference = 'Stop'
$sourceHash = (Get-FileHash $Source -Algorithm SHA256).Hash
$raw = [IO.File]::ReadAllText((Resolve-Path $Source).Path).Replace("`r`n", "`n")
$sourceSlides = [regex]::Matches($raw, '(?ms)^## (03-\d{2}) ([^\n]+)\n(.*?)(?=^## |\z)')
$archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path $Presentation).Path)

function Read-PackageXml([string]$Name) {
    $entry = $archive.GetEntry($Name)
    if (!$entry) { throw "Missing package part: $Name" }
    $stream = $entry.Open()
    try {
        $document = [xml]::new()
        $document.XmlResolver = $null
        $document.Load($stream)
        return ,$document
    } finally { $stream.Dispose() }
}

try {
    $xmlCount = 0
    foreach ($entry in $archive.Entries) {
        if ($entry.FullName -match '\.(xml|rels)$') { [void](Read-PackageXml $entry.FullName); $xmlCount++ }
    }
    $manifest = Read-PackageXml 'ppt/presentation.xml'
    $manifestRelationships = Read-PackageXml 'ppt/_rels/presentation.xml.rels'
    $slideIds = $manifest.SelectNodes('//*[local-name()="sldId"]')
    $slideCount = $slideIds.Count
    if ($slideCount -ne $sourceSlides.Count -or $slideCount -ne 12) { throw 'Slide count mismatch' }
    $slideReports = @(for ($index = 1; $index -le $slideCount; $index++) {
        $relationshipId = $slideIds[$index - 1].GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
        $slideRelationship = $manifestRelationships.SelectNodes('//*[local-name()="Relationship"]') | Where-Object { $_.Id -eq $relationshipId } | Select-Object -First 1
        if (!$slideRelationship) { throw 'Missing slide relationship in manifest' }
        $baseUri = [Uri]::new([Uri]'https://package/ppt/presentation.xml', $slideRelationship.Target)
        $slidePart = $baseUri.AbsolutePath.TrimStart('/')
        $document = Read-PackageXml $slidePart
        $text = ($document.SelectNodes('//*[local-name()="t"]') | ForEach-Object InnerText) -join ''
        $title = $sourceSlides[$index - 1].Groups[2].Value
        if (!$text.Contains($title)) { throw "Title mismatch on slide $index" }
        if ($text -match '本資料の構成|払い出し効率化|標準メニュー|ガードレール|lorem ipsum') { throw "Template text remains on slide $index" }
        $slideFileName = $baseUri.Segments[-1]
        $relationships = Read-PackageXml "ppt/slides/_rels/$slideFileName.rels"
        $notesRelation = $relationships.SelectSingleNode('//*[local-name()="Relationship" and contains(@Type,"/notesSlide")]')
        $layoutRelation = $relationships.SelectSingleNode('//*[local-name()="Relationship" and contains(@Type,"/slideLayout")]')
        if (!$layoutRelation -or !$notesRelation) { throw 'Missing layout or notes relationship' }
        $notesPath = ([Uri]::new($baseUri, $notesRelation.Target)).AbsolutePath.TrimStart('/')
        $layoutPath = ([Uri]::new($baseUri, $layoutRelation.Target)).AbsolutePath.TrimStart('/')
        $notes = Read-PackageXml $notesPath
        [void](Read-PackageXml $layoutPath)
        $notesText = ($notes.SelectNodes('//*[local-name()="t"]') | ForEach-Object InnerText) -join ''
        if (!$notesText.Contains($sourceHash) -or !$notesText.Contains('目安:')) { throw "Missing source hash or timing in notes $index" }
        $body = [regex]::Match($sourceSlides[$index - 1].Groups[3].Value, '(?s)### 投影本文\n(.*?)\n### 図の構成').Groups[1].Value
        $sourceUrls = @([regex]::Matches($body, '\[[^\]]+\]\(([^)]+)\)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
        $hyperlinks = @($relationships.SelectNodes('//*[local-name()="Relationship" and contains(@Type,"/hyperlink")]'))
        if ($hyperlinks.Count -lt $sourceUrls.Count) { throw "Missing citation hyperlinks on slide $index" }
        foreach ($url in $sourceUrls) {
            if (!$notesText.Contains($url)) { throw "Citation URL missing in notes $index" }
            if ($url -match '^https://' -and $url -notin @($hyperlinks | ForEach-Object Target)) { throw "Citation hyperlink mismatch on slide $index" }
        }
        $nativeShapes = $document.SelectNodes('//*[local-name()="sp"]').Count
        $tables = $document.SelectNodes('//*[local-name()="tbl"]').Count
        $pictures = $document.SelectNodes('//*[local-name()="pic"]').Count
        if ($nativeShapes -lt 5 -or $pictures -ne 0) { throw "Unexpected flattened slide $index" }
        $fonts = @($document.SelectNodes('//*[local-name()="latin" or local-name()="ea"]') | ForEach-Object { $_.GetAttribute('typeface') } | Sort-Object -Unique)
        if ('Yu Gothic UI' -notin $fonts) { throw "Missing intended font on slide $index" }
        @{ slide = $index; part = $slidePart; title = $title; nativeShapes = $nativeShapes; tables = $tables; slidePictures = $pictures; hyperlinkCount = $hyperlinks.Count; notesAndTiming = $true; layout = $layoutPath; fonts = $fonts }
    })
    $result = @{ sourceSHA256 = $sourceHash; outputSHA256 = (Get-FileHash $Presentation -Algorithm SHA256).Hash; slideCount = $slideCount; parsedXmlParts = $xmlCount; slides = $slideReports; status = 'passed' }
    $result | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 $Report
    "PASS: $xmlCount XML parts; $slideCount titles and notes; native shapes/tables; source hyperlinks; no template text remains."
} finally { $archive.Dispose() }