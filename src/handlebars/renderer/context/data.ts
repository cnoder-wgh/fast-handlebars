import { lookupPropertyByPath } from "../../utils/common";
import { Stack } from "../../utils/stack";

export class Data extends Stack {
  getValue(keys: string[], depth = 0, stackDepth = 0) {
    let data = this.peek(stackDepth);
    while (data && depth--) {
      data = data._parent;
    }
    if (!data) {
      return null;
    }
    return lookupPropertyByPath(data, keys);
  }
}
