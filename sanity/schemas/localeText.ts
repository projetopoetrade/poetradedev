// Multi-line sibling of `localeString` — same fallback rules, `text` inputs.
const localeText = {
  name: "localeText",
  title: "Localized long text",
  type: "object",
  options: {
    collapsible: true,
    collapsed: false,
  },
  fields: [
    {
      name: "en",
      title: "English",
      type: "text",
      rows: 4,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "ptBr",
      title: "Português (BR)",
      type: "text",
      rows: 4,
      description: "Optional. Falls back to the English text when empty.",
    },
  ],
};

export default localeText;
