/**
 * What the landing page's address asks for.
 *
 * The page was built as a row of tries, each behind a word in the address (?gate=exchange, &films=after, &ground=ink
 * and so on: the README names them all), so that each could be looked at beside what it would replace. The page as
 * it now stands is the set of those that were taken. They are the defaults here, so the plain address shows that
 * page, and everything that reads the address reads it through this.
 *
 * A word given in the address still wins over its default: &ground=paper shows the page without the Ink ground,
 * &foot=ink its foot's other card, and the tries that were not taken are asked for as before (&how=cards,
 * &arc=plain, &name=solid, &call=late). ?page=before shows the landing page as it was before any of them.
 */
const NOW = 'gate=exchange&layout=right&drop=mark&films=after&logo=swim&flow=soar&phones=shot&cards=under&foot=neon&ground=ink'

const given = new URLSearchParams(window.location.search)

export const asked = new URLSearchParams(given.get('page') === 'before' ? '' : NOW)
given.forEach((value, key) => asked.set(key, value))
