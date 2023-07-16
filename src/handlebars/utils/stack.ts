export class Stack<T = any> {
  protected stack: T[] = [];
  push(value: T) {
    this.stack.push(value);
  }
  pop() {
    return this.stack.pop();
  }
  peek(depth = 0) {
    return this.stack[this.stack.length - 1 - depth];
  }
  get length() {
    return this.stack.length;
  }
}
