param(
  [string]$Pptx = (Join-Path $PSScriptRoot 'slides/v3/v3-03-iot-hub-basics-opus.pptx'),
  [string]$OutDir = (Join-Path $PSScriptRoot 'slides/v3/verification')
)
$ErrorActionPreference = 'Stop'
$pptxPath = (Resolve-Path $Pptx).Path
[void][IO.Directory]::CreateDirectory($OutDir)
$OutDir = (Resolve-Path $OutDir).Path
$ppt = New-Object -ComObject PowerPoint.Application
try {
  $deck = $ppt.Presentations.Open($pptxPath, $true, $false, $false)
  for ($i = 1; $i -le $deck.Slides.Count; $i++) {
    $png = Join-Path $OutDir ("03-{0:D2}.png" -f $i)
    $deck.Slides.Item($i).Export($png, 'PNG', 1600, 900)
  }
  $deck.SaveAs([IO.Path]::ChangeExtension($pptxPath, '.pdf'), 32)
  $deck.Close()
  "OK slides=$($deck.Slides.Count)"
} finally {
  $ppt.Quit()
  [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
