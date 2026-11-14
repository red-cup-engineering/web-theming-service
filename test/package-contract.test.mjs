import test from 'node:test';
import assert from 'node:assert/strict';
import { admitTheme, minimal, render } from '@red-cup-engineering/web-theming-service/theming';
import { sidesOf } from '@red-cup-engineering/signcell/cell';

test('public theme admission preserves witness polarity and refuses malformed shells', () => {
  const accepted = admitTheme(minimal);
  assert.equal(accepted.admitted, true);
  assert.deepEqual(sidesOf(accepted.contract), [true, false]);
  assert.ok(accepted.utterances.length > 0);
  const malformed = { ...minimal, wrap: null, css: 42 };
  const refused = admitTheme(malformed);
  assert.equal(refused.admitted, false);
  assert.deepEqual(sidesOf(refused.contract), [false, true]);
  assert.ok(refused.reasons.length >= 2);
  assert.throws(() => render(malformed, '<p>preserved body</p>', {}));
  assert.match(render(minimal, '<p>preserved body</p>', {}), /<p>preserved body<\/p>/);
});
