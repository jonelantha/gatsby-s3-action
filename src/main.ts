import {getInput, setFailed} from '@actions/core'
import {getIntInput} from './input'
import {syncToS3Bucket} from './aws/s3'
import {invalidateCloudfront} from './aws/cloudfront'

async function deploy(): Promise<void> {
  const localSource = getInput('public-source-path')
  await syncToS3Bucket({
    localSource: localSource || './public/',
    s3Bucket: getInput('dest-s3-bucket', {required: true}),
    filesNotToBrowserCache: ['*.html', 'page-data/*.json', 'sw.js'],
    browserCacheDuration: getIntInput('browser-cache-duration'),
    cdnCacheDuration: getIntInput('cdn-cache-duration')
  })

  const cloudfrontIDToInvalidate = getInput('cloudfront-id-to-invalidate')
  if (cloudfrontIDToInvalidate) {
    await invalidateCloudfront({cloudfrontID: cloudfrontIDToInvalidate})
  }
}

deploy().catch(error => {
  setFailed(error.message)
})
