'use strict';

const path = require('path');
const Filter = require('broccoli-persistent-filter');
const funnel = require('broccoli-funnel');
const UnwatchedDir = require('broccoli-source').UnwatchedDir;

const PACKAGE_JSON_FIELDS = {
  "main": "dist/commonjs/es2017/index.js",
  "jsnext:main": "dist/modules/es2017/index.js",
  "module": "dist/modules/es2017/index.js",
  "typings": "dist/types/index.d.ts",
  "license": "MIT"
};

function packageJSONFields(name) {
  return {
    "main": "dist/commonjs/es2017/index.js",
    "jsnext:main": `dist/modules/es2017/${name}.js`,
    "module": `dist/modules/es2017/${name}.js`,
    "typings": "dist/types/index.d.ts",
    "license": "MIT"
  };
}

class PackageJSONWriter extends Filter {
  constructor(inputNode, options) {
    super(inputNode);
    this.options = options;
  }
  canProcessFile(relativePath) {
    return path.basename(relativePath) === 'package.json';
  }

  processString(string) {
    let pkg = JSON.parse(string);
    Object.assign(pkg, packageJSONFields(this.options.pkgName));
    return JSON.stringify(pkg, null, 2);
  }
}

module.exports = function rewritePackageJSON(pkgName) {
  let tree = funnel(new UnwatchedDir('packages'), {
    include: [`${pkgName}/package.json`]
  });

  return new PackageJSONWriter(tree, { pkgName });
}
