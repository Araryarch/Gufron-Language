#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { tokenize } = require('./src/lexer');
const { parse } = require('./src/parser');
const { Interpreter } = require('./src/interpreter');
const { generate } = require('./src/codegen');

const [cmd, file] = process.argv.slice(2);

if (!cmd || !file) {
  console.error('Usage:\n  gfr run <file.gfr>\n  gfr build <file.gfr>');
  process.exit(1);
}

const src = fs.readFileSync(file, 'utf-8');

let ast;
try {
  ast = parse(tokenize(src));
} catch (e) {
  console.error(`[gufron parse error] ${e.message}`);
  process.exit(1);
}

if (cmd === 'run') {
  try {
    new Interpreter().run(ast);
  } catch (e) {
    console.error(`[gufron error] ${e.message}`);
    process.exit(1);
  }
} else if (cmd === 'build') {
  const js = generate(ast);
  const outFile = path.basename(file, path.extname(file)) + '.js';
  fs.writeFileSync(outFile, js, 'utf-8');
  console.log(`Built: ${outFile}`);
} else {
  console.error(`Unknown command: ${cmd}\nUsage:\n  gfr run <file.gfr>\n  gfr build <file.gfr>`);
  process.exit(1);
}
