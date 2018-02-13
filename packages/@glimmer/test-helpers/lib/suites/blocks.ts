import { RenderTest, test } from '../render-test';

export class BlocksSuite extends RenderTest {
  @test
  'blocks can be called'() {
    this.render(
      {
        layout: '{{#if @predicate}}{{@main}}{{else}}{{@else}}{{/if}}',
        args: { predicate: 'activated' },
        template: 'Hello from @main {{outer}}',
        inverse: 'Hello from @else {{outer}}',
      },
      { activated: true, outer: 'outer' }
    );

    this.assertComponent('Hello from @main outer');
    this.assertStableRerender();

    this.rerender({ activated: false });

    if (this.testType === 'Glimmer') {
      this.assertComponent('');
      this.assertStableRerender();
    } else {
      this.assertComponent('Hello from @else outer');
      this.assertStableRerender();
    }

    this.rerender({ activated: true });

    this.assertComponent('Hello from @main outer');
    this.assertStableRerender();
  }

  @test({ skip: true })
  'blocks can be called with arguments'() {
    this.render(
      {
        layout: '{{#if @predicate}}{{@main "Hello from @main"}}{{else}}{{@else}}{{/if}}',
        args: { predicate: 'activated' },
        blockParams: ['message'],
        template: '{{message}} {{outer}}',
        inverse: 'Hello from @else {{outer}}',
      },
      { activated: true, outer: 'outer' }
    );

    this.assertComponent('Hello from @main outer');
    this.assertStableRerender();

    this.rerender({ activated: false });

    if (this.testType === 'Glimmer') {
      this.assertComponent('');
      this.assertStableRerender();
    } else {
      this.assertComponent('Hello from @else outer');
      this.assertStableRerender();
    }

    this.rerender({ activated: true });

    this.assertComponent('Hello from @main outer');
    this.assertStableRerender();
  }

  @test
  'blocks can be passed as data'() {
    this.registerComponent("Glimmer", "Block", "inside: {{@block}}");

    this.render(
      {
        layout: '{{#if @predicate}}<Block @block={{@main}} />{{else}}<Block @block={{@else}} />{{/if}}',
        args: { predicate: 'activated' },
        template: 'Hello from @main {{outer}}',
        inverse: 'Hello from @else {{outer}}',
      },
      { activated: true, outer: 'outer' }
    );

    this.assertComponent('inside: Hello from @main outer');
    this.assertStableRerender();

    this.rerender({ activated: false });

    if (this.testType === 'Glimmer') {
      this.assertComponent('inside: ');
      this.assertStableRerender();
    } else {
      this.assertComponent('inside: Hello from @else outer');
      this.assertStableRerender();
    }

    this.rerender({ activated: true });

    this.assertComponent('inside: Hello from @main outer');
    this.assertStableRerender();
  }
}
