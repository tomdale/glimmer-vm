export const enum SyntaxKind {
  Unknown,
  EndOfFileToken,
  HTMLData,
  TagOpen,
  TagClose,
  MustacheOpen,
  MustacheClose,
  MustacheArgument,
}

export const enum CharacterCode {
  LessThan = 0x3c,              // <
  CloseBrace = 0x7d,            // }
  CloseBracket = 0x5d,          // ]
  CloseParen = 0x29,            // )
  OpenBrace = 0x7b,             // {
  OpenBracket = 0x5b,           // [
  OpenParen = 0x28,             // (
}
