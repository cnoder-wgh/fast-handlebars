import { Handlebars } from "./handlebars";
import VisitorClass from './handlebars/compiler/visitor';
import { IVisitor } from "./interface";
import * as Utils from './handlebars/utils';

const defaultHandlebars = new Handlebars();
export default defaultHandlebars;

export { Handlebars } from './handlebars';

export { parse } from './handlebars/compiler/base';
export const Visitor = VisitorClass as unknown as new () => IVisitor;

export const createFrame = Utils.createFrame;
export { SafeString } from './handlebars/safe-string';
