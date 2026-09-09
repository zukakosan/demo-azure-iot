param(
    [Parameter(Mandatory)][string]$First,
    [Parameter(Mandatory)][string]$Second,
    [Parameter(Mandatory)][string]$FirstRender,
    [Parameter(Mandatory)][string]$SecondRender,
    [Parameter(Mandatory)][string]$Report
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing

function Read-Part($Archive, [string]$Name) {
    $entry = $Archive.GetEntry($Name)
    if (!$entry) { throw "Missing Open XML part: $Name" }
    $reader = [IO.StreamReader]::new($entry.Open())
    try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}

function Resolve-Part([string]$BasePart, [string]$Target) {
    return ([uri]::new([uri]("https://package/" + $BasePart), $Target)).AbsolutePath.TrimStart('/')
}

function Get-Relationships($Archive, [string]$Part) {
    $directory = $Part.Substring(0, $Part.LastIndexOf('/') + 1)
    $name = $Part.Substring($Part.LastIndexOf('/') + 1)
    return Read-Part $Archive ($directory + '_rels/' + $name + '.rels')
}

function Convert-StableXml([xml]$Document) {
    foreach ($node in @($Document.SelectNodes('//*[local-name()="creationId" or local-name()="modId" or local-name()="colId" or local-name()="rowId"]'))) {
        [void]$node.ParentNode.RemoveChild($node)
    }
    return $Document.OuterXml
}

function Get-DeckSnapshot([string]$Path) {
    $archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path $Path).Path)
    try {
        $presentation = Read-Part $archive 'ppt/presentation.xml'
        $relationships = Get-Relationships $archive 'ppt/presentation.xml'
        $slideIds = $presentation.SelectNodes('//*[local-name()="sldIdLst"]/*')
        $slides = @(foreach ($slideId in $slideIds) {
            $relationshipId = $slideId.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
            $relationship = @($relationships.DocumentElement.ChildNodes | Where-Object { $_.Id -eq $relationshipId })[0]
            $slidePart = Resolve-Part 'ppt/presentation.xml' $relationship.Target
            $slide = Read-Part $archive $slidePart
            $slideRelationships = Get-Relationships $archive $slidePart
            $notesRelationship = @($slideRelationships.DocumentElement.ChildNodes | Where-Object { $_.Type -match '/notesSlide$' })[0]
            if (!$notesRelationship) { throw "Missing notes: $slidePart" }
            $notes = Read-Part $archive (Resolve-Part $slidePart $notesRelationship.Target)
            $notesText = @($notes.SelectNodes('//*[local-name()="t"]') | ForEach-Object InnerText) -join "`n"
            $text = @($slide.SelectNodes('//*[local-name()="t"]') | ForEach-Object InnerText) -join "`n"
            $links = @($slideRelationships.DocumentElement.ChildNodes | Where-Object { $_.Type -match '/hyperlink$' } | ForEach-Object { "$($_.Id)=$($_.Target)" } | Sort-Object)
            if (!$links.Count -or $notesText -notmatch 'https://learn.microsoft.com/') { throw "Missing sources: $slidePart" }
            if ($text -match '本資料の構成|払い出し効率化|Lorem ipsum|XXXX') { throw "Template text remains: $slidePart" }
            $layoutRelationship = @($slideRelationships.DocumentElement.ChildNodes | Where-Object { $_.Type -match '/slideLayout$' })[0]
            $layout = Read-Part $archive (Resolve-Part $slidePart $layoutRelationship.Target)
            [ordered]@{
                slideXml = Convert-StableXml $slide
                layoutXml = Convert-StableXml $layout
                notesText = $notesText
                links = $links
                text = $text
                editableShapes = $slide.SelectNodes('//*[local-name()="spTree"]/*[local-name()="sp" or local-name()="cxnSp" or local-name()="graphicFrame"]').Count
                pictures = $slide.SelectNodes('//*[local-name()="pic"]').Count
            }
        })
        return ,$slides
    } finally { $archive.Dispose() }
}

function Get-PixelHash([string]$Path) {
    $bitmap = [Drawing.Bitmap]::new((Resolve-Path $Path).Path)
    $data = $null
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        $rectangle = [Drawing.Rectangle]::new(0, 0, $bitmap.Width, $bitmap.Height)
        $data = $bitmap.LockBits($rectangle, [Drawing.Imaging.ImageLockMode]::ReadOnly, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $pixels = [byte[]]::new([Math]::Abs($data.Stride) * $bitmap.Height)
        [Runtime.InteropServices.Marshal]::Copy($data.Scan0, $pixels, 0, $pixels.Length)
        return [ordered]@{ width = $bitmap.Width; height = $bitmap.Height; sha256 = [Convert]::ToHexString($sha.ComputeHash($pixels)) }
    } finally {
        if ($data) { $bitmap.UnlockBits($data) }
        $bitmap.Dispose()
        $sha.Dispose()
    }
}

$firstSnapshot = Get-DeckSnapshot $First
$secondSnapshot = Get-DeckSnapshot $Second
if ($firstSnapshot.Count -ne $secondSnapshot.Count) { throw 'Slide counts differ' }
$firstValidation = Get-Content (Join-Path $FirstRender 'validation.json') -Raw | ConvertFrom-Json
$secondValidation = Get-Content (Join-Path $SecondRender 'validation.json') -Raw | ConvertFrom-Json
$sameInputs = $firstValidation.sourceSHA256 -ceq $secondValidation.sourceSHA256 -and $firstValidation.templateSHA256 -ceq $secondValidation.templateSHA256
$checks = @(for ($index = 0; $index -lt $firstSnapshot.Count; $index++) {
    $id = '02-{0:00}' -f ($index + 1)
    $firstPixels = Get-PixelHash (Join-Path $FirstRender "$id.png")
    $secondPixels = Get-PixelHash (Join-Path $SecondRender "$id.png")
    [ordered]@{
        slide = $id
        contentLayoutLinksNotesEqual = ($firstSnapshot[$index] | ConvertTo-Json -Depth 8 -Compress) -ceq ($secondSnapshot[$index] | ConvertTo-Json -Depth 8 -Compress)
        renderedPixelsEqual = ($firstPixels | ConvertTo-Json -Compress) -ceq ($secondPixels | ConvertTo-Json -Compress)
        pixelSHA256 = $firstPixels.sha256
        editableShapes = $firstSnapshot[$index].editableShapes
        pictures = $firstSnapshot[$index].pictures
        hyperlinks = $firstSnapshot[$index].links.Count
    }
})
$result = [ordered]@{
    first = (Resolve-Path $First).Path
    second = (Resolve-Path $Second).Path
    sameInputs = $sameInputs
    sourceSHA256 = $firstValidation.sourceSHA256
    templateSHA256 = $firstValidation.templateSHA256
    ignoredXmlElements = @('creationId', 'modId', 'colId', 'rowId')
    slideCount = $firstSnapshot.Count
    checks = $checks
    scope = 'Two consecutive runs in the same Windows/PowerPoint environment; not binary PPTX equality or cross-machine reproducibility.'
}
$result | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 $Report
$checks | ForEach-Object { [pscustomobject]$_ } | Format-Table slide, contentLayoutLinksNotesEqual, renderedPixelsEqual, editableShapes, pictures, hyperlinks
if (!$sameInputs -or @($checks | Where-Object { !$_.contentLayoutLinksNotesEqual -or !$_.renderedPixelsEqual }).Count) { throw 'Regeneration stability check failed; inspect report.' }
'PASS: same inputs, slide content/layout/links/notes and decoded render pixels match.'