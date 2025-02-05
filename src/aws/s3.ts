import { exec } from '@actions/exec'
import { extname } from 'node:path'

export async function syncToS3Bucket(params: SyncS3Params): Promise<void> {
  const destination = makeS3Destination(params.s3Bucket, params.s3Path)

  await syncAllFiles(
    params.localSource,
    destination,
    params.syncDelete,
    params.sizeOnly,
    params.browserCacheDuration,
    params.cdnCacheDuration,
    params.debug
  )

  await setNoBrowserCaching(
    destination,
    params.filesNotToBrowserCache,
    params.cdnCacheDuration,
    params.debug
  )
}

interface SyncS3Params {
  localSource: string
  s3Bucket: string
  s3Path: string
  syncDelete: boolean
  sizeOnly: boolean
  filesNotToBrowserCache: string[]
  browserCacheDuration: number
  cdnCacheDuration: number
  debug: boolean
}

async function syncAllFiles(
  source: string,
  destination: string,
  syncDelete: boolean,
  sizeOnly: boolean,
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
    sizeOnly ? '--size-only' : undefined,
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

  for (const filePattern of filePatterns) {
    const extension = extname(filePattern)
    if (!(extension in contentTypeLookup)) {
      throw Error(`No mimetype for '${extension}'`)
    }

    const contentType =
      contentTypeLookup[extension as keyof typeof contentTypeLookup]

    const cmdParts = [
      `aws s3 cp ${destination} ${destination}`,
      debug ? '--debug' : undefined,
      '--exclude "*"',
      `--include "${filePattern}"`,
      '--recursive',
      '--metadata-directive REPLACE',
      `--cache-control "${noBrowserCachingHeader}"`,
      `--content-type "${contentType}"`
    ]

    const cmd = cmdParts.filter(part => part).join(' ')

    await exec(cmd)
  }
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

const contentTypeLookup = {
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.html': 'text/html'
}
