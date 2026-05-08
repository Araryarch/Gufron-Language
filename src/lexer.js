// Token types
const T = {
  // Keywords
  ASQOLI: 'ASQOLI', JANCOK: 'JANCOK', BALIKKEUN: 'BALIKKEUN',
  MAQOLI: 'MAQOLI', FI: 'FI', FIMA: 'FIMA', MA: 'MA', LIYER: 'LIYER',
  COBA: 'COBA', GOBLOK: 'GOBLOK',
  // Literals
  NUMBER: 'NUMBER', STRING: 'STRING',
  TRUE: 'TRUE', FALSE: 'FALSE', NULL: 'NULL',
  // Operators
  INA: 'INA', INNA: 'INNA', INNNA: 'INNNA',
  BESAR: 'BESAR', KECIL: 'KECIL', BESAR_INNA: 'BESAR_INNA', KECIL_INNA: 'KECIL_INNA',
  LA: 'LA', LA_INA: 'LA_INA',
  PLUS: 'PLUS', MINUS: 'MINUS', STAR: 'STAR', SLASH: 'SLASH',
  // Structure
  IDENT: 'IDENT', COMMA: 'COMMA', COLON: 'COLON',
  NEWLINE: 'NEWLINE', INDENT: 'INDENT', DEDENT: 'DEDENT',
  LPAREN: 'LPAREN', RPAREN: 'RPAREN',
  EOF: 'EOF',
};

const KEYWORDS = {
  asqoli: T.ASQOLI, jancok: T.JANCOK, balikkeun: T.BALIKKEUN,
  maqoli: T.MAQOLI, fi: T.FI, fima: T.FIMA, ma: T.MA, liyer: T.LIYER,
  coba: T.COBA, goblok: T.GOBLOK,
  syalala: T.TRUE, syududu: T.FALSE, motor_gufron: T.NULL,
  inna: T.INNA, innna: T.INNNA, ina: T.INA,
  besar_inna: T.BESAR_INNA, kecil_inna: T.KECIL_INNA,
  besar: T.BESAR, kecil: T.KECIL, la: T.LA,
};

function tokenize(src) {
  const tokens = [];
  const lines = src.split('\n');
  const indentStack = [0];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    if (!line.trim()) continue;

    // Count leading tabs
    let col = 0;
    while (col < line.length && line[col] === '\t') col++;
    const indent = col;
    const content = line.slice(col);
    if (!content.trim()) continue;

    // Emit INDENT/DEDENT
    const prevIndent = indentStack[indentStack.length - 1];
    if (indent > prevIndent) {
      indentStack.push(indent);
      tokens.push({ type: T.INDENT });
    } else if (indent < prevIndent) {
      while (indentStack[indentStack.length - 1] > indent) {
        indentStack.pop();
        tokens.push({ type: T.DEDENT });
      }
    }

    // Tokenize the content of the line
    let i = 0;
    while (i < content.length) {
      // Skip spaces
      if (content[i] === ' ') { i++; continue; }

      // String
      if (content[i] === '"' || content[i] === "'") {
        const q = content[i++];
        let s = '';
        while (i < content.length && content[i] !== q) s += content[i++];
        i++; // closing quote
        tokens.push({ type: T.STRING, value: s });
        continue;
      }

      // Number
      if (/[0-9]/.test(content[i])) {
        let n = '';
        while (i < content.length && /[0-9.]/.test(content[i])) n += content[i++];
        tokens.push({ type: T.NUMBER, value: parseFloat(n) });
        continue;
      }

      // Operators
      if (content[i] === '+') { tokens.push({ type: T.PLUS }); i++; continue; }
      if (content[i] === '-') { tokens.push({ type: T.MINUS }); i++; continue; }
      if (content[i] === '*') { tokens.push({ type: T.STAR }); i++; continue; }
      if (content[i] === '/') { tokens.push({ type: T.SLASH }); i++; continue; }
      if (content[i] === ',') { tokens.push({ type: T.COMMA }); i++; continue; }
      if (content[i] === ':') { tokens.push({ type: T.COLON }); i++; continue; }
      if (content[i] === '(') { tokens.push({ type: T.LPAREN }); i++; continue; }
      if (content[i] === ')') { tokens.push({ type: T.RPAREN }); i++; continue; }

      // Identifier or keyword
      if (/[a-zA-Z_]/.test(content[i])) {
        let word = '';
        while (i < content.length && /[a-zA-Z0-9_]/.test(content[i])) word += content[i++];
        const type = KEYWORDS[word] || T.IDENT;
        tokens.push({ type, value: type === T.IDENT ? word : undefined });
        continue;
      }

      throw new Error(`Unknown character '${content[i]}' at line ${lineNum + 1}`);
    }

    tokens.push({ type: T.NEWLINE });
  }

  // Close remaining indents
  while (indentStack[indentStack.length - 1] > 0) {
    indentStack.pop();
    tokens.push({ type: T.DEDENT });
  }

  tokens.push({ type: T.EOF });

  // Post-process: merge LA + INA → LA_INA
  const merged = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === T.LA && tokens[i+1] && tokens[i+1].type === T.INA) {
      merged.push({ type: T.LA_INA });
      i++;
    } else {
      merged.push(tokens[i]);
    }
  }
  return merged;
}

module.exports = { tokenize, T };
