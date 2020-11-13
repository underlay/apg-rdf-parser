import * as N3 from "n3.ts";
import { APG } from "@underlay/apg";
export declare function serializeString(instance: APG.Instance, schema: APG.Schema): string;
export declare function serialize(instance: APG.Instance, schema: APG.Schema): Generator<N3.Quad, void, undefined>;
