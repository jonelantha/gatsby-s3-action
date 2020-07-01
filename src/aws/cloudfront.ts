import {exec} from '@actions/exec'

export async function invalidateCloudfront({
  cloudfrontID
}: InvalidateCloudfrontParams): Promise<void> {
  await exec(
    [
      'aws cloudfront create-invalidation',
      `--distribution-id ${cloudfrontID}`,
      '--paths /*'
    ].join(' ')
  )
}

interface InvalidateCloudfrontParams {
  cloudfrontID: string
}
