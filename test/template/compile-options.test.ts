import { expectTemplate } from '../utils';

describe('compile-options', function () {
  describe('noEscape', function () {
    it('number', function () {
      expectTemplate('{{a}}{{b}}')
        .withInput({ a: 1, b: 2 })
        .withCompileOptions({ noEscape: true })
        .toCompileTo('3');

      expectTemplate('{{a}}{{b}}')
        .withInput({ a: 1, b: 2 })
        .withCompileOptions({ noEscape: false })
        .toCompileTo('12');

      expectTemplate('f{{a}}{{b}}')
        .withInput({ a: 1, b: 2 })
        .withCompileOptions({ noEscape: true })
        .toCompileTo('f12');

      expectTemplate('{{a}}{{b}}{{c}}')
        .withInput({ b: 2, c: 3 })
        .withCompileOptions({ noEscape: false })
        .toCompileTo('23');
    });

    it('special character', function () {
      expectTemplate('{{a}}')
        .withInput({ a: '<a>' })
        .withCompileOptions({ noEscape: true })
        .toCompileTo('<a>');

      expectTemplate('{{a}}')
        .withInput({ a: '<a>' })
        .withCompileOptions({ noEscape: false })
        .toCompileTo('&lt;a&gt;');
    });
  });
});
