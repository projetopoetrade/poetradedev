export default {
  name: 'code',
  title: 'Code Block',
  type: 'object',
  fields: [
    {
      name: 'code',
      title: 'Code',
      type: 'text',
    },
    {
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'Javascript', value: 'javascript' },
          { title: 'HTML', value: 'html' },
          { title: 'CSS', value: 'css' },
          { title: 'React', value: 'react' },
          { title: 'Node', value: 'node' },
          { title: 'MySql', value: 'mysql' },
          { title: 'ZH', value: 'zh' },
        ],
      },
    },
  ],
} 