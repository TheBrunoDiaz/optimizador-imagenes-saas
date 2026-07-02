import { downloadZip } from 'client-zip'
import type { FolderGroup } from './folders'
import { folderZipName } from './folders'
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function outputEntries(group: FolderGroup): Array<{ name: string; blob: Blob }> {
  return group.items
    .filter((i) => i.status === 'done' && i.output)
    .map((i) => ({ name: i.output!.name, blob: i.output!.blob }))
}

/** Descarga una carpeta como su propio .zip (nombre = nombre de la carpeta). */
export async function downloadFolderZip(group: FolderGroup): Promise<void> {
  const entries = outputEntries(group)
  if (entries.length === 0) return
  await downloadAsZip(entries, folderZipName(group.folder))
}

/** Un .zip por carpeta: dispara una descarga por grupo, separadas en el tiempo. */
export async function downloadFolderZipsSeparately(
  groups: FolderGroup[],
): Promise<void> {
  for (const group of groups) {
    const entries = outputEntries(group)
    if (entries.length === 0) continue
    await downloadAsZip(entries, folderZipName(group.folder))
    // Separación para que el navegador registre cada descarga por separado.
    await delay(400)
  }
}

/**
 * Todo en un solo .zip preservando la estructura: cada carpeta se convierte en una
 * subcarpeta (`carpeta/imagen.webp`). Los nombres se deduplican por carpeta.
 */
export async function downloadCombinedZip(
  groups: FolderGroup[],
  zipName = 'imagenes-optimizadas.zip',
): Promise<void> {
  const files: Array<{ name: string; input: Blob }> = []
  for (const group of groups) {
    const entries = outputEntries(group)
    if (entries.length === 0) continue
    const names = dedupeNames(entries.map((e) => e.name))
    const prefix = group.folder ? `${group.folder}/` : ''
    entries.forEach((entry, i) => {
      files.push({ name: `${prefix}${names[i]}`, input: entry.blob })
    })
  }
  if (files.length === 0) return
  const blob = await downloadZip(files).blob()
  saveBlob(blob, zipName)
}
