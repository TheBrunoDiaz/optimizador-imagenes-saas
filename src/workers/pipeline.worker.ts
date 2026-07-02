/**
 * Worker: recibe un ImageData ya decodificado (desde el hilo principal),
 * lo redimensiona con Lanczos (@jsquash/resize) y lo codifica a JPEG (MozJPEG)
 * o WebP. Nada de canvas aquí: jSquash trabaja sobre ImageData puro, así que el
 * worker funciona en cualquier navegador aunque no tenga OffscreenCanvas.
 *
 * PNG NO pasa por aquí: se codifica en el hilo principal con canvas.toBlob
 * (lossless, universal y sin wasm).
 */
import * as Comlink from 'comlink'
import resize from '@jsquash/resize'
import { encode as encodeJpeg } from '@jsquash/jpeg'
import { encode as encodeWebp } from '@jsquash/webp'

export interface EncodeRequest {
  /** Bytes RGBA del ImageData fuente (transferible). */
  data: ArrayBuffer
  width: number
  height: number
  targetWidth: number
  targetHeight: number
  format: 'jpeg' | 'webp'
  /** Calidad 1..100. */
  quality: number
}

export interface EncodeResponse {
  buffer: ArrayBuffer
  mime: string
  width: number
  height: number
}

const api = {
  async encode(req: EncodeRequest): Promise<EncodeResponse> {
    const source = new ImageData(
      new Uint8ClampedArray(req.data),
      req.width,
      req.height,
    )

    const needsResize =
      req.targetWidth !== req.width || req.targetHeight !== req.height
    const image = needsResize
      ? await resize(source, {
          width: req.targetWidth,
          height: req.targetHeight,
          method: 'lanczos3',
        })
      : source

    const buffer =
      req.format === 'webp'
        ? await encodeWebp(image, { quality: req.quality })
        : await encodeJpeg(image, { quality: req.quality })

    return Comlink.transfer(
      {
        buffer,
        mime: req.format === 'webp' ? 'image/webp' : 'image/jpeg',
        width: image.width,
        height: image.height,
      },
      [buffer],
    )
  },
}

export type PipelineApi = typeof api

Comlink.expose(api)
