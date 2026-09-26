# Analytics events

Anonymous, explicit event analytics via PostHog. Definitions live in
`lib/analytics/events.ts` (typed); components call the helpers in
`lib/analytics/analytics.ts` and never touch PostHog directly.

**Conventions.** Event names are lower `snake_case`; properties are `camelCase`.
PostHog timestamps every event, so timestamps aren't duplicated in properties.
Every event also carries the super-property `sessionId` (random UUID per browser
session). PostHog's GeoIP transformation adds approximate `$geoip_country_name` /
`$geoip_city_name` server-side; the project's "Discard client IP data" setting then
drops the IP itself.

**Never sent:** guestbook message text, names, visitor-submitted URLs, emails,
IP addresses, referrers/referring domains, UTM or ad-click parameters, query
strings or URL fragments, the raw user-agent string. `before_send` in
`lib/analytics/posthogClient.ts` enforces this for anything PostHog adds itself.

**Enumerations used below**

| Name | Values |
| --- | --- |
| `viewportCategory` | `desktop` · `tablet` · `mobile` |
| feather `openMethod` | `click` · `keyboard` · `direct_route` · `index` · `browser_nav` |
| About `openMethod` | `chest_click` · `keyboard` · `index` · `direct_route` · `browser_nav` |
| Quick View `openMethod` | `top_nav` · `index` · `direct_route` · `browser_nav` |
| `closeMethod` | `close_button` · `escape` · `browser_back` · `another_section` · `navigation` |
| link `location` | `top_nav` · `index` · `about` · `contact` · `quick_view` · `footer` |
| guestbook `openMethod` | `index` · `contact` · `guest_note` |
| guest note `closeMethod` | `button` · `escape` · `outside_click` · `leave_your_own` · `another_feather` |
| `SectionKey` | a feather id (`experience`, `projects`, `research`, `founder`, `achievements`, `writing`, `contact`) · `about` · `quick_view` |

---

## Session

### `portfolio_visited`
**When:** first page load of a browser session (reloads in the same session don't count again).
**Properties:** `sessionId`, `viewportCategory`, `reducedMotion`, `returningVisitor`, `visitNumber`, `route` (path only).
**Notes:** `returningVisitor`/`visitNumber` come from a localStorage counter — no identity.

### `session_heartbeat`
**When:** after each additional minute of *active* time; also when the tab is hidden (sent with sendBeacon) if active time has advanced since the last heartbeat.
**Properties:** `activeDurationSeconds`, `currentSection` (`SectionKey` or `home`), `route`.
**Notes:** keeps durations accurate when a mobile browser is backgrounded and never fires `pagehide`.

### `session_completed`
**When:** `pagehide` (tab closed, reload, leaving the site), once per page lifetime, via sendBeacon.
**Properties:** `activeDurationSeconds`, `totalElapsedSeconds`, `sectionsOpenedCount`, `uniqueSectionsOpenedCount`, `uniqueSectionsOpened`, `sectionOpenOrder` (max 40), `quickViewUsed`, `resumeClicked`, `aboutOpened`, `guestbookUsed`, `audioEnabledAtAnyPoint`.
**Notes:** values are cumulative for the browser session (they survive reloads). The dashboard takes the *maximum* `activeDurationSeconds` over heartbeats and completions per session, so a missing final event only loses the last few seconds.

## Peacock

### `tail_unfurl_completed`
**When:** the opening fan animation finishes.
**Properties:** `durationMs`, `reducedMotion`, `viewportCategory`, `shortened` (true when the visit began on a section route and the intro was shortened).

### `portfolio_feather_hovered`
**When:** a section feather is hovered for ≥ 750 ms — at most once per feather per page view.
**Properties:** `featherId`, `hoverDurationMs`.

### `portfolio_feather_opened`
**When:** a section feather starts detaching (the state machine enters `featherSelected`).
**Properties:** `featherId`, `sectionName`, `route`, `openMethod`.

### `portfolio_feather_closed`
**When:** the section starts closing (`featherReturning`).
**Properties:** `featherId`, `sectionName`, `dwellTimeMs`, `closeMethod`.
**Notes:** dwell = time the section content was on screen while the tab was visible.

### `about_opened` / `about_closed`
**When:** the chest zoom starts / the zoom-out starts.
**Properties:** opened — `openMethod`, `route`; closed — `dwellTimeMs`, `closeMethod`.

## Quick View

### `quick_view_opened` / `quick_view_closed`
**When:** `/quick-view` mounts / unmounts.
**Properties:** opened — `openMethod`; closed — `dwellTimeMs`, `resumeClickedWhileOpen`, `externalLinkClickedWhileOpen`, `closeMethod`.

## Links (destination URLs are never sent)

### `resume_clicked`
**Properties:** `location`, `action` (`open`), `route`.

### `linkedin_clicked` · `github_clicked` · `email_clicked` · `twitter_clicked` · `devpost_clicked`
**Properties:** `location`, `route`.

## Audio

### `audio_enabled`
**When:** the flute starts — `trigger: "toggle"` (visitor turned it on) or `"first_interaction"` (default-on flute began on the first click/tap/key).
**Properties:** `route`, `secondsIntoSession`, `trigger`.

### `audio_disabled`
**Properties:** `route`, `enabledDurationSeconds` (0 if it was turned off before it ever played).

## Guestbook (metadata only)

### `guestbook_opened`
**Properties:** `openMethod`, `route`.

### `guestbook_submitted`
**Properties:** `guestEntryId`, `messageLength`, `hasName`, `hasUrl`, `submissionSuccess: true`.

### `guestbook_submission_failed`
**Properties:** `errorCategory` (`validation` · `storage` · `unknown`), `messageLength`.

### `guest_feather_clicked`
**When:** a drifting guest feather is caught and its note opens.
**Properties:** `guestEntryId`, `featherAgeDays`, `isSeedNote`, `route`.

### `guest_message_closed`
**Properties:** `guestEntryId`, `dwellTimeMs` (visible time), `closeMethod`.

---

## Timing rules

- **Active session time:** counted only while the page is visible *and* the visitor
  interacted (pointer, key, touch, wheel, scroll) within the last 45 s. Returning to
  the tab counts as activity. Ticks every 5 s; see `lib/analytics/session.ts`.
- **Dwell times** (sections, About, Quick View, guest notes): a stopwatch that pauses
  whenever the tab is hidden (`lib/analytics/dwell.ts`). They are not paused for
  inactivity — someone reading a section without moving the mouse is still reading.

## Excluding the owner's visits

- A browser marked excluded never loads PostHog and sends nothing (`pk-analytics-exclude` in localStorage).
  It is set automatically the first time an admin page is opened, toggled from the admin header
  ("This browser: not tracked"), or set on any device by opening a page with `?analytics=off`
  (`?analytics=on` reverses it). The parameter is removed from the URL immediately.
- The dashboard ignores events from `localhost` / `127.0.0.1` (dev with `NEXT_PUBLIC_ANALYTICS_ENABLE_DEV`)
  and, if set, everything before `ANALYTICS_START`.
