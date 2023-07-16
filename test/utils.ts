import Handlebars from 'handlebars';
import { Handlebars as MyHandlebars } from '../src'
import { Helper } from '../src/handlebars';
import { CompileOptions } from '../src/interface';

type Case = {
  input: string;
  context?: any;
  helpers?: { [name: string]: Helper };
  compileOptions?: CompileOptions;
  runtimeOptions?: RuntimeOptions;
} & ({ output: string } | { toThrow: Error })

function runHandlebars(adapter: () => any) {
  let result, error;
  try {
    result = adapter();
  } catch (e) {
    error = e;
  }
  return { result, error };
}

export function runCase(cases: Case | Case[]) {
  if (!Array.isArray(cases)) {
    cases = [cases];
  }
  for (const c of cases) {
    const info = runHandlebars(() => {
      const instance = Handlebars.create();
      c.helpers && instance.registerHelper(c.helpers as any);
      return instance.compile(c.input, c.compileOptions)(c.context, c.runtimeOptions)
    });

    const myInfo = runHandlebars(() => {
      const instance = new MyHandlebars();
      c.helpers && instance.registerHelper(c.helpers);
      return instance.compile(c.input, c.compileOptions)(c.context, c.runtimeOptions);
    });
    try {
      expect(myInfo).toStrictEqual(info);
      if ('toThrow' in c) expect(myInfo.error).toStrictEqual(c.toThrow);
      if ('output' in c) expect(myInfo.result).toStrictEqual((c.output));
    } catch (error) {
      error.message = JSON.stringify(c, null, 2) + '\n' + error.message;
      throw error;
    }
  }
}

export function expectTemplate(template: string) {
  return new MyHandlebarsTestBench(template);
}

class MyHandlebarsTestBench {
  private input: any;
  private helpers: { [name: string]: Helper } = {};
  private compileOptions: CompileOptions;
  private runtimeOptions: RuntimeOptions;
  private message: string;
  private beforeEachFn: () => void;
  private afterEachFn: () => void;

  constructor(private template: string) { }
  beforeEach(fn: () => void) {
    this.beforeEachFn = fn;
    return this;
  }
  afterEach(fn: () => void) {
    this.afterEachFn = fn;
    return this;
  }
  withInput(input: any) {
    this.input = input;
    return this;
  }
  withHelper(name: string, helper: Helper) {
    this.helpers[name] = helper;
    return this;
  }
  withHelpers(helpers: { [name: string]: Helper }) {
    Object.keys(helpers).forEach(name => this.withHelper(name, helpers[name]));
    return this;
  }
  withCompileOptions(compileOptions?: CompileOptions) {
    this.compileOptions = {
      ...compileOptions,
      ignoreStandalone: false, // 默认为false，暂时不实现true的情况
      compat: false, // 默认为false，暂时不实现true的情况
    };
    return this;
  }
  withRuntimeOptions(runtimeOptions: RuntimeOptions) {
    this.runtimeOptions = runtimeOptions;
    return this;
  }
  private run(useHandlebars: boolean, after: (myInfo) => void) {
    let info;
    if (useHandlebars) {
      this.beforeEachFn?.();
      info = runHandlebars(() => {
        const instance = Handlebars.create();
        this.helpers && instance.registerHelper(this.helpers as any);
        return instance.compile(this.template, this.compileOptions)(this.input, this.runtimeOptions)
      });
      this.afterEachFn?.();
    }

    this.beforeEachFn?.();
    const myInfo = runHandlebars(() => {
      const instance = new MyHandlebars();
      this.helpers && instance.registerHelper(this.helpers);
      return instance.compile(this.template, this.compileOptions)(this.input, this.runtimeOptions);
    });
    this.afterEachFn?.();

    try {
      if (useHandlebars) {
        expect(myInfo).toStrictEqual(info);
      }
      after(myInfo);
      return myInfo;
    } catch (error) {
      error.message = JSON.stringify(this, null, 2) + '\n' + error.message;
      error.hbsMessage = this.message;
      throw error;
    }
  }

  withMessage(message: string) {
    this.message = message;
    return this;
  }

  toThrow();
  toThrow(useHandlebars: boolean);
  toThrow(errorType: new (...args: any[]) => Error);
  toThrow(message: string | RegExp);
  toThrow(errorType: new (...args: any[]) => Error, message: string | RegExp);
  toThrow(errorTypeOrMessageOrUseHandlebars?: (new (...args: any[]) => Error) | string | RegExp | boolean, message?: string | RegExp) {
    const useHandlebars = typeof errorTypeOrMessageOrUseHandlebars === 'boolean' ? errorTypeOrMessageOrUseHandlebars : true;
    return this.run(useHandlebars, (myInfo) => {
      let errorType;
      if (arguments.length === 1) {
        if (typeof errorTypeOrMessageOrUseHandlebars === 'string' || errorTypeOrMessageOrUseHandlebars instanceof RegExp) {
          message = errorTypeOrMessageOrUseHandlebars;
        } else if (typeof errorType === 'function') {
          errorType = errorTypeOrMessageOrUseHandlebars;
        }
      } else if (arguments.length === 2) {
        errorType = errorTypeOrMessageOrUseHandlebars;
      }
      expect(myInfo.error).toBeInstanceOf(errorType ? errorType : Error);
      if (typeof message === 'string') {
        expect(myInfo.error.message).toStrictEqual(message);
      } else if (message instanceof RegExp) {
        expect(message.test(myInfo.error.message)).toStrictEqual(true);
      }
    });
  }

  toCompileTo(output: string, { useHandlebars = true }: { useHandlebars: boolean } = { useHandlebars: true }) {
    this.run(useHandlebars, (myInfo) => {
      expect(myInfo.result).toStrictEqual((output));
    });
    return this;
  }
}
