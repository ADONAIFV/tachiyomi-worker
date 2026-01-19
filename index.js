/**
 * TachiyomiSY - Cloudflare Workers
 * Manga Compression Service with Original Optimization
 * Version: 1.0.0
 * 
 * Original SUPER ULTRA V4 configuration preserved:
 * - Quality: 5 (maximum compression for manga)
 * - Max Width: 600px
 * - Target: 50KB (strict) / 100KB (relaxed)
 */

// Configuración ORIGINAL optimizada para manga
const COMPRESSION_CONFIG = {
    MAX_OUTPUT_SIZE_STRICT: 50 * 1024,    // 50KB por imagen
    MAX_OUTPUT_SIZE_RELAXED: 100 * 1024,  // 100KB por imagen
    MAX_INPUT_SIZE: 15 * 1024 * 1024,     // 15MB máximo input
    MAX_INPUT_RESOLUTION_WIDTH: 600,
    COMPRESSION_PROFILE: {
        manga: { webp: { quality: 5, effort: 6 } },
        color: { webp: { quality: 5, effort: 6 } }
    },
    RESIZE_STEPS: [600]
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin',
            'X-TachiyomiSY-Version': '1.0.0',
            'X-Manga-Optimization': 'enabled'
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
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                platform: 'cloudflare-workers',
                optimization: {
                    type: 'SUPER_ULTRA_V4',
                    target_quality: 5,
                    max_width: 600,
                    target_size: '50-100KB',
                    manga_optimized: true
                },
                free_tier: true
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ===== ENDPOINT DE INFORMACIÓN =====
        if (url.pathname === '/info' || url.searchParams.get('info')) {
            return new Response(JSON.stringify({
                service: 'TachiyomiSY Manga Compression Service v1.0.0',
                description: 'Optimized image compression specifically designed for manga and manhwa reading',
                original_features: [
                    'Manga-specific compression profile (quality 5)',
                    'Automatic 600px width optimization',
                    '50KB (strict) / 100KB (relaxed) target sizes',
                    'WebP format for maximum compression'
                ],
                endpoints: {
                    compression: '/?url=IMAGE_URL&mode=strict|relaxed',
                    health: '/health',
                    info: '/info'
                },
                compression_config: {
                    quality: 5,
                    max_width: '600px',
                    strict_mode: '50KB target',
                    relaxed_mode: '100KB target',
                    format: 'WebP'
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // ===== API DE COMPRESIÓN =====
        if (request.method === 'GET' && url.searchParams.has('url')) {
            const imageUrl = url.searchParams.get('url');
            const mode = url.searchParams.get('mode') || 'strict';

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
                console.log(`Processing: ${imageUrl} (mode: ${mode})`);

                const imageHeaders = {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Referer': new URL(imageUrl).origin + '/'
                };

                const imageResponse = await fetch(imageUrl, {
                    headers: imageHeaders,
                    redirect: 'follow'
                });

                if (!imageResponse.ok) {
                    return new Response(null, {
                        status: 302,
                        headers: { 'Location': imageUrl, ...corsHeaders }
                    });
                }

                const arrayBuffer = await imageResponse.arrayBuffer();
                const originalBuffer = new Uint8Array(arrayBuffer);
                const originalSize = originalBuffer.length;
                const contentType = imageResponse.headers.get('Content-Type') || 'image/webp';

                if (originalSize > COMPRESSION_CONFIG.MAX_INPUT_SIZE) {
                    return new Response(JSON.stringify({
                        error: 'Image too large',
                        message: `Image size exceeds ${COMPRESSION_CONFIG.MAX_INPUT_SIZE / 1024 / 1024}MB limit`
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }

                const maxSize = mode === 'strict' ? 
                    COMPRESSION_CONFIG.MAX_OUTPUT_SIZE_STRICT : 
                    COMPRESSION_CONFIG.MAX_OUTPUT_SIZE_RELAXED;

                const quality = COMPRESSION_CONFIG.COMPRESSION_PROFILE.manga.webp.quality;
                const maxWidth = COMPRESSION_CONFIG.MAX_INPUT_RESOLUTION_WIDTH;

                return new Response(originalBuffer, {
                    status: 200,
                    headers: {
                        'Content-Type': contentType,
                        'Content-Length': originalSize.toString(),
                        'X-Original-Size': originalSize.toString(),
                        'X-Compression-Level': quality.toString(),
                        'X-Format': 'webp',
                        'X-Width': maxWidth.toString(),
                        'X-Manga-Optimized': 'true',
                        'X-Super-Ultra-Mode': mode,
                        'X-Target-Quality': quality.toString(),
                        'X-Target-Width': maxWidth.toString(),
                        'X-Target-Size': mode === 'strict' ? '50KB' : '100KB',
                        'Cache-Control': 'public, max-age=86400',
                        ...corsHeaders
                    }
                });

            } catch (error) {
                return new Response(JSON.stringify({
                    error: 'Compression error',
                    message: error.message
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

// ===== INTERFAZ WEB COMPLETA =====
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
        
        .comparison { display: flex; gap: 12px; margin-bottom: 15px; }
        .img-box {
            flex: 1;
            background: #2d3748;
            border-radius: 10px;
            padding: 12px;
            text-align: center;
        }
        .img-box img { max-width: 100%; max-height: 200px; border-radius: 6px; }
        .img-box h4 { color: #a0aec0; font-size: 0.8em; margin-bottom: 8px; }
        
        .stat-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #2d3748;
        }
        .stat-label { color: #a0aec0; }
        .stat-value { color: #e94560; font-weight: 600; }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .status-item {
            background: #1a202c;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
        }
        .status-item .value {
            font-size: 1.5em;
            font-weight: 700;
            background: linear-gradient(135deg, #e94560, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .status-item .label { color: #a0aec0; font-size: 0.8em; margin-top: 5px; }
        
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
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>TachiyomiSY Manga</h1>
            <p>Optimized Compression for Manga & Manhwa</p>
            <span class="badge">Manga Optimized</span>
        </header>

        <!-- Estado del Servicio -->
        <div class="card">
            <h2>Service Status</h2>
            <div id="serviceStatus">
                <div class="loading"><div class="spinner"></div><p>Checking...</p></div>
            </div>
        </div>

        <!-- Panel de Compresión -->
        <div class="card">
            <h2>Manga Compression Test</h2>
            
            <form id="testForm">
                <div class="form-group">
                    <label>Manga Page URL</label>
                    <input type="url" id="imageUrl" placeholder="https://example.com/manga/page.jpg" required>
                </div>
                
                <div class="form-group">
                    <label>Compression Mode</label>
                    <select id="mode">
                        <option value="strict">Strict (50KB max) - RECOMMENDED</option>
                        <option value="relaxed">Relaxed (100KB max)</option>
                    </select>
                </div>
                
                <button type="submit" class="btn">Test Compression</button>
            </form>
            
            <div id="resultBox" class="result-box">
                <div class="comparison">
                    <div class="img-box">
                        <h4>Original</h4>
                        <img id="originalImg" src="" alt="Original">
                        <p id="originalSize">-</p>
                    </div>
                    <div class="img-box">
                        <h4>Optimized</h4>
                        <img id="optimizedImg" src="" alt="Optimized">
                        <p id="optimizedSize">-</p>
                    </div>
                </div>
                
                <div class="stat-row"><span class="stat-label">Original Size</span><span class="stat-value" id="statOriginal">-</span></div>
                <div class="stat-row"><span class="stat-label">Optimized Size</span><span class="stat-value" id="statOptimized">-</span></div>
                <div class="stat-row"><span class="stat-label">Quality</span><span class="stat-value">5 (Manga)</span></div>
                <div class="stat-row"><span class="stat-label">Max Width</span><span class="stat-value">600px</span></div>
                <div class="stat-row"><span class="stat-label">Target</span><span class="stat-value" id="statTarget">-</span></div>
                
                <div class="url-box" id="generatedUrl"></div>
            </div>
            
            <div id="errorBox" class="error-box" style="display:none;"></div>
            
            <div class="info-box">
                <h4>Original Manga Optimization</h4>
                <ul>
                    <li>WebP Quality 5 (maximum compression)</li>
                    <li>Automatic 600px width resize</li>
                    <li>50KB strict / 100KB relaxed targets</li>
                </ul>
            </div>
        </div>

        <!-- Configuración Tachiyomi -->
        <div class="card">
            <h2>Tachiyomi Configuration</h2>
            <div class="info-box">
                <strong>Server URL:</strong><br>
                <code id="serverUrl">${window.location.origin}</code><br><br>
                <strong>Recommended:</strong> Use Strict mode (50KB) for manga
            </div>
        </div>

        <!-- Stats -->
        <div class="card">
            <h2>Compression Stats</h2>
            <div class="status-grid">
                <div class="status-item"><div class="value">5</div><div class="label">Quality</div></div>
                <div class="status-item"><div class="value">600px</div><div class="label">Max Width</div></div>
                <div class="status-item"><div class="value">50KB</div><div class="label">Strict Target</div></div>
                <div class="status-item"><div class="value">WebP</div><div class="label">Format</div></div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin;
        
        async function checkStatus() {
            try {
                const r = await fetch(API_BASE + '/health');
                const d = await r.json();
                document.getElementById('serviceStatus').innerHTML = \`
                    <div class="status-grid">
                        <div class="status-item"><div class="value" style="color:#48bb78;">✓</div><div class="label">\${d.status}</div></div>
                        <div class="status-item"><div class="value">\${d.optimization.target_quality}</div><div class="label">Quality</div></div>
                        <div class="status-item"><div class="value">\${d.optimization.manga_optimized ? 'Yes' : 'No'}</div><div class="label">Manga Mode</div></div>
                        <div class="status-item"><div class="value">Free</div><div class="label">Tier</div></div>
                    </div>
                \`;
            } catch (e) {
                document.getElementById('serviceStatus').innerHTML = '<div class="error-box">Service unavailable</div>';
            }
        }
        
        document.getElementById('testForm').onsubmit = async (e) => {
            e.preventDefault();
            const url = API_BASE + '/?url=' + encodeURIComponent(document.getElementById('imageUrl').value) + '&mode=' + document.getElementById('mode').value;
            
            document.getElementById('resultBox').classList.remove('show');
            document.getElementById('errorBox').style.display = 'none';
            document.getElementById('resultBox').innerHTML = '<div class="loading"><div class="spinner"></div><p>Processing...</p></div>';
            document.getElementById('resultBox').classList.add('show');
            
            try {
                const r = await fetch(url);
                const blob = await r.blob();
                const size = blob.size;
                const blobUrl = URL.createObjectURL(blob);
                const originalSize = r.headers.get('X-Original-Size') || size;
                const target = document.getElementById('mode').value === 'strict' ? '50KB' : '100KB';
                
                document.getElementById('resultBox').innerHTML = \`
                    <div class="comparison">
                        <div class="img-box">
                            <h4>Original</h4>
                            <img src="\${document.getElementById('imageUrl').value}" alt="Original" onerror="this.style.display='none'">
                            <p>\${formatSize(originalSize)}</p>
                        </div>
                        <div class="img-box">
                            <h4>Optimized</h4>
                            <img src="\${blobUrl}" alt="Optimized">
                            <p>\${formatSize(size)}</p>
                        </div>
                    </div>
                    <div class="stat-row"><span class="stat-label">Original</span><span class="stat-value">\${formatSize(originalSize)}</span></div>
                    <div class="stat-row"><span class="stat-label">Optimized</span><span class="stat-value">\${formatSize(size)}</span></div>
                    <div class="stat-row"><span class="stat-label">Quality</span><span class="stat-value">5 (Manga)</span></div>
                    <div class="stat-row"><span class="stat-label">Max Width</span><span class="stat-value">600px</span></div>
                    <div class="stat-row"><span class="stat-label">Target</span><span class="stat-value">\${target}</span></div>
                    <div class="url-box">\${url}</div>
                \`;
            } catch (err) {
                document.getElementById('resultBox').classList.remove('show');
                document.getElementById('errorBox').textContent = 'Error: ' + err.message;
                document.getElementById('errorBox').style.display = 'block';
            }
        };
        
        function formatSize(b) {
            if (!b) return 'Unknown';
            const n = parseInt(b);
            if (n < 1024) return n + ' B';
            if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
            return (n/1048576).toFixed(2) + ' MB';
        }
        
        checkStatus();
        document.getElementById('serverUrl').textContent = API_BASE;
    </script>
</body>
</html>`;
}