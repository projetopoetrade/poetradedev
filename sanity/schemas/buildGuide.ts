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
        "Must match the build slug in Supabase (e.g. cold-dot-elementalist). Used to link this guide to a build when the build's guide_content (Markdown) is empty.",
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
        "Rich guide content (blocks, images, code, table, PoE Item). Shown on the build page when the build's Markdown guide is empty.",
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
