import { getInput } from '@actions/core'

export function getIntInput(name: string): number {
  const stringValue = getInput(name)

  const intValue = parseInt(stringValue, 10)

  if (Number.isNaN(intValue)) {
    throw new RangeError(`Invalid '${name}': ${stringValue}`)
  }

  return intValue
}

export function getBooleanInput(name: string): boolean {
  const stringValue = getInput(name)

  const lcStringValue = stringValue.toLowerCase()

  if (lcStringValue === 'true') return true

  if (lcStringValue === 'false') return false

  throw new RangeError(`Invalid '${name}': ${stringValue}`)
}
