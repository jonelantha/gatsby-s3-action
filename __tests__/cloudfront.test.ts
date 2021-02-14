import { exec } from '@actions/exec'
import { invalidateCloudfront } from '../src/aws/cloudfront'

jest.mock('@actions/exec')

const mockedExec = exec as jest.MockedFunction<typeof exec>

const defaultParams = {
  cloudfrontID: 'abcdef1234',
  paths: '/*',
  debug: false
}

describe('aws commands to exec', () => {
  test.each([
    [
      'basic case',
      {
        invalidateParams: defaultParams,
        expectedCommand:
          'aws cloudfront create-invalidation --distribution-id abcdef1234 --paths /*'
      }
    ],
    [
      'with debug',
      {
        invalidateParams: {
          ...defaultParams,
          debug: true
        },
        expectedCommand:
          'aws cloudfront create-invalidation --debug --distribution-id abcdef1234 --paths /*'
      }
    ]
  ])('case: %s', async (_, { invalidateParams, expectedCommand }) => {
    await invalidateCloudfront(invalidateParams)

    expect(mockedExec).toHaveBeenCalledWith(expectedCommand)
  })
})
