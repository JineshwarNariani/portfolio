@AGENTS.md

## Project notes

Portfolio for Jineshwar Nariani: a minimalist interactive peacock on white. The peacock IS the navigation.

- Artwork: `creative-peacock-design/*.ai` (Freepik — keep the "designed by Freepik" credit) → `scripts/extract_peacock.py` → `lib/peacock/art.generated.ts` (never hand-edit; regenerate).
- Section feathers + labels: `data/featherConfig.ts`. Copy: `data/portfolioData.ts` (never invent metrics/honours).
- All timings/distances: `lib/animationConfig.ts`. Layout geometry per viewport: `lib/peacock/layout.ts`.
- State machine: `hooks/usePeacockState.ts`; sequences: `lib/peacock/choreography.ts`; orchestrator: `components/peacock/PeacockScene.tsx`.
- Routes (`app/(peacock)/`) share one layout so the scene stays mounted; the URL is the target, the machine walks to it.
- Separate state: guestbook (`components/guestbook/GuestbookProvider.tsx`, storage via `services/guestbookService.ts`), audio (`lib/audio/fluteAudio.ts`). Don't fold them into the peacock reducer.
- Wind for guest feathers: `lib/guestbook/wind.ts` (tuning in `animationConfig.guestbook`). Quick View: `/quick-view` (inside the peacock layout).
- Analytics (PostHog): UI calls helpers in `lib/analytics/analytics.ts` only — never `posthog` directly. Events typed in `lib/analytics/events.ts`, documented in `docs/analytics-events.md` (update both together). Never send guestbook text/names/URLs, referrers, UTMs or full URLs. Private dashboard: `/admin/analytics` (server-side HogQL via `lib/analytics/posthogServer.ts`). Env vars: `.env.example`.
- Minimalism rules: sound only via the flute control (on by default, starts on first gesture); no particles, glows, gradients-as-decoration, glassmorphism, custom cursor, WebGL.
Checks: `npm run typecheck && npm run lint && npm run build`.
