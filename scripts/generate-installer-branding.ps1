param(
  [string]$IconPath = "src-tauri/icons/icon.ico",
  [string]$OutputDirectory = "src-tauri/installer"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

function New-GradientBrush {
  param(
    [System.Drawing.Rectangle]$Rectangle,
    [System.Drawing.Color]$Top,
    [System.Drawing.Color]$Bottom
  )

  return New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $Rectangle,
    $Top,
    $Bottom,
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
  )
}

function Draw-AppIcon {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Icon]$Icon,
    [int]$X,
    [int]$Y,
    [int]$Size
  )

  $bitmap = $Icon.ToBitmap()
  try {
    $Graphics.DrawImage($bitmap, $X, $Y, $Size, $Size)
  }
  finally {
    $bitmap.Dispose()
  }
}

$icon = New-Object System.Drawing.Icon((Resolve-Path $IconPath))

try {
  # NSIS sidebar: recommended 164 x 314.
  $sidebar = New-Object System.Drawing.Bitmap 164, 314
  $g = [System.Drawing.Graphics]::FromImage($sidebar)

  try {
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $rect = New-Object System.Drawing.Rectangle 0, 0, 164, 314
    $gradient = New-GradientBrush $rect ([System.Drawing.Color]::FromArgb(5,5,7)) ([System.Drawing.Color]::FromArgb(20,20,24))
    $g.FillRectangle($gradient, $rect)
    $gradient.Dispose()

    $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(38,38,45)), 1
    $g.DrawEllipse($ringPen, 21, 24, 122, 122)
    $g.DrawEllipse($ringPen, 38, 41, 88, 88)
    $ringPen.Dispose()

    Draw-AppIcon $g $icon 36 39 92

    $titleFont = New-Object System.Drawing.Font "Segoe UI Semibold", 20, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $bodyFont = New-Object System.Drawing.Font "Segoe UI", 10, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
    $tinyFont = New-Object System.Drawing.Font "Segoe UI", 9, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)

    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(246,246,248))
    $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(144,144,154))
    $soft = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(194,194,201))

    $titleFormat = New-Object System.Drawing.StringFormat
    $titleFormat.Alignment = [System.Drawing.StringAlignment]::Center

    $g.DrawString("MOCHI", $titleFont, $white, (New-Object System.Drawing.RectangleF 12, 150, 140, 32), $titleFormat)
    $g.DrawString("AI Desktop Workspace", $bodyFont, $muted, (New-Object System.Drawing.RectangleF 12, 184, 140, 24), $titleFormat)

    $cardBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(25,25,30))
    $cardPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(45,45,53)), 1
    $g.FillRectangle($cardBrush, 23, 256, 118, 32)
    $g.DrawRectangle($cardPen, 23, 256, 118, 32)
    $g.DrawString("Chats  •  Bots  •  Code", $tinyFont, $soft, (New-Object System.Drawing.RectangleF 26, 265, 112, 18), $titleFormat)

    $titleFont.Dispose()
    $bodyFont.Dispose()
    $tinyFont.Dispose()
    $white.Dispose()
    $muted.Dispose()
    $soft.Dispose()
    $cardBrush.Dispose()
    $cardPen.Dispose()
    $titleFormat.Dispose()
  }
  finally {
    $g.Dispose()
  }

  $sidebar.Save((Join-Path $OutputDirectory "installer-sidebar.bmp"), [System.Drawing.Imaging.ImageFormat]::Bmp)
  $sidebar.Dispose()

  # NSIS header: recommended 150 x 57.
  $header = New-Object System.Drawing.Bitmap 150, 57
  $g = [System.Drawing.Graphics]::FromImage($header)

  try {
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $rect = New-Object System.Drawing.Rectangle 0, 0, 150, 57
    $gradient = New-GradientBrush $rect ([System.Drawing.Color]::FromArgb(7,7,9)) ([System.Drawing.Color]::FromArgb(22,22,27))
    $g.FillRectangle($gradient, $rect)
    $gradient.Dispose()

    Draw-AppIcon $g $icon 7 6 44

    $titleFont = New-Object System.Drawing.Font "Segoe UI Semibold", 17, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $bodyFont = New-Object System.Drawing.Font "Segoe UI", 9, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(246,246,248))
    $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(150,150,160))

    $g.DrawString("Mochi", $titleFont, $white, 59, 9)
    $g.DrawString("AI Desktop Workspace", $bodyFont, $muted, 59, 33)

    $titleFont.Dispose()
    $bodyFont.Dispose()
    $white.Dispose()
    $muted.Dispose()
  }
  finally {
    $g.Dispose()
  }

  $header.Save((Join-Path $OutputDirectory "installer-header.bmp"), [System.Drawing.Imaging.ImageFormat]::Bmp)
  $header.Dispose()
}
finally {
  $icon.Dispose()
}
