/* ============================================================
   VAGAUSTÉ — Index (minimal)  |  main.js
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- easing ---------- */
  var ease = {
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    outQuint: function (t) { return 1 - Math.pow(1 - t, 5); },
    inOutQuint: function (t) { return t < .5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2; },
    outExpo: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  };

  /* tiny tween: animate(duration, ease, fn, delay) */
  function animate(dur, easeFn, fn, delay) {
    var start = null, raf = 0, done = false;
    delay = delay || 0;
    function tick(ts) {
      if (done) return;
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / (dur * 1000));
      fn(easeFn(t), t);
      if (t < 1) raf = requestAnimationFrame(tick);
      else done = true;
    }
    setTimeout(function () { if (!done) raf = requestAnimationFrame(tick); }, delay * 1000);
    return { cancel: function () { done = true; cancelAnimationFrame(raf); } };
  }

  /* ============================================================
     1. PRELOADER — A24 bloom, layered trail wordmark, CRT
     ============================================================ */
  var preloader = $(".preloader");
  var coreLetters = $$(".wm-core span");
  var midLetters = $$(".wm-mid span");
  var farLetters = $$(".wm-far span");
  var halo = $(".preloader__halo");
  var sub = $(".preloader__sub");
  var leakEl = $(".preloader__leak");
  var aberEl = $(".wm-aber");
  var loaded = false;

  function runIntro() {
    /* ---- VINTAGE FILM FOCUS PULL (35mm ident) — the logo is photographed,
           not animated: black film → faint horizontal light → silhouette
           through defocus → focus pull → edge-only chromatic fringe →
           optical settle → exposure breathe → micro flicker → clean
           vintage hold. No glitch, no RGB copies, no bloom blowout. ---- */
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var base = 56;

    /* chromatic fringe lives on the OUTER letters (V + é) only —
       center letters stay clean white */
    var coreEdge = [coreLetters[0], coreLetters[7]];
    var coreMid = coreLetters.slice(1, 7);

    /* feet + frames load counter — starts with the intro */
    if (window.VagausteLoad) window.VagausteLoad.start();

    gsap.set(coreLetters, { opacity: 0, y: 0, filter: "blur(24px)", "--ca": "0px" });
    gsap.set(midLetters, { opacity: 0, y: 10, filter: "blur(26px)", "--ca": "0px" });
    gsap.set(farLetters, { opacity: 0, y: 18, filter: "blur(28px)", "--ca": "0px" });
    gsap.set(sub, { opacity: 0, y: 10, filter: "blur(14px)" });
    gsap.set(halo, { xPercent: -50, yPercent: -50, scale: 0.4, scaleX: 0.3, opacity: 0 });

    if (reduced) {
      var tlR = gsap.timeline({ defaults: { ease: "power1.out" } });
      tlR.to(halo, { opacity: 0.7, scale: 0.9, scaleX: 1, duration: 0.9 }, 0.1)
         .to([coreLetters, midLetters, farLetters, sub], { opacity: 1, duration: 0.9 }, 0.4)
         .to(halo, { opacity: 0, duration: 0.8 }, 3.4)
         .to([coreLetters, midLetters, farLetters, sub], { opacity: 0, duration: 0.8 }, 4.4);
      setTimeout(function () { finishIntro(); }, 5400);
      return;
    }

    var tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    /* PHASE 01 — black film: nothing but darkness + grain (0–0.05s) */

    /* PHASE 02–03 — faint horizontal light emerges, expands to wordmark width */
    tl.to(halo, { opacity: 0.35, scale: 0.5, scaleX: 0.4, duration: 0.45, ease: "power2.inOut" }, 0.05)
      .to(halo, { opacity: 0.62, scale: 0.88, scaleX: 1, duration: 0.55, ease: "power2.inOut" }, 0.45);

    /* PHASE 04 — logo silhouette emerges through defocus (still soft) */
    tl.to(coreLetters, { opacity: 0.5, filter: "blur(15px)", duration: 0.45, ease: "power2.in" }, 0.75)
      .to(sub, { opacity: 0.5, filter: "blur(10px)", duration: 0.45, ease: "power2.in" }, 0.82);

    /* PHASE 05 — focus pull: slow ease-out toward sharpness */
    tl.to(coreLetters, { opacity: 0.9, filter: "blur(2.5px)", duration: 0.65, ease: "power2.out" }, 1.2)
      .to(sub, { opacity: 0.9, filter: "blur(1.8px)", duration: 0.6, ease: "power2.out" }, 1.28);

    /* PHASE 06 — chromatic fringe: softened on outer letters (V + é) with
       extra blur so it blends, center letters stay clean white; the
       feathered aberration mask layer fades in */
    tl.to(coreEdge, { "--ca": "10px", filter: "blur(3px)", duration: 0.4, ease: "sine.inOut" }, 1.85)
      .to(coreMid, { "--ca": "1.2px", duration: 0.4, ease: "sine.inOut" }, 1.85)
      .to(aberEl, { opacity: 0.75, duration: 0.6, ease: "power2.out" }, 1.85)
      .to(midLetters, { opacity: 0.55, y: 6, filter: "blur(4px)", "--ca": "3px", duration: 0.8, ease: "power2.out" }, 1.5)
      .to(farLetters, { opacity: 0.35, y: 10, filter: "blur(7px)", "--ca": "4px", duration: 0.9, ease: "power2.out" }, 1.7);

    /* PHASE 07 — optical settle: lockup sharp, edges keep soft fringe */
    tl.to(coreLetters, { filter: "blur(0.6px)", opacity: 1, duration: 0.5, ease: "power2.out" }, 2.25)
      .to(sub, { opacity: 1, filter: "blur(0.4px)", duration: 0.5, ease: "power2.out" }, 2.25)
      .to(coreEdge, { "--ca": "4.5px", filter: "blur(1.2px)", duration: 0.5, ease: "power2.out" }, 2.25)
      .to(coreMid, { "--ca": "0.8px", duration: 0.5, ease: "power2.out" }, 2.25);

    /* PHASE 08 — halation/exposure breathing: 100 → 96 → 100 */
    tl.to(coreLetters, { opacity: 0.96, duration: 0.18, ease: "sine.inOut" }, 2.75)
      .to(coreLetters, { opacity: 1, duration: 0.22, ease: "sine.inOut" }, 2.93);

    /* PHASE 09 — micro flicker: 1 → .98 → 1 → .99 → 1 (organic, no strobe) */
    tl.to(coreLetters, { opacity: 0.98, duration: 0.06, ease: "none" }, 3.15)
      .to(coreLetters, { opacity: 1, duration: 0.05, ease: "none" }, 3.21)
      .to(coreLetters, { opacity: 0.99, duration: 0.05, ease: "none" }, 3.26)
      .to(coreLetters, { opacity: 1, duration: 0.08, ease: "none" }, 3.31);

    /* PHASE 10 — final cleanup: glow softens, soft fringe stays */
    tl.to(halo, { opacity: 0.5, duration: 0.5, ease: "power2.out" }, 3.4)
      .to(coreEdge, { "--ca": "4.5px", filter: "blur(1.2px)", duration: 0.4, ease: "power2.out" }, 3.4)
      .to(coreMid, { "--ca": "0.8px", duration: 0.4, ease: "power2.out" }, 3.4);

    /* PHASE 11 — final vintage frame hold (3.8s → 4.3s) */

    /* EXIT — MELT: the lockup widens from the center while the outer
       letters (V + é) melt away sideways — extra stretch, chromatic
       bleed + blur on the melting edges, a light-leak passes over */
    var wmEl = document.querySelector(".wordmark");

    tl.to(wmEl, { scaleX: 2.3, opacity: 0, duration: 0.9, ease: "power3.in" }, 4.3)
      .to(coreEdge[0], { x: -120, scaleX: 2.6, opacity: 0, filter: "blur(12px)", "--ca": "18px", duration: 0.9, ease: "power3.in" }, 4.3)
      .to(coreEdge[1], { x: 120, scaleX: 2.6, opacity: 0, filter: "blur(12px)", "--ca": "18px", duration: 0.9, ease: "power3.in" }, 4.3)
      .to(coreMid, { opacity: 0, filter: "blur(8px)", "--ca": "1.5px", duration: 0.9, ease: "power3.in" }, 4.3)
      .to(sub, { scaleX: 1.9, opacity: 0, duration: 0.85, ease: "power3.in" }, 4.4)
      .to(midLetters, { "--ca": "8px", duration: 0.85, ease: "power3.in" }, 4.4)
      .to(farLetters, { "--ca": "7px", duration: 0.8, ease: "power3.in" }, 4.5)
      .to(aberEl, { opacity: 0, duration: 0.6, ease: "power2.out" }, 4.3)
      .to(leakEl, { opacity: 0.16, duration: 0.6, ease: "power2.out" }, 4.3)
      .to(halo, { opacity: 0, duration: 0.7, ease: "power2.out" }, 4.3);

    setTimeout(finishIntro, 5400);
  }

  function finishIntro() {
    preloader.classList.add("is-done");
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-loaded");
    loaded = true;
    startReveals();
  }

  /* ============================================================
     2. CURSOR
     ============================================================ */
  var cursor = $(".cursor");
  /* ambient hero film — honour reduced motion */
  var heroFilm = $(".hero__film");
  if (heroFilm && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroFilm.pause();
    heroFilm.style.opacity = "0";
  }
  if (cursor && window.matchMedia("(hover:hover)").matches) {
    var cx = -100, cy = -100, mx = -100, my = -100, cursorRaf = 0;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      cursor.style.opacity = "1";
      if (!cursorRaf) cursorRaf = requestAnimationFrame(loop);
    });
    function loop() {
      cursorRaf = 0;
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.left = cx + "px";
      cursor.style.top = cy + "px";
      if (Math.abs(mx - cx) > 0.5 || Math.abs(my - cy) > 0.5) {
        cursorRaf = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("mousedown", function () { cursor.classList.add("is-down"); });
    document.addEventListener("mouseup", function () { cursor.classList.remove("is-down"); });
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest("a, button, .proj");
      if (t) {
        cursor.classList.add(t.classList.contains("proj") ? "is-view" : "is-hover");
      } else {
        cursor.classList.remove("is-view", "is-hover");
      }
    });
  }

  /* ============================================================
     3. SCROLL — header hide, journey line, traveling light, ghosts
     ============================================================ */
  var header = $("#header");
  var journeyFill = $("#journeyFill");
  var journeyDot = $("#journeyDot");
  var bgGlow = $(".bg-glow");
  var lastY = 0, scrollMax = 0, scrollTicking = false;
  function cacheMetrics() {
    scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  }
  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      scrollTicking = false;
      var y = window.scrollY;
      if (y > lastY && y > 140) header.classList.add("is-hidden");
      else if (y < lastY - 6) header.classList.remove("is-hidden");
      lastY = y;
      var p = scrollMax > 0 ? y / scrollMax : 0;
      journeyFill.style.transform = "scaleY(" + p + ")";
      journeyDot.style.top = (p * 100) + "%";
      bgGlow.style.transform = "translate3d(0," + (-y * 0.3) + "px,0)";
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", cacheMetrics);
  cacheMetrics();
  onScroll();

  /* ============================================================
     4. MOBILE MENU
     ============================================================ */
  var menu = $("#menu"), menuBtn = $("#menuBtn");
  function toggleMenu(open) {
    var isOpen = open !== undefined ? open : !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", isOpen);
    menuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    menu.setAttribute("aria-hidden", isOpen ? "false" : "true");
    document.body.classList.toggle("is-locked", isOpen && !loaded);
  }
  menuBtn.addEventListener("click", function () { toggleMenu(); });

  /* film-negative toggle — invert all colors (NEG) */
  var negBtn = $("#negBtn");
  if (negBtn) {
    negBtn.addEventListener("click", function () {
      var root = document.documentElement;
      root.classList.toggle("is-negative");
      negBtn.setAttribute("aria-pressed", root.classList.contains("is-negative") ? "true" : "false");
    });
  }
  $$(".menu__link").forEach(function (l) {
    l.addEventListener("click", function () { toggleMenu(false); });
  });
  var menuClose = $("#menuClose");
  if (menuClose) {
    menuClose.addEventListener("click", function () { toggleMenu(false); });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("is-open")) toggleMenu(false);
  });

  /* ============================================================
     5. REVEALS (gated until intro finishes)
     ============================================================ */
  var io = null;
  function startReveals() {
    $$(".hero__title .line > span").forEach(function (s, i) {
      setTimeout(function () { s.classList.add("in"); }, 150 + i * 140);
    });
    /* neon billboard flicker — buzzes on after the lines land */
    setTimeout(function () {
      if (window.VagausteNeon) {
        var heroTitle = $(".hero__title");
        if (heroTitle) {
          window.VagausteNeon.start({
            lines: heroTitle.querySelectorAll(".line > span"),
            em: heroTitle.querySelector("em"),
            delay: 1.85
          });
        }
        /* same glowing flicker on the bottom glass tabs — light lives on
           the TEXT, the glass stays clean */
        var tabEls = document.querySelectorAll(".tabs__tab");
        if (tabEls.length) {
          window.VagausteNeon.start({ lines: tabEls, em: null, delay: 2.2 });
        }
      }
    }, 200);
    $$(".split-lines .line > span").forEach(function (s) { s.classList.add("in"); });
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.16 });
    $$("[data-reveal]").forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     6. INDEX — hover preview, opens at the row, smooth follow
     ============================================================ */
  var preview = $(".index__preview");
  var previewImgs = $$(".index__preview img");
  var previewCat = $("#previewCat");
  var rows = $$(".proj");
  if (preview && window.matchMedia("(hover:hover)").matches) {
    var PW = 250, PH = 188; /* 4:3 */
    var quickX = gsap.quickTo(preview, "x", { duration: 0.5, ease: "power3.out" });
    var quickY = gsap.quickTo(preview, "y", { duration: 0.5, ease: "power3.out" });
    function clampX(cx, sw) { return Math.max(16, Math.min(cx, sw - PW - 16)); }
    var secEl = $(".index");
    var secLeft = secEl ? secEl.offsetLeft : 0;
    var secW = secEl ? secEl.offsetWidth : 0;
    var secTop = secEl ? secEl.offsetTop : 0;
    rows.forEach(function (row, i) {
      var relTop = row.offsetTop - secTop;
      var rowH = row.offsetHeight;
      row.addEventListener("mouseenter", function (e) {
        var x = clampX(e.clientX - secLeft + 26, secW);
        var y = relTop + rowH / 2 - PH / 2;
        previewImgs.forEach(function (im, j) { im.classList.toggle("active", j === i); });
        if (previewCat) previewCat.textContent = (row.querySelector(".proj__cat") || {}).textContent || "";
        gsap.set(preview, { x: x, y: y, scale: 0.95 });
        gsap.to(preview, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" });
      });
      row.addEventListener("mousemove", function (e) {
        var rowTopVp = secTop - window.scrollY + relTop;
        var p = (e.clientY - rowTopVp) / rowH - 0.5; /* -0.5..0.5 */
        quickX(clampX(e.clientX - secLeft + 26, secW));
        quickY(relTop + rowH / 2 - PH / 2 + p * 24);
      });
      row.addEventListener("mouseleave", function () {
        gsap.to(preview, { opacity: 0, scale: 0.95, duration: 0.3, ease: "power2.out" });
      });
    });
  }

  /* ============================================================
     6b. PAGES — Film / Image / Story overlays
     ============================================================ */
  var pageEls = $$(".page");
  var currentPage = null;
  function openPage(name) {
    var el = $("#page" + name.charAt(0).toUpperCase() + name.slice(1));
    if (!el) return;
    if (currentPage && currentPage !== el) { /* tab switch: close instantly, open the new one */
      var prev = currentPage;
      currentPage = null;
      prev.classList.remove("is-open");
      prev.setAttribute("aria-hidden", "true");
      gsap.set(prev, { opacity: 0 });
    }
    if (currentPage === el) { closePage(); return; } /* toggle off */
    currentPage = el;
    document.body.classList.add("is-locked");
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    gsap.set(el, { opacity: 0 });
    gsap.to(el, { opacity: 1, duration: 0.45, ease: "power2.out" });
    gsap.fromTo(el.querySelector(".page__inner"),
      { y: 36, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" });
    gsap.fromTo(el.querySelectorAll(".page__item, .page__fig, .page__head > *"),
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.05, delay: 0.15 });
    $$(".tabs__tab").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-page") === name);
    });
    var t = $("#pageTime");
    if (t) t.textContent = (localTime && localTime.textContent) || "--:--";
  }
  function closePage() {
    if (!currentPage) return;
    var el = currentPage;
    currentPage = null;
    $$(".tabs__tab").forEach(function (t) { t.classList.remove("is-active"); });
    gsap.to(el, { opacity: 0, duration: 0.35, ease: "power2.out", onComplete: function () {
      el.classList.remove("is-open");
      el.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
    } });
  }
  $$("[data-page]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      openPage(link.getAttribute("data-page"));
    });
  });
  $$("[data-close]").forEach(function (btn) {
    btn.addEventListener("click", closePage);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePage();
  });

  /* ============================================================
     7. STATS COUNTER
     ============================================================ */
  function countUp(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / 1700);
      el.textContent = Math.round(ease.outCubic(p) * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var statIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        countUp(en.target);
        statIO.unobserve(en.target);
      }
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { statIO.observe(el); });

  /* ============================================================
     8. PARALLAX (media band)
     ============================================================ */
  var par = $$("[data-parallax]");
  if (par.length) {
    var ticking = false;
    function parallax() {
      ticking = false;
      par.forEach(function (img) {
        var r = img.getBoundingClientRect();
        var mid = r.top + r.height / 2 - window.innerHeight / 2;
        var off = Math.max(-40, Math.min(40, mid * -0.08));
        img.style.transform = "translateY(" + off + "px)";
      });
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }, { passive: true });
    parallax();
  }

  /* ============================================================
     9. CURSOR PARALLAX — media textures react to the mouse
     ============================================================ */
  var band = document.querySelector(".band__img");
  if (band && window.matchMedia("(hover:hover)").matches) {
    var bx = 0, by = 0, tx = 0, ty = 0, bandRaf = 0, bandIn = false;
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!bandRaf && bandIn) bandRaf = requestAnimationFrame(loopB);
    });
    function loopB() {
      bandRaf = 0;
      bx += (tx - bx) * 0.06;
      by += (ty - by) * 0.06;
      band.style.setProperty("--px", (bx * 18).toFixed(2) + "px");
      band.style.setProperty("--py", (by * 12).toFixed(2) + "px");
      if (Math.abs(tx - bx) > 0.001 || Math.abs(ty - by) > 0.001) {
        bandRaf = requestAnimationFrame(loopB);
      }
    }
    var bandIO = new IntersectionObserver(function (entries) {
      bandIn = entries[0].isIntersecting;
      if (!bandIn && bandRaf) { cancelAnimationFrame(bandRaf); bandRaf = 0; }
      else if (bandIn && !bandRaf && (Math.abs(tx) > 0.001 || Math.abs(ty) > 0.001)) bandRaf = requestAnimationFrame(loopB);
    }, { threshold: 0 });
    bandIO.observe(band);
  }

  /* ============================================================
     10. LOCAL TIME (PKT)
     ============================================================ */
  var localTime = $(".connect #localTime, #localTime");
  if (localTime) {
    function tickTime() {
      var str;
      try {
        str = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit", hour12: false
        }).format(new Date());
      } catch (e) {
        str = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      }
      localTime.textContent = str;
      var pt = $("#pageTime");
      if (pt) pt.textContent = str;
    }
    tickTime();
    setInterval(tickTime, 30000);
  }

  /* ============================================================
     11. FEET + FRAMES LOAD COUNTER (VagausteLoad)
     ============================================================ */
  (function () {
    var FPS = 24, FR_PER_FT = 40, DURATION = 5400;
    var readout = document.getElementById("vgFtFr");
    var fill = document.getElementById("vgBarFill");
    var bar = document.getElementById("vgBar");
    if (!readout) return;
    var totalFrames = Math.round(FPS * DURATION / 1000);
    var start = null, raf = 0, progress = 0, finished = false;
    function pad(n, len) { var s = String(n); while (s.length < len) s = "0" + s; return s; }
    function render(p) {
      var frames = Math.min(Math.floor(p * totalFrames), totalFrames);
      readout.textContent = pad(Math.floor(frames / FR_PER_FT), 4) + " + " + pad(frames % FR_PER_FT, 2);
      if (fill) fill.style.transform = "scaleX(" + p + ")";
      if (bar) bar.setAttribute("aria-valuenow", Math.round(p * 100));
    }
    function tick(now) {
      if (start === null) start = now;
      progress = Math.min((now - start) / DURATION, 1);
      render(progress);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else { finished = true; }
    }
    window.VagausteLoad = {
      progress: function (p) {
        progress = Math.min(Math.max(p, 0), 1);
        render(progress);
        if (progress >= 1 && !finished) finished = true;
      },
      duration: function (ms) { DURATION = ms; totalFrames = Math.round(FPS * DURATION / 1000); },
      start: function () { if (!raf && !finished) raf = requestAnimationFrame(tick); }
    };
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      render(1); finished = true;
    }
  })();

  /* ============================================================
     12. NEON BILLBOARD FLICKER (VagausteNeon — GSAP opacity-only)
     ============================================================ */
  (function () {
    if (typeof gsap === "undefined") return;
    var rnd = function (a, b) { return gsap.utils.random(a, b, true); };
    window.VagausteNeon = {
      _timers: [],
      start: function (cfg) {
        var o = cfg || {};
        var lines = o.lines || [];
        if (!lines.length) return;
        var em = o.em || null;
        var baseDelay = o.delay != null ? o.delay : 1.6;
        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced) {
          gsap.set(lines.concat(em ? [em] : []), { opacity: 1 });
          return;
        }
        /* flicker WORDS, not lines — split each line into word tubes */
        var words = [];
        var emText = em ? em.textContent.trim() : "";
        lines.forEach(function (line) {
          var text = line.textContent;
          line.textContent = "";
          text.split(/\s+/).filter(Boolean).forEach(function (w, i, arr) {
            var ws = document.createElement("span");
            ws.className = "nw";
            ws.textContent = w + (i < arr.length - 1 ? "\u00A0" : "");
            line.appendChild(ws);
            words.push(ws);
          });
        });
        /* restore the emphasized word as a real <em> so its italic
           styling survives the split */
        if (emText) {
          var found = null;
          words.forEach(function (ws) { if (!found && ws.textContent.indexOf(emText) === 0) found = ws; });
          if (found) {
            var ne = document.createElement("em");
            ne.className = "nw";
            ne.textContent = found.textContent;
            found.parentNode.replaceChild(ne, found);
          }
          em = document.querySelector(".hero__title em");
        }
        words.forEach(function (el, i) {
          this._tube(el, {
            delay: baseDelay + gsap.utils.random(0, 1.5, true) + i * 0.03,
            age: Math.floor(gsap.utils.random(0, 4)),
            humDepth: gsap.utils.random(0.04, 0.10, true)
          });
        }, this);
        if (em) this._tube(em, { delay: baseDelay + gsap.utils.random(0, 1.2, true), age: 2, humDepth: 0.08 });
      },
      stop: function () {
        this._timers.forEach(function (t) { t.kill(); });
        this._timers = [];
      },
      _glassTube: function (el, cfg) {
        var self = this;
        var delay = (cfg && cfg.delay) || 2;
        var master = gsap.timeline({ delay: delay });
        master.fromTo(el, { "--glow": 0.1 }, { "--glow": 0.55, duration: 0.35, ease: "sine.inOut" })
          .to(el, { "--glow": 0.1, duration: 1.4, ease: "sine.inOut" });
        master.eventCallback("onComplete", function () {
          gsap.delayedCall(rnd(1.4, 3.0), function () {
            self._glassTube(el, { delay: 0 });
          });
        });
      },
      _tube: function (el, cfg) {
        var humDepth = cfg.humDepth || 0.055;
        var ageFactor = 1 + Math.min(0.7, (cfg.age || 0) * 0.35);
        var self = this;
        var master = gsap.timeline({ delay: cfg.delay, defaults: { overwrite: "auto" } });
        master
          .to(el, { opacity: 0.30, duration: 0.07 })
          .to(el, { opacity: 0.92, duration: 0.05 })
          .to(el, { opacity: 0.10, duration: 0.09 })
          .to(el, { opacity: 0.88, duration: 0.05 })
          .to(el, { opacity: 0.22, duration: 0.08 })
          .to(el, { opacity: 1.00, duration: 0.06 })
          .to(el, { opacity: 0.55, duration: 0.06 })
          .to(el, { opacity: 1.00, duration: 0.14, ease: "power2.out" });
        master.eventCallback("onComplete", function () {
          self._timers.push(gsap.delayedCall(rnd(0.5, 1.2), cycle));        });
        function cycle() {
          var tl = gsap.timeline({ defaults: { overwrite: "auto" } });
          var roll = Math.random();
          var stutterCut = 0.8 + Math.min(0.16, 0.1 + (cfg.age || 0) * 0.03);
          if (roll < 0.8) {
            /* gentle hum — slow, barely-there shimmer */
            tl.to(el, { opacity: 1 - humDepth, duration: rnd(0.5, 0.9), ease: "sine.inOut" })
              .to(el, { opacity: 1, duration: rnd(0.7, 1.2), ease: "sine.inOut" });
          } else if (roll < stutterCut) {
            /* rare soft stutter — single slow blip */
            tl.to(el, { opacity: rnd(0.45, 0.8), duration: rnd(0.04, 0.09), ease: "power1.in" })
              .to(el, { opacity: 1, duration: rnd(0.08, 0.18), ease: "power1.out" });
          } else {
            /* occasional gentle dip — never fully off */
            var depth = rnd(0.3, 0.5);
            tl.to(el, { opacity: depth, duration: 0.06, ease: "power1.in" })
              .to(el, { opacity: depth, duration: rnd(0.06, 0.1) })
              .to(el, { opacity: 1, duration: rnd(0.12, 0.22), ease: "power1.out" });
          }
          tl.eventCallback("onComplete", function () {
            self._timers.push(gsap.delayedCall(rnd(0.9, 2.0) / ageFactor, cycle));
          });
        }
      }
    };
  })();

  /* ============================================================
     10. GO
     ============================================================ */
  window.addEventListener("DOMContentLoaded", function () {
    setTimeout(runIntro, 350);
  });
  /* safety: never trap the user */
  setTimeout(function () {
    if (!loaded && document.readyState === "complete") {
      preloader.classList.add("is-done");
      document.body.classList.remove("is-locked");
      document.body.classList.add("is-loaded");
      loaded = true;
      startReveals();
    }
  }, 9000);
})();
