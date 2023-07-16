// @ts-nocheck
import Exception from '../exception';
import { isEmpty, isFunction } from '../utils';

export default function(instance) {
  instance.registerHelper('with', function(context, options) {
    if (arguments.length != 2) {
      throw new Exception('#with requires exactly one argument');
    }
    if (isFunction(context)) {
      context = context.call(this);
    }

    const fn = options.fn;

    if (!isEmpty(context)) {
      const data = options.data;

      return fn(context, {
        data: data,
        blockParams: [context]
      });
    } else {
      return options.inverse(this);
    }
  });
}
