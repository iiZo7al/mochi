param(
  [string]$IconPath = "src-tauri/icons/icon.ico",
  [string]$OutputDirectory = "src-tauri/installer"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $IconPath -Parent) | Out-Null

function New-RoundedPath {
  param(
    [System.Drawing.RectangleF]$Rectangle,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($Rectangle.X, $Rectangle.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($Rectangle.X, $Rectangle.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-MochiLogoBitmap {
  param([int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $scale = $Size / 256.0
    $cardRect = New-Object System.Drawing.RectangleF (18*$scale), (18*$scale), (220*$scale), (220*$scale)
    $cardPath = New-RoundedPath $cardRect (48*$scale)

    $cardBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,13,13,16))
    $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,68,68,78)), (4*$scale)

    $graphics.FillPath($cardBrush, $cardPath)
    $graphics.DrawPath($borderPen, $cardPath)

    $mPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255,246,246,248)), (22*$scale)
    $mPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $mPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $mPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    $points = @(
      (New-Object System.Drawing.PointF (70*$scale), (184*$scale)),
      (New-Object System.Drawing.PointF (70*$scale), (86*$scale)),
      (New-Object System.Drawing.PointF (128*$scale), (145*$scale)),
      (New-Object System.Drawing.PointF (186*$scale), (86*$scale)),
      (New-Object System.Drawing.PointF (186*$scale), (184*$scale))
    )
    $graphics.DrawLines($mPen, $points)

    $dotBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255,235,235,239))
    $graphics.FillEllipse($dotBrush, (180*$scale), (59*$scale), (12*$scale), (12*$scale))

    $dotBrush.Dispose()
    $mPen.Dispose()
    $borderPen.Dispose()
    $cardBrush.Dispose()
    $cardPath.Dispose()
  }
  finally {
    $graphics.Dispose()
  }

  return $bitmap
}

function Save-PngIconAsIco {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $pngStream = New-Object System.IO.MemoryStream
  try {
    $Bitmap.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $pngStream.ToArray()

    $fileStream = [System.IO.File]::Open($Path, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
    $writer = New-Object System.IO.BinaryWriter($fileStream)

    try {
      # ICONDIR
      $writer.Write([UInt16]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]1)

      # ICONDIRENTRY (0 means 256px for width/height).
      $writer.Write([Byte]0)
      $writer.Write([Byte]0)
      $writer.Write([Byte]0)
      $writer.Write([Byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$pngBytes.Length)
      $writer.Write([UInt32]22)

      $writer.Write($pngBytes)
    }
    finally {
      $writer.Dispose()
      $fileStream.Dispose()
    }
  }
  finally {
    $pngStream.Dispose()
  }
}

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

$logo = New-MochiLogoBitmap 256
try {
  # Generate one valid Windows application/installer icon from the same Mochi artwork.
  Save-PngIconAsIco $logo $IconPath
  $logo.Save("src-tauri/icons/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

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

    $ringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(39,39,46)), 1
    $g.DrawEllipse($ringPen, 20, 23, 124, 124)
    $g.DrawEllipse($ringPen, 37, 40, 90, 90)
    $ringPen.Dispose()

    $g.DrawImage($logo, 36, 38, 92, 92)

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

    $g.DrawImage($logo, 7, 6, 44, 44)

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
  $logo.Dispose()
}
