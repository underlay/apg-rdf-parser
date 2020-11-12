"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseString = parseString;
exports.parse = parse;

var _n = require("n3.ts");

var _uuid = require("uuid");

var _util = _interopRequireDefault(require("@shexjs/util"));

var _validator = _interopRequireDefault(require("@shexjs/validator"));

var _apg = require("apg");

var _shexSchema = require("./shexSchema.js");

var _unit = require("./unit.js");

var _iri = require("./iri.js");

var _label = require("./label.js");

var _literal = require("./literal.js");

var _product = require("./product.js");

var _coproduct = require("./coproduct.js");

var _utils = require("./utils.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const rdfType = new _n.NamedNode(_n.rdf.type);

function parseString(input, schema) {
  const store = new _n.Store((0, _n.Parse)(input));
  return parse(store, schema);
}

function parse(store, schema) {
  const db = _util.default.rdfjsDB(store);

  const [typeCache, keyCache] = (0, _utils.getCaches)(schema);
  const shexSchema = (0, _shexSchema.makeShExSchema)(typeCache, schema);

  const validator = _validator.default.construct(shexSchema, db, {});

  const state = Object.freeze({
    schema,
    typeCache,
    instance: new Array(schema.length).fill(null).map(() => []),
    elementCache: new Array(schema.length).fill(null).map(() => new Map()),
    keyCache,
    stack: []
  });

  for (const [label, cache, index] of (0, _utils.zip)(schema, state.elementCache)) {
    const shape = `_:l${index}`;
    const subjects = store.subjects(rdfType, new _n.NamedNode(label.key), null);

    for (const subject of subjects) {
      if (subject.termType === "BlankNode") {
        if (cache.has(subject.value)) {
          continue;
        }

        const result = validator.validate(subject.id, shape);

        if (isFailure(result)) {
          return {
            _tag: "Left",
            left: result
          };
        } // This reference is "synthetic" - just a way to parse a root
        // label by pretending that we're starting with a reference to it.


        const reference = Object.freeze({
          type: "reference",
          value: index
        }); // match is an Option<Pointer> that we won't actually use

        const match = parseResult(reference, subject, result, state);

        if (match._tag === "None") {
          const errors = [{
            message: "Subject failed parsing",
            node: subject.id,
            shape
          }];
          return {
            _tag: "Left",
            left: {
              type: "Failure",
              shape,
              node: subject.id,
              errors
            }
          };
        } // cache.set(subject.value, values.push(match.value) - 1)

      } else {
        return {
          _tag: "Left",
          left: {
            type: "Failure",
            shape,
            node: subject.id,
            errors: []
          }
        };
      }
    }
  }

  return {
    _tag: "Right",
    right: state.instance
  };
}

function isFailure(result) {
  return result.type === "Failure" || result.type === "ShapeAndFailure" || result.type === "ShapeOrFailure" || result.type === "ShapeNotFailure";
}

function parseResult(type, node, result, state) {
  // References are never cached
  if (type.type === "reference") {
    return parseReferenceResult(type.value, node, result, state);
  } else {
    const id = state.typeCache.get(type);

    if (id === undefined) {
      throw new Error("No id for type");
    }

    return parseTypeResult(id, type, node, result, state);
  }
}

const tokenRoot = (0, _uuid.v4)();

function parseReferenceResult(index, node, result, state) {
  const id = `_:l${index}`;
  const label = state.schema[index];

  if ((0, _label.isLabelResult)(result, id, label.key)) {
    if (node.termType === "BlankNode") {
      const cache = state.elementCache[index].get(node.value);

      if (cache !== undefined) {
        return {
          _tag: "Some",
          value: new _apg.APG.Pointer(cache, index)
        };
      }

      const nextResult = (0, _label.parseLabelResult)(result);
      const l = state.stack.length;
      const token = {
        node,
        shape: id,
        used: false
      };
      state.stack.push(token);
      const match = parseResult(label.value, node, nextResult, state);
      state.stack.pop();

      if (match._tag === "None") {
        return match;
      } else {
        const pointer = state.instance[index].length;
        const value = token.used ? replaceTokenValue(new _apg.APG.Pointer(pointer, index), match.value, `urn:uuid:${tokenRoot}#${l}`) : match.value;
        state.instance[index].push(value);
        state.elementCache[index].set(node.value, pointer);
        return {
          _tag: "Some",
          value: new _apg.APG.Pointer(pointer, index)
        };
      }
    } else {
      throw new Error("Invalid result for reference type");
    }
  } else if (result.type === "Recursion" && result.shape === id) {
    const index = state.stack.findIndex(token => node.equals(token.node) && token.shape === id);

    if (index === -1) {
      throw new Error("Unexpected recursion result");
    } else {
      state.stack[index].used = true;
      const value = new _n.NamedNode(`urn:uuid:${tokenRoot}#${index}`);
      return {
        _tag: "Some",
        value: value
      };
    }
  } else {
    return {
      _tag: "None"
    };
  }
}

function replaceTokenValue(pointer, value, uri) {
  if (value.termType === "Record") {
    return new _apg.APG.Record(value.node, value.componentKeys, Array.from(replaceLeaves(pointer, value, uri)));
  } else if (value.termType === "Variant") {
    return new _apg.APG.Variant(value.node, value.optionKeys, value.index, replaceTokenValue(pointer, value.value, uri));
  } else if (value.termType === "NamedNode" && value.value === uri) {
    return pointer;
  } else {
    return value;
  }
}

function* replaceLeaves(pointer, product, uri) {
  for (const leaf of product) {
    yield replaceTokenValue(pointer, leaf, uri);
  }
}

function parseTypeResult(id, type, node, result, state) {
  if (type.type === "unit") {
    if ((0, _unit.isUnitResult)(result, id)) {
      if (node.termType === "BlankNode") {
        return {
          _tag: "Some",
          value: node
        };
      } else {
        throw new Error("Invalid result for unit type");
      }
    } else {
      return {
        _tag: "None"
      };
    }
  } else if (type.type === "literal") {
    if ((0, _literal.isLiteralResult)(result, id)) {
      if (node.termType === "Literal") {
        return {
          _tag: "Some",
          value: node
        };
      } else {
        throw new Error("Invalid result for literal type");
      }
    } else {
      return {
        _tag: "None"
      };
    }
  } else if (type.type === "iri") {
    if ((0, _iri.isIriResult)(result, id)) {
      if (node.termType === "NamedNode") {
        return {
          _tag: "Some",
          value: node
        };
      } else {
        throw new Error("Invalid result for iri type");
      }
    } else {
      return {
        _tag: "None"
      };
    }
  } else if (type.type === "product") {
    if ((0, _product.isProductResult)(result, id)) {
      if (node.termType === "BlankNode") {
        const solutions = (0, _product.parseProductResult)(result);

        if (type.components.length !== solutions.length) {
          throw new Error("Invalid product result");
        }

        const componentKeys = state.keyCache.get(id);

        if (componentKeys === undefined) {
          throw new Error(`Could not find keys for product ${id}`);
        }

        const components = new Array(solutions.length);
        const iter = (0, _utils.zip)(type.components, solutions);

        for (const [component, solution, index] of iter) {
          const componentId = `${id}-c${index}`;

          if (componentId !== solution.productionLabel) {
            throw new Error("Invalid component result");
          }

          const {
            valueExpr,
            solutions: [{
              object: objectValue,
              referenced: ref
            }]
          } = solution;
          const object = (0, _utils.parseObjectValue)(objectValue);
          const componentValueId = (0, _utils.getBlankNodeId)(component.value, state.typeCache);

          if (ref !== undefined && valueExpr === componentValueId) {
            const match = parseResult(component.value, object, ref, state);

            if (match._tag === "None") {
              return match;
            } else {
              components[index] = match.value;
            }
          } else {
            throw new Error("Invalid component result");
          }
        }

        return {
          _tag: "Some",
          value: new _apg.APG.Record(node, componentKeys, components)
        };
      } else {
        throw new Error("Invalid result for product type");
      }
    } else {
      return {
        _tag: "None"
      };
    }
  } else if (type.type === "coproduct") {
    if ((0, _coproduct.isCoproductResult)(result, id)) {
      if (node.termType === "BlankNode") {
        const optionKeys = state.keyCache.get(id);

        if (optionKeys === undefined) {
          throw new Error(`Could not find keys for coproduct ${id}`);
        }

        const optionResult = (0, _coproduct.parseCoproductResult)(result);
        const optionId = optionResult.productionLabel;

        if (!optionId.startsWith(id)) {
          throw new Error(`Invalid option id ${optionId}`);
        }

        const tail = optionId.slice(id.length);
        const tailMatch = optionIdTailPattern.exec(tail);

        if (tailMatch === null) {
          throw new Error(`Invalid option id ${optionId}`);
        }

        const [{}, indexId] = tailMatch;
        const index = parseInt(indexId);

        if (isNaN(index) || index >= type.options.length) {
          throw new Error(`Invalid option id ${optionId}`);
        }

        const option = type.options[index];
        const {
          valueExpr,
          solutions: [{
            object: objectValue,
            referenced: ref
          }]
        } = optionResult;
        const object = (0, _utils.parseObjectValue)(objectValue);
        const optionValueId = (0, _utils.getBlankNodeId)(option.value, state.typeCache);

        if (ref !== undefined && valueExpr === optionValueId) {
          const match = parseResult(option.value, object, ref, state);

          if (match._tag === "None") {
            return match;
          } else {
            const value = new _apg.APG.Variant(node, optionKeys, index, match.value);
            return {
              _tag: "Some",
              value
            };
          }
        } else {
          throw new Error("Invalid option result");
        }
      } else {
        throw new Error("Invalid result for coproduct type");
      }
    } else {
      return {
        _tag: "None"
      };
    }
  } else {
    (0, _utils.signalInvalidType)(type);
  }
}

const optionIdTailPattern = /^-o(\d+)$/;