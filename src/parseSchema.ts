import * as N3 from "n3.ts"

import { Either } from "fp-ts/Either"

import { APG, schemaSchema, toSchema } from "@underlay/apg"

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

	return { _tag: "Right", right: toSchema(result.right) }
}
