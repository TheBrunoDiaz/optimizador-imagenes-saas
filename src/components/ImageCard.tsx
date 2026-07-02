import { useImages } from '../store/images'
import type { ImageItem } from '../types'
import { cn } from '../lib/cn'
import { saveFromUrl } from '../lib/download'
import {
  computeTargetDimensions,
  formatBytes,
  savingsPercent,
} from '../lib/resizeMath'

interface ImageCardProps {
  item: ImageItem
}

export function ImageCard({ item }: ImageCardProps) {
  const step = useImages((s) => s.step)
  const resize = useImages((s) => s.resize)
  const removeItem = useImages((s) => s.removeItem)

  const unsupported = item.status === 'unsupported'
  const target =
    !unsupported && item.originalWidth > 0
      ? computeTargetDimensions(
          { width: item.originalWidth, height: item.originalHeight },
          resize,
        )
      : null

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => removeItem(item.id)}
        title="Quitar"
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow transition hover:text-red-600 group-hover:opacity-100"
      >
        <CloseIcon />
      </button>

      <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 p-2">
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt={item.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ImageIcon />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-sm font-medium text-slate-700" title={item.name}>
          {item.name}
        </p>

        {unsupported ? (
          <p className="text-xs text-red-600">{item.error}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <DimBadge>
              {item.originalWidth} × {item.originalHeight}
            </DimBadge>
            {step !== 'download' && target && (
              <>
                <Arrow />
                <DimBadge highlight>
                  {target.width} × {target.height}
                </DimBadge>
              </>
            )}
          </div>
        )}

        {!unsupported && step !== 'download' && (
          <p className="mt-auto text-xs text-slate-400">
            {formatBytes(item.originalSize)}
          </p>
        )}

        {step === 'download' && !unsupported && (
          <ResultRow item={item} />
        )}
      </div>
    </div>
  )
}

function ResultRow({ item }: { item: ImageItem }) {
  if (item.status === 'processing' || item.status === 'queued') {
    return (
      <div className="mt-auto flex items-center gap-2 text-xs text-slate-400">
        <Spinner />
        Procesando…
      </div>
    )
  }
  if (item.status === 'error') {
    return <p className="mt-auto text-xs text-red-600">{item.error}</p>
  }
  if (item.status === 'done' && item.output) {
    const saved = savingsPercent(item.originalSize, item.output.size)
    return (
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">{formatBytes(item.originalSize)}</span>
          <Arrow />
          <span className="font-semibold text-slate-700">
            {formatBytes(item.output.size)}
          </span>
          {saved > 0 && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
              −{saved}%
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => saveFromUrl(item.output!.url, item.output!.name)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <DownloadIcon />
          Descargar
        </button>
      </div>
    )
  }
  return null
}

function DimBadge({
  children,
  highlight,
}: {
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 font-medium tabular-nums',
        highlight ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500',
      )}
    >
      {children}
    </span>
  )
}

function Arrow() {
  return <span className="text-slate-400">→</span>
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  )
}
