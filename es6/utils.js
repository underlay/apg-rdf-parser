import { NamedNode, BlankNode, Literal, rdf, xsd } from "n3.ts";
const xsdString = new NamedNode(xsd.string);
const rdfLangString = new NamedNode(rdf.langString);
export function signalInvalidType(type) {
    console.error(type);
    throw new Error("Invalid type");
}
export const getBlankNodeId = (type, typeCache) => type.type === "reference" ? `_:l${type.value}` : typeCache.get(type);
export function parseObjectValue(object) {
    if (typeof object === "string") {
        if (object.startsWith("_:")) {
            return new BlankNode(object.slice(2));
        }
        else {
            return new NamedNode(object);
        }
    }
    else if (object.language) {
        return new Literal(object.value, object.language, rdfLangString);
    }
    else {
        const datatype = object.type === undefined ? xsdString : new NamedNode(object.type);
        return new Literal(object.value, "", datatype);
    }
}
export const anyType = {
    type: "TripleConstraint",
    predicate: rdf.type,
    min: 0,
    max: -1,
};
export function isAnyType(tripleExpr) {
    return (typeof tripleExpr !== "string" &&
        tripleExpr.type === "TripleConstraint" &&
        tripleExpr.predicate === rdf.type &&
        tripleExpr.min === 0 &&
        tripleExpr.max === -1 &&
        tripleExpr.valueExpr === undefined);
}
export function isAnyTypeResult(solutions) {
    return (solutions.type === "TripleConstraintSolutions" &&
        solutions.predicate === rdf.type &&
        solutions.solutions.every(isAnyTypeTripleResult));
}
function isAnyTypeTripleResult(triple) {
    return (triple.predicate === rdf.type &&
        triple.referenced === undefined &&
        typeof triple.object === "string");
}
export const isNodeConstraint = (shapeExpr) => typeof shapeExpr !== "string" &&
    shapeExpr.type === "NodeConstraint" &&
    shapeExpr.hasOwnProperty("nodeKind");
export const blankNodeConstraint = {
    type: "NodeConstraint",
    nodeKind: "bnode",
};
export const isBlankNodeConstraint = (shapeExpr) => isNodeConstraint(shapeExpr) && shapeExpr.nodeKind === "bnode";
export function isBlankNodeConstraintResult(result) {
    return (result.type === "NodeConstraintTest" &&
        isBlankNodeConstraint(result.shapeExpr));
}
export function getCaches(schema) {
    const typeCache = new Map();
    const keyCache = new Map();
    schema.reduce((i, { value }) => cacheType(i, value, typeCache, keyCache), 0);
    return [typeCache, keyCache];
}
function cacheType(i, type, typeCache, keyCache) {
    if (type.type === "reference") {
        return i;
    }
    else if (typeCache.has(type)) {
        return i;
    }
    else if (type.type === "unit") {
        if (!typeCache.has(type)) {
            typeCache.set(type, `_:t${i++}`);
        }
        return i;
    }
    else if (type.type === "iri") {
        if (!typeCache.has(type)) {
            typeCache.set(type, `_:t${i++}`);
        }
        return i;
    }
    else if (type.type === "literal") {
        if (!typeCache.has(type)) {
            typeCache.set(type, `_:t${i++}`);
        }
        return i;
    }
    else if (type.type === "product") {
        if (typeCache.has(type)) {
            return i;
        }
        const id = `_:t${i++}`;
        typeCache.set(type, id);
        const keys = type.components.map(({ key }) => key).sort();
        Object.freeze(keys);
        keyCache.set(id, keys);
        return type.components.reduce((i, { value }) => cacheType(i, value, typeCache, keyCache), i);
    }
    else if (type.type === "coproduct") {
        if (typeCache.has(type)) {
            return i;
        }
        const id = `_:t${i++}`;
        typeCache.set(type, id);
        const keys = type.options.map(({ key }) => key).sort();
        Object.freeze(keys);
        keyCache.set(id, keys);
        return type.options.reduce((i, { value }) => cacheType(i, value, typeCache, keyCache), i);
    }
    else {
        signalInvalidType(type);
    }
}
//# sourceMappingURL=utils.js.map