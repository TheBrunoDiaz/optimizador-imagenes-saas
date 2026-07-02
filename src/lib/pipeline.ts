import * as Comlink from 'comlink'
import type {
  ImageItem,
  ImageOutput,
  OptimizeSettings,
  ResizeSettings,
} from '../types'
import { decodeToImageData, resizeEncodePng } from './decode'
import type { PipelineRemote } from './pool'
import {
  computeTargetDimensions,
  outputFileName,
  resolveFormat,
} from './resizeMath'

/**
 * Procesa una imagen: UNA sola codificación desde el original.
 * (1) dimensiones destino = matemática pura; (2) decode → resize → encode.
 *
 * Regla anti-sorpresa: si NO se redimensiona (mismas dimensiones) y la salida
 * resulta igual o más pesada que el original con el mismo formato, se conserva
 * el archivo original (0% de ahorro, nunca un resultado peor).
 */
export async function processImage(
  item: ImageItem,
  resize: ResizeSettings,
  optimize: OptimizeSettings,
  worker: PipelineRemote,
): Promise<ImageOutput> {
  const target = computeTargetDimensions(
    { width: item.originalWidth, height: item.originalHeight },
    resize,
  )
  const format = resolveFormat(optimize.format, item.file.type)
  const sameDimensions =
    target.width === item.originalWidth && target.height === item.originalHeight

  let blob: Blob
  if (format === 'png') {
    blob = await resizeEncodePng(item.file, target.width, target.height)
  } else {
    const imageData = await decodeToImageData(
      item.file,
      item.originalWidth,
      item.originalHeight,
    )
    const buffer = imageData.data.buffer as ArrayBuffer
    const response = await worker.encode(
      Comlink.transfer(
        {
          data: buffer,
          width: imageData.width,
          height: imageData.height,
          targetWidth: target.width,
          targetHeight: target.height,
          format,
          quality: optimize.quality,
        },
        [buffer],
      ),
    )
    blob = new Blob([response.buffer], {
      type: format === 'webp' ? 'image/webp' : 'image/jpeg',
    })
  }

  // Recodificar algo ya comprimido puede agrandarlo: si no cambiamos tamaño y el
  // resultado no mejora, usamos el original.
  const keepOriginal =
    sameDimensions &&
    blob.size >= item.originalSize &&
    isSameFormatAsSource(format, item.file.type)

  if (keepOriginal) {
    return {
      blob: item.file,
      url: URL.createObjectURL(item.file),
      width: target.width,
      height: target.height,
      size: item.originalSize,
      name: item.name,
      format,
    }
  }

  return {
    blob,
    url: URL.createObjectURL(blob),
    width: target.width,
    height: target.height,
    size: blob.size,
    name: outputFileName(item.name, format),
    format,
  }
}

function isSameFormatAsSource(
  format: 'jpeg' | 'webp' | 'png',
  sourceType: string,
): boolean {
  const t = sourceType.toLowerCase()
  if (format === 'jpeg') return t === 'image/jpeg' || t === 'image/jpg'
  if (format === 'webp') return t === 'image/webp'
  if (format === 'png') return t === 'image/png'
  return false
}
