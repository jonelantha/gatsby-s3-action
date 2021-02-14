import { exec } from '@actions/exec'

export async function syncToS3Bucket({
  localSource,
  s3Bucket,
  s3Path,
  syncDelete,
  filesNotToBrowserCache,
  browserCacheDuration,
  cdnCacheDuration,
  debug
}: SyncS3Params): Promise<void> {
  const destination = makeS3Destination(s3Bucket, s3Path)

  await syncAllFiles(
    localSource,
    destination,
    syncDelete,
    browserCacheDuration,
    cdnCacheDuration,
    debug
  )

  await setNoBrowserCaching(
    destination,
    filesNotToBrowserCache,
    cdnCacheDuration,
    debug
  )
}

interface SyncS3Params {
  localSource: string
  s3Bucket: string
  s3Path: string
  syncDelete: boolean
  filesNotToBrowserCache: string[]
  browserCacheDuration: number
  cdnCacheDuration: number
  debug: boolean
}

async function syncAllFiles(
  source: string,
  destination: string,
  syncDelete: boolean,
  browserCacheDuration: number,
  cdnCacheDuration: number,
  debug: boolean
): Promise<void> {
  const browserCachingHeader = getCacheControlHeader(
    browserCacheDuration,
    cdnCacheDuration
  )

  const cmdParts = [
    `aws s3 sync ${source} ${destination}`,
    debug ? '--debug' : undefined,
    syncDelete ? '--delete' : undefined,
    `--cache-control "${browserCachingHeader}"`
  ]

  const cmd = cmdParts.filter(part => part).join(' ')

  await exec(cmd)
}

async function setNoBrowserCaching(
  destination: string,
  filePatterns: string[],
  cdnCacheDuration: number,
  debug: boolean
): Promise<void> {
  const noBrowserCachingHeader = getCacheControlHeader(0, cdnCacheDuration)

  const cmdParts = [
    `aws s3 cp ${destination} ${destination}`,
    debug ? '--debug' : undefined,
    '--exclude "*"',
    filePatterns.map(pattern => `--include "${pattern}"`).join(' '),
    '--recursive',
    '--metadata-directive REPLACE',
    `--cache-control "${noBrowserCachingHeader}"`
  ]

  const cmd = cmdParts.filter(part => part).join(' ')

  await exec(cmd)
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
