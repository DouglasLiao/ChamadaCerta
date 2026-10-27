const AREA_CODES = new Set(
  (
    '11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 ' +
    '41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 ' +
    '71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'
  ).split(' '),
)

function isBrazilianNational(number: string): boolean {
  return (
    AREA_CODES.has(number.slice(0, 2)) &&
    (/^\d{2}[2-5]\d{7}$/.test(number) || /^\d{2}9\d{8}$/.test(number))
  )
}

// A comparison key, never a replacement for the number saved or dialled.
export function contactNumberKey(input: string): string {
  const formatted = input.trim().replace(/[\s().-]/g, '')
  if (!/^\+?\d+$/.test(formatted)) return `raw:${formatted}`
  const digits = formatted.replace(/^\+/, '')
  let national = ''
  if (formatted.startsWith('+')) {
    if (digits.startsWith('55')) national = digits.slice(2)
  } else if (digits.startsWith('0055')) {
    national = digits.slice(4)
  } else if (digits.startsWith('0') && [13, 14].includes(digits.length)) {
    // 0 + two-digit carrier selection code + DDD + subscriber number.
    if (/^0[1-9]\d/.test(digits)) national = digits.slice(3)
  } else if (digits.startsWith('0') && [11, 12].includes(digits.length)) {
    national = digits.slice(1)
  } else if (digits.startsWith('55') && [12, 13].includes(digits.length)) {
    national = digits.slice(2)
  } else {
    national = digits
  }
  if (isBrazilianNational(national)) return `br:${national}`
  return `${formatted.startsWith('+') ? 'international' : 'number'}:${digits}`
}
