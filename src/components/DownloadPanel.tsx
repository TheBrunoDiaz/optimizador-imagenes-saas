import { useMemo, useState } from 'react'
import { useImages } from '../store/images'
import { downloadAsZip, saveFromUrl } from '../lib/download'
import { formatBytes, savingsPercent } from '../lib/resizeMath'
import { Button } from './ui/Button'

export function DownloadPanel() {
  const items = useImages((s) => s.items)
  const processing = useImages((s) => s.processing)
  const setStep = useImages((s) => s.setStep)
  const reset = useImages((s) => s.reset)
  const [zipping, setZipping] = useState(false)

  const done = useMemo(() => items.filter((i) => i.status === 'done' && i.output), [items])
  const targetCount = items.filter((i) => i.status !== 'unsupported').length
  const errors = items.filter((i) => i.status === 'error').length

  const totals = useMemo(() => {
    const originalSize = done.reduce((sum, i) => sum + i.originalSize, 0)
    const outputSize = done.reduce((sum, i) => sum + (i.output?.size ?? 0), 0)
    return {
      originalSize,
      outputSize,
      saved: savingsPercent(originalSize, outputSize),
    }
  }, [done])

  async function handleDownload() {
    if (done.length === 0) return
    if (done.length === 1) {
      const only = done[0].output!
      saveFromUrl(only.url, only.name)
      return
    }
    setZipping(true)
    try {
      await downloadAsZip(
        done.map((i) => ({ name: i.output!.name, blob: i.output!.blob })),
      )
    } finally {
      setZipping(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {processing ? (
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800">
            Optimizando imágenes…
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {done.length} de {targetCount} listas
          </p>
          <div className="mx-auto mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{
                width: `${targetCount ? (done.length / targetCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              ¡Listo! {done.length} {done.length === 1 ? 'imagen' : 'imágenes'} optimizadas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {formatBytes(totals.originalSize)} → {formatBytes(totals.outputSize)}
              {totals.saved > 0 && (
                <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                  {totals.saved}% menos
                </span>
              )}
              {errors > 0 && (
                <span className="ml-2 text-red-600">· {errors} con error</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => setStep('optimize')}>
              Ajustar
            </Button>
            <Button variant="ghost" onClick={reset}>
              Nueva sesión
            </Button>
            <Button
              size="lg"
              onClick={() => void handleDownload()}
              disabled={done.length === 0 || zipping}
            >
              <DownloadIcon />
              {zipping
                ? 'Preparando ZIP…'
                : done.length > 1
                  ? 'Descargar todo (ZIP)'
                  : 'Descargar imagen'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
