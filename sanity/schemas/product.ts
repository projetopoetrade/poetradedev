import {defineType, defineField, SlugValue, Rule, ValidationBuilder, NumberRule, StringRule, ImageRule, ImageValue} from 'sanity'

// Define a type for the selection in the preview prepare function for clarity
interface ProductPreviewSelection {
  name?: string
  category?: string
  media?: any
}

export default defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Product Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Description",
      type: "object",
      fields: [
        {
          name: "en",
          title: "English",
          type: "array",
          of: [
            {
              type: "block"
            },
            {
              type: "image",
              options: {
                hotspot: true
              }
            },
            {
              type: "table"
            }
          ]
        },
        {
          name: "pt_br",
          title: "Portuguese",
          type: "array",
          of: [
            {
              type: "block"
            },
            {
              type: "image",
              options: {
                hotspot: true
              }
            },
            {
              type: "table"
            }
          ]
        }

      ]
    }),

    defineField({
      name: "gameVersion",
      title: "Game Version",
      type: "string",
      options: {
        list: [
          { title: "Path of Exile 1", value: "path-of-exile-1" },
          { title: "Path of Exile 2", value: "path-of-exile-2" }
        ]
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "league",
      title: "League",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "updatedAt",
      title: "Last Updated",
      type: "datetime",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    })
  ],

  preview: {
    select: {
      name: "name",
      category: "category",
      media: "imgUrl",
    },
    prepare(selection: ProductPreviewSelection) {
      const { category, name, media } = selection;
      return {
        title: name || 'Untitled Product',
        subtitle: category ? `Category: ${category}` : 'No category specified',
        media: media,
      };
    },
  },
});