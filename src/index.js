// Este es el contenido para src/index.js (CÓDIGO DE DIAGNÓSTICO)
import vips from './vips.js';

export default {
  async fetch(request, env, ctx) {
    let checkpoint = 'Inicio';
    try {
      // Checkpoint 1: Iniciar el Worker
      checkpoint = 'Worker iniciado';
      globalThis.Uint8_Array = Uint8Array;
      
      const url = new URL(request.url);
      const imageUrl = url.searchParams.get('url');

      if (!imageUrl) {
        return new Response(JSON.stringify({ status: "FALLO", checkpoint: "Validación de URL", error: "Falta el parámetro url" }), { status: 400 });
      }

      // Checkpoint 2: Descargar la imagen
      checkpoint = 'Descargando imagen original';
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Respuesta no exitosa del servidor de origen: ${response.status}`);
      }

      // Checkpoint 3: Cargar el motor WASM
      checkpoint = 'Inicializando motor WASM (vips.init)';
      await vips.init(env.VIPS_WASM);
      
      // Checkpoint 4: Leer la imagen en el motor
      checkpoint = 'Leyendo buffer de imagen con vips';
      const arrayBuffer = await response.arrayBuffer();
      const originalBuffer = new Uint8_Array(arrayBuffer);
      let image = vips.Image.newFromBuffer(originalBuffer);

      // Checkpoint 5: Realizar una operación simple
      checkpoint = 'Ejecutando operación de compresión (webpsave)';
      const compressedBuffer = image.webpsave({ Q: 5 });
      image.delete();

      // Si llegamos hasta aquí, todo funciona
      return new Response(JSON.stringify({
        status: "ÉXITO TOTAL",
        checkpoint: "Todos los pasos completados",
        message: "El sistema está listo para funcionar. Reemplaza este código de diagnóstico por el de producción."
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
      // Si algo falla, devolvemos exactamente dónde y por qué.
      return new Response(JSON.stringify({
        status: "FALLO",
        checkpoint: `Error en el paso: '${checkpoint}'`,
        error_message: error.message,
        error_stack: error.stack,
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  },
};
