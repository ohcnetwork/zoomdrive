/**
 * usage: Asia/Jakarta is GMT+7
 * ```
 * convertTZ("2012/04/20 10:10:30 +0000", "Asia/Jakarta") // Tue Apr 20 2012 17:10:30 GMT+0700 (Western Indonesia Time)
 * ```
 *
 * Reference: https://stackoverflow.com/a/54127122/7887936
 */
function convertTZ(date, tzString) {
  return new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: tzString,
    })
  );
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
const titleCase = (s) =>
  s.replace(/^_*(.)|_+(.)/g, (s, c, d) =>
    c ? c.toUpperCase() : " " + d.toUpperCase()
  );

module.exports = {
  convertTZ,
  titleCase,
};
