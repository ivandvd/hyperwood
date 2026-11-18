/**
 * The journey's shader is put together from pieces, so that the hero can be the mark or the room
 * (src/journey/shader.ts). This says whether the mark's picture is still, character for character, the one a
 * given commit had: `npx tsx scripts/check-shader.ts [commit]` (the default is HEAD). It also prints the size
 * of both pictures.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { FRAGMENT, FRAGMENT_ROOM } from '../src/journey/shader'

const commit = process.argv[2] ?? 'HEAD'
const root = resolve(import.meta.dirname, '..')
const was = execFileSync('git', ['-C', root, 'show', `${commit}:src/journey/shader.ts`], { encoding: 'utf8' })
// (the committed file, with its one import pointed at this tree's config)
const dir = mkdtempSync(join(tmpdir(), 'hw-shader-'))
const file = join(dir, 'shader.ts')
writeFileSync(file, was.replace("'../config'", JSON.stringify(pathToFileURL(resolve(root, 'src/config.ts')).href)))
const then = (await import(pathToFileURL(file).href)) as { FRAGMENT: string }

console.log(`the mark's picture: ${FRAGMENT.length} characters; the room's: ${FRAGMENT_ROOM.length}`)
if (then.FRAGMENT === FRAGMENT) console.log(`the mark's picture is the one ${commit} has`)
else {
  let i = 0
  while (i < FRAGMENT.length && FRAGMENT[i] === then.FRAGMENT[i]) i++
  console.log(`the mark's picture differs from ${commit} at character ${i}:`)
  console.log(`  then: ${JSON.stringify(then.FRAGMENT.slice(i - 40, i + 80))}`)
  console.log(`  now:  ${JSON.stringify(FRAGMENT.slice(i - 40, i + 80))}`)
  process.exitCode = 1
}
