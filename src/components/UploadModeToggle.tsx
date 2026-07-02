import { useImages } from '../store/images'
import type { UploadMode } from '../types'
import { cn } from '../lib/cn'

const OPTIONS: Array<{ value: UploadMode; label: string; hint: string }> = [
  { value: 'images', label: 'Imágenes sueltas', hint: 'Un lote → un ZIP' },
  { value: 'folders', label: 'Carpetas', hint: 'Un ZIP por carpeta' },
]

export function UploadModeToggle() {
  const mode = useImages((s) => s.mode)
  const setMode = useImages((s) => s.setMode)

  return (
    <div className="mx-auto mb-6 flex w-full max-w-md gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
      {OPTIONS.map((opt) => {
        const active = mode === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setMode(opt.value)}
            className={cn(
              'flex flex-1 flex-col items-center rounded-lg px-3 py-2.5 transition-colors',
              active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            <span className="text-sm font-semibold">{opt.label}</span>
            <span className={cn('text-xs', active ? 'text-brand-100' : 'text-slate-400')}>
              {opt.hint}
            </span>
          </button>
        )
      })}
    </div>
  )
}
