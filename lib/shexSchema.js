"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeShExSchema = makeShExSchema;

var _unit = require("./unit.js");

var _iri = require("./iri.js");

var _label = require("./label.js");

var _literal = require("./literal.js");

var _product = require("./product.js");

var _coproduct = require("./coproduct.js");

var _utils = require("./utils.js");

function makeShExSchema(typeCache, schema) {
  const shapes = [];

  for (const [type, id] of typeCache) {
    shapes.push(makeShapeExpr(id, type, typeCache));
  }

  for (const [index, label] of schema.entries()) {
    shapes.push((0, _label.makeLabelShape)(`_:l${index}`, label, typeCache));
  }

  return {
    type: "Schema",
    shapes
  };
}

function makeShapeExpr(id, type, typeCache) {
  if (type.type === "unit") {
    return (0, _unit.makeUnitShape)(id, type);
  } else if (type.type === "iri") {
    return (0, _iri.makeIriShape)(id, type);
  } else if (type.type === "literal") {
    return (0, _literal.makeLiteralShape)(id, type);
  } else if (type.type === "product") {
    return (0, _product.makeProductShape)(id, type, typeCache);
  } else if (type.type === "coproduct") {
    return (0, _coproduct.makeCoproductShape)(id, type, typeCache);
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}