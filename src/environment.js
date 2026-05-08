class ReturnSignal {
  constructor(value) { this.value = value; }
}

class Environment {
  constructor(parent = null) {
    this.vars = new Map();
    this.consts = new Set();
    this.parent = parent;
  }

  define(name, value, isConst = false) {
    this.vars.set(name, value);
    if (isConst) this.consts.add(name);
  }

  assign(name, value) {
    if (this.vars.has(name)) {
      if (this.consts.has(name)) throw new Error(`Cannot reassign const '${name}'`);
      this.vars.set(name, value);
      return;
    }
    if (this.parent) return this.parent.assign(name, value);
    throw new Error(`Undefined variable '${name}'`);
  }

  get(name) {
    if (this.vars.has(name)) return this.vars.get(name);
    if (this.parent) return this.parent.get(name);
    throw new Error(`Undefined variable '${name}'`);
  }
}

module.exports = { Environment, ReturnSignal };
