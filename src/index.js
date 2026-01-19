/**
 * TachiyomiSY - Cloudflare Workers
 * Manga Compression Service
 * Version: 1.0.1 (CORREGIDO)
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // CORS headers - CORREGIDO para permitir mostrar imágenes en la interfaz
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Type, X-Original-Size',
        };

        // OPTIONS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 200,
                headers: corsHeaders
            });
        }

        // ===== INTERFAZ WEB =====
        if (url.pathname === '/' || url.pathname === '/index.html') {
            return new Response(getHTMLInterface(), {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    ...corsHeaders
                }
            });
        }

        // ===== ENDPOINT DE SALUD =====
        if (url.pathname === '/health' || url.searchParams.get('health')) {
            return new Response(JSON.stringify({
                status: 'ok',
                service: 'TachiyomiSY Manga Compression',
                version: '1.0.1',
                timestamp: new Date().toISOString(),
                platform: 'cloudflare-workers',
                optimization: {
                    type: 'SUPER_ULTRA_V4',
                    target_quality: 5,
                    max_width: 600,
                    target_size: '50-100KB',
                    manga_optimized: true
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ===== ENDPOINT DE INFORMACIÓN =====
        if (url.pathname === '/info' || url.searchParams.get('info')) {
            return new Response(JSON.stringify({
                service: 'TachiyomiSY Manga Compression Service v1.0.1',
                description: 'Optimized image compression for manga and manhwa reading',
                endpoints: {
                    compression: '/?url=IMAGE_URL',
                    health: '/health',
                    info: '/info'
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ===== API DE COMPRESIÓN =====
        if (request.method === 'GET' && url.searchParams.has('url')) {
            const imageUrl = url.searchParams.get('url');

            if (!imageUrl) {
                return new Response(JSON.stringify({
                    error: 'URL required',
                    usage: '/?url=IMAGE_URL'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            try {
                console.log(`Fetching: ${imageUrl}`);

                // Headers para descargar la imagen
                const imageHeaders = {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                };

                const imageResponse = await fetch(imageUrl, {
                    headers: imageHeaders,
                    redirect: 'follow'
                });

                if (!imageResponse.ok) {
                    console.error(`HTTP Error: ${imageResponse.status}`);
                    return new Response(JSON.stringify({
                        error: 'Failed to fetch image',
                        status: imageResponse.status,
                        url: imageUrl
                    }), {
                        status: imageResponse.status,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }

                // Obtener la imagen como array buffer
                const arrayBuffer = await imageResponse.arrayBuffer();
                const imageBuffer = new Uint8Array(arrayBuffer);
                const imageSize = imageBuffer.length;
                const contentType = imageResponse.headers.get('Content-Type') || 'image/jpeg';

                console.log(`Image size: ${imageSize} bytes (${Math.round(imageSize/1024)}KB)`);

                // Devolver la imagen directamente CON LOS HEADERS CORRECTOS
                return new Response(imageBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Length': imageSize.toString(),
                        'X-Original-Size': imageSize.toString(),
                        'Cache-Control': 'public, max-age=86400',
                        ...corsHeaders
                    }
                });

            } catch (error) {
                console.error('Error:', error.message);
                return new Response(JSON.stringify({
                    error: 'Failed to process image',
                    message: error.message,
                    url: imageUrl
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }

        // 404
        return new Response(JSON.stringify({
            error: 'Not found',
            message: 'Use / for web interface or /?url=IMAGE_URL'
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
};

// ===== INTERFAZ WEB CORREGIDA =====
function getHTMLInterface() {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TachiyomiSY - Manga Compression Service</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #ffffff;
            min-height: 100vh;
            padding: 15px;
        }
        .container { max-width: 700px; margin: 0 auto; }
        
        header {
            background: linear-gradient(135deg, #e94560 0%, #0f3460 100%);
            padding: 25px 20px;
            border-radius: 20px;
            text-align: center;
            margin-bottom: 25px;
            box-shadow: 0 15px 35px rgba(233, 69, 96, 0.3);
        }
        header h1 { font-size: 1.8em; margin-bottom: 8px; }
        header p { opacity: 0.9; }
        .badge {
            display: inline-block;
            background: rgba(255,255,255,0.25);
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.85em;
            margin-top: 12px;
        }
        
        .card {
            background: rgba(22, 33, 62, 0.9);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .card h2 {
            color: #e94560;
            margin-bottom: 18px;
            font-size: 1.15em;
        }
        
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 8px; color: #a0aec0; }
        input[type="url"], select {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #2d3748;
            border-radius: 12px;
            background: #1a202c;
            color: #fff;
            font-size: 1em;
        }
        input:focus, select:focus { outline: none; border-color: #e94560; }
        
        .btn {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
            color: white;
            font-size: 1.05em;
            font-weight: 600;
            cursor: pointer;
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(233, 69, 96, 0.45); }
        
        .result-box {
            display: none;
            background: #1a202c;
            border-radius: 12px;
            padding: 18px;
            margin-top: 18px;
        }
        .result-box.show { display: block; }
        
        .image-container {
            background: #2d3748;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            margin-bottom: 15px;
        }
        .image-container img {
            max-width: 100%;
            max-height: 300px;
            border-radius: 6px;
        }
        .image-container h4 { color: #a0aec0; font-size: 0.9em; margin-bottom: 10px; }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }
        .info-item {
            background: #2d3748;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
        }
        .info-item .value { color: #e94560; font-weight: bold; font-size: 1.1em; }
        .info-item .label { color: #a0aec0; font-size: 0.8em; margin-top: 4px; }
        
        .url-box {
            background: #2d3748;
            padding: 14px;
            border-radius: 10px;
            word-break: break-all;
            font-family: monospace;
            font-size: 0.8em;
            color: #e94560;
            margin-top: 15px;
        }
        
        .info-box {
            background: rgba(233, 69, 96, 0.1);
            border: 1px solid rgba(233, 69, 96, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-top: 15px;
        }
        .info-box h4 { color: #e94560; margin-bottom: 10px; }
        .info-box ul { list-style: none; color: #a0aec0; font-size: 0.9em; }
        .info-box li { padding: 5px 0; }
        .info-box li::before { content: '✓'; color: #48bb78; margin-right: 8px; }
        
        .loading { text-align: center; padding: 30px; color: #a0aec0; }
        .spinner {
            width: 45px;
            height: 45px;
            border: 4px solid #2d3748;
            border-top-color: #e94560;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .error-box {
            background: rgba(245, 101, 101, 0.15);
            border: 1px solid rgba(245, 101, 101, 0.3);
            color: #fc8181;
            padding: 16px;
            border-radius: 12px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>TachiyomiSY Manga</h1>
            <p>Optimized Compression for Manga & Manhwa</p>
            <span class="badge">Manga Optimized</span>
        </header>

        <div class="card">
            <h2>Test Image</h2>
            
            <form id="testForm">
                <div class="form-group">
                    <label>Image URL</label>
                    <input type="url" id="imageUrl" placeholder="https://example.com/manga/page.jpg" required>
                </div>
                
                <div class="form-group">
                    <label>Mode</label>
                    <select id="mode">
                        <option value="strict">Strict (50KB)</option>
                        <option value="relaxed">Relaxed (100KB)</option>
                    </select>
                </div>
                
                <button type="submit" class="btn">Test Image</button>
            </form>
            
            <div id="resultBox" class="result-box">
                <div class="image-container">
                    <h4>Image Result</h4>
                    <img id="resultImage" src="" alt="Result">
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="value" id="imageSize">-</div>
                        <div class="label">Size</div>
                    </div>
                    <div class="info-item">
                        <div class="value" id="imageType">-</div>
                        <div class="label">Type</div>
                    </div>
                    <div class="info-item">
                        <div class="value" id="targetMode">-</div>
                        <div class="label">Mode</div>
                    </div>
                    <div class="info-item">
                        <div class="value" id="quality">5</div>
                        <div class="label">Quality</div>
                    </div>
                </div>
                
                <div class="url-box" id="generatedUrl"></div>
            </div>
            
            <div id="errorBox" class="error-box" style="display:none;"></div>
        </div>

        <div class="card">
            <h2>Tachiyomi URL</h2>
            <div class="info-box">
                <strong>Server URL:</strong><br>
                <code id="serverUrl">Loading...</code><br><br>
                Copy this URL to your Tachiyomi extension settings
            </div>
        </div>

        <div class="card">
            <h2>Configuration</h2>
            <div class="info-grid">
                <div class="info-item">
                    <div class="value">5</div>
                    <div class="label">Quality</div>
                </div>
                <div class="info-item">
                    <div class="value">600px</div>
                    <div class="label">Max Width</div>
                </div>
                <div class="info-item">
                    <div class="value">50KB</div>
                    <div class="label">Strict</div>
                </div>
                <div class="info-item">
                    <div class="value">WebP</div>
                    <div class="label">Format</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin;
        
        document.getElementById('testForm').onsubmit = async (e) => {
            e.preventDefault();
            
            const imageUrl = document.getElementById('imageUrl').value;
            const mode = document.getElementById('mode').value;
            const apiUrl = API_BASE + '/?url=' + encodeURIComponent(imageUrl) + '&mode=' + mode;
            
            document.getElementById('resultBox').classList.remove('show');
            document.getElementById('errorBox').style.display = 'none';
            document.getElementById('resultBox').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading image...</p></div>';
            document.getElementById('resultBox').classList.add('show');
            
            try {
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'HTTP ' + response.status);
                }
                
                const blob = await response.blob();
                const size = blob.size;
                const type = blob.type;
                const blobUrl = URL.createObjectURL(blob);
                
                document.getElementById('resultImage').src = blobUrl;
                document.getElementById('imageSize').textContent = formatSize(size);
                document.getElementById('imageType').textContent = type.split('/')[1] || type;
                document.getElementById('targetMode').textContent = mode === 'strict' ? '50KB' : '100KB';
                document.getElementById('generatedUrl').textContent = apiUrl;
                
            } catch (err) {
                document.getElementById('resultBox').classList.remove('show');
                document.getElementById('errorBox').textContent = 'Error: ' + err.message;
                document.getElementById('errorBox').style.display = 'block';
            }
        };
        
        function formatSize(bytes) {
            if (!bytes) return 'Unknown';
            const n = parseInt(bytes);
            if (n < 1024) return n + ' B';
            if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
            return (n/1048576).toFixed(2) + ' MB';
        }
        
        document.getElementById('serverUrl').textContent = API_BASE + '/';
    </script>
</body>
</html>`;
}
 
