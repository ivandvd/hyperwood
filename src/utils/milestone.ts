/** A point on the page's timeline, named `hw:<name>` (the browser's performance tools show them): how a
 *  start-up went. */
export const milestone = (name: string) => {
  try {
    performance.mark('hw:' + name)
  } catch {
    // (no marks, no harm)
  }
}
