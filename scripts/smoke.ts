// Smoke test for the built bundle: run it after `npm run bundle`.
//
// Runs dist/index.js against a fake `aws` on PATH, so input parsing and process
// spawning (including quoted arguments) are exercised on the real runtime, not just
// loading. The action's output is only shown when something fails: its ::error::
// lines would otherwise show up as error annotations on a passing CI run.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'

const bundle = resolve(import.meta.dirname, '../dist/index.js')
const work = mkdtempSync(join(tmpdir(), 'gatsby-s3-action-smoke-'))
const callsFile = join(work, 'aws-calls')
let lastOutput = ''

// a fake aws that logs every argument in brackets, one call per line
writeFileSync(
  join(work, 'aws'),
  `#!/bin/sh\nprintf '[%s]' "$@" >> "$SMOKE_AWS_CALLS"\necho >> "$SMOKE_AWS_CALLS"\n`
)
chmodSync(join(work, 'aws'), 0o755)
writeFileSync(callsFile, '')

function runBundle(inputs: Record<string, string>) {
  const env: NodeJS.ProcessEnv = {}
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.startsWith('INPUT_')) env[name] = value
  }
  env.PATH = `${work}${delimiter}${process.env.PATH ?? ''}`
  env.SMOKE_AWS_CALLS = callsFile
  for (const [name, value] of Object.entries(inputs)) {
    env[`INPUT_${name.toUpperCase()}`] = value
  }

  const result = spawnSync(process.execPath, [bundle], {
    env,
    encoding: 'utf8'
  })
  lastOutput = result.stdout + result.stderr
  return result
}

try {
  // valid inputs: one sync, three cp and one CloudFront invalidation, each argument
  // arriving intact (the cache-control value contains spaces)
  const valid = runBundle({
    'dest-s3-bucket': 'smoke-bucket',
    'public-source-path': './public/',
    'sync-delete': 'true',
    'only-size-changed': 'false',
    'browser-cache-duration': '60',
    'cdn-cache-duration': '120',
    'cloudfront-id-to-invalidate': 'E123',
    'cloudfront-path-to-invalidate': '/*',
    debug: 'false'
  })
  assert.equal(valid.status, 0, 'the bundle should succeed with valid inputs')

  const calls = readFileSync(callsFile, 'utf8').trim().split('\n')
  assert.equal(
    calls.length,
    5,
    'expected one sync, three cp and one invalidation'
  )
  assert.equal(
    calls[0],
    '[s3][sync][./public/][s3://smoke-bucket][--delete][--cache-control][public, max-age=60, immutable, s-maxage=120]'
  )
  assert.equal(
    calls[4],
    '[cloudfront][create-invalidation][--distribution-id][E123][--paths][/*]'
  )

  // no inputs: must fail, and say why
  const none = runBundle({})
  assert.notEqual(none.status, 0, 'the bundle should fail with no inputs')
  assert.match(lastOutput, /Input required and not supplied: dest-s3-bucket/)

  console.log('smoke test passed')
} catch (error) {
  console.error(lastOutput)
  throw error
} finally {
  rmSync(work, { recursive: true, force: true })
}
