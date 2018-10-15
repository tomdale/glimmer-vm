import { SyntaxKind, CharacterCode } from '../types/syntax';
import { isWhitespace } from '../../../runtime';
import { isNullOrUndefined } from 'util';

export type ScannerState = () => SyntaxKind | void;

export function createScanner(initialText: string) {
  let text = initialText;
  let pos = 0;
  let end = initialText.length;
  let token = SyntaxKind.Unknown;
  let tokenValue = '';

  let state: ScannerState = BeforeHTMLDataState;

  return {
    scan,
    getTokenValue() {
      return tokenValue;
    }
  };

  function scan() {
    tokenValue = '';

    while (true) {
      if (pos > end) {
        return (token = SyntaxKind.EndOfFileToken);
      }

      let nextToken = state();
      if (nextToken) { return (token = nextToken); }
    }
  }

  function consume() {
    return (pos++, text.charAt(pos - 1));
  }

  function peek() {
    return text.charAt(pos);
  }

  function isASCIIAlpha(char: string) {
    return char.match(/[-A-Za-z]/);
  }

  function isWhitespace(char: string) {
    return char === ' ' || char === '\n' || char === '\t' || char === '\r';
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

  function BeforeHTMLDataState() {
    let char = peek();

    if (char === '<') {
      state = (pos++, TagOpenState);
    } else if (char === '{' && peek() === '{') {
      state = (pos++, MustacheOpenState);
    } else {
      state = HTMLDataState;
    }
  }

  function HTMLDataState(): SyntaxKind | void {
    let char = consume();
    if (char === '<') {
      state = TagOpenState;
      return SyntaxKind.HTMLData;
    } else if (char === '{' && peek() === '{') {
      state = (pos++, MustacheOpenState);
      return SyntaxKind.HTMLData;
    } else if (tokenValue && char === '') {
      return SyntaxKind.HTMLData;
    } else {
      tokenValue += char;
    }
  }

  function TagOpenState() {
    let char = peek();

    if (char === '/') {
      state = (pos++, EndTagOpenState);
    } else if (isASCIIAlpha(char)) {
      token = SyntaxKind.TagOpen;
      state = TagNameState;
    } else {
      throw new Error(`Unsupported tag open character: '${char}'`);
    }
  }

  function EndTagOpenState() {
    let char = peek();

    if (isASCIIAlpha(char)) {
      token = SyntaxKind.TagClose;
      state = TagNameState;
    } else {
      throw new Error('Malformed closing tag');
    }
  }

  function TagNameState(): SyntaxKind | void {
    let char = consume();

    if (isWhitespace(char)) {
      state = BeforeAttributeNameState;
    } else if (char === '/') {
      state = SelfClosingStartTagState;
    } else if (char === '>') {
      state = BeforeHTMLDataState;
      return token;
    } else {
      tokenValue += char;
    }
  }

  function SelfClosingStartTagState() {
  }

  function BeforeAttributeNameState() {
    let char = peek();
    if (isWhitespace(char)) {
      pos++;
      return;
    } else if (char === '/' || char === '>') {
      state = AfterAttributeNameState;
    } else {
      state = AttributeNameState;
    }
  }

  function AfterAttributeNameState(): SyntaxKind | void {
    let char = consume();

    if (isWhitespace(char)) {
      return;
    } else if (char === '/') {
      state = SelfClosingStartTagState;
    } else if (char === '>') {
      state = BeforeHTMLDataState;
      return token;
    } else {
      throw new Error(`Unhandled AfterAttributeNameState character: '${char}'`);
    }
  }

  function AttributeNameState() {
    throw new Error('Unhandled attribute name');
  }

  function MustacheOpenState() {
    let char = peek();

    if (char === '/') {
      state = (pos++, EndMustacheOpenState);
    } else if (isASCIIAlpha(char)) {
      token = SyntaxKind.MustacheOpen;
      state = MustacheNameState;
    } else {
      throw new Error(`Unsupported mustache open character: '${char}'`);
    }
  }

  function MustacheNameState(): SyntaxKind | void {
    let char = consume();

    if (isWhitespace(char)) {
      state = BeforeMustacheArgumentNameState;
      return token;
    } else if (char === '}' && peek() === '}') {
      state = (pos++, BeforeHTMLDataState);
      return token;
    } else {
      tokenValue += char;
    }
  }

  function EndMustacheOpenState() {
  }

  function BeforeMustacheArgumentNameState() {
    let char = peek();

    if (isWhitespace(char)) {
      pos++;
      return;
    } else if (char === '}' && peek() === '}') {
      state = AfterMustacheArgumentNameState;
    } else {
      token = SyntaxKind.MustacheArgument;
      state = MustacheArgumentNameState;
    }
  }

  function MustacheArgumentNameState() {
    let char = peek();

    if (isWhitespace(char)) {
      state = (pos++, AfterMustacheArgumentNameState);
      return token;
    } else if (char === '}' && peek() === '}') {
      state = AfterMustacheArgumentNameState;
      return token;
    } else {
      tokenValue += (pos++, char);
    }
  }

  function AfterMustacheArgumentNameState() {
    let char = consume();

    if (isWhitespace(char)) {
      return;
    } else if (char === '}' && peek() === '}') {
      state = (pos++, BeforeHTMLDataState);
    } else {
      throw new Error(`Unhandled AfterMustacheArgumentNameState character: '${char}'`);
    }
  }
}
