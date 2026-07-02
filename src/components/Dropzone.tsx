import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useImages } from '../store/images'
import { cn } from '../lib/cn'

interface DropzoneProps {
  /** Compacto para reutilizar como botón "añadir más" dentro de la grilla. */
  compact?: boolean
}

export function Dropzone({ compact = false }: DropzoneProps) {
  const addFiles = useImages((s) => s.addFiles)
  const setStep = useImages((s) => s.setStep)
  const mode = useImages((s) => s.mode)
  const folders = mode === 'folders'

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return
      await addFiles(accepted)
      if (!compact) setStep('resize')
    },
    [addFiles, setStep, compact],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    noClick: compact,
    noKeyboard: compact,
  })

  // En modo carpetas, el clic abre el selector de carpeta. El drop de carpetas ya
  // lo traversa react-dropzone/file-selector en cualquier modo.
  const folderAttrs = folders ? { webkitdirectory: 'true' } : {}

  if (compact) {
    return (
      <div {...getRootProps()} className="h-full">
        <input {...getInputProps()} {...folderAttrs} />
        <button
          type="button"
          onClick={open}
          className={cn(
            'flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm font-medium transition-colors',
            isDragActive
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-slate-300 text-slate-500 hover:border-brand-400 hover:text-brand-600',
          )}
        >
          <PlusIcon />
          {folders ? 'Añadir más carpetas' : 'Añadir más imágenes'}
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-20 text-center transition-colors',
        isDragActive
          ? 'border-brand-500 bg-brand-50'
          : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50',
      )}
    >
      <input {...getInputProps()} {...folderAttrs} />
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        {folders ? <FolderIcon /> : <UploadIcon />}
      </div>
      <p className="text-lg font-semibold text-slate-700">
        {folders ? 'Arrastra tus carpetas aquí' : 'Arrastra tus imágenes aquí'}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {folders
          ? 'o haz clic para seleccionar una carpeta — cada carpeta será un ZIP'
          : 'o haz clic para seleccionarlas — JPG, PNG, WebP, GIF, AVIF'}
      </p>
      <p className="mt-6 max-w-md text-xs text-slate-400">
        Todo el procesamiento ocurre en tu navegador. Tus imágenes nunca se suben
        a ningún servidor.
      </p>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
