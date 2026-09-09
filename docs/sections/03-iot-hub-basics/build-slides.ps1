param(
    [string]$Template = (Join-Path $PSScriptRoot '../../references/opus-template-sample-002.pptx'),
    [string]$Source = (Join-Path $PSScriptRoot 'slide.md'),
    [string]$Output = (Join-Path $PSScriptRoot '03-iot-hub-basics-protocols.pptx'),
    [string]$VerificationDirectory = (Join-Path $PSScriptRoot 'verification/protocols'),
    [switch]$InspectTemplate,
    [switch]$ValidateOnly,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$sourcePath = (Resolve-Path $Source).Path
$templatePath = (Resolve-Path $Template).Path
$outputPath = [IO.Path]::GetFullPath($Output)
$verification = [IO.Path]::GetFullPath($VerificationDirectory)
$raw = [IO.File]::ReadAllText($sourcePath).Replace("`r`n", "`n")
$sourceHash = (Get-FileHash $sourcePath -Algorithm SHA256).Hash
$templateHash = (Get-FileHash $templatePath -Algorithm SHA256).Hash

function Convert-Inline([string]$Value) {
    $links = [Collections.Generic.List[object]]::new()
    $text = [regex]::Replace($Value, '\[([^\]]+)\]\(([^)]+)\)', {
        param($match)
        $links.Add(@{ text = $match.Groups[1].Value; url = $match.Groups[2].Value })
        return $match.Groups[1].Value
    }).Replace('**', '').Replace('`', '')
    return @{ text = $text; links = $links.ToArray() }
}

$pages = @(foreach ($section in [regex]::Matches($raw, '(?ms)^## (03-\d{2}) ([^\n]+)\n(.*?)(?=^## |\z)')) {
    $content = $section.Groups[3].Value
    $bodyMatch = [regex]::Match($content, '(?s)### 投影本文\n(.*?)\n### 図の構成')
    if (!$bodyMatch.Success) { throw 'Missing projection body' }
    $blocks = [Collections.Generic.List[object]]::new()
    foreach ($part in ($bodyMatch.Groups[1].Value.Trim() -split '\n\s*\n')) {
        if ($part.StartsWith('|')) {
            $rows = @(foreach ($line in ($part -split "`n" | Where-Object { $_ -notmatch '^\|[\s:|-]+$' })) {
                ,@($line.Trim().Trim('|').Split('|') | ForEach-Object { (Convert-Inline $_.Trim()).text })
            })
            $blocks.Add(@{ kind = 'table'; rows = $rows })
        } elseif ($part.StartsWith('```')) {
            $blocks.Add(@{ kind = 'code'; text = [regex]::Replace($part, '^```\w*\n|\n```$', '') })
        } elseif ($part -match '^(\d+\. |\- )') {
            $items = @($part -split "`n" | ForEach-Object { $_ -replace '^\- ', '' })
            $blocks.Add(@{ kind = 'list'; items = $items })
        } else {
            $blocks.Add(@{ kind = 'paragraph'; text = $part })
        }
    }
    @{ id = $section.Groups[1].Value; title = $section.Groups[2].Value; blocks = $blocks.ToArray(); notes = $content; body = $bodyMatch.Groups[1].Value.Trim() }
})
if ($pages.Count -ne 12) { throw 'Expected 12 slides' }
$totalSeconds = 0
for ($pageIndex = 0; $pageIndex -lt $pages.Count; $pageIndex++) {
    $page = $pages[$pageIndex]
    if ($page.id -ne ('03-{0:00}' -f ($pageIndex + 1))) { throw 'Unexpected slide order' }
    $timing = [regex]::Match($page.notes, '目安: (\d+)分(?:(\d+)秒)?')
    $totalSeconds += 60 * [int]$timing.Groups[1].Value + [int]$timing.Groups[2].Value
    '{0}: {1} [{2}]' -f $page.id, $page.title, (($page.blocks | ForEach-Object kind) -join ', ')
}
if ($totalSeconds -ne 1500) { throw 'Expected 25-minute source' }
if ($ValidateOnly) { 'PASS: 12 ordered slides, 1500 seconds, structured projection bodies'; return }
if ($InspectTemplate) {
    [void][IO.Directory]::CreateDirectory($verification)
    $app = New-Object -ComObject PowerPoint.Application
    $deck = $null
    try {
        $deck = $app.Presentations.Open($templatePath, -1, 0, 0)
        'Template: {0} slides, {1} x {2} pt' -f $deck.Slides.Count, $deck.PageSetup.SlideWidth, $deck.PageSetup.SlideHeight
        $inspection = @(foreach ($slide in $deck.Slides) {
            $slide.Export((Join-Path $verification ('template-{0:00}.png' -f $slide.SlideIndex)), 'PNG', 1600, 900)
            foreach ($shape in $slide.Shapes) {
                @{ slide = $slide.SlideIndex; id = $shape.Id; name = $shape.Name; type = $shape.Type; left = $shape.Left; top = $shape.Top; width = $shape.Width; height = $shape.Height
                    text = $(if ($shape.HasTextFrame) { $shape.TextFrame.TextRange.Text });
                    font = $(if ($shape.HasTextFrame) { $shape.TextFrame.TextRange.Font.Name });
                    eastAsianFont = $(if ($shape.HasTextFrame) { $shape.TextFrame.TextRange.Font.NameFarEast });
                    size = $(if ($shape.HasTextFrame) { $shape.TextFrame.TextRange.Font.Size }) }
            }
        })
        $inspection | ConvertTo-Json -Depth 5 | Set-Content -Encoding utf8 (Join-Path $verification 'template-inspection.json')
        $inspection | Where-Object { $_.slide -eq 2 } | ForEach-Object { '{0} {1}: ({2},{3},{4},{5}) {6}/{7} {8}pt {9}' -f $_.id, $_.name, $_.left, $_.top, $_.width, $_.height, $_.font, $_.eastAsianFont, $_.size, $_.text }
    } finally {
        if ($deck) { $deck.Close(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($deck) }
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
    }
    if ((Get-FileHash $templatePath -Algorithm SHA256).Hash -ne $templateHash) { throw 'Template changed' }
    return
}
if ((Test-Path $outputPath) -and !$Force) { throw 'Output exists. Choose another -Output, or use -Force only for an unedited generated deck.' }
if (Test-Path $outputPath) {
    $previousReportPath = Join-Path $verification 'validation.json'
    if (!(Test-Path $previousReportPath)) { throw 'Cannot establish output ownership. Choose a new -Output.' }
    $previousReport = Get-Content $previousReportPath -Raw | ConvertFrom-Json
    if ($previousReport.output -ne $outputPath -or $previousReport.outputSHA256 -ne (Get-FileHash $outputPath -Algorithm SHA256).Hash) {
        throw 'Output has changed since generation. Preserve it and choose a new -Output and -VerificationDirectory.'
    }
}
[void][IO.Directory]::CreateDirectory($verification)

function Get-Color([string]$Hex) {
    return [Convert]::ToInt32($Hex.Substring(0, 2), 16) + 256 * [Convert]::ToInt32($Hex.Substring(2, 2), 16) + 65536 * [Convert]::ToInt32($Hex.Substring(4, 2), 16)
}
$ink = Get-Color '0B2430'
$muted = Get-Color '566473'
$blue = Get-Color '0078D4'
$pale = Get-Color 'F4F4F6'
$border = Get-Color 'C6CED3'
$white = Get-Color 'FFFFFF'
$measurements = [Collections.Generic.List[object]]::new()
$checks = [Collections.Generic.List[object]]::new()

function Get-Display([string]$Value) {
    $text = [regex]::Replace($Value, '\[([^\]]+)\]\(([^)]+)\)', {
        param($match)
        $url = $match.Groups[2].Value
        $citation = $script:citations | Where-Object { $_.url -eq $url } | Select-Object -First 1
        if (!$citation) {
            $citation = @{ number = $script:citations.Count + 1; label = $match.Groups[1].Value; url = $url }
            $script:citations.Add($citation)
        }
        return "[$($citation.number)]"
    })
    return $text.Replace('**', '').Replace('`', '')
}

function Set-Style($Shape, [string]$Value, [double]$Size, [int]$Color, [bool]$Bold = $false, [int]$Align = 1, [bool]$Cell = $false) {
    $width = $Shape.Width
    $height = $Shape.Height
    $Shape.TextFrame.TextRange.Text = $Value.Replace("`n", "`r")
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
    $range.ParagraphFormat.Bullet.Visible = 0
    if (!$Cell) {
        $Shape.TextFrame2.AutoSize = 0
        $Shape.TextFrame2.WordWrap = -1
        $Shape.Width = $width
        $Shape.Height = $height
    }
}

function Add-Text([string]$Name, [string]$Value, [double[]]$Bounds, [double]$Size = 14, [int]$Color = $ink, [bool]$Bold = $false, [int]$Align = 1) {
    $shape = $script:slide.Shapes.AddTextbox(1, $Bounds[0], $Bounds[1], $Bounds[2], $Bounds[3])
    $shape.Name = $Name
    $display = Get-Display $Value
    Set-Style $shape $display $Size $Color $Bold $Align
    foreach ($match in [regex]::Matches($Value, '\*\*([^*]+)\*\*')) {
        $part = Get-Display $match.Groups[1].Value
        $position = $display.IndexOf($part, [StringComparison]::Ordinal)
        if ($position -ge 0) { $shape.TextFrame.TextRange.Characters($position + 1, $part.Length).Font.Bold = -1 }
    }
    return $shape
}

function Add-Box([string]$Name, [double[]]$Bounds, [int]$Fill = $pale, [bool]$Transparent = $false) {
    $shape = $script:slide.Shapes.AddShape(1, $Bounds[0], $Bounds[1], $Bounds[2], $Bounds[3])
    $shape.Name = $Name
    $shape.Fill.Solid()
    $shape.Fill.ForeColor.RGB = $Fill
    if ($Transparent) { $shape.Fill.Transparency = 1 }
    $shape.Line.ForeColor.RGB = $border
    $shape.Line.Weight = 0.8
    $shape.Shadow.Visible = 0
    return $shape
}

function Add-Node([string]$Name, [string]$Value, [double[]]$Bounds, [double]$Size = 16) {
    $shape = Add-Box $Name $Bounds
    Set-Style $shape $Value $Size $ink $false 2
    $shape.TextFrame.MarginLeft = 7
    $shape.TextFrame.MarginRight = 7
    $shape.TextFrame.MarginTop = 6
    $shape.TextFrame.MarginBottom = 6
    $shape.TextFrame.VerticalAnchor = 3
    return $shape
}

function Add-Line([double]$StartX, [double]$StartY, [double]$EndX, [double]$EndY, [bool]$Arrow = $true, [int]$Color = $muted) {
    $line = $script:slide.Shapes.AddLine($StartX, $StartY, $EndX, $EndY)
    $line.Name = 'diagram:line'
    $line.Line.ForeColor.RGB = $Color
    $line.Line.Weight = 1.2
    if ($Arrow) { $line.Line.EndArrowheadStyle = 3 }
}

function Add-Table($Rows, [double[]]$Bounds, [double[]]$Widths, [double[]]$Heights, [double]$Size = 14) {
    $tableShape = $script:slide.Shapes.AddTable($Rows.Count, $Widths.Count, $Bounds[0], $Bounds[1], $Bounds[2], $Bounds[3])
    $tableShape.Name = 'source:table'
    $table = $tableShape.Table
    for ($column = 1; $column -le $Widths.Count; $column++) { $table.Columns.Item($column).Width = $Widths[$column - 1] }
    for ($row = 1; $row -le $Rows.Count; $row++) {
        for ($column = 1; $column -le $Widths.Count; $column++) {
            $cell = $table.Cell($row, $column)
            $cellText = Get-Display $Rows[$row - 1][$column - 1]
            if ($script:tableBreaks.ContainsKey("${row}:${column}")) {
                foreach ($phrase in $script:tableBreaks["${row}:${column}"]) { $cellText = $cellText.Replace($phrase, "`n$phrase") }
            }
            Set-Style $cell.Shape $cellText $Size $ink ($row -eq 1) 1 $true
            $cell.Shape.TextFrame.MarginLeft = 8
            $cell.Shape.TextFrame.MarginRight = 8
            $cell.Shape.TextFrame.MarginTop = 6
            $cell.Shape.TextFrame.MarginBottom = 5
            $cell.Shape.Fill.ForeColor.RGB = $(if ($row -eq 1) { $pale } else { $white })
            foreach ($side in 1..4) {
                $cell.Borders.Item($side).ForeColor.RGB = $border
                $cell.Borders.Item($side).Weight = 0.5
            }
        }
        $table.Rows.Item($row).Height = $Heights[$row - 1]
    }
}

function Write-Block([int]$Index, [double[]]$Bounds, [double]$Size = 14, [int]$Color = $ink, [string[]]$BreakBefore = @()) {
    $block = $script:page.blocks[$Index]
    if ($block.kind -eq 'paragraph' -or $block.kind -eq 'code') {
        $text = $block.text
        foreach ($phrase in $BreakBefore) { $text = $text.Replace($phrase, "`n$phrase") }
        $shape = Add-Text "source:block:$Index" $text $Bounds $Size $Color
        if ($block.kind -eq 'code') { $shape.TextFrame.TextRange.Font.Name = 'Consolas' }
    } elseif ($block.kind -eq 'list') {
        $itemHeight = $Bounds[3] / $block.items.Count
        for ($item = 0; $item -lt $block.items.Count; $item++) {
            [void](Add-Text "source:block:$Index/item:$item" $block.items[$item] @($Bounds[0], ($Bounds[1] + $item * $itemHeight), $Bounds[2], ($itemHeight - 7)) $Size $Color)
        }
    } else { throw 'Use Add-Table for table blocks' }
}

function Add-Citations {
    for ($index = 0; $index -lt $script:citations.Count; $index++) {
        $citation = $script:citations[$index]
        $left = 46 + ($index % 2) * 438
        $top = 500 + [math]::Floor($index / 2) * 14
        $shape = $script:slide.Shapes.AddTextbox(1, $left, $top, 428, 14)
        $shape.Name = "citation:$($citation.number)"
        Set-Style $shape "[$($citation.number)] $($citation.label)" 9.5 $muted
        $address = $citation.url
        if ($address -notmatch '^https://') { $address = [IO.Path]::GetFullPath((Join-Path (Split-Path $sourcePath) $address)) }
        $shape.TextFrame.TextRange.ActionSettings.Item(1).Hyperlink.Address = $address
    }
}

function Test-TextBounds($Shape, [string]$Name) {
    if (!$Shape.HasTextFrame -or !$Shape.TextFrame.HasText) { return }
    $availableWidth = $Shape.Width - $Shape.TextFrame.MarginLeft - $Shape.TextFrame.MarginRight
    $availableHeight = $Shape.Height - $Shape.TextFrame.MarginTop - $Shape.TextFrame.MarginBottom
    $width = $Shape.TextFrame2.TextRange.BoundWidth
    $height = $Shape.TextFrame2.TextRange.BoundHeight
    $measurements.Add(@{ id = $Name; width = $width; height = $height; availableWidth = $availableWidth; availableHeight = $availableHeight; overflow = ($width -gt $availableWidth + 2 -or $height -gt $availableHeight + 2) })
}

function Test-Page($SlideToCheck, $PageToCheck) {
    $allText = [Collections.Generic.List[string]]::new()
    foreach ($shape in $SlideToCheck.Shapes) {
        if ($shape.HasTable) {
            for ($row = 1; $row -le $shape.Table.Rows.Count; $row++) {
                for ($column = 1; $column -le $shape.Table.Columns.Count; $column++) {
                    $cell = $shape.Table.Cell($row, $column).Shape
                    $allText.Add($cell.TextFrame.TextRange.Text)
                    Test-TextBounds $cell "$($PageToCheck.id)/table/$row/$column"
                }
            }
        } elseif ($shape.HasTextFrame -and $shape.TextFrame.HasText) {
            $allText.Add($shape.TextFrame.TextRange.Text)
            Test-TextBounds $shape "$($PageToCheck.id)/$($shape.Name)"
        }
        if ($shape.Left -lt -2 -or $shape.Top -lt -2 -or $shape.Left + $shape.Width -gt 962 -or $shape.Top + $shape.Height -gt 542) { throw "Shape outside slide: $($PageToCheck.id)/$($shape.Name)" }
    }
    $normalized = ($allText -join "`n") -replace '\s', ''
    $atoms = @($PageToCheck.title; foreach ($block in $PageToCheck.blocks) {
        if ($block.kind -eq 'table') { foreach ($row in $block.rows) { foreach ($cell in $row) { $cell } } }
        elseif ($block.kind -eq 'list') { $block.items }
        else { $block.text }
    })
    foreach ($atom in $atoms) {
        $expected = (Get-Display $atom) -replace '\s', ''
        if (!$normalized.Contains($expected)) { throw "Missing source text on $($PageToCheck.id): $atom" }
    }
    $noteText = ($SlideToCheck.NotesPage.Shapes | Where-Object { $_.Type -eq 14 -and $_.PlaceholderFormat.Type -eq 2 }).TextFrame.TextRange.Text
    if (!$noteText.Contains($sourceHash)) { throw 'Missing source hash in notes' }
    foreach ($citation in $script:citations) {
        if (!$noteText.Contains($citation.url)) { throw 'Missing complete citation URL in notes' }
        $linkShape = $SlideToCheck.Shapes.Item("citation:$($citation.number)")
        if (!$linkShape.TextFrame.TextRange.ActionSettings.Item(1).Hyperlink.Address) { throw 'Missing clickable citation' }
    }
    $checks.Add(@{ slide = $PageToCheck.id; projectionAtoms = $atoms.Count; sourceText = 'exact, with numbered citation labels'; nativeTablesAndDiagrams = $true; citations = $script:citations.Count; notes = 'present' })
}

$app = New-Object -ComObject PowerPoint.Application
$deck = $null
try {
    $deck = $app.Presentations.Open($templatePath, -1, 0, 0)
    if ($deck.PageSetup.SlideWidth -ne 960 -or $deck.PageSetup.SlideHeight -ne 540) { throw 'Unexpected template dimensions' }
    $deck.SaveAs($outputPath, 24)
    $deck.Slides.Item(2).Export((Join-Path $verification 'template-body.png'), 'PNG', 1600, 900)
    for ($index = $deck.Slides.Count; $index -ge 1; $index--) { if ($index -ne 2) { $deck.Slides.Item($index).Delete() } }
    $base = $deck.Slides.Item(1)
    for ($index = $base.Shapes.Count; $index -ge 1; $index--) {
        if ($base.Shapes.Item($index).Id -notin @(2, 3, 4, 6)) { $base.Shapes.Item($index).Delete() }
    }
    for ($index = 1; $index -lt $pages.Count; $index++) { [void]$base.Duplicate() }
    $citationsByPage = @{}
    for ($pageIndex = 0; $pageIndex -lt $pages.Count; $pageIndex++) {
        $script:page = $pages[$pageIndex]
        $script:slide = $deck.Slides.Item($pageIndex + 1)
        $script:tableBreaks = @{}
        $script:citations = [Collections.Generic.List[object]]::new()
        [void](Get-Display $page.body)
        $citationsByPage[$page.id] = $script:citations
        Set-Style $slide.Shapes.Item('TextBox 2') $page.title 26 $ink
        Set-Style $slide.Shapes.Item('TextBox 5') ([string]($pageIndex + 1)) 10 $muted
        Write-Block 0 @(46, 77, 868, 43) 16
        $layoutIndex = if ($pageIndex -eq 4) { -1 } elseif ($pageIndex -gt 4) { $pageIndex - 1 } else { $pageIndex }
        switch ($layoutIndex) {
            -1 {
                $script:tableBreaks = @{ '3:1' = @('メッセージ'); '5:2' = @('WebSocket'); '5:3' = @('WebSocket') }
                Add-Table $page.blocks[1].rows @(46, 134, 868, 234) @(190, 221, 221, 236) @(32, 51, 61, 43, 47) 14
                Write-Block 2 @(46, 383, 868, 42) 14
                Write-Block 3 @(46, 432, 868, 41) 14
                Write-Block 4 @(46, 477, 868, 22) 14 $blue
            }
            0 {
                $rows = $page.blocks[1].rows
                [void](Add-Text 'source:column-heading:0' $rows[0][0] @(46, 122, 120, 20) 11 $muted)
                [void](Add-Text 'source:column-heading:1' $rows[0][1] @(46, 253, 200, 20) 11 $muted)
                $locations = @('今回: ローカル PC', 'Azure', '実行場所は任意')
                for ($column = 0; $column -lt 3; $column++) {
                    $left = 46 + $column * 304
                    [void](Add-Text "diagram:location:$column" $locations[$column] @($left, 145, 260, 23) 13 $muted $false 2)
                    [void](Add-Node "source:role:$column" $rows[$column + 1][0] @($left, 183, 260, 59) 17)
                    $duty = $rows[$column + 1][1].Replace('。', "。`n").Replace('、', "、`n").Trim()
                    [void](Add-Text "source:duty:$column" $duty @($left, 281, 260, 81) 16)
                }
                Add-Line 306 212 350 212
                Add-Line 610 212 654 212
                [void](Add-Text 'diagram:send-label' '温度・湿度を送信' @(251, 169, 164, 18) 11 $muted $false 2)
                [void](Add-Text 'diagram:receive-label' '受信アプリが読み取り' @(553, 169, 165, 18) 11 $muted $false 2)
                Write-Block 2 @(46, 376, 868, 59) 15
                Write-Block 3 @(46, 449, 868, 29) 17 $blue
                [void](Add-Text 'diagram:scope' '保存・分析は今回の受信確認とは別' @(654, 356, 260, 20) 11 $muted)
            }
            1 {
                $rows = $page.blocks[1].rows
                [void](Add-Text 'diagram:phase:0' 'クラウド側の準備' @(46, 126, 335, 22) 14 $blue)
                [void](Add-Text 'diagram:phase:1' 'アプリの準備' @(401, 126, 157, 22) 14 $blue)
                [void](Add-Text 'diagram:phase:2' '実行と確認' @(578, 126, 336, 22) 14 $blue)
                [void](Add-Text 'source:heading:0' $rows[0][0] @(46, 151, 250, 18) 11 $muted)
                [void](Add-Text 'source:heading:1' $rows[0][1] @(46, 228, 450, 18) 11 $muted)
                [void](Add-Text 'source:heading:2' $rows[0][2] @(46, 334, 500, 18) 11 $muted)
                for ($column = 0; $column -lt 5; $column++) {
                    $left = 46 + $column * 177.5
                    [void](Add-Node "source:step:$column" $rows[$column + 1][0] @($left, 175, 158, 44) 14)
                    $actor = $rows[$column + 1][1].Replace('IDと認証方式', "`nIDと認証方式").Replace('アプリが起動し、', "アプリが`n起動し、").Replace('認証を伴う', "`n認証を伴う")
                    $result = $rows[$column + 1][2].Replace('デバイスの情報', "`nデバイスの情報")
                    [void](Add-Text "source:actor:$column" $actor @($left, 253, 158, 75) 15)
                    [void](Add-Text "source:result:$column" $result @($left, 359, 158, 52) 14)
                    if ($column -lt 4) { Add-Line ($left + 158) 197 ($left + 177.5) 197 }
                }
                Write-Block 2 @(46, 423, 868, 38) 14
                Write-Block 3 @(46, 470, 650, 25) 15 $blue
                [void](Add-Text 'diagram:not-connected' '登録済み ≠ 接続中' @(737, 470, 177, 24) 14 $ink $true)
            }
            2 {
                [void](Add-Node 'diagram:registry' "Hub 側`r登録済みのIDと認証方式" @(46, 139, 258, 70) 16)
                [void](Add-Node 'diagram:application' "アプリ側`r接続先・ID・資格情報" @(46, 251, 258, 60) 16)
                Add-Line 66 209 66 251 $false
                [void](Add-Text 'diagram:identity-check' 'IDの一致だけでなく資格情報を検証' @(82, 216, 222, 32) 12 $muted)
                Add-Table $page.blocks[1].rows @(334, 132, 580, 175) @(76, 250, 254) @(30, 43, 38, 64) 13.5
                Write-Block 2 @(46, 325, 868, 53) 14 -BreakBefore 'IDを知っているだけ'
                Write-Block 3 @(46, 381, 868, 23) 13
                [void](Add-Box 'diagram:code-background' @(46, 408, 652, 63))
                Write-Block 4 @(57, 414, 632, 54) 15
                [void](Add-Text 'diagram:single-line' '実際は1行で設定' @(715, 426, 199, 24) 13 $muted)
                Write-Block 5 @(46, 475, 868, 24) 14 $blue
            }
            3 {
                Add-Table $page.blocks[1].rows @(46, 126, 868, 147) @(120, 260, 488) @(32, 38, 39, 38) 14
                [void](Add-Node 'diagram:device' 'デバイス側' @(46, 304, 180, 38) 16)
                [void](Add-Node 'diagram:hub' 'IoT Hub' @(396, 304, 160, 38) 16)
                [void](Add-Node 'diagram:service' 'サービス側' @(734, 304, 180, 38) 16)
                Add-Line 226 323 396 323
                Add-Line 734 323 556 323
                [void](Add-Text 'diagram:device-credential' 'デバイス固有の資格情報' @(226, 280, 170, 22) 11.5 $muted $false 2)
                [void](Add-Text 'diagram:service-credential' 'サービス側の認証と権限' @(556, 280, 178, 22) 11.5 $muted $false 2)
                [void](Add-Text 'diagram:tls-device' 'TLSで通信経路を暗号化' @(226, 346, 170, 23) 11.5 $muted $false 2)
                [void](Add-Text 'diagram:tls-service' 'TLSで通信経路を暗号化' @(556, 346, 178, 23) 11.5 $muted $false 2)
                Write-Block 2 @(46, 375, 868, 69) 14 -BreakBefore 'デバイス管理・操作', 'Entra ID認証は'
                Write-Block 3 @(46, 452, 868, 45) 15 $blue
            }
            4 {
                Write-Block 1 @(46, 126, 868, 42) 14
                $labels = @('デバイスアプリ', 'デバイス SDK', '通信プロトコル: MQTTなど', 'IoT Hub')
                for ($index = 0; $index -lt 4; $index++) {
                    [void](Add-Node "diagram:layer:$index" $labels[$index] @(46, (183 + $index * 65), 247, 44) 14)
                    if ($index -lt 3) { Add-Line 170 (227 + $index * 65) 170 (248 + $index * 65) }
                }
                Add-Table $page.blocks[2].rows @(325, 183, 589, 239) @(335, 254) @(31, 52, 52, 52, 52) 14
                [void](Add-Text 'diagram:next-endpoint' '読み取り口は03-08で確認' @(657, 430, 257, 20) 11 $muted)
                Write-Block 3 @(46, 461, 868, 36) 14
            }
            5 {
                Write-Block 1 @(46, 127, 868, 27) 14
                [void](Add-Box 'diagram:payload-background' @(46, 172, 445, 79))
                Write-Block 2 @(61, 192, 417, 42) 20
                [void](Add-Text 'diagram:units' 'temperature: 摂氏 / humidity: 相対湿度%' @(46, 261, 445, 23) 13 $muted)
                Write-Block 3 @(532, 174, 382, 159) 15
                $labels = @('接続', 'start', '送信')
                for ($index = 0; $index -lt 3; $index++) {
                    [void](Add-Node "diagram:demo:$index" $labels[$index] @((46 + $index * 160), 299, 125, 36) 15)
                    if ($index -lt 2) { Add-Line (171 + $index * 160) 317 (206 + $index * 160) 317 }
                }
                Write-Block 4 @(46, 360, 868, 56) 16
                Write-Block 5 @(46, 434, 868, 58) 15 $blue
            }
            6 {
                [void](Add-Text 'source:condition' $page.blocks[1].items[2] @(46, 129, 868, 48) 15)
                [void](Add-Box 'diagram:hub-boundary' @(306, 195, 324, 130) $white $true)
                [void](Add-Text 'diagram:hub-label' 'IoT Hub' @(322, 207, 280, 26) 18)
                [void](Add-Node 'diagram:device' 'デバイスアプリ' @(46, 254, 183, 43) 16)
                [void](Add-Node 'diagram:endpoint' "組み込みエンドポイント`rmessages/events" @(389, 246, 225, 59) 14)
                [void](Add-Node 'diagram:receiver' '受信アプリ・ツール' @(733, 254, 181, 43) 15)
                Add-Line 229 275 306 275
                Add-Line 321 275 389 275
                Add-Line 614 275 733 275
                [void](Add-Text 'diagram:send' 'D2Cの送信' @(231, 240, 75, 20) 11 $muted)
                [void](Add-Text 'diagram:internal-delivery' '内部の配送' @(318, 250, 69, 20) 11 $muted)
                [void](Add-Text 'diagram:read' "Event Hubs互換`rの経路で読み取り" @(632, 210, 105, 42) 11.5 $muted)
                [void](Add-Text 'source:endpoint' $page.blocks[1].items[0] @(46, 339, 868, 30) 15)
                [void](Add-Text 'source:no-extra-resource' $page.blocks[1].items[1] @(46, 376, 868, 26) 15)
                Write-Block 2 @(46, 409, 868, 37) 14
                Write-Block 3 @(46, 454, 868, 43) 15 $blue
            }
            7 {
                $script:tableBreaks = @{ '2:1' = @('メタデータ') }
                Write-Block 1 @(46, 132, 426, 26) 14 $muted
                Write-Block 3 @(518, 132, 396, 43) 13 $muted
                [void](Add-Box 'diagram:log-background' @(46, 184, 430, 122))
                Write-Block 2 @(57, 203, 409, 92) 14
                Add-Table $page.blocks[4].rows @(518, 184, 396, 122) @(152, 244) @(30, 46, 46) 13
                Add-Line 478 267 516 267 $false
                Write-Block 5 @(46, 321, 868, 44) 14
                $states = @('送信処理の成功', '受信側で確認', '保存・業務処理: 未確認')
                for ($index = 0; $index -lt 3; $index++) {
                    [void](Add-Node "diagram:observation:$index" $states[$index] @((46 + $index * 304), 373, 260, 33) 13)
                }
                Write-Block 6 @(46, 416, 868, 44) 15 $blue -BreakBefore '受信表示を確認しても'
                Write-Block 7 @(46, 466, 868, 31) 13.5
            }
            8 {
                [void](Add-Node 'diagram:device' 'デバイスアプリ' @(46, 160, 190, 38) 16)
                [void](Add-Node 'diagram:hub' 'IoT Hub' @(386, 160, 190, 38) 16)
                [void](Add-Node 'diagram:backend' 'バックエンド' @(722, 160, 190, 38) 16)
                Add-Line 236 179 386 179
                Add-Line 576 179 722 179
                [void](Add-Text 'diagram:d2c' 'D2C' @(249, 133, 128, 22) 13 $muted $false 2)
                [void](Add-Text 'diagram:read' '読み取り' @(584, 133, 130, 22) 13 $muted $false 2)
                Add-Line 750 198 750 215 $false
                Add-Line 750 215 600 215 $false
                Add-Line 600 215 600 189 $false
                Add-Line 600 189 576 189
                Add-Line 386 189 365 189 $false
                Add-Line 365 189 365 215 $false
                Add-Line 365 215 211 215 $false
                Add-Line 211 215 211 198
                [void](Add-Text 'diagram:operation-left' '操作要求の方向' @(223, 229, 150, 20) 12 $muted)
                [void](Add-Text 'diagram:operation-right' '操作要求の方向' @(608, 191, 135, 20) 11 $muted)
                Add-Line 465 198 465 252 $false $blue
                Add-Line 465 252 722 252 $true $blue
                [void](Add-Node 'diagram:routed' '後続の宛先' @(722, 235, 190, 34) 14)
                [void](Add-Text 'diagram:routing' 'ルーティング' @(531, 228, 180, 20) 12 $blue)
                Add-Table $page.blocks[1].rows @(46, 289, 868, 161) @(251, 499, 118) @(29, 33, 33, 33, 33) 13
                Write-Block 2 @(46, 466, 868, 31) 14
            }
            9 {
                $script:tableBreaks = @{ '4:4' = @('小容量で評価') }
                [void](Add-Text 'diagram:available' '今回の機能を利用可能: Standard / Free' @(457, 124, 457, 23) 14 $blue)
                Add-Table $page.blocks[1].rows @(46, 158, 868, 180) @(278, 160, 205, 225) @(32, 40, 49, 59) 14
                Write-Block 2 @(46, 357, 868, 65) 15 -BreakBefore '**Freeは'
                Write-Block 3 @(46, 433, 868, 45) 16 $blue
                [void](Add-Text 'diagram:capacity' '台数 × 送信頻度 × メッセージサイズ → 容量設計は第7章' @(46, 482, 868, 18) 11 $muted)
            }
            10 {
                [void](Add-Text 'source:question:0' $page.blocks[1].items[0] @(46, 147, 868, 64) 19)
                [void](Add-Text 'source:question:1' $page.blocks[1].items[1] @(46, 223, 868, 64) 19)
                [void](Add-Text 'source:question:2' ($page.blocks[1].items[2].Replace('次に送信を停止したい場合', "`n次に送信を停止したい場合")) @(46, 299, 868, 85) 19)
                [void](Add-Node 'diagram:device' 'デバイス' @(135, 403, 190, 39) 16)
                [void](Add-Node 'diagram:hub' 'IoT Hub' @(386, 403, 190, 39) 16)
                [void](Add-Node 'diagram:backend' 'バックエンド' @(637, 403, 190, 39) 16)
                Add-Line 325 422 386 422
                Add-Line 576 422 637 422
                Write-Block 2 @(46, 473, 868, 27) 16 $blue
            }
        }
        Add-Citations
        $noteShape = $slide.NotesPage.Shapes | Where-Object { $_.Type -eq 14 -and $_.PlaceholderFormat.Type -eq 2 } | Select-Object -First 1
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
    if ($deck.Slides.Count -ne $pages.Count) { throw 'Reopened slide count mismatch' }
    for ($index = 0; $index -lt $pages.Count; $index++) {
        $script:citations = $citationsByPage[$pages[$index].id]
        Test-Page $deck.Slides.Item($index + 1) $pages[$index]
    }
    if ((Get-FileHash $templatePath -Algorithm SHA256).Hash -ne $templateHash) { throw 'Template was modified' }
    $overflows = @($measurements | Where-Object overflow)
    @{
        source = $sourcePath; sourceSHA256 = $sourceHash; template = $templatePath; templateSHA256 = $templateHash
        templateUnchanged = $true; sourceUnchanged = ((Get-FileHash $sourcePath -Algorithm SHA256).Hash -eq $sourceHash)
        output = $outputPath; outputSHA256 = (Get-FileHash $outputPath -Algorithm SHA256).Hash
        slideCount = $pages.Count; totalSeconds = $totalSeconds; reopenedInPowerPoint = $true
        sourceChecks = $checks.ToArray(); textMeasurements = $measurements.ToArray(); tolerancePt = 2; overflowCount = $overflows.Count
    } | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 (Join-Path $verification 'validation.json')
    if ($overflows.Count) {
        $overflows | Select-Object id, width, availableWidth, height, availableHeight | Format-Table
        throw "Text overflow candidates: $($overflows.Count). Review rendered images."
    }
    "PASS: $($pages.Count) slides; full projection text, native objects, citations and notes verified; reopened in PowerPoint; no text overflow."
} finally {
    if ($deck) { $deck.Close(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($deck) }
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}
& (Join-Path $PSScriptRoot 'verify-slides.ps1') -Presentation $outputPath -Source $sourcePath -Report (Join-Path $verification 'structure.json')