import {exec} from '@actions/exec'
import {invalidateCloudfront} from '../src/aws/cloudfront'

jest.mock('@actions/exec')

const mockedExec = exec as jest.MockedFunction<typeof exec>

const defaultParams = {
  cloudfrontID: 'abcdef1234',
  paths: '/*'
}

describe('aws commands to exec', () => {
  test.each([
    [
      'basic case',
      defaultParams,
      'aws cloudfront create-invalidation --distribution-id abcdef1234 --paths /*'
    ]
  ])('case: %s', async (_, invalidateParams, expectedAwsCommand) => {
    await invalidateCloudfront(invalidateParams)

    expect(mockedExec).toHaveBeenCalledWith(expectedAwsCommand)
  })
})
