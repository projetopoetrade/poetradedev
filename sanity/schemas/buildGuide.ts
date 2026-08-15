const buildGuide = {
  name: "buildGuide",
  title: "Build Guide",
  type: "document",
  fields: [
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      description:
        "Must match the build slug in Supabase (e.g. cold-dot-elementalist). Links this guide to the build.",
      options: {
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "body",
      title: "Guide content",
      type: "blockContent",
      description:
        "Rich guide content (blocks, images, code, table, PoE Item). This is the build's guide on /builds/[slug] — supports {{item:...}}, gems, currency, {{price:...}} and {{cta:...}} placeholders, same as the blog.",
      validation: (Rule: any) => Rule.required(),
    },
  ],
  preview: {
    select: { slug: "slug.current" },
    prepare({ slug }: { slug?: string }) {
      return {
        title: slug ? `Build Guide: ${slug}` : "Build Guide (no slug)",
      };
    },
  },
};

export default buildGuide;
