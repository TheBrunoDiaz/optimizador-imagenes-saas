import { useImages } from '../store/images'
import { ImageCard } from './ImageCard'
import { Dropzone } from './Dropzone'

export function ImageGrid() {
  const items = useImages((s) => s.items)
  const step = useImages((s) => s.step)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ImageCard key={item.id} item={item} />
      ))}
      {step !== 'download' && <Dropzone compact />}
    </div>
  )
}
