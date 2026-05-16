$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$imagesDir = Join-Path $PSScriptRoot "..\images"
$maxEdge = 1920
$avatarMax = 900
$jpegQuality = 82L
$avatarFile = "证件照 蓝底.jpg"

function Format-Bytes([long]$n) {
    if ($n -lt 1KB) { return "$n B" }
    if ($n -lt 1MB) { return "{0:N1} KB" -f ($n / 1KB) }
    return "{0:N2} MB" -f ($n / 1MB)
}

function Get-Encoder($mime) {
    $encoders = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()
    foreach ($e in $encoders) {
        if ($e.MimeType -eq $mime) { return $e }
    }
    return $null
}

function Save-Jpeg($bitmap, $path, $quality) {
    $encoder = Get-Encoder "image/jpeg"
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, $quality
    )
    $bitmap.Save($path, $encoder, $ep)
    $ep.Dispose()
}

function Resize-Bitmap($src, $maxSide) {
    $w = $src.Width
    $h = $src.Height
    if ($w -le $maxSide -and $h -le $maxSide) {
        return $src.Clone()
    }
    $scale = [Math]::Min($maxSide / $w, $maxSide / $h)
    $nw = [int][Math]::Round($w * $scale)
    $nh = [int][Math]::Round($h * $scale)
    $bmp = New-Object System.Drawing.Bitmap $nw, $nh
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $nw, $nh)
    $g.Dispose()
    return $bmp
}

$files = Get-ChildItem -Path $imagesDir -File | Where-Object {
    $_.Extension -match '^\.(jpe?g|png)$'
}

$beforeTotal = 0L
$afterTotal = 0L
$pngToJpg = @()

foreach ($file in $files) {
    $inputPath = $file.FullName
    $before = $file.Length
    $beforeTotal += $before
  $maxSide = if ($file.Name -eq $avatarFile) { $avatarMax } else { $maxEdge }

    $img = [System.Drawing.Image]::FromFile($inputPath)
    try {
        $oriented = $img
        if ($img.PropertyIdList -contains 274) {
            $orient = $img.GetPropertyItem(274).Value[0]
            switch ($orient) {
                2 { $oriented = $img.Clone(); $oriented.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
                3 { $oriented = $img.Clone(); $oriented.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
                4 { $oriented = $img.Clone(); $oriented.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
                5 { $oriented = $img.Clone(); $oriented.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
                6 { $oriented = $img.Clone(); $oriented.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
                7 { $oriented = $img.Clone(); $oriented.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
                8 { $oriented = $img.Clone(); $oriented.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
            }
        }

        $resized = Resize-Bitmap $oriented $maxSide
        if ($oriented -ne $img) { $oriented.Dispose() }

        $tempPath = $inputPath + ".tmp"
        $isPng = $file.Extension -eq ".png"
        $hasAlpha = $isPng -and ($resized.PixelFormat -match "32")

        if ($isPng -and $hasAlpha) {
            $resized.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $outPath = $inputPath
        }
        else {
            Save-Jpeg $resized $tempPath $jpegQuality
            if ($isPng) {
                $outPath = [System.IO.Path]::ChangeExtension($inputPath, ".jpg")
                $pngToJpg += @{ Old = $file.Name; New = [System.IO.Path]::GetFileName($outPath) }
            }
            else {
                $outPath = $inputPath
            }
        }

        $resized.Dispose()
        $img.Dispose()

        if (Test-Path $inputPath) { Remove-Item -LiteralPath $inputPath -Force }
        Move-Item -LiteralPath $tempPath -Destination $outPath -Force

        $after = (Get-Item -LiteralPath $outPath).Length
        $afterTotal += $after
        $pct = if ($before -gt 0) { [int]((1 - $after / $before) * 100) } else { 0 }
        $label = if ($outPath -ne $inputPath) { "$($file.Name) -> $([IO.Path]::GetFileName($outPath))" } else { $file.Name }
        Write-Host "  $label : $(Format-Bytes $before) -> $(Format-Bytes $after) (-$pct%)"
    }
    finally {
        if ($img) { $img.Dispose() }
    }
}

Write-Host ""
Write-Host "合计: $(Format-Bytes $beforeTotal) -> $(Format-Bytes $afterTotal)"
if ($pngToJpg.Count -gt 0) {
    Write-Host ""
    Write-Host "以下 PNG 已转为 JPG，请更新 index.html 中的路径:"
    $pngToJpg | ForEach-Object { Write-Host "  $($_.Old) -> $($_.New)" }
}
