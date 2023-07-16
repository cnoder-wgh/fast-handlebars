import { expectTemplate } from "../utils";
import MyHandlebars from '../../src'
import { resetLoggedProperties } from "../../src/handlebars/utils/proto-access";

describe('security issues', function () {
  describe('GH-1495: Prevent Remote Code Execution via constructor', function () {
    it('should not allow constructors to be accessed', function () {
      expectTemplate('{{lookup (lookup this "constructor") "name"}}')
        .withInput({})
        .toCompileTo('');

      expectTemplate('{{constructor.name}}')
        .withInput({})
        .toCompileTo('');
    });

    it('GH-1603: should not allow constructors to be accessed (lookup via toString)', function () {
      expectTemplate('{{lookup (lookup this (list "constructor")) "name"}}')
        .withInput({})
        .withHelper('list', function (element) {
          return [element];
        })
        .toCompileTo('');
    });

    it('should allow the "constructor" property to be accessed if it is an "ownProperty"', function () {
      expectTemplate('{{constructor.name}}')
        .withInput({ constructor: { name: 'here we go' } })
        .toCompileTo('here we go');

      expectTemplate('{{lookup (lookup this "constructor") "name"}}')
        .withInput({ constructor: { name: 'here we go' } })
        .toCompileTo('here we go');
    });

    it('should allow the "constructor" property to be accessed if it is an "own property"', function () {
      expectTemplate('{{lookup (lookup this "constructor") "name"}}')
        .withInput({ constructor: { name: 'here we go' } })
        .toCompileTo('here we go');
    });
  });

  describe('GH-1558: Prevent explicit call of helperMissing-helpers', function () {
    if (!MyHandlebars.compile) {
      return;
    }

    describe('without the option "allowExplicitCallOfHelperMissing"', function () {
      it('should throw an exception when calling  "{{helperMissing}}" ', function () {
        expectTemplate('{{helperMissing}}').toThrow(Error);
      });

      it('should throw an exception when calling  "{{#helperMissing}}{{/helperMissing}}" ', function () {
        expectTemplate('{{#helperMissing}}{{/helperMissing}}').toThrow(Error);
      });

      it('should throw an exception when calling  "{{blockHelperMissing "abc" .}}" ', function () {
        const functionCalls: string[] = [];
        expect(function () {
          const template = MyHandlebars.compile('{{blockHelperMissing "abc" .}}');
          template({
            fn: function () {
              functionCalls.push('called');
            }
          });
        }).toThrow(Error);
        expect(functionCalls.length).toStrictEqual(0);
      });

      it('should throw an exception when calling  "{{#blockHelperMissing .}}{{/blockHelperMissing}}"', function () {
        expectTemplate('{{#blockHelperMissing .}}{{/blockHelperMissing}}')
          .withInput({
            fn: function () {
              return 'functionInData';
            }
          })
          .toThrow(Error);
      });
    });
  });

  describe('GH-1563', function () {
    it('should not allow to access constructor after overriding via __defineGetter__', function () {
      if ({}['__defineGetter__'] == null || {}['__lookupGetter__'] == null) {
        return this.skip(); // Browser does not support this exploit anyway
      }
      expectTemplate(
        '{{__defineGetter__ "undefined" valueOf }}' +
        '{{#with __lookupGetter__ }}' +
        '{{__defineGetter__ "propertyIsEnumerable" (this.bind (this.bind 1)) }}' +
        '{{constructor.name}}' +
        '{{/with}}'
      )
        .withInput({})
        .toThrow(/Missing helper: "__defineGetter__"/);
    });
  });

  describe('GH-1595: dangerous properties', function () {
    const templates = [
      '{{constructor}}',
      '{{__defineGetter__}}',
      '{{__defineSetter__}}',
      '{{__lookupGetter__}}',
      '{{__proto__}}',
      '{{lookup this "constructor"}}',
      '{{lookup this "__defineGetter__"}}',
      '{{lookup this "__defineSetter__"}}',
      '{{lookup this "__lookupGetter__"}}',
      '{{lookup this "__proto__"}}'
    ];

    templates.forEach(function (template) {
      describe('access should be denied to ' + template, function () {
        it('by default', function () {
          expectTemplate(template)
            .withInput({})
            .toCompileTo('');
        });
        it(' with proto-access enabled', function () {
          expectTemplate(template)
            .withInput({})
            .withRuntimeOptions({
              allowProtoPropertiesByDefault: true,
              allowProtoMethodsByDefault: true
            })
            .toCompileTo('');
        });
      });
    });
  });
  describe('GH-1631: disallow access to prototype functions', function () {
    function TestClass() { }

    TestClass.prototype.aProperty = 'propertyValue';
    TestClass.prototype.aMethod = function () {
      return 'returnValue';
    };

    beforeEach(function () {
      resetLoggedProperties();
    });

    afterEach(function () {
      jest.clearAllMocks();
    });


    describe('control access to prototype methods via "allowedProtoMethods"', function () {
      it('should be prohibited by default and log a warning', function () {
        const spy = jest.spyOn(console, 'error');
        expectTemplate('{{aMethod}}')
          .withInput(new TestClass())
          .afterEach(() => {
            expect(spy).toBeCalledTimes(1);
            expect(spy).toBeCalledWith(`Handlebars: Access has been denied to resolve the property "aMethod" because it is not an "own property" of its parent.\n` +
              `You can add a runtime option to disable the check or this warning:\n` +
              `See https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details`);
          })
          .toCompileTo('', { useHandlebars: false });
      });

      it('should only log the warning once', function () {
        const spy = jest.spyOn(console, 'error');

        expectTemplate('{{aMethod}}')
          .withInput(new TestClass())
          .toCompileTo('', { useHandlebars: false });

        expectTemplate('{{aMethod}}')
          .withInput(new TestClass())
          .toCompileTo('', { useHandlebars: false });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(`Handlebars: Access has been denied to resolve the property "aMethod" because it is not an "own property" of its parent.\n` +
          `You can add a runtime option to disable the check or this warning:\n` +
          `See https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details`);
      });

      it('can be allowed, which disables the warning', function () {
        const spy = jest.spyOn(console, 'error');

        expectTemplate('{{aMethod}}')
          .withInput(new TestClass())
          .withRuntimeOptions({
            allowedProtoMethods: {
              aMethod: true
            }
          })
          .toCompileTo('returnValue');

        expect(spy).not.toBeCalled();
      });

      it('can be turned on by default, which disables the warning', function () {
        const spy = jest.spyOn(console, 'error');

        expectTemplate('{{aMethod}}')
          .withInput(new TestClass())
          .withRuntimeOptions({
            allowProtoMethodsByDefault: true
          })
          .toCompileTo('returnValue');

        expect(spy).not.toBeCalled();
      });

      it('can be turned off by default, which disables the warning', function () {
        const spy = jest.spyOn(console, 'error');

        expectTemplate('{{aMethod}}')
          .withInput(new TestClass())
          .withRuntimeOptions({
            allowProtoMethodsByDefault: false
          })
          .toCompileTo('');

        expect(spy).not.toBeCalled();
      });

      it('can be turned off, if turned on by default', function () {
        expectTemplate('{{aMethod}}')
          .withInput(new TestClass())
          .withRuntimeOptions({
            allowProtoMethodsByDefault: true,
            allowedProtoMethods: {
              aMethod: false
            }
          })
          .toCompileTo('');
      });
    });

    describe('control access to prototype non-methods via "allowedProtoProperties" and "allowProtoPropertiesByDefault', function () {
      it('should be prohibited by default and log a warning', function () {
        const spy = jest.spyOn(console, 'error');

        expectTemplate('{{aProperty}}')
          .withInput(new TestClass())
          .toCompileTo('', { useHandlebars: false });

        expect(spy).toBeCalledTimes(1);
        expect(spy).toBeCalledWith(`Handlebars: Access has been denied to resolve the property "aProperty" because it is not an "own property" of its parent.\n` +
          `You can add a runtime option to disable the check or this warning:\n` +
          `See https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details`);
      });

      it('can be explicitly prohibited by default, which disables the warning', function () {
        const spy = jest.spyOn(console, 'error');

        expectTemplate('{{aProperty}}')
          .withInput(new TestClass())
          .withRuntimeOptions({
            allowProtoPropertiesByDefault: false
          })
          .toCompileTo('');

        expect(spy).toBeCalledTimes(0);
      });

      it('can be turned on, which disables the warning', function () {
        const spy = jest.spyOn(console, 'error');

        expectTemplate('{{aProperty}}')
          .withInput(new TestClass())
          .withRuntimeOptions({
            allowedProtoProperties: {
              aProperty: true
            }
          })
          .toCompileTo('propertyValue');

        expect(spy).toBeCalledTimes(0);
      });

      it('can be turned on by default, which disables the warning', function () {
        const spy = jest.spyOn(console, 'error');

        expectTemplate('{{aProperty}}')
          .withInput(new TestClass())
          .withRuntimeOptions({
            allowProtoPropertiesByDefault: true
          })
          .toCompileTo('propertyValue');

        expect(spy).toBeCalledTimes(0);
      });

      it('can be turned off, if turned on by default', function () {
        expectTemplate('{{aProperty}}')
          .withInput(new TestClass())
          .withRuntimeOptions({
            allowProtoPropertiesByDefault: true,
            allowedProtoProperties: {
              aProperty: false
            }
          })
          .toCompileTo('');
      });
    });
  });

  describe('escapes template variables', function () {
    it('in compat mode', function () {
      expectTemplate("{{'a\\b'}}")
        .withCompileOptions({ compat: true })
        .withInput({ 'a\\b': 'c' })
        .toCompileTo('c');
    });

    it('in default mode', function () {
      expectTemplate("{{'a\\b'}}")
        .withCompileOptions()
        .withInput({ 'a\\b': 'c' })
        .toCompileTo('c');
    });
    it('in default mode', function () {
      expectTemplate("{{'a\\b'}}")
        .withCompileOptions({ strict: true })
        .withInput({ 'a\\b': 'c' })
        .toCompileTo('c');
    });
  });
});
