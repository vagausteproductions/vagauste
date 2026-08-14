"""Vagauste media pipeline verification — Playwright"""
import json
from playwright.sync_api import sync_playwright

console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda exc: console_errors.append(f"[pageerror] {exc}"))

    page.goto("http://127.0.0.1:8932/", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(3500)

    # hero video state
    vid = page.evaluate("""() => {
        const v = document.querySelector('video.hero__film');
        return {
            exists: !!v,
            currentSrc: v ? v.currentSrc : null,
            readyState: v ? v.readyState : null,
            paused: v ? v.paused : null,
            error: v && v.error ? v.error.code : null,
            preload: v ? v.getAttribute('preload') : null,
            sourceCount: v ? v.querySelectorAll('source').length : null,
            autoplay: v ? v.autoplay : null, muted: v ? v.muted : null,
            loop: v ? v.loop : null, playsinline: v ? v.hasAttribute('playsinline') : null,
            poster: v ? v.getAttribute('poster') : null
        };
    }""")

    # every picture source + video source -> HTTP status
    sources = page.evaluate("""() => {
        const urls = [];
        document.querySelectorAll('picture source[srcset]').forEach(s => urls.push(s.getAttribute('srcset')));
        const v = document.querySelector('video.hero__film');
        if (v) v.querySelectorAll('source').forEach(s => urls.push(s.getAttribute('src')));
        return urls;
    }""")
    statuses = page.evaluate("""async (urls) => {
        const out = [];
        for (const u of urls) {
            try { const r = await fetch(u); out.push({u: u, status: r.status, bytes: (await r.arrayBuffer()).byteLength}); }
            catch (e) { out.push({u: u, status: 'ERR ' + e.message}); }
        }
        return out;
    }""", sources)

    # what each img resolved to (which source won)
    imgs = page.evaluate("""() => {
        const out = [];
        document.querySelectorAll('img').forEach(im => {
            const pic = im.closest('picture');
            if (pic) out.push({ src: im.getAttribute('src'), currentSrc: im.currentSrc, picSources: pic.querySelectorAll('source').length });
        });
        return out;
    }""")

    print(json.dumps({
        "video": vid,
        "sourceStatuses": statuses,
        "wrappedImgs": imgs,
        "consoleErrors": console_errors
    }, indent=2))
    browser.close()
