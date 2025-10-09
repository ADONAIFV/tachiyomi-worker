import vips from './public/vips.js';

// --- CONFIGURACIÓN "COHETE" PARA CLOUDFLARE ---
const MAX_IMAGE_WIDTH = 600;
const WEBP_QUALITY = 5;

// --- HEADERS "LLAVE MAESTRA" ---
function getHeaders(domain) {
    return {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': domain ? domain + '/' : 'https://www.google.com/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    };
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const imageUrl = url.searchParams.get('url');

        // Si no hay parámetro 'url', es una petición para la UI.
        if (!imageUrl) {
            // Dejamos que Pages sirva el archivo estático (index.html)
            return env.ASSETS.fetch(request);
        }

        // Si hay parámetro 'url', ejecutamos la lógica de la API.
        try {
            const parsedUrl = new URL(imageUrl);
            const domain = parsedUrl.origin;
            
            const response = await fetch(imageUrl, { headers: getHeaders(domain) });
            if (!response.ok) throw new Error(`Error al obtener la imagen: ${response.status}`);
            
            const originalContentType = response.headers.get('content-type');
            if (!originalContentType || !originalContentType.startsWith('image/')) {
                throw new Error('La URL no es una imagen válida.');
            }

            const arrayBuffer = await response.arrayBuffer();
            const originalBuffer = new Uint8Array(arrayBuffer);
            const originalSize = originalBuffer.byteLength;
            
            // --- LA CORRECCIÓN CLAVE: "ABRIR LA CAJA" ANTES DE USAR EL MOTOR ---
            const wasmResponse = await env.ASSETS.fetch(new URL('/vips.wasm', url.origin));
            const wasmModule = await wasmResponse.arrayBuffer(); // <-- Extraemos el contenido binario
            
            await vips.init(wasmModule); // <-- Ahora le pasamos el contenido correcto
            
            let image = vips.Image.newFromBuffer(originalBuffer);
            
            image = image.thumbnailImage(MAX_IMAGE_WIDTH, { height: 15000, noRotate: true });
            const compressedBuffer = image.webpsave({ Q: WEBP_QUALITY, effort: 6 });
            image.delete();
            
            const compressedSize = compressedBuffer.byteLength;

            if (compressedSize < originalSize) {
                return sendCompressed(compressedBuffer, originalSize, compressedSize);
            } else {
                return sendOriginal(originalBuffer, originalContentType);
            }
        } catch (error) {
            console.error("[FALLBACK ACTIVADO]", { url: imageUrl, errorMessage: error.message });
            return Response.redirect(imageUrl, 302);
        }
    },
};

// --- FUNCIONES HELPER ---
function sendCompressed(buffer, originalSize, compressedSize) {
    return new Response(buffer, {
        headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, stale-while-revalidate',
            'X-Original-Size': originalSize,
            'X-Compressed-Size': compressedSize,
        },
    });
}

function sendOriginal(buffer, contentType) {
    return new Response(buffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, stale-while-revalidate',
            'X-Original-Size': buffer.byteLength,
            'X-Compressed-Size': buffer.byteLength,
        },
    });
            }
