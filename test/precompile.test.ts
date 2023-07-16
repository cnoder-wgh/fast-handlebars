import FastHandlebars from '../src'

describe('precompile', () => {
  it('precompile', () => {
    const spec = FastHandlebars.precompile('hello {{a}}!');
    const result = FastHandlebars.template(spec)({ a: 'world' });
    expect(result).toStrictEqual('hello world!');
  });

  it('compileOptions', () => {
    const spec = FastHandlebars.precompile('{{a}}{{b}}', { noEscape: true });
    const result = FastHandlebars.template(spec)({ a: 1, b: 2 });
    expect(result).toStrictEqual('3');

    const spec2 = FastHandlebars.precompile('{{a}}{{b}}', { noEscape: false });
    const result2 = FastHandlebars.template(spec2)({ a: 1, b: 2 });
    expect(result2).toStrictEqual('12');
  });
});
