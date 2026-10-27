import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const ignored = new Set([
  'node_modules',
  'dist',
  'artifacts',
  '.git',
  '.gradle',
  'build',
  '.kotlin',
  '.tools',
]);
async function collect(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await collect(file)));
    else if (file.endsWith('.md')) result.push(file);
  }
  return result;
}
const files = await collect(root);
const errors = [];
for (const file of files) {
  const contents = (await readFile(file, 'utf8')).replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  for (const match of contents.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const link = match[1].trim().replace(/^<|>$/g, '');
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    const relative = decodeURIComponent(link.split('#')[0]);
    if (!relative) continue;
    const target = path.resolve(path.dirname(file), relative);
    const resolved = path.relative(root, target);
    if (
      resolved.startsWith('..') ||
      path.isAbsolute(resolved) ||
      !(await stat(target).catch(() => null))
    )
      errors.push(`${path.relative(root, file)}: link local inválido: ${link}`);
  }
}
if (errors.length) {
  errors.forEach((error) => console.error(error));
  process.exitCode = 1;
} else
  console.log(
    `Links locais validados em ${files.length} documentos Markdown. Âncoras e URLs externas não são consultadas.`,
  );
