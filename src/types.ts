/** Tipos compartidos por store, pipeline y componentes. */

export interface Dimensions {
  width: number
  height: number
}

export type ResizeMode = 'pixels' | 'percentage'

export interface ResizeSettings {
  mode: ResizeMode
  /** Ancho objetivo en px (modo pixels). 0 = sin especificar. */
  width: number
  /** Alto objetivo en px (modo pixels). 0 = sin especificar. */
  height: number
  keepAspectRatio: boolean
  /** No agrandar si el original es más pequeño. */
  noEnlarge: boolean
  /** Porcentaje del original (modo percentage), p.ej. 50. */
  percentage: number
}

/** Formato de salida. 'original' se resuelve según el tipo de la fuente. */
export type OutputFormat = 'original' | 'jpeg' | 'webp' | 'png'
/** Formato ya resuelto a un codificador concreto. */
export type ResolvedFormat = 'jpeg' | 'webp' | 'png'

export interface OptimizeSettings {
  format: OutputFormat
  /** Calidad 1..100 (aplica a jpeg y webp; png es lossless). */
  quality: number
}

export type ImageStatus = 'queued' | 'processing' | 'done' | 'error' | 'unsupported'

export interface ImageOutput {
  blob: Blob
  url: string
  width: number
  height: number
  size: number
  name: string
  format: ResolvedFormat
}

export interface ImageItem {
  id: string
  file: File
  name: string
  originalWidth: number
  originalHeight: number
  originalSize: number
  previewUrl: string
  status: ImageStatus
  error?: string
  output?: ImageOutput
}

export type Step = 'upload' | 'resize' | 'optimize' | 'download'
