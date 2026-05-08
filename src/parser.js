const { T } = require('./lexer');

// AST node helpers
const node = (type, props) => ({ type, ...props });

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos]; }
  advance() { return this.tokens[this.pos++]; }
  check(type) { return this.peek().type === type; }

  eat(type) {
    if (!this.check(type)) throw new Error(`Expected ${type}, got ${this.peek().type}`);
    return this.advance();
  }

  skipNewlines() {
    while (this.check(T.NEWLINE)) this.advance();
  }

  parse() {
    const stmts = this.parseBlock();
    this.eat(T.EOF);
    return node('Program', { body: stmts });
  }

  parseBlock() {
    const stmts = [];
    while (!this.check(T.EOF) && !this.check(T.DEDENT)) {
      this.skipNewlines();
      if (this.check(T.EOF) || this.check(T.DEDENT)) break;
      stmts.push(this.parseStatement());
    }
    return stmts;
  }

  parseStatement() {
    const t = this.peek();

    if (t.type === T.ASQOLI) return this.parseVarDecl();
    if (t.type === T.JANCOK) return this.parseFuncDecl();
    if (t.type === T.FI) return this.parseIf();
    if (t.type === T.LIYER) return this.parseLiyer();
    if (t.type === T.COBA) return this.parseCoba();
    if (t.type === T.BALIKKEUN) return this.parseReturn();
    if (t.type === T.MAQOLI) return this.parseMaqoli();

    // IDENT: could be assignment or function call
    if (t.type === T.IDENT) {
      const name = this.advance().value;
      if (this.check(T.INA)) {
        this.advance();
        const val = this.parseCallOrExpr();
        this.skipNewlines();
        return node('Assign', { name, value: val });
      }
      // standalone function call: name arg1, arg2
      const args = this.parseArgList();
      this.skipNewlines();
      return node('ExprStmt', { expr: node('Call', { callee: name, args }) });
    }

    throw new Error(`Unexpected token: ${t.type}`);
  }

  parseVarDecl() {
    this.eat(T.ASQOLI);
    const name = this.eat(T.IDENT).value;
    this.eat(T.INA);
    const value = this.parseCallOrExpr();
    this.skipNewlines();
    return node('VarDecl', { name, value });
  }

  parseFuncDecl() {
    this.eat(T.JANCOK);
    const name = this.eat(T.IDENT).value;
    const params = [];
    while (!this.check(T.COLON) && !this.check(T.NEWLINE)) {
      if (this.check(T.COMMA)) { this.advance(); continue; }
      params.push(this.eat(T.IDENT).value);
    }
    this.eat(T.COLON);
    this.eat(T.NEWLINE);
    this.eat(T.INDENT);
    const body = this.parseBlock();
    this.eat(T.DEDENT);
    return node('FuncDecl', { name, params, body });
  }

  parseIf() {
    this.eat(T.FI);
    this.eat(T.COMMA);
    const condition = this.parseExpr();
    this.eat(T.COLON);
    this.eat(T.NEWLINE);
    this.eat(T.INDENT);
    const consequent = this.parseBlock();
    this.eat(T.DEDENT);

    let alternate = null;
    this.skipNewlines();
    if (this.check(T.FIMA)) {
      this.advance();
      this.eat(T.COMMA);
      const elifCond = this.parseExpr();
      this.eat(T.COLON);
      this.eat(T.NEWLINE);
      this.eat(T.INDENT);
      const elifBody = this.parseBlock();
      this.eat(T.DEDENT);
      this.skipNewlines();
      alternate = node('If', { condition: elifCond, consequent: elifBody, alternate: this.parseMaBlock() });
    } else {
      alternate = this.parseMaBlock();
    }

    return node('If', { condition, consequent, alternate });
  }

  parseCoba() {
    this.eat(T.COBA);
    this.eat(T.COLON);
    this.eat(T.NEWLINE);
    this.eat(T.INDENT);
    const tryBody = this.parseBlock();
    this.eat(T.DEDENT);
    this.skipNewlines();
    this.eat(T.GOBLOK);
    const errParam = this.check(T.IDENT) ? this.advance().value : null;
    this.eat(T.COLON);
    this.eat(T.NEWLINE);
    this.eat(T.INDENT);
    const catchBody = this.parseBlock();
    this.eat(T.DEDENT);
    return node('TryCatch', { tryBody, errParam, catchBody });
  }

  parseLiyer() {
    this.eat(T.LIYER);
    this.eat(T.COMMA);

    // Peek ahead: if pattern is "ident ina expr, cond, ident ina expr:" → for loop
    const saved = this.pos;
    let isFor = false;
    try {
      this.eat(T.IDENT);
      this.eat(T.INA);
      this.parseExpr();
      if (this.check(T.COMMA)) isFor = true;
    } catch (_) {}
    this.pos = saved;

    if (isFor) {
      const initName = this.eat(T.IDENT).value;
      this.eat(T.INA);
      const initVal = this.parseExpr();
      this.eat(T.COMMA);
      const condition = this.parseExpr();
      this.eat(T.COMMA);
      const updateName = this.eat(T.IDENT).value;
      this.eat(T.INA);
      const updateVal = this.parseExpr();
      this.eat(T.COLON);
      this.eat(T.NEWLINE);
      this.eat(T.INDENT);
      const body = this.parseBlock();
      this.eat(T.DEDENT);
      return node('For', { initName, initVal, condition, updateName, updateVal, body });
    } else {
      const condition = this.parseExpr();
      this.eat(T.COLON);
      this.eat(T.NEWLINE);
      this.eat(T.INDENT);
      const body = this.parseBlock();
      this.eat(T.DEDENT);
      return node('While', { condition, body });
    }
  }

  parseMaBlock() {
    this.skipNewlines();
    if (!this.check(T.MA)) return null;
    this.advance();
    this.eat(T.COLON);
    this.eat(T.NEWLINE);
    this.eat(T.INDENT);
    const body = this.parseBlock();
    this.eat(T.DEDENT);
    return body;
  }

  parseReturn() {
    this.eat(T.BALIKKEUN);
    const value = this.parseCallOrExpr();
    this.skipNewlines();
    return node('Return', { value });
  }

  parseMaqoli() {
    this.eat(T.MAQOLI);
    const value = this.parseCallOrExpr();
    this.skipNewlines();
    return node('Maqoli', { value });
  }

  parseArgList() {
    const args = [];
    args.push(this.parseExpr());
    while (this.check(T.COMMA)) {
      this.advance();
      args.push(this.parseExpr());
    }
    return args;
  }

  // Parse a top-level expression that may be a no-paren function call
  parseCallOrExpr() {
    // If starts with IDENT followed by value tokens (not operator), treat as call
    if (this.check(T.IDENT)) {
      const saved = this.pos;
      const name = this.advance().value;
      const callStarters = [T.NUMBER, T.STRING, T.TRUE, T.FALSE, T.NULL, T.IDENT, T.LA];
      if (callStarters.includes(this.peek().type)) {
        const args = [this.parseExpr()];
        while (this.check(T.COMMA)) { this.advance(); args.push(this.parseExpr()); }
        return node('Call', { callee: name, args });
      }
      this.pos = saved;
    }
    return this.parseExpr();
  }

  parseExpr() {
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseAddSub();
    const ops = [T.INNNA, T.INNA, T.LA_INA, T.BESAR, T.KECIL, T.BESAR_INNA, T.KECIL_INNA];
    while (ops.includes(this.peek().type)) {
      const op = this.advance().type;
      const right = this.parseAddSub();
      left = node('BinOp', { op, left, right });
    }
    return left;
  }

  parseAddSub() {
    let left = this.parseMulDiv();
    while (this.check(T.PLUS) || this.check(T.MINUS)) {
      const op = this.advance().type;
      const right = this.parseMulDiv();
      left = node('BinOp', { op, left, right });
    }
    return left;
  }

  parseMulDiv() {
    let left = this.parseUnary();
    while (this.check(T.STAR) || this.check(T.SLASH)) {
      const op = this.advance().type;
      const right = this.parseUnary();
      left = node('BinOp', { op, left, right });
    }
    return left;
  }

  parseUnary() {
    if (this.check(T.MINUS)) {
      this.advance();
      return node('Unary', { op: T.MINUS, operand: this.parsePrimary() });
    }
    if (this.check(T.LA)) {
      this.advance();
      return node('Unary', { op: T.LA, operand: this.parsePrimary() });
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const t = this.peek();

    if (t.type === T.NUMBER) { this.advance(); return node('Literal', { value: t.value }); }
    if (t.type === T.STRING) { this.advance(); return node('Literal', { value: t.value }); }
    if (t.type === T.TRUE)   { this.advance(); return node('Literal', { value: true }); }
    if (t.type === T.FALSE)  { this.advance(); return node('Literal', { value: false }); }
    if (t.type === T.NULL)   { this.advance(); return node('Literal', { value: null }); }

    if (t.type === T.LPAREN) {
      this.advance();
      const expr = this.parseExpr();
      this.eat(T.RPAREN);
      return expr;
    }

    if (t.type === T.IDENT) {
      const name = this.advance().value;
      // function call with parens: name(args)
      if (this.check(T.LPAREN)) {
        this.advance();
        const args = [];
        if (!this.check(T.RPAREN)) {
          args.push(this.parseExpr());
          while (this.check(T.COMMA)) { this.advance(); args.push(this.parseExpr()); }
        }
        this.eat(T.RPAREN);
        return node('Call', { callee: name, args });
      }
      return node('Ident', { name });
    }

    throw new Error(`Unexpected token in expression: ${t.type}`);
  }
}

function parse(tokens) {
  return new Parser(tokens).parse();
}

module.exports = { parse };
