# Neon Mile — Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/mroisxyz/gta6-cover-studio-v3/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/mroisxyz/gta6-cover-studio-v3/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A static, offline cover-art maker in the spirit of those sun-bleached, multi-panel
crime caper posters. Drop in your own photos and the studio paints a fresh
comic-panel cover: a graded sunset sky, a striped sun, skyline and palm
silhouettes, cream-and-gold gutters, and a big extruded chrome headline with
neon striping. Cast tags, a tagline, a billing block and an original seal finish
the print. Every letterform, silhouette and texture is drawn with canvas paths
and gradients by this app — no Rockstar logos, artwork, characters or fonts.

## What it does

- Takes any photo from your machine (a local file input — images are read with
  `URL.createObjectURL` and never uploaded). Two sample photos are included so
  the studio is ready the moment it opens.
- Lays your photos across a hero panel and six comic panels. Click a panel
  thumbnail to select it, assign any photo to it, then zoom and position with
  sliders or by dragging directly on the preview.
- Edit the title, caption, three cast name/role pairs and the billing block.
- Three title treatments (NEON MILE, PALM HEAT, GOLDEN VICE), three sunset
  grades, three panel layouts and three post sizes.
- A live canvas preview and a one-click **Export PNG** button that writes the
  full-resolution cover as
  `1080 × 1080`, `1080 × 1350` or `1920 × 1080`.

Demo views: `?demo=cover` shows a finished export large on a dark stage;
`?demo=editor` opens the full studio with sample photos loaded.

## Run it

```
node serve.ts
```

Then open `http://localhost:8080`. The app is plain static files under `app/`
with no build step and no network requests — every script, image and stylesheet
is local.

To hand it in (outside the grader, `MAKEFUN_OUTPUT_DIR` stands in for `/output`):

```
$env:MAKEFUN_OUTPUT_DIR="$env:TEMP\cover-v3-out"
node main.ts
```

---

Built for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun. Try make.fun: https://make.fun/?ref=jhbwqchj&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01
