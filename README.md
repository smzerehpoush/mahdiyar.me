# mahdiyar.me

Personal site of Mahdiyar Zerehpoush. For now: a coming-soon page at the root and an
empty Persian blog at `/blog/`.

- `public/` — everything that is published, as plain HTML with inline CSS. No build step.
  - `index.html` — coming-soon page (English)
  - `blog/index.html` — blog index (Persian, RTL); each Post gets a card in its grid
  - `404.html` — served for any missing path
- `ops/` — how the server runs the site; see [`ops/README.md`](ops/README.md)
- `CONTEXT.md` — the site's vocabulary

Open any file in `public/` in a browser to preview. Pushing to `master` publishes within 5 minutes.
