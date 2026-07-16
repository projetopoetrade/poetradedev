// Volatile data for an upcoming league's landing page.
//
// Deliberately NOT a page builder: there are no layout, ordering or styling
// fields here. The composition lives in app/[locale]/(site)/leagues/[slug] and
// components/LeagueLanding/*. This document only supplies the facts that the
// reveal stream decides — name, dates, trailers, mechanics — so they can be
// filled in without a deploy while the design stays ours.
const leagueLanding = {
  name: "leagueLanding",
  title: "League Landing",
  type: "document",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "timing", title: "Dates" },
    { name: "art", title: "Art" },
    { name: "content", title: "Trailers & Mechanics" },
    { name: "links", title: "Links & FAQ" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // ─── Identity ────────────────────────────────────────────────────────────
    {
      name: "name",
      title: "League name",
      type: "string",
      group: "identity",
      description:
        'Exactly as GGG announces it, without the "League" suffix. e.g. "Settlers of Kalguur".',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "identity",
      description: "Drives the URL: /leagues/<slug>. Generate it from the name.",
      options: { source: "name", maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "gameVersion",
      title: "Game",
      type: "string",
      group: "identity",
      options: {
        list: [
          { title: "Path of Exile 1", value: "path-of-exile-1" },
          { title: "Path of Exile 2", value: "path-of-exile-2" },
        ],
        layout: "radio",
      },
      initialValue: "path-of-exile-1",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "version",
      title: "Patch version",
      type: "string",
      group: "identity",
      description: 'Optional. e.g. "3.26". Shown as a badge in the hero.',
    },
    {
      name: "tagline",
      title: "Tagline",
      type: "localeString",
      group: "identity",
      description:
        "One hype line under the league name in the hero. Keep it under ~90 characters.",
    },
    {
      name: "intro",
      title: "Intro paragraph",
      type: "localeText",
      group: "identity",
      description:
        "Two or three sentences summarising the league. Sits right below the countdown.",
    },
    {
      name: "isPublished",
      title: "Published",
      type: "boolean",
      group: "identity",
      description:
        "Off = the page 404s and stays out of the sitemap. Turn on when you are ready to be seen.",
      initialValue: false,
    },
    {
      name: "supabaseLeagueName",
      title: "Store league name (Supabase)",
      type: "string",
      group: "identity",
      description:
        'Must match `leagues.name` in Supabase exactly — that string is the join key to products. Leave empty until the league exists in the store; the "buy currency" CTA hides itself while it is blank.',
    },

    // ─── Dates ───────────────────────────────────────────────────────────────
    {
      name: "startsAt",
      title: "League start",
      type: "datetime",
      group: "timing",
      description:
        "The exact launch instant. Pick it in your own timezone — Sanity stores UTC and every visitor sees it converted to their local clock. Leave empty and the hero shows a TBA state instead of a countdown. This single field decides upcoming vs live.",
    },
    {
      name: "revealAt",
      title: "Reveal stream",
      type: "datetime",
      group: "timing",
      description: "The announcement livestream. Shown on the timeline.",
    },
    {
      name: "patchNotesAt",
      title: "Patch notes",
      type: "datetime",
      group: "timing",
      description: "Optional. When full patch notes drop. Shown on the timeline.",
    },

    // ─── Art ─────────────────────────────────────────────────────────────────
    {
      name: "keyArt",
      title: "Key art",
      type: "image",
      group: "art",
      options: { hotspot: true },
      description:
        "Full-bleed hero background. Wide crop (2400x1350 or larger). The hotspot decides what survives on mobile.",
      fields: [
        {
          name: "alt",
          title: "Alt text",
          type: "string",
          description: "Describe the art for screen readers and SEO.",
        },
      ],
    },
    {
      name: "logo",
      title: "League logo",
      type: "image",
      group: "art",
      description:
        "Optional transparent PNG. Replaces the typeset league name in the hero when present.",
    },
    {
      name: "accentColor",
      title: "Accent colour",
      type: "string",
      group: "art",
      description:
        'Hex, e.g. "#c9a227". Themes the countdown, buttons and glows so the page matches the league art. Defaults to the site gold when empty.',
      validation: (Rule: any) =>
        Rule.regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
          name: "hex colour",
          invert: false,
        }).warning('Use a hex colour like "#c9a227".'),
    },

    // ─── Trailers & Mechanics ────────────────────────────────────────────────
    {
      name: "trailers",
      title: "Trailers",
      type: "array",
      group: "content",
      description:
        "The first one is featured large; the rest become the gallery. Reorder by dragging.",
      of: [
        {
          type: "object",
          name: "trailer",
          fields: [
            {
              name: "title",
              title: "Title",
              type: "localeString",
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: "youtubeId",
              title: "YouTube ID",
              type: "string",
              description:
                'Just the ID, not the whole URL — the part after "v=" or after "youtu.be/". e.g. dQw4w9WgXcQ',
              validation: (Rule: any) =>
                Rule.required().regex(/^[a-zA-Z0-9_-]{11}$/, {
                  name: "YouTube ID",
                }).error("A YouTube ID is exactly 11 characters — paste the ID, not the full URL."),
            },
            {
              name: "kind",
              title: "Kind",
              type: "string",
              options: {
                list: [
                  { title: "Teaser", value: "teaser" },
                  { title: "Trailer", value: "trailer" },
                  { title: "Gameplay", value: "gameplay" },
                  { title: "Mechanic deep dive", value: "mechanic" },
                  { title: "Reveal stream (VOD)", value: "vod" },
                ],
              },
              initialValue: "trailer",
            },
            {
              name: "thumbnail",
              title: "Custom thumbnail",
              type: "image",
              options: { hotspot: true },
              description:
                "Optional. Leave empty to use YouTube's own thumbnail automatically.",
            },
          ],
          preview: {
            select: { title: "title.en", kind: "kind", media: "thumbnail" },
            prepare({ title, kind, media }: any) {
              return {
                title: title || "(untitled trailer)",
                subtitle: kind,
                media,
              };
            },
          },
        },
      ],
    },
    {
      name: "mechanics",
      title: "League mechanics",
      type: "array",
      group: "content",
      description:
        "One entry per mechanic/feature. Rendered as alternating full-width sections in order.",
      of: [
        {
          type: "object",
          name: "mechanic",
          fields: [
            {
              name: "title",
              title: "Title",
              type: "localeString",
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: "summary",
              title: "Summary",
              type: "localeText",
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
            },
            {
              name: "bullets",
              title: "Key points",
              type: "array",
              of: [{ type: "localeString" }],
              description: "Optional short bullets listed under the summary.",
            },
          ],
          preview: {
            select: { title: "title.en", subtitle: "summary.en", media: "image" },
          },
        },
      ],
    },
    {
      name: "highlights",
      title: "Quick facts",
      type: "array",
      group: "content",
      description:
        'Small stat strip under the hero. e.g. label "New skills" / value "18". Three or four works best.',
      of: [
        {
          type: "object",
          name: "highlight",
          fields: [
            { name: "label", title: "Label", type: "localeString" },
            { name: "value", title: "Value", type: "localeString" },
          ],
          preview: {
            select: { title: "value.en", subtitle: "label.en" },
          },
        },
      ],
      validation: (Rule: any) => Rule.max(4).warning("More than four crowds the strip."),
    },

    // ─── Links & FAQ ─────────────────────────────────────────────────────────
    {
      name: "officialUrl",
      title: "Official announcement URL",
      type: "url",
      group: "links",
    },
    {
      name: "patchNotesUrl",
      title: "Patch notes URL",
      type: "url",
      group: "links",
    },
    {
      name: "faq",
      title: "FAQ",
      type: "array",
      group: "links",
      description:
        'Answer the literal things people search on launch week: "when does <league> start", "what time in my timezone", "do I need to buy anything". Also emitted as FAQPage structured data — Google dropped FAQ rich results for non-gov/health sites in 2023, so treat this as on-page content first and machine-readable second.',
      of: [
        {
          type: "object",
          name: "faqItem",
          fields: [
            {
              name: "question",
              title: "Question",
              type: "localeString",
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: "answer",
              title: "Answer",
              type: "localeText",
              validation: (Rule: any) => Rule.required(),
            },
          ],
          preview: { select: { title: "question.en", subtitle: "answer.en" } },
        },
      ],
    },

    // ─── SEO ─────────────────────────────────────────────────────────────────
    {
      name: "seoTitle",
      title: "SEO title override",
      type: "localeString",
      group: "seo",
      description:
        "Optional. Leave empty for a sensible auto-generated title built from the league name and date.",
    },
    {
      name: "seoDescription",
      title: "SEO description override",
      type: "localeText",
      group: "seo",
      description: "Optional. Auto-generated from the tagline when empty.",
    },
    {
      name: "ogImage",
      title: "Social share image",
      type: "image",
      group: "seo",
      description: "Optional. 1200x630. Falls back to the key art.",
    },
  ],
  preview: {
    select: {
      title: "name",
      gameVersion: "gameVersion",
      startsAt: "startsAt",
      isPublished: "isPublished",
      media: "keyArt",
    },
    prepare({ title, gameVersion, startsAt, isPublished, media }: any) {
      const game = gameVersion === "path-of-exile-2" ? "PoE 2" : "PoE 1";
      const when = startsAt
        ? new Date(startsAt).toISOString().slice(0, 10)
        : "date TBA";
      return {
        title: `${title || "(unnamed league)"}${isPublished ? "" : " — draft"}`,
        subtitle: `${game} · ${when}`,
        media,
      };
    },
  },
};

export default leagueLanding;
