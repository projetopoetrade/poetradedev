const league = {
  name: 'league',
  title: 'League',
  type: 'document',
  fields: [
    // ─── IDENTIFICAÇÃO ──────────────────────────────────────────
    {
      name: 'title',
      title: 'League Name',
      type: 'string',
      description: 'Ex: "Keepers of the Flame"',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'gameVersion',
      title: 'Game Version',
      type: 'string',
      options: {
        list: [
          { title: 'Path of Exile 1', value: 'path-of-exile-1' },
          { title: 'Path of Exile 2', value: 'path-of-exile-2' },
        ],
        layout: 'radio',
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'patchVersion',
      title: 'Patch Version',
      type: 'string',
      description: 'Ex: "3.27"',
    },
    {
      name: 'status',
      title: 'League Status',
      type: 'string',
      options: {
        list: [
          { title: '📣 Announced (Pre-Launch)', value: 'announced' },
          { title: '🟢 Live', value: 'live' },
          { title: '⚫ Ended', value: 'ended' },
        ],
        layout: 'radio',
      },
      description: 'Controls which version of the page is shown',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'launchDate',
      title: 'Launch Date',
      type: 'datetime',
    },
    {
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
    },
    {
      name: 'datePublished',
      title: 'Date Published (for SEO/schema.org)',
      type: 'date',
      description: 'Used in JSON-LD. Normally same as launch date.',
    },
    {
      name: 'bannerImage',
      title: 'League Banner Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'subtitle',
      title: 'Hero Subtitle',
      type: 'string',
      description: 'Shown below the league name in the hero section',
    },

    // ─── PRE-LAUNCH ─────────────────────────────────────────────
    {
      name: 'prelaunchTeaser',
      title: 'Pre-Launch Teaser Text',
      type: 'text',
      rows: 6,
      description: 'Shown when status is "announced". Summary of what we know so far.',
    },
    {
      name: 'prelaunchMediaUrls',
      title: 'Teaser Media URLs',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'YouTube embed URLs (format: https://www.youtube.com/embed/ID)',
    },
    {
      name: 'gggPosts',
      title: 'GGG Official Posts',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Post Title' },
            { name: 'url', type: 'url', title: 'URL' },
            { name: 'date', type: 'datetime', title: 'Published Date' },
            { name: 'summary', type: 'text', title: 'Summary', rows: 3 },
          ],
          preview: { select: { title: 'title', subtitle: 'date' } },
        },
      ],
    },

    // ─── TL;DR ──────────────────────────────────────────────────
    // Feeds TLDRSection component: { title: string, items: {text, type}[] }
    {
      name: 'tldr',
      title: 'TL;DR Section',
      type: 'object',
      fields: [
        { name: 'title', type: 'string', title: 'Section Title' },
        {
          name: 'items',
          title: 'Items',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'text', type: 'string', title: 'Text' },
                {
                  name: 'type',
                  type: 'string',
                  title: 'Type',
                  options: {
                    list: [
                      { title: '🟢 Buff', value: 'buff' },
                      { title: '🔴 Nerf', value: 'nerf' },
                      { title: '🔵 New', value: 'new' },
                      { title: '⚪ Neutral', value: 'neutral' },
                    ],
                    layout: 'radio',
                  },
                },
              ],
              preview: { select: { title: 'text', subtitle: 'type' } },
            },
          ],
        },
      ],
    },

    // ─── MECHANICS ──────────────────────────────────────────────
    // Feeds MechanicAnalysis component
    {
      name: 'mechanics',
      title: 'Mechanic Analysis Section',
      type: 'object',
      fields: [
        { name: 'title', type: 'string', title: 'Section Title' },
        { name: 'description', type: 'text', title: 'Description', rows: 4 },
        {
          name: 'points',
          title: 'Main Points',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'title', type: 'string', title: 'Title' },
                { name: 'description', type: 'text', title: 'Description', rows: 3 },
              ],
              preview: { select: { title: 'title' } },
            },
          ],
        },
        {
          name: 'tradeImpact',
          title: 'Trade & Economy Impact',
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Section Title' },
            {
              name: 'points',
              type: 'array',
              of: [{ type: 'string' }],
              title: 'Impact Points',
            },
          ],
        },
      ],
    },

    // ─── PATCH NOTES ────────────────────────────────────────────
    // Feeds PatchNotesSection component
    {
      name: 'patchNotes',
      title: 'Patch Notes Section',
      type: 'object',
      fields: [
        { name: 'title', type: 'string', title: 'Section Title' },
        { name: 'subtitle', type: 'string', title: 'Subtitle' },
        { name: 'officialUrl', type: 'url', title: 'Official Patch Notes URL' },
        { name: 'officialText', type: 'string', title: 'Official Notes Button Text' },
        {
          name: 'categories',
          title: 'Categories',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'title', type: 'string', title: 'Category Title' },
                {
                  name: 'changes',
                  type: 'array',
                  of: [{ type: 'string' }],
                  title: 'Changes',
                },
              ],
              preview: { select: { title: 'title' } },
            },
          ],
        },
      ],
    },

    // ─── STARTERS ───────────────────────────────────────────────
    // Feeds LeagueStarters component
    {
      name: 'starters',
      title: 'League Starter Builds',
      type: 'object',
      fields: [
        { name: 'title', type: 'string', title: 'Section Title' },
        { name: 'subtitle', type: 'string', title: 'Subtitle' },
        {
          name: 'tierS',
          title: 'S-Tier Label',
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'description', type: 'string', title: 'Description' },
          ],
        },
        {
          name: 'tierA',
          title: 'A-Tier Label',
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'description', type: 'string', title: 'Description' },
          ],
        },
        {
          name: 'builds',
          title: 'Builds',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'name', type: 'string', title: 'Build Name' },
                { name: 'class', type: 'string', title: 'Ascendancy / Class' },
                {
                  name: 'tier',
                  type: 'string',
                  title: 'Tier',
                  options: {
                    list: [
                      { title: '⭐ S', value: 'S' },
                      { title: '💎 A', value: 'A' },
                      { title: '🥉 B', value: 'B' },
                      { title: '📋 C', value: 'C' },
                    ],
                    layout: 'radio',
                  },
                },
                {
                  name: 'difficulty',
                  type: 'string',
                  title: 'Difficulty',
                  options: {
                    list: ['Easy', 'Medium', 'Hard', 'Low', 'High'],
                  },
                },
                { name: 'description', type: 'text', title: 'Description', rows: 3 },
                {
                  name: 'pros',
                  type: 'array',
                  of: [{ type: 'string' }],
                  title: 'Pros',
                },
                {
                  name: 'cons',
                  type: 'array',
                  of: [{ type: 'string' }],
                  title: 'Cons',
                },
                { name: 'guideUrl', type: 'url', title: 'Single Guide URL' },
                {
                  name: 'guides',
                  title: 'Multiple Guides',
                  type: 'array',
                  of: [
                    {
                      type: 'object',
                      fields: [
                        { name: 'title', type: 'string', title: 'Guide Title' },
                        { name: 'url', type: 'url', title: 'URL' },
                        { name: 'author', type: 'string', title: 'Author' },
                        { name: 'variant', type: 'string', title: 'Variant' },
                      ],
                      preview: { select: { title: 'title', subtitle: 'author' } },
                    },
                  ],
                },
                { name: 'author', type: 'string', title: 'Build Author' },
              ],
              preview: {
                select: { title: 'name', subtitle: 'class' },
              },
            },
          ],
        },
      ],
    },

    // ─── CTA ────────────────────────────────────────────────────
    {
      name: 'ctaLink',
      title: 'CTA Button Link',
      type: 'string',
      description: 'Ex: "/products?gameVersion=path-of-exile-1&league=Keepers+of+the+Flame&difficulty=softcore"',
    },

    // ─── SEO ────────────────────────────────────────────────────
    {
      name: 'seoTitle',
      title: 'SEO Title Override',
      type: 'string',
      description: 'Leave blank to use the auto-generated title.',
    },
    {
      name: 'seoDescription',
      title: 'SEO Description Override',
      type: 'string',
    },
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'status',
      media: 'bannerImage',
    },
    prepare({ title, subtitle, media }: any) {
      const labels: Record<string, string> = {
        announced: '📣 Announced',
        live: '🟢 Live',
        ended: '⚫ Ended',
      };
      return { title, subtitle: labels[subtitle] || subtitle, media };
    },
  },
};

export default league;
