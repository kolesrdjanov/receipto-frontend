import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // Re-sync to the requested index whenever the gallery (re)opens or the target changes.
  // Done during render per React's "adjust state when a prop changes" guidance, which
  // avoids the cascading render of a setState-in-effect.
  const syncKey = `${open}:${initialIndex}`
  const [lastSyncKey, setLastSyncKey] = useState(syncKey)
  if (syncKey !== lastSyncKey) {
    setLastSyncKey(syncKey)
    if (open) setIndex(clampIndex(initialIndex))
  }

  const current = safeImages[index]
  // Detect PDFs by checking URL extension OR Cloudinary raw resource type path
  const isPdf = useMemo(() => {
    if (!current) return false
    const lowerUrl = current.toLowerCase()
    // Check for .pdf extension or Cloudinary raw resource path
    return lowerUrl.endsWith('.pdf') || lowerUrl.includes('/raw/upload/')
  }, [current])

  const currentDeliverUrl = useMemo(() => {
    if (!current) return ''
    // PDFs don't need Cloudinary transformations
    if (isPdf) return current
    // Use Cloudinary-friendly params when possible; keep blob/data URLs untouched.
    if (current.startsWith('blob:') || current.startsWith('data:')) return current
    return `${current}${current.includes('?') ? '&' : '?'}f_auto,q_auto`
  }, [current, isPdf])

  // For PDF preview, use Google Docs Viewer to avoid auto-download from Cloudinary
  const pdfViewerUrl = useMemo(() => {
    if (!isPdf || !current) return ''
    return `https://docs.google.com/viewer?url=${encodeURIComponent(current)}&embedded=true`
  }, [isPdf, current])

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
    const extension = isPdf ? 'pdf' : 'jpg'
    downloadUrl(currentDeliverUrl, `warranty-${index + 1}.${extension}`)
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

  const isPdfUrl = (url: string) => {
    const l = url.toLowerCase()
    return l.endsWith('.pdf') || l.includes('/raw/upload/')
  }
  const topBtn =
    'grid size-[38px] place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-dvh w-dvw max-w-none rounded-none border-0 bg-black p-0 overflow-hidden">
        <div className="relative h-full w-full bg-black">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between space-y-0 p-4">
            <DialogTitle className="truncate pr-8 text-base font-semibold text-white sm:text-lg">
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleOpenNewTab} disabled={!current} title="Open" className={topBtn}>
                <ExternalLink className="size-[18px]" />
              </button>
              <button type="button" onClick={handleDownload} disabled={!current} title="Download" className={topBtn}>
                <Download className="size-[18px]" />
              </button>
              <button type="button" onClick={() => onOpenChange(false)} title="Close" className={topBtn}>
                <X className="size-[18px]" />
              </button>
            </div>
          </DialogHeader>

          {/* Main content */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {current ? (
              isPdf ? (
                <iframe src={pdfViewerUrl} title={`${title} ${index + 1}`} className="h-full w-full border-0" />
              ) : (
                <img src={currentDeliverUrl} alt={`${title} ${index + 1}`} className="max-h-dvh max-w-dvw object-contain" />
              )
            ) : (
              <div className="text-white/70">No files</div>
            )}
          </div>

          {/* Nav */}
          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                title="Previous"
                className="absolute left-4 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                title="Next"
                className="absolute right-4 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          {/* Bottom: thumbnail dots + counter */}
          {safeImages.length > 1 && (
            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2.5 p-4">
              <div className="flex items-center gap-2">
                {safeImages.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`${i + 1}`}
                    className={cn(
                      'grid size-[42px] place-items-center rounded-lg transition-colors',
                      i === index ? 'border-2 border-white bg-white/15 text-white' : 'bg-white/10 text-white/55 hover:bg-white/20',
                    )}
                  >
                    {isPdfUrl(url) ? <FileText className="size-4" /> : <ImageIcon className="size-4" />}
                  </button>
                ))}
              </div>
              <div className="text-sm text-white/80">
                {index + 1} / {safeImages.length}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

