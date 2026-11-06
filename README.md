# mahdiyar.me

Personal site of Mahdiyar Zerehpoush. For now: a coming-soon page at the root and an
empty Persian blog at `/blog/`.

- `public/` — everything that is published, as plain HTML with inline CSS. No build step.
  - `index.html` — coming-soon page (English)
  - `blog/index.html` — blog index (Persian, RTL); each Post gets a card in its grid
  - `projects/index.html` — personal projects (Persian, RTL); each project gets a card linking to its site
  - `404.html` — served for any missing path
- `ops/` — how the server runs the site; see [`ops/README.md`](ops/README.md)
- `CONTEXT.md` — the site's vocabulary

Open any file in `public/` in a browser to preview. Pushing to `master` publishes within 5 minutes.

Project thumbnails use Thum.io's public screenshot API, refreshing images older than
one hour when requested. Previews show public pages only; if the service fails,
the project card still links directly to its site.
