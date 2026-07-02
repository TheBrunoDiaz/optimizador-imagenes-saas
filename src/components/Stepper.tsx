import { useImages } from '../store/images'
import type { Step } from '../types'
import { cn } from '../lib/cn'

const STEPS: Array<{ key: Step; label: string }> = [
  { key: 'upload', label: 'Subir' },
  { key: 'resize', label: 'Redimensionar' },
  { key: 'optimize', label: 'Optimizar' },
  { key: 'download', label: 'Descargar' },
]

export function Stepper() {
  const step = useImages((s) => s.step)
  const activeIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((s, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'todo'
        return (
          <li key={s.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  state === 'done' && 'bg-brand-600 text-white',
                  state === 'active' && 'bg-brand-600 text-white ring-4 ring-brand-100',
                  state === 'todo' && 'bg-slate-200 text-slate-500',
                )}
              >
                {state === 'done' ? <CheckIcon /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:inline',
                  state === 'todo' ? 'text-slate-400' : 'text-slate-700',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  'h-0.5 w-6 rounded sm:w-10',
                  i < activeIndex ? 'bg-brand-500' : 'bg-slate-200',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
