# ミーム (Mimu)

A free [gifntext](https://gifntext.com)-style GIF text editor. The name is Japanese for “meme.” Upload a GIF, time captions and emoji to its frames, download the result. No account. No paywall. No GIF search.

Imgflip is only the “free, no paywall” idea — not the product. Mimu does not call Giphy, Imgur, or any other media API.

## Run locally

```bash
npm install
npm run dev
```

The Vite (Rolldown) dev server listens on **http://127.0.0.1:47261**.

```bash
npm run build
npm run preview
```

`build` writes `dist/` and copies `index.html` to `404.html` so GitHub Pages can serve `/editor`.

## What this slice does

- Home: drop or browse a GIF (or still). Optional original 2-second demo — not a catalog
- Editor: text and emoji layers, show/hide by frame, drag to keyframe, play the timeline
- Export: GIF of every source frame with captions burned in; PNG of the current frame
- Tasteful 広告 / Ad placeholders on home and editor

Everything runs in the browser. Your file is not uploaded to a server.

## GitHub Pages

The live site is **https://stephenshorton.github.io/mimu/**.

Deploys run only when a version tag is pushed (`v1.0.0`, `v1.0.1`, …) — not on every `main` push. The workflow is `.github/workflows/deploy-pages.yml`. It sets `VITE_BASE_PATH=/mimu/` and bakes `VITE_APP_VERSION` from the tag so the nav shows e.g. `v1.0.0`.

```bash
git tag v1.0.0
git push origin v1.0.0
```

If the repo has no `v*.*.*` tags yet, `.github/workflows/ensure-first-tag.yml` creates `v1.0.0` on the first `main` push. Changing `.github/pages-release` bootstraps the first Pages deploy (GitHub will not start a second workflow from a `GITHUB_TOKEN` tag push).

## Stack

Vite 8 (Rolldown), React 19, TypeScript, Tailwind, TanStack Router, shadcn/ui.
