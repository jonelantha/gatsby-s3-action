import { exec } from '@actions/exec'
import { syncToS3Bucket } from '../src/aws/s3'

jest.mock('@actions/exec')

const mockedExec = exec as jest.MockedFunction<typeof exec>

const defaultParams = {
  localSource: './public/',
  s3Bucket: 'mybucket',
  s3Path: '',
  syncDelete: true,
  filesNotToBrowserCache: ['*.html', 'sw.js'],
  browserCacheDuration: 456,
  cdnCacheDuration: 123
}

describe('aws commands to exec', () => {
  test.each([
    [
      'basic case',
      defaultParams,
      'aws s3 sync ./public/ s3://mybucket --delete --cache-control "public, max-age=456, immutable, s-maxage=123"',
      'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*.html" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123"'
    ],
    [
      'with path no leading slash',
      {
        ...defaultParams,
        s3Path: 'mypath'
      },
      'aws s3 sync ./public/ s3://mybucket/mypath --delete --cache-control "public, max-age=456, immutable, s-maxage=123"',
      'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*.html" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123"'
    ],
    [
      'with path with leading slash',
      {
        ...defaultParams,
        s3Path: '/mypath'
      },
      'aws s3 sync ./public/ s3://mybucket/mypath --delete --cache-control "public, max-age=456, immutable, s-maxage=123"',
      'aws s3 cp s3://mybucket/mypath s3://mybucket/mypath --exclude "*" --include "*.html" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123"'
    ],
    [
      'with sync delete set to false',
      {
        ...defaultParams,
        syncDelete: false
      },
      'aws s3 sync ./public/ s3://mybucket --cache-control "public, max-age=456, immutable, s-maxage=123"',
      'aws s3 cp s3://mybucket s3://mybucket --exclude "*" --include "*.html" --include "sw.js" --recursive --metadata-directive REPLACE --cache-control "public, max-age=0, must-revalidate, s-maxage=123"'
    ]
  ])('case: %s', async (_, syncParams, expectedAwsSync, expectedAwsCopy) => {
    await syncToS3Bucket(syncParams)

    expect(mockedExec).toHaveBeenNthCalledWith(1, expectedAwsSync)

    expect(mockedExec).toHaveBeenNthCalledWith(2, expectedAwsCopy)
  })
})
