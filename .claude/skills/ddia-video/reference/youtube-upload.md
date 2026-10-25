# Publishing to YouTube (Studio in the browser, driven over CDP)

Why not the YouTube Data API: uploads from an unaudited API project are locked to Private. The working method is YouTube Studio in a
dedicated Chrome profile that **the user signs into themselves** (never ask for, type, or store their password), driven with
`tools/yt.mjs` over the Chrome DevTools Protocol.

## 0. Start the browser (once per session)
```bash
PROFILE=~/.cache/ddia-video/yt-profile   # persistent; tell the user they can delete it to sign out everywhere
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --user-data-dir="$PROFILE" --remote-debugging-port=9333 \
  --no-first-run --no-default-browser-check --window-size=1400,1000 \
  --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling \
  https://studio.youtube.com &
```
If Studio shows a sign-in page, ask the user to sign in in that window and wait for them. Check with `node tools/yt.mjs shot` and read
`out/yt.png`. A Chrome already listening on 9333 is reused (`curl -s localhost:9333/json/version`); if it has no tabs, `yt.mjs goto` opens one.
The three `--disable-…` flags matter: without them, a minimized or covered window reports `document.visibilityState` "hidden", stops
painting, and `shot` / `click` hang for 90 s (`eval` still works). If a reused Chrome lacks them and shows that symptom, close it over
CDP (`browser.close()`, which keeps the sign-in) and relaunch with this command.
The flags do not help when two sessions drive one CDP Chrome: only the front tab is "visible", so the other session's Studio tab
reports "hidden" and its `shot` / `click` hang. `yt.mjs` always drives the *first* Studio tab. A second session should use a
tab-pinned copy (target id saved to a file), and `bringToFront` / `curl localhost:9333/json/activate/<id>` switches which tab is in
front. Switch it back when done so you don't stall the other session.

