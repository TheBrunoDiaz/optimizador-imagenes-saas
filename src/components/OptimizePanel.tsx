import { useImages } from '../store/images'
import type { OutputFormat } from '../types'
import { cn } from '../lib/cn'
import { Button } from './ui/Button'

const FORMATS: Array<{ value: OutputFormat; label: string; hint: string }> = [
  { value: 'webp', label: 'WebP', hint: 'Mejor para web (recomendado)' },
  { value: 'jpeg', label: 'JPG', hint: 'Máxima compatibilidad' },
  { value: 'png', label: 'PNG', hint: 'Sin pérdida (gráficos)' },
  { value: 'original', label: 'Mantener original', hint: 'Solo redimensionar' },
]

export function OptimizePanel() {
  const optimize = useImages((s) => s.optimize)
  const setOptimize = useImages((s) => s.setOptimize)
  const setStep = useImages((s) => s.setStep)
  const process = useImages((s) => s.process)
  const count = useImages((s) => s.items.filter((i) => i.status !== 'unsupported').length)

  const qualityDisabled = optimize.format === 'png'

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-lg font-semibold text-slate-800">Optimizar para web</h2>
      <p className="mt-1 text-sm text-slate-500">
        Formato y calidad de salida. Se codifica una sola vez desde el original.
      </p>

      <div className="mt-5 flex-1 space-y-5">
        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-600">Formato</span>
          <div className="grid grid-cols-2 gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setOptimize({ format: f.value })}
                className={cn(
                  'flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors',
                  optimize.format === f.value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-300 hover:bg-slate-50',
                )}
              >
                <span
                  className={cn(
                    'text-sm font-semibold',
                    optimize.format === f.value ? 'text-brand-700' : 'text-slate-700',
                  )}
                >
                  {f.label}
                </span>
                <span className="text-xs text-slate-400">{f.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={cn('space-y-2', qualityDisabled && 'opacity-40')}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Calidad</span>
            <span className="text-sm font-semibold tabular-nums text-slate-700">
              {qualityDisabled ? '—' : optimize.quality}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={optimize.quality}
            disabled={qualityDisabled}
            onChange={(e) => setOptimize({ quality: Number(e.target.value) })}
            className="w-full accent-brand-600"
          />
          <p className="text-xs text-slate-400">
            {qualityDisabled
              ? 'PNG es sin pérdida; la calidad no aplica.'
              : 'Más bajo = archivo más pequeño. 75–85 suele ser el punto ideal.'}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <Button variant="secondary" onClick={() => setStep('resize')}>
          Atrás
        </Button>
        <Button size="lg" onClick={() => void process()} disabled={count === 0}>
          Procesar {count > 0 ? `(${count})` : ''}
          <ArrowRight />
        </Button>
      </div>
    </div>
  )
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}
