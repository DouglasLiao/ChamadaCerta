import path from 'node:path';
const dependencies = {
  domain: new Set(['domain']),
  application: new Set(['domain', 'application']),
  platform: new Set(['domain', 'application', 'platform']),
  presentation: new Set(['domain', 'application', 'presentation', 'shared']),
  features: new Set(['domain', 'application', 'presentation', 'features', 'shared']),
  shared: new Set(['shared']),
  app: new Set(['app', 'domain', 'application', 'platform', 'presentation', 'features', 'shared']),
  composition: new Set([
    'app',
    'domain',
    'application',
    'platform',
    'presentation',
    'features',
    'shared',
  ]),
};
export function sourceLayer(file) {
  const normalized = file.replaceAll('\\', '/');
  if (normalized === 'src/main.tsx') return 'composition';
  return normalized.startsWith('src/') ? normalized.split('/')[1] : null;
}
export function importViolation(from, specifier) {
  const layer = sourceLayer(from);
  if (!dependencies[layer]) return `Camada não registrada: ${from}`;
  if (!specifier.startsWith('.') && !specifier.startsWith('/src/')) {
    return ['domain', 'application'].includes(layer)
      ? `${from}: dependência externa ${specifier} no núcleo`
      : null;
  }
  const target = specifier.startsWith('/src/')
    ? specifier.slice(1)
    : path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
  const targetLayer = sourceLayer(target);
  return dependencies[layer].has(targetLayer)
    ? null
    : `${from}: ${layer} não pode depender de ${targetLayer ?? target}`;
}
export function findCycles(graph) {
  const visited = new Set();
  const active = new Set();
  const stack = [];
  const cycles = [];
  function visit(file) {
    if (active.has(file)) {
      cycles.push([...stack.slice(stack.indexOf(file)), file]);
      return;
    }
    if (visited.has(file)) return;
    active.add(file);
    stack.push(file);
    for (const target of graph.get(file) ?? []) visit(target);
    stack.pop();
    active.delete(file);
    visited.add(file);
  }
  for (const file of graph.keys()) visit(file);
  return cycles;
}
