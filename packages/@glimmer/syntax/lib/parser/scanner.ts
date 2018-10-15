import { SyntaxKind, CharacterCode } from '../types/syntax';

export type ScannerState = () => SyntaxKind | null;

export function createScanner(initialText: string) {
  let text = initialText;
  let pos = 0;
  let start = 0;
  let end = initialText.length;
  let token = SyntaxKind.Unknown;
  let tokenValue = '';
  let tokenPos = 0;
  let line = 0;

  let state: ScannerState = beforeDataState;

  return {
    scan,
    getTokenValue() {
      return tokenValue;
    }
  };

  function scan() {
    console.log('scanning', { pos, end });
    start = pos;
    tokenPos = pos;
    tokenValue = '';

    while (true) {

      if (pos >= end) {
        return (token = SyntaxKind.EndOfFileToken);
      }

      let result = state();
      if (result) { return result; }
    }
  }

  function consume() {
    let char = peek();
    pos++;
    return char;
  }

  function peek() {
    return text.charCodeAt(pos);
  }

  function peekChar() {
    return text.charAt(pos);
  }

  function beforeDataState() {
    let char = peek();

    if (char === CharacterCode.LessThan) {
      state = tagOpenState;
      pos++;
    } else {
      state = dataState;
    }

    return null;
  }

  function consumeHTMLData() {
    let char;
    while (char = text.charAt(pos)) {
      switch (char) {
        case '<':
        case '{':
          return;
      }

      tokenValue += char;
      pos++;
    }
  }

  function dataState() {
    consumeHTMLData();

    let char = peek();
    switch (char) {
      case CharacterCode.LessThan:
        state = (pos++, tagOpenState);
        break;
      case CharacterCode.OpenBrace:
        if (text.charAt(pos + 1) === '{') {
          state = (pos += 2, mustacheOpenState);
        }
    }

    return SyntaxKind.HTMLData;
  }

  function consumeTagName() {
    let char;
    while (char = text.charAt(pos)) {
      if (char.match(/[-A-Za-z]/)) {
        tokenValue += char;
        pos++;
      } else {
        return;
      }
    }
  }

  function tagOpenState() {
    consumeTagName();

    let char = peekChar();
    switch (char) {
      case '/':
        state = tagCloseState;
        return null;
      case '>':
        pos++;
        state = dataState;
        break;
      default:
        throw new Error('Unhandled tag open state: ' + char);
    }

    return SyntaxKind.TagOpen;
  }

  function consumeMustacheIdentifier() {
    let char;
    while (char = text.charAt(pos)) {
      if (char.match(/[-A-Za-z]/)) {
        tokenValue += char;
        pos++;
      } else {
        return;
      }
    }
  }

  function mustacheOpenState() {
    consumeMustacheIdentifier();

    let char = peekChar();
    if (char === '}') {
      if (text.charAt(pos+1) === '}') {
        pos += 2;
        state = dataState;
      }
    } else if (char === ' ') {
      pos++;
      state = beforeMustacheArgumentState;
    } else {
      throw new Error(`Unhandled mustache open state: '${char}'`);
    }

    return SyntaxKind.MustacheOpen;
  }

  function tagCloseState() {
    pos++;
    consumeTagName();

    let char = peekChar();
    switch (char) {
      case '>':
        pos++;
        state = dataState;
        break;
      default:
        throw new Error('Unhandled tag close state: ' + char);
    }

    return SyntaxKind.TagClose;
  }

  function beforeMustacheArgumentState() {
    consumeMustacheIdentifier();
    pos += 2;
    state = dataState;

    return SyntaxKind.MustacheArgument;
  }
}
