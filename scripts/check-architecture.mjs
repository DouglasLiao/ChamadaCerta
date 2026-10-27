import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
import { importViolation, findCycles } from './lib/architecture-policy.mjs'
async function filesIn(directory, extension) {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`
    if (entry.isDirectory()) result.push(...(await filesIn(file, extension)))
    else if (extension.test(file)) result.push(file)
  }
  return result
}
const files = await filesIn('src', /\.tsx?$/)
const available = new Set(files)
const graph = new Map()
const failures = []
for (const file of files) {
  const source = ts.createSourceFile(
    file,
    await readFile(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const imports = []
  function inspect(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    )
      imports.push(node.moduleSpecifier.text)
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      const argument = node.arguments[0]
      if (argument && ts.isStringLiteralLike(argument)) imports.push(argument.text)
      else failures.push(`${file}: import dinâmico sem caminho literal`)
    }
    ts.forEachChild(node, inspect)
  }
  inspect(source)
  const targets = []
  for (const specifier of imports) {
    const violation = importViolation(file, specifier)
    if (violation) failures.push(violation)
    if (!specifier.startsWith('.') && !specifier.startsWith('/src/')) continue
    const base = specifier.startsWith('/src/')
      ? specifier.slice(1)
      : path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier))
    const target = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}/index.ts`,
      `${base}/index.tsx`,
    ].find((candidate) => available.has(candidate))
    if (target) targets.push(target)
  }
  graph.set(file, targets)
}
for (const cycle of findCycles(graph)) failures.push(`Ciclo: ${cycle.join(' -> ')}`)
const nativeDomain = 'android/app/src/main/java/com/chamadacerta/app/domain'
for (const file of await filesIn(nativeDomain, /\.kt$/)) {
  const text = await readFile(file, 'utf8')
  for (const match of text.matchAll(/^\s*import\s+([^\s;]+)/gm)) {
    if (
      !/^(kotlin\.|java\.(lang|util|math|time)\.|com\.chamadacerta\.app\.domain\.)/.test(match[1])
    )
      failures.push(`${file}: dependência externa ao domínio Kotlin: ${match[1]}`)
  }
}
const bridgeSource = ts.createSourceFile(
  'bridge.ts',
  await readFile('src/platform/android/bridge.ts', 'utf8'),
  ts.ScriptTarget.Latest,
  true,
)
const methods = new Set()
ts.forEachChild(bridgeSource, (node) => {
  if (
    ts.isTypeAliasDeclaration(node) &&
    node.name.text === 'NativeMethod' &&
    ts.isUnionTypeNode(node.type)
  ) {
    for (const member of node.type.types)
      if (ts.isLiteralTypeNode(member) && ts.isStringLiteralLike(member.literal))
        methods.add(member.literal.text)
  }
})
const kotlinBridge = await readFile(
  'android/app/src/main/java/com/chamadacerta/app/bridge/AndroidBridge.kt',
  'utf8',
)
const nativeMethods = new Set(
  [...kotlinBridge.matchAll(/"([A-Za-z]+)"\s*->/g)].map((match) => match[1]),
)
for (const method of methods)
  if (!nativeMethods.has(method)) failures.push(`Ponte: método sem implementação Kotlin: ${method}`)
for (const method of nativeMethods)
  if (!methods.has(method)) failures.push(`Ponte: método Kotlin sem contrato TypeScript: ${method}`)
if (!methods.size) failures.push('Contrato da ponte não encontrado.')
if (failures.length) {
  for (const failure of failures) console.error(failure)
  process.exitCode = 1
} else
  console.log(
    `Arquitetura validada: ${files.length} módulos TypeScript, domínio Kotlin, ausência de ciclos e ${methods.size} métodos da ponte.`,
  )
