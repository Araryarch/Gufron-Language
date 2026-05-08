const { T } = require('./lexer');
const { preScan } = require('./prescan');

const BINOP = {
  [T.PLUS]: '+', [T.MINUS]: '-', [T.STAR]: '*', [T.SLASH]: '/',
  [T.INNA]: '==', [T.INNNA]: '===', [T.LA_INA]: '!=',
  [T.BESAR]: '>', [T.KECIL]: '<', [T.BESAR_INNA]: '>=', [T.KECIL_INNA]: '<=',
};

class CodeGen {
  generate(ast) {
    this.declCount = preScan(ast.body);
    return this.genBlock(ast.body, 0);
  }

  indent(n) { return '  '.repeat(n); }

  genBlock(stmts, depth) {
    return stmts.map(s => this.genStmt(s, depth)).join('\n');
  }

  genStmt(stmt, depth) {
    const ind = this.indent(depth);
    switch (stmt.type) {
      case 'VarDecl': {
        const keyword = (this.declCount.get(stmt.name) || 1) === 1 ? 'const' : 'let';
        return `${ind}${keyword} ${stmt.name} = ${this.genExpr(stmt.value)};`;
      }
      case 'Assign':
        return `${ind}${stmt.name} = ${this.genExpr(stmt.value)};`;
      case 'FuncDecl': {
        const params = stmt.params.join(', ');
        const body = this.genBlock(stmt.body, depth + 1);
        return `${ind}function ${stmt.name}(${params}) {\n${body}\n${ind}}`;
      }
      case 'If': {
        let out = `${ind}if (${this.genExpr(stmt.condition)}) {\n${this.genBlock(stmt.consequent, depth + 1)}\n${ind}}`;
        if (stmt.alternate) {
          if (Array.isArray(stmt.alternate)) {
            out += ` else {\n${this.genBlock(stmt.alternate, depth + 1)}\n${ind}}`;
          } else {
            // else if — inline
            out += ` else ${this.genStmt(stmt.alternate, depth).trimStart()}`;
          }
        }
        return out;
      }
      case 'While':
        return `${ind}while (${this.genExpr(stmt.condition)}) {\n${this.genBlock(stmt.body, depth + 1)}\n${ind}}`;
      case 'For': {
        const init = `let ${stmt.initName} = ${this.genExpr(stmt.initVal)}`;
        const cond = this.genExpr(stmt.condition);
        const update = `${stmt.updateName} = ${this.genExpr(stmt.updateVal)}`;
        return `${ind}for (${init}; ${cond}; ${update}) {\n${this.genBlock(stmt.body, depth + 1)}\n${ind}}`;
      }
      case 'TryCatch': {
        const catchParam = stmt.errParam ? `_${stmt.errParam}` : '_e';
        let out = `${ind}try {\n${this.genBlock(stmt.tryBody, depth + 1)}\n${ind}} catch (${catchParam}) {\n`;
        if (stmt.errParam)
          out += `${this.indent(depth + 1)}const ${stmt.errParam} = ${catchParam}.message;\n`;
        out += `${this.genBlock(stmt.catchBody, depth + 1)}\n${ind}}`;
        return out;
      }
      case 'Return':
        return `${ind}return ${this.genExpr(stmt.value)};`;
      case 'Maqoli':
        return `${ind}console.log(${this.genExpr(stmt.value)});`;
      case 'ExprStmt':
        return `${ind}${this.genExpr(stmt.expr)};`;
    }
    throw new Error(`Unknown statement type: ${stmt.type}`);
  }

  genExpr(expr) {
    switch (expr.type) {
      case 'Literal': return JSON.stringify(expr.value);
      case 'Ident':   return expr.name;
      case 'Unary':
        if (expr.op === T.MINUS) return `-${this.genExpr(expr.operand)}`;
        if (expr.op === T.LA)    return `!${this.genExpr(expr.operand)}`;
        break;
      case 'BinOp':
        return `(${this.genExpr(expr.left)} ${BINOP[expr.op]} ${this.genExpr(expr.right)})`;
      case 'Call': {
        const args = expr.args.map(a => this.genExpr(a)).join(', ');
        return `${expr.callee}(${args})`;
      }
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }
}

function generate(ast) {
  return new CodeGen().generate(ast);
}

module.exports = { generate };
