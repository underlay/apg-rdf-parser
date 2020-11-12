import { makeUnitShape } from "./unit.js";
import { makeIriShape } from "./iri.js";
import { makeLabelShape } from "./label.js";
import { makeLiteralShape } from "./literal.js";
import { makeProductShape } from "./product.js";
import { makeCoproductShape } from "./coproduct.js";
import { signalInvalidType } from "./utils.js";
export function makeShExSchema(typeCache, schema) {
    const shapes = [];
    for (const [type, id] of typeCache) {
        shapes.push(makeShapeExpr(id, type, typeCache));
    }
    for (const [index, label] of schema.entries()) {
        shapes.push(makeLabelShape(`_:l${index}`, label, typeCache));
    }
    return { type: "Schema", shapes };
}
function makeShapeExpr(id, type, typeCache) {
    if (type.type === "unit") {
        return makeUnitShape(id, type);
    }
    else if (type.type === "iri") {
        return makeIriShape(id, type);
    }
    else if (type.type === "literal") {
        return makeLiteralShape(id, type);
    }
    else if (type.type === "product") {
        return makeProductShape(id, type, typeCache);
    }
    else if (type.type === "coproduct") {
        return makeCoproductShape(id, type, typeCache);
    }
    else {
        signalInvalidType(type);
    }
}
//# sourceMappingURL=shexSchema.js.map