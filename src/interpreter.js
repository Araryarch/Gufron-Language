const { T } = require('./lexer');
const { Environment, ReturnSignal } = require('./environment');
const { preScan } = require('./prescan');

class Interpreter {
  constructor() {
    this.globals = new Environment();
    this.declCount = new Map();
  }

  run(ast) {
    this.declCount = preScan(ast.body);
    this.execBlock(ast.body, this.globals);
  }

  execBlock(stmts, env) {
    for (const stmt of stmts) {
      const r = this.execStmt(stmt, env);
      if (r instanceof ReturnSignal) return r;
    }
  }

  execStmt(stmt, env) {
    switch (stmt.type) {
      case 'VarDecl': {
        const isConst = (this.declCount.get(stmt.name) || 1) === 1;
        env.define(stmt.name, this.evalExpr(stmt.value, env), isConst);
        return;
      }
      case 'Assign':
        env.assign(stmt.name, this.evalExpr(stmt.value, env));
        return;
      case 'FuncDecl':
        env.define(stmt.name, { __fn: true, params: stmt.params, body: stmt.body, closure: env }, true);
        return;
      case 'If': {
        if (this.evalExpr(stmt.condition, env))
          return this.execBlock(stmt.consequent, new Environment(env));
        if (stmt.alternate)
          return Array.isArray(stmt.alternate)
            ? this.execBlock(stmt.alternate, new Environment(env))
            : this.execStmt(stmt.alternate, env);
        return;
      }
      case 'While':
        while (this.evalExpr(stmt.condition, env)) {
          const r = this.execBlock(stmt.body, new Environment(env));
          if (r instanceof ReturnSignal) return r;
        }
        return;
      case 'For': {
        const forEnv = new Environment(env);
        forEnv.define(stmt.initName, this.evalExpr(stmt.initVal, env));
        while (this.evalExpr(stmt.condition, forEnv)) {
          const r = this.execBlock(stmt.body, new Environment(forEnv));
          if (r instanceof ReturnSignal) return r;
          forEnv.assign(stmt.updateName, this.evalExpr(stmt.updateVal, forEnv));
        }
        return;
      }
      case 'TryCatch': {
        try {
          const r = this.execBlock(stmt.tryBody, new Environment(env));
          if (r instanceof ReturnSignal) return r;
        } catch (e) {
          const catchEnv = new Environment(env);
          if (stmt.errParam) catchEnv.define(stmt.errParam, e.message, true);
          const r = this.execBlock(stmt.catchBody, catchEnv);
          if (r instanceof ReturnSignal) return r;
        }
        return;
      }
      case 'Return':  return new ReturnSignal(this.evalExpr(stmt.value, env));
      case 'Maqoli':  console.log(this.evalExpr(stmt.value, env)); return;
      case 'ExprStmt': this.evalExpr(stmt.expr, env); return;
    }
    throw new Error(`Unknown statement type: ${stmt.type}`);
  }

  evalExpr(expr, env) {
    switch (expr.type) {
      case 'Literal': return expr.value;
      case 'Ident':   return env.get(expr.name);
      case 'Unary':
        if (expr.op === T.MINUS) return -this.evalExpr(expr.operand, env);
        if (expr.op === T.LA)    return !this.evalExpr(expr.operand, env);
        break;
      case 'BinOp':   return this.evalBinOp(expr.op, this.evalExpr(expr.left, env), this.evalExpr(expr.right, env));
      case 'Call': {
        const fn = env.get(expr.callee);
        if (!fn?.__fn) throw new Error(`'${expr.callee}' is not a function`);
        const fnEnv = new Environment(fn.closure);
        fn.params.forEach((p, i) => fnEnv.define(p, this.evalExpr(expr.args[i], env)));
        const r = this.execBlock(fn.body, fnEnv);
        return r instanceof ReturnSignal ? r.value : undefined;
      }
    }
    throw new Error(`Unknown expression type: ${expr.type}`);
  }

  evalBinOp(op, l, r) {
    switch (op) {
      case T.PLUS:       return l + r;
      case T.MINUS:      return l - r;
      case T.STAR:       return l * r;
      case T.SLASH:      return l / r;
      case T.INNA:       return l == r;
      case T.INNNA:      return l === r;
      case T.LA_INA:     return l != r;
      case T.BESAR:      return l > r;
      case T.KECIL:      return l < r;
      case T.BESAR_INNA: return l >= r;
      case T.KECIL_INNA: return l <= r;
    }
    throw new Error(`Unknown operator: ${op}`);
  }
}

module.exports = { Interpreter };
