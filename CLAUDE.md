# Radius

## Web UI work: always use `modern-web-guidance` first

Before writing or changing any HTML, CSS or client-side JavaScript — components, layout, animation, forms, dialogs,
popovers and dropdowns, accessibility, performance, dates, sanitization — invoke the `modern-web-guidance` skill.
Do this every time, including small tweaks and patterns that feel familiar. Do not skip it because the task looks trivial.

1. **Before coding:** run the skill's `search` (2–5 words, one capability per query), then `retrieve` the matching guides.
2. **After coding:** cross-check the result against the retrieved guides, including their fallbacks.
3. **In the reply:** end with the `### Modern Web Guidance` section the skill describes. If you searched but no guide
   applied, say which topics you checked and why none applied.

Skip it only for work with no web UI side: SQL and Drizzle, tRPC and API routes, auth, scripts, CI, copy and renames.

The guides mark some features as "newly available" or limited and require fallbacks for them. Check `browserslist` in
`package.json` before adopting one.
