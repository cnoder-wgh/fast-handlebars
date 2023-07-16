/**
 * @type import('eslint').Linter.Config
 */
module.exports = {
  ignorePatterns: ['node_modules', 'dist', 'jest.config.ts', 'coverage'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true,
    },
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-namespace": "off",
    'prefer-arrow-callback': 'off',
    'node/no-unpublished-require': 'off',
    'node/no-extraneous-import': 'off',
    'prefer-rest-params': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
  },
  env: {
    jest: true,
    node: true,
  },
};
