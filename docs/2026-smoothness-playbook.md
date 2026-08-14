# Vagausté v2 — Apple-Grade Smoothness Playbook (Aug 2026)

**Target:** `C:/Users/Awami/projects/vagauste-v2` — vanilla HTML/CSS/JS, GSAP 3.13 vendored, GitHub Pages, film-grain FX overlays ×5, backdrop-filter ×5, corner CA overlays, hero video (3.8 MB mp4, `preload="auto"`), custom cursor, neg-mode, preloader. **Constraint: zero visual change.**

**Site-specific findings (from code audit):**
- `js/main.js` (674 lines) has **15 independent `requestAnimationFrame` loops** — #1 jank source. No ScrollTrigger, no gsap.ticker.
- 5 × fixed full-viewport FX layers (`.fx`, z 9500) + 4 corner layers (z 9400) + `bg-glow` (fixed 300vh) + journey + cursor ≈ **12+ composited layers**, several full-screen.
- `backdrop-filter` ×5 in `main.css` — the classic mobile repaint killer.
- Cursor grows via `width/height` change (`.is-hover` 44px, `.is-view` 88px) — layout-triggering; should be `transform: scale()`.
- Grain overlay animates a 239 KB PNG at full viewport.
- Images: plain `.jpg`, no srcset/AVIF/WebP, no fetchpriority. Hero poster `hero.jpg` 147 KB.
- Hero video: single H.264 mp4, `preload="auto"` → ~3.8 MB download before first paint on mobile.
- GSAP vendored 3.13; npm latest is **3.15.0**.
- Good already: `decoding="async"`, `loading="lazy"` on below-fold imgs, `preconnect` to fonts, `prefers-reduced-motion` checks ×4, `matchMedia` ×7.

---

## 1. Smooth Scrolling — Lenis

**Decision: Lenis 1.3.x (`@darkroom.engineering/lenis`, ~4.5 kB gz).** It is wrapper-less (drives native scroll, no hijack) so ScrollTrigger math stays correct, and it is the 2026 de-facto standard. Alternatives: GSAP ScrollSmoother (premium, hijacks scroll — heavier, changes scrollbar feel; only if you want built-in parallax), Locomotive Scroll (abandoned), `scroll-behavior: smooth` (no inertia — baseline for keyboard/anchor only).

**Canonical GSAP integration (from Lenis docs):**
```js
const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, touchMultiplier: 1.5, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);        // keep ScrollTrigger in sync
gsap.ticker.add((time) => lenis.raf(time * 1000)); // share GSAP's single clock
gsap.ticker.lagSmoothing(0);                       // no rubber-band after tab switch
```
**Rules for this site:**
- Drive Lenis from `gsap.ticker` — do NOT add a 16th rAF loop.
- **Touch stays native** (`syncTouch` default): iOS native momentum *is* the Apple feel; smoothing is a wheel/desktop feature. Set `smoothWheel: true` only.
- Wire `data-nav` anchors through `lenis.scrollTo('#index', { offset: -80, duration: 1.2 })` — buttery anchor glide.
- `lenis.stop()` while preloader / menu / neg-mode / body lock is active; `lenis.start()` after.
- `prefers-reduced-motion` → skip Lenis entirely (native jump).
- If ScrollTrigger is later added for scrub effects, use `scrub: true` — it inherits the Lenis clock automatically via the ticker line above.

## 2. Rendering & Compositing

- **Layer budget: ≤ 3 full-screen composited layers on mobile.** Currently ~12. Consolidate FX: merge grain/scan/vig/bloom into ONE fixed overlay stacking background-images (or one canvas), corners into a single pseudo-element layer. Fewer layers = less fill-rate + memory on low-end GPUs.
- **backdrop-filter ×5 → eliminate or shrink.** It forces live re-blur of everything beneath on every scroll frame. Same-look alternatives:
  - Static panels: use a **pre-blurred image** of the backdrop (render once, swap in) — identical look, zero runtime cost.
  - Overlays (bloom/vig): they're translucent already — plain `rgba()` gradients + `mix-blend-mode` (GPU-cheap) instead of backdrop-filter.
  - If blur must stay: restrict to small menu/panel areas, never full-viewport; add `@supports not (backdrop-filter: blur(1px)) { …rgba fallback… }` so old Android gets the cheap path.
