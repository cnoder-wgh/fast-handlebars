import { indexOf } from "../../utils";
import { lookupPropertyByPath } from "../../utils/common";
import { Stack } from "../../utils/stack";

export class BlockParams {
  private keysStack = new Stack<string[]>();
  private valuesStack = new Stack<any[] | undefined>();
  pushKeys(keys: string[]) {
    this.keysStack.push(keys);
  }
  pushValues(values: any[] | undefined) {
    this.valuesStack.push(values);
  }
  popKeys() {
    return this.keysStack.pop();
  }
  popValues() {
    return this.valuesStack.pop();
  }
  peekKeys(depth?: number) {
    return this.keysStack.peek(depth);
  }
  peekValues(depth?: number) {
    return this.valuesStack.peek(depth);
  }
  paramIndex(name: string): [number, number] | null {
    const len = this.keysStack.length;
    for (let depth = 0; depth < len; depth++) {
      const blockParams = this.keysStack.peek(depth);
      const param = blockParams && indexOf(blockParams, name);
      if (blockParams && param >= 0) {
        return [depth, param];
      }
    }
    return null;
  }
  getByIndex(index: [number, number], path: string[] = []) {
    const obj = this.valuesStack.peek(index[0])?.[index[1]];
    return lookupPropertyByPath(obj, path);
  }
}
