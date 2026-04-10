"use client";

import { useState } from "react";

// ─── Product data ──────────────────────────────────────────────────────────
const products = [
  {
    id: 1,
    image: "/assets/products/whole-home.png",
    category: "Whole Home",
    title: "ClearCore",
    subtitle: "Point-of-Entry",
    description:
      "Industrial-grade filtration for every tap. Removes 99.9% of chlorine, heavy metals, and VOCs before they enter your home's plumbing.",
    specs: [
      { val: "99.9%",  key: "Chlorine Removed" },
      { val: "10yr",   key: "Filter Life" },
      { val: "∞",      key: "Flow Rate" },
    ],
    price: "$2,499",
    cta: "Explore System",
    label: "ClearCore",
  },
  {
    id: 2,
    image: "/assets/products/shower-head.png",
    category: "Bath & Shower",
    title: "PureFlow",
    subtitle: "Rainfall",
    description:
      "Transform your shower into a spa. Built-in sediment and carbon filtration protects your skin and hair from harsh chemicals.",
    specs: [
      { val: "5-stage", key: "Filtration" },
      { val: "2.5gpm",  key: "Flow Rate" },
      { val: "3mo",     key: "Filter Life" },
    ],
    price: "$189",
    cta: "Buy Now",
    label: "PureFlow",
  },
  {
    id: 3,
    image: "/assets/products/water-filter.png",
    category: "Kitchen",
    title: "Aura",
    subtitle: "Under-Sink",
    description:
      "Flawless drinking water on demand. The 5-stage reverse osmosis system fits neatly under your counter, replacing plastic bottles forever.",
    specs: [
      { val: "RO",       key: "Technology" },
      { val: "0.0001μm", key: "Pore Size" },
      { val: "500gpd",   key: "Capacity" },
    ],
    price: "$450",
    cta: "Buy Now",
    label: "Aura",
  },
];

// ─── Expand-on-hover cards ─────────────────────────────────────────────────
const ExpandCards = () => {
  const [expanded, setExpanded] = useState(0); // index of expanded card

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#050508] px-10">
      <div className="flex h-[72vh] w-full max-w-[1320px] items-center gap-2">
        {products.map((p, idx) => (
          <div
            key={p.id}
            className="group relative overflow-hidden rounded-[28px] border border-white/8 transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
            style={{
              flex: idx === expanded ? "1 1 0" : "0 0 72px",
              height: "100%",
            }}
            onMouseEnter={() => setExpanded(idx)}
          >
            {/* ── Background image ── */}
            <div className="absolute inset-0">
              <img
                src={p.image}
                alt={p.title}
                className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform: idx === expanded ? "scale(1.04)" : "scale(1)",
                }}
              />

              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0 transition-opacity duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  background:
                    "linear-gradient(to right, rgba(5,5,8,0.92) 0%, rgba(5,5,8,0.55) 45%, rgba(5,5,8,0.12) 100%)",
                  opacity: idx === expanded ? 1 : 0,
                }}
              />
            </div>

            {/* ── Collapsed label ── */}
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-between py-6 transition-opacity duration-300"
              style={{ opacity: idx === expanded ? 0 : 1 }}
            >
              <span className="font-serif text-xs font-light text-white/40">
                0{p.id}
              </span>
              <span
                className="text-[0.55rem] font-medium uppercase tracking-[2.5px] text-white/45"
                style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
              >
                {p.label}
              </span>
            </div>

            {/* ── Expanded content ── */}
            <div
              className="absolute inset-0 z-10 flex min-w-[300px] flex-col justify-end p-10 transition-all duration-500"
              style={{
                opacity: idx === expanded ? 1 : 0,
                transform: idx === expanded ? "translateX(0)" : "translateX(-24px)",
                transitionDelay: idx === expanded ? "0.18s" : "0s",
                pointerEvents: idx === expanded ? "auto" : "none",
              }}
            >
              {/* Category */}
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px w-5 bg-white/25" />
                <span className="text-[0.58rem] font-medium uppercase tracking-[3px] text-white/40">
                  {p.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="mb-3 font-serif text-5xl font-light leading-none text-white">
                {p.title}
                <br />
                <em className="text-[#00c6ff]">{p.subtitle}</em>
              </h3>

              {/* Description */}
              <p className="mb-5 max-w-[340px] text-sm font-light leading-relaxed text-white/72">
                {p.description}
              </p>

              {/* Specs */}
              <div className="mb-6 flex gap-5 border-b border-white/10 pb-5">
                {p.specs.map((s) => (
                  <div key={s.key} className="flex flex-col gap-1">
                    <span className="font-serif text-xl font-light text-white">
                      {s.val}
                    </span>
                    <span className="text-[0.55rem] font-medium uppercase tracking-[1.5px] text-white/30">
                      {s.key}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-6">
                <span className="font-serif text-3xl font-light text-white">
                  {p.price}
                </span>
                <button className="inline-flex items-center gap-2 rounded-full border border-[#00c6ff]/35 px-7 py-3 text-[0.76rem] font-medium text-[#00c6ff] transition-all duration-300 hover:border-[#00c6ff]/60 hover:bg-[#00c6ff]/10 hover:shadow-[0_8px_28px_rgba(0,198,255,0.18)]">
                  {p.cta}
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpandCards;
