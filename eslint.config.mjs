// @ts-check

import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['dist/'] },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // the tooling configs aren't part of tsconfig.json, see tsconfig.tooling.json
          allowDefaultProject: ['eslint.config.mjs', 'prettier.config.mts'],
          defaultProject: 'tsconfig.tooling.json'
        },
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    rules: {
      eqeqeq: 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      '@typescript-eslint/no-shadow': 'error'
    }
  }
)
