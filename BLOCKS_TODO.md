- need to implement static path
- rename @main to @block
- how to currying?

- cleanup hax
  - Cleanup labels in guardedAppend
  - Move IS_BLOCK label to value?
  - What to do with DestructureBlock and UnwrapBlock
  - ???

- tests to write:
  - @block nor yield passed to {{@block}}, {{@block foo}}, {{yield}}, {{yield foo}}
  - @block xor yield passed to {{@block}}, {{@block foo}}, {{yield}}, {{yield foo}}
  - @block and yield passed to {{@block}}, {{@block foo}}, {{yield}}, {{yield foo}}
  - @else nor else passed to {{@else}}, {{@else foo}}, {{yield to="inverse"}}, {{yield foo to="inverse"}}
  - @else xor else passed to {{@else}}, {{@else foo}}, {{yield to="inverse"}}, {{yield foo to="inverse"}}
  - @else and else passed to {{@else}}, {{@else foo}}, {{yield to="inverse"}}, {{yield foo to="inverse"}}
  - @other passed to {{@other}}, {{@other foo}}
  - @other not passed to {{@other}}, {{@other foo}}
  - {{#if @main}}, {{#if @else}}, {{#if @other}}
  - Called directly in the child call stack, or called multiple layers deep

- prepared component -> after component manager

- Statement opcodes: wire format to append opcodes
- Currying is handled in ComponentBuilder / wrapped-component


for glimmer component -> invokeStaticComponent
