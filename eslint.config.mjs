// @ts-check

import eslint from '@eslint/js'
import { defineConfig } from '@eslint/config-helpers'
import tseslint from 'typescript-eslint'
import githublint from 'eslint-plugin-github'
import pluginJest from 'eslint-plugin-jest'

export default defineConfig(
  { ignores: ['dist/', 'lib/', 'jest.config.js', 'eslint.config.mjs'] },
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
  },
  {
    extends: [pluginJest.configs['flat/recommended']],
    files: ['**/*.test.ts']
  }
)
