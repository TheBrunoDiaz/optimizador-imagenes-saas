import { MAX_DECODE_PIXELS } from './resizeMath'

/**
 * Decodifica un archivo a ImageData en el hilo principal (canvas universal),
 * respetando la orientación EXIF. Si la imagen supera el tope de área de canvas
 * (iOS ~16.7 MP), la decodifica ya reducida para no materializar un ImageData
 * gigante ni obtener un lienzo en blanco.
 *
 * El decode es rápido y se libera enseguida; el trabajo pesado (resize + encode)
 * ocurre en el worker sobre el ImageData resultante.
 */
export async function decodeToImageData(
  file: Blob,
  originalWidth: number,
  originalHeight: number,
): Promise<ImageData> {
  let decodeW = originalWidth
  let decodeH = originalHeight
  if (originalWidth * originalHeight > MAX_DECODE_PIXELS) {
    const scale = Math.sqrt(MAX_DECODE_PIXELS / (originalWidth * originalHeight))
    decodeW = Math.max(1, Math.round(originalWidth * scale))
    decodeH = Math.max(1, Math.round(originalHeight * scale))
  }

  const options: ImageBitmapOptions = { imageOrientation: 'from-image' }
  if (decodeW !== originalWidth || decodeH !== originalHeight) {
    options.resizeWidth = decodeW
    options.resizeHeight = decodeH
    options.resizeQuality = 'high'
  }

  const bitmap = await createImageBitmap(file, options)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    bitmap.close()
    throw new Error('No se pudo obtener el contexto 2D del canvas.')
  }
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  // liberar el lienzo cuanto antes
  canvas.width = 0
  canvas.height = 0
  return data
}

/**
 * Codifica PNG (lossless) en el hilo principal: decodifica directo al tamaño
 * destino con el remuestreo del navegador y exporta con canvas.toBlob.
 * PNG suele ser gráficos/capturas, donde el remuestreo del navegador es suficiente.
 */
export async function resizeEncodePng(
  file: Blob,
  targetWidth: number,
  targetHeight: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
    resizeWidth: targetWidth,
    resizeHeight: targetHeight,
    resizeQuality: 'high',
  })
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('No se pudo obtener el contexto 2D del canvas.')
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  )
  canvas.width = 0
  canvas.height = 0
  if (!blob) throw new Error('No se pudo codificar el PNG.')
  return blob
}

/**
 * Mide dimensiones naturales (orientación EXIF aplicada) y genera una miniatura
 * pequeña para la grilla. Nunca apuntamos un <img> al original a resolución
 * completa: eso mantendría un bitmap decodificado por imagen y agota memoria.
 */
export async function loadImageMeta(file: Blob): Promise<{
  width: number
  height: number
  previewUrl: string
}> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const width = bitmap.width
  const height = bitmap.height

  const scale = Math.min(1, 320 / Math.max(width, height))
  const pw = Math.max(1, Math.round(width * scale))
  const ph = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = pw
  canvas.height = ph
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('No se pudo obtener el contexto 2D del canvas.')
  }
  ctx.drawImage(bitmap, 0, 0, pw, ph)
  bitmap.close()

  const previewBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.8),
  )
  canvas.width = 0
  canvas.height = 0
  const previewUrl = previewBlob
    ? URL.createObjectURL(previewBlob)
    : URL.createObjectURL(file)

  return { width, height, previewUrl }
}
