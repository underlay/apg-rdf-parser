import { APG } from "@underlay/apg"

import { SuccessResult } from "@shexjs/validator"
import ShExParser from "@shexjs/parser"

type literalShape = { id: string; type: "NodeConstraint"; datatype: string }
type patternLiteralShape = literalShape & { pattern: string; flags: string }
export type LiteralShape = literalShape | patternLiteralShape

export const isLiteralShape = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is LiteralShape =>
	typeof shapeExpr !== "string" &&
	shapeExpr.type === "NodeConstraint" &&
	shapeExpr.hasOwnProperty("datatype")

export type LiteralResult = {
	type: "NodeConstraintTest"
	node: string
	shape: string
	shapeExpr: LiteralShape
}

export function isLiteralResult(
	result: SuccessResult,
	id: string
): result is LiteralResult {
	return (
		result.type === "NodeConstraintTest" &&
		result.shape === id &&
		isLiteralShape(result.shapeExpr)
	)
}

export function makeLiteralShape(
	id: string,
	{ datatype }: APG.Literal
): LiteralShape {
	return { id, type: "NodeConstraint", datatype }
}
