import { useImages } from '../store/images'
import { cn } from '../lib/cn'
import { Button } from './ui/Button'

const PERCENT_PRESETS = [25, 50, 75]

export function ResizePanel() {
  const resize = useImages((s) => s.resize)
  const setResize = useImages((s) => s.setResize)
  const setStep = useImages((s) => s.setStep)

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-lg font-semibold text-slate-800">Opciones de redimensión</h2>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ModeTab
          active={resize.mode === 'pixels'}
          onClick={() => setResize({ mode: 'pixels' })}
          label="Por píxeles"
        />
        <ModeTab
          active={resize.mode === 'percentage'}
          onClick={() => setResize({ mode: 'percentage' })}
          label="Por porcentaje"
        />
      </div>

      <div className="mt-5 flex-1 space-y-4">
        {resize.mode === 'pixels' ? (
          <>
            <NumberField
              label="Ancho (px)"
              value={resize.width}
              onChange={(width) => setResize({ width })}
            />
            <NumberField
              label="Alto (px)"
              value={resize.height}
              onChange={(height) => setResize({ height })}
            />
            <Checkbox
              label="Mantener relación de aspecto"
              checked={resize.keepAspectRatio}
              onChange={(keepAspectRatio) => setResize({ keepAspectRatio })}
            />
            <Checkbox
              label="No agrandar si el original es más pequeño"
              checked={resize.noEnlarge}
              onChange={(noEnlarge) => setResize({ noEnlarge })}
            />
            <p className="text-xs text-slate-400">
              Deja un campo en 0 para calcularlo automáticamente según la proporción.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              Redimensionar al{' '}
              <span className="font-semibold text-slate-800">{resize.percentage}%</span>{' '}
              del tamaño original.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PERCENT_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setResize({ percentage: p })}
                  className={cn(
                    'rounded-lg border px-2 py-3 text-sm font-semibold transition-colors',
                    resize.percentage === p
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-sm text-slate-600">Personalizado (%)</span>
              <input
                type="range"
                min={1}
                max={100}
                value={resize.percentage}
                onChange={(e) => setResize({ percentage: Number(e.target.value) })}
                className="mt-2 w-full accent-brand-600"
              />
            </label>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <Button variant="secondary" onClick={() => setStep('upload')}>
          Atrás
        </Button>
        <Button size="lg" onClick={() => setStep('optimize')}>
          Siguiente: optimizar
          <ArrowRight />
        </Button>
      </div>
    </div>
  )
}

function ModeTab({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-3 text-sm font-semibold transition-colors',
        active
          ? 'border-brand-500 bg-brand-50 text-brand-700'
          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
      )}
    >
      {label}
    </button>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-600">{label}</span>
      <input
        type="number"
        min={0}
        value={value || ''}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm tabular-nums focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  )
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="text-sm text-slate-600">{label}</span>
    </label>
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
