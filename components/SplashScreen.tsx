"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

const SESSION_KEY = "pb-splash-shown"
const MIN_VISIBLE_MS = 1000
const FADE_MS = 500

export default function SplashScreen() {

  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false)
      setMounted(false)
      return
    }

    const start = performance.now()
    let fadeTimer: ReturnType<typeof setTimeout> | undefined
    let unmountTimer: ReturnType<typeof setTimeout> | undefined

    const finish = () => {
      const elapsed = performance.now() - start
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)
      fadeTimer = setTimeout(() => {
        setVisible(false)
        sessionStorage.setItem(SESSION_KEY, "1")
        unmountTimer = setTimeout(() => setMounted(false), FADE_MS)
      }, wait)
    }

    if (document.readyState === "complete") {
      finish()
    } else {
      window.addEventListener("load", finish, { once: true })
    }

    return () => {
      window.removeEventListener("load", finish)
      if (fadeTimer) clearTimeout(fadeTimer)
      if (unmountTimer) clearTimeout(unmountTimer)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted])

  if (!mounted) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity ease-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <Image
        src="/images/brand/logo-mark.png"
        alt=""
        width={213}
        height={320}
        priority
        className="animate-splash-pulse h-28 w-auto sm:h-36 lg:h-44"
      />
      <span className="mt-5 font-cinzel text-base font-bold uppercase tracking-[0.3em] text-black sm:text-xl lg:text-2xl">
        Piyush Bholla
      </span>
    </div>
  )
}
