# Series standards (binding for every DDIA video)

These are the user's requirements for the series, condensed from the Chapter 1 brief (`examples/session-01-long/brief.md` is the full
original). Each video's `brief/brief.md` restates them plus the chapter-specific content plan.

## Source and scope
- Source: the blog deck `public/blog/ddia-session-N/index.html` (public URL `https://mahdiyar.me/blog/ddia-session-N/`). Its
  `<aside class="notes">` elements are speaker notes — teaching context, not script.
- Book: Martin Kleppmann, *Designing Data-Intensive Applications*, O'Reilly, **1st edition (2017)**. Blog sessions map to chapters
  (`scripts/new-video.mjs` has the table; some chapters span two sessions — one video per chapter by default, ask if unsure).
- Adapt the deck into a coherent story; never read slides aloud. Preserve its concepts, write ORIGINAL explanations.
- Convert interactive labs into narrated visual demonstrations. Replace team-specific discussion prompts (the user's company stack,
  products, internal tools) with general questions any engineer can ask about their own system.

## Audience and format
- Junior to mid-level software engineers who know basic databases and web applications.
- Long-form: 12–14 min, 16:9, 1080p (rendered at 60 fps), English narration, captions, diagrams, on-screen text. No presenter avatar.
- Shorts: ≤ 60 s, 9:16, one idea from the chapter (usually its most memorable example), ending with the source and a pointer to the
  full video.

## Narration
- Natural, clear, conversational teaching; moderate pace; an experienced engineer explaining to a colleague.
- No hype, no robotic delivery, no unnecessary jargon. Explain unfamiliar terms before relying on them.
- Synthetic voice (Kokoro `af_heart`); disclosed in the description.

## Structure (long-form)
- First ~20 seconds (YouTube's own analytics advice, 2026-10-23): open straight on a real-world problem a working engineer recognizes
  (a query that got slow, a disk that keeps growing, a report that times out; an invented one is labeled as an illustration) and say
  what the viewer will understand by the end. No title card, book credit or agenda before that. A toy demo (like Ch. 3's two shell
  functions) can follow once the stake is named. The book credit and the framing questions come next, briefly, by about 0:45.
- After the hook come the chapter's framing questions; each part answers one question; the ending returns to the
  opening scenario, maps each symptom to a part, asks 2–3 questions the viewer can ask about their own system, and previews the next
  chapter.

## Visual direction
- Clean technical motion graphics, readable typography, one consistent visual language, a distinct accent per part (teal / orange /
  purple, in order).
- Diagrams build progressively in sync with the narration (word-level anchors). Arrows, queues, timelines, request flows, simple charts
  showing cause and effect.
- Concise on-screen text, never paragraphs. Give viewers time to absorb each diagram.
- No stock footage, decorative code, fake dashboards, or unrelated visuals. Subtle transitions; original background music, quiet and
  ducked under the voice.

## Accuracy and attribution
- Every factual claim is checked against the book (1st ed.) and the deck. Where the deck is imprecise, the video follows the book, and
  the decision is written into `brief/accuracy-notes.md` (binding for script and visuals).
- Label historical examples on screen and in speech (e.g. "Twitter, circa 2012", "Amazon has described…"). Never present them as
  current measurements.
- Label illustrative numbers and simulations ("Simplified illustration"). Seeded data only (`build/data.mjs` → `data/numbers.md`).
- Omit numerical claims that cannot be accurately qualified.
- Do not reproduce book pages or quote at length. Do not imply affiliation with the author or publisher.
- Credits: the blog presentation (title + URL) and the book (author, publisher, 1st edition, chapter), plus the line "This video is an
  independent study summary. It is not affiliated with or endorsed by the author or publisher." On screen at the end of long-form
  videos (readable ≥ 3 s) and in every description (`build/package.mjs` writes it).

## YouTube
- Title: long-form "Designing Data-Intensive Applications, Chapter N: <Topic>"; a chapter split into two videos: "Designing
  Data-Intensive Applications, Chapter N, Part K: <Topic>". The full book name stays first and N is always the book chapter, never a
  running episode number (both the user's choice, 2026-10-23, kept even after YouTube suggested problem-first titles). From Ch. 3
  Part 2 on, <Topic> is phrased as the problem or payoff, not the chapter's textbook name: "Why Analytics Uses Columns", not
  "Analytics and Column Storage". Keep the whole title ≤ 100 chars (package.mjs enforces it); shorter is better, since search
  results cut the end. The three titles already published stay as they are. Shorts: a hook-style title ≤ 70 chars ending in "#Shorts".
- Public (the series default; still confirm with the user right before the final Publish click), Education, English, not made for kids, no paid promotion, AI-use disclosure "No" (synthetic narration is disclosed in the
  description; nothing realistic is depicted).
- Long-form goes into the playlist "Designing Data-Intensive Applications, Chapter by Chapter"; Shorts do not.
- English captions uploaded from our SRT ("with timing"); custom thumbnail. Its big words name the problem or the payoff (e.g. "LSM-tree
  vs. B-tree"), never just the chapter; the chapter number stays in the small kicker.
- The channel gets about one custom thumbnail a day, and YouTube judges the packaging by the auto frame until one is set. Spend the
  day's thumbnail on the long-form video first; a Short's cover can wait.
- Chapters: the description carries timestamps (`build/package.mjs`). Playlist: the series playlist above.
