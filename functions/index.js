// Este es el contenido final y limpio para functions/index.js

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

// La función que se ejecuta en cada petición
export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Falta el parámetro url' }), { status: 400 });
    }

    const parsedUrl = new URL(imageUrl);
    const domain = parsedUrl.origin;

    // --- USANDO LA API DE IMÁGENES DE CLOUDFLARE ---
    const imageRequest = new Request(imageUrl, {
      headers: getHeaders(domain)
    });
    
    // Opciones de compresión: 600px de ancho, formato WebP, CALIDAD 5
    const imageResponse = await fetch(imageRequest, {
      cf: {
        image: {
          width: 600,
          quality: 5,
          format: 'webp'
        }
      }
    });

    if (!imageResponse.ok) {
        throw new Error(`Error al obtener/procesar la imagen: ${imageResponse.status}`);
    }

    // Devolvemos la imagen directamente
    return imageResponse;

  } catch (error) {
    console.error("[FALLBACK ACTIVADO]", { errorMessage: error.message });
    // Si algo falla, redireccionamos a la imagen original.
    const imageUrl = new URL(context.request.url).searchParams.get('url');
    return new Response('Redireccionando a la fuente original por un error.', {
      status: 302,
      headers: { 'Location': imageUrl },
    });
  }
}
