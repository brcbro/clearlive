"use client"

import { useEffect, useRef } from "react"

// ── Card data ──────────────────────────────────────────────────────────────
const cardData = [
  {
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&crop=center",
    title: "Golden Hour",
    description: "Capturing the perfect moment when day meets night",
  },
  {
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=600&fit=crop&crop=center",
    title: "Paradise Found",
    description: "Escape to pristine beaches and crystal waters",
  },
  {
    image: "https://images.unsplash.com/photo-1609172303465-56c68ad89aae?w=400&h=600&fit=crop&crop=center",
    title: "Vintage Memories",
    description: "Preserving moments with timeless elegance",
  },
  {
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=600&fit=crop&crop=center",
    title: "Natural Beauty",
    description: "Finding art in nature's simplest forms",
  },
  {
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=600&fit=crop&crop=center",
    title: "Creative Expression",
    description: "Where imagination meets artistic vision",
  },
  {
    image: "https://images.unsplash.com/photo-1681986367283-c6a5fbf3a7b2?w=400&h=600&fit=crop&crop=center",
    title: "Mountain Majesty",
    description: "Standing tall among nature's giants",
  },
  {
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=600&fit=crop&crop=center",
    title: "Urban Lines",
    description: "Geometry and light in modern spaces",
  },
  {
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=600&fit=crop&crop=center",
    title: "Warm Moments",
    description: "Finding comfort in life's simple pleasures",
  },
  {
    image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop&crop=center",
    title: "Cosmic Wonder",
    description: "Exploring the infinite beauty above us",
  },
  {
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop&crop=center",
    title: "Nature's Path",
    description: "Following trails through seasonal beauty",
  },
  {
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=600&fit=crop&crop=center",
    title: "Pure Design",
    description: "Elegance through thoughtful simplicity",
  },
  {
    image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=600&fit=crop&crop=center",
    title: "Ocean Power",
    description: "Witnessing nature's raw energy and grace",
  },
  {
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&crop=center",
    title: "Knowledge Keeper",
    description: "Stories waiting to be discovered",
  },
  {
    image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=600&fit=crop&crop=center",
    title: "Night Lights",
    description: "When the city comes alive with energy",
  },
  {
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&h=600&fit=crop&crop=center",
    title: "Desert Dreams",
    description: "Finding beauty in vast, open spaces",
  },
  {
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=600&fit=crop&crop=center",
    title: "Weathered Journey",
    description: "Stories carved by time and tide",
  },
]

// ── FlipCard ───────────────────────────────────────────────────────────────
interface FlipCardProps {
  image: string
  title: string
  description: string
}

function FlipCard({ image, title, description }: FlipCardProps) {
  return (
    // Outer wrapper: scale-up on hover, perspective for 3-D flip
    <div className="group flex-shrink-0 w-[7.5rem] h-[10.5rem] sm:w-[9rem] sm:h-[12.5rem] md:w-[10.5rem] md:h-[14.5rem] rounded-2xl [perspective:900px] cursor-pointer hover:scale-105 transition-transform duration-300 ease-out">
      {/* Inner: flips on group-hover */}
      <div className="relative w-full h-full rounded-2xl [transform-style:preserve-3d] transition-[transform] duration-700 group-hover:[transform:rotateY(180deg)]">

        {/* Front — image */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden [backface-visibility:hidden]">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const t = e.target as HTMLImageElement
              t.onerror = null
              t.src = "https://placehold.co/400x600/111111/444444?text=•"
            }}
          />
          {/* subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Back — text */}
        <div className="absolute inset-0 rounded-2xl bg-neutral-900 border border-white/10 flex flex-col items-center justify-center gap-2 p-4 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <h3 className="font-semibold text-xs sm:text-sm text-white leading-snug">{title}</h3>
          <p className="text-[10px] sm:text-xs text-neutral-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

// ── HorizontalCardGallery (exported as default) ────────────────────────────
export default function HorizontalCardGallery() {
  // All animation state lives in refs so no React re-renders happen each frame
  const trackRef       = useRef<HTMLDivElement>(null)
  const isPausedRef    = useRef(false)
  const posRef         = useRef(0)          // current translateX in px
  const scrollVelRef   = useRef(0)          // extra speed from scroll/wheel
  const halfWidthRef   = useRef(0)          // width of one copy of the card set
  const rafRef         = useRef<number>(0)

  const BASE_SPEED = 0.55  // px / frame at 60 fps

  // Duplicate cards for seamless infinite loop
  const allCards = [...cardData, ...cardData]

  // ── Animation loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    // Measure the width of one copy after the DOM has painted
    const init = () => {
      // scrollWidth = 2 × one copy (we duplicated)
      halfWidthRef.current = track.scrollWidth / 2

      const frame = () => {
        if (!isPausedRef.current) {
          // Apply friction to scroll-driven extra speed
          scrollVelRef.current *= 0.91

          const speed = BASE_SPEED + scrollVelRef.current
          posRef.current -= speed

          // Seamless wrap: when we've scrolled one full copy, reset
          if (posRef.current <= -halfWidthRef.current) {
            posRef.current += halfWidthRef.current
          }
          // Safety for reverse scroll: don't let position go positive
          if (posRef.current > 0) {
            posRef.current -= halfWidthRef.current
          }

          track.style.transform = `translate3d(${posRef.current}px, 0, 0)`
        }
        rafRef.current = requestAnimationFrame(frame)
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    // Wait one paint tick so scrollWidth is accurate
    const t = setTimeout(init, 60)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── Scroll / wheel → velocity ──────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // deltaY > 0 = scrolling down → cards move left faster (natural)
      scrollVelRef.current = Math.max(-6, Math.min(10, scrollVelRef.current + e.deltaY * 0.035))
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    return () => window.removeEventListener("wheel", onWheel)
  }, [])

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-8 py-16 overflow-hidden">

      {/* Header */}
      <div className="text-center px-6 pointer-events-none select-none">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-3">
          Explore Our World
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm uppercase tracking-[0.2em]">
          Hover to reveal · Scroll to accelerate
        </p>
      </div>

      {/* Marquee strip */}
      <div
        className="w-full overflow-hidden"
        // Pause the whole strip when the mouse enters any card
        onMouseEnter={() => { isPausedRef.current = true }}
        onMouseLeave={() => { isPausedRef.current = false }}
      >
        {/* Edge fade masks so cards don't hard-clip at viewport edges */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 md:w-40 z-10 bg-gradient-to-r from-[#0A0A0A] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 md:w-40 z-10 bg-gradient-to-l from-[#0A0A0A] to-transparent" />

          <div
            ref={trackRef}
            className="flex gap-3 sm:gap-4 md:gap-5 w-max py-4 px-2"
            style={{ willChange: "transform" }}
          >
            {allCards.map((card, i) => (
              <FlipCard key={i} {...card} />
            ))}
          </div>
        </div>
      </div>

    </main>
  )
}
