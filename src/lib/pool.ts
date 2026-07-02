import * as Comlink from 'comlink'
import type { PipelineApi } from '../workers/pipeline.worker'

export type PipelineRemote = Comlink.Remote<PipelineApi>

/** Concurrencia por defecto: acotada para no reventar memoria en móviles. */
export function defaultPoolSize(): number {
  const cores =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4
  return Math.max(1, Math.min(cores, 4))
}

/**
 * Pool de workers acotado. `run` ejecuta un trabajo por imagen entregándole un
 * worker; los trabajos que exceden el tamaño del pool esperan en cola, así la
 * concurrencia global (incluido el decode en hilo principal) queda limitada.
 * Los trabajos que no usan worker (PNG) igual toman un turno para respetar el
 * límite; simplemente ignoran el handle.
 */
export class WorkerPool {
  private readonly size: number
  private readonly workers: PipelineRemote[] = []
  private readonly raw: Worker[] = []
  private readonly idle: PipelineRemote[] = []
  private readonly waiters: Array<(w: PipelineRemote) => void> = []

  constructor(size: number = defaultPoolSize()) {
    this.size = Math.max(1, size)
  }

  private ensureWorkers(): void {
    while (this.workers.length < this.size) {
      const worker = new Worker(
        new URL('../workers/pipeline.worker.ts', import.meta.url),
        { type: 'module' },
      )
      const proxy = Comlink.wrap<PipelineApi>(worker)
      this.raw.push(worker)
      this.workers.push(proxy)
      this.idle.push(proxy)
    }
  }

  private acquire(): Promise<PipelineRemote> {
    this.ensureWorkers()
    const free = this.idle.pop()
    if (free) return Promise.resolve(free)
    return new Promise((resolve) => this.waiters.push(resolve))
  }

  private release(worker: PipelineRemote): void {
    const next = this.waiters.shift()
    if (next) next(worker)
    else this.idle.push(worker)
  }

  async run<T>(job: (worker: PipelineRemote) => Promise<T>): Promise<T> {
    const worker = await this.acquire()
    try {
      return await job(worker)
    } finally {
      this.release(worker)
    }
  }

  terminate(): void {
    for (const w of this.raw) w.terminate()
    this.raw.length = 0
    this.workers.length = 0
    this.idle.length = 0
    this.waiters.length = 0
  }
}
