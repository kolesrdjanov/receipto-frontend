import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react'

interface WarrantyGalleryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  images: string[]
  initialIndex?: number
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function WarrantyGalleryModal({
  open,
  onOpenChange,
  title,
  images,
  initialIndex = 0,
}: WarrantyGalleryModalProps) {
  const safeImages = useMemo(() => images.filter(Boolean), [images])

  const clampIndex = useCallback(
    (i: number) => Math.min(Math.max(i, 0), Math.max(0, safeImages.length - 1)),
    [safeImages.length]
  )

  const [index, setIndex] = useState(() => clampIndex(initialIndex))

  useEffect(() => {
    if (!open) return
    setIndex((prev) => {
      const next = clampIndex(initialIndex)
      return prev === next ? prev : next
    })
  }, [open, initialIndex, clampIndex])

  const current = safeImages[index]

  const currentDeliverUrl = useMemo(() => {
    if (!current) return ''
    // Use Cloudinary-friendly params when possible; keep blob/data URLs untouched.
    if (current.startsWith('blob:') || current.startsWith('data:')) return current
    return `${current}${current.includes('?') ? '&' : '?'}f_auto,q_auto`
  }, [current])

  const goPrev = useCallback(
    () => setIndex((i) => (safeImages.length ? (i - 1 + safeImages.length) % safeImages.length : 0)),
    [safeImages.length]
  )
  const goNext = useCallback(
    () => setIndex((i) => (safeImages.length ? (i + 1) % safeImages.length : 0)),
    [safeImages.length]
  )

  const handleDownload = () => {
    if (!current) return
    downloadUrl(currentDeliverUrl, `warranty-${index + 1}.jpg`)
  }

  const handleOpenNewTab = () => {
    if (!current) return
    window.open(currentDeliverUrl, '_blank', 'noopener,noreferrer')
  }

  // Keyboard navigation
  useEffect(() => {
    if (!open || safeImages.length <= 1) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, safeImages.length, goPrev, goNext])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-dvh w-dvw max-w-none rounded-none p-0 overflow-hidden">
        <div className="relative h-full w-full bg-black">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-white text-base sm:text-lg truncate pr-8">
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleOpenNewTab}
                disabled={!current}
                title="Open"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleDownload}
                disabled={!current}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => onOpenChange(false)}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Main image */}
          <div className="absolute inset-0 flex items-center justify-center">
            {current ? (
              <img
                src={currentDeliverUrl}
                alt={`${title} ${index + 1}`}
                className="max-h-dvh max-w-dvw object-contain"
              />
            ) : (
              <div className="text-white/70">No images</div>
            )}
          </div>

          {/* Nav */}
          {safeImages.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                onClick={goPrev}
                title="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                onClick={goNext}
                title="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex items-center justify-center">
                <div className="text-white/80 text-sm">
                  {index + 1} / {safeImages.length}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

