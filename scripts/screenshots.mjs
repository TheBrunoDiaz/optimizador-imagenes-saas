// Captura pantallas de cada paso para revisión visual (no forma parte de CI).
import { chromium } from '@playwright/test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = join(root, 'tests', 'fixtures')
const outDir = join(root, 'screenshots')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium',
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await page.goto('http://localhost:4173/')
await page.screenshot({ path: join(outDir, '01-upload.png') })

await page.setInputFiles('input[type=file]', [
  join(fixtures, 'gradient-800x600.png'),
  join(fixtures, 'gradient-700x500.png'),
  join(fixtures, 'huge-4100x4100.png'),
])
await page.getByText('Opciones de redimensión').waitFor()
await page.screenshot({ path: join(outDir, '02-resize.png') })

await page.getByRole('button', { name: /Siguiente: optimizar/ }).click()
await page.getByText('Optimizar para web').waitFor()
await page.screenshot({ path: join(outDir, '03-optimize.png') })

await page.getByRole('button', { name: /^Procesar/ }).click()
await page.getByText(/imágenes optimizadas/).waitFor({ timeout: 90_000 })
await page.screenshot({ path: join(outDir, '04-download.png') })
await page.close()

// --- Modo Carpetas ---
const page2 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page2.goto('http://localhost:4173/')
await page2.getByRole('button', { name: /Carpetas/ }).click()
await page2.screenshot({ path: join(outDir, '05-folders-upload.png') })

await page2.setInputFiles('input[type=file]', join(fixtures, 'lote'))
await page2.getByText('Opciones de redimensión').waitFor()
await page2.screenshot({ path: join(outDir, '06-folders-resize.png') })

await page2.getByRole('button', { name: /Siguiente: optimizar/ }).click()
await page2.getByRole('button', { name: /^Procesar/ }).click()
await page2.getByText(/carpetas ·/).waitFor({ timeout: 90_000 })
await page2.screenshot({ path: join(outDir, '07-folders-download.png') })
await page2.close()

await browser.close()
console.log('Capturas en', outDir)
