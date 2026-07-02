import type {
  Dimensions,
  OutputFormat,
  ResizeSettings,
  ResolvedFormat,
} from '../types'

/** Tope de área de canvas (~16.7 MP) para esquivar el límite de iOS Safari. */
export const MAX_DECODE_PIXELS = 16_000_000

function clampDims(w: number, h: number): Dimensions {
  return {
    width: Math.max(1, Math.round(w)),
    height: Math.max(1, Math.round(h)),
  }
}

/**
 * Calcula las dimensiones destino a partir del original y los ajustes.
 * Función pura: no toca el DOM. Es el núcleo con más casos borde, por eso
 * concentra la lógica de aspecto / porcentaje / "no agrandar".
 */
export function computeTargetDimensions(
  original: Dimensions,
  s: ResizeSettings,
): Dimensions {
  const ow = Math.max(1, Math.round(original.width))
  const oh = Math.max(1, Math.round(original.height))

  if (s.mode === 'percentage') {
    let scale = (s.percentage > 0 ? s.percentage : 100) / 100
    if (s.noEnlarge) scale = Math.min(scale, 1)
    return clampDims(ow * scale, oh * scale)
  }

  // modo pixels
  const w = s.width > 0 ? s.width : 0
  const h = s.height > 0 ? s.height : 0

  if (s.keepAspectRatio) {
    let scale: number
    if (w > 0 && h > 0) scale = Math.min(w / ow, h / oh)
    else if (w > 0) scale = w / ow
    else if (h > 0) scale = h / oh
    else scale = 1 // nada especificado → conserva original
    if (s.noEnlarge) scale = Math.min(scale, 1)
    return clampDims(ow * scale, oh * scale)
  }

  // sin mantener aspecto: cada eje es independiente; 0 = conservar ese eje
  let tw = w > 0 ? w : ow
  let th = h > 0 ? h : oh
  if (s.noEnlarge) {
    tw = Math.min(tw, ow)
    th = Math.min(th, oh)
  }
  return clampDims(tw, th)
}

/** Bytes → texto legible (0 B, 512 KB, 1.4 MB, ...). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / Math.pow(1024, i)
  const decimals = i === 0 ? 0 : value < 10 ? 1 : 0
  return `${value.toFixed(decimals)} ${units[i]}`
}

/**
 * % de ahorro. Nunca negativo: si la salida es igual o mayor que el original,
 * devuelve 0 (regla "no mostrar ahorro negativo").
 */
export function savingsPercent(originalSize: number, outputSize: number): number {
  if (originalSize <= 0 || outputSize <= 0) return 0
  if (outputSize >= originalSize) return 0
  return Math.round(((originalSize - outputSize) / originalSize) * 100)
}

const MIME_BY_FORMAT: Record<ResolvedFormat, string> = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
}

const EXT_BY_FORMAT: Record<ResolvedFormat, string> = {
  jpeg: 'jpg',
  webp: 'webp',
  png: 'png',
}

export function mimeForFormat(format: ResolvedFormat): string {
  return MIME_BY_FORMAT[format]
}

export function extForFormat(format: ResolvedFormat): string {
  return EXT_BY_FORMAT[format]
}

/** Resuelve 'original' al codificador concreto según el tipo de la fuente. */
export function resolveFormat(format: OutputFormat, sourceType: string): ResolvedFormat {
  if (format !== 'original') return format
  const t = sourceType.toLowerCase()
  if (t === 'image/png') return 'png'
  if (t === 'image/webp') return 'webp'
  // jpeg y cualquier otro decodificable por el navegador → jpeg
  return 'jpeg'
}

export function baseName(name: string): string {
  const slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'))
  const justName = slash >= 0 ? name.slice(slash + 1) : name
  const dot = justName.lastIndexOf('.')
  return dot > 0 ? justName.slice(0, dot) : justName
}

export function outputFileName(originalName: string, format: ResolvedFormat): string {
  return `${baseName(originalName)}.${extForFormat(format)}`
}

/**
 * Evita nombres duplicados en el ZIP añadiendo " (n)" antes de la extensión.
 * Comparación case-insensitive (los ZIP en Windows/macOS colisionan por caso).
 */
export function dedupeNames(names: string[]): string[] {
  const used = new Set<string>()
  return names.map((name) => {
    if (!used.has(name.toLowerCase())) {
      used.add(name.toLowerCase())
      return name
    }
    const dot = name.lastIndexOf('.')
    const base = dot > 0 ? name.slice(0, dot) : name
    const ext = dot > 0 ? name.slice(dot) : ''
    let n = 1
    let candidate = `${base} (${n})${ext}`
    while (used.has(candidate.toLowerCase())) {
      n++
      candidate = `${base} (${n})${ext}`
    }
    used.add(candidate.toLowerCase())
    return candidate
  })
}

/** Detecta HEIC/HEIF, que Chrome/Firefox/Edge no pueden decodificar. */
export function isLikelyHeic(file: File): boolean {
  const t = file.type.toLowerCase()
  if (t === 'image/heic' || t === 'image/heif') return true
  const n = file.name.toLowerCase()
  return n.endsWith('.heic') || n.endsWith('.heif')
}
