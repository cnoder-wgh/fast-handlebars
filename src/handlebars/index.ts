import { Compiler } from './compiler/compiler';
import { registerDefaultHelpers, moveHelperToHooks } from './helpers';
import { registerDefaultDecorators } from './decorators';
import * as Utils from './utils';
import Exception from './exception';
import { parse } from './compiler/base';
import { CompileOptions, HelperOptions } from '../interface';
import logger from './utils/logger';
import { SafeString } from './safe-string';
import ASTRender from './renderer';

export interface Helper {
  (context?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, options?: HelperOptions): any;
}

const objectType = '[object Object]';

export class Handlebars {
  readonly helpers: Record<string, Helper> = {};
  readonly hooks: Record<string, any> = {};
  readonly partials: Record<string, any> = {};
  readonly decorators: Record<string, any> = {};
  Utils = Utils;
  parse = parse;
  SafeString = SafeString;
  createFrame = Utils.createFrame;

  constructor() {
    registerDefaultHelpers(this);
    moveHelperToHooks(this, 'helperMissing', false);
    moveHelperToHooks(this, 'blockHelperMissing', false);
    registerDefaultDecorators(this);
  }

  compile(input, options?: CompileOptions) {
    const compiler = new Compiler(input, options, this);
    return compiler.compile();
  }

  precompile(input, options: CompileOptions = {}) {
    return { ast: parse(input), options };
  }

  template(templateSpec): ASTRender['render'] {
    const { ast, options } = templateSpec;
    return (...args) => new ASTRender(ast, this, options).render(...args);
  }

  registerHelper(name: string, fn: Helper);
  registerHelper(helpers: { [name: string]: Helper });
  registerHelper(name: string | { [name: string]: Helper }, fn?: Helper) {
    if (typeof name === 'object' && name !== null) {
      if (fn) {
        throw new Exception('Arg not supported with multiple helpers');
      }
      Utils.extend(this.helpers, name);
    } else {
      this.helpers[name as string] = fn!;
    }
  }
  unregisterHelper(name) {
    delete this.helpers[name];
  }

  registerPartial(name, partial) {
    if (Utils.toString.call(name) === objectType) {
      Utils.extend(this.partials, name);
    } else {
      if (typeof partial === 'undefined') {
        throw new Exception('Attempting to register a partial called "' + name + '" as undefined');
      }
      this.partials[name] = partial;
    }
  }
  unregisterPartial(name) {
    delete this.partials[name];
  }

  registerDecorator(name, fn) {
    if (Utils.toString.call(name) === objectType) {
      if (fn) {
        throw new Exception('Arg not supported with multiple decorators');
      }
      Utils.extend(this.decorators, name);
    } else {
      this.decorators[name] = fn;
    }
  }
  unregisterDecorator(name) {
    delete this.decorators[name];
  }
  runHelper(name: string, params: any[], options: HelperOptions) {
    options['name'] = name;
    const helper = this.helpers[name];
    if (!helper) {
      return this.runHook('helperMissing', params, options);
    }
    return helper(...params, options);
  }
  runHook(name: string, params: any[], options: HelperOptions) {
    const hook = this.hooks[name];
    if (!hook) {
      return;
    }
    return hook(...params, options);
  }
  isHelper(name: string) {
    return !!this.helpers[name];
  }
  log(level: string, ...message: any[]) {
    logger.log(level, ...message);
  }
  create() {
    return new Handlebars();
  }
}
