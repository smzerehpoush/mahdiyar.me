---
name: telegram-stories
description: "DDIA Shorts as daily Telegram stories on the user's personal account (18:30 Tehran); the user posts them from the phone from an iCloud kit"
metadata:
  node_type: memory
  type: project
  originSessionId: 32e320eb-b919-4da4-931d-aaf8a06c9ce2
  modified: 2026-11-01T20:40:00.000Z
---

On 2026-10-27 the user asked for the YouTube Shorts to go out daily on Telegram: as a **story on their personal account**, with the Short video, its English title (without #Shorts) and the YouTube link, at **18:30 Tehran**. They have no Telegram Premium, so the link is plain text, not clickable. Telegram can't schedule stories, and posting from desktop/web needs Premium. The user chose a "phone kit": they post each one themselves.

Kit: `~/Library/Mobile Documents/com~apple~CloudDocs/Telegram Stories - DDIA Shorts/` (iCloud Drive), with files named `N <day> - <topic>.mp4` and `captions.txt`:
1. Wed Oct 28: Twitter fan-out (unP7OnG847Y)
2. Thu Oct 29: Schemaless (ho0yWHSOxXk)
3. Fri Oct 30: Deleting makes it bigger (jQFb9xyO2hk)
4. Sat Oct 31: Columns not rows (UEuhuITwccI)
5. Sun Nov 1: Rolling deploy (0jGFILQlCmg)
6. Mon Nov 2: 1% slow calls (dNdS39XkMqA). Downloaded from Studio with the user's OK on 2026-10-27, 720×1280, 52 s.
7. Tue Nov 3: Ch5 failover (wLJqdGGSv4o; public Sat Oct 31 18:30). Added 2026-10-30 from the local render, 56 s.
8. Wed Nov 4: Ch5 Part 2, last write wins (wNt6U4lsYg8; turns Public Wed Nov 4 18:30, the same evening). Added 2026-11-01 from the local render, 56 s.

All eight Shorts are in the kit (through Nov 4). Studio's Download menu item is a link to `youtube.com/download_my_video?v=…`. Click that anchor with CDP `Browser.setDownloadBehavior` pointing at a scratch dir. Clicking the paper-item downloaded nothing.

**How to apply:** when a new Short is published, add it to the kit as the next day, with caption = title + `https://youtu.be/<id>`. Keep files under 60 s, the story limit. Don't automate the personal account unless the user asks again. Related: [[ddia-youtube-series]], [[ddia-linkedin-posts]].
