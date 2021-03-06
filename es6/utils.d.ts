/// <reference types="shexjs" />
import { NamedNode, BlankNode, Literal, rdf } from "n3.ts";
import { APG } from "@underlay/apg";
import ShExParser from "@shexjs/parser";
import { EachOfSolutions, OneOfSolutions, TripleConstraintSolutions, SuccessResult } from "@shexjs/validator";
export declare function signalInvalidType(type: never): never;
export declare const getBlankNodeId: (type: APG.Type, typeCache: Map<Exclude<APG.Type, APG.Reference>, string>) => string;
export declare function parseObjectValue(object: ShExParser.objectValue): BlankNode | NamedNode<string> | Literal<string>;
export interface anyType extends ShExParser.TripleConstraint<typeof rdf.type, undefined> {
    min: 0;
    max: -1;
}
export declare const anyType: anyType;
export declare function isAnyType(tripleExpr: ShExParser.tripleExpr): tripleExpr is anyType;
export declare type anyTypeResult = {
    type: "TripleConstraintSolutions";
    predicate: typeof rdf.type;
    solutions: anyTypeTripleResult[];
};
export declare function isAnyTypeResult(solutions: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions): solutions is anyTypeResult;
declare type anyTypeTripleResult = {
    type: "TestedTriple";
    subject: string;
    predicate: typeof rdf.type;
    object: string;
};
export declare const isNodeConstraint: (shapeExpr: ShExParser.shapeExpr) => shapeExpr is {
    type: "NodeConstraint";
    nodeKind: "bnode" | "iri";
};
export declare type BlankNodeConstraint = {
    type: "NodeConstraint";
    nodeKind: "bnode";
};
export declare const blankNodeConstraint: BlankNodeConstraint;
export declare const isBlankNodeConstraint: (shapeExpr: ShExParser.shapeExpr) => shapeExpr is BlankNodeConstraint;
export declare type BlankNodeConstraintResult = {
    type: "NodeConstraintTest";
    node: string;
    shape: string;
    shapeExpr: BlankNodeConstraint;
};
export declare function isBlankNodeConstraintResult(result: SuccessResult): result is BlankNodeConstraintResult;
export declare function getCaches(schema: APG.Schema): [Map<Exclude<APG.Type, APG.Reference>, string>, Map<string, string[]>];
export {};
