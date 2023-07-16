import * as Benchmark from 'benchmark';
import * as benchmarks from 'beautify-benchmark';
import SimpleHandlebars from '../src';
import Handlebars from 'handlebars';

const times = 1;
const str = `{{a}}`.repeat(1000);

const compiled = Handlebars.compile(str);
const fastCompiled = SimpleHandlebars.compile(str);

new Benchmark.Suite()
  .add('compile', function () {
    for (let i = 0; i < times; i++) {
      Handlebars.compile(str)({ a: 1, b: 'a' });
    }
  })
  .add('ast-compile', function () {
    for (let i = 0; i < times; i++) {
      SimpleHandlebars.compile(str)({ a: 1, b: 'a' });
    }
  })
  .add('compile cache', function () {
    for (let i = 0; i < times; i++) {
      compiled({ a: 1, b: 'a' });
    }
  })
  .add('ast-compile cache', function () {
    for (let i = 0; i < times; i++) {
      fastCompiled({ a: 1, b: 'a' });
    }
  })
  .on('cycle', function (event) {
    benchmarks.add(event.target);
  })
  .on('start', function () {
    console.log(
      '\n  arguments to helpers Benchmark\n  node version: %s, date: %s\n  Starting...',
      process.version,
      Date()
    );
  })
  .on('complete', function done() {
    benchmarks.log();
  })
  .run({ async: false });
