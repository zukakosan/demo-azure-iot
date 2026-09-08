param(
    [string]$Template = (Join-Path $PSScriptRoot '../../references/opus-template-sample-002.pptx'),
    [string]$Source = (Join-Path $PSScriptRoot 'slides.md'),
    [string]$Output = (Join-Path $PSScriptRoot '02-connection-patterns-from-slides.pptx'),
    [switch]$ValidateOnly,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$sourcePath = (Resolve-Path $Source).Path
$templatePath = (Resolve-Path $Template).Path
$outputPath = [IO.Path]::GetFullPath($Output)
$raw = [IO.File]::ReadAllText($sourcePath).Replace("`r`n", "`n")
$sourceHash = (Get-FileHash $sourcePath -Algorithm SHA256).Hash
$templateHash = (Get-FileHash $templatePath -Algorithm SHA256).Hash
$verification = Join-Path $PSScriptRoot 'verification'

function Convert-Inline([string]$Value) {
    $links = [Collections.Generic.List[object]]::new()
    $text = [regex]::Replace($Value, '\[([^\]]+)\]\((https://[^)]+)\)', {
        param($match)
        $links.Add(@{ text = $match.Groups[1].Value; url = $match.Groups[2].Value })
        return $match.Groups[1].Value
    })
    $text = $text.Replace('**', '') -replace '^\- ', ''
    return @{ text = $text; links = $links.ToArray() }
}

function Read-Graph([string]$Code) {
    $nodes = [ordered]@{}
    $groups = [ordered]@{}
    $stack = [Collections.Generic.List[string]]::new()
    $edges = [Collections.Generic.List[object]]::new()
    foreach ($line in ($Code -split "`n")) {
        $line = $line.Trim()
        if (!$line -or $line -eq 'flowchart LR') { continue }
        if ($line -match '^subgraph (\w+)\["(.+)"\]$') {
            $groups[$Matches[1]] = @{ id = $Matches[1]; label = $Matches[2]; parent = ($stack | Select-Object -Last 1) }
            $stack.Add($Matches[1])
            continue
        }
        if ($line -eq 'end') {
            if (!$stack.Count) { throw 'Unbalanced Mermaid subgraph' }
            $stack.RemoveAt($stack.Count - 1)
            continue
        }
        foreach ($nodeMatch in [regex]::Matches($line, '(\w+)\["([^"]+)"\]')) {
            $nodeId = $nodeMatch.Groups[1].Value
            if ($nodes.Contains($nodeId)) { throw "Repeated node definition: $nodeId" }
            $nodes[$nodeId] = @{ id = $nodeId; label = $nodeMatch.Groups[2].Value.Replace('\n', "`r"); parent = ($stack | Select-Object -Last 1) }
        }
        $simplified = [regex]::Replace($line, '(\w+)\["([^"]+)"\]', '$1')
        if ($simplified -match '^(\w+) -->\|"([^"]+)"\| (\w+)$') {
            $edges.Add(@{ from = $Matches[1]; to = $Matches[3]; label = $Matches[2].Replace('\n', "`r") })
        } elseif ($simplified -match '^(\w+) --> (\w+)$') {
            $edges.Add(@{ from = $Matches[1]; to = $Matches[2]; label = '' })
        } elseif ($simplified -notmatch '^\w+$') {
            throw "Unsupported Mermaid syntax: $line"
        }
    }
    if ($stack.Count) { throw 'Unclosed Mermaid subgraph' }
    foreach ($edge in $edges) {
        if (!$nodes.Contains($edge.from) -or !$nodes.Contains($edge.to)) { throw 'Undefined Mermaid endpoint' }
    }
    return @{ nodes = $nodes; groups = $groups; edges = $edges.ToArray() }
}

$pages = @(foreach ($section in [regex]::Matches($raw, '(?ms)^## (02-0[1-4]) ([^\n]+)\n(.*?)(?=^## 02-|\z)')) {
    $content = $section.Groups[3].Value
    $bodyMatch = [regex]::Match($content, '(?s)### 投影本文\n(.*?)\n### 図の構成')
    $graphMatch = [regex]::Match($content, '(?s)```mermaid\n(.*?)\n```')
    if (!$bodyMatch.Success -or !$graphMatch.Success) { throw 'Missing body or Mermaid diagram' }
    $body = $bodyMatch.Groups[1].Value.Trim()
    $paragraphs = @($body -split "`n" | Where-Object { $_.Trim() -and $_ -notmatch '^\|' })
    $rows = @(foreach ($line in ($body -split "`n" | Where-Object { $_ -match '^\|' -and $_ -notmatch '^\|[\s-]+\|' })) {
        ,@($line.Trim().Trim('|').Split('|') | ForEach-Object { $_.Trim() })
    })
    @{
        id = $section.Groups[1].Value
        title = $section.Groups[2].Value
        paragraphs = $paragraphs
        rows = $rows
        graph = Read-Graph $graphMatch.Groups[1].Value
        notes = $content
        body = $body
    }
})
if ($pages.Count -ne 4) { throw 'Expected four source slides' }
$counts = @(@(3, 2, 0), @(3, 2, 2), @(5, 4, 2), @(5, 4, 0))
for ($pageIndex = 0; $pageIndex -lt 4; $pageIndex++) {
    $graph = $pages[$pageIndex].graph
    $actual = @($graph.nodes.Count, $graph.edges.Count, $graph.groups.Count)
    if (($actual -join ',') -ne ($counts[$pageIndex] -join ',')) { throw "Unexpected graph structure on page $pageIndex" }
}
if ($ValidateOnly) {
    $pages | ForEach-Object { '{0}: {1} nodes, {2} directed edges, {3} groups, {4} body paragraphs' -f $_.id, $_.graph.nodes.Count, $_.graph.edges.Count, $_.graph.groups.Count, $_.paragraphs.Count }
    'PASS: source sections and supported Mermaid syntax validated.'
    return
}
if ((Test-Path $outputPath) -and !$Force) { throw 'Output exists. Use -Force only to regenerate this generated deck.' }
[void][IO.Directory]::CreateDirectory($verification)

function Get-Color([string]$Hex) {
    return [Convert]::ToInt32($Hex.Substring(0, 2), 16) + 256 * [Convert]::ToInt32($Hex.Substring(2, 2), 16) + 65536 * [Convert]::ToInt32($Hex.Substring(4, 2), 16)
}
$ink = Get-Color '0B2430'
$muted = Get-Color '566473'
$blue = Get-Color '0078D4'
$teal = Get-Color '159C91'
$pale = Get-Color 'F4F4F6'
$border = Get-Color 'C6CED3'
$white = Get-Color 'FFFFFF'
$measurements = [Collections.Generic.List[object]]::new()
$validation = [Collections.Generic.List[object]]::new()

function Set-TextStyle($Shape, [string]$Text, [double]$Size, [int]$Color, [bool]$Bold = $false, [int]$Align = 1, [bool]$TableCell = $false) {
    $width = $Shape.Width
    $height = $Shape.Height
    $Shape.TextFrame.TextRange.Text = $Text
    $Shape.TextFrame.MarginLeft = 0
    $Shape.TextFrame.MarginRight = 0
    $Shape.TextFrame.MarginTop = 0
    $Shape.TextFrame.MarginBottom = 0
    $Shape.TextFrame.VerticalAnchor = 1
    $range = $Shape.TextFrame.TextRange
    $range.Font.Name = 'Yu Gothic UI'
    $range.Font.NameFarEast = 'Yu Gothic UI'
    $range.Font.Size = $Size
    $range.Font.Color.RGB = $Color
    $range.Font.Bold = $(if ($Bold) { -1 } else { 0 })
    $range.ParagraphFormat.Alignment = $Align
    $range.ParagraphFormat.SpaceBefore = 0
    $range.ParagraphFormat.SpaceAfter = 0
    if (!$TableCell) {
        $Shape.TextFrame2.AutoSize = 0
        $Shape.TextFrame2.WordWrap = -1
        $Shape.Width = $width
        $Shape.Height = $height
    }
}

function Add-Text($Slide, [string]$Name, [string]$Value, [double]$Left, [double]$Top, [double]$Width, [double]$Height, [double]$Size = 14, [int]$Color = $ink, [bool]$Bold = $false, [int]$Align = 1) {
    $shape = $Slide.Shapes.AddTextbox(1, $Left, $Top, $Width, $Height)
    $shape.Name = $Name
    $inline = Convert-Inline $Value
    Set-TextStyle $shape $inline.text $Size $Color $Bold $Align
    foreach ($link in $inline.links) {
        $position = $inline.text.IndexOf($link.text, [StringComparison]::Ordinal)
        if ($position -ge 0) {
            $linkRange = $shape.TextFrame.TextRange.Characters($position + 1, $link.text.Length)
            $linkRange.ActionSettings.Item(1).Hyperlink.Address = $link.url
            $linkRange.Font.Size = 10
            $linkRange.Font.Color.RGB = $muted
        }
    }
    foreach ($boldMatch in [regex]::Matches($Value, '\*\*([^*]+)\*\*')) {
        $boldText = (Convert-Inline $boldMatch.Groups[1].Value).text
        $position = $inline.text.IndexOf($boldText, [StringComparison]::Ordinal)
        if ($position -ge 0) { $shape.TextFrame.TextRange.Characters($position + 1, $boldText.Length).Font.Bold = -1 }
    }
    return $shape
}

function Add-Box($Slide, [string]$Name, [double[]]$Bounds, [int]$Fill, [int]$Stroke = $border) {
    $shape = $Slide.Shapes.AddShape(1, $Bounds[0], $Bounds[1], $Bounds[2], $Bounds[3])
    $shape.Name = $Name
    $shape.Fill.Solid()
    $shape.Fill.ForeColor.RGB = $Fill
    $shape.Shadow.Visible = 0
    $shape.Line.ForeColor.RGB = $Stroke
    $shape.Line.Weight = 0.8
    return $shape
}

function Add-Table($Slide, $Rows, [double[]]$Bounds, [double[]]$Widths, [double[]]$Heights, [double]$Size) {
    $tableShape = $Slide.Shapes.AddTable($Rows.Count, $Widths.Count, $Bounds[0], $Bounds[1], $Bounds[2], $Bounds[3])
    $tableShape.Name = 'source:table'
    $table = $tableShape.Table
    for ($column = 1; $column -le $Widths.Count; $column++) { $table.Columns.Item($column).Width = $Widths[$column - 1] }
    for ($row = 1; $row -le $Rows.Count; $row++) {
        $table.Rows.Item($row).Height = $Heights[$row - 1]
        for ($column = 1; $column -le $Widths.Count; $column++) {
            $cell = $table.Cell($row, $column)
            $cell.Shape.Fill.ForeColor.RGB = $(if ($row -eq 1) { $pale } else { $white })
            Set-TextStyle $cell.Shape $Rows[$row - 1][$column - 1] $Size $ink ($row -eq 1 -or $column -eq 1) 1 $true
            $cell.Shape.TextFrame.MarginLeft = 9
            $cell.Shape.TextFrame.MarginRight = 9
            $cell.Shape.TextFrame.MarginTop = 7
            $cell.Shape.TextFrame.MarginBottom = 5
            foreach ($side in 1..4) {
                $cell.Borders.Item($side).ForeColor.RGB = $border
                $cell.Borders.Item($side).Weight = 0.5
            }
        }
    }
    return $tableShape
}

function Add-Graph($Slide, $Graph, $Placement, $GroupPlacement, $EdgePlacement, [double]$Size = 13) {
    $nodeShapes = @{}
    foreach ($group in $Graph.groups.Values) {
        $bounds = $GroupPlacement[$group.id]
        if (!$bounds) { throw "Missing group placement: $($group.id)" }
        $groupShape = Add-Box $Slide "group:$($group.id)" $bounds $white $border
        $groupShape.Fill.Transparency = 1
        $groupShape.Tags.Add('parent', [string]$group.parent)
        [void](Add-Text $Slide "group-label:$($group.id)" $group.label ($bounds[0] + 8) ($bounds[1] + 6) ($bounds[2] - 16) 36 12 $muted)
    }
    foreach ($node in $Graph.nodes.Values) {
        $bounds = $Placement[$node.id]
        if (!$bounds) { throw "Missing node placement: $($node.id)" }
        $nodeShape = Add-Box $Slide "node:$($node.id)" $bounds $pale $border
        Set-TextStyle $nodeShape $node.label $Size $ink $false 2
        $nodeShape.TextFrame.MarginLeft = 5
        $nodeShape.TextFrame.MarginRight = 5
        $nodeShape.TextFrame.MarginTop = 5
        $nodeShape.TextFrame.MarginBottom = 5
        $nodeShape.TextFrame.VerticalAnchor = 3
        $nodeShape.Tags.Add('parent', [string]$node.parent)
        $nodeShapes[$node.id] = $nodeShape
    }
    for ($edgeIndex = 0; $edgeIndex -lt $Graph.edges.Count; $edgeIndex++) {
        $edge = $Graph.edges[$edgeIndex]
        $from = $nodeShapes[$edge.from]
        $to = $nodeShapes[$edge.to]
        $connector = $Slide.Shapes.AddConnector(2, $from.Left + $from.Width, $from.Top + $from.Height / 2, $to.Left, $to.Top + $to.Height / 2)
        $connector.Name = "edge:$($edge.from):$($edge.to)"
        $connector.ConnectorFormat.BeginConnect($from, 4)
        $connector.ConnectorFormat.EndConnect($to, 2)
        $connector.Line.ForeColor.RGB = $blue
        $connector.Line.Weight = 1.4
        $connector.Line.EndArrowheadStyle = 3
        $connector.Shadow.Visible = 0
        if ($edge.label) {
            $bounds = $EdgePlacement[$edgeIndex]
            if (!$bounds) { throw 'Missing edge-label placement' }
            $label = Add-Text $Slide "edge-label:$($edge.from):$($edge.to)" $edge.label $bounds[0] $bounds[1] $bounds[2] $bounds[3] 11 $muted $false 2
            $label.Fill.Visible = 0
        }
    }
}

function Test-TextBounds($Shape, [string]$Id) {
    if (!$Shape.HasTextFrame -or !$Shape.TextFrame.HasText) { return }
    $frame = $Shape.TextFrame2
    $availableWidth = $Shape.Width - $frame.MarginLeft - $frame.MarginRight
    $availableHeight = $Shape.Height - $frame.MarginTop - $frame.MarginBottom
    $measurements.Add(@{
        id = $Id
        width = [math]::Round($frame.TextRange.BoundWidth, 2)
        height = [math]::Round($frame.TextRange.BoundHeight, 2)
        availableWidth = [math]::Round($availableWidth, 2)
        availableHeight = [math]::Round($availableHeight, 2)
        overflow = ($frame.TextRange.BoundWidth -gt $availableWidth + 2 -or $frame.TextRange.BoundHeight -gt $availableHeight + 2)
    })
}

function Test-Page($Slide, $Page) {
    foreach ($node in $Page.graph.nodes.Values) {
        $shape = $Slide.Shapes.Item("node:$($node.id)")
        if ($shape.TextFrame.TextRange.Text -cne $node.label) { throw "Node text differs: $($node.id)" }
        if ($node.parent) {
            $parent = $Slide.Shapes.Item("group:$($node.parent)")
            if ($shape.Left -lt $parent.Left -or $shape.Top -lt $parent.Top -or $shape.Left + $shape.Width -gt $parent.Left + $parent.Width -or $shape.Top + $shape.Height -gt $parent.Top + $parent.Height) { throw 'Node outside its Mermaid group' }
        }
    }
    foreach ($group in $Page.graph.groups.Values) {
        if ($Slide.Shapes.Item("group-label:$($group.id)").TextFrame.TextRange.Text -cne $group.label) { throw 'Group label differs' }
        if ($group.parent) {
            $shape = $Slide.Shapes.Item("group:$($group.id)")
            $parent = $Slide.Shapes.Item("group:$($group.parent)")
            if ($shape.Left -lt $parent.Left -or $shape.Top -lt $parent.Top -or $shape.Left + $shape.Width -gt $parent.Left + $parent.Width -or $shape.Top + $shape.Height -gt $parent.Top + $parent.Height) { throw 'Nested group is outside parent' }
        }
    }
    foreach ($edge in $Page.graph.edges) {
        $shape = $Slide.Shapes.Item("edge:$($edge.from):$($edge.to)")
        if ($shape.ConnectorFormat.BeginConnectedShape.Name -cne "node:$($edge.from)" -or $shape.ConnectorFormat.EndConnectedShape.Name -cne "node:$($edge.to)" -or $shape.Line.EndArrowheadStyle -ne 3) { throw 'Mermaid edge endpoint mismatch' }
        if ($edge.label -and $Slide.Shapes.Item("edge-label:$($edge.from):$($edge.to)").TextFrame.TextRange.Text -cne $edge.label) { throw 'Edge label differs' }
    }
    $allText = @(foreach ($shape in $Slide.Shapes) {
        if ($shape.HasTextFrame -and $shape.TextFrame.HasText) { $shape.TextFrame.TextRange.Text }
    }) -join "`n"
    foreach ($paragraph in $Page.paragraphs) {
        if (!$allText.Contains((Convert-Inline $paragraph).text)) { throw "Source body missing on $($Page.id): $paragraph" }
    }
    if ($Page.rows.Count) {
        $table = $Slide.Shapes.Item('source:table').Table
        for ($row = 1; $row -le $Page.rows.Count; $row++) {
            for ($column = 1; $column -le $Page.rows[$row - 1].Count; $column++) {
                if ($table.Cell($row, $column).Shape.TextFrame.TextRange.Text -cne $Page.rows[$row - 1][$column - 1]) { throw 'Source table differs' }
            }
        }
    }
    foreach ($shape in $Slide.Shapes) {
        Test-TextBounds $shape "$($Page.id)/$($shape.Name)"
        if ($shape.HasTable) {
            for ($row = 1; $row -le $shape.Table.Rows.Count; $row++) {
                for ($column = 1; $column -le $shape.Table.Columns.Count; $column++) { Test-TextBounds $shape.Table.Cell($row, $column).Shape "$($Page.id)/table/$row/$column" }
            }
        }
    }
    $validation.Add(@{ slide = $Page.id; sourceBody = 'exact'; sourceTable = 'exact'; nodes = $Page.graph.nodes.Count; edges = $Page.graph.edges.Count; groups = $Page.graph.groups.Count; nativeDiagram = $true })
}

$app = New-Object -ComObject PowerPoint.Application
$deck = $null
try {
    $deck = $app.Presentations.Open($templatePath, -1, 0, 0)
    $deck.SaveAs($outputPath, 24)
    $deck.Slides.Item(2).Export((Join-Path $verification 'template-body.png'), 'PNG', 1600, 900)
    for ($slideIndex = $deck.Slides.Count; $slideIndex -ge 1; $slideIndex--) {
        if ($slideIndex -ne 2) { $deck.Slides.Item($slideIndex).Delete() }
    }
    $base = $deck.Slides.Item(1)
    for ($shapeIndex = $base.Shapes.Count; $shapeIndex -ge 1; $shapeIndex--) {
        if ($base.Shapes.Item($shapeIndex).Id -notin @(2, 3, 4, 5, 6)) { $base.Shapes.Item($shapeIndex).Delete() }
    }
    for ($copyIndex = 1; $copyIndex -lt 4; $copyIndex++) { [void]$base.Duplicate() }
    for ($pageIndex = 0; $pageIndex -lt 4; $pageIndex++) {
        $page = $pages[$pageIndex]
        $slide = $deck.Slides.Item($pageIndex + 1)
        $title = $slide.Shapes.Item('TextBox 2')
        Set-TextStyle $title $page.title 26 $ink
        $title.Width = 845
        $intro = $slide.Shapes.Item('TextBox 4')
        $intro.Delete()
        [void](Add-Text $slide 'source:lead' $page.paragraphs[0] 46.1 75 867.8 42 14 $muted)
        Set-TextStyle $slide.Shapes.Item('TextBox 5') ([string]($pageIndex + 1)) 10 $muted
        switch ($pageIndex) {
            0 {
                [void](Add-Table $slide $page.rows @(46, 133, 400, 235) @(95, 305) @(31, 68, 68, 68) 13)
                Add-Graph $slide $page.graph @{
                    requirements = @(461, 231, 144, 66)
                    cloud = @(713, 154, 200, 64)
                    edge = @(713, 326, 200, 64)
                } @{} @{
                    0 = @(611, 142, 96, 42)
                    1 = @(611, 367, 96, 44)
                } 13
                [void](Add-Text $slide 'source:body:1' $page.paragraphs[1] 46 430 868 47 14)
                [void](Add-Text $slide 'source:conclusion' $page.paragraphs[2] 46 490 868 30 15 $blue $true)
            }
            1 {
                Add-Graph $slide $page.graph @{
                    sensor = @(64, 190, 180, 60)
                    hub = @(454, 190, 160, 60)
                    downstream = @(734, 190, 164, 60)
                } @{
                    deviceSide = @(46, 136, 218, 134)
                    azureSide = @(388, 136, 526, 134)
                } @{
                    0 = @(269, 158, 115, 52)
                    1 = @(623, 172, 102, 30)
                } 14
                for ($paragraphIndex = 1; $paragraphIndex -le 3; $paragraphIndex++) {
                    [void](Add-Text $slide "source:body:$paragraphIndex" $page.paragraphs[$paragraphIndex] 46 (300 + ($paragraphIndex - 1) * 55) 868 50 14)
                }
                [void](Add-Text $slide 'source:conclusion' $page.paragraphs[4] 46 478 868 40 15 $blue $true)
            }
            2 {
                Add-Graph $slide $page.graph @{
                    equipment = @(60, 210, 132, 59)
                    connector = @(280, 210, 122, 59)
                    broker = @(436, 210, 122, 59)
                    dataflow = @(592, 210, 118, 59)
                    cloud = @(792, 210, 121, 59)
                } @{
                    site = @(46, 130, 680, 158)
                    runtime = @(268, 162, 450, 116)
                } @{
                    0 = @(196, 215, 68, 20)
                    3 = @(730, 178, 58, 32)
                } 12
                for ($paragraphIndex = 1; $paragraphIndex -le 3; $paragraphIndex++) {
                    [void](Add-Text $slide "source:body:$paragraphIndex" $page.paragraphs[$paragraphIndex] 46 (304 + ($paragraphIndex - 1) * 51) 868 49 13)
                }
                [void](Add-Text $slide 'source:conclusion' $page.paragraphs[4] 46 471 868 49 14 $ink $true)
            }
            3 {
                Add-Graph $slide $page.graph @{
                    direct = @(60, 139, 220, 54)
                    hub = @(385, 139, 198, 54)
                    equipment = @(60, 231, 220, 54)
                    operations = @(385, 231, 198, 54)
                    downstream = @(719, 184, 184, 62)
                } @{} @{} 13
                [void](Add-Text $slide 'scope:device' '今回の対象' 60 116 220 18 11 $blue)
                [void](Add-Table $slide $page.rows @(46, 316, 868, 132) @(408, 205, 255) @(27, 35, 35, 35) 12.5)
                [void](Add-Text $slide 'source:body:1' $page.paragraphs[1] 46 457 868 30 12)
                [void](Add-Text $slide 'source:conclusion' $page.paragraphs[2] 46 496 868 28 15 $blue $true)
            }
        }
        $noteShape = $null
        foreach ($shape in $slide.NotesPage.Shapes) {
            if ($shape.Type -eq 14 -and $shape.PlaceholderFormat.Type -eq 2) { $noteShape = $shape }
        }
        if (!$noteShape) { throw 'Missing notes body placeholder' }
        $noteShape.TextFrame.TextRange.Text = "$($page.id) $($page.title)`r`nSource SHA256: $sourceHash`r`n" + $page.notes.Replace("`n", "`r`n")
        Test-Page $slide $page
        $slide.Export((Join-Path $verification "$($page.id).png"), 'PNG', 1600, 900)
    }
    $deck.Save()
    $deck.SaveAs([IO.Path]::ChangeExtension($outputPath, '.pdf'), 32)
    $deck.Close()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($deck)
    $deck = $app.Presentations.Open($outputPath, -1, 0, 0)
    if ($deck.Slides.Count -ne 4) { throw 'Reopened deck slide count mismatch' }
    for ($pageIndex = 0; $pageIndex -lt 4; $pageIndex++) {
        Test-Page $deck.Slides.Item($pageIndex + 1) $pages[$pageIndex]
    }
    if ((Get-FileHash $templatePath -Algorithm SHA256).Hash -ne $templateHash) { throw 'Template was modified' }
    $report = @{
        source = $sourcePath; sourceSHA256 = $sourceHash; template = $templatePath; templateSHA256 = $templateHash
        output = $outputPath; templateUnchanged = $true; reopenedInPowerPoint = $true
        slideCount = 4; graphAndBodyChecks = $validation.ToArray(); textMeasurements = $measurements.ToArray(); tolerancePt = 2
    }
    $report | ConvertTo-Json -Depth 12 | Set-Content -Encoding utf8 (Join-Path $verification 'validation.json')
    $pages | ForEach-Object { @{ id = $_.id; graph = $_.graph } } | ConvertTo-Json -Depth 12 | Set-Content -Encoding utf8 (Join-Path $verification 'source-graphs.json')
    $overflows = @($measurements | Where-Object overflow)
    if ($overflows.Count) {
        $overflows | Format-Table id, width, availableWidth, height, availableHeight
        throw "Text overflow candidates: $($overflows.Count). Review verification images."
    }
    "PASS: saved and reopened $outputPath; native diagrams and full source body verified; no text overflows."
} finally {
    if ($deck) { $deck.Close(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($deck) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}