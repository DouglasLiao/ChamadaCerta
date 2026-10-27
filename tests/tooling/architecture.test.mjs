import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importViolation, findCycles } from '../../scripts/lib/architecture-policy.mjs';
test('core rejects platform, presentation and package imports', () => {
  assert.ok(importViolation('src/domain/models.ts', '../platform/android/client'));
  assert.ok(
    importViolation('src/application/usecases/placeCall.ts', '../../presentation/AppProvider'),
  );
  assert.ok(importViolation('src/domain/models.ts', 'react'));
});
test('UI cannot bypass its application commands', () => {
  assert.ok(importViolation('src/features/calls/CallsScreen.tsx', '../../platform/android/client'));
  assert.ok(importViolation('src/features/calls/CallsScreen.tsx', '/src/platform/android/client'));
  assert.ok(importViolation('src/shared/ui/EmptyState.tsx', '../../presentation/AppProvider'));
});
test('adapters implement ports and composition may wire adapters', () => {
  assert.equal(
    importViolation('src/platform/android/client.ts', '../../application/ports/DeviceGateway'),
    null,
  );
  assert.equal(importViolation('src/main.tsx', './platform/android/client'), null);
  assert.equal(
    importViolation('src/features/contacts/ContactsScreen.tsx', '../../presentation/AppProvider'),
    null,
  );
});
test('cycles are detected without rejecting a dependency DAG', () => {
  assert.equal(
    findCycles(
      new Map([
        ['a', ['b']],
        ['b', []],
      ]),
    ).length,
    0,
  );
  assert.deepEqual(
    findCycles(
      new Map([
        ['a', ['b']],
        ['b', ['a']],
      ]),
    ),
    [['a', 'b', 'a']],
  );
});
