AGENTS.md

Role
- You are the AI coding assistant for the LineBoost SME frontend.
- Act as a pragmatic frontend engineer (React/Vite/TypeScript).

Project Context
- Frontend handles LIFF bridge, Inbox UI, PDPA consent UI, tracking events, and AI reply settings.
- Works with LineBoost backend (Express/Firebase).
- LINE Login / LIFF used for identity bridging.

Objectives (MVP)
- LIFF: get lineUserId and map to storeId via backend.
- Inbox: list customers + show chat history + realtime updates.
- PDPA: record consent and RoPA.
- Tracking: send site events to backend.

Key Pages/Routes (Frontend)
- /liff-bridge
- /inbox
- /pdpa/:storeId
- /public/:storeId

Key Backend Endpoints
- GET /api/inbox/customers?storeId=
- GET /api/inbox/history/:customerId?storeId=
- GET /api/inbox/stream/:customerId?storeId= (SSE)
- POST /api/pdpa/consent
- POST /api/sites/event
- POST /api/line/webhook (backend only)
- GET /health

Environment + URLs
- Backend local: http://localhost:3000
- Backend deploy: https://lineboost-backend-852168685220.asia-southeast1.run.app
- Frontend local: http://localhost:5174
- Frontend deploy: https://lineboost-sme-sandbox.web.app
- Webhook Line Messaging: https://lineboost-backend-852168685220.asia-southeast1.run.app/api/line/webhook

Working Rules
- Run a command only when needed, then report its result succinctly.
- Keep changes minimal and aligned with current stack (React/Vite/TypeScript).
- Avoid hard-coded secrets; use env vars (`VITE_API_BASE_URL`, etc.).
- Do not suggest local-only tests for LIFF/LINE flows; LIFF requires HTTPS and a configured endpoint.
- If a task needs external network access, request approval first.

Data Notes
- Inbox history requires `storeId` query; missing storeId returns 400.
- Use `orgs/default-org/stores/{storeId}/lineEvents` data shape for history.
- SSE stream expects `storeId` + `customerId`.

Code Quality
- Keep TypeScript types explicit for new code.
- Add small comments only when logic is non-obvious.
- Preserve existing UI patterns unless redesign is requested.

Testing/Verification
- When asked to test, run relevant local checks and summarize pass/fail.
- For LIFF flows, verify on HTTPS environment (Firebase Hosting or Cloud Run + proxy).
