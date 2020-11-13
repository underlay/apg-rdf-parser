"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseSchemaString = parseSchemaString;
exports.parseSchema = parseSchema;

var N3 = _interopRequireWildcard(require("n3.ts"));

var _apg = require("@underlay/apg");

var _parse = require("./parse.js");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function parseSchemaString(input) {
  const store = new N3.Store(N3.Parse(input));
  return parseSchema(store);
}

function parseSchema(store) {
  const result = (0, _parse.parse)(store, _apg.schemaSchema);

  if (result._tag === "Left") {
    return result;
  }

  const database = new Map(_apg.schemaSchema.map((label, index) => [label.key, result.right[index]]));
  const labels = database.get(_apg.ns.label);
  const components = database.get(_apg.ns.component);
  const options = database.get(_apg.ns.option);
  const componentSources = rotateTree(components, _apg.ns.source);
  const optionSources = rotateTree(options, _apg.ns.source);
  const typeCache = new Map(_apg.schemaSchema.map(({
    key
  }) => [key, new Map()]));
  const sortedLabels = labels.slice().sort((a, b) => {
    const {
      value: A
    } = a.get(_apg.ns.key);
    const {
      value: B
    } = b.get(_apg.ns.key);
    return A < B ? -1 : B < A ? 1 : 0;
  });
  const permutation = labels.map(label => sortedLabels.indexOf(label));
  const schema = sortedLabels.map(label => {
    const {
      value: key
    } = label.get(_apg.ns.key);
    const target = label.get(_apg.ns.value);
    const value = parseValue(target, database, typeCache, componentSources, optionSources, permutation);
    return Object.freeze({
      type: "label",
      key,
      value
    });
  });
  Object.freeze(schema);
  return {
    _tag: "Right",
    right: schema
  };
}

function parseValue(value, database, typeCache, componentSources, optionSources, permutation) {
  const {
    index
  } = value.value; // const { index } = record.get(ns.value) as APG.Pointer

  const key = value.key;
  const cache = typeCache.get(key);

  if (cache.has(index)) {
    return cache.get(index);
  } else if (key === _apg.ns.reference) {
    const reference = database.get(_apg.ns.reference)[index];
    return parseReference(index, reference, typeCache, permutation);
  } else if (key === _apg.ns.unit) {
    return parseUnit(index, typeCache);
  } else if (key === _apg.ns.iri) {
    return parseIri(index, typeCache);
  } else if (key === _apg.ns.literal) {
    const literal = database.get(_apg.ns.literal)[index];
    return parseLiteral(index, literal, typeCache);
  } else if (key === _apg.ns.product) {
    return parseProduct(index, database, typeCache, componentSources, optionSources, permutation);
  } else if (key === _apg.ns.coproduct) {
    return parseCoproduct(index, database, typeCache, componentSources, optionSources, permutation);
  } else {
    throw new Error(`Invalid value variant key ${key}`);
  }
}

function parseReference(index, value, typeCache, permutation) {
  const target = value.get(_apg.ns.value);
  const reference = Object.freeze({
    type: "reference",
    value: permutation[target.index]
  });
  typeCache.get(_apg.ns.reference).set(index, reference);
  return reference;
}

function parseUnit(index, typeCache) {
  const unit = Object.freeze({
    type: "unit"
  });
  typeCache.get(_apg.ns.unit).set(index, unit);
  return unit;
}

function parseIri(index, typeCache) {
  const iri = Object.freeze({
    type: "iri"
  });
  typeCache.get(_apg.ns.iri).set(index, iri);
  return iri;
}

function parseLiteral(index, value, typeCache) {
  const {
    value: datatype
  } = value.get(_apg.ns.datatype);
  const literal = Object.freeze({
    type: "literal",
    datatype
  });
  typeCache.get(_apg.ns.literal).set(index, literal);
  return literal;
}

function parseProduct(index, database, typeCache, componentSources, optionSources, permutation) {
  const components = [];

  for (const component of componentSources.get(index) || []) {
    const {
      value: key
    } = component.get(_apg.ns.key);
    const value = parseValue(component.get(_apg.ns.value), database, typeCache, componentSources, optionSources, permutation);
    components.push({
      type: "component",
      key,
      value
    });
  }

  Object.freeze(components.sort(({
    key: a
  }, {
    key: b
  }) => a < b ? -1 : b < a ? 1 : 0));
  const product = Object.freeze({
    type: "product",
    components
  });
  typeCache.get(_apg.ns.product).set(index, product);
  return product;
}

function parseCoproduct(index, database, typeCache, componentSources, optionSources, permutation) {
  const options = [];

  for (const option of optionSources.get(index) || []) {
    const {
      value: key
    } = option.get(_apg.ns.key);
    const value = parseValue(option.get(_apg.ns.value), database, typeCache, componentSources, optionSources, permutation);
    options.push({
      type: "option",
      key,
      value
    });
  }

  Object.freeze(options.sort(({
    key: a
  }, {
    key: b
  }) => a < b ? -1 : b < a ? 1 : 0));
  const coproduct = Object.freeze({
    type: "coproduct",
    options
  });
  typeCache.get(_apg.ns.coproduct).set(index, coproduct);
  return coproduct;
}

function rotateTree(trees, pivot) {
  const result = new Map();

  for (const tree of trees) {
    const value = tree.get(pivot);

    if (value === undefined || value.termType !== "Pointer") {
      throw new Error("Rotation failed because the value was not a pointer");
    }

    const trees = result.get(value.index);

    if (trees === undefined) {
      result.set(value.index, [tree]);
    } else {
      trees.push(tree);
    }
  }

  return result;
}