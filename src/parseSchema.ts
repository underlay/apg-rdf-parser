import * as N3 from "n3.ts"

import { Either } from "fp-ts/Either"

import { APG, ns, schemaSchema } from "apg"

import { FailureResult } from "@shexjs/validator"

import { parse } from "./parse.js"

export function parseSchemaString(
	input: string
): Either<FailureResult, APG.Schema> {
	const store = new N3.Store(N3.Parse(input))
	return parseSchema(store)
}

export function parseSchema(
	store: N3.Store
): Either<FailureResult, APG.Schema> {
	const result = parse(store, schemaSchema)
	if (result._tag === "Left") {
		return result
	}

	const database = new Map(
		schemaSchema.map((label, index) => [label.key, result.right[index]])
	)

	const labels = database.get(ns.label) as APG.Record[]
	const components = database.get(ns.component) as APG.Record[]
	const options = database.get(ns.option) as APG.Record[]

	const componentSources = rotateTree(components, ns.source)
	const optionSources = rotateTree(options, ns.source)

	const typeCache = new Map(schemaSchema.map(({ key }) => [key, new Map()]))

	const sortedLabels = labels.slice().sort((a, b) => {
		const { value: A } = a.get(ns.key) as N3.NamedNode
		const { value: B } = b.get(ns.key) as N3.NamedNode
		return A < B ? -1 : B < A ? 1 : 0
	})

	const permutation = labels.map((label) => sortedLabels.indexOf(label))

	const schema: APG.Schema = sortedLabels.map((label) => {
		const { value: key } = label.get(ns.key) as N3.NamedNode<string>
		const target = label.get(ns.value) as APG.Variant
		const value = parseValue(
			target,
			database,
			typeCache,
			componentSources,
			optionSources,
			permutation
		)
		return Object.freeze({ type: "label", key, value })
	})

	Object.freeze(schema)

	return { _tag: "Right", right: schema }
}

function parseValue(
	value: APG.Variant,
	database: Map<string, APG.Value[]>,
	typeCache: Map<string, Map<number, APG.Type>>,
	componentSources: Map<number, APG.Record[]>,
	optionSources: Map<number, APG.Record[]>,
	permutation: number[]
): APG.Type {
	const { index } = value.value as APG.Pointer
	// const { index } = record.get(ns.value) as APG.Pointer
	const key = value.key
	const cache = typeCache.get(key)!
	if (cache.has(index)) {
		return cache.get(index)!
	} else if (key === ns.reference) {
		const reference = database.get(ns.reference)![index] as APG.Record
		return parseReference(index, reference, typeCache, permutation)
	} else if (key === ns.unit) {
		return parseUnit(index, typeCache)
	} else if (key === ns.iri) {
		return parseIri(index, typeCache)
	} else if (key === ns.literal) {
		const literal = database.get(ns.literal)![index] as APG.Record
		return parseLiteral(index, literal, typeCache)
	} else if (key === ns.product) {
		return parseProduct(
			index,
			database,
			typeCache,
			componentSources,
			optionSources,
			permutation
		)
	} else if (key === ns.coproduct) {
		return parseCoproduct(
			index,
			database,
			typeCache,
			componentSources,
			optionSources,
			permutation
		)
	} else {
		throw new Error(`Invalid value variant key ${key}`)
	}
}

function parseReference(
	index: number,
	value: APG.Record,
	typeCache: Map<string, Map<number, APG.Type>>,
	permutation: number[]
): APG.Reference {
	const target = value.get(ns.value)! as APG.Pointer
	const reference: APG.Reference = Object.freeze({
		type: "reference",
		value: permutation[target.index],
	})
	typeCache.get(ns.reference)!.set(index, reference)
	return reference
}

function parseUnit(
	index: number,
	typeCache: Map<string, Map<number, APG.Type>>
): APG.Unit {
	const unit: APG.Unit = Object.freeze({ type: "unit" })
	typeCache.get(ns.unit)!.set(index, unit)
	return unit
}

function parseIri(
	index: number,
	typeCache: Map<string, Map<number, APG.Type>>
): APG.Iri {
	const iri: APG.Iri = Object.freeze({ type: "iri" })
	typeCache.get(ns.iri)!.set(index, iri)
	return iri
}

function parseLiteral(
	index: number,
	value: APG.Record,
	typeCache: Map<string, Map<number, APG.Type>>
): APG.Literal {
	const { value: datatype } = value.get(ns.datatype) as N3.NamedNode
	const literal: APG.Literal = Object.freeze({ type: "literal", datatype })
	typeCache.get(ns.literal)!.set(index, literal)
	return literal
}

function parseProduct(
	index: number,
	database: Map<string, APG.Value[]>,
	typeCache: Map<string, Map<number, APG.Type>>,
	componentSources: Map<number, APG.Record[]>,
	optionSources: Map<number, APG.Record[]>,
	permutation: number[]
): APG.Product {
	const components: APG.Component[] = []

	for (const component of componentSources.get(index) || []) {
		const { value: key } = component.get(ns.key) as N3.NamedNode
		const value = parseValue(
			component.get(ns.value) as APG.Variant,
			database,
			typeCache,
			componentSources,
			optionSources,
			permutation
		)
		components.push({ type: "component", key, value })
	}

	Object.freeze(
		components.sort(({ key: a }, { key: b }) => (a < b ? -1 : b < a ? 1 : 0))
	)

	const product: APG.Product = Object.freeze({ type: "product", components })
	typeCache.get(ns.product)!.set(index, product)
	return product
}

function parseCoproduct(
	index: number,
	database: Map<string, APG.Value[]>,
	typeCache: Map<string, Map<number, APG.Type>>,
	componentSources: Map<number, APG.Record[]>,
	optionSources: Map<number, APG.Record[]>,
	permutation: number[]
): APG.Coproduct {
	const options: APG.Option[] = []

	for (const option of optionSources.get(index) || []) {
		const { value: key } = option.get(ns.key) as N3.NamedNode
		const value = parseValue(
			option.get(ns.value) as APG.Variant,
			database,
			typeCache,
			componentSources,
			optionSources,
			permutation
		)
		options.push({ type: "option", key, value })
	}

	Object.freeze(
		options.sort(({ key: a }, { key: b }) => (a < b ? -1 : b < a ? 1 : 0))
	)

	const coproduct: APG.Coproduct = Object.freeze({ type: "coproduct", options })
	typeCache.get(ns.coproduct)!.set(index, coproduct)
	return coproduct
}

function rotateTree(
	trees: APG.Record[],
	pivot: string
): Map<number, APG.Record[]> {
	const result: Map<number, APG.Record[]> = new Map()
	for (const tree of trees) {
		const value = tree.get(pivot)
		if (value === undefined || value.termType !== "Pointer") {
			throw new Error("Rotation failed because the value was not a pointer")
		}
		const trees = result.get(value.index)
		if (trees === undefined) {
			result.set(value.index, [tree])
		} else {
			trees.push(tree)
		}
	}
	return result
}