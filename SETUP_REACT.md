# Setting Up React + shadcn/ui + Tailwind + TypeScript

The current ClearLiving site is **vanilla HTML/CSS/JS**. The `components/ui/expand-cards.tsx`
component requires a React/Next.js environment. Follow these steps to migrate or run it in parallel.

---

## Option A — New Next.js App (Recommended)

### 1. Bootstrap with shadcn CLI

```bash
npx shadcn@latest init
```

Answer the prompts:
- Framework: **Next.js**
- TypeScript: **Yes**
- Tailwind CSS: **Yes**
- Components path: **`/components/ui`** ← Critical (shadcn default, keep it)
- Import alias: `@/`

> **Why `/components/ui` matters**
> shadcn resolves all component installs to this path. If you use a different folder
> (e.g. `/src/components`), the CLI will fail to locate and update components automatically.
> Every `npx shadcn add <component>` writes to this path.

### 2. Install dependencies

```bash
npm install          # installs Next.js, React, Tailwind, TypeScript, etc.
```

No additional packages are needed for these components — they only use:
- React (`useState`, `useEffect`, `useRef`) — bundled with Next.js
- Tailwind utility classes — configured by shadcn init
- Local image assets from `/public/assets/products/` (expand-cards)
- Unsplash image URLs (circular-flip-card-gallery)

### 3. Copy assets

```bash
cp -r public/assets/products  <new-project>/public/assets/products
```

### 4. Place the components

Both components are at the correct path:
```
components/ui/expand-cards.tsx                 ← product expand cards
components/ui/circular-flip-card-gallery.tsx   ← rotating flip-card gallery
```

### 5. Use them in pages

**Product expand cards** — create `app/products/page.tsx`:
```tsx
import ExpandCards from "@/components/ui/expand-cards";

export default function ProductsPage() {
  return (
    <main className="min-h-screen">
      <ExpandCards />
    </main>
  );
}
```

**Circular gallery** — create `app/gallery/page.tsx`:
```tsx
import CircularGallery from "@/components/ui/circular-flip-card-gallery";

export default function GalleryPage() {
  return (
    <main className="w-full">
      <CircularGallery />
    </main>
  );
}
```

### 6. Run

```bash
npm run dev   # http://localhost:3000
```

---

## Option B — Add React to the Existing Vanilla Site

If you want to keep the scroll-driven video scrubber AND use React components:

```bash
# In the project root
npm init -y
npm install react react-dom next typescript @types/react @types/node
npx shadcn@latest init
```

Move `public/` contents to `public/` inside the Next.js project, and keep the
frame-scrubber logic in a `"use client"` component.

---

## Tailwind Config Note

The `expand-cards.tsx` component uses arbitrary values like `text-white/72` and
`border-white/8`. Make sure your `tailwind.config.ts` includes:

```ts
content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
```

No additional plugins are required.
