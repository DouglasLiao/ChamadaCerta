import { test } from 'node:test'
import assert from 'node:assert/strict'
import { environmentPort } from '../../scripts/lib/environment.mjs'

test('ports require valid integers and retain defaults only when absent', () => {
  assert.equal(environmentPort({}, 'DEV_PORT', 3100), 3100)
  assert.equal(environmentPort({ DEV_PORT: '4100' }, 'DEV_PORT', 3100), 4100)
  for (const value of ['', 'abc', '0', '80', '65536', '3100.5', ' 3100', '3e3']) {
    assert.throws(() => environmentPort({ DEV_PORT: value }, 'DEV_PORT', 3100), /DEV_PORT/)
  }
})
