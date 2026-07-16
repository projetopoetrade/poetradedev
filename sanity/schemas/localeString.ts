// Inline per-locale strings, as opposed to the whole-document translation that
// @sanity/document-internationalization gives `post`/`author`/`category`.
//
// A league landing is a single document edited live, under time pressure, while
// the reveal stream is running. Splitting it into an EN doc and a PT-BR doc
// would mean filling the same trailer list twice before the page looks right in
// either language. Keeping both languages side by side in one document means
// one pass, and `pt-br` staying empty degrades to English instead of blanking
// the section — see resolveLocale() in lib/league-landing.ts.
const localeString = {
  name: "localeString",
  title: "Localized text",
  type: "object",
  options: {
    collapsible: true,
    collapsed: false,
  },
  fields: [
    {
      name: "en",
      title: "English",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "ptBr",
      title: "Português (BR)",
      type: "string",
      description: "Optional. Falls back to the English text when empty.",
    },
  ],
};

export default localeString;
