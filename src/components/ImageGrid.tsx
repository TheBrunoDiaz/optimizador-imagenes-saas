import { useState } from 'react'
import { useImages } from '../store/images'
import { ImageCard } from './ImageCard'
import { Dropzone } from './Dropzone'
import {
  folderLabel,
  groupByFolder,
  hasNamedFolders,
  type FolderGroup,
} from '../lib/folders'
import { downloadFolderZip } from '../lib/download'
import { formatBytes, savingsPercent } from '../lib/resizeMath'

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'

export function ImageGrid() {
  const items = useImages((s) => s.items)
  const step = useImages((s) => s.step)
  const mode = useImages((s) => s.mode)

  const grouped = mode === 'folders' && hasNamedFolders(items)

  if (!grouped) {
    return (
      <div className={GRID}>
        {items.map((item) => (
          <ImageCard key={item.id} item={item} />
        ))}
        {step !== 'download' && <Dropzone compact />}
      </div>
    )
  }

  const groups = groupByFolder(items)
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <FolderSection
          key={group.folder || '__loose__'}
          group={group}
          showZip={step === 'download'}
        />
      ))}
      {step !== 'download' && (
        <div className={GRID}>
          <Dropzone compact />
        </div>
      )}
    </div>
  )
}

function FolderSection({
  group,
  showZip,
}: {
  group: FolderGroup
  showZip: boolean
}) {
  const [busy, setBusy] = useState(false)
  const done = group.items.filter((i) => i.status === 'done' && i.output)
  const originalSize = done.reduce((sum, i) => sum + i.originalSize, 0)
  const outputSize = done.reduce((sum, i) => sum + (i.output?.size ?? 0), 0)
  const saved = savingsPercent(originalSize, outputSize)

  async function handleZip() {
    setBusy(true)
    try {
      await downloadFolderZip(group)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-brand-600">
            <FolderIcon />
          </span>
          <h3 className="font-semibold text-slate-700">{folderLabel(group.folder)}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {group.items.length}
          </span>
        </div>
        {showZip && done.length > 0 && (
          <div className="flex items-center gap-3">
            {saved > 0 && (
              <span className="text-xs text-slate-500">
                {formatBytes(outputSize)}
                <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
                  −{saved}%
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleZip()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              <DownloadIcon />
              {busy ? 'Preparando…' : 'Descargar ZIP'}
            </button>
          </div>
        )}
      </div>
      <div className={GRID}>
        {group.items.map((item) => (
          <ImageCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
