// @ts-check

import eslint from '@eslint/js'
import { defineConfig } from '@eslint/config-helpers'
import tseslint from 'typescript-eslint'
import githublint from 'eslint-plugin-github'

export default defineConfig(
  { ignores: ['dist/', 'lib/', 'eslint.config.mjs', 'prettier.config.mts'] },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  githublint.getFlatConfigs().recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    rules: {
      'i18n-text/no-en': 'off'
    }
  }
)
