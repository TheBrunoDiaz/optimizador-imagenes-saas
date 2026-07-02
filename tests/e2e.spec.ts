import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const g1 = join(fixtures, 'gradient-800x600.png')
const g2 = join(fixtures, 'gradient-700x500.png')
const huge = join(fixtures, 'huge-4100x4100.png')

function countOccurrences(haystack: Buffer, needle: Buffer): number {
  let count = 0
  let idx = haystack.indexOf(needle)
  while (idx !== -1) {
    count++
    idx = haystack.indexOf(needle, idx + needle.length)
  }
  return count
}

test('una imagen: redimensiona 50%, optimiza a WebP y descarga con cabecera WebP', async ({
  page,
}) => {
  await page.goto('/')
  await page.setInputFiles('input[type=file]', g1)

  // Avanza a redimensionar y muestra dims original → destino (50%).
  await expect(page.getByText('Opciones de redimensión')).toBeVisible()
  await expect(page.getByText('800 × 600').first()).toBeVisible()
  await expect(page.getByText('400 × 300').first()).toBeVisible()

  await page.getByRole('button', { name: /Siguiente: optimizar/ }).click()
  await expect(page.getByText('Optimizar para web')).toBeVisible()

  // WebP es el formato por defecto.
  await page.getByRole('button', { name: /^Procesar/ }).click()

  await expect(page.getByText(/imagen optimizada/)).toBeVisible({ timeout: 60_000 })

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Descargar imagen/ }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.webp$/)

  const path = await download.path()
  const buf = readFileSync(path)
  // Contenedor WebP: "RIFF" .... "WEBP"
  expect(buf.subarray(0, 4).toString('ascii')).toBe('RIFF')
  expect(buf.subarray(8, 12).toString('ascii')).toBe('WEBP')
})

test('varias imágenes (incl. >16MP): procesa y descarga un ZIP con las 3', async ({
  page,
}) => {
  await page.goto('/')
  await page.setInputFiles('input[type=file]', [g1, g2, huge])

  await expect(page.getByText('Opciones de redimensión')).toBeVisible()
  await page.getByRole('button', { name: /Siguiente: optimizar/ }).click()
  await page.getByRole('button', { name: /^Procesar/ }).click()

  await expect(page.getByText(/imágenes optimizadas/)).toBeVisible({ timeout: 90_000 })
  // Debe reportar ahorro (resize al 50% reduce mucho).
  await expect(page.getByText(/% menos/)).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Descargar todo/ }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.zip$/)

  const buf = readFileSync(await download.path())
  // Firma de archivo ZIP.
  expect(buf.subarray(0, 2).toString('ascii')).toBe('PK')
  // 3 cabeceras de directorio central (PK\x01\x02) = 3 archivos en el ZIP.
  const centralHeaders = countOccurrences(buf, Buffer.from([0x50, 0x4b, 0x01, 0x02]))
  expect(centralHeaders).toBe(3)
})

test('modo carpetas: agrupa por carpeta, ZIP por carpeta y ZIP combinado', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Carpetas/ }).click()
  // Subir el directorio completo (Playwright fija webkitRelativePath por archivo).
  await page.setInputFiles('input[type=file]', join(fixtures, 'lote'))

  await expect(page.getByText('Opciones de redimensión')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'EventoA' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'EventoB' })).toBeVisible()

  await page.getByRole('button', { name: /Siguiente: optimizar/ }).click()
  await page.getByRole('button', { name: /^Procesar/ }).click()
  await expect(page.getByText(/carpetas ·/)).toBeVisible({ timeout: 60_000 })

  // (a) ZIP de la carpeta EventoA (2 imágenes) — apuntamos a SU sección.
  const eventoA = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'EventoA' }) })
  const [zipA] = await Promise.all([
    page.waitForEvent('download'),
    eventoA.getByRole('button', { name: /Descargar ZIP/ }).click(),
  ])
  expect(zipA.suggestedFilename()).toBe('EventoA.zip')
  const bufA = readFileSync(await zipA.path())
  expect(countOccurrences(bufA, Buffer.from([0x50, 0x4b, 0x01, 0x02]))).toBe(2)

  // (b) Combinado: 3 imágenes bajo subcarpetas EventoA/ y EventoB/.
  const [zipAll] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Todo en un \.zip/ }).click(),
  ])
  const bufAll = readFileSync(await zipAll.path())
  expect(countOccurrences(bufAll, Buffer.from([0x50, 0x4b, 0x01, 0x02]))).toBe(3)
  expect(bufAll.includes(Buffer.from('EventoA/'))).toBe(true)
  expect(bufAll.includes(Buffer.from('EventoB/'))).toBe(true)
})
