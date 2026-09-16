import test from 'node:test';
import assert from 'node:assert/strict';
import {safeInternalPath} from '../lib/auth/redirects.mjs';

test('keeps internal auth destinations, queries and fragments', () => {
  for (const value of ['/dashboard', '/forgot-password?reset=1', '/tournaments/cup?register=1#roster']) {
    assert.equal(safeInternalPath(value), value);
  }
});

test('rejects external, normalized and encoded redirect destinations', () => {
  for (const value of [null, '', 'https://example.com', '//example.com', '/\\example.com', '/%5cexample.com', '/%2fexample.com', '/%252fexample.com', '/%255cexample.com', '/\n/example.com', '/%0d/example.com', '/%zz', '/'.repeat(2049)]) {
    assert.equal(safeInternalPath(value, '/login'), '/login', String(value));
  }
});
