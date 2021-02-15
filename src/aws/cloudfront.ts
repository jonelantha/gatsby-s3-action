import { exec } from '@actions/exec'

export async function invalidateCloudfront({
  cloudfrontID,
  paths,
  debug
}: InvalidateCloudfrontParams): Promise<void> {
  const cmdParts = [
    'aws cloudfront create-invalidation',
    debug ? '--debug' : undefined,
    `--distribution-id ${cloudfrontID}`,
    `--paths ${paths}`
  ]

  const cmd = cmdParts.filter(part => part).join(' ')

  await exec(cmd)
}

interface InvalidateCloudfrontParams {
  cloudfrontID: string
  paths: string
  debug: boolean
}
