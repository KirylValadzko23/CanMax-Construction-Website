# Tiny local web server for previewing the site (no install needed).
# Serves this project folder at http://localhost:5500/
param([int]$Port = 5500)

$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$types = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'; '.json' = 'application/json'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'
  '.woff2' = 'font/woff2'; '.xml' = 'application/xml'; '.txt' = 'text/plain; charset=utf-8'
  '.webmanifest' = 'application/manifest+json'
}

$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $urlPath = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    $full = [IO.Path]::GetFullPath((Join-Path $root ($urlPath.TrimStart('/') -replace '/', '\')))

    # ($res is closed by the finally block, including on continue)
    if (-not $full.StartsWith($root)) { $res.StatusCode = 403; continue }

    # Folder without trailing slash: redirect so relative links resolve correctly
    if ((Test-Path $full -PathType Container) -and -not $urlPath.EndsWith('/')) {
      $res.StatusCode = 301
      $res.RedirectLocation = "$urlPath/"
      continue
    }
    if (Test-Path $full -PathType Container) { $full = Join-Path $full 'index.html' }

    $status = 200
    if (-not (Test-Path $full -PathType Leaf)) {
      $status = 404
      $full = Join-Path $root '404.html'
    }

    if (Test-Path $full -PathType Leaf) {
      $bytes = [IO.File]::ReadAllBytes($full)
      $type = $types[[IO.Path]::GetExtension($full).ToLower()]
      if (-not $type) { $type = 'application/octet-stream' }
    } else {
      $bytes = [Text.Encoding]::UTF8.GetBytes('404 - Page introuvable')
      $type = 'text/plain; charset=utf-8'
    }

    $res.StatusCode = $status
    $res.ContentType = $type
    $res.Headers.Add('Cache-Control', 'no-store')
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    Write-Host "$status $urlPath"
  } catch {
    Write-Host "ERROR $($_.Exception.Message)"
    try { $res.StatusCode = 500 } catch {}
  } finally {
    $res.Close()
  }
}