## tools/yt.mjs commands (run from the work dir)
| command | does |
|---|---|
| `goto <url>` | navigate (opens a tab if none) |
| `shot [file]` | screenshot of the Studio tab → `out/yt.png` (Read it) |
| `eval '<js>'` | evaluate in the page, print JSON |
| `click '<sel>'` | wait for + click a selector |
| `clickxy <x> <y>` | mouse click at CSS px (viewport is 1400×828 at DPR 2: divide screenshot px by 2) — e.g. to dismiss a popup |
| `fill '<sel>' <text or @file>` | select-all + replace a contenteditable (Studio's title/description) |
| `type <text>` / `key <Key>` | keyboard |
| `file '<sel>' <path>` | set an `<input type=file>` |
| `choose '<sel>' <path>` | click a button that opens a native file chooser and accept it |
| `verify <videoId> [png]` | open the public watch page; print title, length, privacy, playability, caption tracks |

## 1. Duplicate check (always)
Open `studio.youtube.com/channel/<id>/videos/upload` (long-form) and `/videos/short` (Shorts) and list rows:
`eval '[...document.querySelectorAll("ytcp-video-row")].map(r=>r.innerText.replace(/\s+/g," ").slice(0,160))'`.
If the same chapter/topic already exists, ask the user (replace and set the old one Private, keep both, or stop). Never delete a video
without an explicit request.

## 2. Upload dialog
1. `click 'button[aria-label="Create"]'` → `click 'tp-yt-paper-item[test-id="upload"]'` → `file 'input[name=Filedata]' <final.mp4>`.
2. Details:
   - `fill '#title-textarea #textbox' "<title>"` (Cmd+A does not select all in Studio; `fill` uses a DOM Range — already handled).
   - `fill '#description-textarea #textbox' @out/youtube-description.txt`. A trailing hashtag opens a suggestion popup
     (`ytcp-social-suggestions-dropdown`); dismiss it by clicking blank space (`clickxy` on the "Thumbnail" heading). Do NOT press Enter.
   - A red outline under the description with "To make external links clickable, first complete a one-time verification" is a notice,
     not an error. Links stay unclickable until the user verifies the channel (phone verification — the user's call).
   - Thumbnail: `file '#file-loader' out/thumbnail.jpg` (works for Shorts too: 1080×1920 cover accepted). New channels get only a
     few custom thumbnails per day: when the limit is hit, Studio shows "Build your channel history — You can add more custom thumbnails
     daily once you have more history" and keeps the auto frame. Click "Got it", finish the other steps, and ask the user whether to
     publish now with the auto frame (add the thumbnail on the edit page the next day) or stay Private until then. Record it as pending.
   - Playlist (long-form only): `click 'ytcp-video-metadata-playlists ytcp-dropdown-trigger'`, tick the series playlist by its label
     (eval: find `tp-yt-paper-checkbox`/item whose text is the playlist title and click it), then click the dialog's "Done". To create it
     the first time: `tp-yt-paper-item[test-id=new_playlist]` → fill title → visibility Public → `ytcp-playlist-creation-dialog #create-button`.
   - `click 'tp-yt-paper-radio-button[name=VIDEO_MADE_FOR_KIDS_NOT_MFK]'`. If the dialog is still "Saving…", the click can be lost
     and the radio reads `aria-checked="false"`: scroll it into view, click again, and check it in the verification eval.
   - `click '#toggle-button'` (Show more), then: `click 'tp-yt-paper-radio-button[name=VIDEO_PAID_PRODUCT_PLACEMENT_NO]'`,
     `click 'tp-yt-paper-radio-button[name=VIDEO_HAS_ALTERED_CONTENT_NO]'` (AI-use: No), tags: `click 'input[aria-label=Tags]'` then
     `type "tag1,tag2,…,"` (trailing comma commits the last chip), language: `click '#language-input'` then eval-click the visible
     `tp-yt-paper-item` whose text is exactly `English`. Category defaults to Education on this channel — verify.
   - Verify everything in one eval (radio `aria-checked`, `#language-input` text, tag chips, description length).
3. `click '#next-button'` → **Video elements**:
   - Subtitles: `click '#subtitles-button'` → `click '#choose-upload-file'` ("With timing" is preselected) →
     `choose '#confirm-button' out/captions.en.srt` → the editor opens (times shown as SS:FF for short videos) → save with
     `click 'ytcp-button#publish-button'` (its label is "Done"; plain `#done-button` matches a hidden node). Back in the step the row must
     read "English by you".
   - Long-form: end screen optional (skip unless asked).
   - Shorts: "Related video" → `click 'ytcp-button#shorts-content-links-add-button'` → pick the long-form video. New channels get
     "Build your channel history — You can link a Short to a video once you have more history"; click "Got it", note it for later, and
     rely on the description's "Full video:" line.
4. `click '#next-button'` → Checks (wait for "Checks complete. No issues found.") → `click '#next-button'` → Visibility:
   `click 'tp-yt-paper-radio-button[name=PUBLIC]'` → `click '#done-button'` (Publish). Close the "Video published" dialog (eval-click
   the visible button with text "Close"). The video id is in the dialog's video link.
   To **schedule** instead (e.g. one Short a day): open the "Schedule" card under "Save or publish" (`shot`, then `clickxy` on its
   chevron) → `click '#datepicker-trigger'` and `clickxy` the day in the calendar → time: `click 'ytcp-visibility-scheduler
   #time-of-day-container input'`, eval `focus(); select()` on that input, `type "6:30 PM"`, `key Enter`, then `clickxy` blank header
   space so the field commits. The time zone defaults to the browser's, "(GMT+0330) Local Time" on the user's Mac. Check date and time
   with one eval, then `click '#done-button'` (labelled "Schedule"); the first click can only blur the field, so confirm the "Video
   scheduled … on <date> at <time>" dialog appeared before moving on. The video stays Private and turns Public on its own.

## 3. Verify
`node tools/yt.mjs verify <videoId> out/watch.png` → title, `isPrivate: false`, `playable: "OK"`, captions include `English` (ours) besides
the auto-generated track. Read the screenshot. Record the id in `video.json` → `youtube.videoId`, and in reference/series-log.md.

## If a Studio tab freezes
Seen on 2026-10-25 after clicking Schedule: `eval`, `shot` and even a raw CDP `Page.enable` timed out on the Studio tab while its
renderer sat idle, and `json/activate` did not wake it. The browser itself was fine. Open a fresh tab with
`curl -s -X PUT "localhost:9333/json/new?<studio url>"`, check the outcome there (the Content list shows "Scheduled" and the date), then
close the frozen one with `curl -s localhost:9333/json/close/<target id>` so `yt.mjs` drives the new tab. The upload dialog auto-saves
as a Private draft, so nothing is lost if the frozen tab held one.

## End screen (long-form)
On `/video/<id>/edit`, open `#endscreen-editor-link` → "Import from video" → pick "Chapter 1: Reliable…" by its
`ytcp-entity-card .title` text (its layout puts the video element and Subscribe in the right half, clear of the "Next" scene's credits
card). Select the timeline's video bar, then either set "Best for viewer" (the newest chapter) or use the pencil on the element →
"Choose specific video" → pick the next chapter by title. Save with the visible `#save-button`. A video element cannot point at the
video it is on, and a Short picked as the import source fails with an aspect-ratio error. After publishing a new chapter, repoint the
previous chapter's video element at it.

## Edit page (after publishing)
`studio.youtube.com/video/<id>/edit` — same field selectors; save with `ytcp-button#save`. Use it for visibility changes (e.g. making a
replaced upload Private), later playlist changes, or adding the Short's related video once eligible: the right-hand "Related video"
card (`#linked-video-editor-link`, pencil icon). `yt.mjs click` on it can hang; take a `shot` and use `clickxy` on the pencil instead,
pick the long-form video, then `click 'ytcp-button#save'`. Before leaving, check that Save is disabled again (nothing left unsaved).
