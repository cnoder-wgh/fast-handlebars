import { lookupProperty } from "../../utils/common";
import { ProtoAccessControl } from "../../utils/proto-access";
import { BlockParams } from "./block-params";
import { Context } from "./context";
import { Data } from "./data";

export class RenderContext {
  context: Context;
  data: Data;
  blockParams: BlockParams = new BlockParams();

  constructor(public protoAccessControl: ProtoAccessControl) {
    this.context = new Context(this.protoAccessControl);
    this.data = new Data();
    this.blockParams = new BlockParams();
  }

  lookupProperty(obj: Record<string, any>, field: string) {
    return lookupProperty(obj, field, this.protoAccessControl);
  }
}
