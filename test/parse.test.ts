import fs from "fs"
import { resolve } from "path"
import { Quad } from "rdf-canonize"
import canonize from "rdf-canonize"

import { schemaSchema } from "@underlay/apg"

import { parseString } from "../es6/parse.js"
import { parseSchemaString } from "../es6/parseSchema.js"
import { serialize } from "../es6/serialize.js"
import { serializeSchemaString } from "../es6/serializeSchema.js"

test("Parse example schema as schema instance", () => {
	const file = fs.readFileSync(
		resolve(__dirname, "..", "examples", "example.schema.nq"),
		"utf-8"
	)
	const result = parseString(file, schemaSchema)
	expect(result._tag).toBe("Right")
})

test("Parse example schema", () => {
	const file = fs.readFileSync(
		resolve(__dirname, "..", "examples", "example.schema.nq"),
		"utf-8"
	)
	const result = parseSchemaString(file)
	expect(result._tag).toBe("Right")
})

test("Parse example instance", () => {
	const schemaFile = fs.readFileSync(
		resolve(__dirname, "..", "examples", "example.schema.nq"),
		"utf-8"
	)
	const schemaResult = parseSchemaString(schemaFile)
	expect(schemaResult._tag).toBe("Right")
	if (schemaResult._tag === "Right") {
		const instanceFile = fs.readFileSync(
			resolve(__dirname, "..", "examples", "example.instance.nq"),
			"utf-8"
		)
		const instanceResult = parseString(instanceFile, schemaResult.right)
		expect(instanceResult._tag).toBe("Right")
	}
})

test("Parse schema schema as schema instance", () => {
	const file = fs.readFileSync(
		resolve(__dirname, "..", "examples", "schema.schema.nq"),
		"utf-8"
	)
	const result = parseString(file, schemaSchema)
	expect(result._tag).toBe("Right")
})

test("Parse schema schema", () => {
	const file = fs.readFileSync(
		resolve(__dirname, "..", "examples", "schema.schema.nq"),
		"utf-8"
	)
	const result = parseSchemaString(file)
	expect(result._tag).toBe("Right")
})

test("Round trip example schema", () => {
	const a = fs.readFileSync(
		resolve(__dirname, "..", "examples", "example.schema.nq"),
		"utf-8"
	)

	const result = parseSchemaString(a)
	expect(result._tag).toBe("Right")
	if (result._tag === "Right") {
		const b = serializeSchemaString(result.right)
		expect(a === b).toBe(true)
	}
})

test("Round trip schema schema", () => {
	const a = fs.readFileSync(
		resolve(__dirname, "..", "examples", "schema.schema.nq"),
		"utf-8"
	)

	const result = parseSchemaString(a)
	expect(result._tag).toBe("Right")
	if (result._tag === "Right") {
		const b = serializeSchemaString(result.right)
		expect(a === b).toBe(true)
	}
})

test("Round trip example instance", () => {
	const schemaFile = fs.readFileSync(
		resolve(__dirname, "..", "examples", "example.schema.nq"),
		"utf-8"
	)
	const schemaResult = parseSchemaString(schemaFile)
	expect(schemaResult._tag).toBe("Right")
	if (schemaResult._tag === "Right") {
		const file = fs.readFileSync(
			resolve(__dirname, "..", "examples", "example.instance.nq"),
			"utf-8"
		)

		const result = parseString(file, schemaResult.right)
		expect(result._tag).toBe("Right")
		if (result._tag === "Right") {
			const quads: Quad[] = []
			for (const quad of serialize(result.right, schemaResult.right)) {
				quads.push(quad.toJSON())
			}

			const dataset = canonize.canonizeSync(quads, { algorithm: "URDNA2015" })

			expect(dataset === file).toBe(true)
		}
	}
})

test("Round trip example schema as schema instance", () => {
	const schemaFile = fs.readFileSync(
		resolve(__dirname, "..", "examples", "schema.schema.nq"),
		"utf-8"
	)
	const schemaResult = parseSchemaString(schemaFile)
	expect(schemaResult._tag).toBe("Right")
	if (schemaResult._tag === "Right") {
		const file = fs.readFileSync(
			resolve(__dirname, "..", "examples", "example.schema.nq"),
			"utf-8"
		)

		const result = parseString(file, schemaResult.right)
		expect(result._tag).toBe("Right")
		if (result._tag === "Right") {
			const quads: Quad[] = []
			for (const quad of serialize(result.right, schemaResult.right)) {
				quads.push(quad.toJSON())
			}

			const dataset = canonize.canonizeSync(quads, { algorithm: "URDNA2015" })

			expect(dataset === file).toBe(true)
		}
	}
})

test("Round trip schema schema as schema instance", () => {
	const schemaFile = fs.readFileSync(
		resolve(__dirname, "..", "examples", "schema.schema.nq"),
		"utf-8"
	)
	const schemaResult = parseSchemaString(schemaFile)
	expect(schemaResult._tag).toBe("Right")
	if (schemaResult._tag === "Right") {
		const file = fs.readFileSync(
			resolve(__dirname, "..", "examples", "schema.schema.nq"),
			"utf-8"
		)

		const result = parseString(file, schemaResult.right)
		expect(result._tag).toBe("Right")
		if (result._tag === "Right") {
			const quads: Quad[] = []
			for (const quad of serialize(result.right, schemaResult.right)) {
				quads.push(quad.toJSON())
			}

			const dataset = canonize.canonizeSync(quads, { algorithm: "URDNA2015" })

			expect(dataset === file).toBe(true)
		}
	}
})
