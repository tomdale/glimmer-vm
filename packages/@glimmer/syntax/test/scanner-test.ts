import { createScanner, SyntaxKind as S } from '..';

const test = QUnit.test;

QUnit.module('[glimmer-syntax] Scanner');

function tokenize(source: string) {
  let scanner = createScanner(source);
  let tokens = [];
  let token;

  let count = 0;
  while ((token = scanner.scan()) !== S.EndOfFileToken) {
    count++;
    if (count > 1000) { throw new Error("Infinite loop detected"); }
    tokens.push({ token, value: scanner.getTokenValue() });
  }

  return tokens;
}

function data(content: string) {
  return { token: S.HTMLData, value: content };
}

function tagOpen(tagName: string) {
  return { token: S.TagOpen, value: tagName };
}

function tagClose(tagName: string) {
  return { token: S.TagClose, value: tagName };
}

function mustacheOpen(tagName: string) {
  return { token: S.MustacheOpen, value: tagName };
}

function mustacheArgument(argName: string) {
  return { token: S.MustacheArgument, value: argName };
}

test('simple content', function(assert) {
  let tokens = tokenize('some content');

  assert.deepEqual(tokens, [data('some content')]);
});

test('a simple tag', assert => {
  let tokens = tokenize('<div>');

  assert.deepEqual(tokens, [tagOpen('div')]);
});

test('a simple tag with trailing spaces', assert => {
  let tokens = tokenize('<div   \t\n>');

  assert.deepEqual(tokens, [tagOpen('div')]);
});

test('a simple closing tag', assert => {
  let tokens = tokenize('</div>');

  assert.deepEqual(tokens, [tagClose('div')]);
});

test('A simple closing tag with trailing spaces', assert => {
  let tokens = tokenize('</div   \t\n>');

  assert.deepEqual(tokens, [tagClose('div')]);
});

test('A pair of hyphenated tags', assert => {
  let tokens = tokenize('<x-foo></x-foo>');
  assert.deepEqual(tokens, [tagOpen('x-foo'), tagClose('x-foo')]);
});

test('an HTML element', function(assert) {
  let tokens = tokenize('some <div>content</div>');

  assert.deepEqual(tokens, [data('some '), tagOpen('div'), data('content'), tagClose('div')]);
});

test('a simple mustache', function(assert) {
  let tokens = tokenize('some {{content}}');

  assert.deepEqual(tokens, [data('some '), mustacheOpen('content')]);
});

test('a simple mustache with arguments', function(assert) {
  let tokens = tokenize('some {{content foo}}');

  assert.deepEqual(tokens, [data('some '), mustacheOpen('content'), mustacheArgument('foo')]);
});

// QUnit.test('A tag with a single-quoted attribute', function(assert) {
//   let tokens = tokenize("<div id='foo'>");
//   assert.deepEqual(tokens, [startTag('div', [['id', 'foo', true]])]);
// });

// QUnit.test('A tag with a double-quoted attribute', function(assert) {
//   let tokens = tokenize('<div id="foo">');
//   assert.deepEqual(tokens, [startTag('div', [['id', 'foo', true]])]);
// });

// QUnit.test('A tag with a double-quoted empty', function(assert) {
//   let tokens = tokenize('<div id="">');
//   assert.deepEqual(tokens, [startTag('div', [['id', '', true]])]);
// });

// QUnit.test('A tag with unquoted attribute', function(assert) {
//   let tokens = tokenize('<div id=foo>');
//   assert.deepEqual(tokens, [startTag('div', [['id', 'foo', false]])]);
// });

// QUnit.test('A tag with valueless attributes', function(assert) {
//   let tokens = tokenize('<div foo bar>');
//   assert.deepEqual(tokens, [
//     startTag('div', [['foo', '', false], ['bar', '', false]])
//   ]);
// });

// QUnit.test('Missing attribute name', function(assert) {
//   let tokens = tokenize('<div =foo>');
//   assert.deepEqual(tokens, [
//     withSyntaxError(
//       'attribute name cannot start with equals sign',
//       startTag('div', [['=foo', '', false]])
//     )
//   ]);
// });

// QUnit.test('Invalid character in attribute name', function(assert) {
//   let tokens = tokenize('<div ">');
//   assert.deepEqual(tokens, [
//     withSyntaxError(
//       '" is not a valid character within attribute names',
//       startTag('div', [['"', '', false]])
//     )
//   ]);
// });

