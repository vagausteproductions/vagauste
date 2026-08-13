# Vagausté — Index (v2)

Remix of **milez.jp** × **sergiomusel.com/selected-work** with the original
Vagausté brand (mockup fonts, logo, CRT vibe).

## Concept map

| Reference | DNA used |
|---|---|
| **milez.jp** | Numbered work index (01–06), stretch-swap hover on titles (`translateY(-112%) scaleY(4)`, 1.3s `cubic-bezier(.23,1,.32,1)`), editorial hero statement with giant outline numeral, vertical text column, minimal nav |
| **sergiomusel.com** | "Scroll or drag in any direction" gallery wall — full-viewport draggable canvas with inertia, wheel pan, elastic bounds |
| **Vagauste mockup** | Railway font (dafont — Light/Regular/Bold in `assets/fonts/`), monochrome palette, A24 bloom intro, halation/bloom/glow/grain CRT |

## The intro (A24-style, not a copy)

4-layer wordmark: sharp core (4-layer text-shadow bloom) + mid trail ghost
(blur 5px, +10px) + far trail ghost (blur 9px, +22px, RGB chromatic
fringe) + perpetual drifting aura. Layers rise staggered (trail-on-rise),
halo blooms from darkness, letters exit upward with trails following
(trail-on-exit). CRT: scanlines, rolling band, flicker, vignette, heavy
grain on preloader; subtle global CRT overlay across the whole site.

## Run

```bash
cd ~/projects/vagauste-v2
python -m http.server 8932
# open http://127.0.0.1:8932/
```

Dev auto-reload is port-gated to 8932 (never ships).

## Files

- `index.html` — all sections (intro, hero, marquee, index, wall, reel, disciplines, about, contact)
- `css/main.css` — tokens, CRT layer, preloader, layouts
- `js/main.js` — intro timeline, drag wall, reveals, cursor, menu, parallax, counters
- `qa/` — playwright capture frames (intro sequence, sections, mobile)
