import { getBooleanInput, getIntInput } from './input'
import { getInput, setFailed } from '@actions/core'
import { invalidateCloudfront } from './aws/cloudfront'
import { syncToS3Bucket } from './aws/s3'

async function deploy(): Promise<void> {
  await syncToS3Bucket({
    localSource: getInput('public-source-path'),
    s3Bucket: getInput('dest-s3-bucket', { required: true }),
    s3Path: getInput('dest-s3-path'),
    syncDelete: getBooleanInput('sync-delete'),
    sizeOnly: getBooleanInput('only-size-changed'),
    filesNotToBrowserCache: [
      '*.html',
      '*sw.js',
      '*app-data.json',
      '*page-data/*.json'
    ],
    browserCacheDuration: getIntInput('browser-cache-duration'),
    cdnCacheDuration: getIntInput('cdn-cache-duration'),
    debug: getBooleanInput('debug')
  })

  const cloudfrontIDToInvalidate = getInput('cloudfront-id-to-invalidate')
  if (cloudfrontIDToInvalidate) {
    await invalidateCloudfront({
      cloudfrontID: cloudfrontIDToInvalidate,
      paths: getInput('cloudfront-path-to-invalidate'),
      debug: getBooleanInput('debug')
    })
  }
}

// eslint-disable-next-line github/no-then
deploy().catch(error => {
  setFailed(error instanceof Error ? error.message : String(error))
})