// QUnit.test('A tag with multiple attributes', function(assert) {
//   let tokens = tokenize('<div id=foo class="bar baz" href=\'bat\'>');
//   assert.deepEqual(tokens, [
//     startTag('div', [
//       ['id', 'foo', false],
//       ['class', 'bar baz', true],
//       ['href', 'bat', true]
//     ])
//   ]);
// });

// QUnit.test('A tag with capitalization in attributes', function(assert) {
//   let tokens = tokenize('<svg viewBox="0 0 0 0">');
//   assert.deepEqual(tokens, [startTag('svg', [['viewBox', '0 0 0 0', true]])]);
// });

// QUnit.test('A tag with capitalization in the tag', function(assert) {
//   let tokens = tokenize('<linearGradient>');
//   assert.deepEqual(tokens, [startTag('linearGradient', [])]);
// });

// QUnit.test('A self-closing tag', function(assert) {
//   let tokens = tokenize('<img />');
//   assert.deepEqual(tokens, [startTag('img', [], true)]);
// });

// QUnit.test(
//   'A self-closing tag with valueless attributes (regression)',
//   function(assert) {
//     let tokens = tokenize('<input disabled />');
//     assert.deepEqual(tokens, [
//       startTag('input', [['disabled', '', false]], true)
//     ]);
//   }
// );

// QUnit.test(
//   'A self-closing tag with valueless attributes without space before closing (regression)',
//   function(assert) {
//     let tokens = tokenize('<input disabled/>');
//     assert.deepEqual(tokens, [
//       startTag('input', [['disabled', '', false]], true)
//     ]);
//   }
// );

// QUnit.test(
//   'A self-closing tag with an attribute with unquoted value without space before closing (regression)',
//   function(assert) {
//     let tokens = tokenize('<input data-foo=bar/>');
//     assert.deepEqual(tokens, [
//       startTag('input', [['data-foo', 'bar', false]], true)
//     ]);
//   }
// );

// QUnit.test('A tag with a / in the middle', function(assert) {
//   let tokens = tokenize('<img / src="foo.png">');
//   assert.deepEqual(tokens, [startTag('img', [['src', 'foo.png', true]])]);
// });

// QUnit.test('An opening and closing tag with some content', function(assert) {
//   let tokens = tokenize("<div id='foo' class='{{bar}} baz'>Some content</div>");
//   assert.deepEqual(tokens, [
//     startTag('div', [['id', 'foo', true], ['class', '{{bar}} baz', true]]),
//     chars('Some content'),
//     endTag('div')
//   ]);
// });

// QUnit.test('A comment', function(assert) {
//   let tokens = tokenize('<!-- hello -->');
//   assert.deepEqual(tokens, [comment(' hello ')]);
// });

// QUnit.test('A (buggy) comment with no ending --', function(assert) {
//   let tokens = tokenize('<!-->');
//   assert.deepEqual(tokens, [comment()]);
// });

// QUnit.test('A comment that immediately closes', function(assert) {
//   let tokens = tokenize('<!---->');
//   assert.deepEqual(tokens, [comment()]);
// });

// QUnit.test('A comment that contains a -', function(assert) {
//   let tokens = tokenize('<!-- A perfectly legal - appears -->');
//   assert.deepEqual(tokens, [comment(' A perfectly legal - appears ')]);
// });

// QUnit.test('A (buggy) comment that contains two --', function(assert) {
//   let tokens = tokenize('<!-- A questionable -- appears -->');
//   assert.deepEqual(tokens, [comment(' A questionable -- appears ')]);
// });

// QUnit.test('Character references are expanded', function(assert) {
//   let tokens = tokenize(
//     '&quot;Foo &amp; Bar&quot; &lt; &#60;&#x3c; &#x3C; &LT; &NotGreaterFullEqual; &Borksnorlax; &nleqq;'
//   );
//   assert.deepEqual(tokens, [chars('"Foo & Bar" < << < < ≧̸ &Borksnorlax; ≦̸')]);

//   tokens = tokenize(
//     "<div title='&quot;Foo &amp; Bar&quot; &blk12; &lt; &#60;&#x3c; &#x3C; &LT; &NotGreaterFullEqual; &Borksnorlax; &nleqq;'>"
//   );
//   assert.deepEqual(tokens, [
//     startTag('div', [
//       ['title', '"Foo & Bar" ▒ < << < < ≧̸ &Borksnorlax; ≦̸', true]
//     ])
//   ]);
// });

