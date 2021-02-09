import { getInput, setFailed } from '@actions/core'
import { getIntInput, getBooleanInput } from './input'
import { syncToS3Bucket } from './aws/s3'
import { invalidateCloudfront } from './aws/cloudfront'

async function deploy(): Promise<void> {
  await syncToS3Bucket({
    localSource: getInput('public-source-path'),
    s3Bucket: getInput('dest-s3-bucket', { required: true }),
    s3Path: getInput('dest-s3-path'),
    syncDelete: getBooleanInput('sync-delete'),
    filesNotToBrowserCache: [
      { pattern: '*.html', contentType: 'text/html' },
      { pattern: 'page-data/*.json', contentType: 'application/json' },
      { pattern: 'sw.js', contentType: 'application/javascript' }
    ],
    browserCacheDuration: getIntInput('browser-cache-duration'),
    cdnCacheDuration: getIntInput('cdn-cache-duration')
  })

  const cloudfrontIDToInvalidate = getInput('cloudfront-id-to-invalidate')
  if (cloudfrontIDToInvalidate) {
    await invalidateCloudfront({
      cloudfrontID: cloudfrontIDToInvalidate,
      paths: getInput('cloudfront-path-to-invalidate')
    })
  }
}

deploy().catch(error => {
  setFailed(error.message)
})
