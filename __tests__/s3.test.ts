import { exec } from '@actions/exec'
import { syncToS3Bucket } from '../src/aws/s3'

jest.mock('@actions/exec')

const mockedExec = exec as jest.MockedFunction<typeof exec>

const defaultParams = {
  localSource: './public/',
  s3Bucket: 'mybucket',
  s3Path: '',
  syncDelete: true,
  sizeOnly: false,
  filesNotToBrowserCache: [
    '*.html',
    '*sw.js',
    '*app-data.json',
    '*page-data/*.json'
  ],
  browserCacheDuration: 456,
  cdnCacheDuration: 123,
  debug: false
}

describe('aws commands to exec', () => {
  test.each([
    [
      'basic case',
      {
        syncParams: defaultParams,
        expectedCommands: [
          'aws s3 sync ./public/ s3://mybucket --delete --cache-control "public, max-age=456, immutable, s-maxage=123"',
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*.html" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "text/html"',
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"',
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*app-data.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"',
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*page-data/*.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"'
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
          'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"',
          'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*app-data.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"',
          'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*page-data/*.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"'
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
          'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"',
          'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*app-data.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"',
          'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*page-data/*.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"'
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
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"',
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*app-data.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"',
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*page-data/*.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"'
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
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"',
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*app-data.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"',
          'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*page-data/*.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"'
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
          'aws s3 cp s3://mybucket s3://mybucket --debug --exclude "*" --include "*sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/javascript"',
          'aws s3 cp s3://mybucket s3://mybucket --debug --exclude "*" --include "*app-data.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"',
          'aws s3 cp s3://mybucket s3://mybucket --debug --exclude "*" --include "*page-data/*.json" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123" --content-type "application/json"'
        ]
      }
    ]
  ])('case: %s', async (_, { syncParams, expectedCommands }) => {
    await syncToS3Bucket(syncParams)

    for (let i = 0; i < expectedCommands.length; i++) {
      expect(mockedExec).toHaveBeenNthCalledWith(i + 1, expectedCommands[i])
    }
  })
})
