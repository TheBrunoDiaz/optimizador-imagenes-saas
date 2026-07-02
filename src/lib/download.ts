import { downloadZip } from 'client-zip'
import { dedupeNames } from './resizeMath'

/** Dispara la descarga de un blob con un nombre dado. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  // Se revoca tras un tick para no cancelar la descarga en curso.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Descarga desde un object URL ya existente (no lo revoca). */
export function saveFromUrl(url: string, filename: string): void {
  triggerDownload(url, filename)
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Empaqueta varios blobs en un ZIP en streaming (client-zip, bajo consumo de
 * memoria) y lo descarga. Desambigua nombres duplicados.
 */
export async function downloadAsZip(
  entries: Array<{ name: string; blob: Blob }>,
  zipName = 'imagenes-optimizadas.zip',
): Promise<void> {
  const names = dedupeNames(entries.map((e) => e.name))
  const files = entries.map((entry, i) => ({
    name: names[i],
    input: entry.blob,
  }))
  const response = downloadZip(files)
  const blob = await response.blob()
  saveBlob(blob, zipName)
}
