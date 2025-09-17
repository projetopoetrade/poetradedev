export default {
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    {
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'row',
          fields: [
            {
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [
                {
                  type: 'string',
                  name: 'cell'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
} 