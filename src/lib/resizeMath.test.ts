import { describe, expect, it } from 'vitest'
import {
  baseName,
  computeTargetDimensions,
  dedupeNames,
  extForFormat,
  formatBytes,
  isLikelyHeic,
  mimeForFormat,
  outputFileName,
  resolveFormat,
  savingsPercent,
} from './resizeMath'
import type { ResizeSettings } from '../types'

const base: ResizeSettings = {
  mode: 'pixels',
  width: 0,
  height: 0,
  keepAspectRatio: true,
  noEnlarge: false,
  percentage: 100,
}

describe('computeTargetDimensions - pixels + keepAspectRatio', () => {
  it('deriva el alto desde el ancho manteniendo proporción', () => {
    expect(
      computeTargetDimensions({ width: 3984, height: 2240 }, { ...base, width: 1992 }),
    ).toEqual({ width: 1992, height: 1120 })
  })

  it('deriva el ancho desde el alto', () => {
    expect(
      computeTargetDimensions({ width: 4000, height: 2000 }, { ...base, height: 500 }),
    ).toEqual({ width: 1000, height: 500 })
  })

  it('con ambos ejes encaja dentro de la caja (escala menor)', () => {
    // caja 1000x1000 sobre 4000x2000 → escala limitante = 1000/4000 = 0.25
    expect(
      computeTargetDimensions(
        { width: 4000, height: 2000 },
        { ...base, width: 1000, height: 1000 },
      ),
    ).toEqual({ width: 1000, height: 500 })
  })

  it('redondea a enteros', () => {
    expect(
      computeTargetDimensions({ width: 1001, height: 667 }, { ...base, width: 500 }),
    ).toEqual({ width: 500, height: 333 })
  })

  it('sin nada especificado conserva el original', () => {
    expect(
      computeTargetDimensions({ width: 800, height: 600 }, { ...base }),
    ).toEqual({ width: 800, height: 600 })
  })
})

describe('computeTargetDimensions - noEnlarge', () => {
  it('no agranda cuando el objetivo es mayor que el original (keepAspect)', () => {
    expect(
      computeTargetDimensions(
        { width: 400, height: 300 },
        { ...base, width: 4000, noEnlarge: true },
      ),
    ).toEqual({ width: 400, height: 300 })
  })

  it('sí reduce aunque noEnlarge esté activo', () => {
    expect(
      computeTargetDimensions(
        { width: 4000, height: 3000 },
        { ...base, width: 2000, noEnlarge: true },
      ),
    ).toEqual({ width: 2000, height: 1500 })
  })

  it('clampa por eje sin mantener aspecto', () => {
    expect(
      computeTargetDimensions(
        { width: 400, height: 300 },
        {
          ...base,
          keepAspectRatio: false,
          width: 4000,
          height: 100,
          noEnlarge: true,
        },
      ),
    ).toEqual({ width: 400, height: 100 })
  })
})

describe('computeTargetDimensions - sin mantener aspecto', () => {
  it('estira cada eje de forma independiente', () => {
    expect(
      computeTargetDimensions(
        { width: 800, height: 600 },
        { ...base, keepAspectRatio: false, width: 300, height: 300 },
      ),
    ).toEqual({ width: 300, height: 300 })
  })

  it('eje en 0 conserva ese eje del original', () => {
    expect(
      computeTargetDimensions(
        { width: 800, height: 600 },
        { ...base, keepAspectRatio: false, width: 400, height: 0 },
      ),
    ).toEqual({ width: 400, height: 600 })
  })
})

describe('computeTargetDimensions - porcentaje', () => {
  it('50% reduce a la mitad', () => {
    expect(
      computeTargetDimensions(
        { width: 3984, height: 2240 },
        { ...base, mode: 'percentage', percentage: 50 },
      ),
    ).toEqual({ width: 1992, height: 1120 })
  })

  it('75% redondea', () => {
    expect(
      computeTargetDimensions(
        { width: 1000, height: 667 },
        { ...base, mode: 'percentage', percentage: 75 },
      ),
    ).toEqual({ width: 750, height: 500 })
  })

  it('nunca baja de 1px', () => {
    expect(
      computeTargetDimensions(
        { width: 10, height: 10 },
        { ...base, mode: 'percentage', percentage: 1 },
      ),
    ).toEqual({ width: 1, height: 1 })
  })
})

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [-5, '0 B'],
    [512, '512 B'],
    [1024, '1.0 KB'],
    [1536, '1.5 KB'],
    [15 * 1024, '15 KB'],
    [1024 * 1024, '1.0 MB'],
    [5 * 1024 * 1024, '5.0 MB'],
  ])('formatBytes(%i) = %s', (input, expected) => {
    expect(formatBytes(input)).toBe(expected)
  })
})

