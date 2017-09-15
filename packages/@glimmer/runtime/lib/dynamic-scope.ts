import { assign, Opaque } from '@glimmer/util';
import { PathReference } from '@glimmer/reference';

export default class DynamicScope {
  private bucket: any;

  constructor(bucket = null) {
    if (bucket) {
      this.bucket = assign({}, bucket);
    } else {
      this.bucket = {};
    }
  }

  get(key: string): PathReference<Opaque> {
    return this.bucket[key];
  }

  set(key: string, reference: PathReference<Opaque>) {
    return this.bucket[key] = reference;
  }

  child(): DynamicScope {
    return new DynamicScope(this.bucket);
  }
}
