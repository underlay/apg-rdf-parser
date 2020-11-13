import fs from "fs"
import { resolve } from "path"

import { fromSchema, schemaSchema } from "@underlay/apg"

import { parseSchemaString } from "../es6/parseSchema.js"
import { serializeString } from "../es6/serialize.js"
import { serializeSchemaString } from "../es6/serializeSchema.js"

test("Validate example schema serialization", () => {
	const file = fs.readFileSync(
		resolve(__dirname, "..", "examples", "example.schema.nq"),
		"utf-8"
	)

	const result = parseSchemaString(file)
	expect(result._tag).toBe("Right")

	if (result._tag === "Right") {
		const instance = fromSchema(result.right)
		const a = serializeString(instance, schemaSchema)
		const b = serializeSchemaString(result.right)
		expect(a === b).toBe(true)
	}
})

test("Validate schema schema serialization", () => {
	const file = fs.readFileSync(
		resolve(__dirname, "..", "examples", "schema.schema.nq"),
		"utf-8"
	)

	const result = parseSchemaString(file)
	expect(result._tag).toBe("Right")

	if (result._tag === "Right") {
		const instance = fromSchema(result.right)
		const a = serializeString(instance, schemaSchema)
		const b = serializeSchemaString(result.right)
		expect(a === b).toBe(true)
	}
})