- **will-change discipline:** only on elements animating *right now*; remove after (GSAP auto-removes inline ones; CSS `will-change` persists forever — the 5 in `main.css` on static overlays must go). `will-change: transform` on a fixed full-screen overlay pins a layer permanently = mobile memory tax.
- **NEG mode:** if implemented as `filter: invert()` on a big container → full-page repaint every toggle and during scroll. Same look, 10× cheaper: overlay a white full-viewport layer with `mix-blend-mode: difference` (GPU-composited, no repaint).
- **Grain:** animating a 239 KB full-viewport PNG per frame is the fill-rate killer. Same look: 64–128 px **tileable** grain PNG with `background-repeat: repeat`, jitter via CSS `steps(2)` transform animation (noise at 30 fps is imperceptible), pause when preloader hidden / tab hidden / off-screen (IntersectionObserver). Static grain (no animation) on `(pointer: coarse)`.
- **Avoid forced reflow:** no reading `offsetTop/scrollHeight` inside scroll handlers; batch reads then writes; cache on resize. Never animate `top/left/width/height/filter` — transform/opacity only.
- **rAF pattern:** ONE master loop (gsap.ticker) with a task registry; every per-frame job is a registered task (cursor, parallax, grain, journey, glow). Pause all loops on `visibilitychange`. Use `content-visibility: auto` + `contain-intrinsic-size` on below-fold sections (verify ScrollTrigger measurements still work).

## 3. Asset Pipeline

- **Images → AVIF first:** AVIF ≈ 50% smaller than WebP. `<picture>`: AVIF → WebP → JPEG, plus `srcset` 480/768/1280/1920 + `sizes` + `fetchpriority="high"` on LCP (hero poster + headline) and `decoding="async"` (already present).
- **Build script with sharp 0.35** (node): batch-convert `assets/img/*.jpg` → `.avif` (q≈40–45) + `.webp` (q≈75) at 4 widths. One-time, zero visual change.
- **Hero video (3.8 MB H.264, preload=auto — the LCP/mobile killer):**
  - Encode **AV1** (libsvtav1, ~1 MB) for Chrome/Android/Edge/FF and **HEVC/H.265** for Safari/iOS (hardware decode, ~1.5 MB), keep H.264 last as fallback. `<source>` order: AV1 → HEVC → MP4.
  - `preload="metadata"` + poster → start real playback only after the preloader finishes; on `(pointer: coarse)` consider `preload="none"` until first interaction.
- **Preload/prefetch:** `<link rel="preload" as="image" fetchpriority="high">` for hero poster; Speculation Rules `prerender` for `bts-page.html` (progressive enhancement, Chrome); keep font preconnects; **self-host the 2 fonts** (kills Google Fonts RTT + CORS, ~1 request).
- **Compression:** Brotli (auto on Cloudflare/Vercel) + gzip fallback; Zstandard where the CDN offers it. Minify CSS/JS/HTML in CI.
- **HTTP/3 (QUIC):** automatic on Cloudflare Pages/Vercel — big win on lossy mobile networks. GitHub Pages has neither HTTP/3 nor Brotli (single US-East region).

## 4. Animation Performance

- **gsap.ticker over raw rAF** — single clock, lagSmoothing, time param, Lenis/ScrollTrigger integration for free. Consolidate the 15 loops into it.
- **transform/opacity only** (x/y/scale/rotation/yPercent); parallax via `yPercent`.
- **Scroll-scrubbed elements (journey fill, bg-glow):** two zero-visual-change options — (a) ScrollTrigger `scrub: true` (adds ~36 kB, consistent with GSAP), or (b) **CSS scroll-driven animations** (`animation-timeline: scroll()`) — by Aug 2026 baseline across browsers, runs on the compositor with zero JS/frame cost. Prefer (b) for the two scrub elements if the math is expressible in CSS; keep (a) for anything needing JS values.
- **Never move the big fixed layers per frame** (bg-glow 300vh). Animate a small child, or scrub via `clip-path`/opacity of a cheap layer instead.
- `gsap.quickTo` for cursor/lerp values — fastest, GC-friendly.
- Respect `prefers-reduced-motion` everywhere (already partly wired).

## 5. Interaction Feel

