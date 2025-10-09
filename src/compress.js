importScripts('./vips.js')

export async function compressImage(buffer, format = 'webp', quality = 80) {
  if (!self.Vips) throw new Error('VIPS no cargado')
  
  const vips = await self.Vips()
  const input = vips.Image.newFromBuffer(buffer)
  let output

  switch (format) {
    case 'jpeg':
      output = input.jpegsave_buffer({ Q: quality })
      break
    case 'png':
      output = input.pngsave_buffer({ compression: 9 })
      break
    case 'avif':
      output = input.heifsave_buffer({ Q: quality, compression: 'av1' })
      break
    default:
      output = input.webpsave_buffer({ Q: quality })
      break
  }

  return output
}
