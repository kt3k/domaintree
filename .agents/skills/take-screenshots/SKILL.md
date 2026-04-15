# Take README screenshots

How to regenerate `.github/screenshot-light.png` and
`.github/screenshot-dark.png` after changing the design or the example input.

## Prerequisites

- macOS with Google Chrome installed at
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- `example.html` is up to date. Regenerate if needed:

  ```bash
  deno run -A src/main.ts build examples/ec-site.json -o example.html
  ```

## Why a temp file

The generated HTML includes an inline init script that sets `data-theme` from
`localStorage` or `matchMedia('(prefers-color-scheme: dark)')` at page load.
That overrides any pre-set `data-theme` attribute. For screenshots we want to
force the theme regardless of the host machine's settings, so we:

1. Copy `example.html` to a temp file
2. Set `data-theme="light"` or `data-theme="dark"` on `<html>`
3. Strip the `<script>...</script>` block so nothing overrides the attribute
4. Render with headless Chrome

## Commands

Light mode:

```bash
cp example.html /tmp/shot.html
sed -i '' 's|<html lang="en">|<html lang="en" data-theme="light">|' /tmp/shot.html
perl -i -0pe 's|<script>.*?</script>||s' /tmp/shot.html
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --window-size=1280,1600 \
  --screenshot=.github/screenshot-light.png \
  "file:///tmp/shot.html"
rm /tmp/shot.html
```

Dark mode: same as above but `data-theme="dark"` and output
`.github/screenshot-dark.png`.

## Tuning window height

`1280x1600` gives a teaser-style cropped screenshot — content below is
intentionally cut off. The goal is a short, aesthetically-sized README image,
not a full-page capture. The PNG is exactly `window-size`, so a tight crop
means a smaller file too.

## Verify

Open the PNGs (Read tool in Claude Code, or Preview on macOS) and confirm:

- Theme is correct (light or dark)
- Crop cuts off cleanly (ideally between sections, not mid-card)
- No scrollbar artifact at the right edge

## Commit

```bash
git add .github/screenshot-light.png .github/screenshot-dark.png
```
