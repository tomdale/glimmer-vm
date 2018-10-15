import { createScanner, SyntaxKind as S } from '..';

const test = QUnit.test;

QUnit.module('[glimmer-syntax] Scanner');

function tokenize(source: string) {
  let scanner = createScanner(source);
  let tokens = [];
  let tokenValues = [];
  let token;

  let count = 0;
  while ((token = scanner.scan()) !== S.EndOfFileToken) {
    count++;
    if (count > 1000) { throw new Error("Infinite loop detected"); }
    tokens.push(token);
    tokenValues.push(scanner.getTokenValue());
  }

  return { tokens, tokenValues };
}

test('a simple piece of content', function(assert) {
  let { tokens, tokenValues } = tokenize('some content');

  assert.deepEqual(tokens, [S.HTMLData]);
  assert.deepEqual(tokenValues, ['some content']);
});

test('an HTML element', function(assert) {
  let { tokens, tokenValues } = tokenize('some <div>content</div>');

  assert.deepEqual(tokens, [S.HTMLData, S.TagOpen, S.HTMLData, S.TagClose]);
  assert.deepEqual(tokenValues, ['some ', 'div', 'content', 'div']);
});

test('a simple mustache', function(assert) {
  let { tokens, tokenValues } = tokenize('some {{content}}');

  assert.deepEqual(tokens, [S.HTMLData, S.MustacheOpen]);
  assert.deepEqual(tokenValues, ['some ', 'content']);
});

test('a simple mustache with arguments', function(assert) {
  let { tokens, tokenValues } = tokenize('some {{content foo}}');

  assert.deepEqual(tokens, [S.HTMLData, S.MustacheOpen, S.MustacheArgument]);
  assert.deepEqual(tokenValues, ['some ', 'content', 'foo']);
});
