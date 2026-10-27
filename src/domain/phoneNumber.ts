const FORMATTING = /[\s().-]/g
const DIALABLE_NUMBER = /^\+?[\d*#]{1,30}$/
export function normalizeDialNumber(input: string): string | null {
  const number = input.trim().replace(FORMATTING, '')
  return DIALABLE_NUMBER.test(number) && /\d/.test(number) ? number : null
}

export const isDialableNumber = (input: string): boolean => normalizeDialNumber(input) !== null
