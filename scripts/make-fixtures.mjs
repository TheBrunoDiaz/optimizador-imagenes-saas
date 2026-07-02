// Genera imágenes PNG de prueba (sin dependencias) para los tests e2e.
import { crc32, deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'fixtures')
mkdirSync(outDir, { recursive: true })

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function makePng(width, height, pixel) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const raw = Buffer.alloc(height * (1 + width * 4))
  let p = 0
  for (let y = 0; y < height; y++) {
    raw[p++] = 0 // filtro none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixel(x, y)
      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
      raw[p++] = a
    }
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// Patrón de alta entropía → PNG pesado, para que WebP con pérdida ahorre de verdad.
const noisy = (x, y) => [
  (x * 7 + y * 3) % 256,
  (x * 3 + y * 11) % 256,
  (x * x + y * y) % 256,
  255,
]

writeFileSync(join(outDir, 'gradient-800x600.png'), makePng(800, 600, noisy))
writeFileSync(join(outDir, 'gradient-700x500.png'), makePng(700, 500, noisy))
// >16 MP para ejercitar la ruta de decode-downscale (tope de área de canvas).
writeFileSync(
  join(outDir, 'huge-4100x4100.png'),
  makePng(4100, 4100, (x, y) => [(x + y) % 256, 128, (x * y) % 256, 255]),
)

// Carpetas para el modo "Carpetas": lote/EventoA (2 imgs) y lote/EventoB (1 img).
const lote = join(outDir, 'lote')
mkdirSync(join(lote, 'EventoA'), { recursive: true })
mkdirSync(join(lote, 'EventoB'), { recursive: true })
writeFileSync(join(lote, 'EventoA', 'a.png'), makePng(300, 200, noisy))
writeFileSync(join(lote, 'EventoA', 'b.png'), makePng(320, 240, noisy))
writeFileSync(join(lote, 'EventoB', 'c.png'), makePng(280, 180, noisy))

console.log('Fixtures escritas en', outDir)
