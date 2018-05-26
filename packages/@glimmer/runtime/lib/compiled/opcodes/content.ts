import { Reference, Tag, isConst, CachedReference, VersionedReference } from '@glimmer/reference';
import { Op } from '@glimmer/vm';
import {
  check,
  CheckString,
  CheckSafeString,
  CheckNode,
  CheckDocumentFragment,
  CheckNumber,
} from '@glimmer/debug';
import { Opaque } from '@glimmer/util';

import { APPEND_OPCODES, UpdatingOpcode } from '../../opcodes';
import { ConditionalReference } from '../../references';
import {
  isCurriedComponentDefinition,
  isComponentDefinition,
} from '../../component/curried-component';
import { CheckPathReference, CheckReference } from './-debug-strip';
import { isEmpty, isSafeString, isFragment, isNode, shouldCoerce } from '../../dom/normalize';
import DynamicTextContent from '../../vm/content/text';
import { PathReference } from '../../../../interfaces/lib/references';
import UpdatingVM from '../../vm/update';

export class IsCurriedComponentDefinitionReference extends ConditionalReference {
  static create(inner: Reference<Opaque>): IsCurriedComponentDefinitionReference {
    return new IsCurriedComponentDefinitionReference(inner);
  }

  toBool(value: Opaque): boolean {
    return isCurriedComponentDefinition(value);
  }
}

export const enum ContentType {
  Component,
  String,
  Empty,
  SafeString,
  Fragment,
  Node,
  Other,
}

export class ContentTypeReference extends CachedReference<ContentType> {
  public tag: Tag;

  constructor(private inner: Reference<Opaque>) {
    super();
    this.tag = inner.tag;
  }

  compute(): ContentType {
    let value = this.inner.value();

    if (shouldCoerce(value)) {
      return ContentType.String;
    } else if (isComponentDefinition(value)) {
      return ContentType.Component;
    } else if (isSafeString(value)) {
      return ContentType.SafeString;
    } else if (isFragment(value)) {
      return ContentType.Fragment;
    } else if (isNode(value)) {
      return ContentType.Node;
    } else {
      return ContentType.String;
    }
  }
}

function contentTypeFor(value: Opaque): ContentType {
  if (shouldCoerce(value)) {
    return ContentType.String;
  } else if (isComponentDefinition(value)) {
    return ContentType.Component;
  } else if (isSafeString(value)) {
    return ContentType.SafeString;
  } else if (isFragment(value)) {
    return ContentType.Fragment;
  } else if (isNode(value)) {
    return ContentType.Node;
  } else {
    return ContentType.String;
  }
}

export class AssertSameContentType extends UpdatingOpcode {
  public type = 'assert-same-content-type';

  public tag: Tag;
  private lastContentType: ContentType;

  constructor(contentType: ContentType, private reference: VersionedReference<Opaque>) {
    super();
    this.tag = reference.tag;
    this.lastContentType = contentType;
  }

  evaluate(vm: UpdatingVM) {
    let { reference, lastContentType } = this;
    let contentType = contentTypeFor(reference.value());

    if (contentType !== lastContentType) {
      this.lastContentType = contentType;
      vm.throw();
    }
  }
}

APPEND_OPCODES.add(Op.AssertSame, vm => {
  let contentType = check(vm.stack.peek(), CheckNumber);
  let reference = check(vm.stack.peek(1), CheckReference);

  if (!isConst(reference)) {
    vm.updateWith(new AssertSameContentType(contentType, reference));
  }
});

APPEND_OPCODES.add(Op.ContentType, vm => {
  let stack = vm.stack;
  let ref = check(stack.pop(), CheckReference);
  let value = ref.value();

  stack.push(value);
  stack.push(contentTypeFor(value));
  // stack.push(new ContentTypeReference(ref));
});

APPEND_OPCODES.add(Op.AppendHTML, vm => {
  let reference = check(vm.stack.pop(), CheckPathReference);

  let rawValue = reference.value();
  let value = isEmpty(rawValue) ? '' : String(rawValue);

  vm.elements().appendDynamicHTML(value);
});

APPEND_OPCODES.add(Op.AppendSafeHTML, vm => {
  let reference = check(vm.stack.pop(), CheckPathReference);

  let rawValue = check(reference.value(), CheckSafeString).toHTML();
  let value = isEmpty(rawValue) ? '' : check(rawValue, CheckString);

  vm.elements().appendDynamicHTML(value);
});

APPEND_OPCODES.add(Op.AppendText, vm => {
  let reference = check(vm.stack.pop(), CheckPathReference);

  let rawValue = reference.value();
  let value = isEmpty(rawValue) ? '' : String(rawValue);

  let node = vm.elements().appendDynamicText(value);

  if (!isConst(reference)) {
    vm.updateWith(new DynamicTextContent(node, reference, value));
  }
});

APPEND_OPCODES.add(Op.AppendDocumentFragment, vm => {
  let reference = check(vm.stack.pop(), CheckPathReference);

  let value = check(reference.value(), CheckDocumentFragment);

  vm.elements().appendDynamicFragment(value);
});

APPEND_OPCODES.add(Op.AppendNode, vm => {
  let reference = check(vm.stack.pop(), CheckPathReference);

  let value = check(reference.value(), CheckNode);

  vm.elements().appendDynamicNode(value);
});
