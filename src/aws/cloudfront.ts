import {exec} from '@actions/exec'

export async function invalidateCloudfront({
  cloudfrontID,
  paths
}: InvalidateCloudfrontParams): Promise<void> {
  await exec(
    [
      'aws cloudfront create-invalidation',
      `--distribution-id ${cloudfrontID}`,
      `--paths ${paths}`
    ].join(' ')
  )
}

interface InvalidateCloudfrontParams {
  cloudfrontID: string
  paths: string
}
