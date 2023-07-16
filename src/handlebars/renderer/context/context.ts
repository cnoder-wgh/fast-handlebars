import { lookupPropertyByPath } from "../../utils/common";
import { ProtoAccessControl } from "../../utils/proto-access";
import { Stack } from "../../utils/stack";

export class Context extends Stack {
  constructor(private protoAccessControl: ProtoAccessControl) {
    super();
  }

  getValue(keys: string[], depth = 0) {
    const context = this.peek(depth);
    if (!context) {
      return null;
    }
    return lookupPropertyByPath(context, keys, this.protoAccessControl);
  }
}
