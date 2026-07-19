/**
 * Build Overview — documento Sanity com seções de texto montáveis.
 *
 * Ligado à build Supabase pelo slug (mesma convenção de `buildGuide`).
 * Mini PoB Viewer é sempre exibido no topo (auto, via pob_code), e as
 * seções definidas aqui aparecem abaixo dele na página /builds/[slug].
 *
 * Cada seção tem heading opcional + body em Portable Text (blockContent).
 */

const contentSection = {
  name: "contentSection",
  title: "Content Section",
  type: "object",
  description: "Uma seção de texto livre com heading opcional.",
  fields: [
    {
      name: "heading",
      title: "Heading (opcional)",
      type: "string",
      description: "Subtítulo da seção. Ex.: 'Gameplay Loop', 'Leveling Tips', 'Boss Strategy'.",
    },
    {
      name: "body",
      title: "Conteúdo",
      type: "blockContent",
      description: "Texto rico da seção (Portable Text). Pode incluir imagens, código, tabelas, PoE Items.",
    },
  ],
  preview: {
    select: { heading: "heading" },
    prepare({ heading }: { heading?: string }) {
      return {
        title: heading || "Content Section",
        subtitle: "Portable Text",
      };
    },
  },
};

const buildOverview = {
  name: "buildOverview",
  title: "Build Overview",
  type: "document",
  description:
    "Seções de texto que aparecem abaixo do Mini PoB Viewer na página /builds/[slug]. Crie quantas seções quiser, em qualquer ordem. Builds sem este documento seguem sem as seções extras.",
  fields: [
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      description:
        "Deve bater com o slug da build no Supabase (ex.: lightning-strike-trickster).",
      options: { maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "sections",
      title: "Seções",
      type: "array",
      description: "Arraste as seções na ordem desejada. Cada uma aparece como um bloco de texto na página.",
      of: [{ type: "contentSection" }],
      validation: (Rule: any) => Rule.min(1),
    },
  ],
  preview: {
    select: { slug: "slug.current", sections: "sections" },
    prepare({ slug, sections }: { slug?: string; sections?: unknown[] }) {
      return {
        title: slug ? `Overview: ${slug}` : "Overview (no slug)",
        subtitle: `${sections?.length ?? 0} seções`,
      };
    },
  },
};

export default buildOverview;
export { contentSection };