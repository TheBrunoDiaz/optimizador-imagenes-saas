import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// Usa el Chromium preinstalado del entorno si está presente; en una máquina de
// desarrollo normal (con `npx playwright install`) no lo estará y se usa el suyo.
const preinstalledChromium =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium'
const launchOptions = existsSync(preinstalledChromium)
  ? { executablePath: preinstalledChromium }
  : {}

/**
 * E2E contra el build de PRODUCCIÓN servido con `vite preview`, que NO añade
 * cabeceras COOP/COEP. Así probamos que la app funciona en cualquier host
 * estático sin cross-origin isolation.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions,
      },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