// // https://html.spec.whatwg.org/multipage/syntax.html#element-restrictions
// QUnit.test('A newline immediately following a <pre> tag is stripped', function(assert) {
//   let tokens = tokenize("<pre>\nhello</pre>");
//   assert.deepEqual(tokens, [startTag('pre'), chars('hello'), endTag('pre')]);
// });

// // https://html.spec.whatwg.org/multipage/syntax.html#element-restrictions
// QUnit.test('A newline immediately following a <PRE> tag is stripped', function(assert) {
//   let tokens = tokenize("<PRE>\nhello</PRE>");
//   assert.deepEqual(tokens, [startTag('PRE'), chars('hello'), endTag('PRE')]);
// });

// // https://html.spec.whatwg.org/multipage/syntax.html#element-restrictions
// QUnit.test('A newline immediately following a <textarea> tag is stripped', function(assert) {
//   let tokens = tokenize("<textarea>\nhello</textarea>");
//   assert.deepEqual(tokens, [startTag('textarea'), chars('hello'), endTag('textarea')]);
// });

// // https://github.com/emberjs/rfcs/blob/master/text/0311-angle-bracket-invocation.md#dynamic-invocations
// QUnit.test('An Emberish named arg invocation', function(assert) {
//   let tokens = tokenize('<@foo></@foo>');
//   assert.deepEqual(tokens, [startTag('@foo'), endTag('@foo')]);
// });

// QUnit.module('simple-html-tokenizer - preprocessing');

// QUnit.test('Carriage returns are replaced with line feeds', function(assert) {
//   let tokens = tokenize('\r\r\n\r\r\n\n');
//   assert.deepEqual(tokens, [chars('\n\n\n\n\n')]);
// });

// QUnit.module('simple-html-tokenizer - location info');

// QUnit.test('lines are counted correctly', function(assert) {
//   let tokens = tokenize('\r\r\n\r\r\n\n', { loc: true });
//   assert.deepEqual(tokens, [locInfo(chars('\n\n\n\n\n'), 1, 0, 6, 0)]);
// });

// QUnit.test('tokens: Chars', function(assert) {
//   let tokens = tokenize('Chars', { loc: true });
//   assert.deepEqual(tokens, [locInfo(chars('Chars'), 1, 0, 1, 5)]);
// });

// QUnit.test('tokens: Chars start-tag Chars', function(assert) {
//   let tokens = tokenize('Chars<div>Chars', { loc: true });
//   assert.deepEqual(tokens, [
//     locInfo(chars('Chars'), 1, 0, 1, 5),
//     locInfo(startTag('div'), 1, 5, 1, 10),
//     locInfo(chars('Chars'), 1, 10, 1, 15)
//   ]);
// });

// QUnit.test('tokens: start-tag start-tag', function(assert) {
//   let tokens = tokenize('<div><div>', { loc: true });
//   assert.deepEqual(tokens, [
//     locInfo(startTag('div'), 1, 0, 1, 5),
//     locInfo(startTag('div'), 1, 5, 1, 10)
//   ]);
// });

// QUnit.test('tokens: html char ref start-tag', function(assert) {
//   let tokens = tokenize('&gt;<div>', { loc: true });
//   assert.deepEqual(tokens, [
//     locInfo(chars('>'), 1, 0, 1, 4),
//     locInfo(startTag('div'), 1, 4, 1, 9)
//   ]);
// });

// QUnit.test('tokens: Chars start-tag Chars start-tag', function(assert) {
//   let tokens = tokenize('Chars\n<div>Chars\n<div>', {
//     loc: true
//   });
//   assert.deepEqual(tokens, [
//     locInfo(chars('Chars\n'), 1, 0, 2, 0),
//     locInfo(startTag('div'), 2, 0, 2, 5),
//     locInfo(chars('Chars\n'), 2, 5, 3, 0),
//     locInfo(startTag('div'), 3, 0, 3, 5)
//   ]);
// });

// QUnit.test('tokens: comment start-tag Chars end-tag', function(assert) {
//   let tokens = tokenize(
//     '<!-- multline\ncomment --><div foo=bar>Chars\n</div>',
//     { loc: true }
//   );
//   assert.deepEqual(tokens, [
//     locInfo(comment(' multline\ncomment '), 1, 0, 2, 11),
//     locInfo(startTag('div', [['foo', 'bar', false]]), 2, 11, 2, 24),
//     locInfo(chars('Chars\n'), 2, 24, 3, 0),
//     locInfo(endTag('div'), 3, 0, 3, 6)
//   ]);
// });
