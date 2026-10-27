"use client"

import { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  return (
    <section
      aria-label="Introduction"
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/images/hero/poster.webp"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {muted ? (
          <VolumeX className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        ) : (
          <Volume2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        )}
      </button>
    </section>
  )
}
