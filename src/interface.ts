export namespace AST {
  export interface Node {
      type: string;
      loc: SourceLocation;
  }

  export interface SourceLocation {
      source: string;
      start: Position;
      end: Position;
  }

  export interface Position {
      line: number;
      column: number;
  }

  export interface Program extends Node {
      body: Statement[];
      blockParams: string[];
  }

  type Statement = Node

  export interface MustacheStatement extends Statement {
      type: 'MustacheStatement';
      path: PathExpression | Literal;
      params: Expression[];
      hash: Hash;
      escaped: boolean;
      strip: StripFlags;
  }

  export interface BlockStatement extends Statement {
      type: 'BlockStatement';
      path: PathExpression;
      params: Expression[];
      hash: Hash;
      program: Program;
      inverse: Program;
      openStrip: StripFlags;
      inverseStrip: StripFlags;
      closeStrip: StripFlags;
  }

  export interface PartialStatement extends Statement {
      type: 'PartialStatement';
      name: PathExpression | SubExpression;
      params: Expression[];
      hash: Hash;
      indent: string;
      strip: StripFlags;
  }

  export interface PartialBlockStatement extends Statement {
      type: 'PartialBlockStatement';
      name: PathExpression | SubExpression;
      params: Expression[];
      hash: Hash;
      program: Program;
      openStrip: StripFlags;
      closeStrip: StripFlags;
  }

  export interface ContentStatement extends Statement {
      type: 'ContentStatement';
      value: string;
      original: StripFlags;
  }

  export interface CommentStatement extends Statement {
      type: 'CommentStatement';
      value: string;
      strip: StripFlags;
  }

  export type Expression = Node

  export interface SubExpression extends Expression {
      type: 'SubExpression';
      path: PathExpression;
      params: Expression[];
      hash: Hash;
  }

  export interface PathExpression extends Expression {
      type: 'PathExpression';
      data: boolean;
      depth: number;
      parts: string[];
      original: string;
  }

  type Literal = Expression
  export interface StringLiteral extends Literal {
      type: 'StringLiteral';
      value: string;
      original: string;
  }

  export interface BooleanLiteral extends Literal {
      type: 'BooleanLiteral';
      value: boolean;
      original: boolean;
  }

  export interface NumberLiteral extends Literal {
      type: 'NumberLiteral';
      value: number;
      original: number;
  }

  export interface UndefinedLiteral extends Literal {
      type: 'UndefinedLiteral';
}

  export interface NullLiteral extends Literal {
      type: 'NullLiteral';
}

  export interface Hash extends Node {
      type: 'Hash';
      pairs: HashPair[];
  }

  export interface HashPair extends Node {
      type: 'HashPair';
      key: string;
      value: Expression;
  }

  export interface StripFlags {
      open: boolean;
      close: boolean;
  }

  export interface helpers {
      helperExpression(node: Node): boolean;
      scopeId(path: PathExpression): boolean;
      simpleId(path: PathExpression): boolean;
  }
}
export interface HelperFnOptions {
  data: any;
  blockParams: any[];
}

export interface TemplateDelegate<T = any> {
  (context: T, options?: HelperFnOptions): string;
}

export interface HelperOptions {
  name: string;
  loc: AST.SourceLocation;
  fn?: TemplateDelegate;
  inverse?: TemplateDelegate;
  hash: any;
  data?: any;
  lookupProperty: (obj: Record<string, any>, name: string | number) => any;
}

export interface CompileOptions {
  [key: string]: any;
  data?: boolean;
  // compat?: boolean;
  // knownHelpers?: KnownHelpers;
  // knownHelpersOnly?: boolean;
  noEscape?: boolean;
  // strict?: boolean;
  // assumeObjects?: boolean;
  // preventIndent?: boolean;
  // ignoreStandalone?: boolean;
  // explicitPartialContext?: boolean;
}

export interface RuntimeOptions {
  // partial?: boolean;
  // depths?: any[];
  // helpers?: { [name: string]: Function };
  // partials?: { [name: string]: TemplateDelegate };
  // decorators?: { [name: string]: Function };
  data?: any;
  blockParams?: any[];
  allowedProtoProperties?: { [name: string]: boolean };
  allowedProtoMethods?: { [name: string]: boolean };
  allowProtoPropertiesByDefault?: boolean;
  allowProtoMethodsByDefault?: boolean;
}

export interface IVisitor {
  accept(node: AST.Node): void;
  acceptKey(node: AST.Node, name: string): void;
  acceptArray(arr: AST.Expression[]): void;
  Program(program: AST.Program): void;
  BlockStatement(block: AST.BlockStatement): void;
  PartialStatement(partial: AST.PartialStatement): void;
  PartialBlockStatement(partial: AST.PartialBlockStatement): void;
  MustacheStatement(mustache: AST.MustacheStatement): void;
  ContentStatement(content: AST.ContentStatement): void;
  CommentStatement(comment?: AST.CommentStatement): void;
  SubExpression(sexpr: AST.SubExpression): void;
  PathExpression(path: AST.PathExpression): void;
  StringLiteral(str: AST.StringLiteral): void;
  NumberLiteral(num: AST.NumberLiteral): void;
  BooleanLiteral(bool: AST.BooleanLiteral): void;
  UndefinedLiteral(): void;
  NullLiteral(): void;
  Hash(hash: AST.Hash): void;
}
