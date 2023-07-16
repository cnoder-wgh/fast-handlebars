import Exception from '../exception';
import { parse } from './base';
import { Handlebars } from '../..';
import { CompileOptions } from '../../interface';
import ASTRender from '../renderer';

export class Compiler {
  constructor(private input: string, private options: CompileOptions = {}, private handlebars: Handlebars) {
    validateInput(input, options);
  }

  compile(): ASTRender['render'] {
    let renderer: ASTRender;
    return (...args) => {
      if (!renderer) {
        const ast = parse(this.input);
        renderer = new ASTRender(ast, this.handlebars, this.options);
      }
      return renderer.render(...args);
    }
  }
}

function validateInput(input, options) {
  if (input == null || typeof input !== 'string' && input.type !== 'Program') {
    throw new Exception('You must pass a string or Handlebars AST to Handlebars.compile. You passed ' + input);
  }

  if (options.trackIds || options.stringParams) {
    throw new Exception('TrackIds and stringParams are no longer supported. See Github #1145');
  }

  if (!('data' in options)) {
    options.data = true;
  }
  if (options.compat) {
    options.useDepths = true;
  }
}
