import { create } from 'zustand'
import type {
  ImageItem,
  OptimizeSettings,
  ResizeSettings,
  Step,
  UploadMode,
} from '../types'
import { loadImageMeta } from '../lib/decode'
import { folderOf } from '../lib/folders'
import { processImage } from '../lib/pipeline'
import { WorkerPool } from '../lib/pool'
import { isLikelyHeic } from '../lib/resizeMath'

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif)$/i

const defaultResize: ResizeSettings = {
  mode: 'percentage',
  width: 0,
  height: 0,
  keepAspectRatio: true,
  noEnlarge: true,
  percentage: 50,
}

const defaultOptimize: OptimizeSettings = {
  format: 'webp',
  quality: 80,
}

interface ImagesState {
  items: ImageItem[]
  resize: ResizeSettings
  optimize: OptimizeSettings
  step: Step
  mode: UploadMode
  processing: boolean

  addFiles: (files: File[]) => Promise<void>
  removeItem: (id: string) => void
  clearAll: () => void
  reset: () => void
  setResize: (patch: Partial<ResizeSettings>) => void
  setOptimize: (patch: Partial<OptimizeSettings>) => void
  setStep: (step: Step) => void
  setMode: (mode: UploadMode) => void
  process: () => Promise<void>
}

function revokeItem(item: ImageItem): void {
  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
  if (item.output) URL.revokeObjectURL(item.output.url)
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Error al procesar la imagen.'
}

export const useImages = create<ImagesState>((set, get) => {
  const patchItem = (id: string, patch: Partial<ImageItem>) =>
    set((state) => ({
      items: state.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }))

  return {
    items: [],
    resize: defaultResize,
    optimize: defaultOptimize,
    step: 'upload',
    mode: 'images',
    processing: false,

    async addFiles(files) {
      const accepted = files.filter(
        (f) => f.type.startsWith('image/') || isLikelyHeic(f) || IMAGE_EXT.test(f.name),
      )
      const newItems = await Promise.all(
        accepted.map(async (file): Promise<ImageItem> => {
          const id = crypto.randomUUID()
          const bareItem = {
            id,
            file,
            name: file.name,
            folder: folderOf(file),
            originalSize: file.size,
          }
          if (isLikelyHeic(file)) {
            return {
              ...bareItem,
              originalWidth: 0,
              originalHeight: 0,
              previewUrl: '',
              status: 'unsupported',
              error:
                'HEIC no es compatible en este navegador. Conviértelo a JPEG primero.',
            }
          }
          try {
            const meta = await loadImageMeta(file)
            return {
              ...bareItem,
              originalWidth: meta.width,
              originalHeight: meta.height,
              previewUrl: meta.previewUrl,
              status: 'queued',
            }
          } catch {
            return {
              ...bareItem,
              originalWidth: 0,
              originalHeight: 0,
              previewUrl: '',
              status: 'unsupported',
              error: 'No se pudo leer la imagen (¿formato no soportado?).',
            }
          }
        }),
      )
      set((state) => ({ items: [...state.items, ...newItems] }))
    },

    removeItem(id) {
      set((state) => {
        const target = state.items.find((it) => it.id === id)
        if (target) revokeItem(target)
        return { items: state.items.filter((it) => it.id !== id) }
      })
    },

    clearAll() {
      get().items.forEach(revokeItem)
      set({ items: [], step: 'upload' })
    },

    reset() {
      get().items.forEach(revokeItem)
      set({
        items: [],
        resize: defaultResize,
        optimize: defaultOptimize,
        step: 'upload',
        mode: 'images',
        processing: false,
      })
    },

    setResize(patch) {
      set((state) => ({ resize: { ...state.resize, ...patch } }))
    },

    setOptimize(patch) {
      set((state) => ({ optimize: { ...state.optimize, ...patch } }))
    },

    setStep(step) {
      set({ step })
    },

    setMode(mode) {
      set({ mode })
    },

    async process() {
      const { items, resize, optimize } = get()
      const targets = items.filter((it) => it.status !== 'unsupported')
      if (targets.length === 0) return

      // Limpia salidas previas (reprocesar con nuevos ajustes).
      items.forEach((it) => {
        if (it.output) URL.revokeObjectURL(it.output.url)
      })
      set((state) => ({
        processing: true,
        step: 'download',
        items: state.items.map((it) =>
          it.status === 'unsupported'
            ? it
            : { ...it, status: 'queued', output: undefined, error: undefined },
        ),
      }))

      const pool = new WorkerPool()
      try {
        await Promise.all(
          targets.map((item) =>
            pool.run(async (worker) => {
              patchItem(item.id, { status: 'processing' })
              try {
                const output = await processImage(item, resize, optimize, worker)
                patchItem(item.id, { status: 'done', output })
              } catch (err) {
                patchItem(item.id, { status: 'error', error: errorMessage(err) })
              }
            }),
          ),
        )
      } finally {
        pool.terminate()
        set({ processing: false })
      }
    },
  }
})
