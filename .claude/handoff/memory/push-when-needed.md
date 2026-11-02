---
name: push-when-needed
description: "Send a PushNotification every time the user's input is needed (a question, an approval, a sign-in, a stop on an error)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 32e320eb-b919-4da4-931d-aaf8a06c9ce2
  modified: 2026-10-27T19:06:12.024Z
---

On 2026-10-27 the user said (in Persian): "Always send a push notification whenever you need me."

**Why:** they step away during long runs (Studio uploads, LinkedIn reschedules, renders) and want to know when work is waiting on them, without watching the terminal.

**How to apply:**
- Before or alongside every AskUserQuestion, call PushNotification. Do the same whenever a run stops for their decision, a sign-in, a confirmation before a public action, or an error only they can fix.
- Keep it one line under 200 chars and lead with what they need to do, e.g. "LinkedIn: Confirm stayed disabled on Ch14, need your call".
- This doesn't replace asking in chat, and routine progress still gets no notification.

Related: [[ddia-youtube-series]], [[ddia-linkedin-posts]].
