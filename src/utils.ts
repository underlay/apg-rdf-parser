import { NamedNode, BlankNode, Literal, rdf, xsd } from "n3.ts"

import { APG } from "apg"

import ShExParser from "@shexjs/parser"
import {
	EachOfSolutions,
	OneOfSolutions,
	TripleConstraintSolutions,
	TestedTriple,
	SuccessResult,
} from "@shexjs/validator"

const xsdString = new NamedNode(xsd.string)
const rdfLangString = new NamedNode(rdf.langString)

export function signalInvalidType(type: never): never {
	console.error(type)
	throw new Error("Invalid type")
}

export const getBlankNodeId = (
	type: APG.Type,
	typeCache: Map<Exclude<APG.Type, APG.Reference>, string>
): string =>
	type.type === "reference" ? `_:l${type.value}` : typeCache.get(type)!

type Iterate<E> = E extends Iterable<any>[]
	? { [k in keyof E]: E[k] extends Iterable<infer T> ? T : E[k] }
	: never

export const zip = <E extends Iterable<any>[]>(
	...args: E
): Iterable<[...Iterate<E>, number]> => ({
	[Symbol.iterator]() {
		const iterators = args.map((arg) => arg[Symbol.iterator]())
		let i = 0
		return {
			next() {
				const results = iterators.map((iter) => iter.next())
				if (results.some(({ done }) => done)) {
					return { done: true, value: undefined }
				} else {
					const values = results.map(({ value }) => value) as Iterate<E>
					return { done: false, value: [...values, i++] }
				}
			},
		}
	},
})

export function parseObjectValue(object: ShExParser.objectValue) {
	if (typeof object === "string") {
		if (object.startsWith("_:")) {
			return new BlankNode(object.slice(2))
		} else {
			return new NamedNode(object)
		}
	} else if (object.language) {
		return new Literal(object.value, object.language, rdfLangString)
	} else {
		const datatype =
			object.type === undefined ? xsdString : new NamedNode(object.type)
		return new Literal(object.value, "", datatype)
	}
}

export interface anyType
	extends ShExParser.TripleConstraint<typeof rdf.type, undefined> {
	min: 0
	max: -1
}

export const anyType: anyType = {
	type: "TripleConstraint",
	predicate: rdf.type,
	min: 0,
	max: -1,
}

export function isAnyType(
	tripleExpr: ShExParser.tripleExpr
): tripleExpr is anyType {
	return (
		typeof tripleExpr !== "string" &&
		tripleExpr.type === "TripleConstraint" &&
		tripleExpr.predicate === rdf.type &&
		tripleExpr.min === 0 &&
		tripleExpr.max === -1 &&
		tripleExpr.valueExpr === undefined
	)
}

export type anyTypeResult = {
	type: "TripleConstraintSolutions"
	predicate: typeof rdf.type
	solutions: anyTypeTripleResult[]
}

export function isAnyTypeResult(
	solutions: EachOfSolutions | OneOfSolutions | TripleConstraintSolutions
): solutions is anyTypeResult {
	return (
		solutions.type === "TripleConstraintSolutions" &&
		solutions.predicate === rdf.type &&
		solutions.solutions.every(isAnyTypeTripleResult)
	)
}

type anyTypeTripleResult = {
	type: "TestedTriple"
	subject: string
	predicate: typeof rdf.type
	object: string
}

function isAnyTypeTripleResult(
	triple: TestedTriple
): triple is anyTypeTripleResult {
	return (
		triple.predicate === rdf.type &&
		triple.referenced === undefined &&
		typeof triple.object === "string"
	)
}

export const isNodeConstraint = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is { type: "NodeConstraint"; nodeKind: "bnode" | "iri" } =>
	typeof shapeExpr !== "string" &&
	shapeExpr.type === "NodeConstraint" &&
	shapeExpr.hasOwnProperty("nodeKind")

export type BlankNodeConstraint = { type: "NodeConstraint"; nodeKind: "bnode" }
export const blankNodeConstraint: BlankNodeConstraint = {
	type: "NodeConstraint",
	nodeKind: "bnode",
}

export const isBlankNodeConstraint = (
	shapeExpr: ShExParser.shapeExpr
): shapeExpr is BlankNodeConstraint =>
	isNodeConstraint(shapeExpr) && shapeExpr.nodeKind === "bnode"

export type BlankNodeConstraintResult = {
	type: "NodeConstraintTest"
	node: string
	shape: string
	shapeExpr: BlankNodeConstraint
}

export function isBlankNodeConstraintResult(
	result: SuccessResult
): result is BlankNodeConstraintResult {
	return (
		result.type === "NodeConstraintTest" &&
		isBlankNodeConstraint(result.shapeExpr)
	)
}

export function getCaches(
	schema: APG.Schema
): [Map<Exclude<APG.Type, APG.Reference>, string>, Map<string, string[]>] {
	const typeCache: Map<Exclude<APG.Type, APG.Reference>, string> = new Map()
	const keyCache: Map<string, string[]> = new Map()
	schema.reduce((i, { value }) => cacheType(i, value, typeCache, keyCache), 0)
	return [typeCache, keyCache]
}

function cacheType(
	i: number,
	type: APG.Type,
	typeCache: Map<Exclude<APG.Type, APG.Reference>, string>,
	keyCache: Map<string, string[]>
): number {
	if (type.type === "reference") {
		return i
	} else if (typeCache.has(type)) {
		return i
	} else if (type.type === "unit") {
		if (!typeCache.has(type)) {
			typeCache.set(type, `_:t${i++}`)
		}
		return i
	} else if (type.type === "iri") {
		if (!typeCache.has(type)) {
			typeCache.set(type, `_:t${i++}`)
		}
		return i
	} else if (type.type === "literal") {
		if (!typeCache.has(type)) {
			typeCache.set(type, `_:t${i++}`)
		}
		return i
	} else if (type.type === "product") {
		if (typeCache.has(type)) {
			return i
		}
		const id = `_:t${i++}`
		typeCache.set(type, id)
		const keys = type.components.map(({ key }) => key).sort()
		Object.freeze(keys)
		keyCache.set(id, keys)
		return type.components.reduce(
			(i, { value }) => cacheType(i, value, typeCache, keyCache),
			i
		)
	} else if (type.type === "coproduct") {
		if (typeCache.has(type)) {
			return i
		}
		const id = `_:t${i++}`
		typeCache.set(type, id)
		const keys = type.options.map(({ key }) => key).sort()
		Object.freeze(keys)
		keyCache.set(id, keys)
		return type.options.reduce(
			(i, { value }) => cacheType(i, value, typeCache, keyCache),
			i
		)
	} else {
		signalInvalidType(type)
	}
}
