import { describe, expect, it } from 'vitest'
import {
  folderLabel,
  folderOf,
  folderZipName,
  groupByFolder,
  hasNamedFolders,
} from './folders'
import type { ImageItem } from '../types'

function fileWith(props: {
  name?: string
  path?: string
  webkitRelativePath?: string
}): File {
  const f = new File([new Uint8Array([1])], props.name ?? 'img.jpg', {
    type: 'image/jpeg',
  })
  if (props.path !== undefined) {
    Object.defineProperty(f, 'path', { value: props.path, configurable: true })
  }
  if (props.webkitRelativePath !== undefined) {
    Object.defineProperty(f, 'webkitRelativePath', {
      value: props.webkitRelativePath,
      configurable: true,
    })
  }
  return f
}

const item = (folder: string, id: string): ImageItem =>
  ({ id, folder }) as unknown as ImageItem

describe('folderOf', () => {
  it('drag-drop: .path con "/" inicial → carpeta contenedora', () => {
    expect(folderOf(fileWith({ path: '/EventoA/img.jpg' }))).toBe('EventoA')
  })

  it('input webkitdirectory: webkitRelativePath sin "/" inicial', () => {
    expect(
      folderOf(fileWith({ webkitRelativePath: 'lote/EventoA/img.png' })),
    ).toBe('EventoA')
  })

  it('rutas anidadas → carpeta que contiene directamente la imagen', () => {
    expect(folderOf(fileWith({ path: '/raiz/a/EventoB/foto.jpg' }))).toBe('EventoB')
  })

  it('imagen suelta (./nombre) → ""', () => {
    expect(folderOf(fileWith({ path: './img.jpg' }))).toBe('')
  })

  it('sin ruta ni webkitRelativePath → ""', () => {
    expect(folderOf(fileWith({ name: 'img.jpg' }))).toBe('')
  })

  it('prefiere .path sobre webkitRelativePath', () => {
    expect(
      folderOf(fileWith({ path: '/Real/img.jpg', webkitRelativePath: 'Otra/img.jpg' })),
    ).toBe('Real')
  })
})

describe('groupByFolder', () => {
  it('agrupa preservando el orden de primera aparición', () => {
    const items = [
      item('A', '1'),
      item('B', '2'),
      item('A', '3'),
      item('', '4'),
    ]
    const groups = groupByFolder(items)
    expect(groups.map((g) => g.folder)).toEqual(['A', 'B', ''])
    expect(groups[0].items.map((i) => i.id)).toEqual(['1', '3'])
    expect(groups[1].items.map((i) => i.id)).toEqual(['2'])
    expect(groups[2].items.map((i) => i.id)).toEqual(['4'])
  })

  it('lista vacía → sin grupos', () => {
    expect(groupByFolder([])).toEqual([])
  })
})

describe('hasNamedFolders', () => {
  it('true si hay al menos una carpeta con nombre', () => {
    expect(hasNamedFolders([item('A', '1'), item('', '2')])).toBe(true)
  })
  it('false si todas son sueltas', () => {
    expect(hasNamedFolders([item('', '1'), item('', '2')])).toBe(false)
  })
})

describe('folderLabel / folderZipName', () => {
  it('etiqueta sueltas como "Sin carpeta"', () => {
    expect(folderLabel('')).toBe('Sin carpeta')
    expect(folderLabel('EventoA')).toBe('EventoA')
  })
  it('nombre de zip por carpeta', () => {
    expect(folderZipName('EventoA')).toBe('EventoA.zip')
    expect(folderZipName('')).toBe('imagenes.zip')
  })
  it('sanitiza caracteres inválidos en el nombre del zip', () => {
    expect(folderZipName('a/b:c')).toBe('a_b_c.zip')
  })
})
