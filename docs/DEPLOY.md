# Deploying jineshwarnariani.com

Stack: GitHub → Vercel (Hobby, free) → domain on Cloudflare Registrar.

## 1. Push to GitHub

Create an empty **private** repository on GitHub (no README), then:

```bash
git remote add origin https://github.com/JineshwarNariani/portfolio.git
git push -u origin main
```

`.env.local`, the Freepik source files and `feather.png` are git-ignored and never leave your machine.

## 2. Import into Vercel

vercel.com → Add New → Project → import the repo. Framework preset: Next.js (auto). Leave the build settings at their defaults.

## 3. Environment variables (Vercel → Project → Settings → Environment Variables, "Production")

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://jineshwarnariani.com` |
| `NEXT_PUBLIC_POSTHOG_KEY` | the `phc_…` project key (same as `.env.local`) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |
| `POSTHOG_PERSONAL_API_KEY` | the `phx_…` key with Query Read |
| `POSTHOG_PROJECT_ID` | `628731` |
| `POSTHOG_API_HOST` | `https://us.posthog.com` |
| `ANALYTICS_TIMEZONE` | `America/New_York` |
| `ANALYTICS_ADMIN_SECRET` | **a new value** — run `openssl rand -base64 24` in your own terminal and paste it only into Vercel |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SECRET_KEY` | the `sb_secret_…` key |

Do **not** set `NEXT_PUBLIC_ANALYTICS_ENABLE_DEV` or `NEXT_PUBLIC_ANALYTICS_DEBUG` (unset = off).
Copy values from `.env.local` by hand; never paste them into chat. Redeploy after changing any of them.

## 4. Domain

1. Buy `jineshwarnariani.com` on Cloudflare Registrar; turn on auto-renew.
2. Vercel → Project → Settings → Domains → add `jineshwarnariani.com` and `www.jineshwarnariani.com`
   (Vercel will suggest redirecting one to the other — redirect `www` → apex).
3. Vercel shows the DNS records to create. In Cloudflare → DNS → Records add exactly those
   (typically an `A` record for `@` and a `CNAME` for `www`), with **Proxy status: DNS only** (grey cloud).
4. Wait for Vercel to show "Valid Configuration"; HTTPS is issued automatically.

Optional: Cloudflare → Email → Email Routing → forward `hello@jineshwarnariani.com` to Gmail.

## 5. After the first deploy

- Open the site, click a few feathers, then check `/admin/analytics` (log in with the new secret) — events should appear with a location within a minute.
- Leave a test feather, approve it at `/admin/guestbook`, confirm it drifts, then delete it.
- Check the link preview: paste the URL into https://www.opengraph.xyz or a LinkedIn post draft.
- Google Search Console: add the domain and submit `https://jineshwarnariani.com/sitemap.xml`.
- Update LinkedIn, GitHub, X, Devpost and the resume with the new URL.

## Updating the site

Commit and push to `main`; Vercel redeploys automatically. Checks before pushing:
`npm run typecheck && npm run lint && npm run build`.
