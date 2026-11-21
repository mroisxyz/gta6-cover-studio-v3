# Cover Studio — Original GTA-Poster-Style Cover Art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/mroisxyz/gta6-cover-studio-v3/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/mroisxyz/gta6-cover-studio-v3/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An original, offline cover-art maker in the spirit of sun-bleached multi-panel crime-caper posters. Drop in a local photo and the studio paints a fresh mosaic: a graded sunset sky, a striped retro sun, layered skyline and palm silhouettes, near-black gutters, a chrome-edged headline, cast role chips, billing copy and an original-art seal. Every silhouette, gradient and stripe is drawn with canvas paths by this app — no borrowed logos, characters, artwork or fonts.

- **Nine-panel mosaic** — one tight hero crop, two mediums and six small panels; three layouts with different panel scales.
- **Content-aware crops** — a 32×32 scratch canvas scores skin-like pixels (upper body weighted 1.5×) to find each face. Tune focal point and zoom with sliders or drag-to-pan on the preview.
- **Local photos only** — upload with `FileReader` + `createImageBitmap`; two bundled samples load via `fetch` from `samples/`. Nothing is ever uploaded.
- **Three sunset grades, three title presets, three export sizes** — 1080×1080, 1080×1350 and 1920×1080.
- **Live canvas preview and one-click PNG export.**

Demo views: `?demo=cover` (or `?shot=cover`) shows a finished poster on a dark full-viewport stage; `?demo=editor`, `?demo=1` or `?shot=editor` opens the full studio. `?size=portrait|square|wide`, `?photo=pier|boulevard` and `?caption=...` are supported.

## Run it

```
node serve.ts
```

Then open `http://localhost:8080`. The app is plain static ES modules under `app/` with no build step, no libraries and no network requests.

To hand it in, set `MAKEFUN_OUTPUT_DIR` to the output directory and run `node main.ts`; it copies `app/` and `screenshots/` and writes `dossier.json`.

---

Built for the gta6-cover-art-01 bounty. Try make.fun: https://make.fun/?ref=jhbwqchj&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01
