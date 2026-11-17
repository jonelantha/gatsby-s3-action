import assert from 'node:assert/strict'
import { beforeEach, describe, mock, test } from 'node:test'
import type { exec as Exec } from '@actions/exec'

const exec = mock.fn<typeof Exec>(() => Promise.resolve(0))
mock.module('@actions/exec', { exports: { exec } })

// node needs the .ts extension to load the source directly
const { syncToS3Bucket } = await import('../src/aws/s3.ts')

type SyncParams = Parameters<typeof syncToS3Bucket>[0]

beforeEach(() => exec.mock.resetCalls())

const defaultParams = {
  localSource: './public/',
  s3Bucket: 'mybucket',
  s3Path: '',
  syncDelete: true,
  sizeOnly: false,
  filesNotToBrowserCache: ['*.html', 'sw.js'],
  browserCacheDuration: 456,
  cdnCacheDuration: 123,
  debug: false
}

const cases: [
  string,
  { syncParams: SyncParams; expectedCommands: string[] }
][] = [
  [
    'basic case',
    {
      syncParams: defaultParams,
      expectedCommands: [
        'aws s3 sync ./public/ s3://mybucket --delete --cache-control "public, max-age=456, immutable, s-maxage=123"',
        'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*.html" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "text/html"',
        'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"'
      ]
    }
  ],
  [
    'with path no leading slash',
    {
      syncParams: {
        ...defaultParams,
        s3Path: 'mypath'
      },
      expectedCommands: [
        'aws s3 sync ./public/ s3://mybucket/mypath --delete --cache-control "public, max-age=456, immutable, s-maxage=123"',
        'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*.html" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "text/html"',
        'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"'
      ]
    }
  ],
  [
    'with path with leading slash',
    {
      syncParams: {
        ...defaultParams,
        s3Path: '/mypath'
      },
      expectedCommands: [
        'aws s3 sync ./public/ s3://mybucket/mypath --delete --cache-control "public, max-age=456, immutable, s-maxage=123"',
        'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*.html" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "text/html"',
        'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"'
      ]
    }
  ],
  [
    'with sync delete set to false',
    {
      syncParams: {
        ...defaultParams,
        syncDelete: false
      },
      expectedCommands: [
        'aws s3 sync ./public/ s3://mybucket --cache-control "public, max-age=456, immutable, s-maxage=123"',
        'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*.html" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "text/html"',
        'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"'
      ]
    }
  ],
  [
    'with size only set to true',
    {
      syncParams: {
        ...defaultParams,
        sizeOnly: true
      },
      expectedCommands: [
        'aws s3 sync ./public/ s3://mybucket --delete --size-only --cache-control "public, max-age=456, immutable, s-maxage=123"',
        'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*.html" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "text/html"',
        'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"'
      ]
    }
  ],
  [
    'with debug set to true',
    {
      syncParams: {
        ...defaultParams,
        debug: true
      },
      expectedCommands: [
        'aws s3 sync ./public/ s3://mybucket --debug --delete --cache-control "public, max-age=456, immutable, s-maxage=123"',
        'aws s3 cp s3://mybucket s3://mybucket --debug --exclude "*" --include "*.html" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "text/html"',
        'aws s3 cp s3://mybucket s3://mybucket --debug --exclude "*" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"'
      ]
    }
  ]
]

void describe('aws commands to exec', () => {
  for (const [name, { syncParams, expectedCommands }] of cases) {
    void test(`case: ${name}`, async () => {
      await syncToS3Bucket(syncParams)

      assert.deepEqual(
        exec.mock.calls.map(call => call.arguments[0]),
        expectedCommands
      )
    })
  }
})