describe('savingsPercent', () => {
  it('calcula el ahorro', () => {
    expect(savingsPercent(1000, 250)).toBe(75)
  })
  it('devuelve 0 si la salida es mayor (nunca negativo)', () => {
    expect(savingsPercent(100, 250)).toBe(0)
  })
  it('devuelve 0 si la salida es igual', () => {
    expect(savingsPercent(100, 100)).toBe(0)
  })
  it('maneja valores no válidos', () => {
    expect(savingsPercent(0, 100)).toBe(0)
    expect(savingsPercent(100, 0)).toBe(0)
  })
})

describe('formato → mime / extensión / nombre', () => {
  it('mime', () => {
    expect(mimeForFormat('jpeg')).toBe('image/jpeg')
    expect(mimeForFormat('webp')).toBe('image/webp')
    expect(mimeForFormat('png')).toBe('image/png')
  })
  it('extensión (jpeg → jpg)', () => {
    expect(extForFormat('jpeg')).toBe('jpg')
    expect(extForFormat('webp')).toBe('webp')
    expect(extForFormat('png')).toBe('png')
  })
  it('resolveFormat según la fuente', () => {
    expect(resolveFormat('original', 'image/png')).toBe('png')
    expect(resolveFormat('original', 'image/webp')).toBe('webp')
    expect(resolveFormat('original', 'image/jpeg')).toBe('jpeg')
    expect(resolveFormat('original', 'image/gif')).toBe('jpeg')
    expect(resolveFormat('webp', 'image/png')).toBe('webp')
  })
  it('baseName quita ruta y extensión', () => {
    expect(baseName('IMG_8585.JPG')).toBe('IMG_8585')
    expect(baseName('carpeta/sub/foto.final.png')).toBe('foto.final')
    expect(baseName('sinextension')).toBe('sinextension')
  })
  it('outputFileName cambia la extensión', () => {
    expect(outputFileName('foto.png', 'webp')).toBe('foto.webp')
    expect(outputFileName('IMG_8585.JPG', 'jpeg')).toBe('IMG_8585.jpg')
  })
})

describe('dedupeNames', () => {
  it('desambigua colisiones', () => {
    expect(dedupeNames(['foto.webp', 'foto.webp', 'foto.webp'])).toEqual([
      'foto.webp',
      'foto (1).webp',
      'foto (2).webp',
    ])
  })
  it('es case-insensitive', () => {
    expect(dedupeNames(['Foto.webp', 'foto.webp'])).toEqual([
      'Foto.webp',
      'foto (1).webp',
    ])
  })
  it('no toca nombres únicos', () => {
    expect(dedupeNames(['a.webp', 'b.webp'])).toEqual(['a.webp', 'b.webp'])
  })
  it('salta un candidato que ya existe', () => {
    expect(dedupeNames(['a.webp', 'a (1).webp', 'a.webp'])).toEqual([
      'a.webp',
      'a (1).webp',
      'a (2).webp',
    ])
  })
})

describe('isLikelyHeic', () => {
  it('detecta por tipo MIME', () => {
    expect(isLikelyHeic(new File([], 'x', { type: 'image/heic' }))).toBe(true)
    expect(isLikelyHeic(new File([], 'x', { type: 'image/heif' }))).toBe(true)
  })
  it('detecta por extensión', () => {
    expect(isLikelyHeic(new File([], 'IMG_0001.HEIC'))).toBe(true)
    expect(isLikelyHeic(new File([], 'foto.heif'))).toBe(true)
  })
  it('no marca JPEG/PNG', () => {
    expect(isLikelyHeic(new File([], 'foto.jpg', { type: 'image/jpeg' }))).toBe(false)
  })
})
