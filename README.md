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

## OpenEvidence hand-off

OpenEvidence has no public API and blocks programmatic access, so the app cannot show its
answers inline. Instead, buttons on each condition page, each walkthrough step, and the
"nothing matches" search state copy a question to the clipboard and open openevidence.com
in a new tab (see the hand-off section in `build/build.js`). Sign-in happens there, as normal.

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`, which rebuilds the app and publishes it to
GitHub Pages as `index.html`. Commit and push to make changes live.
