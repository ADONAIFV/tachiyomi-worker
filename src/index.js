import vips from './vips.js';

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
    globalThis.Uint8_Array = Uint8Array;
    globalThis.vips = vips;

    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Falta el parámetro url' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    try {
      const parsedUrl = new URL(imageUrl);
      const domain = parsedUrl.origin;
      const response = await fetch(imageUrl, { headers: getHeaders(domain) });

      if (!response.ok) throw new Error(`Error al obtener la imagen: ${response.status}`);
      
      const originalContentType = response.headers.get('content-type');
      if (!originalContentType || !originalContentType.startsWith('image/')) throw new Error('La URL no es una imagen válida.');

      const arrayBuffer = await response.arrayBuffer();
      const originalBuffer = new Uint8_Array(arrayBuffer);
      const originalSize = originalBuffer.byteLength;
      
      await vips.init(env.VIPS_WASM);
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
      return new Response('Redireccionando a la fuente original por un error.', { status: 302, headers: { 'Location': imageUrl } });
    }
  },
};

function sendCompressed(buffer, originalSize, compressedSize) { /* ... (sin cambios) ... */ }
function sendOriginal(buffer, contentType) { /* ... (sin cambios) ... */ }
