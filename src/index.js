/**
 * Bandwidth Hero - Cloudflare Worker Edition
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('url');

    // Si no hay parámetro "url", muestra la interfaz de prueba.
    if (!imageUrl) {
      // Esta es una solución alternativa para servir archivos estáticos desde el Worker
      // si no se usa Cloudflare Pages. Para tu caso, es mejor usar Pages.
      return new Response("Ve a la URL principal de tu sitio para usar la interfaz de prueba.", {
        headers: { "Content-Type": "text/html" }
      });
    }

    try {
      // Lógica de "Modo Camaleón" para evitar bloqueos
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/"
      };

      // Petición a la imagen original.
      // El objeto `cf` le dice a Cloudflare que aplique la compresión.
      // ¡Esto requiere que Image Resizing esté activado en tu cuenta de Cloudflare!
      const imageResponse = await fetch(imageUrl, {
        headers: headers,
        cf: {
          image: {
            // Comprime a formato AVIF
            format: 'avif',
            // Calidad: 80 es un buen balance.
            quality: '80',
            // Elimina los bordes de la imagen
            trim: "0;0;0;0"
          },
        },
      });
      
      // Si la petición fue exitosa, la devolvemos al usuario.
      if (imageResponse.ok) {
        // Pasamos las cabeceras de la respuesta de Cloudflare, que incluyen el nuevo tipo de contenido.
        const responseHeaders = new Headers(imageResponse.headers);
        responseHeaders.set("X-Bandwidth-Hero", "Transformed by Cloudflare");
        
        return new Response(imageResponse.body, {
          status: imageResponse.status,
          headers: responseHeaders
        });
      } else {
        // Si Cloudflare no pudo procesar la imagen, intenta servir la original sin cambios.
        return fetch(imageUrl, { headers: headers });
      }

    } catch (error) {
      // Si todo falla, devuelve una respuesta de error.
      return new Response('Error procesando la imagen: ' + error.message, { status: 500 });
    }
  },
};
