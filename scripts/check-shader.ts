/**
 * The journey's shader is put together from pieces, so that the hero can be the mark or the room, and the room's
 * gate the guide's picture or the exchange (src/journey/shader.ts). This says whether the mark's picture, the
 * room's, and the room's with the exchange are still, character for character, the ones a given commit had:
 * `npx tsx scripts/check-shader.ts [commit]` (the default is HEAD). It also prints their sizes. (A try behind an
 * address of its own is put together only when asked for, and is not one of these.)
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FRAGMENT, FRAGMENT_ROOM, FRAGMENT_ROOM_EXCHANGE } from '../src/journey/shader'

const commit = process.argv[2] ?? 'HEAD'
const root = resolve(import.meta.dirname, '..')
const was = execFileSync('git', ['-C', root, 'show', `${commit}:src/journey/shader.ts`], { encoding: 'utf8' })
// (the committed file, with its imports pointed at this tree's modules)
const here = (path: string) => JSON.stringify(pathToFileURL(resolve(root, path)).href)
const dir = mkdtempSync(join(tmpdir(), 'hw-shader-'))
const file = join(dir, 'shader.ts')
writeFileSync(
  file,
  was
    .replace("'../config'", here('src/config.ts'))
    .replace("'./timing'", here('src/journey/timing.ts'))
    .replace("'./exchange'", here('src/journey/exchange.ts'))
    .replace("'./stroke'", here('src/journey/stroke.ts')),
)
const then = (await import(pathToFileURL(file).href)) as { FRAGMENT: string; FRAGMENT_ROOM?: string; FRAGMENT_ROOM_EXCHANGE?: string }

console.log(`the mark's picture: ${FRAGMENT.length} characters; the room's: ${FRAGMENT_ROOM.length}; with the exchange: ${FRAGMENT_ROOM_EXCHANGE.length}`)
const compare = (name: string, now: string, before: string | undefined) => {
  if (before === undefined) return console.log(`${commit} has no ${name}`)
  if (before === now) return console.log(`${name} is the one ${commit} has`)
  let i = 0
  while (i < now.length && now[i] === before[i]) i++
  console.log(`${name} differs from ${commit} at character ${i}:`)
  console.log(`  then: ${JSON.stringify(before.slice(i - 40, i + 80))}`)
  console.log(`  now:  ${JSON.stringify(now.slice(i - 40, i + 80))}`)
  process.exitCode = 1
}
compare("the mark's picture", FRAGMENT, then.FRAGMENT)
compare("the room's picture", FRAGMENT_ROOM, then.FRAGMENT_ROOM)
compare("the room's picture with the exchange", FRAGMENT_ROOM_EXCHANGE, then.FRAGMENT_ROOM_EXCHANGE)
