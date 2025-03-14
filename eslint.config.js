import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  react: true,
  typescript: true,

  formatters: true,
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
  rules: {
    'no-console': 'off',
  },
})
