param(
    [int]$port = 1234
)

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()
Write-Host "===================================================="
Write-Host " NRN PROPERTIES SERVER RUNNING ON PORT $port"
Write-Host " Local URL: http://localhost:$port/"
Write-Host " Serving from: $PSScriptRoot"
Write-Host " Ready for port forwarding on port $port!"
Write-Host "===================================================="

$root = $PSScriptRoot

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $client.ReceiveTimeout = 3000
        $client.SendTimeout = 3000
        $stream = $client.GetStream()

        $buffer = New-Object byte[] 8192
        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        if ($bytesRead -gt 0) {
            $reqStr = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $bytesRead)
            $firstLine = ($reqStr -split "`r?`n")[0]
            $parts = $firstLine -split " "
            if ($parts.Length -ge 2) {
                $rawPath = ($parts[1] -split "\?")[0].TrimStart('/')
                if ([string]::IsNullOrEmpty($rawPath)) { $rawPath = "index.html" }
                $filePath = Join-Path $root $rawPath
                if (Test-Path $filePath -PathType Container) {
                    $filePath = Join-Path $filePath "index.html"
                }

                if (Test-Path $filePath -PathType Leaf) {
                    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                    $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                    $content = [System.IO.File]::ReadAllBytes($filePath)
                    
                    $header = "HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($content.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
                    $hBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                    $stream.Write($hBytes, 0, $hBytes.Length)
                    $stream.Write($content, 0, $content.Length)
                    $stream.Flush()
                } else {
                    $notFound = [System.Text.Encoding]::UTF8.GetBytes("<html><body><h1>404 Not Found</h1></body></html>")
                    $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/html`r`nContent-Length: $($notFound.Length)`r`nConnection: close`r`n`r`n"
                    $hBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                    $stream.Write($hBytes, 0, $hBytes.Length)
                    $stream.Write($notFound, 0, $notFound.Length)
                    $stream.Flush()
                }
            }
        }
        $stream.Close()
        $client.Close()
    }
} finally {
    $listener.Stop()
}
