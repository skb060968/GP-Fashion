"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface ImageLightboxProps {
  images: string[]
  startIndex: number
  alt: string
  onClose: () => void
}

const ZOOM = 2.5

export default function ImageLightbox({ images, startIndex, alt, onClose }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(() => Math.min(Math.max(startIndex, 0), images.length - 1))
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState("50% 50%")
  const touchStartX = useRef<number | null>(null)
  const swiped = useRef(false)
  const onCloseRef = useRef(onClose)

  const total = images.length
  const hasMany = total > 1

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    if (!dialog.open) dialog.showModal()
    const handleClose = () => onCloseRef.current()
    dialog.addEventListener("close", handleClose)
    return () => {
      dialog.removeEventListener("close", handleClose)
      if (dialog.open) dialog.close()
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
      opener?.focus({ preventScroll: true })
    }
  }, [])

  const go = (delta: number) => {
    if (!hasMany) return
    setIndex((i) => (i + delta + total) % total)
    setZoomed(false)
    setOrigin("50% 50%")
  }

  const close = () => dialogRef.current?.close()

  const originFrom = (el: HTMLElement, clientX: number, clientY: number) => {
    const rect = el.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
    return `${x}% ${y}%`
  }

  const onImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (swiped.current) {
      swiped.current = false
      return
    }
    if (zoomed) {
      setZoomed(false)
      return
    }
    setOrigin(originFrom(e.currentTarget, e.clientX, e.clientY))
    setZoomed(true)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!zoomed) return
    setOrigin(originFrom(e.currentTarget, e.clientX, e.clientY))
  }

  const onTouchStart = (e: React.TouchEvent) => {
    swiped.current = false
    touchStartX.current = zoomed || e.touches.length > 1 ? null : e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) > 40 && hasMany) {
      swiped.current = true
      go(dx < 0 ? 1 : -1)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hasMany) return
    if (e.key === "ArrowRight") { e.preventDefault(); go(1) }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1) }
  }

  const navButton =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black shadow-md transition hover:bg-white focus-visible:ring-black"

  return (
    <dialog
      ref={dialogRef}
      aria-label={`${alt} images`}
      onKeyDown={onKeyDown}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-white p-0 text-black backdrop:bg-white"
    >
      <div className="relative h-full w-full">
        <div
          className={`absolute inset-0 overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          style={{ touchAction: zoomed ? "none" : "manipulation" }}
          onClick={onImageClick}
          onPointerMove={onPointerMove}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <img
            key={images[index]}
            src={images[index]}
            alt={hasMany ? `${alt}, image ${index + 1} of ${total}` : alt}
            draggable={false}
            className="h-full w-full select-none object-contain transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: zoomed ? `scale(${ZOOM})` : "scale(1)", transformOrigin: origin }}
          />
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black shadow-md transition hover:bg-white focus-visible:ring-black sm:right-5 sm:top-5"
        >
          <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>

        {hasMany && (
          <>
            <span
              aria-live="polite"
              className="absolute left-3 top-5 z-10 rounded-full bg-black/70 px-3 py-1 font-jost text-xs font-medium tabular-nums text-white sm:left-5 sm:top-7"
            >
              {index + 1} / {total}
            </span>
            <button type="button" onClick={() => go(-1)} aria-label="Previous image" className={`${navButton} left-3 sm:left-5`}>
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className={`${navButton} right-3 sm:right-5`}>
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
          </>
        )}
      </div>
    </dialog>
  )
}
