import { SyntaxKind } from '../types/syntax';

export type ScannerState = () => SyntaxKind | void;

export const enum ScannerFlag {
  SelfClosing = 0b00000001,
}

export enum ScannerError {
  NoError = 0,
  EOFInTag = 1,
  UnexpectedNullCharacter,
  UnexpectedEqualsSignBeforeAttributeName,
  UnexpectedCharacterInAttributeName,
  UnexpectedCharacterInUnquotedAttributeValue,
  UnexpectedSolidusInTag,
  MissingWhitespaceBetweenAttributes,
}

export type StateResult = SyntaxKind | void;

const enum Char {
  Tab = '\u0009',
  LineFeed = '\u000a',
  FormFeed = '\u000c',
  Space = '\u0020',
  Slash = '\u002f',
  Null = '\u0000',
  SingleQuote = '\u0027',
  DoubleQuote = '\u0022',
  LessThan = '\u003c',
  Equals = '\u003d',
  GreaterThan = '\u003e',
  Backtick = '\u0060',
  ReplacementCharacter = '\ufffd',
}

const enum MustacheContext {
  Data = 1,
  Element = 2,
  AttributeValue = 3,
}

export function createScanner(initialText: string) {
  let text = initialText;
  let pos = 0;
  let end = initialText.length;

  let token = 0;
  let tokenValue = '';
  let tokenFlags = 0;
  let tokenError = 0;

  let state: ScannerState = BeforeHTMLDataState;

  return {
    scan,
    getTokenValue() { return tokenValue; },
    getTokenFlags() { return tokenFlags; },
    getTokenError() { return tokenError; }
  };

  function scan() {
    token = 0;
    tokenValue = '';
    tokenFlags = 0;
    tokenError = 0;

    while (true) {
      if (pos >= end) {
        return (token = SyntaxKind.EndOfFileToken);
      }

      console.log({ state: state.name, pos: pos, char: peek() });
      let nextToken;
      if (nextToken = state()) {
        console.log(`<- ${SyntaxKind[nextToken]} '${tokenValue}'`);
        return (token = nextToken);
      }

      if (pos >= end && token) {
        return token;
      }
    }
  }

  function consume() {
    return (pos++, text.charAt(pos - 1));
  }

  function reconsume() {
    pos--;
  }

  function peek() {
    return text.charAt(pos);
  }

  function isASCIIAlpha(char: string) {
    return char.match(/[-A-Za-z]/);
  }

  function isWhitespace(char: string) {
    switch (char) {
      case Char.Tab:
      case Char.Space:
      case Char.LineFeed:
      case Char.FormFeed:
      case Char.Space:
        return true;
      default:
        return false;
    }
  }

  function error(errno: ScannerError) {
    tokenError = errno;
  }

  function unexpectedNullCharacter() {
    error(ScannerError.UnexpectedNullCharacter);
    tokenValue += Char.ReplacementCharacter;
  }

  /*
   * STATES
   *
   * The scanner transitions through various states as it tokenizes the input
   * string. Each state is responsible for responding to the next character. In
   * response to an input character, states can perform one or more of the
   * following actions:
   *
   * 1. Transition to a different state (by settting the `state` variable).
   * 2. Advance the scanner by one or more characters (by incrementing `pos` or
   *    using helper functions like `consume()`).
   * 3. Update the value of the current token (by mutating `tokenValue`).
   * 4. Emit the current token back to the consumer, by returning a `SyntaxKind`
   *    value.
   *
   * Not every state will consume the current character. Many states will
   * perform a lookahead and transition to a different state, delegating
   * character consumption to the new state.
   *
   * The scanner repeatedly invokes the current state function, until an EOF is
   * reached or a state emits a token by producing a return value.
   */

   /** HTML SYNTAX */
  function BeforeHTMLDataState(): StateResult {
    let char = consume();

    if (char === Char.LessThan) {
      state = TagOpenState;
    } else if (char === '{' && peek() === '{') {
      state = MustacheOpenState;
    } else {
      reconsume();
      token = SyntaxKind.HTMLData;
      state = HTMLDataState;
    }
  }

  function HTMLDataState(): StateResult {
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

  function TagOpenState(): StateResult {
    let char = consume();

    if (char === '/') {
      state = EndTagOpenState;
    } else if (isASCIIAlpha(char)) {
      reconsume();
      token = SyntaxKind.TagOpen;
      state = TagNameState;
    } else {
      throw new Error(`Unsupported tag open character: '${char}'`);
    }
  }

  function EndTagOpenState() {
    let char = consume();

    if (isASCIIAlpha(char)) {
      reconsume();
      token = SyntaxKind.TagClose;
      state = TagNameState;
    } else {
      throw new Error('Malformed closing tag');
    }
  }

  function TagNameState(): StateResult {
    let char = consume();

    if (isWhitespace(char)) {
      state = BeforeAttributeNameState;
      return token;
    } else if (char === '/') {
      state = SelfClosingStartTagState;
    } else if (char === '>') {
      state = BeforeHTMLDataState;
      return token;
    } else {
      tokenValue += char;
    }
  }

  function SelfClosingStartTagState(): StateResult {
    let char = consume();

    if (char === Char.GreaterThan) {
      state = BeforeHTMLDataState;
      return SyntaxKind.TagSelfClose;
    } else if (char === '') {
      error(ScannerError.EOFInTag);
      return SyntaxKind.EndOfFileToken;
    } else {
      error(ScannerError.UnexpectedSolidusInTag);
      reconsume();
      state = BeforeAttributeNameState;
    }
  }

  function BeforeAttributeNameState() {
    let char = peek();

    if (isWhitespace(char)) {
      pos++;
      return;
    } else if (char === Char.Slash || char === Char.GreaterThan) {
      state = AfterAttributeNameState;
    } else if (char === Char.Equals) {
      error(ScannerError.UnexpectedEqualsSignBeforeAttributeName);
      tokenValue += char;
      state = (pos++, AttributeNameState);
    } else {
      state = AttributeNameState;
    }
  }

  function AfterAttributeNameState(): SyntaxKind | void {
    let char = peek();

    if (isWhitespace(char)) {
      pos++;
      return;
    } else if (char === Char.Slash) {
      state = (pos++, SelfClosingStartTagState);
    } else if (char === Char.GreaterThan) {
      state = (pos++, BeforeHTMLDataState);
      return token;
    } else if (char === Char.Equals) {
      state = (pos++, BeforeAttributeValueState);
    } else {
      state = AttributeNameState;
    }
  }

  function AttributeNameState(): SyntaxKind | void {
    let char = consume();

    if (isWhitespace(char) || char === Char.Slash || char === Char.GreaterThan) {
      reconsume();
      state = AfterAttributeNameState;
      return SyntaxKind.AttributeName;
    } else if (char === Char.Equals) {
      state = BeforeAttributeValueState;
      return SyntaxKind.AttributeName;
    } else if (char === '\0') {
      unexpectedNullCharacter();
    } else {
      if (char === Char.DoubleQuote || char === Char.SingleQuote || char === Char.LessThan) {
        error(ScannerError.UnexpectedCharacterInAttributeName);
      }
      tokenValue += char;
    }
  }

  function BeforeAttributeValueState() {
    let char = consume();

    if (isWhitespace(char)) { return; }

    token = SyntaxKind.AttributeValue;

    if (char === Char.DoubleQuote) {
      state = AttributeValueDoubleQuotedState;
    } else if (char === Char.SingleQuote) {
      state = AttributeValueSingleQuotedState;
    } else {
      tokenValue += char;
      state = AttributeValueUnquotedState;
    }
  }

  function AttributeValueSingleQuotedState(): SyntaxKind | void {
    let char = consume();

    if (char === Char.SingleQuote) {
      state = AfterAttributeValueQuotedState;
    } else if (char === '&') {
      // state = CharacterReferenceState;
    } else if (char === '\0') {
      error(ScannerError.UnexpectedNullCharacter);
    } else if (char === '') {
      error(ScannerError.EOFInTag);
      return SyntaxKind.EndOfFileToken;
    } else {
      tokenValue += char;
    }
  }

  function AttributeValueDoubleQuotedState(): SyntaxKind | void {
    let char = consume();

    if (char === Char.DoubleQuote) {
      state = AfterAttributeValueQuotedState;
    } else if (char === '&') {
      // state = CharacterReferenceState;
    } else if (char === '\0') {
      error(ScannerError.UnexpectedNullCharacter);
    } else if (char === '') {
      error(ScannerError.EOFInTag);
      return SyntaxKind.EndOfFileToken;
    } else {
      tokenValue += char;
    }
  }

  function AttributeValueUnquotedState(): SyntaxKind | void {
    let char = consume();

    if (isWhitespace(char)) {
      state = BeforeAttributeNameState;
      return token;
    } else if (char === '&') {
      // state = CharacterReferenceState;
    } else if (char === Char.GreaterThan) {
      state = BeforeHTMLDataState;
      return token;
    } else if (char === '\0') {
      error(ScannerError.UnexpectedNullCharacter);
    } else if (char === Char.Slash && peek() === Char.GreaterThan) {
      reconsume();
      state = AfterAttributeValueQuotedState;
    } else {
      if (char === Char.DoubleQuote || char === Char.SingleQuote || char === Char.LessThan || char === Char.Equals || char === Char.Backtick) {
        error(ScannerError.UnexpectedCharacterInUnquotedAttributeValue);
      }
      tokenValue += char;
    }
  }

  function AfterAttributeValueQuotedState(): SyntaxKind | void {
    let char = peek();

    if (isWhitespace(char)) {
      state = (pos++, BeforeAttributeNameState);
      return SyntaxKind.AttributeValue;
    } else if (char === '/') {
      state = (pos++, SelfClosingStartTagState);
      return SyntaxKind.AttributeValue;
    } else if (char === '>') {
      state = (pos++, BeforeHTMLDataState);
      return SyntaxKind.AttributeValue;
    } else if (char === '') {
      error(ScannerError.EOFInTag);
      return SyntaxKind.EndOfFileToken;
    } else {
      error(ScannerError.MissingWhitespaceBetweenAttributes);
      state = BeforeAttributeNameState;
    }
  }

  /** GLIMMER SYNTAX */
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
