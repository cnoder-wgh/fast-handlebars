import Handlebars from '../src';

Handlebars.registerHelper('concat', (a, b) => {
  return a + b;
});

const compiled = Handlebars.compile('{{concat "he" "llo"}} {{what}}');
const result = compiled({
  what: 'world'
});

console.log(result);
