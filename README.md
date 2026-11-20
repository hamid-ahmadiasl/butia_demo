# Novin Profile — concept demo (placeholder brand)

One-page Persian (RTL) demo site showing scroll-driven visual effects for a uPVC window/door profile maker.
All names, numbers and contact details are placeholders. No build step: open `index.html` through any static server
(`python3 -m http.server`) or deploy the folder root to GitHub Pages.

- `index.html` — semantic markup, meta/OG tags, JSON-LD (Organization + WebSite, placeholders)
- `css/style.css` — layout, RTL, responsive
- `js/chat.js` — 24/7 client-side assistant (FAQ, price calculator, lead form). Edit `PRICING` at the top of this file (toman, sample rates).
- `js/main.js` — nav, scroll pin for hero and profile explode, glazing compare, colour picker wiring
- `js/window3d.js` — procedural Three.js window (mitred uPVC frame, double glazing, handle, wood grain, landscape)
- CDN: Three.js 0.160, GSAP 3.12 + ScrollTrigger, Vazirmatn font (jsDelivr)

Before going live: replace placeholders, remove `<meta name="robots" content="noindex">`, set real canonical/OG URLs, update `sitemap.xml`/`robots.txt`.

## Chat assistant / editing prices

Open the floating button at the bottom-left (دستیار نوین). Everything runs in the browser.
Unit prices for the calculator live in the commented `PRICING` object at the top of `js/chat.js` (profile per metre, glass per m², hardware per sash, colour surcharge %, installation per m², and illustrative annual energy saving). Change those numbers only — no rebuild needed.
