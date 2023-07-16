import { Handlebars } from "../..";
import { CompileOptions, HelperOptions, RuntimeOptions, TemplateDelegate, AST } from "../../interface";
import { escapeExpression } from "../utils";
import { RenderContext } from "./context";
import { isHelperExpression, isScopedId, isSimpleId, transformLiteralToPath } from "../utils/node";

export interface HelperInvokeOptions {
  hash?: Record<string, any>;
  program?: AST.Program;
  inverse?: AST.Program;
  location: AST.SourceLocation;
  isBlock?: boolean;
}

export enum ExprType {
  helper = 1,
  ambiguous = 2,
  simple = 3,
}

export enum HelperRunnerType {
  helper = 1,
  mustache = 2,
  simpleBlock = 3,
  multiPathBlock = 4,
}

// 记录当前转换的node是否是param
const NODE_IN_PARAMS_KEY = Symbol('transform#nodeInParam');

export class NodeTransformer {
  constructor(
    public ast: AST.Node,
    public readonly handlebars: Handlebars,
    public readonly compileOptions: CompileOptions,
    public readonly runtimeOptions: RuntimeOptions,
    public readonly renderContext: RenderContext,
  ) { }

  transform() {
    return this.accept(this.ast);
  }

  accept(node: AST.Node, useType?: string) {
    return this[useType ?? node.type](node);
  }

  private fnWrapper(program: AST.Program | undefined): TemplateDelegate {
    return (context, options) => {
      if (!program) return;

      const renderContext = this.renderContext;
      let needPopContext = false;
      if (renderContext.context.peek() !== context) {
        needPopContext = true;
        renderContext.context.push(context);
      }

      let needPopData = false;
      if (options?.data && renderContext.data.peek() !== options.data) {
        needPopData = true;
        renderContext.data.push(options.data);
      }

      const useBlockParams = !!program.blockParams;
      if (useBlockParams) {
        renderContext.blockParams.pushValues(options?.blockParams);
        renderContext.blockParams.pushKeys(program.blockParams);
      }

      const result = this.accept(program);

      if (useBlockParams) {
        renderContext.blockParams.popKeys();
        renderContext.blockParams.popValues();
      }
      if (needPopContext) renderContext.context.pop();
      if (needPopData) renderContext.data.pop();

      return result;
    }
  }

  protected get helperMissing() {
    return this.getHelper('helperMissing') ?? this.getHook('helperMissing');
  }

  protected get blockHelperMissing() {
    return this.getHelper('blockHelperMissing') ?? this.getHook('blockHelperMissing');
  }

  protected getHelper(name: string) {
    return this.renderContext.lookupProperty(this.handlebars.helpers, name);
  }

  protected getHook(name: string) {
    return this.renderContext.lookupProperty(this.handlebars.hooks, name);
  }

  protected generateHelperOptions(name: string, invokeOptions: HelperInvokeOptions): HelperOptions {
    const renderContext = this.renderContext;
    const options = {
      name,
      data: renderContext.data.peek() ?? {},
      loc: invokeOptions.location,
      hash: invokeOptions.hash ?? {},
      lookupProperty: renderContext.lookupProperty.bind(renderContext),
    } as HelperOptions;
    if (invokeOptions.isBlock) {
      options.fn = this.fnWrapper(invokeOptions.program);
      options.fn['blockParams'] = invokeOptions.program?.blockParams?.length ?? 0;
      options.inverse = this.fnWrapper(invokeOptions.inverse);
    }
    return options;
  }

  protected classifySexpr(node: AST.SubExpression | AST.MustacheStatement | AST.BlockStatement) {
    const path = node.path as AST.PathExpression;
    const isSimple = isSimpleId(path);
    const isBlockParam = isSimple && !!this.renderContext.blockParams.paramIndex(path.parts[0] as string);
    const isHelper = !isBlockParam && isHelperExpression(node);
    const isEligible = !isBlockParam && (isHelper || isSimple);
    return isHelper ? ExprType.helper : isEligible ? ExprType.ambiguous : ExprType.simple;
  }

  private paramWrap(node: AST.Expression) {
    node[NODE_IN_PARAMS_KEY] = true;
    return node;
  }

  private resolveParams(params: AST.Expression[]): any[] {
    return params.map(item => this.accept(this.paramWrap(item)))
  }

  private isParams(node: AST.Expression) {
    return !!node[NODE_IN_PARAMS_KEY];
  }

