# Next Steps Prompt — Path of Trade

> **How to use:** Paste the entire contents of this file into a Claude chat with **extended thinking enabled**. The AI will have full project context and produce a deep, strategic roadmap focused on growth and visibility.

---

## SECTION 1 — PROJECT CONTEXT

### What this is

**Path of Trade** is an e-commerce platform for buying and selling Path of Exile in-game currency. Players use real money to purchase currency items (Chaos Orbs, Divine Orbs, Mirrors, etc.) that are then delivered in-game. The site serves players of both **Path of Exile 1** and **Path of Exile 2**, across multiple active leagues/seasons.

The domain targets a real, passionate niche: PoE players who want to save time farming currency and prefer buying it from a trusted store.

### Tech stack

- **Framework:** Next.js 15 (App Router, Turbopack, TypeScript)
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security)
- **CMS:** Sanity (blog posts, product descriptions, authors/categories)
- **Payments:** Stripe (global) + AbacatePay/PIX (Brazilian players)
- **Internationalization:** next-intl — two locales: `en` (English, default, no prefix) and `pt-br` (Brazilian Portuguese, prefix `/pt-br/`)
- **Hosting:** Vercel (assumed)
- **SEO tooling:** Custom `generateKeywords`, `generateFocusedTitle`, `generateFocusedDescription`, `buildCanonical`, `getHreflangAlternates` utilities; `next-sitemap` for XML sitemap generation post-build
- **UI:** shadcn/ui + Radix UI + Tailwind CSS
- **Bot protection:** Cloudflare Turnstile on checkout

### Current state

- Site is **functional end-to-end**: browse products, add to cart, checkout via Stripe or PIX, order management, admin panel
- **Early-stage traffic** — organic search visibility is low; no significant community presence yet
- Blog exists (Sanity-powered) but has minimal published content
- Product pages, game pages, and league pages exist with structured metadata
- Two-language support is live and canonical/hreflang tags are in place
- No significant social following or backlink profile yet

### What has already been decided

- **No backend refactoring for now.** The architecture is stable and functional. The focus is entirely on growth, visibility, and conversion.
- Payments are working; the checkout flow is not broken.
- The SEO metadata infrastructure is in place — the gap is content and distribution, not technical SEO setup.

### Monetization model

Revenue comes from the margin between what sellers charge and what buyers pay. Higher order volume = more revenue. Key levers:
- More qualified traffic (players actively looking to buy currency)
- Higher conversion rate (trust, UX, speed)
- Repeat purchases (player loyalty, league resets as natural re-engagement events)

### Target audience

- **English-speaking PoE players** globally (primary)
- **Brazilian PoE players** (secondary — significant PoE community in Brazil, PIX payment support already live)
- Players range from casual to hardcore; hardcore players spend more and more frequently
- Decision moment: typically at league start (when everyone needs currency fast) or mid-league (when they hit a wall)

### Competition

Other currency shops exist (e.g., Odealo, Currency.to, PlayerAuctions, smaller sellers). Differentiation opportunities:
- Faster perceived delivery
- More trustworthy brand (reviews, transparency)
- Better localized experience for Brazilian players
- SEO dominance for long-tail queries

---

## SECTION 2 — THE PROMPT

You are a senior growth strategist and SEO expert with deep knowledge of niche e-commerce, gaming communities, and content marketing. You have full context on the Path of Trade project from Section 1 above.

**My decision: no backend refactoring. Every recommendation must be focused purely on growth, visibility, conversion, and retention.**

Please produce a comprehensive, prioritized strategic roadmap for Path of Trade. Think deeply before answering. Structure your response around the five areas below, then synthesize everything into a concrete 30/60/90-day action plan.

---

### Area 1 — SEO & Content Strategy

- What is the most effective keyword targeting strategy for a PoE currency shop? Consider: league-specific keywords, game-version keywords (PoE 1 vs PoE 2), currency type keywords, and buyer-intent long-tail queries.
- Which blog content topics would drive the most qualified organic traffic? Prioritize topics that attract players who are likely to buy, not just read.
- How should product pages be optimized for search? What structured data (schema.org), content depth, and internal linking patterns matter most in this niche?
- How do we handle the league reset cycle from an SEO perspective? (New leagues launch every ~3–4 months; old pages may become stale.)
- Should we pursue separate URL strategies for PoE 1 vs PoE 2? For en vs pt-br? What is the right architecture for maximizing coverage without cannibalization?
- What quick on-page wins (title tags, meta descriptions, headings, content additions) would have the most immediate impact?

---

### Area 2 — Community & Distribution

- Which communities should we target first (Reddit r/pathofexile, r/pathofexile2, Discord servers, official forums, Twitch/YouTube) and in what order?
- What is the right approach to participating in PoE communities without being perceived as spam? What kind of value can the site provide to the community beyond just selling?
- Are there influencer or streamer partnership opportunities in the PoE space? How should we approach them?
- Should we build our own Discord server or community? What would make it valuable enough that players join?
- What content formats (video, guides, tier lists, currency investment guides) would travel well in PoE communities and drive brand awareness?
- How do we take advantage of league launch moments — when player engagement and currency demand spike — from a distribution standpoint?

---

### Area 3 — Trust & Conversion

- What trust signals are most important for a gaming currency shop, where buyers are handing over real money for a digital delivery?
- How should we display delivery time expectations? What copy and UX patterns reduce purchase anxiety?
- What review/testimonial system makes sense given our current stage (few reviews)? How do we bootstrap social proof?
- Are there guarantees (money-back, refill guarantee, etc.) that are industry-standard in this space that we should implement?
- What does a high-converting product page look like in this niche? What elements are most buyers looking for before they click "buy"?
- Is live chat or a visible support channel important for conversion? What is the minimum viable support presence?
- How do we convert one-time buyers into repeat customers? What retention mechanics work in the PoE niche (league resets, email, loyalty)?

---

### Area 4 — Quick Technical Wins That Directly Impact Growth

(Not refactoring — only changes that directly drive traffic, trust, or conversions.)

- Are there any structured data / rich snippet opportunities we are likely missing (Product schema, FAQ schema, Review schema, BreadcrumbList)?
- What page speed or Core Web Vitals improvements would have measurable impact on rankings or conversion?
- Are there any low-effort internal linking or site architecture changes that would help Google discover and rank more pages?
- Should we implement any tracking or analytics beyond basic page views (e.g., conversion funnel tracking, heatmaps, search console query monitoring)?
- Is there a case for a price comparison feature, currency rate tracker, or other utility that could attract organic links or return visits?
- What would make the Brazilian Portuguese experience meaningfully better than competitors for pt-br players specifically?

---

### Area 5 — 30/60/90-Day Action Plan

Synthesize everything above into a prioritized, concrete action plan. For each time horizon, list:

- **The 3–5 highest-leverage actions to take**
- **Why these actions now** (what makes them time-sensitive or foundational)
- **Concrete first step** for each action (specific enough that someone could start tomorrow)
- **Expected outcome** (what does success look like at the end of each period)

Assume the team is small (1–2 people) and bandwidth is limited. Ruthlessly prioritize. Deprioritize anything that is high-effort and low-impact. Flag any actions that are especially time-sensitive due to the current league cycle.

---

**Output format:** Use headers and bullet points for clarity. Be specific — avoid generic advice. Where you make a recommendation, explain *why* it applies to this specific niche and audience. Where there is genuine uncertainty or a strategic tradeoff, name it explicitly and give your recommendation with reasoning.
