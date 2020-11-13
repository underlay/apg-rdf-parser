import * as N3 from "n3.ts";
import { APG } from "@underlay/apg";
export declare function serializeSchemaString(schema: APG.Schema): string;
export declare function serializeSchema(schema: APG.Schema): Generator<N3.Quad, void, undefined>;
