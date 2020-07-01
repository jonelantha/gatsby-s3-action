import {exec} from '@actions/exec'

export async function syncToS3Bucket({
  localSource,
  s3Bucket,
  s3Path,
  filesNotToBrowserCache,
  browserCacheDuration,
  cdnCacheDuration
}: SyncS3Params): Promise<void> {
  const destination = makeS3Destination(s3Bucket, s3Path)

  await syncAllFiles(
    localSource,
    destination,
    browserCacheDuration,
    cdnCacheDuration
  )

  await setNoBrowserCaching(
    destination,
    filesNotToBrowserCache,
    cdnCacheDuration
  )
}

interface SyncS3Params {
  localSource: string
  s3Bucket: string
  s3Path: string
  filesNotToBrowserCache: string[]
  browserCacheDuration: number
  cdnCacheDuration: number
}

async function syncAllFiles(
  source: string,
  destination: string,
  browserCacheDuration: number,
  cdnCacheDuration: number
): Promise<void> {
  const browserCachingHeader = getCacheControlHeader(
    browserCacheDuration,
    cdnCacheDuration
  )

  await exec(
    [
      `aws s3 sync ${source} ${destination}`,
      '--delete',
      `--cache-control "${browserCachingHeader}"`
    ].join(' ')
  )
}

async function setNoBrowserCaching(
  destination: string,
  filePatterns: string[],
  cdnCacheDuration: number
): Promise<void> {
  const noBrowserCachingHeader = getCacheControlHeader(0, cdnCacheDuration)

  await exec(
    [
      `aws s3 cp ${destination} ${destination}`,
      '--exclude "*"',
      filePatterns.map(pattern => `--include "${pattern}"`).join(' '),
      '--recursive',
      '--metadata-directive REPLACE',
      `--cache-control "${noBrowserCachingHeader}"`
    ].join(' ')
  )
}

function makeS3Destination(bucket: string, path?: string): string {
  if (path) {
    return `s3://${bucket}/${removeLeadingSlash(path)}`
  } else {
    return `s3://${bucket}`
  }
}

function getCacheControlHeader(
  browserCacheDuration: number,
  cdnCacheDuration: number
): string {
  let header = ''

  if (browserCacheDuration > 0) {
    header += `public, max-age=${browserCacheDuration}, immutable`
  } else {
    header += 'public, max-age=0, must-revalidate'
  }

  header += `, s-maxage=${cdnCacheDuration}`

  return header
}

function removeLeadingSlash(str: string): string {
  return str.replace(/^\/?/, '')
}
