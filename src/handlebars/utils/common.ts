import { ProtoAccessControl, resultIsAllowed } from "./proto-access";

export function lookupProperty(parent, propertyName, protoAccessControl) {
  const result = parent?.[propertyName];
  if (result == null) {
    return result;
  }
  if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
    return result;
  }

  if (resultIsAllowed(result, protoAccessControl, propertyName)) {
    return result;
  }
  return undefined;
}

export function lookupPropertyByPath(obj: Record<string, any>, path: string[], protoAccessControl?: ProtoAccessControl) {
  let temp = obj;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    const current = lookupProperty(temp, key, protoAccessControl);
    if (current === undefined) {
      return undefined;
    }
    temp = current;
  }
  return temp;
}