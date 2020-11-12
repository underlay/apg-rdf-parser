"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signalInvalidType = signalInvalidType;
exports.parseObjectValue = parseObjectValue;
exports.isAnyType = isAnyType;
exports.isAnyTypeResult = isAnyTypeResult;
exports.isBlankNodeConstraintResult = isBlankNodeConstraintResult;
exports.getCaches = getCaches;
exports.isBlankNodeConstraint = exports.blankNodeConstraint = exports.isNodeConstraint = exports.anyType = exports.zip = exports.getBlankNodeId = void 0;

var _n = require("n3.ts");

const xsdString = new _n.NamedNode(_n.xsd.string);
const rdfLangString = new _n.NamedNode(_n.rdf.langString);

function signalInvalidType(type) {
  console.error(type);
  throw new Error("Invalid type");
}

const getBlankNodeId = (type, typeCache) => type.type === "reference" ? `_:l${type.value}` : typeCache.get(type);

exports.getBlankNodeId = getBlankNodeId;

const zip = (...args) => ({
  [Symbol.iterator]() {
    const iterators = args.map(arg => arg[Symbol.iterator]());
    let i = 0;
    return {
      next() {
        const results = iterators.map(iter => iter.next());

        if (results.some(({
          done
        }) => done)) {
          return {
            done: true,
            value: undefined
          };
        } else {
          const values = results.map(({
            value
          }) => value);
          return {
            done: false,
            value: [...values, i++]
          };
        }
      }

    };
  }

});

exports.zip = zip;

function parseObjectValue(object) {
  if (typeof object === "string") {
    if (object.startsWith("_:")) {
      return new _n.BlankNode(object.slice(2));
    } else {
      return new _n.NamedNode(object);
    }
  } else if (object.language) {
    return new _n.Literal(object.value, object.language, rdfLangString);
  } else {
    const datatype = object.type === undefined ? xsdString : new _n.NamedNode(object.type);
    return new _n.Literal(object.value, "", datatype);
  }
}

const anyType = {
  type: "TripleConstraint",
  predicate: _n.rdf.type,
  min: 0,
  max: -1
};
exports.anyType = anyType;

function isAnyType(tripleExpr) {
  return typeof tripleExpr !== "string" && tripleExpr.type === "TripleConstraint" && tripleExpr.predicate === _n.rdf.type && tripleExpr.min === 0 && tripleExpr.max === -1 && tripleExpr.valueExpr === undefined;
}

function isAnyTypeResult(solutions) {
  return solutions.type === "TripleConstraintSolutions" && solutions.predicate === _n.rdf.type && solutions.solutions.every(isAnyTypeTripleResult);
}

function isAnyTypeTripleResult(triple) {
  return triple.predicate === _n.rdf.type && triple.referenced === undefined && typeof triple.object === "string";
}

const isNodeConstraint = shapeExpr => typeof shapeExpr !== "string" && shapeExpr.type === "NodeConstraint" && shapeExpr.hasOwnProperty("nodeKind");

exports.isNodeConstraint = isNodeConstraint;
const blankNodeConstraint = {
  type: "NodeConstraint",
  nodeKind: "bnode"
};
exports.blankNodeConstraint = blankNodeConstraint;

const isBlankNodeConstraint = shapeExpr => isNodeConstraint(shapeExpr) && shapeExpr.nodeKind === "bnode";

exports.isBlankNodeConstraint = isBlankNodeConstraint;

function isBlankNodeConstraintResult(result) {
  return result.type === "NodeConstraintTest" && isBlankNodeConstraint(result.shapeExpr);
}

function getCaches(schema) {
  const typeCache = new Map();
  const keyCache = new Map();
  schema.reduce((i, {
    value
  }) => cacheType(i, value, typeCache, keyCache), 0);
  return [typeCache, keyCache];
}

function cacheType(i, type, typeCache, keyCache) {
  if (type.type === "reference") {
    return i;
  } else if (typeCache.has(type)) {
    return i;
  } else if (type.type === "unit") {
    if (!typeCache.has(type)) {
      typeCache.set(type, `_:t${i++}`);
    }

    return i;
  } else if (type.type === "iri") {
    if (!typeCache.has(type)) {
      typeCache.set(type, `_:t${i++}`);
    }

    return i;
  } else if (type.type === "literal") {
    if (!typeCache.has(type)) {
      typeCache.set(type, `_:t${i++}`);
    }

    return i;
  } else if (type.type === "product") {
    if (typeCache.has(type)) {
      return i;
    }

    const id = `_:t${i++}`;
    typeCache.set(type, id);
    const keys = type.components.map(({
      key
    }) => key).sort();
    Object.freeze(keys);
    keyCache.set(id, keys);
    return type.components.reduce((i, {
      value
    }) => cacheType(i, value, typeCache, keyCache), i);
  } else if (type.type === "coproduct") {
    if (typeCache.has(type)) {
      return i;
    }

    const id = `_:t${i++}`;
    typeCache.set(type, id);
    const keys = type.options.map(({
      key
    }) => key).sort();
    Object.freeze(keys);
    keyCache.set(id, keys);
    return type.options.reduce((i, {
      value
    }) => cacheType(i, value, typeCache, keyCache), i);
  } else {
    signalInvalidType(type);
  }
}