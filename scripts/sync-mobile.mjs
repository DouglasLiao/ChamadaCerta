import { cp, mkdir, rm, lstat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const target = path.resolve(root, 'android/app/src/main/assets/web')
const relative = path.relative(root, target)
if (relative !== path.join('android', 'app', 'src', 'main', 'assets', 'web'))
  throw new Error('Destino de assets fora do projeto.')
const current = await lstat(target).catch(() => null)
if (current?.isSymbolicLink()) throw new Error('O diretório gerado não pode ser um link.')
// Only this generated directory is replaced; old hashed bundles must not enter the APK.
await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
await cp(new URL('../dist/', import.meta.url), target, { recursive: true })

console.log('Interface mobile copiada para os assets Android.')
