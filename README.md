# TachiyomiSY Cloudflare Worker ⚡

Versión adaptada para Cloudflare Workers del proyecto [TachiyomiSY-2](https://github.com/ADONAIFV/TachiyomiSY-2).

## 🚀 Descripción
Este Worker optimiza y comprime imágenes usando **libvips (vips.js + vips.wasm)** directamente en el borde, manteniendo la misma lógica del proyecto original.  
Soporta los formatos **WebP, JPEG, AVIF y PNG** con ajuste de calidad dinámico.

Incluye una **interfaz HTML ligera** para probar directamente desde el navegador.

---

## 🧩 Estructura del Proyecto

src/
 ├── index.js      # Lógica principal del Worker
 ├── compress.js   # Módulo de compresión con vips
 ├── vips.js       # Librería WASM
 ├── vips.wasm     # Binario de compresión
public/
 └── index.html    # Interfaz de prueba
wrangler.toml      # Configuración de Cloudflare
package.json       # Dependencias npm (itty-router)

---

## 🧠 Uso
Endpoint principal:
```
/image?url=https://ejemplo.com/imagen.jpg&format=webp&quality=80
```

Ejemplo:
```
https://tachiyomi-sy-worker.YOURACCOUNT.workers.dev/image?url=https://i.imgur.com/foto.jpg
```

---

## 🌍 Despliegue
1. Conecta el repo a Cloudflare Pages o usa `wrangler publish`
2. Accede al panel o visita `/` para probar la interfaz
3. Usa el endpoint `/image` desde tus apps o scripts

---

## 📦 Tecnologías
- Cloudflare Workers
- vips.js + vips.wasm 0.0.15
- itty-router
- HTML/CSS nativo
