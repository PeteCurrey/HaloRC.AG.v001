'use client'

import React, { useEffect, useRef, useState } from 'react'
import s from './ScrollReveal.module.css'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string | undefined
  staggerMs?: number | undefined
}

export function ScrollReveal({
  children,
  className,
  staggerMs,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${s.reveal} ${className || ''}`}
      data-visible={isVisible}
      style={staggerMs ? { transitionDelay: `${staggerMs}ms` } : undefined}
    >
      {children}
    </div>
  )
}