- **Custom cursor 1:1:** split into two elements — a **core dot that follows raw** (no lerp: `pointermove` → `gsap.set(x/y)` or direct `translate3d`; this is what "1:1" means) and a **halo/trail that lerps** (`gsap.quickTo(el,'x',{duration:0.35})`). Currently the single cursor both lags and resizes via `width/height` — change grow to `transform: scale()` (fixed base 16px, `.is-hover` scale 2.75, `.is-view` scale 5.5).
- Hide custom cursor entirely on touch: `@media (pointer: coarse) { .cursor { display:none } }` — zero cost on mobile.
- **Micro-interactions:** press = fast ease (80–120 ms, `scale .97`), release = slower (200 ms, back to 1) — asymmetric easing is the Apple tell. All transform/opacity. Keep pointermove handler < 1 ms (INP).
- **Haptics-like:** `navigator.vibrate(10)` on taps (Android only; iOS has no API — use a 60 ms visual pulse instead). Menu/panel open: translateX/opacity with `visibility` flip after transition, never layout props.
- Everything above is invisible change — same pixels, snappier feel.

## 6. Performance Budgets (enforce in CI)

| Metric | Target (p75) |
|---|---|
| LCP | ≤ 2.0 s (hero poster/headline; currently doomed by 3.8 MB preload=auto) |
| INP | ≤ 200 ms (aim ≤ 100 ms desktop; cursor/menu handlers < 50 ms) |
| CLS | ≤ 0.01 |
| Frame budget | JS ≤ 5 ms, style/layout ≤ 2 ms, total ≤ 16.7 ms @60 Hz / 8.3 ms @120 Hz |
| Long tasks | none > 50 ms |
| Layers | ≤ 3 full-screen composited |
| Initial transfer | ≤ 1 MB (currently ~5 MB with video) |
| Memory | stable under 1 GB on mobile Safari; `video.src=''` on pagehide |

Test matrix: Moto G / Pixel 6a-class Android (throttled 4× CPU), iPhone SE/12, iPad, 120 Hz flagship, low-end Win laptop, 4G 400 ms RTT.

## 7. Hosting — Move Off GitHub Pages

GitHub Pages: single US-East region, no HTTP/3, no Brotli, no cache TTL control, no WAF. It is the cheapest bottleneck to fix.

