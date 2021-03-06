/// <reference types="shexjs" />
import { APG } from "@underlay/apg";
import ShExParser from "@shexjs/parser";
import { SuccessResult } from "@shexjs/validator";
declare type iriShape = {
    id: string;
    type: "NodeConstraint";
    nodeKind: "iri";
};
declare type patternIriShape = iriShape & {
    pattern: string;
    flags: string;
};
export declare type IriShape = iriShape | patternIriShape;
export declare const isIriShape: (shapeExpr: ShExParser.shapeExpr) => shapeExpr is IriShape;
export declare type IriResult = {
    type: "NodeConstraintTest";
    node: string;
    shape: string;
    shapeExpr: IriShape;
};
export declare function isIriResult(result: SuccessResult, id: string): result is IriResult;
export declare function makeIriShape(id: string, {}: APG.Iri): IriShape;
export {};
