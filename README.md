# Surgical PA Pathways

Single-file clinical reference app for personal use (`surgical-pa-pathways.html`).

## Anatomy reference plates

The "Key anatomy" panels for 13 procedures include public-domain and CC BY illustrations
(Gray's Anatomy 1918, NCI, Blausen). Sources and licenses are credited under each plate
and recorded in `build/plates.js`.

- `original.html` — app source without the plates. Edit app content here.
- `build/plates.js` — plate assignments, captions, credits.
- `build/images/` — optimized WebP images.
- `build/build.js` — injects the plates into `original.html` and writes `surgical-pa-pathways.html`.

```
cd build && node build.js
```

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`, which rebuilds the app and publishes it to
GitHub Pages as `index.html`. Commit and push to make changes live.
