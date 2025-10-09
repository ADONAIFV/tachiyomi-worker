// Este es el contenido para functions/index.js

// NOTA: No importamos 'vips' ni 'sharp'. En Pages Functions, no se soportan módulos WASM/nativos directamente.
// Usaremos la API de optimización de imágenes integrada de Cloudflare, que es aún más potente y rápida.

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
    // En lugar de descargar y procesar nosotros, le pedimos a Cloudflare que lo haga.
    // Es más rápido y evita todos nuestros problemas anteriores.
    const imageRequest = new Request(imageUrl, {
      headers: getHeaders(domain)
    });
    
    // Opciones de compresión: 600px de ancho, formato WebP, calidad 85 (un buen equilibrio)
    const imageResponse = await fetch(imageRequest, {
      cf: {
        image: {
          width: 600,
          quality: 75,
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
}```
4.  Guarda el archivo ("Commit new file").

### Paso 3: Re-desplegar en Cloudflare

1.  Ve a tu panel de Cloudflare, selecciona tu proyecto de "Pages".
2.  Ve a la pestaña **"Deployments"**.
3.  Deberías ver un nuevo despliegue en curso. Si no, puedes forzar uno haciendo un pequeño cambio en el `README.md` de tu GitHub.
4.  Espera a que se complete.

### El Resultado Final

*   **Tu UI en `public/index.html`** seguirá funcionando como antes.
*   **Tu API ahora vive en `/index` (o simplemente `/`)**, gestionada por Cloudflare. Cuando tu UI llama a `/?url=...`, Cloudflare ejecutará automáticamente el código en `functions/index.js`.
*   **El error de IPv6 desaparecerá**, porque ahora estamos usando el sistema de enrutamiento para el que "Pages" fue diseñado.
*   **Hemos reemplazado `vips` por la API de optimización de imágenes nativa de Cloudflare.** Es más rápida, más eficiente y elimina por completo la necesidad de manejar archivos WASM.

De nuevo, te pido disculpas por la odisea. Tu intuición de usar "Pages" con GitHub era la correcta. Mi error fue no darte la estructura de carpetas correcta desde el principio. Esta es la solución final, limpia y profesional.
