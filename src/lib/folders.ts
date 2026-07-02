import type { ImageItem } from '../types'

/**
 * Deriva la carpeta que contiene directamente a la imagen.
 * - drag-drop (react-dropzone / file-selector): `file.path` = "/EventoA/img.jpg" (con "/" inicial).
 * - input webkitdirectory: `file.webkitRelativePath` = "lote/EventoA/img.jpg" (sin "/" inicial).
 * En ambos casos la carpeta contenedora es el penúltimo segmento de la ruta.
 * Imagen suelta (sin carpeta) → "".
 */
export function folderOf(file: File): string {
  const raw =
    (file as { path?: string }).path ||
    (file as { webkitRelativePath?: string }).webkitRelativePath ||
    ''
  const cleaned = raw.replace(/^\.?\//, '') // quita "/" o "./" inicial
  const parts = cleaned.split('/').filter(Boolean)
  // parts = [..dirs.., filename]; la carpeta contenedora es el penúltimo segmento
  return parts.length >= 2 ? parts[parts.length - 2] : ''
}

export interface FolderGroup {
  folder: string
  items: ImageItem[]
}

/** Agrupa por carpeta preservando el orden de primera aparición. */
export function groupByFolder(items: ImageItem[]): FolderGroup[] {
  const groups: FolderGroup[] = []
  const index = new Map<string, FolderGroup>()
  for (const item of items) {
    let group = index.get(item.folder)
    if (!group) {
      group = { folder: item.folder, items: [] }
      index.set(item.folder, group)
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

/** ¿Hay al menos una imagen dentro de una carpeta con nombre? */
export function hasNamedFolders(items: ImageItem[]): boolean {
  return items.some((i) => i.folder !== '')
}

/** Etiqueta legible para mostrar (grupo sin carpeta → "Sin carpeta"). */
export function folderLabel(folder: string): string {
  return folder || 'Sin carpeta'
}

function sanitizeFolder(folder: string): string {
  return folder.replace(/[/\\:*?"<>|]+/g, '_').trim()
}

/** Nombre del .zip para una carpeta (sanitizado; sueltas → "imagenes.zip"). */
export function folderZipName(folder: string): string {
  const base = sanitizeFolder(folder)
  return `${base || 'imagenes'}.zip`
}
