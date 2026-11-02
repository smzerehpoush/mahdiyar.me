---
name: ddia-youtube-growth
description: "DDIA YouTube channel growth: analytics snapshot of 2026-10-25 (low browse CTR), the ranked plan offered to the user, and how to read Studio analytics over CDP"
metadata:
  node_type: memory
  type: project
  originSessionId: 32e320eb-b919-4da4-931d-aaf8a06c9ce2
  modified: 2026-10-25T14:05:25.950Z
---

The user asked on 2026-10-25 why views are so low and whether YouTube shows the videos at all. Studio analytics, lifetime as of 2026-10-24:
- YouTube does show them: about 2.3K thumbnail impressions in 4 days on a 7-subscriber channel. 86% of Ch2's impressions came from YouTube recommendations.
- Browse click-through is the bottleneck. Ch2 (b-rJ8lzuEZY) had 1,050 impressions at 0.9%; Ch1 (uCm4lbSYg2Y) 721 at 1.3%. YouTube's help page puts most channels at 2–10%.
- Ch2 still has the auto-picked "02 Query languages" frame as its thumbnail. Ch1 has a custom one and is still at 1.3%.
- Average view duration (about 0:58, 7%) is polluted by the owner's own views, including `yt.mjs verify` runs: Ch2 got 62 views from 24 unique viewers. LinkedIn clicks also bounce early.
- The clean figure: views from YouTube's own impressions averaged 2:43. The sample is too small to diagnose retention; re-check in a few weeks. If the early cliff persists, suspect the hook first, then the TTS voice.
- Most external traffic comes from LinkedIn (a Persian audience watching English videos). Search term "designing data intensive applications" already appears.

Plan offered, ranked, all awaiting the user's yes; editing published videos needs a per-action OK:
1. Custom thumbnail for Ch2 on 2026-10-26 (the 10-25 slot went to Ch4), then Ch3 Part 1, then the Ch2 Short. The files are listed in series-log.md under Pending Studio edits.
2. End screens on all five long videos (next chapter + playlist). None have them; end-screen click rate is 0%.
3. Promote where the audience speaks English: DDIA reading groups, r/systemdesign, r/dataengineering (mind self-promo rules), maybe an English LinkedIn post.
4. Patience on search, which builds over weeks.

Progress as of 2026-10-25:
- Done: the Home tab is live (Videos → DDIA playlist → Shorts → Playlists, no trailer). End screens are saved on all five long videos: video element (next chapter; Ch4 = Best for viewer) + Subscribe, in the right half. No playlist element, because the "Next" scene's credits card fills the left.
- Thumbnails v2 (the hook's problem instead of the book's terms) went live on 10-25 for Ch1, Ch2 and Ch3P1, approved by the user ("do them all"). The comparison page is `~/Movies/DDIA-thumbnails-v2/compare.html`. v1 is backed up as `thumbnail.v1.*`. Re-check CTR against the baseline above after about two weeks (~2026-11-08).
- The three new Shorts are scheduled Public at 18:30 Tehran: Ch3P1 jQFb9xyO2hk on 10-26, Ch3P2 UEuhuITwccI on 10-27, Ch4 0jGFILQlCmg on 10-28. The Ch4 Short's custom thumbnail was refused (the 6th of the day): add it on its edit page on 10-26 or 10-27.
- The channel description was saved on 10-25: English, technical + management, DDIA as one series.
- The daily custom-thumbnail limit varies: five went through on 10-25.

**Why:** the user wants more views, and these numbers are the baseline for judging whether the changes work.

**How to apply:** compare new CTR and retention against this snapshot. Don't re-open the book-first title decision (series-log.md). Keep verify runs to one per upload so they don't skew stats.

Feature eligibility, checked 2026-10-25 under Studio → Settings → Channel → Feature eligibility:
- Intermediate is Enabled: the phone is already verified, so don't send the user to verify it.
- Advanced is "Eligible". Its only missing requirement is "Channel history", which YouTube grants automatically over time. No verify button or ID/video option was shown.
- Advanced unlocks clickable description links, A/B testing of titles and thumbnails, and higher daily limits.
- The cause of the ~1 custom thumbnail per day limit is unknown, since custom thumbnails are already enabled.

Reading analytics over CDP (work dir `node tools/yt.mjs`):
- Channel tabs are now Overview / Content / Audience / Trends; `tab-reach_viewers` no longer exists at channel level.
- The per-video table works through the advanced-mode URL: `.../analytics/tab-overview/period-default/explore?entity_type=CHANNEL&entity_id=UCyZfRsW4EaK-PvW1iSholoQ&time_period=lifetime&explore_type=TABLE_AND_CHART&metric=VIEWS&granularity=DAY&t_metrics=VIEWS&t_metrics=VIDEO_THUMBNAIL_IMPRESSIONS&t_metrics=VIDEO_THUMBNAIL_IMPRESSIONS_VTR&t_metrics=AVERAGE_WATCH_TIME&t_metrics=AVERAGE_WATCH_PERCENTAGE&dimension=VIDEO&o_column=VIEWS&o_direction=ANALYTICS_ORDER_DIRECTION_DESC`. Wait about 15 s for it to load.
- Video pages keep the Reach / Engagement tabs (`/video/<id>/analytics/tab-reach_viewers/period-lifetime`).

Related: [[ddia-youtube-series]], [[ddia-linkedin-posts]].