- **#1: Cloudflare Pages (free)** — global CDN + HTTP/3 + Brotli/Zstd + `_headers`/`_redirects` files (cache TTLs, security headers, CSP) + free WAF/Bot Fight Mode + instant git deploy. Keep GH Pages as mirror.
- **Vercel:** also excellent edge + previews, but image optimization is paid; Cloudflare's free tier is more generous for pure static.
- **Netlify:** fine, slower edge (AWS us-east origins), less HTTP/3 surface. Skip.
- Headers to ship: `Content-Security-Policy` (`'self'` + fonts.googleapis/gstatic + data:), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors 'none'`. SRI on any CDN scripts.
- Cheap 2026 wins: `llms.txt`, `sitemap.xml`, robots, canonical.

## 8. Tool Catalog (Aug 2026, verified versions from npm where applicable)

### 3D / WebGL
- **three.js** (r0.185) — the standard WebGL engine; any future 3D hero.
- **OGL** — ~60 kB dependency-free WebGL; right fit for film-site shader work.
- **react-three-fiber** — only if React enters the stack (not now).
- **Babylon.js** — full engine w/ physics; overkill for a portfolio.
- **twigl / Shadertoy** — GLSL prototyping playgrounds.
- **three postprocessing (EffectComposer)** — bloom/vignette in-GPU; matches the A24 look at zero DOM cost.

### Scroll / Motion
- **Lenis 1.3.26** — wrapper-less native-feel smoothing; the standard.
- **GSAP 3.15 + ScrollTrigger** — animation standard; scrub + ticker integration (site is on 3.13 — update vendored file).
- **Motion (motion.dev, v13)** — WAAPI-based ~5 kB; micro-interactions without a GSAP license.
- **CSS scroll-driven animations** (`animation-timeline`) — zero-JS compositor scrub; baseline in 2026.
- **ScrollSmoother (premium)** — hijacked buttery scroll + parallax if ever wanted.
- **View Transitions API** — same-document page transitions, no library.

### UI Polish
- **SplitText (premium)** — word/letter reveals (wordmark is already custom).
- **Lottie** — JSON icon/UI animation.
- **vanilla-tilt** — 3D tilt hovers (transform-only).
- **Fontsource / self-hosted fonts** — kill Google Fonts RTT.
- **mix-blend-mode** utilities — film-grade blending, GPU-cheap.

### Performance Auditing
- **Lighthouse 13.4** — LCP/INP/CLS budgets, best-practice audit, CI-able.
- **PageSpeed Insights** — CrUX field data + lab.
- **WebPageTest** — filmstrips, 3G throttle, real Moto G-class devices, multi-region.
- **Chrome DevTools Performance + Rendering panels** — frame-level JS/layout/paint ground truth; layer borders + paint flashing.
- **bundlephobia** — dep size checks.

### Image / Video Optimization
- **sharp 0.35** — node AVIF/WebP encoder; the batch pipeline standard.
- **avifenc / cwebp** — CLI encoders for shell scripts.
- **ffmpeg (libsvtav1, libx265)** — AV1 + HEVC hero-video encodes.
- **HandBrake CLI** — quality-tuned encodes.
- **mediainfo** — verify codec/bitrate on output.
- **Cloudflare Images / Image Resizing** — on-the-fly CDN transforms (paid add-on).

### Hosting / Deploy
- **Cloudflare Pages + wrangler 4.123** — free global edge, HTTP/3, Brotli, WAF, headers file.
- **Vercel** — premium edge + preview deploys.
- **GitHub Actions / auto-deploy.sh** — CI pipeline (minify, convert, deploy).
- **Cloudflare Workers / HTMLRewriter** — edge transforms if ever needed.

### Security
- **Cloudflare WAF + Bot Fight Mode (free)** — DDoS + bot filtering.
- **securityheaders.com** — CSP/HSTS header scanner.
- **Mozilla Observatory** — security score.
- **Google CSP Evaluator** — CSP correctness.
- **SRI (Subresource Integrity)** — pin CDN scripts.
- **Turnstile** — bot-proof contact form if ever added (site currently has no forms = minimal surface).

### AI-Agent Security
- **OWASP ASI / Top 10 for LLM Apps** — the 2026 threat-model catalog for agentic features.
- **Semia** — audits agent skills for security before install.
- **HolGuard / ClawKeeper / RugProof** — agent-skill & smart-contract security tooling (local skills available).
- **guardrails-ai / prompt-guard** — LLM I/O guardrails if AI features are added.
- **llms.txt** — AI-discoverability standard (also good for the site).

### QA / Cross-Device
- **Playwright 1.62** — cross-browser E2E + performance traces; the standard.
- **Lighthouse CI** — budget gates in CI (LCP/INP thresholds).
- **Percy / Applitools** — visual regression (qa/ is hand-screenshotted today — automate it).
- **BrowserStack / LambdaTest** — real-device clouds.
- **WebPageTest mobile** — real low-end Android.
- **Hermes local skills:** `frontend-perf-audit`, `browser-runtime-profiling`, `headless-web-verification`, `dogfood`, `video-frame-ocr`, `gh-pages-deploy`, `cinematic-web-effects` — direct matches for this work.

---

## Prioritized Roadmap

**P0 — do first (biggest smoothness wins, zero visual change):**
1. Collapse the 15 rAF loops into one `gsap.ticker` master loop.
2. Add Lenis (gsap.ticker-driven) + anchor `scrollTo` + touch-native.
3. Move to Cloudflare Pages + security headers + cache TTLs (kill GH Pages as primary).
4. Hero video: AV1 + HEVC encodes, `preload=metadata`, play after preloader.
5. Image pipeline: sharp → AVIF/WebP + srcset + `fetchpriority=high`; self-host fonts.
6. Grain: tileable 64–128 px texture + `steps()` jitter + pause-when-hidden; static on touch.
7. backdrop-filter audit → pre-blurred/rgba equivalents; `@supports` fallback.
8. NEG mode → difference-blend overlay (if currently invert-filter).

**P1:**
9. Cursor: 1:1 core + lerped halo, `scale()` grow, hidden on touch.
10. Scrub elements (journey/glow) → CSS scroll-timeline or ScrollTrigger scrub.
11. will-change audit; `content-visibility` + `contain-intrinsic-size` on below-fold.
12. INP hardening: <1 ms pointer handlers, <50 ms menu/neg toggles.
13. Speculation Rules prerender for bts-page.

**P2:**
14. Update vendored GSAP 3.13 → 3.15.
15. Playwright + Lighthouse CI budgets + automated screenshot diffs.
16. llms.txt / sitemap / robots / canonical.
17. Optional: WebGL grain shader to replace PNG grain entirely.
