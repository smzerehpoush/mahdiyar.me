---
name: html-pages-local
description: "User wants HTML pages built as local files on their Mac, not published as claude.ai artifacts"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 00321f7a-b7b1-4af7-b428-fcf4ea5e2e50
  modified: 2026-10-25T09:37:29.248Z
---

Build HTML pages (reading pages, study notebooks, dashboards, etc.) as local files on the user's machine and open them with `open <file>`. Don't publish them with the Artifact tool unless the user asks for that.

**Why:** On 2026-10-25 I published the Multipliers study notebook as an artifact, and the user said «همیشه HTML ها رو لوکال درست کن تو سیستم خودم» ("always make the HTMLs locally on my own system").

**How to apply:**
- Write a full standalone document: doctype, `<meta charset="utf-8">`, viewport, `body{margin:0}`, `[hidden]{display:none}`.
- Store state in localStorage. `window.claude` doesn't exist in a local file.
- If I need to see what the user enters, add a "copy for chat" button.
- Put project files under ~/Downloads/<project>/, which is where the user keeps working files (see [[ddia-linkedin-posts]]).

