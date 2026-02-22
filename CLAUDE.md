# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Path of Trade** — a Next.js 15 e-commerce platform for buying/selling Path of Exile in-game currency. Supports two games (PoE 1 and PoE 2), multiple leagues, and two locales (English and Brazilian Portuguese).

## Commands

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Build for production (runs next-sitemap + analyze-keywords postbuild)
npm run start      # Run production server
npm run analyze-keywords  # Run keyword analysis script standalone
```

There is no lint script configured. TypeScript build errors are suppressed (`ignoreBuildErrors: true` in `next.config.ts`).

## Architecture

### Routing & Internationalization

All user-facing routes live under `app/[locale]/`. Two locales are supported: `en` (default, no prefix) and `pt-br` (prefix: `/pt-br/...`). This is configured via `next-intl` in `i18n/routing.ts` with `localePrefix: 'as-needed'`.

The middleware (`middleware.ts`) chains i18n routing with Supabase session refresh. It sets the `x-pathname` response header so layouts can detect the current path (used for canonical/hreflang and to detect admin routes).

Translation files are in `messages/en.json` and `messages/pt-br.json`. Server-side translations use `getTranslations()` / `setRequestLocale()` from `next-intl/server`.

### Route Groups

- `app/[locale]/(site)/` — Public storefront: blog, cart, contact, faq, games, league, orders, products, etc.
- `app/[locale]/admin/` — Admin panel with Sanity Studio mounted at `/admin/studio` and custom admin pages (dashboard, manage-products, manage-leagues, orders).
- `app/[locale]/auth/` — Auth pages (sign-in, sign-up, forgot-password, etc.).
- `app/api/` — API routes excluded from middleware/i18n: checkout (Stripe + AbacatePay), webhooks, auth callbacks, send-email, sitemap-data, revalidate, pix.

### Data Sources

**Sanity CMS** (`sanity/`) — Content for blog posts, authors, categories, and product descriptions. GROQ queries are in `sanity/sanity-query.ts`. Sanity client setup is in `sanity/sanity-utils.ts`. Document internationalization is enabled for `post`, `author`, `category` schema types.

**Supabase** — Auth + relational data (orders, leagues, products, currency rates). Two client patterns:
- Server components: `createClient()` from `utils/supabase/server.ts`
- Client components: `supabase` from `lib/db/index.ts` (anon key)

Server actions (sign-in, sign-up, etc.) live in `app/actions.ts`.

### Client-Side State

Two React contexts provided globally in `app/[locale]/layout.tsx`:
- `CurrencyProvider` (`lib/contexts/currency-context.tsx`) — Selected currency + price conversion
- `CartProvider` (`lib/contexts/cart-context.tsx`) — Cart state, persisted in `localStorage`, synced across tabs

### Payments

Two payment providers:
- **Stripe** — `app/api/checkout/stripe/` and `app/api/webhooks/stripe/`
- **AbacatePay** (PIX for Brazil) — `app/api/checkout/abacatepay/` and `app/api/webhooks/abacatepay/`
- Cloudflare Turnstile bot protection on checkout (`app/api/auth/validate-turnstile/`)

### SEO Utilities (`lib/utils.ts`)

Key exported functions used across page metadata:
- `generateKeywords(options)` — Builds locale-aware keyword strings
- `generateFocusedTitle(options)` — Page titles by type (homepage, product, game, league, blog)
- `generateFocusedDescription(options)` — Page descriptions by type
- `buildCanonical(path, locale)` — Canonical URL respecting the `as-needed` locale prefix
- `getHreflangAlternates(pathsByLocale)` — Hreflang alternate links

Sitemap is generated post-build via `next-sitemap.config.js`, fetching dynamic paths from Supabase/Sanity through `lib/sitemap-data-fetchers.js`.

### UI Components

- **shadcn/ui** components in `components/ui/` (configured via `components.json`)
- Custom components in `components/` — `cn()` utility from `lib/utils.ts` for class merging
- Radix UI primitives used throughout
- Fonts: Roboto + Source Sans 3 (Google Fonts)

### Key Types

`lib/interface.ts` defines the core `Product` type with fields: `id`, `name`, `category`, `slug`, `price`, `imgUrl`, `gameVersion` (`'path-of-exile-1' | 'path-of-exile-2'`), `league`, `difficulty`.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `NEXT_PUBLIC_SITE_URL` — Absolute site URL (used for canonical URLs and sitemap)
- Stripe, AbacatePay, Resend (email), Sanity, Turnstile keys
