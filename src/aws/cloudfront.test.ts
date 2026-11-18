import assert from 'node:assert/strict'
import { beforeEach, describe, mock, test } from 'node:test'
import type { exec as Exec } from '@actions/exec'

const exec = mock.fn<typeof Exec>(() => Promise.resolve(0))
mock.module('@actions/exec', { exports: { exec } })

// node needs the .ts extension to load the source directly
const { invalidateCloudfront } = await import('./cloudfront.ts')

type InvalidateParams = Parameters<typeof invalidateCloudfront>[0]

beforeEach(() => exec.mock.resetCalls())

const defaultParams = {
  cloudfrontID: 'abcdef1234',
  paths: '/*',
  debug: false
}

const cases: [
  string,
  { invalidateParams: InvalidateParams; expectedCommand: string }
][] = [
  [
    'basic case',
    {
      invalidateParams: defaultParams,
      expectedCommand:
        'aws cloudfront create-invalidation --distribution-id abcdef1234 --paths /*'
    }
  ],
  [
    'with debug',
    {
      invalidateParams: {
        ...defaultParams,
        debug: true
      },
      expectedCommand:
        'aws cloudfront create-invalidation --debug --distribution-id abcdef1234 --paths /*'
    }
  ]
]

void describe('aws commands to exec', () => {
  for (const [name, { invalidateParams, expectedCommand }] of cases) {
    void test(`case: ${name}`, async () => {
      await invalidateCloudfront(invalidateParams)

      assert.deepEqual(
        exec.mock.calls.map(call => call.arguments[0]),
        [expectedCommand]
      )
    })
  }
})
