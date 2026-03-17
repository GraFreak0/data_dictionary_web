type ClassValue = string | number | undefined | null | false | Record<string, boolean>

export function cn(...classes: ClassValue[]): string {
  return classes
    .flatMap((c) => {
      if (!c) return []
      if (typeof c === 'string') return [c]
      return Object.entries(c)
        .filter(([, v]) => v)
        .map(([k]) => k)
    })
    .join(' ')
}
