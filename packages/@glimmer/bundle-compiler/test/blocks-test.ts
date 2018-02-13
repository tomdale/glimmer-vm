import { rawModule, BlocksSuite, EagerRenderDelegate } from "@glimmer/test-helpers";

rawModule('[Bundle Compiler] First-class blocks', BlocksSuite, EagerRenderDelegate, { componentModule: true });
