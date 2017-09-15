import { TemplateMeta } from '@glimmer/wire-format';
import { Option, Dict, Opaque } from '@glimmer/util';

export interface Symbols {
}

export interface SymbolTable {
  referrer: Opaque;
}

export interface ProgramSymbolTable extends SymbolTable {
  hasEval: boolean;
  symbols: string[];
}

export interface BlockSymbolTable extends SymbolTable {
  parameters: number[];
}

export default SymbolTable;