  protected BlockStatement(node: AST.BlockStatement) {
    const { renderContext } = this;
    transformLiteralToPath(node);

    const path = node.path;
    const context = renderContext.context.peek();
    const hash = node.hash ? this.accept(node.hash) : undefined;
    const helperOptions = this.generateHelperOptions(path.original, {
      location: node.loc,
      hash,
      program: node.program,
      inverse: node.inverse,
      isBlock: true,
    });

    const pathValue = this.accept(path);
    const exprType = this.classifySexpr(node);

    if (exprType === ExprType.helper) {
      const params = this.resolveParams(node.params);
      return (pathValue ?? this.helperMissing).call(context, ...params, helperOptions);
    }

    if (typeof pathValue !== 'function') {
      return this.blockHelperMissing.call(context, this.accept(node.path), helperOptions);
    }

    const params = this.resolveParams(node.params);
    if (exprType === ExprType.ambiguous) {
      const helperValue = (pathValue ?? this.helperMissing).call(context, ...params, helperOptions);
      if (this.getHelper(path.parts[0] as string)) {
        return helperValue;
      }
      return this.blockHelperMissing.call(
        context,
        helperValue,
        helperOptions
      );
    }

    return this.blockHelperMissing.call(
      context,
      pathValue.call(context, ...params),
      helperOptions
    );
  }

  protected BooleanLiteral(node: AST.BooleanLiteral) {
    return node.value;
  }

  protected CommentStatement(node: AST.CommentStatement) {
    return '';
  }

  protected ContentStatement(node: AST.ContentStatement) {
    return node.value;
  }

  protected HashPair(node: AST.HashPair) {
    return { key: node.key, value: this.accept(this.paramWrap(node.value)) };
  }

  protected Hash(node: AST.Hash) {
    const result = {};
    for (const pair of node.pairs) {
      const { key, value } = this.accept(pair);
      result[key] = value;
    }
    return result;
  }

  protected MustacheStatement(node: AST.MustacheStatement) {
    const result = this.accept(node, 'SubExpression');
    return node.escaped && !this.compileOptions.noEscape ? escapeExpression(result) : result;
  }

  protected NullLiteral(node: AST.NullLiteral) {
    return null;
  }

  protected NumberLiteral(node: AST.NumberLiteral) {
    return node.value;
  }

  protected PathExpression(node: AST.PathExpression) {
    const { renderContext } = this;

    if (['helperMissing', 'blockHelperMissing'].includes(node.parts[0] as string)) {
      return (undefined as any)['call'];
    }

    const isSimple = isSimpleId(node);

    const blockParamIndex = renderContext.blockParams.paramIndex(node.parts[0] as string)
    if (!node.depth && !isScopedId(node) && blockParamIndex) {
      return renderContext.blockParams.getByIndex(blockParamIndex, node.parts.slice(1) as string[]);
    }

    // this的情况
    if (node.parts[0] === undefined) {
      return renderContext.context.peek();
    }

    // @data
    if (node.data) {
      return renderContext.data.getValue(node.parts as string[], node.depth);
    }

    // 如果当前node不是参数, 则优先获取helper
    if (!this.isParams(node) && isSimple) {
      const helper = this.getHelper(node.parts[0] as string);
      if (helper) return helper;
    }

    return renderContext.context.getValue(node.parts as string[], node.depth);
  }

  protected Program(node: AST.Program) {
    let result = null;
    for (const item of node.body) {
      const val = this.accept(item) ?? '';
      result = result === null ? val : result + val;
    }
    return `${result ?? ''}`;
  }

  protected StringLiteral(node: AST.StringLiteral) {
    return node.value;
  }

  protected SubExpression(node: AST.SubExpression) {
    transformLiteralToPath(node);

    const path = node.path as AST.PathExpression;
    const pathValue = this.accept(path);
    const type = this.classifySexpr(node);
    if (type !== ExprType.helper && typeof pathValue !== 'function' && pathValue !== undefined) {
      return pathValue;
    }
    const params = this.resolveParams(node.params);
    const helperOptions = this.generateHelperOptions(path.original, {
      location: node.loc,
      hash: node.hash ? this.accept(node.hash) : undefined,
    });
    return (pathValue ?? this.helperMissing).call(this.renderContext.context.peek(), ...params, helperOptions);
  }

  protected UndefinedLiteral(node: AST.UndefinedLiteral) {
    return undefined;
  }
}
