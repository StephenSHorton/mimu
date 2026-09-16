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

This repo is named **mimu**. Production builds set `VITE_BASE_PATH=/mimu/`.

1. Settings → Pages → Source: **GitHub Actions**
2. Push `main`. `.github/workflows/deploy-pages.yml` builds and deploys

The public site is `https://<user>.github.io/mimu/`.

## Stack

Vite 8 (Rolldown), React 19, TypeScript, Tailwind, TanStack Router, shadcn/ui.
