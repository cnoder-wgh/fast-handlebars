import { Handlebars } from "../..";
import { CompileOptions, RuntimeOptions, AST } from "../../interface";
import { createProtoAccessControl } from "../utils/proto-access";
import { RenderContext } from "./context";
import { NodeTransformer } from "./transformer";

export default class ASTRender {
  constructor(private ast: AST.Node, private handlebars: Handlebars, private compileOptions: CompileOptions) {}

  render(context: Record<string, any>, runtimeOptions: Partial<RuntimeOptions> = {}) {
    const protoAccessControl = createProtoAccessControl(runtimeOptions);
    const renderContext = new RenderContext(protoAccessControl);
    renderContext.context.push(context);
    renderContext.data.push({ root: context, ...(runtimeOptions.data && runtimeOptions.data) });
    runtimeOptions.blockParams && renderContext.blockParams.pushValues(runtimeOptions.blockParams);
    const transformer = new NodeTransformer(this.ast, this.handlebars, this.compileOptions, runtimeOptions, renderContext);
    return transformer.transform();
  }
}
