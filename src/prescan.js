// Shared pre-scan: counts VarDecl and Assign per variable name
// to determine whether a variable should be let (reassigned) or const (not reassigned).
function preScan(stmts, declCount = new Map()) {
  for (const stmt of stmts) {
    if (stmt.type === 'VarDecl')
      declCount.set(stmt.name, (declCount.get(stmt.name) || 0) + 1);
    if (stmt.type === 'Assign')
      declCount.set(stmt.name, Math.max(declCount.get(stmt.name) || 0, 2));
    if (stmt.type === 'FuncDecl') preScan(stmt.body, declCount);
    if (stmt.type === 'While')    preScan(stmt.body, declCount);
    if (stmt.type === 'For')      preScan(stmt.body, declCount);
    if (stmt.type === 'If') {
      preScan(stmt.consequent, declCount);
      if (stmt.alternate)
        preScan(Array.isArray(stmt.alternate) ? stmt.alternate : [stmt.alternate], declCount);
    }
  }
  return declCount;
}

module.exports = { preScan };
