import { Node } from '../types/nodes';

import Printer from './printer';

export default function build(ast: Node): string {
  if (!ast) {
    return '';
  }

  let printer = new Printer();
  return printer.print(ast);
}
