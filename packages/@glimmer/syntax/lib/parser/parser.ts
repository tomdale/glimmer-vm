import * as AST from '../types/nodes';

export default class Parser {
  constructor() {
  }

  parse(sourceText: string): AST.Program {
  }
}

const parser = new Parser();

export function parse(sourceText: string): AST.Program {
  return parser.parse(sourceText);
}

// export function parse(html: string): AST.Program {
//   let ast = typeof html === 'object' ? html : handlebars.parse(html);
//   let program = new TokenizerEventHandlers(html).acceptNode(ast);

//   if (options && options.plugins && options.plugins.ast) {
//     for (let i = 0, l = options.plugins.ast.length; i < l; i++) {
//       let transform = options.plugins.ast[i];
//       let env = assign({}, options, { syntax }, { plugins: undefined });

//       let pluginResult = transform(env);

//       traverse(program, pluginResult.visitor);
//     }
//   }

//   return program;
// }