import { Opaque, SymbolTable, RuntimeResolver } from "@glimmer/interfaces";
import { CompileTimeConstants } from "@glimmer/opcode-compiler";

const UNRESOLVED = {};

export interface ConstantPool {
  strings: string[];
  arrays: number[][];
  tables: SymbolTable[];
  handles: number[];
  serializables: Opaque[];
  floats: number[];
  negatives: number[];
}

export const enum PrimitiveType {
  NUMBER          = 0b000,
  FLOAT           = 0b001,
  STRING          = 0b010,
  BOOLEAN_OR_VOID = 0b011,
  NEGATIVE        = 0b100
}

export class WriteOnlyConstants implements CompileTimeConstants {
  // `0` means NULL

  protected strings: string[] = [];
  protected arrays: number[][] = [];
  protected tables: SymbolTable[] = [];
  protected handles: number[] = [];
  protected serializables: Opaque[] = [];
  protected resolved: Opaque[] = [];
  protected floats: number[] = [];
  protected negatives: number[] = [];

  float(float: number) {
    return this.floats.push(float);
  }

  negative(negative: number) {
    return this.negatives.push(negative);
  }

  string(value: string): number {
    return this.strings.push(value);
  }

  stringArray(strings: string[]): number {
    let _strings: number[] = new Array(strings.length);

    for (let i = 0; i < strings.length; i++) {
      _strings[i] = this.string(strings[i]);
    }

    return this.array(_strings);
  }

  array(values: number[]): number {
    return this.arrays.push(values);
  }

  table(t: SymbolTable): number {
    return this.tables.push(t);
  }

  handle(handle: number): number {
    this.resolved.push(UNRESOLVED);
    return this.handles.push(handle);
  }

  serializable(value: Opaque): number {
    return this.serializables.push(value);
  }

  toPool(): ConstantPool {
    return {
      strings: this.strings,
      arrays: this.arrays,
      tables: this.tables,
      handles: this.handles,
      serializables: this.serializables,
      floats: this.floats,
      negatives: this.negatives
    };
  }
}

export class RuntimeConstants<Specifier> {
  protected strings: string[];
  protected arrays: number[][];
  protected tables: SymbolTable[];
  protected handles: number[];
  protected serializables: Opaque[];
  protected resolved: Opaque[];
  protected floats: number[];
  protected negatives: number[];

  constructor(public resolver: RuntimeResolver<Specifier>, pool: ConstantPool) {
    this.strings = pool.strings;
    this.arrays = pool.arrays;
    this.tables = pool.tables;
    this.handles = pool.handles;
    this.serializables = pool.serializables;
    this.floats = pool.floats;
    this.negatives = pool.negatives;
    this.resolved = this.handles.map(() => UNRESOLVED);
  }

  // `0` means NULL

  getFloat(value: number): number {
    return this.floats[value - 1];
  }

  getNegative(value: number): number {
    return this.negatives[value - 1];
  }

  getString(value: number): string {
    return this.strings[value - 1];
  }

  getStringArray(value: number): string[] {
    let names = this.getArray(value);
    let _names: string[] = new Array(names.length);

    for (let i = 0; i < names.length; i++) {
      let n = names[i];
      _names[i] = this.getString(n);
    }

    return _names;
  }

  getArray(value: number): number[] {
    return this.arrays[value - 1];
  }

  getSymbolTable<T extends SymbolTable>(value: number): T {
    return this.tables[value - 1] as T;
  }

  resolveHandle<T>(s: number): T {
    let index = s - 1;
    let resolved = this.resolved[index];

    if (resolved === UNRESOLVED) {
      let handle = this.handles[index];
      resolved = this.resolved[index] = this.resolver.resolve(handle);
    }

    return resolved as T;
  }

  getSerializable<T>(s: number): T {
    return this.serializables[s - 1] as T;
  }
}

export class Constants<Specifier> extends WriteOnlyConstants {
  constructor(public resolver: RuntimeResolver<Specifier>, pool?: ConstantPool) {
    super();

    if (pool) {
      this.strings = pool.strings;
      this.arrays = pool.arrays;
      this.tables = pool.tables;
      this.handles = pool.handles;
      this.serializables = pool.serializables;
      this.floats = pool.floats;
      this.negatives = pool.negatives;
      this.resolved = this.handles.map(() => UNRESOLVED);
    }
  }

  // `0` means NULL
  getFloat(value: number): number {
    return this.floats[value - 1];
  }

  getNegative(value: number): number {
    return this.negatives[value - 1];
  }

  getString(value: number): string {
    return this.strings[value - 1];
  }

  getStringArray(value: number): string[] {
    let names = this.getArray(value);
    let _names: string[] = new Array(names.length);

    for (let i = 0; i < names.length; i++) {
      let n = names[i];
      _names[i] = this.getString(n);
    }

    return _names;
  }

  getArray(value: number): number[] {
    return this.arrays[value - 1];
  }

  getSymbolTable<T extends SymbolTable>(value: number): T {
    return this.tables[value - 1] as T;
  }

  resolveHandle<T>(s: number): T {
    let index = s - 1;
    let resolved = this.resolved[index];

    if (resolved === UNRESOLVED) {
      let handle = this.handles[index];
      resolved = this.resolved[index] = this.resolver.resolve(handle);
    }

    return resolved as T;
  }

  getSerializable<T>(s: number): T {
    return this.serializables[s - 1] as T;
  }
}

export class LazyConstants extends Constants<Opaque> {
  private others: Opaque[] = [];

  getOther<T>(value: number): T {
    return this.others[value - 1] as T;
  }

  other(other: Opaque): number {
    return this.others.push(other);
  }
}
