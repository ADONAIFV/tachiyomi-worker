import { Router } from 'itty-router'
import { compressImage } from './compress.js'

const router = Router()

router.get('/', async () => {
  const html = await fetch('https://tachiyomi-sy-worker.pages.dev/index.html').then(r => r.text())
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } })
})

router.get('/image', async (request) => {
  const url = new URL(request.url)
  const imageUrl = url.searchParams.get('url')
  const format = url.searchParams.get('format') || 'webp'
  const quality = parseInt(url.searchParams.get('quality') || DEFAULT_QUALITY)

  if (!imageUrl) return new Response('Falta parámetro ?url', { status: 400 })

  try {
    const response = await fetch(imageUrl)
    const arrayBuffer = await response.arrayBuffer()

    if (arrayBuffer.byteLength > parseInt(MAX_IMAGE_SIZE)) {
      return new Response('Imagen demasiado grande', { status: 413 })
    }

    const compressed = await compressImage(arrayBuffer, format, quality)
    return new Response(compressed, {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (e) {
    return new Response('Error procesando la imagen', { status: 500 })
  }
})

router.all('*', () => new Response('Ruta no encontrada', { status: 404 }))

export default { fetch: router.handle }
