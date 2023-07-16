import { AST } from "../../interface";

/**
 * node.path校正: 一般情况下node.path都是PathExpression类型
 * 但是key是0或false时，AST会被解析为对应的Literal类型
 * 此方法用于把这两种情况校正为PathExpression
 */
export const transformLiteralToPath = (node: AST.SubExpression | AST.MustacheStatement | AST.BlockStatement) => {
  if (node.path['parts']) {
    return;
  }
  // 如果不是PathExpression，则转换为PathExpression
  // 因为解析为AST时，false和0会被转为Literal而不是PathExpression
  const literal = node.path;
  node.path = {
    type: 'PathExpression',
    data: false,
    depth: 0,
    parts: [literal['original'] + ''],
    original: literal['original'] + '',
    loc: literal.loc
  };
}

export const isScopedId = (path: AST.PathExpression) => {
  return /^\.|this\b/.test(path.original);
}

export const isSimpleId = (path: AST.PathExpression) => {
  return path.parts.length === 1 && !isScopedId(path) && !path.depth;
}

/**
 * a mustache is definitely a helper if:
 * 1. it is an eligible helper, and
 * 2. it has at least one parameter or hash segment
 */
export const isHelperExpression = (node: AST.Node) => {
  if (node.type === 'SubExpression') {
    return true;
  }
  if (node.type === 'MustacheStatement' || node.type === 'BlockStatement') {
    if (node['params'] && node['params'].length) {
      return true;
    }
    if (node['hash']) {
      return true;
    }
    return false;
  }
  return false;
}
