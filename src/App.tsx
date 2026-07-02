import { useImages } from './store/images'
import { Stepper } from './components/Stepper'
import { Dropzone } from './components/Dropzone'
import { ImageGrid } from './components/ImageGrid'
import { ResizePanel } from './components/ResizePanel'
import { OptimizePanel } from './components/OptimizePanel'
import { DownloadPanel } from './components/DownloadPanel'
import { Button } from './components/ui/Button'

export default function App() {
  const step = useImages((s) => s.step)
  const items = useImages((s) => s.items)
  const setStep = useImages((s) => s.setStep)
  const hasItems = items.length > 0

  return (
    <div className="flex min-h-full flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16">
        <div className="py-6">
          <Stepper />
        </div>

        {step === 'upload' && (
          <section>
            {hasItems ? (
              <div className="space-y-6">
                <ImageGrid />
                <div className="flex justify-end">
                  <Button size="lg" onClick={() => setStep('resize')}>
                    Continuar
                  </Button>
                </div>
              </div>
            ) : (
              <Dropzone />
            )}
          </section>
        )}

        {(step === 'resize' || step === 'optimize') && (
          <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div>
              <ImageGrid />
            </div>
            <aside className="lg:sticky lg:top-6 lg:h-fit">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {step === 'resize' ? <ResizePanel /> : <OptimizePanel />}
              </div>
            </aside>
          </section>
        )}

        {step === 'download' && (
          <section className="space-y-6">
            <DownloadPanel />
            <ImageGrid />
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <LogoIcon />
        </div>
        <div>
          <h1 className="text-base font-bold leading-tight text-slate-800">
            Optimizador de imágenes
          </h1>
          <p className="text-xs text-slate-500">
            Redimensiona y comprime en lote · 100% en tu navegador
          </p>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 text-center text-xs text-slate-400">
        Tus imágenes se procesan localmente y nunca se suben a ningún servidor.
      </div>
    </footer>
  )
}

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}
