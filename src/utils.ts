/**
 * usage: Asia/Jakarta is GMT+7
 * ```
 * convertTZ("2012/04/20 10:10:30 +0000", "Asia/Jakarta") // Tue Apr 20 2012 17:10:30 GMT+0700 (Western Indonesia Time)
 * ```
 *
 * Reference: https://stackoverflow.com/a/54127122/7887936
 */
export function convertTZ(date: Date | string, tzString: string): Date {
  return new Date(
    (typeof date === 'string' ? new Date(date) : date).toLocaleString('en-US', {
      timeZone: tzString,
    })
  )
}

/**
 * Convert snake_case to Title Case
 *
 * usage:
 * ```
 * titleCase("hello_world") // "Hello World"
 * ```
 *
 * Reference: https://stackoverflow.com/a/64489760/7887936
 */
export const titleCase = (s: string): string =>
  s.replace(/^_*(.)|_+(.)/g, (_, c, d) => (c ? c.toUpperCase() : ` ${d.toUpperCase()}`))

/**
 * Convert bytes to human readable file size
 *
 * usage:
 * prettyFileSize(1024)
 *
 * this will return:
 * "1.00 kB"
 */
export const prettyFileSize = (bytes: number): string => {
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`
}

/**
 * Print a progress bar
 *
 * Eg: for 50% progress, it will print:
 * ```
 * [====================>               ] 50%
 */
export const progressBar = (progress: number): string => {
  const barLength = 20
  const percent = (progress * 100).toFixed(0)
  const bar = '='.repeat(Math.floor(progress * barLength))
  const space = ' '.repeat(barLength - bar.length)
  const showArrow = bar.length < barLength
  const paddedPercent = percent.padStart(3, ' ')
  return `[${bar}${showArrow ? '>' : '='}${space}] ${paddedPercent}%`
}
