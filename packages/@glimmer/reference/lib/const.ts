import { dict } from '@glimmer/util';
import { CONSTANT_TAG, VersionedReference, Tag } from './validators';
import { PathReference } from './reference';

export class ConstReference<T> implements VersionedReference<T> {
  public tag: Tag = CONSTANT_TAG;

  constructor(protected inner: T) { }

  value(): T { return this.inner; }
}

export class ConstPathReference<T> extends ConstReference<T> implements PathReference<T> {
  private chains = dict<PathReference<any>>();

  get<U>(prop: string): IPathReference<U> {
    let chains = this.chains;
    if (<string>prop in chains) return chains[prop];
    return (chains[prop] = new PathReference(this, prop));
  }
}
